import { redirect } from "next/navigation";
import { Sidebar } from "@/components/layout/Sidebar";
import { DashboardLiveUpdates } from "@/components/layout/DashboardLiveUpdates";
import { getNavBadgeCounts } from "@/lib/actions";
import { getAuthSession, getAuthUser } from "@/lib/auth/session";
import { createSessionClient } from "@/lib/supabase/session";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getAuthUser();
  if (!user) redirect("/login");

  const session = await getAuthSession();
  if (!session) {
    const supabase = await createSessionClient();
    await supabase.auth.signOut();
    redirect("/login?error=no_profile");
  }

  let badgeCounts: Record<string, number> = {};
  try {
    badgeCounts = await getNavBadgeCounts();
  } catch {
    badgeCounts = {};
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardLiveUpdates />
      <Sidebar
        badgeCounts={badgeCounts}
        permissions={session.permissions}
        isSuperAdmin={session.isSuperAdmin}
        user={{
          fullName: session.profile.full_name,
          email: session.email,
          roleName: session.profile.role?.name ?? "Staff",
        }}
      />
      <main className="ml-64 min-h-screen">{children}</main>
    </div>
  );
}
