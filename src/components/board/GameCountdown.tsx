"use client";

import type { CountdownPhase } from "@/lib/game/countdown";

type Props = {
  phase: CountdownPhase | null;
};

export function GameCountdown({ phase }: Props) {
  if (!phase) return null;

  return (
    <div
      className="absolute inset-0 z-20 flex items-center justify-center rounded-md bg-[var(--background)]/70"
      role="status"
      aria-live="assertive"
      aria-label={phase === "go" ? "Go" : phase}
    >
      <span
        key={phase}
        className="font-pixel animate-countdown-pop text-[var(--primary)]"
        style={{ fontSize: phase === "go" ? "2.75rem" : "4.5rem" }}
      >
        {phase === "go" ? "Go!" : phase}
      </span>
    </div>
  );
}
