import { Header } from "@/components/layout/Header";
import { DataTable } from "@/components/ui/DataTable";
import { TableToolbar } from "@/components/ui/TableToolbar";
import { MarkAllReadButton } from "@/components/ui/MarkAllReadButton";
import { AddManualBookingButton } from "@/components/booking/AddManualBookingButton";
import {
  fetchTablePage,
  getLatestHighlightId,
  getUnseenCount,
  markAllRecordsSeen,
} from "@/lib/actions";
import { DEFAULT_PAGE_SIZE } from "@/lib/constants";
import { parseTableQueryParams } from "@/lib/query-params";
import { TABLE_CONFIG, DELETABLE_TABLES, getDeletePermissionForTable, LEGACY_TABLES } from "@/lib/table-config";
import { SEEN_TRACKED_TABLES } from "@/lib/new-records";
import { TABLE_MODULE_MAP } from "@/lib/auth/nav-config";
import { getModulePermissions, hasPermission, requireModule } from "@/lib/auth/permissions";
import type { TableName } from "@/lib/types";

interface TablePageProps {
  table: TableName;
  searchParams?: Record<string, string | string[] | undefined>;
  basePath?: string;
}

export async function TablePage({
  table,
  searchParams = {},
  basePath,
}: TablePageProps) {
  const config = TABLE_CONFIG[table];
  const path = basePath ?? tableToPath(table);
  const { page, q, sort, dir } = parseTableQueryParams(searchParams);
  const isTracked = SEEN_TRACKED_TABLES.includes(table);

  const session = await requireModule(TABLE_MODULE_MAP[table]);
  const modulePerms = getModulePermissions(session, TABLE_MODULE_MAP[table]);
  const canDelete =
    DELETABLE_TABLES.includes(table) &&
    hasPermission(session, getDeletePermissionForTable(table));
  const canCreateBookings = table === "bookings" && modulePerms.create;
  const canWriteBookings = table === "bookings" && modulePerms.write;

  if (isTracked) {
    try {
      await markAllRecordsSeen(table);
    } catch {
      // Continue loading the table if marking fails (e.g. column not migrated yet)
    }
  }

  let result = {
    data: [] as Record<string, unknown>[],
    total: 0,
    page: 1,
    pageSize: DEFAULT_PAGE_SIZE,
    totalPages: 1,
  };

  try {
    result = await fetchTablePage(table, page, DEFAULT_PAGE_SIZE, {
      search: q,
      sort,
      sortDir: dir,
      searchableColumns: config.searchableColumns,
    });
  } catch {
    result = { ...result, page: page ?? 1 };
  }

  let unseenCount = 0;
  let latestHighlightId: string | null = null;

  try {
    if (isTracked) {
      unseenCount = await getUnseenCount(table);
    }
    latestHighlightId = await getLatestHighlightId(table);
  } catch {
    unseenCount = 0;
    latestHighlightId = null;
  }

  return (
    <>
      <Header
        title={config.label}
        subtitle={config.description}
        showRefresh={!LEGACY_TABLES.includes(table)}
      />
      <div className="p-8">
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <div className="min-w-0 flex-1">
            <TableToolbar basePath={path} q={q} sort={sort} dir={dir} />
          </div>
          {canCreateBookings && <AddManualBookingButton />}
          {isTracked && (
            <MarkAllReadButton table={table} unseenCount={unseenCount} />
          )}
        </div>
        <DataTable
          data={result.data}
          table={table}
          latestHighlightId={latestHighlightId}
          total={result.total}
          page={result.page}
          pageSize={result.pageSize}
          totalPages={result.totalPages}
          basePath={path}
          search={q}
          sort={sort}
          sortDir={dir}
          maxColumns={table === "bookings" ? 14 : 8}
          canDelete={canDelete}
          canWrite={canWriteBookings}
        />
      </div>
    </>
  );
}

function tableToPath(table: TableName): string {
  const paths: Record<TableName, string> = {
    booking_requests: "/booking-requests",
    bookings: "/bookings",
    callback_requests: "/callback-requests",
    contact_requests: "/contact-requests",
    career_applications: "/career-applications",
    enterprise_requests: "/enterprise-requests",
    pilot_requests: "/pilot-requests",
    drone_pilot_registrations: "/drone-pilot-registrations",
    for_businesses: "/for-businesses",
    users: "/users",
  };
  return paths[table];
}

export { tableToPath };
