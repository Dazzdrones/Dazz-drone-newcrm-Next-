"use client";

import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  useTransition,
} from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { ChevronDown } from "lucide-react";
import { updateBookingStatus } from "@/lib/actions";
import { STATUS_COLORS } from "@/lib/utils";
import type { BookingStatus } from "@/lib/types";

const STATUS_OPTIONS: BookingStatus[] = [
  "confirmed",
  "in_progress",
  "completed",
  "cancelled",
];

function normalizeStatus(status: string): BookingStatus {
  const normalized = status?.toLowerCase().replace(/\s+/g, "_") || "confirmed";
  if (STATUS_OPTIONS.includes(normalized as BookingStatus)) {
    return normalized as BookingStatus;
  }
  return "confirmed";
}

function statusLabel(status: string) {
  return normalizeStatus(status).replace(/_/g, " ");
}

function statusColorClass(status: string) {
  return STATUS_COLORS[normalizeStatus(status)] || "bg-gray-100 text-gray-600";
}

interface BookingStatusSelectProps {
  bookingId: string;
  status: string;
  disabled?: boolean;
}

export function BookingStatusSelect({
  bookingId,
  status,
  disabled = false,
}: BookingStatusSelectProps) {
  const router = useRouter();
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [isPending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [current, setCurrent] = useState(() => normalizeStatus(status));
  const [menuPos, setMenuPos] = useState<{ top: number; left: number } | null>(
    null
  );

  useEffect(() => {
    setCurrent(normalizeStatus(status));
  }, [status]);

  useLayoutEffect(() => {
    if (!open || !buttonRef.current) {
      setMenuPos(null);
      return;
    }

    function updatePosition() {
      const button = buttonRef.current;
      if (!button) return;

      const rect = button.getBoundingClientRect();
      const menuHeight = menuRef.current?.offsetHeight ?? 168;
      const menuWidth = menuRef.current?.offsetWidth ?? 152;
      const gap = 4;

      const spaceBelow = window.innerHeight - rect.bottom;
      const openUp = spaceBelow < menuHeight + gap && rect.top > menuHeight + gap;

      let top = openUp ? rect.top - menuHeight - gap : rect.bottom + gap;
      let left = rect.left;

      left = Math.min(left, window.innerWidth - menuWidth - 8);
      left = Math.max(8, left);
      top = Math.max(8, Math.min(top, window.innerHeight - menuHeight - 8));

      setMenuPos({ top, left });
    }

    updatePosition();
    const frame = requestAnimationFrame(updatePosition);

    window.addEventListener("scroll", updatePosition, true);
    window.addEventListener("resize", updatePosition);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", updatePosition, true);
      window.removeEventListener("resize", updatePosition);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;

    function handlePointerDown(event: MouseEvent) {
      const target = event.target as Node;
      if (
        !buttonRef.current?.contains(target) &&
        !menuRef.current?.contains(target)
      ) {
        setOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open]);

  function handleChange(next: BookingStatus) {
    setOpen(false);
    if (next === current || disabled) return;

    const previous = current;
    setCurrent(next);

    startTransition(async () => {
      try {
        await updateBookingStatus(bookingId, next);
        router.refresh();
      } catch {
        setCurrent(previous);
        router.refresh();
      }
    });
  }

  const menu =
    open &&
    createPortal(
      <div
        ref={menuRef}
        style={{
          top: menuPos?.top ?? -9999,
          left: menuPos?.left ?? 0,
          visibility: menuPos ? "visible" : "hidden",
        }}
        className="fixed z-[200] min-w-[9.5rem] rounded-lg border border-gray-100 bg-white p-1 shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        {STATUS_OPTIONS.map((option) => {
          const isActive = option === current;
          return (
            <button
              key={option}
              type="button"
              onClick={() => handleChange(option)}
              className={`flex w-full items-center rounded-md px-2 py-1.5 text-left text-xs font-medium capitalize transition-colors hover:bg-gray-50 ${
                isActive ? "ring-1 ring-[#34AADC]/30" : ""
              }`}
            >
              <span
                className={`inline-flex rounded-full px-2 py-0.5 ${statusColorClass(option)}`}
              >
                {statusLabel(option)}
              </span>
            </button>
          );
        })}
      </div>,
      document.body
    );

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        disabled={disabled || isPending}
        onClick={(e) => {
          e.stopPropagation();
          setOpen((prev) => !prev);
        }}
        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium capitalize transition-colors focus:outline-none focus:ring-2 focus:ring-[#34AADC]/30 disabled:cursor-not-allowed disabled:opacity-60 ${statusColorClass(current)}`}
        title="Change booking status"
      >
        {statusLabel(current)}
        <ChevronDown
          className={`h-3 w-3 opacity-70 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>
      {menu}
    </>
  );
}
