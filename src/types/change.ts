export type ChangeRisk = "Low" | "Medium" | "High" | "Critical";
export type ChangeStatus =
  | "Draft"
  | "Pending Approval"
  | "Scheduled"
  | "In Progress"
  | "Completed"
  | "Failed"
  | "Cancelled";
export type ChangeType = "Standard" | "Normal" | "Emergency";
export type ApprovalState = "Pending" | "Approved" | "Rejected";
export type ApprovalDecision = "Approved" | "Rejected";

export type ChangeOpsRole =
  | "REQUESTER"
  | "CHANGE_OWNER"
  | "MODERATOR"
  | "CAB"
  | "ADMIN";

export interface ChangeOpsOrganizationOption {
  id: string;
  name: string;
  slug: string;
  platformRoleCode: string;
  isMembership: boolean;
}

export interface ChangeOpsUserContext {
  authUserId: string;
  platformUserId: string;
  organizationId: string;
  organizationName: string;
  email: string;
  displayName: string;
  platformRoleCode: string;
  changeOpsRole: ChangeOpsRole;
  isPlatformAdmin: boolean;
  isPlatformOwner: boolean;
  viewingAsOrganizationAdmin: boolean;
}

export interface ChangeRequest {
  id: string;
  organizationId: string;
  number: string;
  title: string;
  description: string;
  type: ChangeType;
  risk: ChangeRisk;
  status: ChangeStatus;
  approvalState: ApprovalState;
  requestedByUserId: string;
  requestedBy: string;
  ownerUserId: string | null;
  owner: string;
  affectedService: string;
  scheduledStart: string;
  scheduledEnd: string;
  impact: string;
  implementationPlan: string;
  validationPlan: string;
  backoutPlan: string;
  createdAt: string;
  updatedAt: string;
}

export interface ChangeApproval {
  id: string;
  changeId: string;
  approverUserId: string;
  approverName: string;
  decision: ApprovalDecision;
  comment: string;
  createdAt: string;
}

export interface ApprovalProgress {
  changeId: string;
  eligibleApprovers: number;
  approvalTarget: number;
  requiredApprovals: number;
  approvedCount: number;
  rejectedCount: number;
  remainingApprovals: number;
}

export interface AuditEvent {
  id: string;
  changeId: string | null;
  changeNumber: string | null;
  action: string;
  detail: string;
  actor: string;
  createdAt: string;
}

export interface ChangeSummary {
  change: ChangeRequest;
  approvals: ChangeApproval[];
  audit: AuditEvent[];
  progress: ApprovalProgress;
}

export interface ChangeOpsMember {
  platformUserId: string;
  displayName: string;
  email: string;
  platformRoleCode: string;
  changeOpsRole: ChangeOpsRole;
  active: boolean;
}
