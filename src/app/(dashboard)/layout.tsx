import { redirect } from "next/navigation";
import { Sidebar } from "@/components/layout/Sidebar";
import { DashboardLiveUpdates } from "@/components/layout/DashboardLiveUpdates";
import { getCachedNavBadgeCounts } from "@/lib/cached-queries";
import { getAuthSession } from "@/lib/auth/session";
import { createSessionClient } from "@/lib/supabase/session";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [session, badgeCounts] = await Promise.all([
    getAuthSession(),
    getCachedNavBadgeCounts().catch(() => ({} as Record<string, number>)),
  ]);

  if (!session) {
    const supabase = await createSessionClient();
    await supabase.auth.signOut();
    redirect("/login?error=no_profile");
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
