"use client";

import { useEffect, useMemo, useState } from "react";
import { BulbIcon } from "@/components/icons";
import { factForDay, todayDateKey } from "@/lib/trivia/facts";

function useDailyFact() {
  const [dayKey, setDayKey] = useState(todayDateKey);
  const fact = useMemo(() => factForDay(), [dayKey]);

  useEffect(() => {
    const tick = () => {
      const next = todayDateKey();
      setDayKey((prev) => (prev === next ? prev : next));
    };
    tick();
    const id = window.setInterval(tick, 60_000);
    return () => window.clearInterval(id);
  }, []);

  return fact;
}

export function FactGuessCard() {
  const fact = useDailyFact();

  return (
    <section>
      <div className="flex items-start gap-3 overflow-hidden rounded-3xl border border-[var(--border)] bg-[var(--surface-soft)] px-4 py-3.5">
        <span className="mt-0.5 shrink-0 text-[var(--primary)]">
          <BulbIcon width={18} height={18} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-serif-title text-sm leading-snug text-[var(--foreground)]">
            {fact.text}
          </p>
          <p className="mt-1 text-[10px] font-semibold uppercase tracking-wide text-[var(--muted)]">
            Today&apos;s fact
          </p>
        </div>
      </div>
    </section>
  );
}
