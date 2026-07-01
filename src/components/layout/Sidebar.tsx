"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown } from "lucide-react";
import {
  ADMIN_NAV,
  filterNavByPermissions,
  LEGACY_NAV,
  MAIN_NAV,
  type CrmNavItem,
} from "@/lib/auth/nav-config";
import { UserMenu } from "./UserMenu";

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
  item: CrmNavItem;
  active: boolean;
  badgeCount?: number;
}) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      prefetch={false}
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
  permissions: string[];
  isSuperAdmin: boolean;
  user: {
    fullName: string | null;
    email: string;
    roleName: string;
  };
}

export function Sidebar({
  badgeCounts = {},
  permissions,
  isSuperAdmin,
  user,
}: SidebarProps) {
  const pathname = usePathname();

  const mainNav = filterNavByPermissions(MAIN_NAV, permissions, isSuperAdmin);
  const legacyNav = filterNavByPermissions(LEGACY_NAV, permissions, isSuperAdmin);
  const adminNav = filterNavByPermissions(ADMIN_NAV, permissions, isSuperAdmin);

  const legacyActive = legacyNav.some((item) =>
    item.href === "/" ? pathname === "/" : pathname.startsWith(item.href)
  );
  const [legacyOpen, setLegacyOpen] = useState(legacyActive);

  useEffect(() => {
    if (legacyActive) setLegacyOpen(true);
  }, [legacyActive]);

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
          {mainNav.map((item) => (
            <li key={item.href}>
              <NavLink
                item={item}
                active={isActive(item.href)}
                badgeCount={
                  item.badgePath ? (badgeCounts[item.badgePath] ?? 0) : 0
                }
              />
            </li>
          ))}
        </ul>

        {adminNav.length > 0 && (
          <>
            <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-wider text-gray-400">
              Administration
            </p>
            <ul className="mb-6 space-y-1">
              {adminNav.map((item) => (
                <li key={item.href}>
                  <NavLink item={item} active={isActive(item.href)} />
                </li>
              ))}
            </ul>
          </>
        )}

        {legacyNav.length > 0 && (
          <div className="mb-6">
            <button
              type="button"
              onClick={() => setLegacyOpen((open) => !open)}
              className="mb-1 flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-[10px] font-semibold uppercase tracking-wider text-gray-400 transition-colors hover:bg-gray-50 hover:text-gray-600"
            >
              <span className="flex-1">Legacy Data</span>
              <ChevronDown
                className={`h-3.5 w-3.5 shrink-0 transition-transform ${
                  legacyOpen ? "rotate-180" : ""
                }`}
              />
            </button>
            {legacyOpen && (
              <ul className="space-y-1">
                {legacyNav.map((item) => (
                  <li key={item.href}>
                    <NavLink item={item} active={isActive(item.href)} />
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </nav>

      <UserMenu
        fullName={user.fullName}
        email={user.email}
        roleName={user.roleName}
      />
    </aside>
  );
}

// Backward compat for Header title lookup
export const NAV_ITEMS = [...MAIN_NAV, ...LEGACY_NAV];
