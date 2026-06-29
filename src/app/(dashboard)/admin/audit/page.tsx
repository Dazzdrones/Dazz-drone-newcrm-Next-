import { Header } from "@/components/layout/Header";
import { CrmAuditTable } from "@/components/admin/CrmAuditTable";
import { listAuditLogs } from "@/lib/auth/rbac-actions";
import { requirePermission } from "@/lib/auth/permissions";

export const dynamic = "force-dynamic";

export default async function AdminAuditPage() {
  await requirePermission("admin_audit:read");

  const logs = await listAuditLogs(150);

  return (
    <>
      <Header
        title="Audit Log"
        subtitle="Track admin actions across the CRM"
        showRefresh
      />
      <div className="p-8">
        <CrmAuditTable logs={logs} />
      </div>
    </>
  );
}
