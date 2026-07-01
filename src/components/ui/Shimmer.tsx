import { cn } from "@/lib/cn";

export function Shimmer({
  className,
}: {
  className?: string;
}) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-md bg-gray-200/80",
        className
      )}
    >
      <div className="shimmer-wave absolute inset-0" />
    </div>
  );
}
