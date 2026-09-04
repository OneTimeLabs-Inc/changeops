import { ShieldCheck, Users } from "lucide-react";
import { useEffect, useState } from "react";

import {
  getApprovalTarget,
  listChangeOpsMembers,
  setApprovalTarget,
  setChangeOpsMemberRole,
} from "../services/changeops";

import type {
  ChangeOpsMember,
  ChangeOpsRole,
} from "../types/change";

/* ==========================================================
   USERS 001
   ChangeOps role definitions
   ========================================================== */

const roles: ChangeOpsRole[] = [
  "REQUESTER",
  "CHANGE_OWNER",
  "MODERATOR",
  "CAB",
  "ADMIN",
];

const approvalTargets = [2, 3, 4, 5, 6, 7, 8];

/* ==========================================================
   USERS 002
   Users & Roles administration page
   ========================================================== */

export default function UsersPage({ organizationId }: { organizationId: string }) {
  const [members, setMembers] = useState<ChangeOpsMember[]>([]);
  const [target, setTarget] = useState(2);
  const [message, setMessage] = useState("");
  const [savingMemberId, setSavingMemberId] = useState<string | null>(null);
  const [savingTarget, setSavingTarget] = useState(false);

  async function refresh() {
    const [nextMembers, nextTarget] = await Promise.all([
      listChangeOpsMembers(organizationId),
      getApprovalTarget(organizationId),
    ]);

    setMembers(nextMembers);
    setTarget(nextTarget);
  }

  useEffect(() => {
    void refresh();
  }, [organizationId]);

  async function changeRole(
    member: ChangeOpsMember,
    role: ChangeOpsRole,
  ) {
    if (member.platformRoleCode?.toUpperCase() === "OWNER") {
      setMessage(
        `${member.displayName} is a protected organization owner and must remain a ChangeOps administrator.`,
      );
      return;
    }

    try {
      setSavingMemberId(member.platformUserId);
      setMessage("");

      await setChangeOpsMemberRole(
        organizationId,
        member.platformUserId,
        role,
      );

      setMessage(
        `${member.displayName} is now ${role.replaceAll("_", " ")}.`,
      );

      await refresh();
    } finally {
      setSavingMemberId(null);
    }
  }

  async function saveTarget(value: number) {
    const safe = Math.max(2, Math.min(8, value));

    try {
      setSavingTarget(true);
      setMessage("");

      await setApprovalTarget(organizationId, safe);
      setTarget(safe);

      setMessage(
        `Approval target set to ${safe}. ChangeOps will automatically use fewer approvals when fewer eligible approvers exist, while still requiring at least two whenever two or more eligible Admin, Moderator, or CAB members are available.`,
      );
    } finally {
      setSavingTarget(false);
    }
  }

  return (
    <div className="page-stack users-page">
      <header className="page-heading">
        <div>
          <p className="eyebrow">GOVERNANCE</p>
          <h1>Users & Roles</h1>
          <p>
            Separate request submission from approval authority and configure
            the CAB approval target.
          </p>
        </div>
      </header>

      {message && (
        <div className="inline-notice users-notice">
          {message}
        </div>
      )}

      <section className="users-governance-grid">
        <article className="panel users-quorum-card">
          <div className="users-card-header">
            <div className="settings-icon">
              <ShieldCheck size={18} />
            </div>

            <div>
              <h2>Approval quorum</h2>
              <p>
                Set the normal number of approvals required for a submitted
                change.
              </p>
            </div>
          </div>

          <div className="users-quorum-body">
            <label
              className="users-field"
              htmlFor="required-approvals"
            >
              <span>Required approvals</span>

              <select
                id="required-approvals"
                value={target}
                disabled={savingTarget}
                onChange={(event) =>
                  void saveTarget(Number(event.target.value))
                }
              >
                {approvalTargets.map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
              </select>
            </label>

            <div className="users-rule-copy">
              <strong>Quorum rule</strong>
              <p>
                If there is only one eligible Admin, Moderator, or CAB member,
                that one approval is sufficient. If two or more eligible
                approvers exist, at least two approvals are always required.
                The requester can never approve their own change.
              </p>
            </div>
          </div>
        </article>
      </section>

      <section className="panel table-panel users-table-panel">
        <div className="panel-title-row">
          <div>
            <Users size={17} />
            <strong>Organization members</strong>
          </div>
        </div>

        <div className="table-wrap">
          <table className="change-table users-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Email</th>
                <th>Platform role</th>
                <th>ChangeOps role</th>
              </tr>
            </thead>

            <tbody>
              {members.map((member) => (
                <tr key={member.platformUserId}>
                  <td>
                    <strong>{member.displayName}</strong>
                  </td>

                  <td>{member.email}</td>
                  <td>{member.platformRoleCode || "—"}</td>

                  <td>
                    {member.platformRoleCode?.toUpperCase() === "OWNER" ? (
                      <div className="users-protected-role">
                        <span className="users-protected-role-label">ADMIN</span>
                        <span className="users-protected-role-note">
                          Protected owner
                        </span>
                      </div>
                    ) : (
                      <select
                        className="users-role-select"
                        value={member.changeOpsRole}
                        disabled={savingMemberId === member.platformUserId}
                        onChange={(event) =>
                          void changeRole(
                            member,
                            event.target.value as ChangeOpsRole,
                          )
                        }
                      >
                        {roles.map((role) => (
                          <option key={role} value={role}>
                            {role.replaceAll("_", " ")}
                          </option>
                        ))}
                      </select>
                    )}
                  </td>
                </tr>
              ))}

              {members.length === 0 && (
                <tr>
                  <td colSpan={4} className="users-empty-state">
                    No organization members were found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
