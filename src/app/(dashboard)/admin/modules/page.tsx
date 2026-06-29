import { Header } from "@/components/layout/Header";
import { CrmModulesManager } from "@/components/admin/CrmModulesManager";
import { listCrmModules } from "@/lib/auth/rbac-actions";
import { requirePermission } from "@/lib/auth/permissions";

export const dynamic = "force-dynamic";

export default async function AdminModulesPage() {
  await requirePermission("admin_modules:manage");

  const modules = await listCrmModules();

  return (
    <>
      <Header
        title="Modules"
        subtitle="Enable, disable, and reorder CRM modules"
        showRefresh
      />
      <div className="p-8">
        <CrmModulesManager modules={modules} />
      </div>
    </>
  );
}
