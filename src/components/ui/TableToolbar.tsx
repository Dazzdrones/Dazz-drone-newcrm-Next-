"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Search, X } from "lucide-react";
import { buildTableQueryString, type TableQueryParams } from "@/lib/query-params";

interface TableToolbarProps {
  basePath: string;
  q?: string;
  sort?: string;
  dir?: "asc" | "desc";
}

export function TableToolbar({ basePath, q, sort, dir }: TableToolbarProps) {
  const router = useRouter();
  const [value, setValue] = useState(q ?? "");

  function navigate(params: TableQueryParams) {
    router.push(buildTableQueryString(basePath, params));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    navigate({
      q: value.trim() || undefined,
      sort,
      dir,
      page: 1,
    });
  }

  function handleClear() {
    setValue("");
    navigate({ sort, dir, page: 1 });
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex items-center gap-2 rounded-xl border border-gray-100 bg-white px-4 py-3 shadow-sm"
    >
      <Search className="h-4 w-4 shrink-0 text-gray-400" />
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Search records..."
        className="flex-1 bg-transparent text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none"
      />
      {value && (
        <button
          type="button"
          onClick={handleClear}
          className="rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          aria-label="Clear search"
        >
          <X className="h-4 w-4" />
        </button>
      )}
      <button
        type="submit"
        className="rounded-lg bg-[#34AADC] px-4 py-1.5 text-xs font-semibold text-white hover:bg-[#2B94C5]"
      >
        Search
      </button>
    </form>
  );
}
