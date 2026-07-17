"use client";

import { useEffect, useState } from "react";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { BoneDifficultySelect } from "@/components/home/BoneDifficultySelect";
import {
  DIFFICULTIES,
  DIFFICULTY_LABELS,
  GAME_MODE_LABELS,
  MAX_PLAYERS,
  type Difficulty,
} from "@/lib/game/types";
import { COOP_ACCENT, VERSUS_ACCENT } from "@/lib/stats/multi";

export type GameSetupResult =
  | { kind: "solo"; difficulty: Difficulty }
  | {
      kind: "multiplayer";
      difficulty: Difficulty;
      mode: "coop" | "competitive";
      /** Total players including the host (2–MAX_PLAYERS). */
      playerCount: number;
    };

type Props = {
  open: boolean;
  onClose: () => void;
  kind: "solo" | "multiplayer";
  opponentName?: string;
  onConfirm: (result: GameSetupResult) => void;
};

const SOLO_DIFFICULTY_HINTS: Record<Difficulty, string> = {
  easy: "For beginners",
  medium: "A good daily challenge",
  hard: "Fewer clues, more thinking",
  expert: "Serious puzzlers only",
  master: "Maximum difficulty",
};

const PLAYER_COUNTS = Array.from(
  { length: MAX_PLAYERS - 1 },
  (_, i) => i + 2,
); // 2, 3, 4

export function GameSetupSheet({
  open,
  onClose,
  kind,
  opponentName,
  onConfirm,
}: Props) {
  const [difficulty, setDifficulty] = useState<Difficulty>("medium");
  const [mode, setMode] = useState<"coop" | "competitive">("coop");
  const [playerCount, setPlayerCount] = useState(2);

  useEffect(() => {
    if (open) {
      setDifficulty("medium");
      setMode("coop");
      setPlayerCount(2);
    }
  }, [open]);

  function handleStart() {
    if (kind === "solo") {
      onConfirm({ kind: "solo", difficulty });
    } else {
      onConfirm({ kind: "multiplayer", difficulty, mode, playerCount });
    }
  }

  const title =
    kind === "solo"
      ? "Solo practice"
      : opponentName
        ? `Play with @${opponentName}`
        : "Multiplayer";

  return (
    <BottomSheet open={open} onClose={onClose} title={title}>
      {kind === "multiplayer" && (
        <div className="mb-4">
          <p className="mb-2 text-xs font-bold uppercase tracking-wide text-[var(--muted)]">
            Mode
          </p>
          <div className="flex gap-2">
            {(["coop", "competitive"] as const).map((m) => {
              const active = mode === m;
              const accent = m === "coop" ? COOP_ACCENT : VERSUS_ACCENT;
              return (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMode(m)}
                  className="font-display flex-1 rounded-2xl border-2 py-3 text-sm font-bold transition active:scale-[0.98]"
                  style={{
                    borderColor: active ? accent : "var(--border)",
                    backgroundColor: active ? accent : "white",
                    color: active ? "#fff" : "var(--muted)",
                  }}
                >
                  {GAME_MODE_LABELS[m]}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {kind === "solo" ? (
        <div className="flex flex-col gap-2">
          <p className="text-xs font-bold uppercase tracking-wide text-[var(--muted)]">
            Difficulty
          </p>
          {DIFFICULTIES.map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => setDifficulty(d)}
              className={`flex items-center justify-between rounded-2xl border-2 px-4 py-3 text-left transition active:scale-[0.98] ${
                difficulty === d
                  ? "border-[var(--primary)] bg-[var(--primary-soft)]"
                  : "border-[var(--border)] bg-white"
              }`}
            >
              <div>
                <div className="mb-0.5 font-display text-sm font-bold text-[var(--foreground)]">
                  {DIFFICULTY_LABELS[d]}
                </div>
                <div className="text-xs text-[var(--muted)]">
                  {SOLO_DIFFICULTY_HINTS[d]}
                </div>
              </div>
              {difficulty === d && (
                <span className="text-sm font-bold text-[var(--primary)]">✓</span>
              )}
            </button>
          ))}
        </div>
      ) : (
        <BoneDifficultySelect value={difficulty} onChange={setDifficulty} />
      )}

      {kind === "multiplayer" && !opponentName && (
        <div className="mt-4">
          <p className="mb-2 text-xs font-bold uppercase tracking-wide text-[var(--muted)]">
            Players
          </p>
          <div className="flex gap-2">
            {PLAYER_COUNTS.map((n) => {
              const active = playerCount === n;
              return (
                <button
                  key={n}
                  type="button"
                  onClick={() => setPlayerCount(n)}
                  className={`font-display flex-1 rounded-2xl border-2 py-3 text-sm font-bold transition active:scale-[0.98] ${
                    active
                      ? "border-[var(--primary)] bg-[var(--primary-soft)] text-[var(--foreground)]"
                      : "border-[var(--border)] bg-white text-[var(--muted)]"
                  }`}
                >
                  {n}
                </button>
              );
            })}
          </div>
          <p className="mt-1.5 text-[11px] text-[var(--muted)]">
            You plus up to {playerCount - 1}{" "}
            {playerCount - 1 === 1 ? "friend" : "friends"} (max {MAX_PLAYERS}).
          </p>
        </div>
      )}

      <button
        type="button"
        onClick={handleStart}
        className="font-display mt-5 w-full rounded-2xl bg-[var(--foreground)] py-4 text-lg font-extrabold text-white transition active:scale-[0.98]"
      >
        {kind === "solo"
          ? "Start puzzle"
          : opponentName
            ? "Send invite & play"
            : "Next: invite friends"}
      </button>
    </BottomSheet>
  );
}
