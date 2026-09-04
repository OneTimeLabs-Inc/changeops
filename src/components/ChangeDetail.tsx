import { CalendarDays, CheckCircle2, Clock3, FileText, LockKeyhole, RotateCcw, ShieldAlert, X, XCircle } from "lucide-react";
import type { ApprovalProgress, ChangeOpsUserContext, ChangeRequest } from "../types/change";

interface Props {
  change: ChangeRequest;
  progress?: ApprovalProgress;
  currentUser: ChangeOpsUserContext;
  canApprove: boolean;
  onClose: () => void;
  onApprove: () => void;
  onReject: () => void;
  onComplete: () => void;
  onSummary: () => void;
}

export default function ChangeDetail({ change, progress, currentUser, canApprove, onClose, onApprove, onReject, onComplete, onSummary }: Props) {
  const selfSubmitted = change.requestedByUserId === currentUser.platformUserId;
  const approvalAllowed = canApprove && !selfSubmitted;

  return (
    <div className="detail-overlay" onMouseDown={onClose}>
      <aside className="detail-panel" onMouseDown={(event) => event.stopPropagation()}>
        <header className="detail-header"><div><span>{change.number}</span><h2>{change.title}</h2></div><button className="icon-button" type="button" onClick={onClose}><X size={18} /></button></header>
        <div className="detail-badges"><span className={`status-badge status-${change.status.toLowerCase().replaceAll(" ", "-")}`}>{change.status}</span><span className={`risk-badge risk-${change.risk.toLowerCase()}`}>{change.risk} risk</span><span className="type-badge">{change.type}</span></div>
        <div className="detail-summary-grid"><div><span>Owner</span><strong>{change.owner}</strong></div><div><span>Service</span><strong>{change.affectedService}</strong></div><div><span>Requested by</span><strong>{change.requestedBy}</strong></div><div><span>Approval</span><strong>{change.approvalState}</strong></div></div>
        {progress && <section className="detail-section"><h3><CheckCircle2 size={15}/> Approval quorum</h3><p><strong>{progress.approvedCount} of {progress.requiredApprovals}</strong> required approvals recorded. {progress.eligibleApprovers} eligible approver{progress.eligibleApprovers === 1 ? "" : "s"}; configured target {progress.approvalTarget}.</p></section>}
        <section className="detail-section"><h3><CalendarDays size={15} /> Schedule</h3><p>{change.scheduledStart ? new Date(change.scheduledStart).toLocaleString() : "Not scheduled"} → {change.scheduledEnd ? new Date(change.scheduledEnd).toLocaleString() : "TBD"}</p></section>
        <section className="detail-section"><h3><ShieldAlert size={15} /> Impact</h3><p>{change.impact || "No impact statement entered."}</p></section>
        <section className="detail-section"><h3><Clock3 size={15} /> Implementation plan</h3><p>{change.implementationPlan}</p></section>
        <section className="detail-section"><h3><CheckCircle2 size={15} /> Validation plan</h3><p>{change.validationPlan || "No validation plan entered."}</p></section>
        <section className="detail-section"><h3><RotateCcw size={15} /> Backout plan</h3><p>{change.backoutPlan || "No backout plan entered."}</p></section>
        <footer className="detail-actions">
          <button className="secondary-button" onClick={onSummary}><FileText size={15}/> CAB Summary</button>
          {change.approvalState === "Pending" && approvalAllowed && <><button className="danger-button" onClick={onReject}><XCircle size={15} /> Reject</button><button className="primary-button" onClick={onApprove}><CheckCircle2 size={15} /> Approve</button></>}
          {change.approvalState === "Pending" && !approvalAllowed && <span className="approval-locked"><LockKeyhole size={15}/>{selfSubmitted ? "Self-approval blocked" : "Approval role required"}</span>}
          {(change.status === "Scheduled" || change.status === "In Progress") && <button className="primary-button" onClick={onComplete}><CheckCircle2 size={15} /> Mark Complete</button>}
        </footer>
      </aside>
    </div>
  );
}
