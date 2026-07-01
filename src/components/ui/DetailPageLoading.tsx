import { Shimmer } from "@/components/ui/Shimmer";
import { LoadingBadge } from "@/components/ui/PageLoadingShell";

export function DetailPageLoading({
  title = "Loading details",
  subtitle,
}: {
  title?: string;
  subtitle?: string;
}) {
  return (
    <div className="page-enter min-h-[60vh]">
      <header className="border-b border-gray-100 bg-white px-8 py-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
            {subtitle ? (
              <p className="mt-1 text-sm text-gray-500">{subtitle}</p>
            ) : (
              <Shimmer className="mt-2 h-4 w-48" />
            )}
          </div>
          <LoadingBadge />
        </div>
      </header>
      <div className="p-8">
        <Shimmer className="mb-6 h-4 w-40" />
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="space-y-4 rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i}>
                <Shimmer className="mb-2 h-3 w-24" />
                <Shimmer className="h-5 w-full max-w-xs" />
              </div>
            ))}
          </div>
          <div className="space-y-4 rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i}>
                <Shimmer className="mb-2 h-3 w-28" />
                <Shimmer className="h-5 w-full" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
