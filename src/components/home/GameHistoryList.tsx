"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { DogAvatar } from "@/components/DogAvatar";
import {
  FriendListPanel,
  FriendListRow,
  FriendPillButton,
} from "@/components/home/FriendListPanel";
import { CrownIcon } from "@/components/icons";
import { createGameInvite, lookupProfileByUsername } from "@/lib/friends/api";
import { newRoomCode } from "@/lib/game/room";
import { DIFFICULTY_LABELS, GAME_MODE_LABELS, type GameMode } from "@/lib/game/types";
import { boardSharePercents } from "@/lib/stats/boardShare";
import { COOP_ACCENT, VERSUS_ACCENT } from "@/lib/stats/multi";
import type { GameLog, MultiStats, OpponentRecord, Profile } from "@/lib/stats/types";
import type { DogId } from "@/lib/theme/dogs";

type Props = {
  history: GameLog[];
  profile: Profile;
  opponents: MultiStats["opponents"];
  userId: string | null;
  authConfigured: boolean;
};

function formatWhen(t: number): string {
  const d = new Date(t);
  const now = new Date();
  const today = now.toDateString();
  const yesterday = new Date();
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

function ModeBadge({ log }: { log: GameLog }) {
  const accent = modeAccent(log.mode);
  return (
    <span
      className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white"
      style={{ backgroundColor: accent }}
    >
      {log.mode === "solo" ? "Solo" : GAME_MODE_LABELS[log.mode]}
    </span>
  );
}

function PlayerColumn({
  dogId,
  username,
  percent,
  crowned,
}: {
  dogId: DogId;
  username: string;
  percent: number | null;
  crowned?: boolean;
}) {
  return (
    <div className="flex min-w-0 flex-1 flex-col items-center gap-0.5">
      <div className="relative mb-0.5">
        {crowned && (
          <span
            className="absolute -top-3 left-1/2 -translate-x-1/2 text-[var(--primary)]"
            aria-hidden
          >
            <CrownIcon width={14} height={14} />
          </span>
        )}
        <DogAvatar dogId={dogId} size={48} />
      </div>
      {percent != null ? (
        <span className="font-display text-xl font-extrabold leading-none text-[var(--foreground)]">
          {percent}%
        </span>
      ) : (
        <span className="font-display text-lg font-extrabold leading-none text-[var(--muted)]">
          —
        </span>
      )}
      <span className="max-w-[5.5rem] truncate text-center text-xs font-bold text-[var(--foreground)]">
        @{username}
      </span>
    </div>
  );
}

function MultiplayerHistoryRow({
  log,
  profile,
  opponents,
  divider,
  onPlayAgain,
  rematchBusy,
}: {
  log: GameLog;
  profile: Profile;
  opponents: Record<string, OpponentRecord>;
  divider: boolean;
  onPlayAgain: () => void;
  rematchBusy: boolean;
}) {
  const opp = resolveOpponent(log, opponents);
  const share = boardSharePercents(log);
  const meName = displayUsername(profile.username);
  const youWon = log.mode === "competitive" && log.won && !log.tied;
  const theyWon = log.mode === "competitive" && !log.won && !log.tied;

  return (
    <div
      className={`px-4 py-4 ${
        divider ? "border-b border-white/70" : ""
      }`}
    >
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <ModeBadge log={log} />
        <span className="text-xs font-semibold text-[var(--muted)]">
          {DIFFICULTY_LABELS[log.difficulty]} · {outcomeText(log)}
        </span>
      </div>

      <div className="flex max-w-[17rem] items-start gap-3">
        <PlayerColumn
          dogId={profile.dogId}
          username={meName}
          percent={share?.mine ?? null}
          crowned={youWon}
        />
        <span className="pt-7 text-[11px] font-bold uppercase tracking-wide text-[var(--muted)]">
          {log.mode === "coop" ? "with" : "vs"}
        </span>
        <PlayerColumn
          dogId={opp.dogId as DogId}
          username={opp.name}
          percent={share?.theirs ?? null}
          crowned={theyWon}
        />
      </div>

      <div className="mt-3 flex items-center justify-between border-t border-white/60 pt-2.5">
        <span className="text-xs font-semibold text-[var(--muted)]">
          {formatWhen(log.t)}
        </span>
        <FriendPillButton variant="neutral" onClick={onPlayAgain}>
          {rematchBusy ? "…" : "Again"}
        </FriendPillButton>
      </div>
    </div>
  );
}

function SoloHistoryRow({
  log,
  profile,
  divider,
}: {
  log: GameLog;
  profile: Profile;
  divider: boolean;
}) {
  const meName = displayUsername(profile.username);

  return (
    <FriendListRow
      divider={divider}
      avatar={<DogAvatar dogId={profile.dogId} size={44} />}
      primary={
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[15px] font-bold text-[var(--foreground)]">
            @{meName}
          </span>
          <ModeBadge log={log} />
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

function HistoryRow({
  log,
  profile,
  opponents,
  divider,
  onPlayAgain,
  rematchBusy,
}: {
  log: GameLog;
  profile: Profile;
  opponents: Record<string, OpponentRecord>;
  divider: boolean;
  onPlayAgain: (log: GameLog) => void;
  rematchBusy: boolean;
}) {
  if (log.mode === "solo") {
    return (
      <SoloHistoryRow log={log} profile={profile} divider={divider} />
    );
  }

  return (
    <MultiplayerHistoryRow
      log={log}
      profile={profile}
      opponents={opponents}
      divider={divider}
      onPlayAgain={() => onPlayAgain(log)}
      rematchBusy={rematchBusy}
    />
  );
}

export function GameHistoryList({
  history,
  profile,
  opponents,
  userId,
  authConfigured,
}: Props) {
  const router = useRouter();
  const [rematchKey, setRematchKey] = useState<string | null>(null);
  const rows = [...history].reverse();

  async function handlePlayAgain(log: GameLog) {
    if (log.mode === "solo") return;
    const key = `${log.t}`;
    setRematchKey(key);

    const gameMode: GameMode =
      log.mode === "competitive" ? "competitive" : "coop";
    const code = newRoomCode();
    const opp = resolveOpponent(log, opponents);

    try {
      if (authConfigured && userId) {
        const guest = await lookupProfileByUsername(opp.name, userId);
        if (guest) {
          await createGameInvite(
            userId,
            guest.userId,
            code,
            gameMode,
            log.difficulty,
          );
        }
      }

      router.push(`/game/${code}?host=1&m=${gameMode}&d=${log.difficulty}`);
    } finally {
      setRematchKey(null);
    }
  }

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
          onPlayAgain={(entry) => void handlePlayAgain(entry)}
          rematchBusy={rematchKey === `${log.t}`}
        />
      ))}
    </FriendListPanel>
  );
}
