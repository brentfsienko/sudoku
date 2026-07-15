"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getPSTDate, dayDifficulty, isTodayComplete } from "@/lib/daily/puzzle";
import { fetchMyDailyResult } from "@/lib/daily/api";
import { loadDailyResultLocal } from "@/lib/daily/local";
import { formatDuration } from "@/lib/stats/progress";
import { DIFFICULTY_LABELS } from "@/lib/game/types";
import { homeSectionTitleClass } from "@/components/home/FriendListPanel";

function CalendarIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} className="h-6 w-6">
      <rect x="3" y="4" width="18" height="18" rx="3" />
      <path d="M3 9h18M8 2v4M16 2v4" />
    </svg>
  );
}

type Props = {
  onViewLeaderboard: () => void;
};

export function DailySection({ onViewLeaderboard }: Props) {
  const router = useRouter();
  const dateStr = getPSTDate();
  const difficulty = dayDifficulty(dateStr);
  const diffLabel = DIFFICULTY_LABELS[difficulty];
  const complete = isTodayComplete();

  // Initialise from localStorage immediately (no flash of missing time)
  const [myTime, setMyTime] = useState<number | null>(() =>
    complete ? loadDailyResultLocal(dateStr) : null,
  );

  // Also try Supabase in case the table is available or the result came from another device
  useEffect(() => {
    if (!complete) return;
    void fetchMyDailyResult(dateStr).then((r) => {
      if (r) setMyTime(r.elapsedSeconds);
    });
  }, [complete, dateStr]);

  const [year, month, day] = dateStr.split("-").map(Number);
  const dateLabel = new Date(year, month - 1, day).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });

  return (
    <section className="mb-5">
      <h2 className={`${homeSectionTitleClass} mb-2.5`}>Daily Challenge</h2>

      <button
        type="button"
        onClick={() => complete ? onViewLeaderboard() : router.push("/play/daily")}
        className="flex w-full items-center gap-3 rounded-2xl bg-[var(--list-panel)] px-4 py-3 text-left transition active:scale-[0.99]"
      >
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[var(--primary-soft)] text-[var(--primary)]">
          <CalendarIcon />
        </div>

        <div className="min-w-0 flex-1">
          <p className="font-display text-sm font-bold text-[var(--foreground)]">
            {dateLabel}
          </p>
          <p className="text-xs text-[var(--muted)]">
            {diffLabel}
            {complete && (
              <>
                {" · "}
                <span className="text-[var(--primary)] font-semibold">
                  {myTime !== null ? formatDuration(myTime) : "Completed ✓"}
                </span>
              </>
            )}
          </p>
        </div>

        <span className="shrink-0 rounded-full border border-[var(--border)] bg-white px-3 py-1 text-[11px] font-bold text-[var(--foreground)]">
          {complete ? "Leaderboard" : "Play"}
        </span>
      </button>
    </section>
  );
}
