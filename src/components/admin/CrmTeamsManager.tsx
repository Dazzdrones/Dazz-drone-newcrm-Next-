"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, X, Settings2 } from "lucide-react";
import {
  addTeamMember,
  createCrmTeam,
  listTeamMembers,
  listTeamModuleAccess,
  removeTeamMember,
  setTeamModuleAccess,
  updateCrmTeam,
  type CrmTeamRow,
  type TeamModuleAccess,
  type TeamMemberRow,
} from "@/lib/auth/rbac-actions";

interface UserOption {
  id: string;
  email: string;
  full_name: string | null;
}

interface CrmTeamsManagerProps {
  teams: CrmTeamRow[];
  users: UserOption[];
}

export function CrmTeamsManager({ teams, users }: CrmTeamsManagerProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [manageTeam, setManageTeam] = useState<CrmTeamRow | null>(null);
  const [members, setMembers] = useState<TeamMemberRow[]>([]);
  const [moduleAccess, setModuleAccess] = useState<TeamModuleAccess[]>([]);
  const [newTeamName, setNewTeamName] = useState("");
  const [newTeamDesc, setNewTeamDesc] = useState("");
  const [addUserId, setAddUserId] = useState("");

  function openManage(team: CrmTeamRow) {
    setManageTeam(team);
    setError(null);
    startTransition(async () => {
      try {
        const [m, a] = await Promise.all([
          listTeamMembers(team.id),
          listTeamModuleAccess(team.id),
        ]);
        setMembers(m);
        setModuleAccess(a);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load team");
      }
    });
  }

  function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      try {
        await createCrmTeam({ name: newTeamName, description: newTeamDesc });
        setCreateOpen(false);
        setNewTeamName("");
        setNewTeamDesc("");
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to create team");
      }
    });
  }

  function handleAddMember() {
    if (!manageTeam || !addUserId) return;
    startTransition(async () => {
      try {
        await addTeamMember(manageTeam.id, addUserId);
        const m = await listTeamMembers(manageTeam.id);
        setMembers(m);
        setAddUserId("");
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to add member");
      }
    });
  }

  function handleRemoveMember(userId: string) {
    if (!manageTeam) return;
    startTransition(async () => {
      try {
        await removeTeamMember(manageTeam.id, userId);
        setMembers((prev) => prev.filter((m) => m.user_id !== userId));
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to remove member");
      }
    });
  }

  function toggleModuleAccess(
    moduleKey: string,
    field: "can_read" | "can_write",
    value: boolean
  ) {
    if (!manageTeam) return;
    const current = moduleAccess.find((m) => m.module_key === moduleKey);
    if (!current) return;

    const next = {
      can_read: field === "can_read" ? value : current.can_read,
      can_write: field === "can_write" ? value : current.can_write,
    };
    if (next.can_write) next.can_read = true;

    startTransition(async () => {
      try {
        await setTeamModuleAccess(
          manageTeam.id,
          moduleKey,
          next.can_read,
          next.can_write
        );
        setModuleAccess((prev) =>
          prev.map((m) =>
            m.module_key === moduleKey ? { ...m, ...next } : m
          )
        );
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to update access");
      }
    });
  }

  return (
    <>
      <div className="mb-4 flex justify-end">
        <button
          type="button"
          onClick={() => setCreateOpen(true)}
          className="inline-flex items-center gap-2 rounded-lg bg-[#34AADC] px-4 py-2 text-sm font-semibold text-white hover:bg-[#2B94C5]"
        >
          <Plus className="h-4 w-4" />
          Create Team
        </button>
      </div>

      {error && !createOpen && !manageTeam && (
        <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      <div className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
              <th className="px-4 py-3">Team</th>
              <th className="px-4 py-3">Members</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {teams.map((team) => (
              <tr key={team.id} className="hover:bg-blue-50/30">
                <td className="px-4 py-3">
                  <p className="font-medium text-gray-900">{team.name}</p>
                  {team.description && (
                    <p className="text-xs text-gray-500">{team.description}</p>
                  )}
                </td>
                <td className="px-4 py-3 text-gray-700">{team.member_count}</td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                      team.is_active
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {team.is_active ? "Active" : "Inactive"}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <button
                    type="button"
                    onClick={() => openManage(team)}
                    className="inline-flex items-center gap-1 text-sm font-medium text-[#34AADC] hover:underline"
                  >
                    <Settings2 className="h-3.5 w-3.5" />
                    Manage
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {createOpen && (
        <Modal title="Create Team" onClose={() => setCreateOpen(false)}>
          {error && (
            <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          )}
          <form onSubmit={handleCreate} className="space-y-4">
            <input
              required
              placeholder="Team name"
              value={newTeamName}
              onChange={(e) => setNewTeamName(e.target.value)}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
            />
            <textarea
              placeholder="Description (optional)"
              value={newTeamDesc}
              onChange={(e) => setNewTeamDesc(e.target.value)}
              rows={2}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
            />
            <button
              type="submit"
              disabled={isPending}
              className="w-full rounded-lg bg-[#34AADC] py-2.5 text-sm font-semibold text-white disabled:opacity-50"
            >
              {isPending ? "Creating..." : "Create Team"}
            </button>
          </form>
        </Modal>
      )}

      {manageTeam && (
        <Modal
          title={`Manage: ${manageTeam.name}`}
          onClose={() => setManageTeam(null)}
          wide
        >
          {error && (
            <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          )}

          <div className="grid gap-6 lg:grid-cols-2">
            <div>
              <h3 className="mb-2 text-sm font-semibold text-gray-900">Members</h3>
              <div className="mb-3 flex gap-2">
                <select
                  value={addUserId}
                  onChange={(e) => setAddUserId(e.target.value)}
                  className="flex-1 rounded-lg border border-gray-200 px-2 py-1.5 text-sm"
                >
                  <option value="">Add user...</option>
                  {users
                    .filter((u) => !members.some((m) => m.user_id === u.id))
                    .map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.full_name || u.email}
                      </option>
                    ))}
                </select>
                <button
                  type="button"
                  disabled={!addUserId || isPending}
                  onClick={handleAddMember}
                  className="rounded-lg bg-[#34AADC] px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50"
                >
                  Add
                </button>
              </div>
              <ul className="space-y-1 rounded-lg border border-gray-100 p-2">
                {members.length === 0 && (
                  <li className="px-2 py-2 text-xs text-gray-500">No members yet</li>
                )}
                {members.map((m) => (
                  <li
                    key={m.user_id}
                    className="flex items-center justify-between rounded px-2 py-1.5 text-sm hover:bg-gray-50"
                  >
                    <span>
                      {m.full_name || m.email}
                      <span className="ml-1 text-xs text-gray-400">({m.team_role})</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemoveMember(m.user_id)}
                      className="text-xs text-red-500 hover:underline"
                    >
                      Remove
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="mb-2 text-sm font-semibold text-gray-900">
                Module Access
              </h3>
              <div className="space-y-2 rounded-lg border border-gray-100 p-2">
                {moduleAccess.map((m) => (
                  <div
                    key={m.module_key}
                    className="flex items-center justify-between gap-2 rounded px-2 py-1.5 text-sm hover:bg-gray-50"
                  >
                    <span className="font-medium text-gray-800">{m.module_name}</span>
                    <div className="flex items-center gap-3 text-xs">
                      <label className="flex items-center gap-1">
                        <input
                          type="checkbox"
                          checked={m.can_read}
                          onChange={(e) =>
                            toggleModuleAccess(
                              m.module_key,
                              "can_read",
                              e.target.checked
                            )
                          }
                        />
                        Read
                      </label>
                      <label className="flex items-center gap-1">
                        <input
                          type="checkbox"
                          checked={m.can_write}
                          onChange={(e) =>
                            toggleModuleAccess(
                              m.module_key,
                              "can_write",
                              e.target.checked
                            )
                          }
                        />
                        Write
                      </label>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-4 flex justify-end">
            <button
              type="button"
              disabled={isPending}
              onClick={() => {
                startTransition(async () => {
                  await updateCrmTeam(manageTeam.id, {
                    is_active: !manageTeam.is_active,
                  });
                  router.refresh();
                  setManageTeam(null);
                });
              }}
              className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50"
            >
              {manageTeam.is_active ? "Deactivate Team" : "Activate Team"}
            </button>
          </div>
        </Modal>
      )}
    </>
  );
}

function Modal({
  title,
  children,
  onClose,
  wide,
}: {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
  wide?: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
        aria-label="Close"
      />
      <div
        className={`relative max-h-[90vh] w-full overflow-y-auto rounded-xl bg-white p-6 shadow-xl ${
          wide ? "max-w-3xl" : "max-w-md"
        }`}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900">{title}</h2>
          <button type="button" onClick={onClose}>
            <X className="h-5 w-5 text-gray-400" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
