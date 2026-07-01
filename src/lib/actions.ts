"use server";

import { revalidatePath, updateTag } from "next/cache";
import { createServerClient } from "@/lib/supabase/server";
import { DEFAULT_PAGE_SIZE } from "@/lib/constants";
import { mapBookingRequestToBooking } from "@/lib/utils";
import { SEEN_TRACKED_TABLES, TABLE_TO_PATH } from "@/lib/new-records";
import { HIGHLIGHT_TABLES } from "@/lib/latest-highlight";
import {
  DASHBOARD_STATS_TAG,
  NAV_BADGE_COUNTS_TAG,
} from "@/lib/cache-tags";
import {
  getCachedDashboardStats,
  getCachedNavBadgeCounts,
} from "@/lib/cached-queries";
import { requirePermission, assertPermission, hasPermission, canAccessModule } from "@/lib/auth/permissions";
import type { AuthSession } from "@/lib/auth/types";
import { TABLE_MODULE_MAP } from "@/lib/auth/nav-config";
import { DELETABLE_TABLES, getDeletePermissionForTable, CRM_TABLES } from "@/lib/table-config";
import type { BookingRequestStatus, BookingStatus, TableName } from "@/lib/types";

const ORDER_COLUMNS = ["created_at", "updated_at", "id"];

