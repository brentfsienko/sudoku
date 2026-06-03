"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { GameController } from "@/lib/game/store";
import type { Difficulty } from "@/lib/game/types";
import { pickBoneCellIndices } from "./cells";

export function useGameBones(
  controller: GameController,
  puzzle: string,
  difficulty: Difficulty,
  savedBones: number,
) {
  const boneCells = useMemo(
    () => new Set(pickBoneCellIndices(puzzle, difficulty)),
    [puzzle, difficulty],
  );
  const [collected, setCollected] = useState<Set<number>>(() => new Set());
  const [sessionBones, setSessionBones] = useState(0);
  const [popCell, setPopCell] = useState<number | null>(null);
  const popTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { snapshot } = controller;

  const collectedRef = useRef(collected);
  collectedRef.current = collected;

  useEffect(() => {
    const newly: number[] = [];
    for (const index of boneCells) {
      if (collectedRef.current.has(index)) continue;
      const entry = snapshot.cells[index];
      if (entry?.correct) newly.push(index);
    }
    if (newly.length === 0) return;
    setCollected((prev) => {
      const next = new Set(prev);
      for (const i of newly) next.add(i);
      return next;
    });
    setSessionBones((b) => b + newly.length);
    setPopCell(newly[newly.length - 1]);
    if (popTimer.current) clearTimeout(popTimer.current);
    popTimer.current = setTimeout(() => setPopCell(null), 550);
  }, [snapshot.cells, boneCells]);

  useEffect(
    () => () => {
      if (popTimer.current) clearTimeout(popTimer.current);
    },
    [],
  );

  return {
    boneCells,
    collectedBones: collected,
    sessionBones,
    displayBones: savedBones + sessionBones,
    popCell,
  };
}
