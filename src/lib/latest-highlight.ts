import type { TableName } from "@/lib/types";

export const HIGHLIGHT_TABLES: TableName[] = [
  "booking_requests",
  "bookings",
  "callback_requests",
  "contact_requests",
  "career_applications",
  "enterprise_requests",
  "pilot_requests",
  "drone_pilot_registrations",
  "for_businesses",
  "users",
];

export function isLatestHighlighted(
  rowId: string,
  latestHighlightId: string | null
): boolean {
  return !!latestHighlightId && rowId === latestHighlightId;
}
