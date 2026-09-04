import { supabase } from "../lib/supabase";
import type {
  ApprovalProgress,
  ChangeApproval,
  ChangeOpsMember,
  ChangeOpsOrganizationOption,
  ChangeOpsRole,
  ChangeOpsUserContext,
  ChangeRequest,
  ChangeSummary,
  AuditEvent,
} from "../types/change";

type DbChange = Record<string, unknown>;
type DbAudit = Record<string, unknown>;
type DbApproval = Record<string, unknown>;

function asString(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function mapChange(row: DbChange): ChangeRequest {
  return {
    id: asString(row.id),
    organizationId: asString(row.organization_id),
    number: asString(row.number),
    title: asString(row.title),
    description: asString(row.description),
    type: asString(row.type) as ChangeRequest["type"],
    risk: asString(row.risk) as ChangeRequest["risk"],
    status: asString(row.status) as ChangeRequest["status"],
    approvalState: asString(row.approval_state) as ChangeRequest["approvalState"],
    requestedByUserId: asString(row.requested_by_user_id),
    requestedBy: asString(row.requested_by_name),
    ownerUserId: row.owner_user_id ? asString(row.owner_user_id) : null,
    owner: asString(row.owner_name),
    affectedService: asString(row.affected_service),
    scheduledStart: asString(row.scheduled_start),
    scheduledEnd: asString(row.scheduled_end),
    impact: asString(row.impact),
    implementationPlan: asString(row.implementation_plan),
    validationPlan: asString(row.validation_plan),
    backoutPlan: asString(row.backout_plan),
    createdAt: asString(row.created_at),
    updatedAt: asString(row.updated_at),
  };
}

function mapAudit(row: DbAudit): AuditEvent {
  return {
    id: asString(row.id),
    changeId: row.change_id ? asString(row.change_id) : null,
    changeNumber: row.change_number ? asString(row.change_number) : null,
    action: asString(row.action),
    detail: asString(row.detail),
    actor: asString(row.actor_name),
    createdAt: asString(row.created_at),
  };
}

function mapApproval(row: DbApproval): ChangeApproval {
  return {
    id: asString(row.id),
    changeId: asString(row.change_id),
    approverUserId: asString(row.approver_user_id),
    approverName: asString(row.approver_name),
    decision: asString(row.decision) as ChangeApproval["decision"],
    comment: asString(row.comment),
    createdAt: asString(row.created_at),
  };
}

export async function listAvailableOrganizations(): Promise<ChangeOpsOrganizationOption[]> {
  const { data, error } = await supabase.rpc("changeops_available_organizations");
  if (error) throw error;

  return (data ?? []).map((row: Record<string, unknown>) => ({
    id: asString(row.organization_id),
    name: asString(row.organization_name),
    slug: asString(row.organization_slug),
    platformRoleCode: asString(row.platform_role_code),
    isMembership: Boolean(row.is_membership),
  }));
}

export async function getCurrentChangeOpsContext(
  organizationId?: string | null,
): Promise<ChangeOpsUserContext> {
  const { data, error } = organizationId
    ? await supabase.rpc("changeops_context_for_organization", {
        p_organization_id: organizationId,
      })
    : await supabase.rpc("changeops_current_context");

  if (error) throw error;
  const row = Array.isArray(data) ? data[0] : data;
  if (!row) throw new Error("No active OneTime Labs organization context was found for this account.");

  return {
    authUserId: row.auth_user_id,
    platformUserId: row.platform_user_id,
    organizationId: row.organization_id,
    organizationName: row.organization_name,
    email: row.email ?? "",
    displayName: row.display_name || row.email || "ChangeOps user",
    platformRoleCode: row.platform_role_code ?? "",
    changeOpsRole: row.changeops_role as ChangeOpsRole,
    isPlatformAdmin: Boolean(row.is_platform_admin),
    isPlatformOwner: Boolean(row.is_platform_owner),
    viewingAsOrganizationAdmin: Boolean(row.viewing_as_org_admin),
  };
}

export async function listChanges(organizationId: string): Promise<ChangeRequest[]> {
  const { data, error } = await supabase
    .from("changeops_changes")
    .select("*")
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((row) => mapChange(row as DbChange));
}

export async function listAudit(organizationId: string): Promise<AuditEvent[]> {
  const { data, error } = await supabase
    .from("changeops_audit_events")
    .select("*")
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((row) => mapAudit(row as DbAudit));
}

export async function createChangeRequest(
  organizationId: string,
  change: Omit<ChangeRequest, "id" | "number" | "organizationId" | "requestedByUserId" | "requestedBy" | "approvalState" | "status" | "createdAt" | "updatedAt">,
): Promise<ChangeRequest> {
  const { data, error } = await supabase.rpc("changeops_create_change", {
    p_organization_id: organizationId,
    p_title: change.title,
    p_description: change.description,
    p_type: change.type,
    p_risk: change.risk,
    p_owner_user_id: change.ownerUserId,
    p_owner_name: change.owner,
    p_affected_service: change.affectedService,
    p_scheduled_start: change.scheduledStart || null,
    p_scheduled_end: change.scheduledEnd || null,
    p_impact: change.impact,
    p_implementation_plan: change.implementationPlan,
    p_validation_plan: change.validationPlan,
    p_backout_plan: change.backoutPlan,
  });
  if (error) throw error;
  const row = Array.isArray(data) ? data[0] : data;
  return mapChange(row as DbChange);
}

export async function recordApproval(
  changeId: string,
  decision: "Approved" | "Rejected",
  comment = "",
): Promise<void> {
  const { error } = await supabase.rpc("changeops_record_approval", {
    p_change_id: changeId,
    p_decision: decision,
    p_comment: comment,
  });
  if (error) throw error;
}

export async function completeChangeRequest(changeId: string): Promise<void> {
  const { error } = await supabase.rpc("changeops_complete_change", {
    p_change_id: changeId,
  });
  if (error) throw error;
}

export async function getApprovalProgress(changeId: string): Promise<ApprovalProgress> {
  const { data, error } = await supabase.rpc("changeops_approval_progress", {
    p_change_id: changeId,
  });
  if (error) throw error;
  const row = Array.isArray(data) ? data[0] : data;
  return {
    changeId,
    eligibleApprovers: Number(row?.eligible_approvers ?? 0),
    approvalTarget: Number(row?.approval_target ?? 2),
    requiredApprovals: Number(row?.required_approvals ?? 0),
    approvedCount: Number(row?.approved_count ?? 0),
    rejectedCount: Number(row?.rejected_count ?? 0),
    remainingApprovals: Number(row?.remaining_approvals ?? 0),
  };
}

export async function getChangeSummary(changeId: string): Promise<ChangeSummary> {
  const [
    { data: changeData, error: changeError },
    { data: approvalsData, error: approvalsError },
    { data: auditData, error: auditError },
    progress,
  ] = await Promise.all([
    supabase.from("changeops_changes").select("*").eq("id", changeId).single(),
    supabase.from("changeops_approvals").select("*").eq("change_id", changeId).order("created_at", { ascending: true }),
    supabase.from("changeops_audit_events").select("*").eq("change_id", changeId).order("created_at", { ascending: true }),
    getApprovalProgress(changeId),
  ]);

  if (changeError) throw changeError;
  if (approvalsError) throw approvalsError;
  if (auditError) throw auditError;

  return {
    change: mapChange(changeData as DbChange),
    approvals: (approvalsData ?? []).map((row) => mapApproval(row as DbApproval)),
    audit: (auditData ?? []).map((row) => mapAudit(row as DbAudit)),
    progress,
  };
}

export async function listChangeOpsMembers(organizationId: string): Promise<ChangeOpsMember[]> {
  const { data, error } = await supabase.rpc("changeops_list_members", {
    p_organization_id: organizationId,
  });
  if (error) throw error;
  return (data ?? []).map((row: Record<string, unknown>) => ({
    platformUserId: asString(row.platform_user_id),
    displayName: asString(row.display_name) || asString(row.email),
    email: asString(row.email),
    platformRoleCode: asString(row.platform_role_code),
    changeOpsRole: asString(row.changeops_role) as ChangeOpsRole,
    active: Boolean(row.active),
  }));
}

export async function setChangeOpsMemberRole(
  organizationId: string,
  platformUserId: string,
  role: ChangeOpsRole,
): Promise<void> {
  const { error } = await supabase.rpc("changeops_set_member_role", {
    p_organization_id: organizationId,
    p_platform_user_id: platformUserId,
    p_role: role,
  });
  if (error) throw error;
}

export async function getApprovalTarget(organizationId: string): Promise<number> {
  const { data, error } = await supabase.rpc("changeops_get_approval_target", {
    p_organization_id: organizationId,
  });
  if (error) throw error;
  return Number(data ?? 2);
}

export async function setApprovalTarget(organizationId: string, target: number): Promise<void> {
  const { error } = await supabase.rpc("changeops_set_approval_target", {
    p_organization_id: organizationId,
    p_target: target,
  });
  if (error) throw error;
}

export function canApprove(role: ChangeOpsRole): boolean {
  return role === "ADMIN" || role === "MODERATOR" || role === "CAB";
}

export function canAdminister(role: ChangeOpsRole): boolean {
  return role === "ADMIN";
}

export function canViewAllChanges(role: ChangeOpsRole): boolean {
  return role === "ADMIN" || role === "MODERATOR" || role === "CAB" || role === "CHANGE_OWNER";
}
