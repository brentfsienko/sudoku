"use client";

import { DogAvatar } from "@/components/DogAvatar";
import {
  FriendListPanel,
  FriendListRow,
} from "@/components/home/FriendListPanel";
import { CrownIcon } from "@/components/icons";
import { DIFFICULTY_LABELS, GAME_MODE_LABELS } from "@/lib/game/types";
import { COOP_ACCENT, VERSUS_ACCENT } from "@/lib/stats/multi";
import type { GameLog, MultiStats, OpponentRecord, Profile } from "@/lib/stats/types";
import type { DogId } from "@/lib/theme/dogs";

type Props = {
  history: GameLog[];
  profile: Profile;
  opponents: MultiStats["opponents"];
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

function displayUsername(raw: string): string {
  const clean = raw.replace(/^@/, "").trim();
  return clean || "pup";
}

function resolveOpponent(
  log: GameLog,
  opponents: Record<string, OpponentRecord>,
): { name: string; dogId: string } {
  if (log.opponentName?.trim()) {
    return {
      name: displayUsername(log.opponentName),
      dogId: log.opponentDogId || "golden",
    };
  }
  const records = Object.values(opponents);
  if (records.length === 1) {
    return { name: displayUsername(records[0].name), dogId: records[0].dogId };
  }
  const eligible = records.filter((r) =>
    log.mode === "coop" ? r.coopGames > 0 : r.compGames > 0,
  );
  const best = (eligible.length > 0 ? eligible : records).sort(
    (a, b) => b.games - a.games,
  )[0];
  if (best) return { name: displayUsername(best.name), dogId: best.dogId };
  return { name: "friend", dogId: "golden" };
}

function OpponentLine({
  me,
  log,
  opponents,
}: {
  me: string;
  log: GameLog;
  opponents: Record<string, OpponentRecord>;
}) {
  const youWonComp = log.mode === "competitive" && log.won && !log.tied;
  const meName = displayUsername(me);

  if (log.mode === "solo") {
    return (
      <span className="truncate text-[15px] font-bold text-[var(--foreground)]">
        @{meName}
      </span>
    );
  }

  const opp = resolveOpponent(log, opponents);
  return (
    <span className="flex min-w-0 flex-wrap items-center gap-x-1 gap-y-0.5">
      <span className="relative inline-flex items-center gap-0.5">
        {youWonComp && (
          <span className="text-[var(--primary)]" aria-hidden>
            <CrownIcon width={11} height={11} />
          </span>
        )}
        <span className="truncate text-[15px] font-bold text-[var(--foreground)]">
          @{meName}
        </span>
      </span>
      <span className="text-xs font-semibold text-[var(--muted)]">vs</span>
      <span className="truncate text-[15px] font-bold text-[var(--foreground)]">
        @{opp.name}
      </span>
    </span>
  );
}

function HistoryRow({
  log,
  profile,
  opponents,
  divider,
}: {
  log: GameLog;
  profile: Profile;
  opponents: Record<string, OpponentRecord>;
  divider: boolean;
}) {
  const opp =
    log.mode === "solo" ? null : resolveOpponent(log, opponents);
  const accent = modeAccent(log.mode);

  return (
    <FriendListRow
      divider={divider}
      avatar={
        <div className="flex shrink-0 items-center -space-x-2">
          <DogAvatar dogId={profile.dogId} size={44} />
          {opp && (
            <div className="rounded-full ring-2 ring-white">
              <DogAvatar dogId={opp.dogId as DogId} size={44} />
            </div>
          )}
        </div>
      }
      primary={
        <div className="flex min-w-0 flex-col gap-0.5">
          <OpponentLine me={profile.username} log={log} opponents={opponents} />
          <span
            className="w-fit rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white"
            style={{ backgroundColor: accent }}
          >
            {log.mode === "solo" ? "Solo" : GAME_MODE_LABELS[log.mode]}
          </span>
        </div>
      }
      secondary={`${outcomeText(log)} · ${DIFFICULTY_LABELS[log.difficulty]}`}
      action={
        <span className="text-[11px] font-semibold text-[var(--muted)]">
          {formatWhen(log.t)}
        </span>
      }
    />
  );
}

export function GameHistoryList({ history, profile, opponents }: Props) {
  const rows = [...history].reverse();

  return (
    <FriendListPanel
      title="Recent games"
      empty={
        rows.length === 0
          ? "No games yet. Finish a puzzle and it will show up here."
          : undefined
      }
    >
      {rows.map((log, i) => (
        <HistoryRow
          key={`${log.t}-${i}`}
          log={log}
          profile={profile}
          opponents={opponents}
          divider={i < rows.length - 1}
        />
      ))}
    </FriendListPanel>
  );
}
