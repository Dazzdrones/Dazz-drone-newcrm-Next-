import { Suspense } from "react";
import { Header } from "@/components/layout/Header";
import { TableToolbar } from "@/components/ui/TableToolbar";
import { MarkAllReadButton } from "@/components/ui/MarkAllReadButton";
import { MarkSeenOnVisit } from "@/components/ui/MarkSeenOnVisit";
import { AddManualBookingButton } from "@/components/booking/AddManualBookingButton";
import { TablePageContent } from "@/components/TablePageContent";
import { TableSkeleton } from "@/components/ui/TableSkeleton";
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

  return (
    <>
      {isTracked && <MarkSeenOnVisit table={table} />}
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
          {isTracked && <MarkAllReadButton table={table} unseenCount={0} />}
        </div>
        <Suspense
          key={`${table}-${page}-${q}-${sort}-${dir}`}
          fallback={<TableSkeleton />}
        >
          <TablePageContent
            table={table}
            page={page ?? 1}
            q={q ?? ""}
            sort={sort ?? ""}
            dir={dir ?? "desc"}
            basePath={path}
            canDelete={canDelete}
            canWrite={canWriteBookings}
          />
        </Suspense>
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
