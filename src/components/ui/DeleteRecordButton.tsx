"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { deleteRecord } from "@/lib/actions";
import type { TableName } from "@/lib/types";

interface DeleteRecordButtonProps {
  table: TableName;
  id: string;
  label?: string;
  redirectTo?: string;
  variant?: "icon" | "button";
  className?: string;
}

export function DeleteRecordButton({
  table,
  id,
  label,
  redirectTo,
  variant = "icon",
  className = "",
}: DeleteRecordButtonProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();

    const message = label
      ? `Delete "${label}"? This cannot be undone.`
      : "Delete this record? This cannot be undone.";

    if (!confirm(message)) return;

    setError(null);
    startTransition(async () => {
      try {
        await deleteRecord(table, id);
        if (redirectTo) {
          router.push(redirectTo);
        } else {
          router.refresh();
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to delete");
      }
    });
  }

  if (variant === "button") {
    return (
      <div className={className}>
        <button
          type="button"
          disabled={isPending}
          onClick={handleClick}
          className="inline-flex items-center gap-2 rounded-lg border border-red-200 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
        >
          <Trash2 className="h-4 w-4" />
          {isPending ? "Deleting..." : "Delete"}
        </button>
        {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
      </div>
    );
  }

  return (
    <span className={`inline-flex flex-col items-end ${className}`}>
      <button
        type="button"
        disabled={isPending}
        onClick={handleClick}
        title="Delete record"
        aria-label="Delete record"
        className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
      >
        <Trash2 className="h-4 w-4" />
      </button>
      {error && <span className="mt-0.5 text-[10px] text-red-600">{error}</span>}
    </span>
  );
}

function getRecordLabel(row: Record<string, unknown>): string | undefined {
  const candidates = [
    "full_name",
    "name",
    "customer_name",
    "company_name",
    "official_mail",
    "email",
  ];
  for (const key of candidates) {
    const value = row[key];
    if (value != null && String(value).trim()) return String(value).trim();
  }
  return undefined;
}

export { getRecordLabel };
