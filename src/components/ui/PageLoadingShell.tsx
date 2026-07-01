import { Loader2 } from "lucide-react";
import { Shimmer } from "@/components/ui/Shimmer";
import { TableSkeleton } from "@/components/ui/TableSkeleton";

interface PageLoadingShellProps {
  title?: string;
  subtitle?: string;
  variant?: "table" | "dashboard" | "admin";
}

export function PageLoadingShell({
  title = "Loading",
  subtitle,
  variant = "table",
}: PageLoadingShellProps) {
  return (
    <div className="page-enter min-h-[60vh]">
      <header className="border-b border-gray-100 bg-white px-8 py-5">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            {title && title !== "Loading" ? (
              <>
                <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
                {subtitle && (
                  <p className="mt-1 text-sm text-gray-500">{subtitle}</p>
                )}
              </>
            ) : (
              <>
                <Shimmer className="mb-2 h-8 w-56" />
                <Shimmer className="h-4 w-80 max-w-full" />
              </>
            )}
          </div>
          <LoadingBadge />
        </div>
      </header>

      <div className="p-8">
        {variant === "dashboard" ? (
          <DashboardBodySkeleton />
        ) : variant === "admin" ? (
          <AdminBodySkeleton />
        ) : (
          <TableBodySkeleton />
        )}
      </div>
    </div>
  );
}

export function LoadingBadge() {
  return (
    <span className="inline-flex shrink-0 items-center gap-2 rounded-full border border-[#34AADC]/20 bg-[#34AADC]/5 px-3 py-1.5 text-xs font-medium text-[#2B94C5]">
      <Loader2 className="h-3.5 w-3.5 animate-spin" />
      Loading…
    </span>
  );
}

function TableBodySkeleton() {
  return (
    <>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <Shimmer className="h-10 min-w-0 flex-1 rounded-lg" />
        <Shimmer className="h-10 w-24 rounded-lg" />
      </div>
      <TableSkeleton />
    </>
  );
}

function DashboardBodySkeleton() {
  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <Shimmer key={i} className="h-24 rounded-xl" />
        ))}
      </div>
      <div className="mt-8">
        <Shimmer className="mb-4 h-6 w-52" />
        <TableSkeleton rows={6} />
      </div>
    </>
  );
}

function AdminBodySkeleton() {
  return (
    <div className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
      <div className="border-b border-gray-100 bg-gray-50 px-4 py-3">
        <Shimmer className="h-4 w-40" />
      </div>
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="flex gap-4 border-b border-gray-50 px-4 py-4">
          <Shimmer className="h-4 w-1/4" />
          <Shimmer className="h-4 w-1/3" />
          <Shimmer className="h-4 w-1/5" />
        </div>
      ))}
    </div>
  );
}
