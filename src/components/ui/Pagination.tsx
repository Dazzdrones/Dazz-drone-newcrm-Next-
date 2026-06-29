import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  buildTableQueryString,
  type TableQueryParams,
} from "@/lib/query-params";

interface PaginationProps {
  page: number;
  totalPages: number;
  total: number;
  pageSize: number;
  basePath: string;
  query?: Omit<TableQueryParams, "page">;
}

export function Pagination({
  page,
  totalPages,
  total,
  pageSize,
  basePath,
  query,
}: PaginationProps) {
  if (total <= pageSize) return null;

  const from = (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);

  function pageHref(p: number) {
    return buildTableQueryString(basePath, { ...query, page: p });
  }

  const pages = buildPageNumbers(page, totalPages);

  return (
    <div className="flex flex-col gap-3 border-t border-gray-100 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-xs text-gray-500">
        Showing {from}–{to} of {total} records
      </p>
      <div className="flex items-center gap-1">
        <Link
          href={pageHref(page - 1)}
          aria-disabled={page <= 1}
          className={`inline-flex items-center gap-1 rounded-lg border px-3 py-1.5 text-xs font-medium ${
            page <= 1
              ? "pointer-events-none border-gray-100 text-gray-300"
              : "border-gray-200 text-gray-600 hover:border-[#34AADC] hover:text-[#34AADC]"
          }`}
        >
          <ChevronLeft className="h-3.5 w-3.5" />
          Prev
        </Link>

        {pages.map((p, idx) =>
          p === "..." ? (
            <span key={`ellipsis-${idx}`} className="px-2 text-xs text-gray-400">
              …
            </span>
          ) : (
            <Link
              key={p}
              href={pageHref(p as number)}
              className={`min-w-[2rem] rounded-lg px-2.5 py-1.5 text-center text-xs font-medium ${
                p === page
                  ? "bg-[#34AADC] text-white"
                  : "text-gray-600 hover:bg-blue-50 hover:text-[#34AADC]"
              }`}
            >
              {p}
            </Link>
          )
        )}

        <Link
          href={pageHref(page + 1)}
          aria-disabled={page >= totalPages}
          className={`inline-flex items-center gap-1 rounded-lg border px-3 py-1.5 text-xs font-medium ${
            page >= totalPages
              ? "pointer-events-none border-gray-100 text-gray-300"
              : "border-gray-200 text-gray-600 hover:border-[#34AADC] hover:text-[#34AADC]"
          }`}
        >
          Next
          <ChevronRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </div>
  );
}

function buildPageNumbers(current: number, total: number): (number | "...")[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  const pages: (number | "...")[] = [1];

  if (current > 3) pages.push("...");

  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);

  for (let i = start; i <= end; i++) pages.push(i);

  if (current < total - 2) pages.push("...");

  pages.push(total);
  return pages;
}
