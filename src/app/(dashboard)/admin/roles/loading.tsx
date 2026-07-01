import { PageLoadingShell } from "@/components/ui/PageLoadingShell";

export default function Loading() {
  return (
    <PageLoadingShell
      title="Roles & Permissions"
      subtitle="Manage CRM roles and their permissions"
      variant="admin"
    />
  );
}
