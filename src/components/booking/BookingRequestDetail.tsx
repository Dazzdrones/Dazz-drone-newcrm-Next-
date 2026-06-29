"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  updateBookingRequest,
  convertBookingRequest,
} from "@/lib/actions";
import { formatLabel, getDisplayValue } from "@/lib/utils";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { DeleteRecordButton } from "@/components/ui/DeleteRecordButton";
import type { BookingRequestStatus } from "@/lib/types";

interface BookingRequestDetailProps {
  record: Record<string, unknown>;
  canDelete?: boolean;
}

const STATUS_OPTIONS: BookingRequestStatus[] = [
  "pending",
  "reviewing",
  "rejected",
  "cancelled",
];

export function BookingRequestDetail({
  record,
  canDelete = false,
}: BookingRequestDetailProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const id = record.id as string;
  const currentStatus = (record.status as string) || "pending";
  const isConverted = currentStatus === "converted";
  const hasStatusColumn = "status" in record;

  const editableKeys = Object.keys(record).filter(
    (key) =>
      !["id", "created_at", "updated_at", "crm_seen"].includes(key) &&
      typeof record[key] !== "object"
  );

  const [formData, setFormData] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    editableKeys.forEach((key) => {
      initial[key] = record[key] != null ? String(record[key]) : "";
    });
    return initial;
  });

  function handleSave() {
    startTransition(async () => {
      try {
        const updates: Record<string, unknown> = {};
        Object.entries(formData).forEach(([key, value]) => {
          if (value !== String(record[key] ?? "")) {
            updates[key] = value || null;
          }
        });
        if (Object.keys(updates).length === 0) return;
        await updateBookingRequest(id, updates);
        router.refresh();
      } catch {
        // ignore
      }
    });
  }

  function handleStatusChange(status: BookingRequestStatus) {
    if (!hasStatusColumn) return;
    startTransition(async () => {
      try {
        await updateBookingRequest(id, { status });
        router.refresh();
      } catch {
        // ignore
      }
    });
  }

  function handleConvert() {
    if (!confirm("Convert this request to a confirmed booking?")) return;

    startTransition(async () => {
      try {
        await convertBookingRequest(id);
        router.refresh();
      } catch {
        // ignore
      }
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-500">Status:</span>
          <StatusBadge status={currentStatus} />
        </div>
        <div className="flex flex-wrap gap-2">
          {hasStatusColumn &&
            STATUS_OPTIONS.filter((s) => s !== currentStatus).map((status) => (
            <button
              key={status}
              onClick={() => handleStatusChange(status)}
              disabled={isPending || isConverted}
              className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 transition-colors hover:border-[#34AADC] hover:text-[#34AADC] disabled:opacity-50"
            >
              Mark {status}
            </button>
          ))}
          {!isConverted && (
            <button
              onClick={handleConvert}
              disabled={isPending}
              className="rounded-lg bg-[#34AADC] px-4 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-[#2B94C5] disabled:opacity-50"
            >
              {isPending ? "Converting..." : "Convert to Booking"}
            </button>
          )}
        </div>
      </div>

      <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
        <h3 className="mb-4 text-sm font-semibold text-gray-900">
          Request Details
        </h3>
        <div className="grid gap-4 sm:grid-cols-2">
          {editableKeys.map((key) => (
            <div key={key}>
              <label className="mb-1 block text-xs font-medium text-gray-500">
                {formatLabel(key)}
              </label>
              {key === "status" ? (
                <p className="text-sm text-gray-700">
                  <StatusBadge status={formData[key]} />
                </p>
              ) : (
                <input
                  type="text"
                  value={formData[key]}
                  onChange={(e) =>
                    setFormData({ ...formData, [key]: e.target.value })
                  }
                  disabled={isConverted}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 focus:border-[#34AADC] focus:outline-none focus:ring-1 focus:ring-[#34AADC] disabled:bg-gray-50"
                />
              )}
            </div>
          ))}
        </div>

        <div className="mt-6 grid gap-2 border-t border-gray-100 pt-4 sm:grid-cols-2">
          <div>
            <span className="text-xs text-gray-400">Created</span>
            <p className="text-sm text-gray-600">
              {getDisplayValue(record.created_at)}
            </p>
          </div>
          {record.updated_at != null && (
            <div>
              <span className="text-xs text-gray-400">Last Updated</span>
              <p className="text-sm text-gray-600">
                {getDisplayValue(record.updated_at)}
              </p>
            </div>
          )}
        </div>

        {!isConverted && (
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <button
              onClick={handleSave}
              disabled={isPending}
              className="rounded-lg bg-[#34AADC] px-6 py-2.5 text-sm font-semibold text-white hover:bg-[#2B94C5] disabled:opacity-50"
            >
              {isPending ? "Saving..." : "Save Changes"}
            </button>
            {canDelete && (
              <DeleteRecordButton
                table="booking_requests"
                id={id}
                label={
                  (record.full_name as string) ||
                  (record.official_mail as string) ||
                  undefined
                }
                redirectTo="/booking-requests"
                variant="button"
              />
            )}
          </div>
        )}
        {isConverted && canDelete && (
          <div className="mt-6 border-t border-gray-100 pt-4">
            <DeleteRecordButton
              table="booking_requests"
              id={id}
              label={
                (record.full_name as string) ||
                (record.official_mail as string) ||
                undefined
              }
              redirectTo="/booking-requests"
              variant="button"
            />
          </div>
        )}
      </div>
    </div>
  );
}
