"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  CalendarCheck,
  CalendarDays,
  Phone,
  Mail,
  Briefcase,
  Building2,
  Users,
  Plane,
  Handshake,
  UserCircle,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

export const NEW_DATA_NAV: NavItem[] = [
  { label: "Dashboard", href: "/", icon: LayoutDashboard },
  { label: "Bookings", href: "/bookings", icon: CalendarCheck },
  { label: "Booking Requests", href: "/booking-requests", icon: CalendarDays },
  { label: "Callback Requests", href: "/callback-requests", icon: Phone },
  { label: "Contact Requests", href: "/contact-requests", icon: Mail },
  { label: "Career Applications", href: "/career-applications", icon: Briefcase },
  { label: "Enterprise Requests", href: "/enterprise-requests", icon: Building2 },
];

export const LEGACY_DATA_NAV: NavItem[] = [
  { label: "Pilot Requests", href: "/pilot-requests", icon: Plane },
  { label: "Pilot Registrations", href: "/drone-pilot-registrations", icon: UserCircle },
  { label: "For Businesses", href: "/for-businesses", icon: Handshake },
  { label: "Users", href: "/users", icon: Users },
];

export const NAV_ITEMS: NavItem[] = [...NEW_DATA_NAV, ...LEGACY_DATA_NAV];

function NavBadge({ count }: { count: number }) {
  if (count <= 0) return null;
  return (
    <span className="ml-auto inline-flex min-w-5 items-center justify-center rounded-full bg-[#34AADC] px-1.5 py-0.5 text-[10px] font-semibold leading-none text-white">
      {count > 99 ? "99+" : count}
    </span>
  );
}

function NavLink({
  item,
  active,
  badgeCount = 0,
}: {
  item: NavItem;
  active: boolean;
  badgeCount?: number;
}) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
        active
          ? "bg-[#34AADC] text-white"
          : "text-gray-600 hover:bg-blue-50 hover:text-[#34AADC]"
      }`}
    >
      <Icon className="h-4 w-4 shrink-0" />
      <span className="flex-1">{item.label}</span>
      <NavBadge count={badgeCount} />
    </Link>
  );
}

interface SidebarProps {
  badgeCounts?: Record<string, number>;
}

export function Sidebar({ badgeCounts = {} }: SidebarProps) {
  const pathname = usePathname();

  function isActive(href: string) {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  }

  return (
    <aside className="fixed left-0 top-0 z-40 flex h-screen w-64 flex-col border-r border-gray-100 bg-white">
      <div className="border-b border-gray-100 px-6 py-5">
        <Link href="/" className="inline-block">
          <Image
            src="/logo.webp"
            alt="Dazz Drones"
            width={180}
            height={48}
            className="h-10 w-auto object-contain"
            priority
          />
        </Link>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <ul className="mb-6 space-y-1">
          {NEW_DATA_NAV.map((item) => (
            <li key={item.href}>
              <NavLink
                item={item}
                active={isActive(item.href)}
                badgeCount={badgeCounts[item.href] ?? 0}
              />
            </li>
          ))}
        </ul>

        <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-wider text-gray-400">
          Legacy Data
        </p>
        <ul className="space-y-1">
          {LEGACY_DATA_NAV.map((item) => (
            <li key={item.href}>
              <NavLink item={item} active={isActive(item.href)} />
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
}
