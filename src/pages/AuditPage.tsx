import { History } from "lucide-react";
import type { AuditEvent } from "../types/change";

export default function AuditPage({ events }: { events: AuditEvent[] }) {
  return <div className="page-stack"><header className="page-heading"><div><p className="eyebrow">TRACEABILITY</p><h1>Audit history</h1><p>Permanent operational record of ChangeOps decisions and activity.</p></div></header><section className="panel audit-panel"><div className="audit-stream">{[...events].sort((a,b) => b.createdAt.localeCompare(a.createdAt)).map((event) => <article className="audit-row" key={event.id}><div className="audit-icon"><History size={14} /></div><div className="audit-copy"><div><strong>{event.action}</strong>{event.changeNumber && <span>{event.changeNumber}</span>}</div><p>{event.detail}</p><small>{event.actor} · {new Date(event.createdAt).toLocaleString()}</small></div></article>)}</div></section></div>;
}
