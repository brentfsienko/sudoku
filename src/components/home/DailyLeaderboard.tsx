"use client";

import { useEffect, useState } from "react";
import { fetchLeaderboard, ensureDailyResultSynced, type DailyLeaderboardEntry } from "@/lib/daily/api";
import { getPSTDate } from "@/lib/daily/puzzle";
import { loadDailyResultLocal } from "@/lib/daily/local";
import { formatDurationExact } from "@/lib/stats/progress";
import { fetchMyPublicProfile } from "@/lib/friends/api";
import { DogAvatar } from "@/components/DogAvatar";
import type { Friend } from "@/lib/friends/types";
import type { PublicProfile } from "@/lib/friends/types";

type Props = {
  friends: Friend[];
  myId: string;
  initialDate?: string;
};

function formatDate(dateStr: string): string {
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

function LeaderboardRow({
  entry,
  rank,
  isMe,
  profile,
  isLast,
  isFailed,
}: {
  entry: DailyLeaderboardEntry;
  rank: number | null;
  isMe: boolean;
  profile: PublicProfile | undefined;
  isLast: boolean;
  isFailed: boolean;
}) {
  const name = profile?.username ?? (isMe ? "You" : "Unknown");
  const dogId = profile?.dogId ?? "golden";
  const medal = rank !== null ? (MEDALS[rank] ?? `${rank + 1}.`) : null;

  return (
    <li
      className={`flex items-center gap-3 px-4 py-3 ${!isLast ? "border-b border-[var(--border)]" : ""} ${isMe ? "bg-[var(--primary-soft)]" : ""}`}
    >
      {/* Rank / failure indicator */}
      <span className="w-6 shrink-0 text-center text-base leading-none">
        {isFailed ? (
          <svg viewBox="0 0 16 16" className="mx-auto h-4 w-4 text-red-500" fill="none" stroke="currentColor" strokeWidth={2.5}>
            <path d="M4 4l8 8M12 4l-8 8" strokeLinecap="round" />
          </svg>
        ) : typeof medal === "string" && medal.length <= 2 ? (
          medal
        ) : (
          <span className="text-sm font-bold text-[var(--muted)]">{medal}</span>
        )}
      </span>

      {/* Avatar */}
      <DogAvatar dogId={dogId} username={name} size={36} bare />

      {/* Name + mistakes */}
      <div className="min-w-0 flex-1">
        <p className={`font-display text-sm font-bold leading-tight ${isMe ? "text-[var(--primary)]" : "text-[var(--foreground)]"}`}>
          {name}
          {isMe && <span className="ml-1 text-xs font-normal text-[var(--primary)]">(you)</span>}
        </p>
        {entry.mistakes > 0 && (
          <p className="text-[11px] text-[var(--muted)]">
            {entry.mistakes} {entry.mistakes === 1 ? "mistake" : "mistakes"}
          </p>
        )}
      </div>

      {/* Time or "Not solved" */}
      {isFailed ? (
        <span className="text-sm font-semibold text-red-500">Not solved</span>
      ) : (
        <span className="font-display text-sm font-extrabold tabular-nums text-[var(--foreground)]">
          {formatDurationExact(entry.elapsedSeconds)}
        </span>
      )}
    </li>
  );
}

export function DailyLeaderboard({ friends, myId, initialDate }: Props) {
  const today = getPSTDate();
  const [viewingDate, setViewingDate] = useState(initialDate ?? today);
  const [entries, setEntries] = useState<DailyLeaderboardEntry[]>([]);
  const [profiles, setProfiles] = useState<Map<string, PublicProfile>>(new Map());
  const [loading, setLoading] = useState(true);
  const [reloadToken, setReloadToken] = useState(0);
  const [syncHint, setSyncHint] = useState<string | null>(null);

  const friendIds = friends.map((f) => f.userId);

  useEffect(() => {
    if (!myId) {
      setLoading(true);
      return;
    }
    setLoading(true);
    setSyncHint(null);

    let cancelled = false;
    void (async () => {
      // Recover local completions that never made it to daily_results.
      if (viewingDate === today) {
        const synced = await ensureDailyResultSynced(viewingDate);
        const local = loadDailyResultLocal(viewingDate);
        if (!cancelled && local && !synced.ok) {
          setSyncHint(synced.error ?? "Couldn't sync your score. Tap retry.");
        }
      }
      if (cancelled) return;

      const [results, myProfile, ...friendProfiles] = await Promise.all([
        fetchLeaderboard(viewingDate, friendIds, myId),
        fetchMyPublicProfile(myId),
        ...friends.map((f) => fetchMyPublicProfile(f.userId)),
      ]);
      if (cancelled) return;

      const profileMap = new Map<string, PublicProfile>();
      if (myProfile) profileMap.set(myId, myProfile);
      friends.forEach((f, i) => {
        const p = friendProfiles[i];
        if (p) profileMap.set(f.userId, p);
      });

      setEntries(results);
      setProfiles(profileMap);
      if (results.some((e) => e.userId === myId)) setSyncHint(null);
      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [viewingDate, myId, friendIds.join(","), reloadToken, today]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const refresh = () => {
      if (document.visibilityState === "visible") {
        setReloadToken((n) => n + 1);
      }
    };
    document.addEventListener("visibilitychange", refresh);
    window.addEventListener("focus", refresh);
    return () => {
      document.removeEventListener("visibilitychange", refresh);
      window.removeEventListener("focus", refresh);
    };
  }, []);

  const canGoForward = viewingDate < today;

  const solvedEntries = entries.filter((e) => e.solved);
  const failedEntries = entries.filter((e) => !e.solved);
  const missingMine =
    !loading &&
    viewingDate === today &&
    !entries.some((e) => e.userId === myId) &&
    loadDailyResultLocal(viewingDate) != null;

  return (
    <div className="flex flex-col gap-3">
      {/* Date navigation */}
      <div className="flex items-center justify-between rounded-2xl bg-[var(--list-panel)] px-4 py-2.5">
        <button
          onClick={() => setViewingDate((d) => addDays(d, -1))}
          className="rounded-full p-1.5 text-[var(--primary)] active:bg-black/5"
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

      {(syncHint || missingMine) && (
        <button
          type="button"
          onClick={() => setReloadToken((n) => n + 1)}
          className="rounded-2xl border border-[var(--border)] bg-white px-4 py-3 text-left active:bg-[var(--surface-soft)]"
        >
          <p className="font-display text-sm font-bold text-[var(--foreground)]">
            Your score isn’t on the board yet
          </p>
          <p className="text-xs text-[var(--muted)]">
            {syncHint ?? "Tap to sync your daily time."}
          </p>
        </button>
      )}

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
            {solvedEntries.map((entry, i) => (
              <LeaderboardRow
                key={entry.userId}
                entry={entry}
                rank={i}
                isMe={entry.userId === myId}
                profile={profiles.get(entry.userId)}
                isLast={i === entries.length - 1}
                isFailed={false}
              />
            ))}

            {/* Divider between solvers and failures */}
            {failedEntries.length > 0 && solvedEntries.length > 0 && (
              <li className="border-t border-[var(--border)] px-4 py-1.5">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--muted)]">
                  Did not solve
                </p>
              </li>
            )}

            {failedEntries.map((entry, i) => (
              <LeaderboardRow
                key={entry.userId}
                entry={entry}
                rank={null}
                isMe={entry.userId === myId}
                profile={profiles.get(entry.userId)}
                isLast={i === failedEntries.length - 1}
                isFailed={true}
              />
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
