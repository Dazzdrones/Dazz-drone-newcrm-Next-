import { Header } from "@/components/layout/Header";
import { CrmUsersManager } from "@/components/admin/CrmUsersManager";
import { listCrmRoles, listCrmUsers } from "@/lib/auth/admin-actions";
import {
  listAllPermissions,
  listModulesForRoles,
} from "@/lib/auth/rbac-actions";
import { requirePermission } from "@/lib/auth/permissions";

export const dynamic = "force-dynamic";

export default async function AdminUsersPage() {
  const session = await requirePermission("admin_users:manage");

  const [users, roles, permissions, modules] = await Promise.all([
    listCrmUsers(),
    listCrmRoles(),
    listAllPermissions(),
    listModulesForRoles(),
  ]);

  const moduleNames = Object.fromEntries(
    modules.map((m) => [m.key, m.name])
  );

  return (
    <>
      <Header
        title="CRM Users"
        subtitle="Create staff accounts, assign roles, and set individual permissions"
        showRefresh
      />
      <div className="p-8">
        <CrmUsersManager
          users={users}
          roles={roles}
          permissions={permissions}
          moduleNames={moduleNames}
          isSuperAdmin={session.isSuperAdmin}
          currentUserId={session.userId}
        />
      </div>
    </>
  );
}
