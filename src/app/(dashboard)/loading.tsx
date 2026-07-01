import { PageLoadingShell } from "@/components/ui/PageLoadingShell";

export default function DashboardLoading() {
  return (
    <PageLoadingShell
      title="Dashboard"
      subtitle="Total row counts from each Supabase table"
      variant="dashboard"
    />
  );
}
