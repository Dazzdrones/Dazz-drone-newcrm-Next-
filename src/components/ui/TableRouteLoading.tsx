import { PageLoadingShell } from "@/components/ui/PageLoadingShell";
import { TABLE_CONFIG } from "@/lib/table-config";
import type { TableName } from "@/lib/types";

export function TableRouteLoading({ table }: { table: TableName }) {
  const config = TABLE_CONFIG[table];
  return (
    <PageLoadingShell
      title={config.label}
      subtitle={config.description}
      variant="table"
    />
  );
}
