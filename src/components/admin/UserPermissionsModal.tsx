"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Ban, Check, Crown, RotateCcw, Save, Shield, X } from "lucide-react";
import {
  getUserPermissionDetails,
  saveUserPermissionOverrides,
  type PermissionOverrideState,
  type UserPermissionDetails,
} from "@/lib/auth/user-permissions-actions";
import {
  ACTION_META,
  getModuleMeta,
  groupPermissionsByModule,
  MODULE_GROUPS,
  sortModuleKeys,
  type PermissionMeta,
} from "@/lib/auth/permission-ui";
import type { CrmUserRow } from "@/lib/auth/admin-actions";

interface UserPermissionsModalProps {
  user: CrmUserRow;
  permissions: PermissionMeta[];
  moduleNames?: Record<string, string>;
  onClose: () => void;
}

function buildInitialStates(
  details: UserPermissionDetails,
  allKeys: string[]
): Record<string, PermissionOverrideState> {
  const states: Record<string, PermissionOverrideState> = {};

  for (const key of allKeys) {
    states[key] = details.overrides[key] ?? "inherit";
  }

  return states;
}

function isEffective(
  state: PermissionOverrideState,
  roleHas: boolean,
  teamHas: boolean
) {
  if (state === "grant") return true;
  if (state === "deny") return false;
  return roleHas || teamHas;
}

function nextState(
  current: PermissionOverrideState,
  roleHas: boolean,
  teamHas: boolean
): PermissionOverrideState {
  const inherited = roleHas || teamHas;
  if (inherited) {
    if (current === "inherit") return "deny";
    return "inherit";
  }
  if (current === "inherit") return "grant";
  if (current === "grant") return "inherit";
  return "inherit";
}

function permissionSource(roleHas: boolean, teamHas: boolean) {
  if (roleHas && teamHas) return "role and team";
  if (teamHas) return "team";
  if (roleHas) return "role";
  return null;
}

