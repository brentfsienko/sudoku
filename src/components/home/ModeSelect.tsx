"use client";

import { GAME_MODE_LABELS, type GameMode } from "@/lib/game/types";

const MODES: { id: GameMode; label: string; hint: string; emoji: string }[] = [
  { id: "single", label: GAME_MODE_LABELS.single, hint: "Just you", emoji: "🐕" },
  { id: "coop", label: GAME_MODE_LABELS.coop, hint: "Solve together", emoji: "🐶🐶" },
  {
    id: "competitive",
    label: GAME_MODE_LABELS.competitive,
    hint: "Most squares wins",
    emoji: "🏆",
  },
];

type Props = {
  value: GameMode;
  onChange: (value: GameMode) => void;
};

export function ModeSelect({ value, onChange }: Props) {
  return (
    <div>
      <span className="mb-1.5 block text-sm font-semibold text-[var(--muted)]">
        Mode
      </span>
      <div className="grid grid-cols-3 gap-2">
        {MODES.map((m) => {
          const active = value === m.id;
          return (
            <button
              key={m.id}
              type="button"
              onClick={() => onChange(m.id)}
              className={`flex flex-col items-center gap-1 rounded-2xl border-2 px-2 py-3 text-center transition ${
                active
                  ? "border-[var(--primary)] bg-[var(--primary-soft)]"
                  : "border-[var(--border)] bg-white"
              }`}
            >
              <span className="text-lg leading-none">{m.emoji}</span>
              <span className="font-display text-sm font-bold text-[var(--foreground)]">
                {m.label}
              </span>
              <span className="text-[11px] leading-tight text-[var(--muted)]">
                {m.hint}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
