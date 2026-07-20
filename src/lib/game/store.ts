"use client";

import { useCallback, useMemo, useReducer, useState } from "react";
import type {
  CellEntry,
  Difficulty,
  GameMode,
  GameStatus,
  PlayerRole,
} from "./types";
import {
  BoardCells,
  MAX_HINTS,
  MAX_MISTAKES,
  isGiven,
  isSolved,
  pickHintCell,
  relatedCells,
  solutionDigit,
} from "./engine";

export type GameSnapshot = {
  puzzle: string;
  solution: string;
  difficulty: Difficulty;
  mode: GameMode;
  status: GameStatus;
  startedAt: number | null;
  finishedAt: number | null;
  pausedMs: number;
  pauseStartedAt: number | null;
  mistakes: number;
  hintsUsed: number;
  cells: BoardCells;
};

export type GameController = {
  snapshot: GameSnapshot;
  myRole: PlayerRole;
  selectedCell: number | null;
  notesMode: boolean;
  canUndo: boolean;
  hintsRemaining: number;
  select(index: number | null): void;
  toggleNotes(): void;
  inputDigit(digit: number): void;
  erase(): void;
  hint(): void;
  undo(): void;
  setPaused(paused: boolean): void;
};

type UndoFrame = {
  index: number;
  prev: CellEntry | undefined;
};

type State = {
  snapshot: GameSnapshot;
  undoStack: UndoFrame[];
};

type Action =
  | { type: "INPUT"; index: number; digit: number; notes: boolean; role: PlayerRole }
  | { type: "ERASE"; index: number }
  | { type: "HINT"; role: PlayerRole; preferred: number | null }
  | { type: "UNDO" }
  | { type: "SET_PAUSED"; paused: boolean };

export function createSnapshot(args: {
  puzzle: string;
  solution: string;
  difficulty: Difficulty;
  mode: GameMode;
}): GameSnapshot {
  return {
    puzzle: args.puzzle,
    solution: args.solution,
    difficulty: args.difficulty,
    mode: args.mode,
    status: "playing",
    startedAt: Date.now(),
    finishedAt: null,
    pausedMs: 0,
    pauseStartedAt: null,
    mistakes: 0,
    hintsUsed: 0,
    cells: {},
  };
}

function frameFor(s: GameSnapshot, index: number): UndoFrame {
  return {
    index,
    prev: s.cells[index] ? { ...s.cells[index] } : undefined,
  };
}

function checkFinished(s: GameSnapshot): GameSnapshot {
  if (isSolved(s.puzzle, s.solution, s.cells)) {
    return { ...s, status: "done", finishedAt: Date.now() };
  }
  if (s.mistakes >= MAX_MISTAKES) {
    return { ...s, status: "done", finishedAt: Date.now() };
  }
  return s;
}

