"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, X } from "lucide-react";
import { createManualBooking } from "@/lib/actions";
import type { BookingStatus } from "@/lib/types";
import { BookingDateTimeInput } from "@/components/booking/BookingDateTimeInput";

const STATUS_OPTIONS: BookingStatus[] = [
  "confirmed",
  "in_progress",
  "completed",
  "cancelled",
];

const emptyForm = {
  full_name: "",
  email: "",
  phone: "",
  shoot_category: "",
  selected_drone: "",
  location_name: "",
  address: "",
  pin_zip_code: "",
  booking_datetime: "",
  booking_duration: "",
  reason_for_booking: "",
  status: "confirmed" as BookingStatus,
  assigned_pilot: "",
  price: "",
  notes: "",
};

export function AddManualBookingButton() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function updateField(field: keyof typeof emptyForm, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function handleClose() {
    setOpen(false);
    setError(null);
    setForm(emptyForm);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!form.full_name.trim() || !form.email.trim()) {
      setError("Name and email are required.");
      return;
    }

    startTransition(async () => {
      try {
        await createManualBooking({
          full_name: form.full_name,
          email: form.email,
          phone: form.phone || undefined,
          shoot_category: form.shoot_category || undefined,
          selected_drone: form.selected_drone || undefined,
          location_name: form.location_name || undefined,
          address: form.address || undefined,
          pin_zip_code: form.pin_zip_code || undefined,
          booking_datetime: form.booking_datetime || undefined,
          booking_duration: form.booking_duration || undefined,
          reason_for_booking: form.reason_for_booking || undefined,
          status: form.status,
          assigned_pilot: form.assigned_pilot || undefined,
          price: form.price ? Number(form.price) : undefined,
          notes: form.notes || undefined,
        });
        handleClose();
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to create booking");
      }
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 rounded-lg bg-[#34AADC] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#2B94C5]"
      >
        <Plus className="h-4 w-4" />
        Add Booking
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button
            type="button"
            className="absolute inset-0 bg-black/40"
            onClick={handleClose}
            aria-label="Close modal"
          />
          <div className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-white shadow-xl">
            <div className="sticky top-0 flex items-center justify-between border-b border-gray-100 bg-white px-6 py-4">
              <div>
                <h2 className="text-lg font-bold text-gray-900">Add Manual Booking</h2>
                <p className="text-sm text-gray-500">
                  Create a booking directly without a request
                </p>
              </div>
              <button
                type="button"
                onClick={handleClose}
                className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 p-6">
              {error && (
                <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
                  {error}
                </p>
              )}

              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Full name *" required>
                  <input
                    value={form.full_name}
                    onChange={(e) => updateField("full_name", e.target.value)}
                    className={inputClass}
                    placeholder="Customer name"
                  />
                </Field>
                <Field label="Email *" required>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => updateField("email", e.target.value)}
                    className={inputClass}
                    placeholder="email@example.com"
                  />
                </Field>
                <Field label="Phone">
                  <input
                    value={form.phone}
                    onChange={(e) => updateField("phone", e.target.value)}
                    className={inputClass}
                  />
                </Field>
                <Field label="Status">
                  <select
                    value={form.status}
                    onChange={(e) =>
                      updateField("status", e.target.value as BookingStatus)
                    }
                    className={inputClass}
                  >
                    {STATUS_OPTIONS.map((s) => (
                      <option key={s} value={s}>
                        {s.replace("_", " ")}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Shoot category">
                  <input
                    value={form.shoot_category}
                    onChange={(e) => updateField("shoot_category", e.target.value)}
                    className={inputClass}
                  />
                </Field>
                <Field label="Selected drone">
                  <input
                    value={form.selected_drone}
                    onChange={(e) => updateField("selected_drone", e.target.value)}
                    className={inputClass}
                  />
                </Field>
                <Field label="Location">
                  <input
                    value={form.location_name}
                    onChange={(e) => updateField("location_name", e.target.value)}
                    className={inputClass}
                  />
                </Field>
                <Field label="Booking date & time" className="sm:col-span-2">
                  <BookingDateTimeInput
                    value={form.booking_datetime}
                    onChange={(v) => updateField("booking_datetime", v)}
                  />
                </Field>
                <Field label="Duration">
                  <input
                    value={form.booking_duration}
                    onChange={(e) => updateField("booking_duration", e.target.value)}
                    className={inputClass}
                  />
                </Field>
                <Field label="Assigned pilot">
                  <input
                    value={form.assigned_pilot}
                    onChange={(e) => updateField("assigned_pilot", e.target.value)}
                    className={inputClass}
                  />
                </Field>
                <Field label="Price (EUR)">
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.price}
                    onChange={(e) => updateField("price", e.target.value)}
                    className={inputClass}
                  />
                </Field>
              </div>

              <Field label="Address">
                <input
                  value={form.address}
                  onChange={(e) => updateField("address", e.target.value)}
                  className={inputClass}
                />
              </Field>

              <Field label="Zip / PIN code">
                <input
                  value={form.pin_zip_code}
                  onChange={(e) => updateField("pin_zip_code", e.target.value)}
                  className={inputClass}
                />
              </Field>

              <Field label="Reason / notes">
                <textarea
                  value={form.reason_for_booking}
                  onChange={(e) => updateField("reason_for_booking", e.target.value)}
                  rows={3}
                  className={inputClass}
                />
              </Field>

              <div className="flex justify-end gap-3 border-t border-gray-100 pt-4">
                <button
                  type="button"
                  onClick={handleClose}
                  className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="rounded-lg bg-[#34AADC] px-4 py-2 text-sm font-semibold text-white hover:bg-[#2B94C5] disabled:opacity-50"
                >
                  {isPending ? "Saving..." : "Create Booking"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

function Field({
  label,
  children,
  required,
  className,
}: {
  label: string;
  children: React.ReactNode;
  required?: boolean;
  className?: string;
}) {
  return (
    <label className={`block ${className ?? ""}`}>
      <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500">
        {label}
        {required && <span className="text-red-500"> *</span>}
      </span>
      {children}
    </label>
  );
}

const inputClass =
  "w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-[#34AADC] focus:outline-none focus:ring-1 focus:ring-[#34AADC]";
