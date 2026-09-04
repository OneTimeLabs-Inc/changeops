import { CalendarDays } from "lucide-react";
import type { ChangeRequest } from "../types/change";

interface Props { changes: ChangeRequest[]; onOpen: (change: ChangeRequest) => void; }

export default function CalendarPage({ changes, onOpen }: Props) {
  const current = new Date();
  const year = current.getFullYear();
  const month = current.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const days = new Date(year, month + 1, 0).getDate();
  const cells = Array.from({ length: firstDay + days }, (_, index) => index < firstDay ? null : index - firstDay + 1);
  const monthChanges = changes.filter((change) => { if (!change.scheduledStart) return false; const date = new Date(change.scheduledStart); return date.getFullYear() === year && date.getMonth() === month; });

  return <div className="page-stack"><header className="page-heading"><div><p className="eyebrow">SCHEDULE</p><h1>Change calendar</h1><p>Maintenance windows and approved work across the current month.</p></div><div className="month-label"><CalendarDays size={17} />{current.toLocaleDateString(undefined, { month: "long", year: "numeric" })}</div></header><section className="panel calendar-panel"><div className="calendar-weekdays">{["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map((day) => <span key={day}>{day}</span>)}</div><div className="calendar-grid">{cells.map((day, index) => <div className={`calendar-cell ${day === current.getDate() ? "today" : ""}`} key={index}>{day && <><span className="calendar-day">{day}</span><div className="calendar-events">{monthChanges.filter((change) => new Date(change.scheduledStart).getDate() === day).map((change) => <button key={change.id} onClick={() => onOpen(change)} className={`calendar-event risk-border-${change.risk.toLowerCase()}`}><strong>{change.number}</strong><span>{change.title}</span></button>)}</div></>}</div>)}</div></section></div>;
}
