import { seedAudit, seedChanges } from "../data/demo";
import type { AuditEvent, ChangeRequest, ChangeStatus } from "../types/change";

const CHANGES_KEY = "chops:changes:v1";
const AUDIT_KEY = "chops:audit:v1";

function readJson<T>(key: string, fallback: T): T {
  const raw = localStorage.getItem(key);
  if (!raw) return fallback;

  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeJson<T>(key: string, value: T): void {
  localStorage.setItem(key, JSON.stringify(value));
}

export function loadChanges(): ChangeRequest[] {
  const existing = readJson<ChangeRequest[] | null>(CHANGES_KEY, null);
  if (existing) return existing;
  writeJson(CHANGES_KEY, seedChanges);
  return seedChanges;
}

export function saveChanges(changes: ChangeRequest[]): void {
  writeJson(CHANGES_KEY, changes);
}

export function loadAudit(): AuditEvent[] {
  const existing = readJson<AuditEvent[] | null>(AUDIT_KEY, null);
  if (existing) return existing;
  writeJson(AUDIT_KEY, seedAudit);
  return seedAudit;
}

export function saveAudit(events: AuditEvent[]): void {
  writeJson(AUDIT_KEY, events);
}

export function nextChangeNumber(changes: ChangeRequest[]): string {
  const year = new Date().getFullYear();
  const max = changes.reduce((currentMax, change) => {
    const match = change.number.match(new RegExp(`^CHG-${year}-(\\d+)$`));
    return match ? Math.max(currentMax, Number(match[1])) : currentMax;
  }, 0);
  return `CHG-${year}-${String(max + 1).padStart(3, "0")}`;
}

export function statusForApproval(approved: boolean): ChangeStatus {
  return approved ? "Scheduled" : "Draft";
}
