"use client";

import { useEffect, useState } from "react";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { BoneTally } from "@/components/BoneTally";
import { BoneDifficultySelect } from "@/components/home/BoneDifficultySelect";
import {
  DIFFICULTIES,
  GAME_MODE_LABELS,
  type Difficulty,
} from "@/lib/game/types";
import { COOP_ACCENT, VERSUS_ACCENT } from "@/lib/stats/multi";

export type GameSetupResult =
  | { kind: "solo"; difficulty: Difficulty }
  | { kind: "multiplayer"; difficulty: Difficulty; mode: "coop" | "competitive" };

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

export function GameSetupSheet({
  open,
  onClose,
  kind,
  opponentName,
  onConfirm,
}: Props) {
  const [difficulty, setDifficulty] = useState<Difficulty>("medium");
  const [mode, setMode] = useState<"coop" | "competitive">("coop");

  useEffect(() => {
    if (open) {
      setDifficulty("medium");
      setMode("coop");
    }
  }, [open]);

  function handleStart() {
    if (kind === "solo") {
      onConfirm({ kind: "solo", difficulty });
    } else {
      onConfirm({ kind: "multiplayer", difficulty, mode });
    }
  }

  const title =
    kind === "solo"
      ? "Solo practice"
      : opponentName
        ? `Play with @${opponentName}`
        : "Start game";

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
                <div className="mb-0.5 flex items-center gap-2">
                  <BoneTally difficulty={d} size={17} />
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

      <button
        type="button"
        onClick={handleStart}
        className="font-display mt-5 w-full rounded-2xl bg-[var(--foreground)] py-4 text-lg font-extrabold text-white transition active:scale-[0.98]"
      >
        {kind === "solo" ? "Start puzzle" : "Send invite & play"}
      </button>
    </BottomSheet>
  );
}
