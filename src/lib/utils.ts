import { format, parseISO, isValid } from "date-fns";

export function formatDate(value: unknown): string {
  if (!value) return "—";
  try {
    const date = typeof value === "string" ? parseISO(value) : new Date(value as string);
    if (!isValid(date)) return String(value);
    return format(date, "dd MMM yyyy, HH:mm");
  } catch {
    return String(value);
  }
}

export function formatLabel(key: string): string {
  return key
    .replace(/_/g, " ")
    .replace(/([A-Z])/g, " $1")
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .trim();
}

export function getDisplayValue(value: unknown): string {
  if (value === null || value === undefined || value === "") return "—";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (typeof value === "object") return JSON.stringify(value);
  if (
    typeof value === "string" &&
    /^\d{4}-\d{2}-\d{2}/.test(value)
  ) {
    return formatDate(value);
  }
  return String(value);
}

export function extractCustomerFields(record: Record<string, unknown>) {
  const name =
    (record.full_name as string) ||
    (record.name as string) ||
    (record.customer_name as string) ||
    (record.first_name
      ? `${record.first_name} ${record.last_name || ""}`.trim()
      : null);

  return {
    customer_name: name || undefined,
    email:
      (record.email as string) ||
      (record.official_mail as string) ||
      undefined,
    phone:
      (record.phone as string) ||
      (record.phone_number as string) ||
      (record.mobile as string) ||
      undefined,
    service_type:
      (record.service_type as string) ||
      (record.shoot_category as string) ||
      (record.service as string) ||
      (record.package as string) ||
      undefined,
    location:
      (record.location as string) ||
      (record.location_name as string) ||
      (record.address as string) ||
      (record.city as string) ||
      undefined,
    preferred_date:
      (record.preferred_date as string) ||
      (record.booking_datetime as string) ||
      (record.date as string) ||
      (record.event_date as string) ||
      undefined,
    notes:
      (record.notes as string) ||
      (record.reason_for_booking as string) ||
      (record.message as string) ||
      (record.description as string) ||
      undefined,
  };
}

const BOOKING_REQUEST_FIELDS = [
  "full_name",
  "official_mail",
  "phone_number",
  "shoot_category",
  "selected_drone",
  "location_name",
  "address",
  "pin_zip_code",
  "booking_datetime",
  "booking_duration",
  "reason_for_booking",
  "privacy_policy_accepted",
  "terms_conditions_accepted",
  "raw_submission",
  "price",
  "currency",
] as const;

function toTimestamptz(value: unknown): string | undefined {
  if (value == null || value === "") return undefined;
  const str = String(value);
  if (/^\d{4}-\d{2}-\d{2}/.test(str)) return str;
  return undefined;
}

export function mapBookingRequestToBooking(
  record: Record<string, unknown>,
  requestId: string,
  extra?: {
    confirmed_date?: string;
    assigned_pilot?: string;
    price?: number;
    notes?: string;
  }
) {
  const mapped = extractCustomerFields(record);

  const booking: Record<string, unknown> = {
    booking_request_id: requestId,
    customer_name: mapped.customer_name,
    email: mapped.email,
    phone: mapped.phone,
    service_type: mapped.service_type,
    location: mapped.location,
    preferred_date:
      toTimestamptz(record.booking_datetime) ||
      toTimestamptz(record.preferred_date) ||
      toTimestamptz(mapped.preferred_date),
    notes: extra?.notes || mapped.notes,
    confirmed_date: extra?.confirmed_date || new Date().toISOString(),
    assigned_pilot: extra?.assigned_pilot,
    price: extra?.price ?? record.price,
    currency: record.currency || "EUR",
    status: "confirmed",
  };

  for (const field of BOOKING_REQUEST_FIELDS) {
    if (record[field] !== undefined && record[field] !== null) {
      booking[field] = record[field];
    }
  }

  return booking;
}

export const STATUS_COLORS: Record<string, string> = {
  pending: "bg-amber-100 text-amber-800",
  reviewing: "bg-blue-100 text-blue-800",
  converted: "bg-emerald-100 text-emerald-800",
  rejected: "bg-red-100 text-red-800",
  cancelled: "bg-gray-100 text-gray-600",
  confirmed: "bg-emerald-100 text-emerald-800",
  in_progress: "bg-blue-100 text-blue-800",
  completed: "bg-green-100 text-green-800",
};
