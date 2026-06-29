"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { RefreshCw } from "lucide-react";

export function RefreshButton() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleRefresh() {
    startTransition(() => {
      router.refresh();
    });
  }

  return (
    <button
      type="button"
      onClick={handleRefresh}
      disabled={isPending}
      className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-600 transition-colors hover:border-[#34AADC] hover:text-[#34AADC] disabled:opacity-50"
    >
      <RefreshCw className={`h-4 w-4 ${isPending ? "animate-spin" : ""}`} />
      Refresh
    </button>
  );
}
