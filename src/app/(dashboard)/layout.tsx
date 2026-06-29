import { Sidebar } from "@/components/layout/Sidebar";
import { DashboardLiveUpdates } from "@/components/layout/DashboardLiveUpdates";
import { getNavBadgeCounts } from "@/lib/actions";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let badgeCounts: Record<string, number> = {};
  try {
    badgeCounts = await getNavBadgeCounts();
  } catch {
    badgeCounts = {};
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardLiveUpdates />
      <Sidebar badgeCounts={badgeCounts} />
      <main className="ml-64 min-h-screen">{children}</main>
    </div>
  );
}
