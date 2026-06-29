import type { LucideIcon } from "lucide-react";
import type { TableName } from "@/lib/types";
import {
  LayoutDashboard,
  CalendarCheck,
  CalendarDays,
  Phone,
  Mail,
  Briefcase,
  Building2,
  Plane,
  Handshake,
  UserCircle,
  Users,
  Shield,
  Settings,
  ScrollText,
  UsersRound,
} from "lucide-react";

export interface CrmNavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  moduleKey: string;
  permission?: string;
  badgePath?: string;
}

export const MAIN_NAV: CrmNavItem[] = [
  {
    label: "Dashboard",
    href: "/",
    icon: LayoutDashboard,
    moduleKey: "dashboard",
    permission: "dashboard:read",
  },
  {
    label: "Bookings",
    href: "/bookings",
    icon: CalendarCheck,
    moduleKey: "bookings",
    permission: "bookings:read",
  },
  {
    label: "Booking Requests",
    href: "/booking-requests",
    icon: CalendarDays,
    moduleKey: "booking_requests",
    permission: "booking_requests:read",
    badgePath: "/booking-requests",
  },
  {
    label: "Callback Requests",
    href: "/callback-requests",
    icon: Phone,
    moduleKey: "callback_requests",
    permission: "callback_requests:read",
    badgePath: "/callback-requests",
  },
  {
    label: "Contact Requests",
    href: "/contact-requests",
    icon: Mail,
    moduleKey: "contact_requests",
    permission: "contact_requests:read",
    badgePath: "/contact-requests",
  },
  {
    label: "Career Applications",
    href: "/career-applications",
    icon: Briefcase,
    moduleKey: "career_applications",
    permission: "career_applications:read",
    badgePath: "/career-applications",
  },
  {
    label: "Enterprise Requests",
    href: "/enterprise-requests",
    icon: Building2,
    moduleKey: "enterprise_requests",
    permission: "enterprise_requests:read",
    badgePath: "/enterprise-requests",
  },
];

export const LEGACY_NAV: CrmNavItem[] = [
  {
    label: "Pilot Requests",
    href: "/pilot-requests",
    icon: Plane,
    moduleKey: "legacy_data",
    permission: "legacy_data:read",
  },
  {
    label: "Pilot Registrations",
    href: "/drone-pilot-registrations",
    icon: UserCircle,
    moduleKey: "legacy_data",
    permission: "legacy_data:read",
  },
  {
    label: "For Businesses",
    href: "/for-businesses",
    icon: Handshake,
    moduleKey: "legacy_data",
    permission: "legacy_data:read",
  },
  {
    label: "Platform Users",
    href: "/users",
    icon: Users,
    moduleKey: "legacy_data",
    permission: "legacy_data:read",
  },
];

export const ADMIN_NAV: CrmNavItem[] = [
  {
    label: "CRM Users",
    href: "/admin/users",
    icon: Users,
    moduleKey: "admin_users",
    permission: "admin_users:manage",
  },
  {
    label: "Teams",
    href: "/admin/teams",
    icon: UsersRound,
    moduleKey: "admin_teams",
    permission: "admin_teams:manage",
  },
  {
    label: "Roles",
    href: "/admin/roles",
    icon: Shield,
    moduleKey: "admin_roles",
    permission: "admin_roles:manage",
  },
  {
    label: "Modules",
    href: "/admin/modules",
    icon: Settings,
    moduleKey: "admin_modules",
    permission: "admin_modules:manage",
  },
  {
    label: "Audit Log",
    href: "/admin/audit",
    icon: ScrollText,
    moduleKey: "admin_audit",
    permission: "admin_audit:read",
  },
];

export const ROUTE_MODULE_MAP: Record<string, string> = {
  "/": "dashboard",
  "/bookings": "bookings",
  "/booking-requests": "booking_requests",
  "/callback-requests": "callback_requests",
  "/contact-requests": "contact_requests",
  "/career-applications": "career_applications",
  "/enterprise-requests": "enterprise_requests",
  "/pilot-requests": "legacy_data",
  "/drone-pilot-registrations": "legacy_data",
  "/for-businesses": "legacy_data",
  "/users": "legacy_data",
  "/admin/users": "admin_users",
  "/admin/teams": "admin_teams",
  "/admin/roles": "admin_roles",
  "/admin/modules": "admin_modules",
  "/admin/audit": "admin_audit",
};

export function getModuleForPath(pathname: string): string | null {
  if (pathname === "/") return "dashboard";
  const sorted = Object.keys(ROUTE_MODULE_MAP).sort(
    (a, b) => b.length - a.length
  );
  for (const route of sorted) {
    if (route !== "/" && pathname.startsWith(route)) {
      return ROUTE_MODULE_MAP[route];
    }
  }
  return null;
}

export function filterNavByPermissions(
  items: CrmNavItem[],
  permissions: string[],
  isSuperAdmin: boolean
) {
  if (isSuperAdmin) return items;
  return items.filter((item) => {
    if (!item.permission) return true;
    return permissions.includes(item.permission);
  });
}

export const TABLE_MODULE_MAP: Record<TableName, string> = {
  booking_requests: "booking_requests",
  bookings: "bookings",
  callback_requests: "callback_requests",
  contact_requests: "contact_requests",
  career_applications: "career_applications",
  enterprise_requests: "enterprise_requests",
  pilot_requests: "legacy_data",
  drone_pilot_registrations: "legacy_data",
  for_businesses: "legacy_data",
  users: "legacy_data",
};
