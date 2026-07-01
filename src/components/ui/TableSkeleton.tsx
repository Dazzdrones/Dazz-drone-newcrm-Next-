import { Shimmer } from "@/components/ui/Shimmer";

export function TableSkeleton({ rows = 10 }: { rows?: number }) {
  return (
    <div className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-gray-100 bg-gray-50 px-4 py-3">
        <Shimmer className="h-4 w-48" />
        <Shimmer className="h-3 w-24" />
      </div>
      <div>
        {Array.from({ length: rows }).map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-4 border-b border-gray-50 px-4 py-3.5"
            style={{ animationDelay: `${i * 40}ms` }}
          >
            <Shimmer className="h-4 w-[18%] min-w-[4rem]" />
            <Shimmer className="h-4 w-[14%] min-w-[3.5rem]" />
            <Shimmer className="h-4 w-[22%] min-w-[5rem]" />
            <Shimmer className="h-4 flex-1" />
          </div>
        ))}
      </div>
    </div>
  );
}
