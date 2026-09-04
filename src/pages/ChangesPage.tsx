import { Filter, Plus, Search } from "lucide-react";
import { useMemo, useState } from "react";
import type { ChangeRequest } from "../types/change";

interface Props {
  changes: ChangeRequest[];
  onCreate: () => void;
  onOpen: (change: ChangeRequest) => void;
}

export default function ChangesPage({ changes, onCreate, onOpen }: Props) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("All");

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return changes.filter((change) => {
      const matchesQuery = !needle || [change.number, change.title, change.owner, change.affectedService].some((value) => value.toLowerCase().includes(needle));
      const matchesStatus = status === "All" || change.status === status;
      return matchesQuery && matchesStatus;
    });
  }, [changes, query, status]);

  return (
    <div className="page-stack">
      <header className="page-heading"><div><p className="eyebrow">CHANGE REGISTER</p><h1>Changes</h1><p>Plan, review, approve, schedule, execute, and close operational changes.</p></div><button className="primary-button" onClick={onCreate}><Plus size={16} /> New Change</button></header>
      <section className="toolbar-row">
        <div className="searchbox"><Search size={15} /><input placeholder="Search changes..." value={query} onChange={(e) => setQuery(e.target.value)} /></div>
        <label className="filter-control"><Filter size={14} /><select value={status} onChange={(e) => setStatus(e.target.value)}><option>All</option><option>Draft</option><option>Pending Approval</option><option>Scheduled</option><option>In Progress</option><option>Completed</option><option>Failed</option><option>Cancelled</option></select></label>
        <span className="result-count">{filtered.length} changes</span>
      </section>
      <section className="panel table-panel">
        <div className="table-wrap">
          <table className="change-table">
            <thead><tr><th>Change</th><th>Title</th><th>Service</th><th>Owner</th><th>Risk</th><th>Status</th><th>Window</th></tr></thead>
            <tbody>{filtered.map((change) => <tr key={change.id} onClick={() => onOpen(change)}><td><strong>{change.number}</strong><span>{change.type}</span></td><td><strong>{change.title}</strong></td><td>{change.affectedService}</td><td>{change.owner}</td><td><span className={`risk-badge risk-${change.risk.toLowerCase()}`}>{change.risk}</span></td><td><span className={`status-badge status-${change.status.toLowerCase().replaceAll(" ", "-")}`}>{change.status}</span></td><td>{change.scheduledStart ? new Date(change.scheduledStart).toLocaleDateString() : "TBD"}</td></tr>)}</tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
