"use client";

import { BONE_IMAGE } from "@/lib/bones/config";
import type { Difficulty } from "@/lib/game/types";

export const DIFFICULTY_BONE_COUNT: Record<Difficulty, number> = {
  easy: 1,
  medium: 2,
  hard: 3,
  expert: 4,
  master: 5,
};

type GroupProps = { count: number; size: number; gap: number };

/**
 * The bone PNG is naturally drawn at roughly −45° (diagonal).
 * rotate(135deg) = −45° + 135° = 90° → stands upright vertically (knobs top & bottom).
 * The crossing 5th bone uses rotate(75deg) = −45° + 75° = 30° → a gentle "/" slash
 * (more horizontal than 45°, matching classic tally-mark stroke angle).
 */
const VERTICAL_ROTATE = "rotate(135deg)";
const DIAGONAL_ROTATE = "rotate(75deg)";

// Each subsequent bone overlaps the previous by 65 % of its width.
const OVERLAP = 0.65;

/** One tally group: up to 4 vertical bones + optional diagonal 5th. */
function TallyGroup({ count, size, gap }: GroupProps) {
  const verticals = Math.min(count, 4);
  const hasDiagonal = count === 5;
  // With 85 % overlap, each additional bone only adds 15 % of its width.
  const colWidth = size + (verticals - 1) * size * (1 - OVERLAP);

  return (
    <div
      className="relative inline-flex items-center overflow-visible"
      style={{ gap: 0, width: colWidth, height: size }}
    >
      {Array.from({ length: verticals }).map((_, i) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={i}
          src={BONE_IMAGE}
          alt=""
          width={size}
          height={size}
          aria-hidden
          style={{
            imageRendering: "pixelated",
            transform: VERTICAL_ROTATE,
            flexShrink: 0,
            marginLeft: i === 0 ? 0 : -(size * OVERLAP),
          }}
        />
      ))}
      {hasDiagonal && (
        <div
          className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-visible"
          aria-hidden
        >
          {/* Same size as each individual bone; rotated to slash diagonally across */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={BONE_IMAGE}
            alt=""
            width={size}
            height={size}
            style={{
              imageRendering: "pixelated",
              transform: DIAGONAL_ROTATE,
            }}
          />
        </div>
      )}
    </div>
  );
}

type Props = {
  difficulty: Difficulty;
  /** Bone icon size in px (default 17). */
  size?: number;
};

/**
 * Renders a difficulty rating as tally-mark bones (1–5).
 * Groups of 5 use the classic 4-vertical + 1-diagonal tally style.
 */
export function BoneTally({ difficulty, size = 17 }: Props) {
  const count = DIFFICULTY_BONE_COUNT[difficulty];

  const groups: number[] = [];
  let remaining = count;
  while (remaining > 0) {
    groups.push(Math.min(5, remaining));
    remaining -= Math.min(5, remaining);
  }

  return (
    <div className="inline-flex items-center" style={{ gap: 4 }}>
      {groups.map((g, i) => (
        <TallyGroup key={i} count={g} size={size} gap={0} />
      ))}
    </div>
  );
}
