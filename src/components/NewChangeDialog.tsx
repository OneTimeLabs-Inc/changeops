import { useEffect, useState, type FormEvent } from "react";
import { X } from "lucide-react";
import { listChangeOpsMembers } from "../services/changeops";
import type { ChangeOpsMember, ChangeRequest, ChangeRisk, ChangeType, ChangeOpsUserContext } from "../types/change";

interface Props {
  currentUser: ChangeOpsUserContext;
  onClose: () => void;
  onCreate: (change: Omit<ChangeRequest, "id" | "number" | "organizationId" | "requestedByUserId" | "requestedBy" | "approvalState" | "status" | "createdAt" | "updatedAt">) => Promise<void>;
}

const fieldDefaults = {
  title: "",
  description: "",
  type: "Normal" as ChangeType,
  risk: "Medium" as ChangeRisk,
  ownerUserId: null as string | null,
  owner: "",
  affectedService: "",
  scheduledStart: "",
  scheduledEnd: "",
  impact: "",
  implementationPlan: "",
  validationPlan: "",
  backoutPlan: "",
};

export default function NewChangeDialog({ currentUser, onClose, onCreate }: Props) {
  const [form, setForm] = useState(fieldDefaults);
  const [members, setMembers] = useState<ChangeOpsMember[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    listChangeOpsMembers(currentUser.organizationId)
      .then(setMembers)
      .catch(() => setMembers([]));
  }, [currentUser.organizationId]);

  function update<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function selectOwner(platformUserId: string) {
    const member = members.find((item) => item.platformUserId === platformUserId);
    setForm((current) => ({
      ...current,
      ownerUserId: member?.platformUserId ?? null,
      owner: member?.displayName ?? "",
    }));
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      await onCreate(form);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to create change.");
      setSaving(false);
    }
  }

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={onClose}>
      <section className="modal-card change-dialog" role="dialog" aria-modal="true" onMouseDown={(event) => event.stopPropagation()}>
        <header className="modal-header">
          <div><span>NEW CHANGE</span><h2>Submit change request</h2></div>
          <button type="button" className="icon-button" onClick={onClose}><X size={18} /></button>
        </header>
        <form onSubmit={submit} className="change-form">
          <div className="form-grid two-col">
            <label className="span-2">Title<input required value={form.title} onChange={(e) => update("title", e.target.value)} placeholder="Describe the planned change" /></label>
            <label>Type<select value={form.type} onChange={(e) => update("type", e.target.value as ChangeType)}><option>Standard</option><option>Normal</option><option>Emergency</option></select></label>
            <label>Risk<select value={form.risk} onChange={(e) => update("risk", e.target.value as ChangeRisk)}><option>Low</option><option>Medium</option><option>High</option><option>Critical</option></select></label>
            <label>Requested by<input value={currentUser.displayName} readOnly /></label>
            <label>Owner<select required value={form.ownerUserId ?? ""} onChange={(e) => selectOwner(e.target.value)}><option value="">Select owner</option>{members.filter((m) => m.active).map((member) => <option key={member.platformUserId} value={member.platformUserId}>{member.displayName} ({member.changeOpsRole})</option>)}</select></label>
            <label className="span-2">Affected service<input required value={form.affectedService} onChange={(e) => update("affectedService", e.target.value)} /></label>
            <label>Scheduled start<input type="datetime-local" value={form.scheduledStart} onChange={(e) => update("scheduledStart", e.target.value)} /></label>
            <label>Scheduled end<input type="datetime-local" value={form.scheduledEnd} onChange={(e) => update("scheduledEnd", e.target.value)} /></label>
            <label className="span-2">Description<textarea rows={3} value={form.description} onChange={(e) => update("description", e.target.value)} /></label>
            <label className="span-2">Impact<textarea rows={2} value={form.impact} onChange={(e) => update("impact", e.target.value)} /></label>
            <label className="span-2">Implementation plan<textarea required rows={3} value={form.implementationPlan} onChange={(e) => update("implementationPlan", e.target.value)} /></label>
            <label className="span-2">Validation plan<textarea rows={2} value={form.validationPlan} onChange={(e) => update("validationPlan", e.target.value)} /></label>
            <label className="span-2">Backout plan<textarea rows={2} value={form.backoutPlan} onChange={(e) => update("backoutPlan", e.target.value)} /></label>
          </div>
          {error && <p className="form-error">{error}</p>}
          <footer className="modal-footer">
            <button type="button" className="secondary-button" onClick={onClose}>Cancel</button>
            <button type="submit" className="primary-button" disabled={saving}>{saving ? "Submitting…" : "Create & Submit"}</button>
          </footer>
        </form>
      </section>
    </div>
  );
}