export interface PaginatedResult {
  data: Record<string, unknown>[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export async function updateBookingRequest(
  id: string,
  updates: Record<string, unknown>
) {
  const hasStatus = "status" in updates;
  const hasOtherFields = Object.keys(updates).some((key) => key !== "status");

  if (hasStatus) {
    await assertPermission("booking_requests:convert");
  }
  if (hasOtherFields) {
    await assertPermission("booking_requests:write");
  }

  const supabase = createServerClient();

  const { error } = await supabase
    .from("booking_requests")
    .update(updates)
    .eq("id", id);

  if (error) throw new Error(error.message);

  revalidatePath("/booking-requests");
  revalidatePath(`/booking-requests/${id}`);
  revalidatePath("/");
  revalidatePath("/", "layout");
  revalidateDashboardCaches();
  return { success: true };
}

export async function markRecordSeen(table: TableName, id: string) {
  if (!SEEN_TRACKED_TABLES.includes(table)) return;
  await assertPermission(`${TABLE_MODULE_MAP[table]}:read`);

  const supabase = createServerClient();
  const { error } = await supabase
    .from(table)
    .update({ crm_seen: true })
    .eq("id", id);

  if (error) throw new Error(error.message);

  revalidateSeenPaths(table);
}

export async function getUnseenCount(table: TableName): Promise<number> {
  if (!SEEN_TRACKED_TABLES.includes(table)) return 0;

  const supabase = createServerClient();
  const { count, error } = await supabase
    .from(table)
    .select("*", { count: "exact", head: true })
    .eq("crm_seen", false);

  if (error) return 0;
  return count ?? 0;
}

export async function markAllRecordsSeen(table: TableName) {
  if (!SEEN_TRACKED_TABLES.includes(table)) return { success: true, count: 0 };
  await assertPermission(`${TABLE_MODULE_MAP[table]}:read`);

  const supabase = createServerClient();
  const { data, error } = await supabase
    .from(table)
    .update({ crm_seen: true })
    .eq("crm_seen", false)
    .select("id");

  if (error) throw new Error(error.message);

  const count = data?.length ?? 0;
  if (count > 0) revalidateSeenPaths(table);

  return { success: true, count };
}

function revalidateSeenPaths(table: TableName) {
  revalidatePath(TABLE_TO_PATH[table]);
  revalidatePath("/", "layout");
  updateTag(NAV_BADGE_COUNTS_TAG);
}

function revalidateDashboardCaches() {
  updateTag(DASHBOARD_STATS_TAG);
  updateTag(NAV_BADGE_COUNTS_TAG);
}

export async function getLatestHighlightId(
  table: TableName
): Promise<string | null> {
  if (!HIGHLIGHT_TABLES.includes(table)) return null;

  const supabase = createServerClient();
  const { data, error } = await supabase
    .from(table)
    .select("id, latest_row_acknowledged")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !data) return null;
  if (data.latest_row_acknowledged === true) return null;
  return data.id as string;
}

export async function dismissLatestHighlight(table: TableName, id: string) {
  if (!HIGHLIGHT_TABLES.includes(table)) return;
  await assertPermission(`${TABLE_MODULE_MAP[table]}:read`);

  const latestId = await getLatestHighlightId(table);
  if (latestId !== id) return;

  const supabase = createServerClient();
  const { error } = await supabase
    .from(table)
    .update({ latest_row_acknowledged: true })
    .eq("id", id);

  if (error) throw new Error(error.message);

  revalidatePath(TABLE_TO_PATH[table]);
}

export interface ManualBookingInput {
  full_name: string;
  email: string;
  phone?: string;
  shoot_category?: string;
  selected_drone?: string;
  location_name?: string;
  address?: string;
  pin_zip_code?: string;
  booking_datetime?: string;
  booking_duration?: string;
  reason_for_booking?: string;
  status?: BookingStatus;
  assigned_pilot?: string;
  price?: number;
  notes?: string;
}

export async function createManualBooking(input: ManualBookingInput) {
  await assertPermission("bookings:create");
  const supabase = createServerClient();

  const payload: Record<string, unknown> = {
    full_name: input.full_name.trim(),
    customer_name: input.full_name.trim(),
    official_mail: input.email.trim(),
    email: input.email.trim(),
    phone_number: input.phone?.trim() || null,
    phone: input.phone?.trim() || null,
    shoot_category: input.shoot_category?.trim() || null,
    service_type: input.shoot_category?.trim() || null,
    selected_drone: input.selected_drone?.trim() || null,
    location_name: input.location_name?.trim() || null,
    location: input.location_name?.trim() || null,
    address: input.address?.trim() || null,
    pin_zip_code: input.pin_zip_code?.trim() || null,
    booking_datetime: input.booking_datetime?.trim() || null,
    booking_duration: input.booking_duration?.trim() || null,
    reason_for_booking: input.reason_for_booking?.trim() || null,
    notes: input.notes?.trim() || input.reason_for_booking?.trim() || null,
    status: input.status || "confirmed",
    assigned_pilot: input.assigned_pilot?.trim() || null,
    price: input.price ?? null,
    currency: "EUR",
    confirmed_date: new Date().toISOString(),
  };

  const { error } = await supabase.from("bookings").insert(payload);

  if (error) throw new Error(error.message);

  revalidatePath("/bookings");
  revalidatePath("/");
  revalidatePath("/", "layout");
  revalidateDashboardCaches();
  return { success: true };
}

export async function getNavBadgeCounts(): Promise<Record<string, number>> {
  return getCachedNavBadgeCounts();
}

export async function updateBookingRequestStatus(
  id: string,
  status: BookingRequestStatus
) {
  return updateBookingRequest(id, { status });
}

export async function convertBookingRequest(
  requestId: string,
  extraFields?: {
    confirmed_date?: string;
    assigned_pilot?: string;
    price?: number;
    notes?: string;
  }
) {
  await assertPermission("booking_requests:convert");
  const supabase = createServerClient();

  const { data: request, error: fetchError } = await supabase
    .from("booking_requests")
    .select("*")
    .eq("id", requestId)
    .single();

  if (fetchError || !request) {
    throw new Error(fetchError?.message || "Booking request not found");
  }

  const fields = mapBookingRequestToBooking(
    request as Record<string, unknown>,
    requestId,
    extraFields
  );

  const { data: booking, error: insertError } = await supabase
    .from("bookings")
    .insert(fields)
    .select()
    .single();

  if (insertError) throw new Error(insertError.message);

  if ("status" in request) {
    await supabase
      .from("booking_requests")
      .update({ status: "converted" })
      .eq("id", requestId);
  }

  revalidatePath("/booking-requests");
  revalidatePath(`/booking-requests/${requestId}`);
  revalidatePath("/bookings");
  revalidatePath("/");
  revalidateDashboardCaches();

  return { success: true, booking };
}

export async function updateBooking(
  id: string,
  updates: Record<string, unknown>
) {
  await assertPermission("bookings:write");
  const supabase = createServerClient();
  const payload = { ...updates, updated_at: new Date().toISOString() };

  const { error } = await supabase
    .from("bookings")
    .update(payload)
    .eq("id", id);

  if (error) throw new Error(error.message);

  revalidatePath("/bookings");
  revalidatePath("/");
  return { success: true };
}

const BOOKING_STATUSES: BookingStatus[] = [
  "confirmed",
  "in_progress",
  "completed",
  "cancelled",
];

export async function updateBookingStatus(id: string, status: BookingStatus) {
  if (!BOOKING_STATUSES.includes(status)) {
    throw new Error("Invalid booking status");
  }
  return updateBooking(id, { status });
}

export async function deleteRecord(table: TableName, id: string) {
  if (!DELETABLE_TABLES.includes(table)) {
    throw new Error("Delete is not allowed for this table");
  }

  const session = await assertPermission(getDeletePermissionForTable(table));
  const supabase = createServerClient();

  if (table === "booking_requests") {
    await removeBookingRequestDependencies(supabase, id, session);
  }

  const { error } = await supabase.from(table).delete().eq("id", id);

  if (error) {
    throw new Error(formatDeleteError(error.message));
  }

  revalidatePath(TABLE_TO_PATH[table]);
  revalidatePath("/");
  revalidatePath("/", "layout");
  revalidateDashboardCaches();

  if (table === "booking_requests") {
    revalidatePath(`/booking-requests/${id}`);
    revalidatePath("/bookings");
  }

  return { success: true };
}

async function removeBookingRequestDependencies(
  supabase: ReturnType<typeof createServerClient>,
  requestId: string,
  session: AuthSession
) {
  const { data: linkedBookings, error: lookupError } = await supabase
    .from("bookings")
    .select("id")
    .eq("booking_request_id", requestId);

  if (lookupError) throw new Error(lookupError.message);
  if (!linkedBookings?.length) return;

  const bookingIds = linkedBookings.map((b) => b.id as string);

  if (hasPermission(session, "bookings:delete")) {
    const { error } = await supabase
      .from("bookings")
      .delete()
      .in("id", bookingIds);
    if (error) throw new Error(formatDeleteError(error.message));
    return;
  }

  if (hasPermission(session, "bookings:write")) {
    const { error } = await supabase
      .from("bookings")
      .update({ booking_request_id: null })
      .eq("booking_request_id", requestId);
    if (error) throw new Error(formatDeleteError(error.message));
    return;
  }

  throw new Error(
    "This request was converted to a booking. Delete the linked booking first, or ask an admin for booking edit/delete access."
  );
}

function formatDeleteError(message: string): string {
  if (message.includes("foreign key constraint")) {
    return "This record is linked to other data and cannot be deleted yet.";
  }
  return message;
}

export async function getTableCount(table: string): Promise<number | null> {
  const supabase = createServerClient();
  const { count, error } = await supabase
    .from(table)
    .select("*", { count: "exact", head: true });

  if (error) {
    if (error.code === "PGRST205") return null;
    return 0;
  }
  return count ?? 0;
}

export async function fetchTablePage(
  table: TableName | string,
  page = 1,
  pageSize = DEFAULT_PAGE_SIZE,
  options?: {
    search?: string;
    sort?: string;
    sortDir?: "asc" | "desc";
    searchableColumns?: string[];
  }
): Promise<PaginatedResult> {
  if (TABLE_MODULE_MAP[table as TableName]) {
    await assertPermission(`${TABLE_MODULE_MAP[table as TableName]}:read`);
  }
  const supabase = createServerClient();
  const search = options?.search?.trim();
  const sortDir = options?.sortDir ?? "desc";
  const ascending = sortDir === "asc";

  function applySearch<T extends { or: (filter: string) => T }>(query: T): T {
    if (!search || !options?.searchableColumns?.length) return query;
    const term = search.replace(/,/g, " ");
    const filter = options.searchableColumns
      .map((col) => `${col}.ilike.%${term}%`)
      .join(",");
    return query.or(filter);
  }

  let countQuery = supabase
    .from(table)
    .select("*", { count: "exact", head: true });
  countQuery = applySearch(countQuery);

  const sortCandidates = [
    options?.sort,
    ...ORDER_COLUMNS,
  ].filter(Boolean) as string[];

  const requestedPage = Math.max(1, page);
  const from = (requestedPage - 1) * pageSize;
  const to = from + pageSize - 1;
  const primarySort = sortCandidates[0] ?? "created_at";

  let dataQuery = supabase.from(table).select("*");
  dataQuery = applySearch(dataQuery);

  const [{ count: totalCount, error: countError }, firstDataResult] =
    await Promise.all([
      countQuery,
      dataQuery.order(primarySort, { ascending }).range(from, to),
    ]);

  if (countError) throw new Error(countError.message);

  const total = totalCount ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(requestedPage, totalPages || 1);

  if (!firstDataResult.error) {
    const safeFrom = (safePage - 1) * pageSize;
    const safeTo = safeFrom + pageSize - 1;

    if (safePage === requestedPage) {
      return {
        data: firstDataResult.data ?? [],
        total,
        page: safePage,
        pageSize,
        totalPages,
      };
    }

    const { data, error } = await applySearch(supabase.from(table).select("*"))
      .order(primarySort, { ascending })
      .range(safeFrom, safeTo);

    if (!error) {
      return {
        data: data ?? [],
        total,
        page: safePage,
        pageSize,
        totalPages,
      };
    }
  }

  for (const orderBy of sortCandidates.slice(1)) {
    const safeFrom = (safePage - 1) * pageSize;
    const safeTo = safeFrom + pageSize - 1;
    let fallbackQuery = supabase.from(table).select("*");
    fallbackQuery = applySearch(fallbackQuery);

    const { data, error } = await fallbackQuery
      .order(orderBy, { ascending })
      .range(safeFrom, safeTo);

    if (!error) {
      return {
        data: data ?? [],
        total,
        page: safePage,
        pageSize,
        totalPages,
      };
    }
  }

  let fallbackQuery = supabase.from(table).select("*");
  fallbackQuery = applySearch(fallbackQuery);
  const { data, error } = await fallbackQuery.range(
    (safePage - 1) * pageSize,
    (safePage - 1) * pageSize + pageSize - 1
  );

  if (error) throw new Error(error.message);

  return {
    data: data ?? [],
    total,
    page: safePage,
    pageSize,
    totalPages,
  };
}

export async function fetchTableData(
  table: TableName | string,
  options?: { limit?: number }
) {
  const result = await fetchTablePage(table, 1, options?.limit ?? 200);
  return result.data;
}

export async function fetchRecord(table: string, id: string) {
  const tableName = table as TableName;
  if (TABLE_MODULE_MAP[tableName]) {
    await assertPermission(`${TABLE_MODULE_MAP[tableName]}:read`);
  }
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from(table)
    .select("*")
    .eq("id", id)
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function getDashboardStats() {
  return getCachedDashboardStats();
}

/** Counts only tables the user can access — faster for limited roles (e.g. Employee). */
export async function getDashboardStatsForSession(session: AuthSession) {
  if (session.isSuperAdmin) {
    return getCachedDashboardStats();
  }

  const tables = CRM_TABLES.filter((table) =>
    canAccessModule(session, TABLE_MODULE_MAP[table])
  );

  const results = await Promise.all(
    tables.map(async (table) => ({
      table,
      count: await getTableCount(table),
    }))
  );

  const byTable = Object.fromEntries(results.map((r) => [r.table, r.count]));

  return {
    bookingRequests: byTable.booking_requests ?? 0,
    bookings: byTable.bookings ?? 0,
    callbackRequests: byTable.callback_requests ?? 0,
    contactRequests: byTable.contact_requests ?? 0,
    careerApplications: byTable.career_applications ?? 0,
    enterpriseRequests: byTable.enterprise_requests ?? 0,
    pilotRequests: byTable.pilot_requests ?? 0,
    dronePilotRegistrations: byTable.drone_pilot_registrations ?? 0,
    forBusinesses: byTable.for_businesses ?? 0,
    users: byTable.users ?? 0,
    bookingsTableMissing: byTable.bookings === null,
  };
}
