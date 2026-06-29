"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";

interface DataTableRowProps {
  href?: string;
  isHighlighted?: boolean;
  onDismissHighlight?: () => Promise<void>;
  children: React.ReactNode;
}

export function DataTableRow({
  href,
  isHighlighted,
  onDismissHighlight,
  children,
}: DataTableRowProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleDoubleClick() {
    startTransition(async () => {
      if (isHighlighted && onDismissHighlight) {
        await onDismissHighlight();
      }
      if (href) {
        router.push(href);
      } else {
        router.refresh();
      }
    });
  }

  return (
    <tr
      onDoubleClick={handleDoubleClick}
      className={`transition-colors ${
        isHighlighted
          ? "border-l-2 border-l-[#34AADC] bg-sky-50/70 hover:bg-sky-100/60"
          : "hover:bg-blue-50/40"
      } ${href || onDismissHighlight ? "cursor-pointer" : ""} ${isPending ? "opacity-60" : ""}`}
      title={
        isHighlighted
          ? href
            ? "Double-click to acknowledge and view"
            : "Double-click to acknowledge"
          : href
            ? "Double-click to view"
            : undefined
      }
    >
      {children}
    </tr>
  );
}
