"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { CheckCheck } from "lucide-react";
import { markAllRecordsSeen } from "@/lib/actions";
import type { TableName } from "@/lib/types";

interface MarkAllReadButtonProps {
  table: TableName;
  unseenCount: number;
}

export function MarkAllReadButton({ table, unseenCount }: MarkAllReadButtonProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  if (unseenCount <= 0) return null;

  function handleClick() {
    startTransition(async () => {
      await markAllRecordsSeen(table);
      router.refresh();
    });
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isPending}
      className="inline-flex items-center gap-2 rounded-lg border border-[#34AADC]/30 bg-blue-50 px-3 py-2 text-sm font-medium text-[#34AADC] transition-colors hover:bg-blue-100 disabled:opacity-50"
    >
      <CheckCheck className={`h-4 w-4 ${isPending ? "animate-pulse" : ""}`} />
      Mark all as read ({unseenCount > 99 ? "99+" : unseenCount})
    </button>
  );
}