export function UserPermissionsModal({
  user,
  permissions,
  moduleNames = {},
  onClose,
}: UserPermissionsModalProps) {
  const router = useRouter();
  const mountedRef = useRef(false);
  const [loading, setLoading] = useState(true);
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [details, setDetails] = useState<UserPermissionDetails | null>(null);
  const [states, setStates] = useState<Record<string, PermissionOverrideState>>(
    {}
  );

  const permissionsByModule = useMemo(
    () => groupPermissionsByModule(permissions),
    [permissions]
  );

  const rolePermSet = useMemo(
    () => new Set(details?.rolePermissions ?? []),
    [details]
  );

  const teamPermSet = useMemo(
    () => new Set(details?.teamPermissions ?? []),
    [details]
  );

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    void (async () => {
      try {
        const data = await getUserPermissionDetails(user.id);
        if (!mountedRef.current) return;
        setDetails(data);
        setStates(
          buildInitialStates(
            data,
            permissions.map((p) => p.key)
          )
        );
      } catch (err) {
        if (mountedRef.current) {
          setError(err instanceof Error ? err.message : "Failed to load");
        }
      } finally {
        if (mountedRef.current) setLoading(false);
      }
    })();
  }, [user.id, permissions]);

  const effectiveCount = permissions.filter((p) =>
    isEffective(
      states[p.key] ?? "inherit",
      rolePermSet.has(p.key),
      teamPermSet.has(p.key)
    )
  ).length;

  function handleSave() {
    if (!details) return;
    setIsPending(true);
    setError(null);
    void (async () => {
      try {
        await saveUserPermissionOverrides(user.id, states);
        router.refresh();
        onClose();
      } catch (err) {
        if (mountedRef.current) {
          setError(err instanceof Error ? err.message : "Failed to save");
        }
      } finally {
        if (mountedRef.current) setIsPending(false);
      }
    })();
  }

  function handleReset() {
    if (!details) return;
    setStates(
      buildInitialStates(details, permissions.map((p) => p.key))
    );
  }

  const isSuperAdmin = details?.roleKey === "super_admin";

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
        aria-label="Close"
      />
      <div className="relative flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-xl bg-white shadow-xl">
        <div className="flex items-start justify-between border-b border-gray-100 px-6 py-4">
          <div>
            <h2 className="text-lg font-bold text-gray-900">User Permissions</h2>
            <p className="mt-0.5 text-sm text-gray-500">
              {user.full_name || user.email} · Role:{" "}
              <span className="font-medium text-gray-700">{user.role_name}</span>
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-gray-400 hover:bg-gray-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {error && (
          <p className="mx-6 mt-4 rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </p>
        )}

        <div className="flex-1 overflow-y-auto px-6 py-4">
          {loading ? (
            <p className="py-12 text-center text-sm text-gray-500">Loading…</p>
          ) : isSuperAdmin ? (
            <div className="rounded-xl border border-amber-100 bg-amber-50 px-6 py-8 text-center">
              <Crown className="mx-auto mb-3 h-8 w-8 text-amber-600" />
              <p className="font-medium text-gray-900">Super Admin</p>
              <p className="mt-1 text-sm text-gray-500">
                Super admins have all permissions. Use a different role to customize
                access per user.
              </p>
            </div>
          ) : (
            <>
              <div className="mb-4 rounded-lg border border-sky-100 bg-sky-50 px-4 py-3 text-sm text-sky-900">
                <p className="font-medium">How overrides work</p>
                <p className="mt-1 text-sky-800/80">
                  Permissions come from the user&apos;s <strong>role</strong> and{" "}
                  <strong>team</strong> memberships. Click any permission to{" "}
                  <strong>deny</strong> it for this user only — including access
                  granted by a team — or <strong>grant</strong> extra access.
                </p>
              </div>

              {(details?.teamPermissions.length ?? 0) > 0 && (
                <div className="mb-4 rounded-lg border border-violet-100 bg-violet-50 px-4 py-3 text-sm text-violet-900">
                  <p className="font-medium">Team access detected</p>
                  <p className="mt-1 text-violet-800/80">
                    This user receives {details!.teamPermissions.length} permission
                    {details!.teamPermissions.length === 1 ? "" : "s"} from team
                    module access. Deny them below to revoke for this user only.
                  </p>
                </div>
              )}

              <div className="mb-4 flex items-center justify-between">
                <p className="text-sm text-gray-600">
                  <span className="font-semibold text-[#34AADC]">
                    {effectiveCount}
                  </span>{" "}
                  of {permissions.length} permissions effective
                </p>
                <div className="flex flex-wrap gap-3 text-xs text-gray-500">
                  <span className="inline-flex items-center gap-1">
                    <span className="h-2 w-2 rounded-full bg-gray-300" /> From role
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <span className="h-2 w-2 rounded-full bg-violet-400" /> From
                    team
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <span className="h-2 w-2 rounded-full bg-emerald-500" /> Granted
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <span className="h-2 w-2 rounded-full bg-red-500" /> Denied
                  </span>
                </div>
              </div>

              <div className="space-y-6">
                {MODULE_GROUPS.map((group) => {
                  const moduleKeys = sortModuleKeys(
                    [...permissionsByModule.keys()].filter(
                      (key) => getModuleMeta(key).group === group.key
                    )
                  );
                  if (moduleKeys.length === 0) return null;

                  return (
                    <div key={group.key}>
                      <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-400">
                        {group.label}
                      </h3>
                      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                        {moduleKeys.map((moduleKey) => {
                          const perms = permissionsByModule.get(moduleKey) ?? [];
                          const meta = getModuleMeta(moduleKey);
                          const Icon = meta.icon;
                          const displayName =
                            moduleNames[moduleKey] ?? meta.name;

                          const moduleHasInherited = perms.some(
                            (p) =>
                              rolePermSet.has(p.key) || teamPermSet.has(p.key)
                          );

                          return (
                            <div
                              key={moduleKey}
                              className="rounded-xl border border-gray-100 bg-gray-50/50 p-4"
                            >
                              <div className="mb-3 flex items-start justify-between gap-2">
                                <div className="flex items-center gap-2.5">
                                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-[#34AADC] shadow-sm ring-1 ring-gray-100">
                                    <Icon className="h-4 w-4" />
                                  </span>
                                  <p className="text-sm font-semibold text-gray-900">
                                    {displayName}
                                  </p>
                                </div>
                                {moduleHasInherited && (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setStates((prev) => {
                                        const next = { ...prev };
                                        for (const perm of perms) {
                                          if (
                                            rolePermSet.has(perm.key) ||
                                            teamPermSet.has(perm.key)
                                          ) {
                                            next[perm.key] = "deny";
                                          }
                                        }
                                        return next;
                                      })
                                    }
                                    className="shrink-0 text-[10px] font-medium text-red-600 hover:underline"
                                  >
                                    Revoke module
                                  </button>
                                )}
                              </div>
                              <div className="flex flex-wrap gap-2">
                                {perms.map((perm) => {
                                  const roleHas = rolePermSet.has(perm.key);
                                  const teamHas = teamPermSet.has(perm.key);
                                  const state = states[perm.key] ?? "inherit";
                                  const active = isEffective(
                                    state,
                                    roleHas,
                                    teamHas
                                  );
                                  const source = permissionSource(
                                    roleHas,
                                    teamHas
                                  );
                                  const actionMeta = ACTION_META[perm.action] ?? {
                                    label: perm.action,
                                    icon: Shield,
                                    color: "",
                                    activeColor: "",
                                  };
                                  const ActionIcon = actionMeta.icon;

                                  let pillClass =
                                    "border-slate-200 bg-white text-slate-500 hover:border-slate-300";
                                  if (state === "grant") {
                                    pillClass =
                                      "border-emerald-300 bg-emerald-100 text-emerald-800 ring-1 ring-emerald-200";
                                  } else if (state === "deny") {
                                    pillClass =
                                      "border-red-300 bg-red-100 text-red-800 ring-1 ring-red-200 line-through";
                                  } else if (active && teamHas && !roleHas) {
                                    pillClass =
                                      "border-violet-300 bg-violet-100 text-violet-800";
                                  } else if (active) {
                                    pillClass =
                                      "border-slate-300 bg-slate-100 text-slate-700";
                                  }

                                  return (
                                    <button
                                      key={perm.key}
                                      type="button"
                                      title={
                                        state === "inherit"
                                          ? source
                                            ? `From ${source} — click to deny`
                                            : "Not assigned — click to grant"
                                          : state === "grant"
                                            ? "Granted — click to reset"
                                            : "Denied — click to reset"
                                      }
                                      onClick={() =>
                                        setStates((prev) => ({
                                          ...prev,
                                          [perm.key]: nextState(
                                            prev[perm.key] ?? "inherit",
                                            roleHas,
                                            teamHas
                                          ),
                                        }))
                                      }
                                      className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-all ${pillClass}`}
                                    >
                                      {state === "grant" && (
                                        <Check className="h-3 w-3" />
                                      )}
                                      {state === "deny" && (
                                        <Ban className="h-3 w-3" />
                                      )}
                                      {state === "inherit" && active && (
                                        <ActionIcon className="h-3 w-3 opacity-60" />
                                      )}
                                      {actionMeta.label}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>

        {!loading && !isSuperAdmin && (
          <div className="flex items-center justify-between gap-3 border-t border-gray-100 px-6 py-4">
            <div className="flex gap-2">
              <button
                type="button"
                disabled={isPending}
                onClick={handleSave}
                className="inline-flex items-center gap-2 rounded-lg bg-[#34AADC] px-4 py-2 text-sm font-semibold text-white hover:bg-[#2B94C5] disabled:opacity-50"
              >
                <Save className="h-4 w-4" />
                {isPending ? "Saving…" : "Save Overrides"}
              </button>
              <button
                type="button"
                disabled={isPending}
                onClick={handleReset}
                className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-50"
              >
                <RotateCcw className="h-4 w-4" />
                Reset
              </button>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="text-sm font-medium text-gray-500 hover:text-gray-700"
            >
              Cancel
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
