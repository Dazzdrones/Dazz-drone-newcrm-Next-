export default function DashboardLoading() {
  return (
    <div className="animate-pulse p-8">
      <div className="mb-6 h-10 w-72 rounded-lg bg-gray-200" />
      <div className="mb-4 h-10 rounded-lg bg-gray-100" />
      <div className="rounded-xl border border-gray-100 bg-white p-4">
        <div className="mb-4 h-8 rounded bg-gray-100" />
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="mb-3 h-10 rounded bg-gray-50" />
        ))}
      </div>
    </div>
  );
}
