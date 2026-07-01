"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Crown,
  Plus,
  RotateCcw,
  Save,
  Shield,
  Trash2,
  X,
} from "lucide-react";
import {
  createCrmRole,
  deleteCrmRole,
  setRolePermissions,
  type CrmRoleDetail,
} from "@/lib/auth/rbac-actions";
import {
  groupPermissionsByModule,
  type PermissionMeta,
} from "@/lib/auth/permission-ui";
import { RolePermissionMatrix } from "@/components/admin/PermissionMatrix";

interface CrmRolesManagerProps {
  roles: CrmRoleDetail[];
  permissions: PermissionMeta[];
  moduleNames?: Record<string, string>;
}

export function CrmRolesManager({
  roles,
  permissions,
  moduleNames = {},
}: CrmRolesManagerProps) {
  const router = useRouter();
  const mountedRef = useRef(false);
  const pendingRoleIdRef = useRef<string | null>(null);
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [newRole, setNewRole] = useState({ key: "", name: "", description: "" });
  const [draftPerms, setDraftPerms] = useState<Record<string, Set<string>>>({});

  const defaultRoleId = useMemo(
    () =>
      roles.find((r) => r.key === "admin")?.id ??
      roles.find((r) => r.key !== "super_admin")?.id ??
      roles[0]?.id ??
      null,
    [roles]
  );

  const [selectedRoleId, setSelectedRoleId] = useState<string | null>(
    defaultRoleId
  );

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (pendingRoleIdRef.current) {
      if (roles.some((role) => role.id === pendingRoleIdRef.current)) {
        pendingRoleIdRef.current = null;
      }
      return;
    }
    if (!roles.length) return;
    if (selectedRoleId && roles.some((role) => role.id === selectedRoleId)) return;
    setSelectedRoleId(defaultRoleId);
  }, [roles, selectedRoleId, defaultRoleId]);

  function safeUpdate(fn: () => void) {
    if (mountedRef.current) fn();
  }

  const permissionsByModule = useMemo(
    () => groupPermissionsByModule(permissions),
    [permissions]
  );

  const selectedRole = roles.find((r) => r.id === selectedRoleId) ?? null;

  function getDraft(role: CrmRoleDetail) {
    return draftPerms[role.id] ?? new Set(role.permission_keys);
  }

  function hasUnsavedChanges(role: CrmRoleDetail) {
    const draft = getDraft(role);
    const original = new Set(role.permission_keys);
    if (draft.size !== original.size) return true;
    for (const key of draft) {
      if (!original.has(key)) return true;
    }
    return false;
  }

  function setDraft(roleId: string, next: Set<string>) {
    setDraftPerms((prev) => ({ ...prev, [roleId]: next }));
    setSuccess(null);
  }

  function togglePerm(role: CrmRoleDetail, permKey: string) {
    const set = new Set(getDraft(role));
    if (set.has(permKey)) set.delete(permKey);
    else set.add(permKey);
    setDraft(role.id, set);
  }

  function toggleModule(role: CrmRoleDetail, moduleKey: string, enable: boolean) {
    const set = new Set(getDraft(role));
    const modulePerms = permissionsByModule.get(moduleKey) ?? [];
    for (const perm of modulePerms) {
      if (enable) set.add(perm.key);
      else set.delete(perm.key);
    }
    setDraft(role.id, set);
  }

  function resetDraft(role: CrmRoleDetail) {
    setDraftPerms((prev) => {
      const next = { ...prev };
      delete next[role.id];
      return next;
    });
    setSuccess(null);
  }

  function saveRole(role: CrmRoleDetail) {
    setIsPending(true);
    void (async () => {
      try {
        await setRolePermissions(role.id, [...getDraft(role)]);
        safeUpdate(() => {
          setError(null);
          setSuccess(`Permissions saved for ${role.name}`);
          setDraftPerms((prev) => {
            const next = { ...prev };
            delete next[role.id];
            return next;
          });
        });
        router.refresh();
      } catch (err) {
        safeUpdate(() => {
          setError(err instanceof Error ? err.message : "Failed to save");
        });
      } finally {
        safeUpdate(() => setIsPending(false));
      }
    })();
  }

  function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setIsPending(true);
    void (async () => {
      try {
        const result = await createCrmRole(newRole);
        safeUpdate(() => {
          setCreateOpen(false);
          setNewRole({ key: "", name: "", description: "" });
          setError(null);
          if (result.id) {
            pendingRoleIdRef.current = result.id;
            setSelectedRoleId(result.id);
          }
        });
        router.refresh();
      } catch (err) {
        safeUpdate(() => {
          setError(err instanceof Error ? err.message : "Failed to create role");
        });
      } finally {
        safeUpdate(() => setIsPending(false));
      }
    })();
  }

  const totalPermissions = permissions.length;

  return (
    <>
      {error && (
        <p className="mb-4 rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      )}

      {success && (
        <p className="mb-4 rounded-lg border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {success}
        </p>
      )}

      <div className="space-y-4">
        {/* Role tabs — horizontal */}
        <div className="flex flex-wrap items-center gap-2">
          {roles.map((role) => {
            const isSelected = selectedRoleId === role.id;
            const isSuperAdmin = role.key === "super_admin";
            const count = isSuperAdmin
              ? totalPermissions
              : getDraft(role).size;
            const dirty = !isSuperAdmin && hasUnsavedChanges(role);

            return (
              <button
                key={role.id}
                type="button"
                onClick={() => {
                  setSelectedRoleId(role.id);
                  setSuccess(null);
                }}
                className={`inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm transition-all ${
                  isSelected
                    ? "border-[#34AADC] bg-[#34AADC]/10 text-gray-900 shadow-sm ring-1 ring-[#34AADC]/30"
                    : "border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50"
                }`}
              >
                <span
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${
                    isSuperAdmin
                      ? "bg-amber-100 text-amber-700"
                      : "bg-slate-100 text-slate-600"
                  }`}
                >
                  {isSuperAdmin ? (
                    <Crown className="h-3.5 w-3.5" />
                  ) : (
                    <Shield className="h-3.5 w-3.5" />
                  )}
                </span>
                <span className="font-medium">{role.name}</span>
                <span className="text-xs text-gray-400">
                  {count}/{totalPermissions}
                </span>
                {dirty && (
                  <span className="h-2 w-2 shrink-0 rounded-full bg-amber-400" />
                )}
              </button>
            );
          })}

          <button
            type="button"
            onClick={() => setCreateOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-xl border border-dashed border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-500 transition-colors hover:border-[#34AADC] hover:text-[#34AADC]"
          >
            <Plus className="h-4 w-4" />
            Custom Role
          </button>
        </div>

        {/* Permission editor — full width */}
        <section className="min-w-0">
          {!selectedRole ? (
            <div className="flex h-64 items-center justify-center rounded-xl border border-dashed border-gray-200 bg-white text-sm text-gray-500">
              Select a role to manage permissions
            </div>
          ) : selectedRole.key === "super_admin" ? (
            <SuperAdminPanel total={totalPermissions} />
          ) : (
            <PermissionEditor
              role={selectedRole}
              permissionsByModule={permissionsByModule}
              moduleNames={moduleNames}
              draft={getDraft(selectedRole)}
              isPending={isPending}
              isDirty={hasUnsavedChanges(selectedRole)}
              onToggle={(key) => togglePerm(selectedRole, key)}
              onToggleModule={(moduleKey, enable) =>
                toggleModule(selectedRole, moduleKey, enable)
              }
              onSave={() => saveRole(selectedRole)}
              onReset={() => resetDraft(selectedRole)}
              onDelete={() => {
                setIsPending(true);
                void (async () => {
                  try {
                    await deleteCrmRole(selectedRole.id);
                    safeUpdate(() => {
                      setSelectedRoleId(defaultRoleId);
                      setError(null);
                    });
                    router.refresh();
                  } catch (err) {
                    safeUpdate(() => {
                      setError(
                        err instanceof Error ? err.message : "Failed to delete"
                      );
                    });
                  } finally {
                    safeUpdate(() => setIsPending(false));
                  }
                })();
              }}
            />
          )}
        </section>
      </div>

      {createOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <button
            type="button"
            className="absolute inset-0 bg-black/40"
            onClick={() => setCreateOpen(false)}
            aria-label="Close"
          />
          <form
            onSubmit={handleCreate}
            className="relative w-full max-w-md space-y-4 rounded-xl bg-white p-6 shadow-xl"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">
                Create Custom Role
              </h2>
              <button
                type="button"
                onClick={() => setCreateOpen(false)}
                className="rounded-lg p-1 text-gray-400 hover:bg-gray-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <Field label="Role key" required hint="Lowercase identifier, e.g. sales">
              <input
                required
                placeholder="sales"
                value={newRole.key}
                onChange={(e) =>
                  setNewRole((r) => ({ ...r, key: e.target.value }))
                }
                className={inputClass}
              />
            </Field>
            <Field label="Display name" required>
              <input
                required
                placeholder="Sales Team"
                value={newRole.name}
                onChange={(e) =>
                  setNewRole((r) => ({ ...r, name: e.target.value }))
                }
                className={inputClass}
              />
            </Field>
            <Field label="Description">
              <textarea
                placeholder="What this role is for..."
                value={newRole.description}
                onChange={(e) =>
                  setNewRole((r) => ({ ...r, description: e.target.value }))
                }
                rows={2}
                className={inputClass}
              />
            </Field>
            <button
              type="submit"
              disabled={isPending}
              className="w-full rounded-lg bg-[#34AADC] py-2.5 text-sm font-semibold text-white hover:bg-[#2B94C5] disabled:opacity-50"
            >
              {isPending ? "Creating..." : "Create Role"}
            </button>
          </form>
        </div>
      )}
    </>
  );
}

function SuperAdminPanel({ total }: { total: number }) {
  return (
    <div className="overflow-hidden rounded-xl border border-amber-100 bg-gradient-to-br from-amber-50 to-white shadow-sm">
      <div className="border-b border-amber-100 px-6 py-5">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
            <Crown className="h-5 w-5" />
          </span>
          <div>
            <h2 className="text-lg font-bold text-gray-900">Super Admin</h2>
            <p className="text-sm text-gray-500">
              Full unrestricted access to every module and setting
            </p>
          </div>
        </div>
      </div>
      <div className="px-6 py-8 text-center">
        <p className="text-3xl font-bold text-amber-700">{total}</p>
        <p className="mt-1 text-sm text-gray-500">permissions granted automatically</p>
        <p className="mx-auto mt-4 max-w-sm text-xs text-gray-400">
          Super admin permissions are locked and cannot be edited. Use the Admin
          role for day-to-day staff with limited access.
        </p>
      </div>
    </div>
  );
}

function PermissionEditor({
  role,
  permissionsByModule,
  moduleNames,
  draft,
  isPending,
  isDirty,
  onToggle,
  onToggleModule,
  onSave,
  onReset,
  onDelete,
}: {
  role: CrmRoleDetail;
  permissionsByModule: Map<string, PermissionMeta[]>;
  moduleNames: Record<string, string>;
  draft: Set<string>;
  isPending: boolean;
  isDirty: boolean;
  onToggle: (key: string) => void;
  onToggleModule: (moduleKey: string, enable: boolean) => void;
  onSave: () => void;
  onReset: () => void;
  onDelete: () => void;
}) {
  const total = [...permissionsByModule.values()].flat().length;
  const enabled = draft.size;
  const pct = total ? Math.round((enabled / total) * 100) : 0;

  return (
    <div className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
      <div className="border-b border-gray-100 px-6 py-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-gray-900">{role.name}</h2>
              {role.is_system && (
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-600">
                  System
                </span>
              )}
            </div>
            {role.description && (
              <p className="mt-1 text-sm text-gray-500">{role.description}</p>
            )}
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-[#34AADC]">{enabled}</p>
            <p className="text-xs text-gray-500">of {total} permissions</p>
          </div>
        </div>
        <div className="mt-4">
          <div className="mb-1 flex justify-between text-xs text-gray-500">
            <span>Access coverage</span>
            <span>{pct}%</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-gray-100">
            <div
              className="h-full rounded-full bg-[#34AADC] transition-all duration-300"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      </div>

      <div className="px-6 py-6">
        <RolePermissionMatrix
          permissionsByModule={permissionsByModule}
          moduleNames={moduleNames}
          enabled={draft}
          onToggle={onToggle}
          onToggleModule={onToggleModule}
        />
      </div>

      {/* Footer actions */}
      <div className="sticky bottom-0 flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 bg-white/95 px-6 py-4 backdrop-blur">
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={isPending || !isDirty}
            onClick={onSave}
            className="inline-flex items-center gap-2 rounded-lg bg-[#34AADC] px-4 py-2 text-sm font-semibold text-white hover:bg-[#2B94C5] disabled:opacity-40"
          >
            <Save className="h-4 w-4" />
            {isPending ? "Saving..." : "Save Changes"}
          </button>
          <button
            type="button"
            disabled={isPending || !isDirty}
            onClick={onReset}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-40"
          >
            <RotateCcw className="h-4 w-4" />
            Reset
          </button>
        </div>
        {!role.is_system && (
          <button
            type="button"
            disabled={isPending}
            onClick={onDelete}
            className="inline-flex items-center gap-2 rounded-lg border border-red-200 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-40"
          >
            <Trash2 className="h-4 w-4" />
            Delete Role
          </button>
        )}
      </div>
    </div>
  );
}

function Field({
  label,
  children,
  required,
  hint,
}: {
  label: string;
  children: React.ReactNode;
  required?: boolean;
  hint?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500">
        {label}
        {required && <span className="text-red-500"> *</span>}
      </span>
      {hint && <span className="mb-1.5 block text-xs text-gray-400">{hint}</span>}
      {children}
    </label>
  );
}

const inputClass =
  "w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-[#34AADC] focus:outline-none focus:ring-1 focus:ring-[#34AADC]";
