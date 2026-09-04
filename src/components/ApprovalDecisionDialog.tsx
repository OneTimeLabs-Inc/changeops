import { useState } from "react";
import { CheckCircle2, X, XCircle } from "lucide-react";
import type { ApprovalDecision, ChangeRequest } from "../types/change";

export default function ApprovalDecisionDialog({
  change,
  decision,
  onClose,
  onSubmit,
}: {
  change: ChangeRequest;
  decision: ApprovalDecision;
  onClose: () => void;
  onSubmit: (comment: string) => Promise<void>;
}) {
  const [comment, setComment] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function submit() {
    setSaving(true);
    setError("");
    try {
      await onSubmit(comment.trim());
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to record decision.");
      setSaving(false);
    }
  }

  return <div className="modal-backdrop" onMouseDown={onClose}><section className="modal-card decision-dialog" onMouseDown={(e) => e.stopPropagation()}><header className="modal-header"><div><span>APPROVAL DECISION</span><h2>{change.number}</h2></div><button className="icon-button" onClick={onClose}><X size={18}/></button></header><div className="decision-copy">{decision === "Approved" ? <CheckCircle2 size={26}/> : <XCircle size={26}/>}<div><strong>{decision === "Approved" ? "Approve change" : "Reject change"}</strong><p>{change.title}</p></div></div><label className="decision-comment">Comment<textarea rows={4} value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Optional CAB / reviewer notes" /></label>{error && <p className="form-error">{error}</p>}<footer className="modal-footer"><button className="secondary-button" onClick={onClose}>Cancel</button><button className={decision === "Approved" ? "primary-button" : "danger-button"} disabled={saving} onClick={() => void submit()}>{saving ? "Saving…" : decision}</button></footer></section></div>;
}
