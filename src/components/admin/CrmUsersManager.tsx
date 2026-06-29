"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Shield, Trash2, X } from "lucide-react";
import {
  createCrmUser,
  deleteCrmUser,
  updateCrmUser,
  type CrmUserRow,
} from "@/lib/auth/admin-actions";
import { UserPermissionsModal } from "@/components/admin/UserPermissionsModal";
import type { PermissionMeta } from "@/lib/auth/permission-ui";

interface Role {
  id: string;
  key: string;
  name: string;
  is_system: boolean;
}

interface CrmUsersManagerProps {
  users: CrmUserRow[];
  roles: Role[];
  permissions: PermissionMeta[];
  moduleNames?: Record<string, string>;
  isSuperAdmin: boolean;
  currentUserId: string;
}

export function CrmUsersManager({
  users,
  roles,
  permissions,
  moduleNames = {},
  isSuperAdmin,
  currentUserId,
}: CrmUsersManagerProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [permissionsUser, setPermissionsUser] = useState<CrmUserRow | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [form, setForm] = useState({
    email: "",
    password: "",
    full_name: "",
    role_id: roles.find((r) => r.key === "admin")?.id ?? roles[0]?.id ?? "",
  });

  const assignableRoles = isSuperAdmin
    ? roles
    : roles.filter((r) => r.key !== "super_admin");

  const defaultRoleId =
    assignableRoles.find((r) => r.key === "admin")?.id ??
    assignableRoles[0]?.id ??
    "";

  function openCreateModal() {
    setError(null);
    setForm({
      email: "",
      password: "",
      full_name: "",
      role_id: defaultRoleId,
    });
    setOpen(true);
  }

  function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    startTransition(async () => {
      try {
        await createCrmUser(form);
        setOpen(false);
        setForm({
          email: "",
          password: "",
          full_name: "",
          role_id: defaultRoleId,
        });
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to create user");
      }
    });
  }

  function toggleActive(user: CrmUserRow) {
    startTransition(async () => {
      try {
        await updateCrmUser(user.id, { is_active: !user.is_active });
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to update user");
      }
    });
  }

  function handleDelete(user: CrmUserRow) {
    const label = user.full_name || user.email;
    if (
      !confirm(
        `Delete user "${label}"? This removes their login and cannot be undone.`
      )
    ) {
      return;
    }

    startTransition(async () => {
      try {
        await deleteCrmUser(user.id);
        setError(null);
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to delete user");
      }
    });
  }

  function canDeleteUser(user: CrmUserRow) {
    return (
      user.id !== currentUserId &&
      user.role_key !== "super_admin"
    );
  }

  return (
    <>
      <div className="mb-4 flex justify-end">
        <button
          type="button"
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 rounded-lg bg-[#34AADC] px-4 py-2 text-sm font-semibold text-white hover:bg-[#2B94C5]"
        >
          <Plus className="h-4 w-4" />
          Create User
        </button>
      </div>

      {error && !open && (
        <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      <div className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Created</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {users.map((user) => (
              <tr key={user.id} className="hover:bg-blue-50/30">
                <td className="px-4 py-3 font-medium text-gray-900">
                  {user.full_name || "—"}
                </td>
                <td className="px-4 py-3 text-gray-700">{user.email}</td>
                <td className="px-4 py-3 text-gray-700">{user.role_name}</td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                      user.is_active
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {user.is_active ? "Active" : "Inactive"}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-500">
                  {new Date(user.created_at).toLocaleDateString()}
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="inline-flex items-center justify-end gap-2">
                    {user.role_key !== "super_admin" && (
                      <button
                        type="button"
                        disabled={isPending}
                        onClick={() => setPermissionsUser(user)}
                        className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs font-medium text-gray-600 hover:border-[#34AADC] hover:text-[#34AADC] disabled:opacity-40"
                      >
                        <Shield className="h-3.5 w-3.5" />
                        Permissions
                      </button>
                    )}
                    <button
                      type="button"
                      disabled={isPending || user.role_key === "super_admin"}
                      onClick={() => toggleActive(user)}
                      className="text-sm font-medium text-[#34AADC] hover:underline disabled:opacity-40"
                    >
                      {user.is_active ? "Deactivate" : "Activate"}
                    </button>
                    {canDeleteUser(user) && (
                      <button
                        type="button"
                        disabled={isPending}
                        onClick={() => handleDelete(user)}
                        title="Delete user"
                        className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600 disabled:opacity-40"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {open && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <button
            type="button"
            className="absolute inset-0 bg-black/40"
            onClick={() => setOpen(false)}
            aria-label="Close"
          />
          <div className="relative max-h-[90vh] w-full max-w-md overflow-y-auto rounded-xl bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">Create CRM User</h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {error && (
              <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
                {error}
              </p>
            )}

            <form onSubmit={handleCreate} className="space-y-4">
              <Field label="Full name" required>
                <input
                  required
                  placeholder="John Smith"
                  value={form.full_name}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, full_name: e.target.value }))
                  }
                  className={inputClass}
                />
              </Field>
              <Field label="Email" required>
                <input
                  required
                  type="email"
                  placeholder="user@company.com"
                  value={form.email}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, email: e.target.value }))
                  }
                  className={inputClass}
                />
              </Field>
              <Field label="Password" required>
                <input
                  required
                  type="password"
                  minLength={8}
                  placeholder="Minimum 8 characters"
                  value={form.password}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, password: e.target.value }))
                  }
                  className={inputClass}
                />
              </Field>
              <Field label="Role" required>
                {assignableRoles.length === 0 ? (
                  <p className="text-sm text-red-600">No roles available.</p>
                ) : (
                  <select
                    required
                    value={form.role_id}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, role_id: e.target.value }))
                    }
                    className={selectClass}
                  >
                    {assignableRoles.map((role) => (
                      <option key={role.id} value={role.id}>
                        {role.name}
                      </option>
                    ))}
                  </select>
                )}
              </Field>
              <button
                type="submit"
                disabled={isPending || !form.role_id}
                className="w-full rounded-lg bg-[#34AADC] py-2.5 text-sm font-semibold text-white hover:bg-[#2B94C5] disabled:opacity-50"
              >
                {isPending ? "Creating..." : "Create User"}
              </button>
            </form>
          </div>
        </div>
      )}

      {permissionsUser && (
        <UserPermissionsModal
          user={permissionsUser}
          permissions={permissions}
          moduleNames={moduleNames}
          onClose={() => setPermissionsUser(null)}
        />
      )}
    </>
  );
}

function Field({
  label,
  children,
  required,
}: {
  label: string;
  children: React.ReactNode;
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500">
        {label}
        {required && <span className="text-red-500"> *</span>}
      </span>
      {children}
    </label>
  );
}

const inputClass =
  "w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-[#34AADC] focus:outline-none focus:ring-1 focus:ring-[#34AADC]";

const selectClass =
  "w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 focus:border-[#34AADC] focus:outline-none focus:ring-1 focus:ring-[#34AADC] [color-scheme:light]";

