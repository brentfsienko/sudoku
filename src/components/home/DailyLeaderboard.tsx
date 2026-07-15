"use client";

import { useEffect, useState } from "react";
import { fetchLeaderboard, type DailyLeaderboardEntry } from "@/lib/daily/api";
import { getPSTDate } from "@/lib/daily/puzzle";
import { formatDuration } from "@/lib/stats/progress";
import { fetchMyPublicProfile } from "@/lib/friends/api";
import type { Friend } from "@/lib/friends/types";
import type { PublicProfile } from "@/lib/friends/types";

type Props = {
  friends: Friend[];
  myId: string;
  initialDate?: string;
};

function formatDate(dateStr: string): string {
  // dateStr: "YYYY-MM-DD"
  const [year, month, day] = dateStr.split("-").map(Number);
  const d = new Date(year, month - 1, day);
  return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

function addDays(dateStr: string, n: number): string {
  const [year, month, day] = dateStr.split("-").map(Number);
  const d = new Date(year, month - 1, day + n);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

const MEDALS = ["🥇", "🥈", "🥉"];

export function DailyLeaderboard({ friends, myId, initialDate }: Props) {
  const today = getPSTDate();
  const [viewingDate, setViewingDate] = useState(initialDate ?? today);
  const [entries, setEntries] = useState<DailyLeaderboardEntry[]>([]);
  const [profiles, setProfiles] = useState<Map<string, PublicProfile>>(new Map());
  const [loading, setLoading] = useState(true);

  const friendIds = friends.map((f) => f.userId);

  useEffect(() => {
    if (!myId) {
      // Still waiting for auth to resolve — don't show stale "No results" yet
      setLoading(true);
      return;
    }
    setLoading(true);

    void (async () => {
      const [results, myProfile, ...friendProfiles] = await Promise.all([
        fetchLeaderboard(viewingDate, friendIds, myId),
        fetchMyPublicProfile(myId),
        ...friends.map((f) => fetchMyPublicProfile(f.userId)),
      ]);

      const profileMap = new Map<string, PublicProfile>();
      if (myProfile) profileMap.set(myId, myProfile);
      friends.forEach((f, i) => {
        const p = friendProfiles[i];
        if (p) profileMap.set(f.userId, p);
      });

      setEntries(results);
      setProfiles(profileMap);
      setLoading(false);
    })();
  }, [viewingDate, myId, friendIds.join(",")]); // eslint-disable-line react-hooks/exhaustive-deps

  const canGoForward = viewingDate < today;
  const canGoBack = true; // no history limit enforced

  return (
    <div className="flex flex-col gap-3">
      {/* Date navigation */}
      <div className="flex items-center justify-between rounded-2xl bg-[var(--list-panel)] px-4 py-2.5">
        <button
          onClick={() => setViewingDate((d) => addDays(d, -1))}
          disabled={!canGoBack}
          className="rounded-full p-1.5 text-[var(--primary)] disabled:opacity-30 active:bg-black/5"
          aria-label="Previous day"
        >
          <svg viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
            <path fillRule="evenodd" d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z" clipRule="evenodd" />
          </svg>
        </button>

        <div className="text-center">
          <p className="font-display text-sm font-bold text-[var(--foreground)]">
            {formatDate(viewingDate)}
          </p>
          {viewingDate === today && (
            <p className="text-[11px] text-[var(--primary)] font-semibold">Today</p>
          )}
        </div>

        <button
          onClick={() => setViewingDate((d) => addDays(d, 1))}
          disabled={!canGoForward}
          className="rounded-full p-1.5 text-[var(--primary)] disabled:opacity-30 active:bg-black/5"
          aria-label="Next day"
        >
          <svg viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
            <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" />
          </svg>
        </button>
      </div>

      {/* Leaderboard rows */}
      <div className="rounded-2xl bg-[var(--list-panel)] overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-10 text-sm text-[var(--muted)]">
            Loading…
          </div>
        ) : entries.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-1 py-10">
            <p className="text-sm font-semibold text-[var(--muted)]">No results yet</p>
            <p className="text-xs text-[var(--muted)]">Be the first to complete today's puzzle!</p>
          </div>
        ) : (
          <ul>
            {entries.map((entry, i) => {
              const isMe = entry.userId === myId;
              const profile = profiles.get(entry.userId);
              const name = profile?.username ?? (isMe ? "You" : "Unknown");
              const medal = MEDALS[i] ?? `${i + 1}.`;

              return (
                <li
                  key={entry.userId}
                  className={`flex items-center gap-3 px-4 py-3 ${i < entries.length - 1 ? "border-b border-[var(--border)]" : ""} ${isMe ? "bg-[var(--primary-soft)]" : ""}`}
                >
                  <span className="w-7 shrink-0 text-center text-base">
                    {typeof medal === "string" && medal.length <= 2 ? medal : <span className="text-sm font-bold text-[var(--muted)]">{medal}</span>}
                  </span>

                  <div className="min-w-0 flex-1">
                    <p className={`font-display text-sm font-bold ${isMe ? "text-[var(--primary)]" : "text-[var(--foreground)]"}`}>
                      {name}
                      {isMe && <span className="ml-1 text-xs font-normal text-[var(--primary)]">(you)</span>}
                    </p>
                    {entry.mistakes > 0 && (
                      <p className="text-[11px] text-[var(--muted)]">
                        {entry.mistakes} {entry.mistakes === 1 ? "mistake" : "mistakes"}
                      </p>
                    )}
                  </div>

                  <span className="font-display text-sm font-extrabold text-[var(--foreground)]">
                    {formatDuration(entry.elapsedSeconds)}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
