import { Header } from "@/components/layout/Header";
import { CrmRolesManager } from "@/components/admin/CrmRolesManager";
import {
  listAllPermissions,
  listCrmRolesDetailed,
  listModulesForRoles,
} from "@/lib/auth/rbac-actions";
import { requirePermission } from "@/lib/auth/permissions";

export const dynamic = "force-dynamic";

export default async function AdminRolesPage() {
  await requirePermission("admin_roles:manage");

  const [roles, permissions, modules] = await Promise.all([
    listCrmRolesDetailed(),
    listAllPermissions(),
    listModulesForRoles(),
  ]);

  const moduleNames = Object.fromEntries(
    modules.map((m) => [m.key, m.name])
  );

  return (
    <>
      <Header
        title="Roles & Permissions"
        subtitle="Choose a role and grant access by module"
        showRefresh
      />
      <div className="p-8">
        <CrmRolesManager
          roles={roles}
          permissions={permissions}
          moduleNames={moduleNames}
        />
      </div>
    </>
  );
}
