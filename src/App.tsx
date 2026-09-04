import {
  Bell,
  Building2,
  CalendarDays,
  CheckSquare2,
  ClipboardList,
  FileClock,
  FileText,
  Gauge,
  History,
  LogOut,
  Menu,
  Plus,
  Settings,
  ShieldCheck,
  Users,
  X,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

import "./App.css";

import ApprovalDecisionDialog from "./components/ApprovalDecisionDialog";
import AuthGate from "./components/AuthGate";
import ChangeDetail from "./components/ChangeDetail";
import LicenseGate from "./components/LicenseGate";
import NewChangeDialog from "./components/NewChangeDialog";
import { productConfig } from "./config/productConfig";
import ApprovalsPage from "./pages/ApprovalsPage";
import AuditPage from "./pages/AuditPage";
import CalendarPage from "./pages/CalendarPage";
import ChangesPage from "./pages/ChangesPage";
import Dashboard from "./pages/Dashboard";
import SettingsPage from "./pages/SettingsPage";
import SummaryPage from "./pages/SummaryPage";
import SummariesPage from "./pages/SummariesPage";
import UsersPage from "./pages/UsersPage";
import {
  canAdminister,
  canApprove,
  completeChangeRequest,
  createChangeRequest,
  getApprovalProgress,
  getCurrentChangeOpsContext,
  listAudit,
  listAvailableOrganizations,
  listChanges,
  recordApproval,
} from "./services/changeops";
import { signOut } from "./services/auth";
import { clearLicense, type StoredLicenseState } from "./services/licensing";
import type {
  ApprovalDecision,
  ApprovalProgress,
  AuditEvent,
  ChangeOpsOrganizationOption,
  ChangeOpsUserContext,
  ChangeRequest,
} from "./types/change";

type View =
  | "dashboard"
  | "changes"
  | "calendar"
  | "approvals"
  | "summaries"
  | "audit"
  | "users"
  | "settings";

const ORGANIZATION_STORAGE_KEY = "changeops:selected-organization";

const navItems: Array<{
  id: View;
  label: string;
  icon: React.ReactNode;
  adminOnly?: boolean;
}> = [
  { id: "dashboard", label: "Overview", icon: <Gauge size={17} /> },
  { id: "changes", label: "Changes", icon: <ClipboardList size={17} /> },
  { id: "calendar", label: "Calendar", icon: <CalendarDays size={17} /> },
  { id: "approvals", label: "Approvals", icon: <CheckSquare2 size={17} /> },
  { id: "summaries", label: "CAB Summaries", icon: <FileText size={17} /> },
  { id: "audit", label: "Audit", icon: <History size={17} /> },
  { id: "users", label: "Users & Roles", icon: <Users size={17} />, adminOnly: true },
  { id: "settings", label: "Settings", icon: <Settings size={17} /> },
];

/* ==========================================================
   APP 001
   ChangeOps application root
   ========================================================== */

export default function App() {
  const [licenseState, setLicenseState] = useState<StoredLicenseState | null>(null);

  const handleLicenseState = useCallback((state: StoredLicenseState | null) => {
    setLicenseState(state);
  }, []);

  return (
    <LicenseGate onLicenseState={handleLicenseState}>
      <AuthGate>
        <ChangeOpsApplication
          licenseState={licenseState}
          onLicenseState={handleLicenseState}
        />
      </AuthGate>
    </LicenseGate>
  );
}

/* ==========================================================
   APP 002
   Licensed ChangeOps workspace
   ========================================================== */

function ChangeOpsApplication({
  licenseState,
  onLicenseState,
}: {
  licenseState: StoredLicenseState | null;
  onLicenseState: (state: StoredLicenseState | null) => void;
}) {
  const [view, setView] = useState<View>("dashboard");
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [changes, setChanges] = useState<ChangeRequest[]>([]);
  const [audit, setAudit] = useState<AuditEvent[]>([]);
  const [progress, setProgress] = useState<Record<string, ApprovalProgress>>({});
  const [currentUser, setCurrentUser] = useState<ChangeOpsUserContext | null>(null);
  const [organizations, setOrganizations] = useState<ChangeOpsOrganizationOption[]>([]);
  const [selectedOrganizationId, setSelectedOrganizationId] = useState<string>("");
  const [newDialogOpen, setNewDialogOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [decision, setDecision] = useState<{
    change: ChangeRequest;
    decision: ApprovalDecision;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [switchingOrganization, setSwitchingOrganization] = useState(false);
  const [error, setError] = useState("");
  const [summaryId, setSummaryId] = useState<string | null>(() =>
    new URLSearchParams(window.location.search).get("summary"),
  );

  const selectedChange = useMemo(
    () => changes.find((change) => change.id === selectedId) ?? null,
    [changes, selectedId],
  );

  const pendingApprovals = changes.filter(
    (change) => change.approvalState === "Pending",
  ).length;

  const refreshData = useCallback(async (organizationId: string) => {
    const [user, nextChanges, nextAudit] = await Promise.all([
      getCurrentChangeOpsContext(organizationId),
      listChanges(organizationId),
      listAudit(organizationId),
    ]);

    const pending = nextChanges.filter(
      (change) => change.approvalState === "Pending",
    );
    const progressRows = await Promise.all(
      pending.map((change) => getApprovalProgress(change.id)),
    );
    const nextProgress = Object.fromEntries(
      progressRows.map((item) => [item.changeId, item]),
    );

    setCurrentUser(user);
    setChanges(nextChanges);
    setAudit(nextAudit);
    setProgress(nextProgress);
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function initialize() {
      setLoading(true);
      setError("");

      try {
        const available = await listAvailableOrganizations();

        if (available.length === 0) {
          throw new Error("No organizations are available for this account.");
        }

        const stored = window.localStorage.getItem(ORGANIZATION_STORAGE_KEY);
        const initial =
          available.find((organization) => organization.id === stored) ??
          available[0];

        if (cancelled) return;

        setOrganizations(available);
        setSelectedOrganizationId(initial.id);
        await refreshData(initial.id);
      } catch (caught: unknown) {
        if (cancelled) return;
        console.error("ChangeOps startup error:", caught);
        setError(formatStartupError(caught));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void initialize();

    return () => {
      cancelled = true;
    };
  }, [refreshData]);

  async function switchOrganization(organizationId: string) {
    if (!organizationId || organizationId === selectedOrganizationId) return;

    try {
      setSwitchingOrganization(true);
      setError("");
      setSelectedId(null);
      setDecision(null);
      setNewDialogOpen(false);

      await refreshData(organizationId);

      setSelectedOrganizationId(organizationId);
      window.localStorage.setItem(ORGANIZATION_STORAGE_KEY, organizationId);
      setView("dashboard");
    } catch (caught: unknown) {
      console.error("ChangeOps organization switch failed:", caught);
      setError(formatStartupError(caught));
    } finally {
      setSwitchingOrganization(false);
    }
  }

  function openSummary(change: ChangeRequest) {
    const url = new URL(window.location.href);
    url.searchParams.set("summary", change.id);
    window.history.pushState({}, "", url);
    setSummaryId(change.id);
    setSelectedId(null);
  }

  function closeSummary() {
    const url = new URL(window.location.href);
    url.searchParams.delete("summary");
    window.history.pushState({}, "", url);
    setSummaryId(null);
  }

  async function createChange(
    change: Parameters<typeof createChangeRequest>[1],
  ) {
    if (!selectedOrganizationId) return;

    const created = await createChangeRequest(
      selectedOrganizationId,
      change,
    );
    setNewDialogOpen(false);
    await refreshData(selectedOrganizationId);
    setSelectedId(created.id);
  }

  async function submitDecision(comment: string) {
    if (!decision || !selectedOrganizationId) return;
    await recordApproval(decision.change.id, decision.decision, comment);
    setDecision(null);
    await refreshData(selectedOrganizationId);
  }

  async function completeChange(change: ChangeRequest) {
    if (!selectedOrganizationId) return;
    await completeChangeRequest(change.id);
    await refreshData(selectedOrganizationId);
  }

  function deactivateLicense() {
    clearLicense();
    onLicenseState(null);
    window.location.reload();
  }

  async function handleLogout() {
    try {
      window.localStorage.removeItem(ORGANIZATION_STORAGE_KEY);
      await signOut();
    } catch (caught) {
      console.error("ChangeOps logout failed:", caught);
    } finally {
      window.location.assign(window.location.origin);
    }
  }

  if (loading) {
    return (
      <main className="gate-page">
        <div className="spinner" />
      </main>
    );
  }

  if (error || !currentUser) {
    return (
      <main className="gate-page">
        <section className="gate-card">
          <h1>ChangeOps could not start</h1>
          <p className="form-error">
            {error || "No ChangeOps user context found."}
          </p>
        </section>
      </main>
    );
  }

  if (summaryId) {
    return <SummaryPage changeId={summaryId} onBack={closeSummary} />;
  }

  const userCanApprove = canApprove(currentUser.changeOpsRole);
  const userCanAdminister = canAdminister(currentUser.changeOpsRole);
  const visibleNav = navItems.filter(
    (item) => !item.adminOnly || userCanAdminister,
  );
  const selectedOrganization =
    organizations.find(
      (organization) => organization.id === selectedOrganizationId,
    ) ?? null;
  const canSwitchOrganizations = organizations.length > 1;
  const isGlobalAdministrator =
    currentUser.isPlatformAdmin || currentUser.isPlatformOwner;

  const page = (() => {
    switch (view) {
      case "changes":
        return (
          <ChangesPage
            changes={changes}
            onCreate={() => setNewDialogOpen(true)}
            onOpen={(change) => setSelectedId(change.id)}
          />
        );
      case "calendar":
        return (
          <CalendarPage
            changes={changes}
            onOpen={(change) => setSelectedId(change.id)}
          />
        );
      case "approvals":
        return (
          <ApprovalsPage
            changes={changes}
            progress={progress}
            currentUser={currentUser}
            onOpen={(change) => setSelectedId(change.id)}
            onApprove={(change) =>
              setDecision({ change, decision: "Approved" })
            }
            onReject={(change) =>
              setDecision({ change, decision: "Rejected" })
            }
          />
        );
      case "summaries":
        return <SummariesPage changes={changes} onOpen={openSummary} />;
      case "audit":
        return <AuditPage events={audit} />;
      case "users":
        return userCanAdminister ? (
          <UsersPage organizationId={selectedOrganizationId} />
        ) : (
          <Dashboard
            changes={changes}
            onCreate={() => setNewDialogOpen(true)}
            onOpen={(change) => setSelectedId(change.id)}
          />
        );
      case "settings":
        return (
          <SettingsPage
            licenseState={licenseState}
            onDeactivate={deactivateLicense}
          />
        );
      default:
        return (
          <Dashboard
            changes={changes}
            onCreate={() => setNewDialogOpen(true)}
            onOpen={(change) => setSelectedId(change.id)}
          />
        );
    }
  })();

  return (
    <div className="app-shell">
      <aside className={`sidebar ${mobileNavOpen ? "sidebar-open" : ""}`}>
        <div className="brand-block">
          <div className="brand-mark">CH</div>
          <div>
            <strong>ChangeOps</strong>
            <span>{currentUser.organizationName}</span>
          </div>
          <button
            className="mobile-close"
            type="button"
            onClick={() => setMobileNavOpen(false)}
          >
            <X size={18} />
          </button>
        </div>

        <nav className="side-nav" aria-label="ChangeOps navigation">
          <span className="nav-label">WORKSPACE</span>
          {visibleNav.map((item) => (
            <button
              key={item.id}
              className={view === item.id ? "active" : ""}
              onClick={() => {
                setView(item.id);
                setMobileNavOpen(false);
              }}
            >
              {item.icon}
              <span>{item.label}</span>
              {item.id === "approvals" && pendingApprovals > 0 && (
                <em>{pendingApprovals}</em>
              )}
            </button>
          ))}
        </nav>

        <div className="sidebar-license">
          <ShieldCheck size={16} />
          <div>
            <strong>{licenseState ? "Licensed" : "Prototype mode"}</strong>
            <span>
              {productConfig.slug} · v{productConfig.version}
            </span>
          </div>
        </div>
      </aside>

      <div className="main-shell">
        <header className="topbar">
          <div className="topbar-left">
            <button
              className="mobile-menu"
              type="button"
              onClick={() => setMobileNavOpen(true)}
            >
              <Menu size={18} />
            </button>

            <div className="breadcrumb">
              <FileClock size={15} />
              <span>{currentUser.organizationName}</span>
              <strong>/</strong>
              <span>{visibleNav.find((item) => item.id === view)?.label}</span>
            </div>
          </div>

          <div className="topbar-actions">
            {(canSwitchOrganizations || isGlobalAdministrator) && (
              <label className="organization-switcher">
                <span>
                  {isGlobalAdministrator ? "VIEW AS" : "ORGANIZATION"}
                </span>
                <div className="organization-switcher-control">
                  <Building2 size={14} />
                  <select
                    value={selectedOrganizationId}
                    disabled={switchingOrganization}
                    onChange={(event) =>
                      void switchOrganization(event.target.value)
                    }
                    aria-label="Select organization"
                  >
                    {organizations.map((organization) => (
                      <option key={organization.id} value={organization.id}>
                        {organization.name}
                      </option>
                    ))}
                  </select>
                </div>
              </label>
            )}

            {isGlobalAdministrator && selectedOrganization && (
              <div className="view-as-badge" title="You remain signed in as the platform administrator. Actions are audited to your real account.">
                <ShieldCheck size={13} />
                <span>{selectedOrganization.name} Admin</span>
              </div>
            )}

            <button
              className="top-icon"
              type="button"
              aria-label="Notifications"
            >
              <Bell size={16} />
              {pendingApprovals > 0 && <span />}
            </button>

            <button
              className="new-change-button"
              type="button"
              onClick={() => setNewDialogOpen(true)}
            >
              <Plus size={15} /> New Change
            </button>

            <div className="user-chip">
              <div>{currentUser.displayName.slice(0, 2).toUpperCase()}</div>
              <span>
                <strong>{currentUser.displayName}</strong>
                <small>
                  {currentUser.viewingAsOrganizationAdmin
                    ? "PLATFORM ADMIN"
                    : currentUser.changeOpsRole}
                </small>
              </span>
            </div>

            <button
              className="logout-button"
              type="button"
              onClick={() => void handleLogout()}
              title="Sign out of ChangeOps"
            >
              <LogOut size={15} />
              <span>Logout</span>
            </button>
          </div>
        </header>

        {currentUser.viewingAsOrganizationAdmin && (
          <div className="view-as-banner">
            <ShieldCheck size={14} />
            <strong>Platform administrator view:</strong>
            <span>
              You are viewing {currentUser.organizationName} with organization
              administrator access. Audit records still identify your real
              account.
            </span>
          </div>
        )}

        <main className="content-area">{page}</main>

        <footer className="statusbar">
          <div>
            <span className="status-dot" /> Connected
          </div>
          <div>
            <span>{productConfig.name}</span>
            <span>{currentUser.organizationName}</span>
            <span>{licenseState ? "License active" : "Local prototype"}</span>
            <span>v{productConfig.version}</span>
          </div>
        </footer>
      </div>

      {newDialogOpen && (
        <NewChangeDialog
          currentUser={currentUser}
          onClose={() => setNewDialogOpen(false)}
          onCreate={createChange}
        />
      )}

      {selectedChange && (
        <ChangeDetail
          change={selectedChange}
          progress={progress[selectedChange.id]}
          currentUser={currentUser}
          canApprove={userCanApprove}
          onClose={() => setSelectedId(null)}
          onApprove={() =>
            setDecision({ change: selectedChange, decision: "Approved" })
          }
          onReject={() =>
            setDecision({ change: selectedChange, decision: "Rejected" })
          }
          onComplete={() => void completeChange(selectedChange)}
          onSummary={() => openSummary(selectedChange)}
        />
      )}

      {decision && (
        <ApprovalDecisionDialog
          change={decision.change}
          decision={decision.decision}
          onClose={() => setDecision(null)}
          onSubmit={submitDecision}
        />
      )}
    </div>
  );
}

function formatStartupError(caught: unknown): string {
  if (caught instanceof Error) return caught.message;

  if (typeof caught === "object" && caught !== null) {
    const supabaseError = caught as {
      message?: unknown;
      details?: unknown;
      hint?: unknown;
      code?: unknown;
    };

    const parts = [
      typeof supabaseError.message === "string" ? supabaseError.message : "",
      typeof supabaseError.details === "string" ? supabaseError.details : "",
      typeof supabaseError.hint === "string" ? `Hint: ${supabaseError.hint}` : "",
      typeof supabaseError.code === "string" ? `Code: ${supabaseError.code}` : "",
    ].filter(Boolean);

    if (parts.length > 0) return parts.join(" · ");

    try {
      return JSON.stringify(caught);
    } catch {
      return "Unable to load ChangeOps.";
    }
  }

  return "Unable to load ChangeOps.";
}
