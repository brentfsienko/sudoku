"use client";

import { DIFFICULTIES, DIFFICULTY_LABELS, type Difficulty } from "@/lib/game/types";

type Props = {
  value: Difficulty;
  onChange: (value: Difficulty) => void;
};

export function DifficultySelect({ value, onChange }: Props) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-semibold text-[var(--muted)]">
        Difficulty
      </span>
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value as Difficulty)}
          className="font-display w-full appearance-none rounded-2xl border-2 border-[var(--border)] bg-white px-4 py-3.5 text-lg font-bold text-[var(--foreground)] shadow-sm outline-none focus:border-[var(--primary)]"
        >
          {DIFFICULTIES.map((d) => (
            <option key={d} value={d}>
              {DIFFICULTY_LABELS[d]}
            </option>
          ))}
        </select>
        <svg
          className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[var(--muted)]"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </div>
    </label>
  );
}
