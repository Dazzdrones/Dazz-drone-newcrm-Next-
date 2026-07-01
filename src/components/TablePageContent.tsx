import { DataTable } from "@/components/ui/DataTable";
import {
  fetchTablePage,
  getLatestHighlightId,
} from "@/lib/actions";
import { DEFAULT_PAGE_SIZE } from "@/lib/constants";
import { TABLE_CONFIG } from "@/lib/table-config";
import type { TableName } from "@/lib/types";

interface TablePageContentProps {
  table: TableName;
  page: number;
  q: string;
  sort: string;
  dir: "asc" | "desc";
  basePath: string;
  canDelete: boolean;
  canWrite: boolean;
}

export async function TablePageContent({
  table,
  page,
  q,
  sort,
  dir,
  basePath,
  canDelete,
  canWrite,
}: TablePageContentProps) {
  const config = TABLE_CONFIG[table];

  const [result, latestHighlightId] = await Promise.all([
    fetchTablePage(table, page, DEFAULT_PAGE_SIZE, {
      search: q,
      sort,
      sortDir: dir,
      searchableColumns: config.searchableColumns,
    }).catch(() => ({
      data: [] as Record<string, unknown>[],
      total: 0,
      page: page ?? 1,
      pageSize: DEFAULT_PAGE_SIZE,
      totalPages: 1,
    })),
    getLatestHighlightId(table).catch(() => null),
  ]);

  return (
    <DataTable
      data={result.data}
      table={table}
      latestHighlightId={latestHighlightId}
      total={result.total}
      page={result.page}
      pageSize={result.pageSize}
      totalPages={result.totalPages}
      basePath={basePath}
      search={q}
      sort={sort}
      sortDir={dir}
      maxColumns={table === "bookings" ? 14 : 8}
      canDelete={canDelete}
      canWrite={canWrite}
    />
  );
}
