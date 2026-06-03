"use client";

import { useMemo } from "react";
import type { GameSnapshot } from "@/lib/game/store";
import type { PeerCursor } from "@/lib/game/types";
import {
  isGiven,
  relatedCells,
  solutionDigit,
  valueAt,
} from "@/lib/game/engine";
import { playerColor } from "@/lib/theme/dogs";
import { Cell, type CellView } from "./Cell";

type Props = {
  snapshot: GameSnapshot;
  selectedCell: number | null;
  peers: PeerCursor[];
  boneCells?: Set<number>;
  collectedBones?: Set<number>;
  popCell?: number | null;
  onSelect: (index: number) => void;
};

export function Board({
  snapshot,
  selectedCell,
  peers,
  boneCells,
  collectedBones,
  popCell,
  onSelect,
}: Props) {
  const { puzzle, solution, cells } = snapshot;

  const relatedSet = useMemo(() => {
    if (selectedCell == null) return new Set<number>();
    return new Set(relatedCells(selectedCell));
  }, [selectedCell]);

  const selectedValue =
    selectedCell != null ? valueAt(puzzle, cells, selectedCell) : null;

  const peerByCell = useMemo(() => {
    const map = new Map<number, string>();
    for (const p of peers) {
      if (p.selectedCell != null) {
        map.set(p.selectedCell, playerColor(p.role).hex);
      }
    }
    return map;
  }, [peers]);

  const views: CellView[] = useMemo(() => {
    return Array.from({ length: 81 }, (_, index) => {
      const given = isGiven(puzzle, index);
      const value = valueAt(puzzle, cells, index);
      const entry = cells[index];
      const correct =
        value != null && value === solutionDigit(solution, index);
      const error = !given && value != null && !correct;

      const hasBone =
        boneCells?.has(index) &&
        !collectedBones?.has(index) &&
        !given &&
        !entry?.correct;

      return {
        index,
        value,
        given,
        notes: entry?.notes ?? [],
        valueColor: given ? null : playerColor(entry?.owner).hex,
        selected: selectedCell === index,
        related: relatedSet.has(index),
        sameValue:
          selectedValue != null &&
          value === selectedValue &&
          selectedCell !== index,
        error,
        peerRingColor: peerByCell.get(index) ?? null,
        hasBone,
        bonePop: popCell === index,
      } satisfies CellView;
    });
  }, [
    puzzle,
    solution,
    cells,
    selectedCell,
    selectedValue,
    relatedSet,
    peerByCell,
    boneCells,
    collectedBones,
    popCell,
  ]);

  return (
    <div className="w-full rounded-2xl bg-white p-1.5 shadow-[0_8px_24px_-12px_rgba(120,80,40,0.35)]">
      <div className="grid grid-cols-9 overflow-hidden rounded-lg border-2 border-[var(--grid-line-bold)]">
        {views.map((cell) => (
          <Cell key={cell.index} cell={cell} onSelect={onSelect} />
        ))}
      </div>
    </div>
  );
}
