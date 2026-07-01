import { PageLoadingShell } from "@/components/ui/PageLoadingShell";

export default function Loading() {
  return (
    <PageLoadingShell
      title="CRM Users"
      subtitle="Manage staff accounts and access"
      variant="admin"
    />
  );
}
