"use client";

import { useEffect, useMemo, useState } from "react";
import { format, parseISO, isValid } from "date-fns";

const pickerInputClass =
  "w-full min-w-0 rounded-lg border border-gray-200 py-2 pl-3 pr-10 text-sm text-gray-900 placeholder:text-gray-400 focus:border-[#34AADC] focus:outline-none focus:ring-1 focus:ring-[#34AADC] [color-scheme:light]";

const textInputClass =
  "w-full min-w-0 rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-[#34AADC] focus:outline-none focus:ring-1 focus:ring-[#34AADC]";

function parseValue(value: string): {
  date: string;
  time: string;
  isCustom: boolean;
} {
  if (!value.trim()) {
    return { date: "", time: "", isCustom: false };
  }

  const match = value.match(
    /^(\d{4}-\d{2}-\d{2})(?:[T ](\d{2}:\d{2})(?::\d{2})?(?:\.\d+)?(?:Z|[+-]\d{2}:?\d{2})?)?$/
  );
  if (match) {
    return { date: match[1], time: match[2] ?? "", isCustom: false };
  }

  return { date: "", time: "", isCustom: true };
}

function combine(date: string, time: string): string {
  if (!date) return "";
  if (!time) return date;
  return `${date}T${time}`;
}

function formatPreview(value: string): string | null {
  const { date, time, isCustom } = parseValue(value);
  if (isCustom) return null;
  if (!date) return null;

  try {
    const iso = time ? `${date}T${time}:00` : `${date}T12:00:00`;
    const parsed = parseISO(iso);
    if (!isValid(parsed)) return null;
    return time
      ? format(parsed, "EEEE, MMM d, yyyy · h:mm a")
      : format(parsed, "EEEE, MMM d, yyyy");
  } catch {
    return null;
  }
}

interface BookingDateTimeInputProps {
  value: string;
  onChange: (value: string) => void;
}

export function BookingDateTimeInput({
  value,
  onChange,
}: BookingDateTimeInputProps) {
  const parsed = parseValue(value);
  const [customMode, setCustomMode] = useState(parsed.isCustom && !!value);

  useEffect(() => {
    if (!value) setCustomMode(false);
  }, [value]);

  const preview = useMemo(() => formatPreview(value), [value]);

  function updateDate(date: string) {
    onChange(combine(date, parsed.time));
  }

  function updateTime(time: string) {
    onChange(combine(parsed.date, time));
  }

  if (customMode) {
    return (
      <div className="space-y-2">
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={textInputClass}
          placeholder='e.g. "TBD", "Week of July 14"'
        />
        <button
          type="button"
          onClick={() => {
            setCustomMode(false);
            if (parseValue(value).isCustom) onChange("");
          }}
          className="text-xs font-medium text-[#34AADC] hover:underline"
        >
          Use date & time picker instead
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="grid min-w-0 grid-cols-1 gap-2 sm:grid-cols-2">
        <input
          type="date"
          value={parsed.date}
          onChange={(e) => updateDate(e.target.value)}
          className={pickerInputClass}
        />
        <input
          type="time"
          value={parsed.time}
          onChange={(e) => updateTime(e.target.value)}
          disabled={!parsed.date}
          className={`${pickerInputClass} disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-400`}
        />
      </div>

      {preview && (
        <p className="text-xs text-gray-500">{preview}</p>
      )}

      <button
        type="button"
        onClick={() => setCustomMode(true)}
        className="text-xs text-gray-500 hover:text-gray-700"
      >
        Enter custom text instead
      </button>
    </div>
  );
}
