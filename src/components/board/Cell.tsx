"use client";

import { memo } from "react";
import { BoneIcon } from "@/components/BoneIcon";

export type CellView = {
  index: number;
  value: number | null;
  given: boolean;
  notes: number[];
  /** Color for a user-entered value (owner's player color). */
  valueColor: string | null;
  selected: boolean;
  related: boolean;
  sameValue: boolean;
  error: boolean;
  /** Ring color when another player has this cell selected. */
  peerRingColor: string | null;
  hasBone?: boolean;
  bonePop?: boolean;
};

type Props = {
  cell: CellView;
  onSelect: (index: number) => void;
};

function CellInner({ cell, onSelect }: Props) {
  const c = cell.index % 9;
  const r = Math.floor(cell.index / 9);

  const borderClasses = [
    "border-r border-b",
    c % 3 === 2 && c !== 8 ? "border-r-2 border-r-[var(--grid-line-bold)]" : "",
    r % 3 === 2 && r !== 8 ? "border-b-2 border-b-[var(--grid-line-bold)]" : "",
    c === 0 ? "border-l" : "",
    r === 0 ? "border-t" : "",
  ].join(" ");

  let bg = "bg-[var(--cell-bg)]";
  if (cell.error) bg = "bg-[var(--cell-error)]";
  else if (cell.selected) bg = "bg-[var(--cell-selected)]";
  else if (cell.sameValue) bg = "bg-[var(--cell-peer)]";
  else if (cell.related) bg = "bg-[var(--cell-highlight)]";

  const textColor = cell.error
    ? "var(--cell-error-text)"
    : cell.given
      ? "var(--cell-given)"
      : (cell.valueColor ?? "var(--foreground)");

  return (
    <button
      type="button"
      onClick={() => onSelect(cell.index)}
      className={`relative flex aspect-square items-center justify-center border-[var(--grid-line)] ${borderClasses} ${bg} no-select transition-colors`}
      style={
        cell.peerRingColor
          ? { boxShadow: `inset 0 0 0 2px ${cell.peerRingColor}` }
          : undefined
      }
    >
      {cell.hasBone && !cell.value && (
        <span className="pointer-events-none absolute right-0.5 top-0.5 opacity-70">
          <BoneIcon size={10} />
        </span>
      )}
      {cell.bonePop && (
        <span
          className="pointer-events-none absolute inset-0 flex items-center justify-center animate-bone-pop"
          aria-hidden
        >
          <BoneIcon size={22} />
        </span>
      )}
      {cell.value ? (
        <span
          className="font-display leading-none"
          style={{
            color: textColor,
            fontWeight: cell.given ? 700 : 600,
            fontSize: "min(5.2vw, 1.5rem)",
          }}
        >
          {cell.value}
        </span>
      ) : cell.notes.length > 0 ? (
        <div className="grid h-full w-full grid-cols-3 grid-rows-3 p-[1px] text-[var(--muted)]">
          {Array.from({ length: 9 }, (_, i) => i + 1).map((n) => (
            <span
              key={n}
              className="flex items-center justify-center leading-none"
              style={{ fontSize: "min(2.4vw, 0.6rem)" }}
            >
              {cell.notes.includes(n) ? n : ""}
            </span>
          ))}
        </div>
      ) : null}
    </button>
  );
}

export const Cell = memo(CellInner);
