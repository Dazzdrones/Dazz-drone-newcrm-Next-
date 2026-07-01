"use client";

import { useEffect } from "react";
import { markAllRecordsSeen } from "@/lib/actions";
import type { TableName } from "@/lib/types";

/** Marks records seen after paint — does not block the initial server render. */
export function MarkSeenOnVisit({ table }: { table: TableName }) {
  useEffect(() => {
    void markAllRecordsSeen(table);
  }, [table]);

  return null;
}
