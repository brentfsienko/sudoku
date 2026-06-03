"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { DogAvatar } from "@/components/DogAvatar";
import {
  FriendListPanel,
  FriendListRow,
  FriendPillButton,
  homeSectionTitleClass,
} from "@/components/home/FriendListPanel";
import { CrownIcon } from "@/components/icons";
import { createGameInvite, lookupProfileByUsername } from "@/lib/friends/api";
import { newRoomCode } from "@/lib/game/room";
import { DIFFICULTY_LABELS, GAME_MODE_LABELS, type GameMode } from "@/lib/game/types";
import { boardSharePercents } from "@/lib/stats/boardShare";
import { COOP_ACCENT, VERSUS_ACCENT } from "@/lib/stats/multi";
import type { GameLog, MultiStats, OpponentRecord, Profile } from "@/lib/stats/types";
import { dogIdForUsername, type DogId } from "@/lib/theme/dogs";

type Props = {
  history: GameLog[];
  profile: Profile;
  opponents: MultiStats["opponents"];
  userId: string | null;
  userEmail?: string | null;
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
      className="shrink-0 rounded-full px-1.5 py-px text-[9px] font-bold uppercase tracking-wide text-white"
      style={{ backgroundColor: accent }}
    >
      {log.mode === "solo" ? "Solo" : GAME_MODE_LABELS[log.mode]}
    </span>
  );
}

function RowActions({
  when,
  onPlayAgain,
  rematchBusy,
  showAgain,
}: {
  when: string;
  onPlayAgain?: () => void;
  rematchBusy?: boolean;
  showAgain?: boolean;
}) {
  return (
    <div className="flex shrink-0 flex-col items-end justify-center gap-1">
      <span className="text-[10px] font-semibold leading-none text-[var(--muted)]">
        {when}
      </span>
      {showAgain && onPlayAgain && (
        <FriendPillButton compact variant="neutral" onClick={onPlayAgain}>
          {rematchBusy ? "…" : "Again"}
        </FriendPillButton>
      )}
    </div>
  );
}

function PlayerChip({
  dogId,
  username,
  email,
  percent,
  crowned,
}: {
  dogId: DogId;
  username: string;
  email?: string | null;
  percent?: number | null;
  crowned?: boolean;
}) {
  return (
    <div className="flex min-w-0 max-w-[7.5rem] items-center gap-1.5">
      <div className="relative shrink-0">
        {crowned && (
          <span
            className="absolute -top-2 left-1/2 -translate-x-1/2 text-[var(--primary)]"
            aria-hidden
          >
            <CrownIcon width={10} height={10} />
          </span>
        )}
        <DogAvatar
          dogId={dogId}
          username={username}
          email={email}
          size={40}
          bare
        />
      </div>
      <div className="min-w-0 leading-tight">
        {percent != null && (
          <span className="font-display block text-sm font-extrabold text-[var(--foreground)]">
            {percent}%
          </span>
        )}
        <span className="block truncate text-xs font-bold text-[var(--foreground)]">
          @{username}
        </span>
      </div>
    </div>
  );
}

function MultiplayerHistoryRow({
  log,
  profile,
  opponents,
  userEmail,
  divider,
  onPlayAgain,
  rematchBusy,
}: {
  log: GameLog;
  profile: Profile;
  opponents: Record<string, OpponentRecord>;
  userEmail?: string | null;
  divider: boolean;
  onPlayAgain: () => void;
  rematchBusy: boolean;
}) {
  const opp = resolveOpponent(log, opponents);
  const competitive = log.mode === "competitive";
  const share = competitive ? boardSharePercents(log) : null;
  const meName = displayUsername(profile.username);
  const youWon = competitive && log.won && !log.tied;
  const theyWon = competitive && !log.won && !log.tied;

  return (
    <div
      className={`flex items-center gap-2.5 px-3 py-2 ${
        divider ? "border-b border-white/70" : ""
      }`}
    >
      <div className="min-w-0 flex-1">
        <div className="mb-1 flex items-center gap-1.5">
          <ModeBadge log={log} />
          <span className="truncate text-[10px] font-semibold text-[var(--muted)]">
            {DIFFICULTY_LABELS[log.difficulty]} · {outcomeText(log)}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <PlayerChip
            dogId={dogIdForUsername(meName, profile.dogId)}
            username={meName}
            email={userEmail}
            percent={competitive ? (share?.mine ?? null) : undefined}
            crowned={youWon}
          />
          <span className="shrink-0 text-[10px] font-bold uppercase text-[var(--muted)]">
            {log.mode === "coop" ? "with" : "vs"}
          </span>
          <PlayerChip
            dogId={dogIdForUsername(opp.name, opp.dogId)}
            username={opp.name}
            percent={competitive ? (share?.theirs ?? null) : undefined}
            crowned={theyWon}
          />
        </div>
      </div>
      <RowActions
        when={formatWhen(log.t)}
        showAgain
        onPlayAgain={onPlayAgain}
        rematchBusy={rematchBusy}
      />
    </div>
  );
}

function SoloHistoryRow({
  log,
  profile,
  userEmail,
  divider,
}: {
  log: GameLog;
  profile: Profile;
  userEmail?: string | null;
  divider: boolean;
}) {
  const meName = displayUsername(profile.username);

  return (
    <div
      className={`flex items-center gap-2.5 px-3 py-2 ${
        divider ? "border-b border-white/70" : ""
      }`}
    >
      <DogAvatar
        dogId={dogIdForUsername(meName, profile.dogId)}
        username={meName}
        email={userEmail}
        size={40}
        bare
      />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <span className="truncate text-sm font-bold text-[var(--foreground)]">
            @{meName}
          </span>
          <ModeBadge log={log} />
        </div>
        <span className="text-[10px] font-semibold text-[var(--muted)]">
          {outcomeText(log)} · {DIFFICULTY_LABELS[log.difficulty]}
        </span>
      </div>
      <RowActions when={formatWhen(log.t)} />
    </div>
  );
}

function HistoryRow({
  log,
  profile,
  opponents,
  userEmail,
  divider,
  onPlayAgain,
  rematchBusy,
}: {
  log: GameLog;
  profile: Profile;
  opponents: Record<string, OpponentRecord>;
  userEmail?: string | null;
  divider: boolean;
  onPlayAgain: (log: GameLog) => void;
  rematchBusy: boolean;
}) {
  if (log.mode === "solo") {
    return (
      <SoloHistoryRow
        log={log}
        profile={profile}
        userEmail={userEmail}
        divider={divider}
      />
    );
  }

  return (
    <MultiplayerHistoryRow
      log={log}
      profile={profile}
      opponents={opponents}
      userEmail={userEmail}
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
  userEmail,
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
      titleClassName={homeSectionTitleClass}
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
          userEmail={userEmail}
          divider={i < rows.length - 1}
          onPlayAgain={(entry) => void handlePlayAgain(entry)}
          rematchBusy={rematchKey === `${log.t}`}
        />
      ))}
    </FriendListPanel>
  );
}
