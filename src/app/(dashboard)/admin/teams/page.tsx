import { Header } from "@/components/layout/Header";
import { CrmTeamsManager } from "@/components/admin/CrmTeamsManager";
import { listCrmTeams, listCrmUsersForTeams } from "@/lib/auth/rbac-actions";
import { requirePermission } from "@/lib/auth/permissions";

export const dynamic = "force-dynamic";

export default async function AdminTeamsPage() {
  await requirePermission("admin_teams:manage");

  const [teams, users] = await Promise.all([
    listCrmTeams(),
    listCrmUsersForTeams(),
  ]);

  return (
    <>
      <Header
        title="Teams"
        subtitle="Create teams, assign members, and control module access"
        showRefresh
      />
      <div className="p-8">
        <CrmTeamsManager teams={teams} users={users} />
      </div>
    </>
  );
}
