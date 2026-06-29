export type BookingRequestStatus =
  | "pending"
  | "reviewing"
  | "converted"
  | "rejected"
  | "cancelled";

export type BookingStatus =
  | "confirmed"
  | "in_progress"
  | "completed"
  | "cancelled";

export interface BookingRequest {
  id: string;
  created_at?: string;
  updated_at?: string;
  status?: BookingRequestStatus;
  [key: string]: unknown;
}

export interface Booking {
  id: string;
  booking_request_id?: string;
  customer_name?: string;
  email?: string;
  phone?: string;
  service_type?: string;
  location?: string;
  preferred_date?: string;
  confirmed_date?: string;
  notes?: string;
  status?: BookingStatus;
  assigned_pilot?: string;
  price?: number;
  currency?: string;
  created_at?: string;
  updated_at?: string;
}

export interface DashboardStats {
  bookingRequests: number;
  bookings: number;
  callbackRequests: number;
  contactRequests: number;
  careerApplications: number;
  enterpriseRequests: number;
  pilotRequests: number;
  dronePilotRegistrations: number;
  forBusinesses: number;
  users: number;
}

export type TableName =
  | "booking_requests"
  | "bookings"
  | "callback_requests"
  | "career_applications"
  | "contact_requests"
  | "drone_pilot_registrations"
  | "enterprise_requests"
  | "for_businesses"
  | "pilot_requests"
  | "users";

export interface NavItem {
  label: string;
  href: string;
  icon: string;
  table: TableName;
}
