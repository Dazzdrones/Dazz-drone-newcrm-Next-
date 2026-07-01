export function TableSkeleton() {
  return (
    <div className="animate-pulse overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
      <div className="border-b border-gray-100 bg-gray-50 px-4 py-3">
        <div className="h-4 w-48 rounded bg-gray-200" />
      </div>
      <div className="space-y-0 p-0">
        {Array.from({ length: 10 }).map((_, i) => (
          <div
            key={i}
            className="flex gap-4 border-b border-gray-50 px-4 py-3"
          >
            <div className="h-4 w-24 rounded bg-gray-100" />
            <div className="h-4 w-32 rounded bg-gray-100" />
            <div className="h-4 flex-1 rounded bg-gray-50" />
          </div>
        ))}
      </div>
    </div>
  );
}
