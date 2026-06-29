import type { TableName } from "@/lib/types";

export function isNewRecord(record: Record<string, unknown>): boolean {
  return (
    record.crm_seen === false ||
    record.crm_seen === null ||
    record.crm_seen === undefined
  );
}

export const SEEN_TRACKED_TABLES: TableName[] = [
  "booking_requests",
  "callback_requests",
  "contact_requests",
  "career_applications",
  "enterprise_requests",
];

export const HIGHLIGHT_NEW_TABLES = SEEN_TRACKED_TABLES;

export const TABLE_TO_PATH: Record<TableName, string> = {
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
