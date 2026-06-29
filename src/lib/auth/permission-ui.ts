import type { LucideIcon } from "lucide-react";
import {
  Archive,
  Briefcase,
  Building2,
  CalendarCheck,
  CalendarDays,
  Eye,
  LayoutDashboard,
  Mail,
  Pencil,
  Phone,
  Plus,
  ScrollText,
  Settings,
  Shield,
  Trash2,
  Users,
  UsersRound,
  ArrowRightLeft,
} from "lucide-react";

export interface PermissionMeta {
  id: string;
  key: string;
  module_key: string;
  action: string;
  description: string | null;
}

export interface ModuleMeta {
  key: string;
  name: string;
  icon: LucideIcon;
  group: "operations" | "legacy" | "administration";
  sortOrder: number;
}

export const ACTION_META: Record<
  string,
  { label: string; icon: LucideIcon; color: string; activeColor: string }
> = {
  read: {
    label: "View",
    icon: Eye,
    color: "border-slate-200 bg-white text-slate-600 hover:border-sky-200 hover:bg-sky-50",
    activeColor: "border-sky-300 bg-sky-100 text-sky-800 ring-1 ring-sky-200",
  },
  write: {
    label: "Edit",
    icon: Pencil,
    color: "border-slate-200 bg-white text-slate-600 hover:border-violet-200 hover:bg-violet-50",
    activeColor:
      "border-violet-300 bg-violet-100 text-violet-800 ring-1 ring-violet-200",
  },
  create: {
    label: "Create",
    icon: Plus,
    color: "border-slate-200 bg-white text-slate-600 hover:border-emerald-200 hover:bg-emerald-50",
    activeColor:
      "border-emerald-300 bg-emerald-100 text-emerald-800 ring-1 ring-emerald-200",
  },
  delete: {
    label: "Delete",
    icon: Trash2,
    color: "border-slate-200 bg-white text-slate-600 hover:border-red-200 hover:bg-red-50",
    activeColor: "border-red-300 bg-red-100 text-red-800 ring-1 ring-red-200",
  },
  convert: {
    label: "Convert",
    icon: ArrowRightLeft,
    color: "border-slate-200 bg-white text-slate-600 hover:border-amber-200 hover:bg-amber-50",
    activeColor:
      "border-amber-300 bg-amber-100 text-amber-800 ring-1 ring-amber-200",
  },
  manage: {
    label: "Manage",
    icon: Settings,
    color: "border-slate-200 bg-white text-slate-600 hover:border-indigo-200 hover:bg-indigo-50",
    activeColor:
      "border-indigo-300 bg-indigo-100 text-indigo-800 ring-1 ring-indigo-200",
  },
};

export const ACTION_ORDER = [
  "read",
  "write",
  "create",
  "convert",
  "delete",
  "manage",
] as const;

const MODULE_REGISTRY: ModuleMeta[] = [
  {
    key: "dashboard",
    name: "Dashboard",
    icon: LayoutDashboard,
    group: "operations",
    sortOrder: 10,
  },
  {
    key: "bookings",
    name: "Bookings",
    icon: CalendarCheck,
    group: "operations",
    sortOrder: 20,
  },
  {
    key: "booking_requests",
    name: "Booking Requests",
    icon: CalendarDays,
    group: "operations",
    sortOrder: 30,
  },
  {
    key: "callback_requests",
    name: "Callback Requests",
    icon: Phone,
    group: "operations",
    sortOrder: 40,
  },
  {
    key: "contact_requests",
    name: "Contact Requests",
    icon: Mail,
    group: "operations",
    sortOrder: 50,
  },
  {
    key: "career_applications",
    name: "Career Applications",
    icon: Briefcase,
    group: "operations",
    sortOrder: 60,
  },
  {
    key: "enterprise_requests",
    name: "Enterprise Requests",
    icon: Building2,
    group: "operations",
    sortOrder: 70,
  },
  {
    key: "legacy_data",
    name: "Legacy Data",
    icon: Archive,
    group: "legacy",
    sortOrder: 80,
  },
  {
    key: "admin_users",
    name: "CRM Users",
    icon: Users,
    group: "administration",
    sortOrder: 90,
  },
  {
    key: "admin_teams",
    name: "Teams",
    icon: UsersRound,
    group: "administration",
    sortOrder: 100,
  },
  {
    key: "admin_roles",
    name: "Roles & Permissions",
    icon: Shield,
    group: "administration",
    sortOrder: 110,
  },
  {
    key: "admin_modules",
    name: "Module Settings",
    icon: Settings,
    group: "administration",
    sortOrder: 120,
  },
  {
    key: "admin_audit",
    name: "Audit Log",
    icon: ScrollText,
    group: "administration",
    sortOrder: 130,
  },
];

export const MODULE_GROUPS = [
  { key: "operations", label: "Operations" },
  { key: "legacy", label: "Legacy Data" },
  { key: "administration", label: "Administration" },
] as const;

export function getModuleMeta(key: string): ModuleMeta {
  const found = MODULE_REGISTRY.find((m) => m.key === key);
  if (found) return found;
  return {
    key,
    name: key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
    icon: Settings,
    group: key.startsWith("admin_") ? "administration" : "operations",
    sortOrder: 999,
  };
}

export function groupPermissionsByModule(permissions: PermissionMeta[]) {
  const grouped = new Map<string, PermissionMeta[]>();

  for (const perm of permissions) {
    const list = grouped.get(perm.module_key) ?? [];
    list.push(perm);
    grouped.set(perm.module_key, list);
  }

  const actionRank = (action: string) => {
    const idx = ACTION_ORDER.indexOf(action as (typeof ACTION_ORDER)[number]);
    return idx === -1 ? ACTION_ORDER.length : idx;
  };

  for (const [key, list] of grouped) {
    grouped.set(
      key,
      [...list].sort((a, b) => actionRank(a.action) - actionRank(b.action))
    );
  }

  return grouped;
}

export function sortModuleKeys(keys: string[]) {
  return [...keys].sort(
    (a, b) => getModuleMeta(a).sortOrder - getModuleMeta(b).sortOrder
  );
}

export function getActionLabel(action: string) {
  return ACTION_META[action]?.label ?? action;
}