function reducer(state: State, action: Action): State {
  const s = state.snapshot;

  switch (action.type) {
    case "INPUT": {
      if (s.status !== "playing") return state;
      const { index, digit, notes, role } = action;
      if (isGiven(s.puzzle, index)) return state;
      const current = s.cells[index];
      if (current?.correct) return state; // locked

      if (notes) {
        const existing = current?.notes ?? [];
        const nextNotes = existing.includes(digit)
          ? existing.filter((n) => n !== digit)
          : [...existing, digit].sort((a, b) => a - b);
        const entry: CellEntry = {
          value: null,
          notes: nextNotes,
          owner: role,
          correct: false,
        };
        return {
          undoStack: [...state.undoStack, frameFor(s, index)],
          snapshot: { ...s, cells: { ...s.cells, [index]: entry } },
        };
      }

      const correct = digit === solutionDigit(s.solution, index);
      const entry: CellEntry = { value: digit, notes: [], owner: role, correct };
      const frame = frameFor(s, index);

      // Auto-erase: remove this digit from notes of every peer cell.
      const updatedCells: BoardCells = { ...s.cells, [index]: entry };
      for (const peer of relatedCells(index)) {
        const peerCell = updatedCells[peer];
        if (peerCell && peerCell.notes.includes(digit)) {
          updatedCells[peer] = { ...peerCell, notes: peerCell.notes.filter((n) => n !== digit) };
        }
      }

      let next: GameSnapshot = {
        ...s,
        cells: updatedCells,
        mistakes: correct ? s.mistakes : s.mistakes + 1,
      };
      next = checkFinished(next);
      return { undoStack: [...state.undoStack, frame], snapshot: next };
    }

    case "ERASE": {
      if (s.status !== "playing") return state;
      const { index } = action;
      if (isGiven(s.puzzle, index)) return state;
      const current = s.cells[index];
      if (!current || current.correct) return state;
      const frame = frameFor(s, index);
      const cells = { ...s.cells };
      delete cells[index];
      return { undoStack: [...state.undoStack, frame], snapshot: { ...s, cells } };
    }

    case "HINT": {
      if (s.status !== "playing") return state;
      if (s.hintsUsed >= MAX_HINTS) return state;
      const target = pickHintCell(s.puzzle, s.solution, s.cells, action.preferred);
      if (target == null) return state;
      const frame = frameFor(s, target);
      const entry: CellEntry = {
        value: solutionDigit(s.solution, target),
        notes: [],
        owner: action.role,
        correct: true,
      };
      let next: GameSnapshot = {
        ...s,
        cells: { ...s.cells, [target]: entry },
        hintsUsed: s.hintsUsed + 1,
      };
      next = checkFinished(next);
      return { undoStack: [...state.undoStack, frame], snapshot: next };
    }

    case "UNDO": {
      if (state.undoStack.length === 0) return state;
      const frame = state.undoStack[state.undoStack.length - 1];
      const cells = { ...s.cells };
      if (frame.prev) cells[frame.index] = frame.prev;
      else delete cells[frame.index];
      // Only restore the cell — mistakes / hints / game status stay as-is.
      return {
        undoStack: state.undoStack.slice(0, -1),
        snapshot: { ...s, cells },
      };
    }

    case "SET_PAUSED": {
      if (s.status === "done") return state;
      if (action.paused && s.status === "playing") {
        return {
          ...state,
          snapshot: { ...s, status: "paused", pauseStartedAt: Date.now() },
        };
      }
      if (!action.paused && s.status === "paused") {
        const addMs = s.pauseStartedAt ? Date.now() - s.pauseStartedAt : 0;
        return {
          ...state,
          snapshot: {
            ...s,
            status: "playing",
            pausedMs: s.pausedMs + addMs,
            pauseStartedAt: null,
          },
        };
      }
      return state;
    }

    default:
      return state;
  }
}

/** Single-player game controller backed by a local reducer. */
export function useLocalGame(initial: GameSnapshot): GameController {
  const [state, dispatch] = useReducer(reducer, { snapshot: initial, undoStack: [] });
  const [selectedCell, setSelectedCell] = useState<number | null>(null);
  const [notesMode, setNotesMode] = useState(false);

  const myRole: PlayerRole = "player-1";

  const inputDigit = useCallback(
    (digit: number) => {
      if (selectedCell == null) return;
      dispatch({ type: "INPUT", index: selectedCell, digit, notes: notesMode, role: myRole });
    },
    [selectedCell, notesMode],
  );

  const erase = useCallback(() => {
    if (selectedCell == null) return;
    dispatch({ type: "ERASE", index: selectedCell });
  }, [selectedCell]);

  const hint = useCallback(() => {
    dispatch({ type: "HINT", role: myRole, preferred: selectedCell });
  }, [selectedCell]);

  const undo = useCallback(() => dispatch({ type: "UNDO" }), []);
  const setPaused = useCallback(
    (paused: boolean) => dispatch({ type: "SET_PAUSED", paused }),
    [],
  );

  return useMemo<GameController>(
    () => ({
      snapshot: state.snapshot,
      myRole,
      selectedCell,
      notesMode,
      canUndo: state.undoStack.length > 0,
      hintsRemaining: MAX_HINTS - state.snapshot.hintsUsed,
      select: setSelectedCell,
      toggleNotes: () => setNotesMode((v) => !v),
      inputDigit,
      erase,
      hint,
      undo,
      setPaused,
    }),
    [state, selectedCell, notesMode, inputDigit, erase, hint, undo, setPaused],
  );
}

/** Elapsed seconds for a snapshot, accounting for pauses (active play time). */
export function elapsedSeconds(s: GameSnapshot, now: number): number {
  if (!s.startedAt) return 0;
  const end = s.finishedAt ?? now;
  const livePause =
    s.status === "paused" && s.pauseStartedAt ? now - s.pauseStartedAt : 0;
  return Math.max(0, Math.floor((end - s.startedAt - s.pausedMs - livePause) / 1000));
}

/** Wall-clock seconds since the game started (includes paused time). */
export function wallClockSeconds(s: GameSnapshot, now: number): number {
  if (!s.startedAt) return 0;
  const end = s.finishedAt ?? now;
  return Math.max(0, Math.floor((end - s.startedAt) / 1000));
}

/** Pause an in-progress game for persistence when leaving the board. */
export function pauseSnapshot(s: GameSnapshot, now = Date.now()): GameSnapshot {
  if (s.status !== "playing") return s;
  return { ...s, status: "paused", pauseStartedAt: now };
}
