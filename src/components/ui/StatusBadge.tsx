import { STATUS_COLORS } from "@/lib/utils";

interface StatusBadgeProps {
  status: string;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const normalized = status?.toLowerCase().replace(/\s+/g, "_") || "unknown";
  const colorClass =
    STATUS_COLORS[normalized] || "bg-gray-100 text-gray-600";

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${colorClass}`}
    >
      {status?.replace(/_/g, " ") || "Unknown"}
    </span>
  );
}
