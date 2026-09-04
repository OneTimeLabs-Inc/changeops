import { CheckCircle2, LockKeyhole, XCircle } from "lucide-react";
import type { ApprovalProgress, ChangeOpsUserContext, ChangeRequest } from "../types/change";

interface Props {
  changes: ChangeRequest[];
  progress: Record<string, ApprovalProgress>;
  currentUser: ChangeOpsUserContext;
  onOpen: (change: ChangeRequest) => void;
  onApprove: (change: ChangeRequest) => void;
  onReject: (change: ChangeRequest) => void;
}

export default function ApprovalsPage({ changes, progress, currentUser, onOpen, onApprove, onReject }: Props) {
  const pending = changes.filter((change) => change.approvalState === "Pending");

  return <div className="page-stack"><header className="page-heading"><div><p className="eyebrow">GOVERNANCE</p><h1>Approvals</h1><p>Decision queue for changes requiring formal authorization. Requesters cannot approve their own change.</p></div></header><section className="approval-grid">{pending.length === 0 ? <div className="empty-state"><CheckCircle2 size={28} /><h3>Approval queue is clear</h3><p>No changes are waiting for a decision.</p></div> : pending.map((change) => {
    const p = progress[change.id];
    const selfSubmitted = change.requestedByUserId === currentUser.platformUserId;
    const allowed = ["ADMIN", "MODERATOR", "CAB"].includes(currentUser.changeOpsRole) && !selfSubmitted;
    return <article className="approval-card" key={change.id}><div className="approval-card-top"><span className={`risk-badge risk-${change.risk.toLowerCase()}`}>{change.risk} risk</span><span>{change.number}</span></div><button className="approval-title" onClick={() => onOpen(change)}>{change.title}</button><p>{change.impact || change.description}</p><div className="approval-meta"><span><small>Owner</small>{change.owner}</span><span><small>Service</small>{change.affectedService}</span><span><small>Window</small>{change.scheduledStart ? new Date(change.scheduledStart).toLocaleString() : "TBD"}</span></div><div className="approval-progress"><strong>{p ? `${p.approvedCount} / ${p.requiredApprovals}` : "—"} approvals</strong>{p && <span>{p.remainingApprovals} remaining · {p.eligibleApprovers} eligible</span>}</div><footer>{allowed ? <><button className="danger-button" onClick={() => onReject(change)}><XCircle size={15} /> Reject</button><button className="primary-button" onClick={() => onApprove(change)}><CheckCircle2 size={15} /> Approve</button></> : <div className="approval-locked"><LockKeyhole size={15}/>{selfSubmitted ? "You submitted this change." : "Your role cannot approve changes."}</div>}</footer></article>;
  })}</section></div>;
}
