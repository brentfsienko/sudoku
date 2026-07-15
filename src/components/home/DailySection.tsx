"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { getDailyActiveId, getPSTDate, dayDifficulty, isTodayComplete } from "@/lib/daily/puzzle";
import { DailyLeaderboard } from "@/components/home/DailyLeaderboard";
import { DIFFICULTY_LABELS } from "@/lib/game/types";
import { homeSectionTitleClass } from "@/components/home/FriendListPanel";
import type { Friend } from "@/lib/friends/types";

// Simple calendar-day icon
function CalendarIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} className="h-6 w-6">
      <rect x="3" y="4" width="18" height="18" rx="3" />
      <path d="M3 9h18M8 2v4M16 2v4" />
    </svg>
  );
}

function ChevronDownIcon({ open }: { open: boolean }) {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="currentColor"
      className={`h-4 w-4 text-[var(--muted)] transition-transform ${open ? "rotate-180" : ""}`}
    >
      <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
    </svg>
  );
}

type Props = {
  friends: Friend[];
  myId: string | null;
};

export function DailySection({ friends, myId }: Props) {
  const router = useRouter();
  const dateStr = getPSTDate();
  const difficulty = dayDifficulty(dateStr);
  const diffLabel = DIFFICULTY_LABELS[difficulty];
  const complete = isTodayComplete();
  const [leaderboardOpen, setLeaderboardOpen] = useState(complete);

  // Format "Mon Jul 14" style
  const [year, month, day] = dateStr.split("-").map(Number);
  const dateLabel = new Date(year, month - 1, day).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });

  function handlePlay() {
    const activeId = getDailyActiveId(dateStr);
    // Pass the active ID so the page can resume
    router.push(`/play/daily?id=${activeId}`);
  }

  return (
    <section className="mb-5">
      <h2 className={`${homeSectionTitleClass} mb-2.5`}>Daily Challenge</h2>

      <div className="flex flex-col gap-2">
        {/* Play / Done card */}
        <button
          type="button"
          onClick={complete ? () => setLeaderboardOpen((o) => !o) : handlePlay}
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
              {diffLabel} · {complete ? "Completed ✓" : "Play now"}
            </p>
          </div>
          {complete ? (
            <ChevronDownIcon open={leaderboardOpen} />
          ) : (
            <span className="shrink-0 rounded-full border border-[var(--border)] bg-white px-3 py-1 text-[11px] font-bold text-[var(--foreground)]">
              Play
            </span>
          )}
        </button>

        {/* Leaderboard (collapsible) */}
        {(leaderboardOpen || complete) && (
          <div className={`transition-all duration-200 ${leaderboardOpen ? "opacity-100" : "hidden"}`}>
            <DailyLeaderboard
              friends={friends}
              myId={myId ?? ""}
              initialDate={dateStr}
            />
          </div>
        )}
      </div>
    </section>
  );
}
