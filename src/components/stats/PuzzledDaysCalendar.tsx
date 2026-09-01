"use client";

import { useMemo, useState } from "react";
import type { GameLog } from "@/lib/stats/types";

const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

function monthLabel(year: number, month: number) {
  return new Date(year, month, 1).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });
}

function dayKey(year: number, month: number, day: number) {
  return `${year}-${month}-${day}`;
}

type Props = {
  history: GameLog[];
};

/** Month grid of days the player finished a puzzle (any mode). */
export function PuzzledDaysCalendar({ history }: Props) {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());

  const puzzled = useMemo(() => {
    const set = new Set<string>();
    for (const log of history) {
      const d = new Date(log.t);
      set.add(dayKey(d.getFullYear(), d.getMonth(), d.getDate()));
    }
    return set;
  }, [history]);

  const isCurrentMonth =
    year === now.getFullYear() && month === now.getMonth();

  function goPrev() {
    if (month === 0) {
      setYear((y) => y - 1);
      setMonth(11);
    } else {
      setMonth((m) => m - 1);
    }
  }

  function goNext() {
    if (isCurrentMonth) return;
    if (month === 11) {
      setYear((y) => y + 1);
      setMonth(0);
    } else {
      setMonth((m) => m + 1);
    }
  }

  const firstDow = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = [
    ...Array.from({ length: firstDow }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  const puzzledThisMonth = cells.filter(
    (d) => d != null && puzzled.has(dayKey(year, month, d)),
  ).length;

  return (
    <section className="flex flex-col gap-3 rounded-md border border-[var(--border)] bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={goPrev}
          className="flex h-9 w-9 items-center justify-center rounded-md border border-[var(--border)] text-[var(--foreground)] active:bg-[var(--surface-soft)]"
          aria-label="Previous month"
        >
          ‹
        </button>
        <div className="min-w-0 text-center">
          <p className="font-display text-sm font-extrabold text-[var(--foreground)]">
            {monthLabel(year, month)}
          </p>
          <p className="text-[11px] font-semibold text-[var(--muted)]">
            {puzzledThisMonth} day{puzzledThisMonth === 1 ? "" : "s"} puzzled
          </p>
        </div>
        <button
          type="button"
          onClick={goNext}
          disabled={isCurrentMonth}
          className="flex h-9 w-9 items-center justify-center rounded-md border border-[var(--border)] text-[var(--foreground)] active:bg-[var(--surface-soft)] disabled:opacity-35"
          aria-label="Next month"
        >
          ›
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center">
        {WEEKDAYS.map((d) => (
          <div
            key={d}
            className="py-1 text-[10px] font-bold uppercase tracking-wide text-[var(--muted)]"
          >
            {d}
          </div>
        ))}
        {cells.map((day, i) => {
          if (day == null) {
            return <div key={`e-${i}`} className="aspect-square" />;
          }
          const marked = puzzled.has(dayKey(year, month, day));
          const isToday =
            isCurrentMonth && day === now.getDate();
          return (
            <div
              key={day}
              className={`relative flex aspect-square items-center justify-center rounded-md text-xs font-bold ${
                isToday
                  ? "ring-2 ring-[var(--primary)] ring-offset-1"
                  : ""
              } ${
                marked
                  ? "bg-[var(--primary)] text-white"
                  : "text-[var(--muted)]"
              }`}
              title={marked ? "Puzzled this day" : undefined}
            >
              {day}
            </div>
          );
        })}
      </div>
    </section>
  );
}
