"use client";

import { useEffect, useMemo, useState } from "react";
import { BoneIcon } from "@/components/BoneIcon";

const SPLASH_TAGLINES = [
  "solve a puzzle, get a bone",
  "one square at a time",
  "fetch your next win",
  "good pups finish grids",
  "bones await the bold",
  "sudoku with a side of woof",
  "train your brain, treat your pup",
  "no leash required",
  "sit. stay. solve.",
  "chase every empty cell",
  "paws before pencils",
  "grid goals only",
  "earn that bone",
  "sharp mind, soft paws",
  "daily dose of digits",
  "bark if you see a naked single",
  "treat yourself to a hard one",
  "logic is a good boy",
  "sniff out the solution",
  "wag more, guess less",
  "bones don't grow on trees",
  "puzzle like nobody's watching",
  "stay curious, stay cozy",
  "a calm mind finds 9s",
  "your streak starts here",
  "multiplayer manners: no spoilers",
  "solo or pack — your call",
  "pencil marks welcome",
  "notes on, pressure off",
  "every win feeds the jar",
  "tiny dog, big brain energy",
  "golden hour = golden dog",
  "sudoku is cardio for neurons",
  "clear the board, claim the bone",
  "mistakes are just zoomies",
  "slow and steady fills the grid",
  "friend code, friend mode",
  "today's daily is waiting",
  "hard mode, soft landing",
  "count to nine like a pro",
  "no spoilers, just vibes",
  "keep your streak warm",
  "empty cells fear you",
  "brains & bones forever",
  "one more game won't hurt",
  "digit detective on duty",
  "cozy puzzles, crunchy treats",
  "you got this, floof",
  "solve. smile. snack.",
  "welcome back, puzzle pup",
];

type Props = {
  /** Keep showing until the play tab signals ready. */
  ready: boolean;
};

export function AppSplash({ ready }: Props) {
  const [leaving, setLeaving] = useState(false);
  const [gone, setGone] = useState(false);
  const tagline = useMemo(
    () => SPLASH_TAGLINES[Math.floor(Math.random() * SPLASH_TAGLINES.length)]!,
    [],
  );

  useEffect(() => {
    if (!ready || leaving || gone) return;
    setLeaving(true);
    const t = window.setTimeout(() => setGone(true), 320);
    return () => window.clearTimeout(t);
  }, [ready, leaving, gone]);

  if (gone) return null;

  return (
    <div
      className={`fixed inset-0 z-[100] flex flex-col items-center justify-center gap-6 bg-[var(--background)] px-8 transition-opacity duration-300 ${
        leaving ? "pointer-events-none opacity-0" : "opacity-100"
      }`}
      aria-busy={!ready}
      aria-label="Loading Sudogku"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/brand/Sudogku_Orange.svg"
        alt="Sudogku"
        className="w-56"
        style={{ imageRendering: "pixelated" }}
        aria-label="Sudogku"
      />
      <BoneIcon size={36} className="animate-bone-spin-slow text-[var(--primary)]" />
      <p className="max-w-xs text-center text-sm font-semibold text-[var(--muted)]">
        {tagline}
      </p>
    </div>
  );
}
