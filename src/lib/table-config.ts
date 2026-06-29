import type { TableName } from "./types";

export interface TableConfig {
  label: string;
  description: string;
  priorityColumns: string[];
  searchableColumns: string[];
  hiddenColumns?: string[];
  statusColumn?: string;
  detailRoute?: (id: string) => string;
}

export const TABLE_CONFIG: Record<TableName, TableConfig> = {
  booking_requests: {
    label: "Booking Requests",
    description: "Incoming drone service booking requests",
    priorityColumns: [
      "created_at",
      "status",
      "full_name",
      "official_mail",
      "phone_number",
      "shoot_category",
      "selected_drone",
      "location_name",
      "booking_datetime",
      "reason_for_booking",
    ],
    detailRoute: (id) => `/booking-requests/${id}`,
    searchableColumns: [
      "full_name",
      "official_mail",
      "phone_number",
      "shoot_category",
      "selected_drone",
      "location_name",
      "address",
      "reason_for_booking",
      "status",
    ],
  },
  bookings: {
    label: "Bookings",
    description: "Confirmed bookings converted from requests",
    priorityColumns: [
      "created_at",
      "status",
      "full_name",
      "customer_name",
      "official_mail",
      "email",
      "phone_number",
      "phone",
      "shoot_category",
      "service_type",
      "selected_drone",
      "location_name",
      "location",
      "address",
      "pin_zip_code",
      "booking_datetime",
      "preferred_date",
      "booking_duration",
      "confirmed_date",
      "reason_for_booking",
      "notes",
      "price",
      "currency",
      "assigned_pilot",
    ],
    hiddenColumns: ["raw_submission", "updated_at", "booking_request_id"],
    searchableColumns: [
      "full_name",
      "customer_name",
      "official_mail",
      "email",
      "phone_number",
      "phone",
      "shoot_category",
      "service_type",
      "selected_drone",
      "location_name",
      "location",
      "address",
      "reason_for_booking",
      "notes",
      "status",
      "assigned_pilot",
    ],
  },
  callback_requests: {
    label: "Callback Requests",
    description: "Customers requesting a phone callback",
    priorityColumns: [
      "created_at",
      "name",
      "full_name",
      "email",
      "phone",
      "preferred_time",
      "message",
      "status",
    ],
    searchableColumns: ["full_name", "phone_number", "callback_datetime"],
  },
  contact_requests: {
    label: "Contact Requests",
    description: "General contact form submissions",
    priorityColumns: [
      "created_at",
      "name",
      "full_name",
      "email",
      "phone",
      "subject",
      "message",
      "status",
    ],
    searchableColumns: [
      "full_name",
      "official_mail",
      "phone",
      "address",
      "message",
    ],
  },
  career_applications: {
    label: "Career Applications",
    description: "Job and pilot career applications",
    priorityColumns: [
      "created_at",
      "name",
      "full_name",
      "email",
      "phone",
      "position",
      "experience",
      "status",
    ],
    searchableColumns: [
      "full_name",
      "mail",
      "phone",
      "city",
      "country",
      "which_drone_experience",
      "industries_worked",
      "drone_pilot_license_number",
    ],
  },
  enterprise_requests: {
    label: "Enterprise Requests",
    description: "B2B and enterprise client inquiries",
    priorityColumns: [
      "created_at",
      "company_name",
      "name",
      "email",
      "phone",
      "service_type",
      "message",
      "status",
    ],
    searchableColumns: [
      "company_name",
      "full_name",
      "official_mail",
      "phone",
      "service_type",
      "address",
      "select_location",
    ],
  },
  pilot_requests: {
    label: "Pilot Requests",
    description: "Requests directed to drone pilots",
    priorityColumns: [
      "created_at",
      "name",
      "email",
      "phone",
      "location",
      "service_type",
      "message",
      "status",
    ],
    searchableColumns: [
      "name",
      "email",
      "contact",
      "city",
      "country",
      "locationname",
      "address_1",
    ],
  },
  drone_pilot_registrations: {
    label: "Pilot Registrations",
    description: "Registered drone pilots on the platform",
    priorityColumns: [
      "created_at",
      "name",
      "full_name",
      "email",
      "phone",
      "license_number",
      "location",
      "experience",
      "status",
    ],
    searchableColumns: [
      "name",
      "email",
      "phonenumber",
      "city",
      "country",
      "droneexperience",
      "industriesworkedin",
      "licensenumber",
    ],
  },
  for_businesses: {
    label: "For Businesses",
    description: "Business-specific service leads",
    priorityColumns: [
      "created_at",
      "company_name",
      "name",
      "email",
      "phone",
      "business_type",
      "message",
      "status",
    ],
    searchableColumns: [
      "companyname",
      "contactperson",
      "email",
      "phonenumber",
      "location",
      "industry",
    ],
  },
  users: {
    label: "Users",
    description: "Platform user accounts",
    priorityColumns: [
      "created_at",
      "email",
      "full_name",
      "name",
      "phone",
      "role",
      "status",
    ],
    hiddenColumns: [
      "password",
      "password_hash",
      "encrypted_password",
      "token",
      "refresh_token",
    ],
    searchableColumns: ["email", "username", "phone", "country", "role"],
  },
};

export function orderColumns(
  columns: string[],
  priorityColumns: string[],
  hidden: string[] = []
): string[] {
  const hiddenSet = new Set(hidden);
  const available = columns.filter((c) => !hiddenSet.has(c));
  const priority = priorityColumns.filter((c) => available.includes(c));
  const rest = available.filter((c) => !priority.includes(c));
  return [...priority, ...rest];
}

export const CRM_TABLES: TableName[] = [
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

export const LEGACY_TABLES: TableName[] = [
  "pilot_requests",
  "drone_pilot_registrations",
  "for_businesses",
  "users",
];
