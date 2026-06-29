"use server";

import { revalidatePath } from "next/cache";
import { createServerClient } from "@/lib/supabase/server";
import { CRM_TABLES } from "@/lib/table-config";
import { DEFAULT_PAGE_SIZE } from "@/lib/constants";
import { mapBookingRequestToBooking } from "@/lib/utils";
import { SEEN_TRACKED_TABLES, TABLE_TO_PATH } from "@/lib/new-records";
import { HIGHLIGHT_TABLES } from "@/lib/latest-highlight";
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
  return { success: true };
}

export async function markRecordSeen(table: TableName, id: string) {
  if (!SEEN_TRACKED_TABLES.includes(table)) return;

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

  const supabase = createServerClient();
  const unseen = await getUnseenCount(table);
  if (unseen === 0) return { success: true, count: 0 };

  const { error } = await supabase
    .from(table)
    .update({ crm_seen: true })
    .eq("crm_seen", false);

  if (error) throw new Error(error.message);

  revalidateSeenPaths(table);
  return { success: true, count: unseen };
}

function revalidateSeenPaths(table: TableName) {
  revalidatePath(TABLE_TO_PATH[table]);
  revalidatePath("/", "layout");
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
    latest_row_acknowledged: false,
  };

  const { error } = await supabase.from("bookings").insert(payload);

  if (error) throw new Error(error.message);

  revalidatePath("/bookings");
  revalidatePath("/");
  revalidatePath("/", "layout");
  return { success: true };
}

export async function getNavBadgeCounts(): Promise<Record<string, number>> {
  const supabase = createServerClient();

  const counts = await Promise.all(
    SEEN_TRACKED_TABLES.map(async (table) => {
      const { count, error } = await supabase
        .from(table)
        .select("*", { count: "exact", head: true })
        .eq("crm_seen", false);

      return {
        path: TABLE_TO_PATH[table],
        count: error ? 0 : (count ?? 0),
      };
    })
  );

  return Object.fromEntries(counts.map(({ path, count }) => [path, count]));
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

  return { success: true, booking };
}

export async function updateBooking(
  id: string,
  updates: Record<string, unknown>
) {
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

  const { count: totalCount, error: countError } = await countQuery;
  if (countError) throw new Error(countError.message);

  const total = totalCount ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(Math.max(1, page), totalPages || 1);
  const from = (safePage - 1) * pageSize;
  const to = from + pageSize - 1;

  const sortCandidates = [
    options?.sort,
    ...ORDER_COLUMNS,
  ].filter(Boolean) as string[];

  for (const orderBy of sortCandidates) {
    let dataQuery = supabase.from(table).select("*");
    dataQuery = applySearch(dataQuery);

    const { data, error } = await dataQuery
      .order(orderBy, { ascending })
      .range(from, to);

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
  const { data, error } = await fallbackQuery.range(from, to);

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
  const results = await Promise.all(
    CRM_TABLES.map(async (table) => ({
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
