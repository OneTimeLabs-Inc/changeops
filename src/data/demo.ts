import type { AuditEvent, ChangeRequest } from "../types/change";

const now = new Date();
const y = now.getFullYear();
const month = String(now.getMonth() + 1).padStart(2, "0");
const nextMonthDate = new Date(now.getFullYear(), now.getMonth() + 1, 8, 20, 0);
const nextMonthDate2 = new Date(now.getFullYear(), now.getMonth() + 1, 12, 22, 0);

const DEMO_ORGANIZATION_ID = "demo-organization";

function isoLocal(date: Date): string {
  const tzOffset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - tzOffset).toISOString().slice(0, 16);
}

export const seedChanges: ChangeRequest[] = [
  {
    id: "chg-seed-001",
    organizationId: DEMO_ORGANIZATION_ID,
    number: `CHG-${y}-001`,
    title: "Upgrade production SQL cluster",
    description:
      "Apply the approved database maintenance release and fail over the production cluster.",
    type: "Normal",
    risk: "High",
    status: "Pending Approval",
    approvalState: "Pending",
    requestedByUserId: "demo-user-a-mercer",
    requestedBy: "A. Mercer",
    ownerUserId: null,
    owner: "Infrastructure Team",
    affectedService: "Production Database",
    scheduledStart: `${y}-${month}-28T22:00`,
    scheduledEnd: `${y}-${month}-29T00:30`,
    impact: "Brief application interruption during primary node failover.",
    implementationPlan:
      "Validate backups, drain application connections, patch secondary node, fail over, patch former primary, restore normal topology.",
    validationPlan:
      "Run database health checks, confirm replication, execute application smoke test and review error telemetry.",
    backoutPlan:
      "Return traffic to the original primary node and restore the pre-change VM snapshot if validation fails.",
    createdAt: `${y}-${month}-21T14:12:00.000Z`,
    updatedAt: `${y}-${month}-24T16:40:00.000Z`,
  },
  {
    id: "chg-seed-002",
    organizationId: DEMO_ORGANIZATION_ID,
    number: `CHG-${y}-002`,
    title: "Deploy firewall segmentation rules",
    description:
      "Restrict east-west traffic between production and management VLANs.",
    type: "Normal",
    risk: "Critical",
    status: "Scheduled",
    approvalState: "Approved",
    requestedByUserId: "demo-user-m-ellis",
    requestedBy: "M. Ellis",
    ownerUserId: null,
    owner: "Network Engineering",
    affectedService: "Core Network",
    scheduledStart: isoLocal(nextMonthDate),
    scheduledEnd: isoLocal(
      new Date(nextMonthDate.getTime() + 90 * 60_000),
    ),
    impact:
      "Potential loss of management connectivity if rules are ordered incorrectly.",
    implementationPlan:
      "Export active policy, stage new rule set, validate object groups, deploy during maintenance window and observe session logs.",
    validationPlan:
      "Validate permitted management flows, confirm blocked production-to-management flows and verify monitoring access.",
    backoutPlan: "Restore exported policy package and clear affected sessions.",
    createdAt: `${y}-${month}-18T10:00:00.000Z`,
    updatedAt: `${y}-${month}-23T09:15:00.000Z`,
  },
  {
    id: "chg-seed-003",
    organizationId: DEMO_ORGANIZATION_ID,
    number: `CHG-${y}-003`,
    title: "Replace warehouse label printer queue",
    description:
      "Migrate warehouse shipping stations to the new centralized queue.",
    type: "Standard",
    risk: "Low",
    status: "Completed",
    approvalState: "Approved",
    requestedByUserId: "demo-user-j-patel",
    requestedBy: "J. Patel",
    ownerUserId: null,
    owner: "Workplace Technology",
    affectedService: "Warehouse Printing",
    scheduledStart: `${y}-${month}-20T06:00`,
    scheduledEnd: `${y}-${month}-20T06:30`,
    impact:
      "No expected outage. Individual stations reconnect on next print job.",
    implementationPlan:
      "Create replacement queue, deploy mapping policy, test label output and remove legacy queue after verification.",
    validationPlan:
      "Print test labels from three shipping stations and confirm barcode readability.",
    backoutPlan: "Restore legacy queue mapping policy.",
    createdAt: `${y}-${month}-15T18:30:00.000Z`,
    updatedAt: `${y}-${month}-20T11:45:00.000Z`,
  },
  {
    id: "chg-seed-004",
    organizationId: DEMO_ORGANIZATION_ID,
    number: `CHG-${y}-004`,
    title: "ERP application server memory increase",
    description: "Increase VM memory allocation following capacity review.",
    type: "Standard",
    risk: "Medium",
    status: "Draft",
    approvalState: "Pending",
    requestedByUserId: "demo-user-s-green",
    requestedBy: "S. Green",
    ownerUserId: null,
    owner: "Enterprise Applications",
    affectedService: "ERP",
    scheduledStart: isoLocal(nextMonthDate2),
    scheduledEnd: isoLocal(
      new Date(nextMonthDate2.getTime() + 45 * 60_000),
    ),
    impact: "Application restart required during approved window.",
    implementationPlan:
      "Stop application service, shut down VM, increase assigned memory, restart and validate services.",
    validationPlan:
      "Confirm service startup, memory allocation, login and transaction processing.",
    backoutPlan:
      "Return VM to previous memory allocation and restart.",
    createdAt: `${y}-${month}-24T08:05:00.000Z`,
    updatedAt: `${y}-${month}-24T08:05:00.000Z`,
  },
];

export const seedAudit: AuditEvent[] = [
  {
    id: "audit-001",
    changeId: "chg-seed-002",
    changeNumber: `CHG-${y}-002`,
    action: "Change approved",
    detail:
      "CAB approval recorded and the maintenance window was confirmed.",
    actor: "Change Advisory Board",
    createdAt: `${y}-${month}-23T09:15:00.000Z`,
  },
  {
    id: "audit-002",
    changeId: "chg-seed-003",
    changeNumber: `CHG-${y}-003`,
    action: "Change completed",
    detail:
      "Validation passed and the legacy printer queue was retired.",
    actor: "J. Patel",
    createdAt: `${y}-${month}-20T11:45:00.000Z`,
  },
  {
    id: "audit-003",
    changeId: "chg-seed-001",
    changeNumber: `CHG-${y}-001`,
    action: "Submitted for approval",
    detail: "High-risk production database change submitted to CAB.",
    actor: "A. Mercer",
    createdAt: `${y}-${month}-21T14:12:00.000Z`,
  },
];
