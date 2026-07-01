"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { SEEN_TRACKED_TABLES } from "@/lib/new-records";

export function DashboardLiveUpdates() {
  const router = useRouter();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    function scheduleRefresh() {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        router.refresh();
      }, 400);
    }

    const channel = supabase.channel("crm-live-updates");

    for (const table of SEEN_TRACKED_TABLES) {
      channel.on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table },
        scheduleRefresh
      );
    }

    channel.subscribe();

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      supabase.removeChannel(channel);
    };
  }, [router]);

  return null;
}
