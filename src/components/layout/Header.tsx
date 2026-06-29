"use client";

import { usePathname } from "next/navigation";
import { MAIN_NAV, LEGACY_NAV } from "@/lib/auth/nav-config";
import { RefreshButton } from "@/components/ui/RefreshButton";

const NAV_ITEMS = [...MAIN_NAV, ...LEGACY_NAV];

interface HeaderProps {
  title?: string;
  subtitle?: string;
  showRefresh?: boolean;
}

export function Header({ title, subtitle, showRefresh = false }: HeaderProps) {
  const pathname = usePathname();
  const current = NAV_ITEMS.find((item) =>
    item.href === "/" ? pathname === "/" : pathname.startsWith(item.href)
  );

  const pageTitle = title || current?.label || "Dashboard";

  return (
    <header className="border-b border-gray-100 bg-white px-8 py-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{pageTitle}</h1>
          {subtitle && (
            <p className="mt-1 text-sm text-gray-500">{subtitle}</p>
          )}
        </div>
        {showRefresh && <RefreshButton />}
      </div>
    </header>
  );
}
