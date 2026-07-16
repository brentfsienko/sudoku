"use client";

import { BoneTally } from "@/components/BoneTally";
import { DIFFICULTIES, type Difficulty } from "@/lib/game/types";

type Props = {
  value: Difficulty;
  onChange: (value: Difficulty) => void;
};

const HINTS: Record<Difficulty, string> = {
  easy: "Beginner",
  medium: "Moderate",
  hard: "Challenging",
  expert: "Serious puzzlers",
  master: "Maximum",
};

export function BoneDifficultySelect({ value, onChange }: Props) {
  return (
    <div>
      <span className="mb-2 block text-xs font-bold uppercase tracking-wide text-[var(--muted)]">
        Difficulty
      </span>
      <div className="flex gap-2">
        {DIFFICULTIES.map((d) => {
          const active = value === d;
          return (
            <button
              key={d}
              type="button"
              onClick={() => onChange(d)}
              title={HINTS[d]}
              aria-label={HINTS[d]}
              className={`flex flex-1 flex-col items-center gap-1.5 rounded-2xl border-2 py-3 transition active:scale-[0.97] ${
                active
                  ? "border-[var(--primary)] bg-[var(--primary-soft)]"
                  : "border-[var(--border)] bg-white"
              }`}
            >
              <BoneTally difficulty={d} size={15} />
            </button>
          );
        })}
      </div>
    </div>
  );
}
