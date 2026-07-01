import { unstable_cache } from "next/cache";
import { createServerClient } from "@/lib/supabase/server";
import { CRM_TABLES } from "@/lib/table-config";
import { SEEN_TRACKED_TABLES, TABLE_TO_PATH } from "@/lib/new-records";
import {
  DASHBOARD_STATS_TAG,
  NAV_BADGE_COUNTS_TAG,
} from "@/lib/cache-tags";

async function loadNavBadgeCounts(): Promise<Record<string, number>> {
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

/** Cached 30s — sidebar badge counts */
export const getCachedNavBadgeCounts = unstable_cache(
  loadNavBadgeCounts,
  [NAV_BADGE_COUNTS_TAG],
  { revalidate: 30, tags: [NAV_BADGE_COUNTS_TAG] }
);

async function loadTableCount(table: string): Promise<number | null> {
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

async function loadDashboardStats() {
  const results = await Promise.all(
    CRM_TABLES.map(async (table) => ({
      table,
      count: await loadTableCount(table),
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

/** Cached 60s — dashboard stat cards */
export const getCachedDashboardStats = unstable_cache(
  loadDashboardStats,
  [DASHBOARD_STATS_TAG],
  { revalidate: 60, tags: [DASHBOARD_STATS_TAG] }
);
