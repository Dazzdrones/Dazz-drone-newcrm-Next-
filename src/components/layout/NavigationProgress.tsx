"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";

export function NavigationProgress() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [width, setWidth] = useState(0);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  function clearTimers() {
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
  }

  function startProgress() {
    clearTimers();
    setWidth(12);
    requestAnimationFrame(() => setWidth(45));
    timersRef.current.push(
      setTimeout(() => setWidth(72), 180),
      setTimeout(() => setWidth(88), 600)
    );
  }

  function completeProgress() {
    clearTimers();
    setWidth(100);
    timersRef.current.push(setTimeout(() => setWidth(0), 300));
  }

  useEffect(() => {
    completeProgress();
    return clearTimers;
  }, [pathname, searchParams]);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      const anchor = (e.target as HTMLElement).closest("a");
      if (!anchor || anchor.target === "_blank") return;

      const href = anchor.getAttribute("href");
      if (!href || href.startsWith("http") || href.startsWith("#")) return;

      const next = href.split("?")[0];
      if (next === pathname && !href.includes("?")) return;

      startProgress();
    }

    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, [pathname]);

  if (width === 0) return null;

  return (
    <div
      className="pointer-events-none fixed left-0 top-0 z-[300] h-[3px] w-full bg-transparent"
      role="progressbar"
      aria-hidden={width < 100}
    >
      <div
        className="h-full bg-gradient-to-r from-[#34AADC] via-[#5fc4ef] to-[#34AADC] shadow-[0_0_12px_rgba(52,170,220,0.55)] transition-[width] duration-300 ease-out"
        style={{ width: `${width}%` }}
      />
    </div>
  );
}
