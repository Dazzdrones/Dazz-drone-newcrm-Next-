import { PageLoadingShell } from "@/components/ui/PageLoadingShell";

export default function Loading() {
  return (
    <PageLoadingShell
      title="Audit Log"
      subtitle="Recent permission and admin changes"
      variant="admin"
    />
  );
}
