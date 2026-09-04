import { AlertTriangle, CalendarClock, CheckCircle2, Clock3, Plus, ShieldCheck } from "lucide-react";
import type { ChangeRequest } from "../types/change";

interface Props {
  changes: ChangeRequest[];
  onCreate: () => void;
  onOpen: (change: ChangeRequest) => void;
}

export default function Dashboard({ changes, onCreate, onOpen }: Props) {
  const pending = changes.filter((change) => change.approvalState === "Pending").length;
  const scheduled = changes.filter((change) => change.status === "Scheduled").length;
  const highRisk = changes.filter((change) => ["High", "Critical"].includes(change.risk) && change.status !== "Completed").length;
  const completed = changes.filter((change) => change.status === "Completed").length;
  const recent = [...changes].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)).slice(0, 6);

  return (
    <div className="page-stack">
      <header className="page-heading">
        <div><p className="eyebrow">CHANGE CONTROL</p><h1>Operations overview</h1><p>What needs approval, what is scheduled, and what can hurt you.</p></div>
        <button className="primary-button" onClick={onCreate}><Plus size={16} /> New Change</button>
      </header>

      <section className="metric-grid">
        <Metric icon={<Clock3 size={18} />} label="Pending approval" value={pending} note="Awaiting decision" tone="warning" />
        <Metric icon={<CalendarClock size={18} />} label="Scheduled" value={scheduled} note="Approved upcoming work" tone="blue" />
        <Metric icon={<AlertTriangle size={18} />} label="High / critical risk" value={highRisk} note="Open risk exposure" tone="danger" />
        <Metric icon={<CheckCircle2 size={18} />} label="Completed" value={completed} note="Closed changes" tone="success" />
      </section>

      <section className="dashboard-grid">
        <article className="panel wide-panel">
          <div className="panel-heading"><div><span>RECENT CHANGES</span><h2>Active change register</h2></div><ShieldCheck size={19} /></div>
          <div className="change-list compact-list">
            {recent.map((change) => (
              <button className="change-list-row" key={change.id} onClick={() => onOpen(change)}>
                <div className="change-id"><strong>{change.number}</strong><span>{change.type}</span></div>
                <div className="change-main"><strong>{change.title}</strong><span>{change.affectedService} · {change.owner}</span></div>
                <span className={`risk-badge risk-${change.risk.toLowerCase()}`}>{change.risk}</span>
                <span className={`status-badge status-${change.status.toLowerCase().replaceAll(" ", "-")}`}>{change.status}</span>
              </button>
            ))}
          </div>
        </article>

        <article className="panel timeline-panel">
          <div className="panel-heading"><div><span>NEXT UP</span><h2>Maintenance windows</h2></div><CalendarClock size={19} /></div>
          <div className="timeline-list">
            {[...changes].filter((change) => change.scheduledStart && change.status !== "Completed" && change.status !== "Cancelled").sort((a, b) => a.scheduledStart.localeCompare(b.scheduledStart)).slice(0, 5).map((change) => (
              <button key={change.id} onClick={() => onOpen(change)}>
                <time>{new Date(change.scheduledStart).toLocaleDateString(undefined, { month: "short", day: "numeric" })}</time>
                <div><strong>{change.title}</strong><span>{new Date(change.scheduledStart).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })} · {change.owner}</span></div>
              </button>
            ))}
          </div>
        </article>
      </section>
    </div>
  );
}

function Metric({ icon, label, value, note, tone }: { icon: React.ReactNode; label: string; value: number; note: string; tone: string }) {
  return <article className={`metric-card metric-${tone}`}><div className="metric-top"><span>{label}</span>{icon}</div><strong>{value}</strong><small>{note}</small></article>;
}
