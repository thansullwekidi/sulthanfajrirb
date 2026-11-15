"use client";

import { useEffect, useState } from "react";
import { formatClockWib } from "@/contracts/primitives";

interface ClockWibProps {
  compact?: boolean;
}

export function ClockWib({ compact = false }: ClockWibProps) {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const timer = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const time = now ? formatClockWib(now) : "--:--:--";
  const date = now
    ? new Intl.DateTimeFormat("id-ID", {
        weekday: "short",
        day: "2-digit",
        month: "short",
        year: "numeric",
        timeZone: "Asia/Jakarta"
      }).format(now)
    : "WIB · UTC+7";

  return (
    <div className="stack" style={{ gap: 4 }}>
      <span className={compact ? "mono" : "clock"} style={compact ? { fontSize: 11 } : undefined}>
        {time}
      </span>
      <span className="eyebrow">
        {date} · WIB UTC+7
      </span>
    </div>
  );
}
