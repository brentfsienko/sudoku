"use client";

import { DogAvatar } from "@/components/DogAvatar";
import { CrownIcon } from "@/components/icons";
import { DIFFICULTY_LABELS, GAME_MODE_LABELS } from "@/lib/game/types";
import { COOP_ACCENT, VERSUS_ACCENT } from "@/lib/stats/multi";
import type { GameLog, Profile } from "@/lib/stats/types";
import type { DogId } from "@/lib/theme/dogs";

type Props = {
  history: GameLog[];
  profile: Profile;
};

function formatWhen(t: number): string {
  const d = new Date(t);
  const now = new Date();
  const today = now.toDateString();
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  if (d.toDateString() === today) {
    return d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
  }
  if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function outcomeText(log: GameLog): string {
  if (log.mode === "solo") return log.won ? "Solved" : "Not solved";
  if (log.mode === "coop") return log.won ? "Solved together" : "Unsolved";
  if (log.tied) return "Tie";
  return log.won ? "You won" : "They won";
}

function modeAccent(mode: GameLog["mode"]): string {
  if (mode === "coop") return COOP_ACCENT;
  if (mode === "competitive") return VERSUS_ACCENT;
  return "#a06bd6";
}

function PlayerTag({
  name,
  crowned,
}: {
  name: string;
  crowned?: boolean;
}) {
  const label = name.startsWith("@") ? name : `@${name}`;
  return (
    <span className="relative inline-flex max-w-[9rem] flex-col items-center">
      {crowned && (
        <span className="text-[var(--primary)]" aria-hidden>
          <CrownIcon width={11} height={11} />
        </span>
      )}
      <span
        className={`truncate text-sm font-bold text-[var(--foreground)] ${
          crowned ? "-mt-0.5" : ""
        }`}
      >
        {label}
      </span>
    </span>
  );
}

function HistoryRow({ log, profile }: { log: GameLog; profile: Profile }) {
  const me = profile.username;
  const opp = log.opponentName?.trim() || "Friend";
  const accent = modeAccent(log.mode);
  const youWonComp = log.mode === "competitive" && log.won && !log.tied;

  return (
    <div className="flex items-center gap-3 border-b border-[var(--border)] px-4 py-3.5 last:border-b-0">
      <div className="flex shrink-0 items-center -space-x-2">
        <DogAvatar dogId={profile.dogId} size={36} />
        {log.mode !== "solo" && (
          <div className="ring-2 ring-white rounded-full">
            <DogAvatar
              dogId={(log.opponentDogId as DogId) || "golden"}
              size={36}
            />
          </div>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5">
          {log.mode === "solo" ? (
            <PlayerTag name={me} />
          ) : (
            <>
              <PlayerTag name={me} crowned={youWonComp} />
              <span className="text-xs font-semibold text-[var(--muted)]">vs</span>
              <PlayerTag name={opp} />
            </>
          )}
          <span
            className="ml-1 shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white"
            style={{ backgroundColor: accent }}
          >
            {log.mode === "solo" ? "Solo" : GAME_MODE_LABELS[log.mode]}
          </span>
        </div>
        <div className="mt-0.5 text-xs text-[var(--muted)]">
          {outcomeText(log)} · {DIFFICULTY_LABELS[log.difficulty]}
        </div>
      </div>

      <div className="shrink-0 text-right text-[11px] font-semibold text-[var(--muted)]">
        {formatWhen(log.t)}
      </div>
    </div>
  );
}

export function GameHistoryList({ history, profile }: Props) {
  const rows = [...history].reverse();

  return (
    <section className="flex flex-col gap-2">
      <h2 className="font-serif-title text-xl text-[var(--foreground)]">Recent games</h2>
      <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
        {rows.length === 0 ? (
          <p className="px-4 py-6 text-center text-sm text-[var(--muted)]">
            No games yet. Finish a puzzle and it will show up here.
          </p>
        ) : (
          rows.map((log, i) => (
            <HistoryRow key={`${log.t}-${i}`} log={log} profile={profile} />
          ))
        )}
      </div>
    </section>
  );
}
