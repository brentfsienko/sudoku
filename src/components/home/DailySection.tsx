"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getPSTDate, dayDifficulty, isTodayComplete } from "@/lib/daily/puzzle";
import { fetchMyDailyResult } from "@/lib/daily/api";
import { loadDailyResultLocal } from "@/lib/daily/local";
import { formatDurationExact } from "@/lib/stats/progress";
import { DIFFICULTY_LABELS } from "@/lib/game/types";
import { homeSectionTitleClass } from "@/components/home/FriendListPanel";

// Re-check daily completion status from localStorage after mount so SSR
// hydration mismatch (server has no window) doesn't leave the card stuck on "Play".
function useDailyComplete(dateStr: string) {
  const [complete, setComplete] = useState(false);
  // null = not attempted, true = solved, false = failed
  const [solved, setSolved] = useState<boolean | null>(null);
  const [myTime, setMyTime] = useState<number | null>(null);

  useEffect(() => {
    const done = isTodayComplete();
    setComplete(done);
    if (!done) return;

    // Check local storage first for instant feedback.
    const local = loadDailyResultLocal(dateStr);
    if (local !== null) {
      setSolved(local.solved);
      if (local.solved) setMyTime(local.elapsedSeconds);
    }

    // Then reconcile with Supabase (may have solved on another device).
    void fetchMyDailyResult(dateStr).then((r) => {
      if (r) {
        setSolved(true);
        setMyTime(r.elapsedSeconds);
      }
    });
  }, [dateStr]);

  return { complete, solved, myTime };
}

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
  const { complete, solved, myTime } = useDailyComplete(dateStr);

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
          <div className="flex items-center gap-1.5">
            <p className="font-display text-sm font-bold text-[var(--foreground)]">
              {dateLabel}
            </p>
            {complete && solved && (
              /* Green checkmark — solved */
              <svg viewBox="0 0 16 16" className="h-4 w-4 shrink-0 text-green-500" fill="none" stroke="currentColor" strokeWidth={2.5}>
                <circle cx="8" cy="8" r="7" />
                <path d="M5 8.5l2 2 4-4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
            {complete && solved === false && (
              /* Red X — failed */
              <svg viewBox="0 0 16 16" className="h-4 w-4 shrink-0 text-red-500" fill="none" stroke="currentColor" strokeWidth={2.5}>
                <circle cx="8" cy="8" r="7" />
                <path d="M5.5 5.5l5 5M10.5 5.5l-5 5" strokeLinecap="round" />
              </svg>
            )}
          </div>
          <p className="text-xs text-[var(--muted)]">
            {diffLabel}
            {complete && solved && myTime !== null && (
              <>
                {" · "}
                <span className="font-semibold text-[var(--primary)]">
                  {formatDurationExact(myTime)}
                </span>
              </>
            )}
            {complete && solved === false && (
              <span className="font-semibold text-red-500"> · Not solved</span>
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
