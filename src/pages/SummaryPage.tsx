import { ArrowLeft, Download, FileText, Printer } from "lucide-react";
import { useEffect, useState } from "react";
import { exportSummaryDocx, exportSummaryPdf } from "../services/export";
import { getChangeSummary } from "../services/changeops";
import type { ChangeSummary } from "../types/change";

function fmt(value: string): string { return value ? new Date(value).toLocaleString() : "TBD"; }

export default function SummaryPage({ changeId, onBack }: { changeId: string; onBack: () => void }) {
  const [summary, setSummary] = useState<ChangeSummary | null>(null);
  const [error, setError] = useState("");

  useEffect(() => { getChangeSummary(changeId).then(setSummary).catch((e) => setError(e instanceof Error ? e.message : "Unable to load summary.")); }, [changeId]);

  if (error) return <main className="summary-app"><div className="summary-paper"><p className="form-error">{error}</p><button className="secondary-button" onClick={onBack}><ArrowLeft size={15}/> Back</button></div></main>;
  if (!summary) return <main className="summary-app"><div className="spinner"/></main>;

  const { change, approvals, audit, progress } = summary;

  return <main className="summary-app"><div className="summary-toolbar no-print"><button className="secondary-button" onClick={onBack}><ArrowLeft size={15}/> ChangeOps</button><div><button className="secondary-button" onClick={() => window.print()}><Printer size={15}/> Print</button><button className="secondary-button" onClick={() => exportSummaryPdf(summary)}><Download size={15}/> PDF</button><button className="primary-button" onClick={() => void exportSummaryDocx(summary)}><FileText size={15}/> DOCX</button></div></div><article className="summary-paper"><header className="summary-header"><div><span>CHANGEOPS / CAB SUMMARY</span><h1>{change.number}</h1><h2>{change.title}</h2></div><div className={`summary-state state-${change.approvalState.toLowerCase()}`}>{change.approvalState}</div></header><section className="summary-meta"><div><span>Requested by</span><strong>{change.requestedBy}</strong></div><div><span>Owner</span><strong>{change.owner}</strong></div><div><span>Type</span><strong>{change.type}</strong></div><div><span>Risk</span><strong>{change.risk}</strong></div><div><span>Service</span><strong>{change.affectedService}</strong></div><div><span>Window</span><strong>{fmt(change.scheduledStart)} → {fmt(change.scheduledEnd)}</strong></div></section><section className="summary-quorum"><strong>{progress.approvedCount} / {progress.requiredApprovals} approvals</strong><span>{progress.eligibleApprovers} eligible approver{progress.eligibleApprovers === 1 ? "" : "s"}; target {progress.approvalTarget}</span></section>{[["Description",change.description],["Impact",change.impact],["Implementation Plan",change.implementationPlan],["Validation Plan",change.validationPlan],["Backout Plan",change.backoutPlan]].map(([heading, body]) => <section className="summary-section" key={heading}><h3>{heading}</h3><p>{body || "—"}</p></section>)}<section className="summary-section"><h3>Approval history</h3>{approvals.length === 0 ? <p>No decisions recorded.</p> : <div className="summary-history">{approvals.map((approval) => <div key={approval.id}><strong>{approval.approverName}</strong><span>{approval.decision}</span><small>{fmt(approval.createdAt)}</small>{approval.comment && <p>{approval.comment}</p>}</div>)}</div>}</section><section className="summary-section"><h3>Audit history</h3><div className="summary-history">{audit.map((event) => <div key={event.id}><strong>{event.action}</strong><span>{event.actor}</span><small>{fmt(event.createdAt)}</small><p>{event.detail}</p></div>)}</div></section></article></main>;
}
