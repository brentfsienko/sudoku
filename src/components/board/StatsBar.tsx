"use client";

import { PauseIcon, PlayIcon } from "@/components/icons";

type Props = {
  difficultyLabel: string;
  mistakes: number;
  maxMistakes: number;
  timeLabel: string;
  score: number;
  paused: boolean;
  showPause: boolean;
  onTogglePause: () => void;
};

function Stat({ label, value, danger }: { label: string; value: string; danger?: boolean }) {
  return (
    <div className="flex flex-col items-center">
      <span className="text-[11px] font-semibold uppercase tracking-wide text-[var(--muted)]">
        {label}
      </span>
      <span
        className="font-display text-base font-bold"
        style={{ color: danger ? "var(--cell-error-text)" : "var(--foreground)" }}
      >
        {value}
      </span>
    </div>
  );
}

export function StatsBar({
  difficultyLabel,
  mistakes,
  maxMistakes,
  timeLabel,
  score,
  paused,
  showPause,
  onTogglePause,
}: Props) {
  return (
    <div className="flex items-center justify-between rounded-2xl bg-[var(--surface-soft)] px-4 py-2.5">
      <Stat label="Score" value={score.toLocaleString()} />
      <Stat label="Level" value={difficultyLabel} />
      <Stat
        label="Mistakes"
        value={`${mistakes}/${maxMistakes}`}
        danger={mistakes > 0}
      />
      <Stat label="Time" value={timeLabel} />
      {showPause && (
        <button
          type="button"
          onClick={onTogglePause}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-[var(--paw)] shadow-sm transition active:scale-95"
          aria-label={paused ? "Resume" : "Pause"}
        >
          {paused ? <PlayIcon width={18} height={18} /> : <PauseIcon width={18} height={18} />}
        </button>
      )}
    </div>
  );
}
