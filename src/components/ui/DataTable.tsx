"use client";

import Link from "next/link";
import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import { formatLabel, getDisplayValue } from "@/lib/utils";
import { TABLE_CONFIG, orderColumns } from "@/lib/table-config";
import type { TableName } from "@/lib/types";
import { buildTableQueryString } from "@/lib/query-params";
import { isLatestHighlighted } from "@/lib/latest-highlight";
import { dismissLatestHighlight } from "@/lib/actions";
import { StatusBadge } from "./StatusBadge";
import { Pagination } from "./Pagination";
import { DataTableRow } from "./DataTableRow";
import { DeleteRecordButton, getRecordLabel } from "./DeleteRecordButton";

interface DataTableProps {
  data: Record<string, unknown>[];
  table?: TableName;
  latestHighlightId?: string | null;
  hiddenColumns?: string[];
  detailHref?: (id: string) => string;
  statusColumn?: string;
  maxColumns?: number;
  total?: number;
  page?: number;
  pageSize?: number;
  totalPages?: number;
  basePath?: string;
  search?: string;
  sort?: string;
  sortDir?: "asc" | "desc";
  canDelete?: boolean;
}

export function DataTable({
  data,
  table,
  latestHighlightId = null,
  hiddenColumns = [],
  detailHref,
  statusColumn,
  maxColumns = 8,
  total,
  page,
  pageSize,
  totalPages,
  basePath,
  search,
  sort,
  sortDir = "desc",
  canDelete = false,
}: DataTableProps) {
  const hasQuery = !!search;
  const recordTotal = total ?? 0;

  if (!data.length && recordTotal === 0 && !hasQuery) {
    return (
      <div className="rounded-xl border border-gray-100 bg-white p-12 text-center shadow-sm">
        <p className="text-gray-500">No records found.</p>
      </div>
    );
  }

  const config = table ? TABLE_CONFIG[table] : null;
  const resolvedStatusColumn = statusColumn || config?.statusColumn || "status";
  const resolvedHidden = [
    ...hiddenColumns,
    ...(config?.hiddenColumns ?? []),
    "password",
    "password_hash",
    "encrypted_password",
    "token",
    "refresh_token",
    "crm_seen",
    "latest_row_acknowledged",
  ];

  const allColumns = Object.keys(
    data.reduce<Record<string, true>>((acc, row) => {
      Object.keys(row).forEach((key) => {
        acc[key] = true;
      });
      return acc;
    }, {})
  );

  const columns = config
    ? orderColumns(allColumns, config.priorityColumns, resolvedHidden)
    : orderColumns(allColumns, [
        "created_at",
        "status",
        "name",
        "full_name",
        "email",
        "phone",
        "service_type",
        "location",
        "message",
      ]).filter((c) => !resolvedHidden.includes(c));

  const displayColumns = columns.slice(0, maxColumns);
  const resolvedDetailHref = detailHref || config?.detailRoute;
  const showActions = !!(resolvedDetailHref || (canDelete && table));
  const latestOnPage = latestHighlightId
    ? data.some((row) => row.id === latestHighlightId)
    : false;

  const headerLabel =
    total != null && page != null && pageSize != null
      ? `Showing ${recordTotal === 0 ? 0 : Math.min((page - 1) * pageSize + 1, recordTotal)}–${Math.min(page * pageSize, recordTotal)} of ${recordTotal} records`
      : `${recordTotal} record${recordTotal === 1 ? "" : "s"}`;

  function sortHref(column: string) {
    if (!basePath) return "#";
    const nextDir: "asc" | "desc" =
      sort === column && sortDir === "asc" ? "desc" : "asc";
    return buildTableQueryString(basePath, {
      q: search,
      sort: column,
      dir: nextDir,
      page: 1,
    });
  }

  return (
    <div className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-gray-100 bg-gray-50 px-4 py-2">
        <p className="text-xs text-gray-500">
          {headerLabel}
          {hasQuery && " (filtered)"}
          {latestHighlightId && latestOnPage && (
            <span className="font-medium text-[#34AADC]">
              {" "}
              · Latest entry highlighted — double-click to acknowledge
            </span>
          )}
          {latestHighlightId && !latestOnPage && (
            <span className="font-medium text-[#34AADC]">
              {" "}
              · Latest entry is on another page
            </span>
          )}
        </p>
        {columns.length > maxColumns && (
          <p className="text-xs text-gray-400">
            {maxColumns} of {columns.length} columns
          </p>
        )}
      </div>

      {data.length === 0 ? (
        <div className="p-12 text-center">
          <p className="text-gray-500">
            {hasQuery ? "No records match your search." : "No records on this page."}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                {displayColumns.map((col) => {
                  const isSorted = sort === col;
                  const SortIcon = isSorted
                    ? sortDir === "asc"
                      ? ArrowUp
                      : ArrowDown
                    : ArrowUpDown;

                  return (
                    <th
                      key={col}
                      className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500"
                    >
                      {basePath ? (
                        <Link
                          href={sortHref(col)}
                          className={`inline-flex items-center gap-1 hover:text-[#34AADC] ${
                            isSorted ? "text-[#34AADC]" : ""
                          }`}
                        >
                          {formatLabel(col)}
                          <SortIcon className="h-3 w-3 shrink-0 opacity-60" />
                        </Link>
                      ) : (
                        formatLabel(col)
                      )}
                    </th>
                  );
                })}
                {showActions && (
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Actions
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {data.map((row, idx) => {
                const id = row.id as string;
                const rowHref =
                  resolvedDetailHref && id
                    ? resolvedDetailHref(id)
                    : undefined;
                const isHighlighted = isLatestHighlighted(id, latestHighlightId);

                return (
                  <DataTableRow
                    key={id || idx}
                    href={rowHref}
                    isHighlighted={isHighlighted}
                    onDismissHighlight={
                      isHighlighted && table && id
                        ? () => dismissLatestHighlight(table, id)
                        : undefined
                    }
                  >
                    {displayColumns.map((col, colIdx) => (
                      <td
                        key={col}
                        className="max-w-[240px] truncate px-4 py-3 text-gray-700"
                        title={getDisplayValue(row[col])}
                      >
                        {colIdx === 0 && isHighlighted && (
                          <span className="mr-2 inline-flex rounded bg-[#34AADC] px-1.5 py-0.5 text-[10px] font-semibold text-white">
                            LATEST
                          </span>
                        )}
                        {col === resolvedStatusColumn && row[col] ? (
                          <StatusBadge status={String(row[col])} />
                        ) : (
                          getDisplayValue(row[col])
                        )}
                      </td>
                    ))}
                    {showActions && id && (
                      <td className="px-4 py-3 text-right">
                        <div className="inline-flex items-center justify-end gap-2">
                          {resolvedDetailHref && (
                            <Link
                              href={resolvedDetailHref(id)}
                              onClick={(e) => e.stopPropagation()}
                              className="text-sm font-medium text-[#34AADC] hover:underline"
                            >
                              View
                            </Link>
                          )}
                          {canDelete && table && (
                            <DeleteRecordButton
                              table={table}
                              id={id}
                              label={getRecordLabel(row)}
                            />
                          )}
                        </div>
                      </td>
                    )}
                  </DataTableRow>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {basePath &&
        page != null &&
        pageSize != null &&
        totalPages != null &&
        total != null && (
          <Pagination
            page={page}
            totalPages={totalPages}
            total={total}
            pageSize={pageSize}
            basePath={basePath}
            query={{ q: search, sort, dir: sortDir }}
          />
        )}
    </div>
  );
}
