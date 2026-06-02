"use client";

import { useEffect, useMemo, useState } from "react";
import { LiveMap, LiveObject } from "@liveblocks/client";
import {
  useMutation,
  useMyPresence,
  useOthers,
  useStorage,
} from "./config";
import type { GameSnapshot, GameController } from "@/lib/game/store";
import {
  isGiven,
  isSolved,
  MAX_HINTS,
  MAX_MISTAKES,
  pickHintCell,
  solutionDigit,
} from "@/lib/game/engine";
import type {
  CellEntry,
  Difficulty,
  GameMode,
  PeerCursor,
  PlayerRole,
} from "@/lib/game/types";
import { generatePuzzle } from "@/lib/sudoku/generator";

type UndoFrame = { index: number; prev: CellEntry | undefined };

function readBoard(cells: LiveMap<string, CellEntry>): Record<number, CellEntry> {
  const board: Record<number, CellEntry> = {};
  for (const [k, v] of cells.entries()) board[Number(k)] = v;
  return board;
}

export type LiveGame = {
  ready: boolean;
  /** Storage still loading. */
  loading: boolean;
  status: "lobby" | "playing" | "paused" | "done";
  controller: GameController | null;
  me: { name: string; dogId: string; role: PlayerRole };
  opponent: { name: string; dogId: string; role: PlayerRole } | null;
  peers: PeerCursor[];
  playerCount: number;
  rematch: () => void;
};

export function useLiveGame(opts: {
  isHost: boolean;
  seedDifficulty: Difficulty;
  seedMode: GameMode;
  hostName: string;
}): LiveGame {
  const { isHost } = opts;
  const meta = useStorage((root) => root.meta);
  const cellsMap = useStorage((root) => root.cells) as unknown as
    | ReadonlyMap<string, CellEntry>
    | null;
  const [myPresence, updateMyPresence] = useMyPresence();
  const others = useOthers();

  const [notesMode, setNotesMode] = useState(false);
  const [undoStack, setUndoStack] = useState<UndoFrame[]>([]);

  const ensurePuzzle = useMutation(
    ({ storage }, hostName: string) => {
      const m = storage.get("meta");
      if (m.get("puzzle")) return;
      const p = generatePuzzle(m.get("difficulty"));
      m.update({ puzzle: p.puzzle, solution: p.solution, hostName });
    },
    [],
  );

  const startGame = useMutation(({ storage }) => {
    const m = storage.get("meta");
    if (m.get("status") !== "lobby") return;
    if (!m.get("puzzle")) return;
    m.update({ status: "playing", startedAt: Date.now() });
  }, []);

  const place = useMutation(
    (
      { storage },
      index: number,
      digit: number,
      notes: boolean,
      role: PlayerRole,
    ): UndoFrame | null => {
      const m = storage.get("meta");
      if (m.get("status") !== "playing") return null;
      const puzzle = m.get("puzzle");
      if (isGiven(puzzle, index)) return null;
      const cells = storage.get("cells");
      const key = String(index);
      const current = cells.get(key);
      if (current?.correct) return null;
      const prev = current ? { ...current } : undefined;

      if (notes) {
        const existing = current?.notes ?? [];
        const next = existing.includes(digit)
          ? existing.filter((n) => n !== digit)
          : [...existing, digit].sort((a, b) => a - b);
        cells.set(key, { value: null, notes: next, owner: role, correct: false });
        return { index, prev };
      }

      const solution = m.get("solution");
      const correct = digit === solutionDigit(solution, index);
      cells.set(key, { value: digit, notes: [], owner: role, correct });
      if (!correct) m.set("mistakes", m.get("mistakes") + 1);

      const board = readBoard(cells);
      if (isSolved(puzzle, solution, board)) {
        m.update({ status: "done", finishedAt: Date.now() });
      } else if (m.get("mode") === "coop" && m.get("mistakes") >= MAX_MISTAKES) {
        m.update({ status: "done", finishedAt: Date.now() });
      }
      return { index, prev };
    },
    [],
  );

  const eraseCell = useMutation(({ storage }, index: number): UndoFrame | null => {
    const m = storage.get("meta");
    if (m.get("status") !== "playing") return null;
    if (isGiven(m.get("puzzle"), index)) return null;
    const cells = storage.get("cells");
    const current = cells.get(String(index));
    if (!current || current.correct) return null;
    const prev = { ...current };
    cells.delete(String(index));
    return { index, prev };
  }, []);

  const hintMutation = useMutation(
    ({ storage }, role: PlayerRole, preferred: number | null): UndoFrame | null => {
      const m = storage.get("meta");
      if (m.get("status") !== "playing") return null;
      if (m.get("hintsUsed") >= MAX_HINTS) return null;
      const cells = storage.get("cells");
      const puzzle = m.get("puzzle");
      const solution = m.get("solution");
      const board = readBoard(cells);
      const target = pickHintCell(puzzle, solution, board, preferred);
      if (target == null) return null;
      const prev = cells.get(String(target));
      cells.set(String(target), {
        value: solutionDigit(solution, target),
        notes: [],
        owner: role,
        correct: true,
      });
      m.set("hintsUsed", m.get("hintsUsed") + 1);
      const board2 = readBoard(cells);
      if (isSolved(puzzle, solution, board2)) {
        m.update({ status: "done", finishedAt: Date.now() });
      }
      return { index: target, prev: prev ? { ...prev } : undefined };
    },
    [],
  );

  const restore = useMutation(({ storage }, frame: UndoFrame) => {
    const m = storage.get("meta");
    if (m.get("status") === "done") return;
    const cells = storage.get("cells");
    const key = String(frame.index);
    if (frame.prev) cells.set(key, frame.prev);
    else cells.delete(key);
  }, []);

  const rematchMutation = useMutation(({ storage }) => {
    const m = storage.get("meta");
    const p = generatePuzzle(m.get("difficulty"));
    const cells = storage.get("cells");
    for (const k of [...cells.keys()]) cells.delete(k);
    m.update({
      puzzle: p.puzzle,
      solution: p.solution,
      status: "playing",
      startedAt: Date.now(),
      finishedAt: null,
      mistakes: 0,
      hintsUsed: 0,
    });
  }, []);

  // Host responsibilities: generate the puzzle and start once a friend joins.
  useEffect(() => {
    if (isHost && meta && !meta.puzzle) ensurePuzzle(opts.hostName);
  }, [isHost, meta, ensurePuzzle, opts.hostName]);

  useEffect(() => {
    if (
      isHost &&
      meta &&
      meta.status === "lobby" &&
      meta.puzzle &&
      others.length >= 1
    ) {
      startGame();
    }
  }, [isHost, meta, others.length, startGame]);

  // Reset local undo history on a new round (render-time state adjustment).
  const [roundStartedAt, setRoundStartedAt] = useState(meta?.startedAt ?? null);
  if ((meta?.startedAt ?? null) !== roundStartedAt) {
    setRoundStartedAt(meta?.startedAt ?? null);
    setUndoStack([]);
  }

  const myRole: PlayerRole =
    (myPresence.role as PlayerRole | null) ?? (isHost ? "player-1" : "player-2");

  const snapshot: GameSnapshot | null = useMemo(() => {
    if (!meta || !cellsMap) return null;
    const cells: Record<number, CellEntry> = {};
    cellsMap.forEach((v, k) => {
      cells[Number(k)] = v as CellEntry;
    });
    return {
      puzzle: meta.puzzle,
      solution: meta.solution,
      difficulty: meta.difficulty,
      mode: meta.mode,
      status: meta.status,
      startedAt: meta.startedAt,
      finishedAt: meta.finishedAt,
      pausedMs: 0,
      pauseStartedAt: null,
      mistakes: meta.mistakes,
      hintsUsed: meta.hintsUsed,
      cells,
    };
  }, [meta, cellsMap]);

  const peers: PeerCursor[] = others.map((o) => ({
    role: (o.presence.role as PlayerRole | null) ?? null,
    name: o.presence.name,
    dogId: o.presence.dogId,
    selectedCell: o.presence.selectedCell,
  }));

  const opponentPeer = peers.find((p) => p.role !== myRole) ?? peers[0] ?? null;
  const opponent = opponentPeer
    ? {
        name: opponentPeer.name,
        dogId: opponentPeer.dogId,
        role:
          (opponentPeer.role as PlayerRole | null) ??
          (myRole === "player-1" ? "player-2" : "player-1"),
      }
    : null;

  const controller: GameController | null =
    snapshot &&
    ({
      snapshot,
      myRole,
      selectedCell: myPresence.selectedCell ?? null,
      notesMode,
      canUndo: undoStack.length > 0,
      hintsRemaining: MAX_HINTS - snapshot.hintsUsed,
      select: (index) => updateMyPresence({ selectedCell: index }),
      toggleNotes: () => setNotesMode((v) => !v),
      inputDigit: (digit) => {
        const sel = myPresence.selectedCell;
        if (sel == null) return;
        const frame = place(sel, digit, notesMode, myRole);
        if (frame) setUndoStack((s) => [...s, frame]);
      },
      erase: () => {
        const sel = myPresence.selectedCell;
        if (sel == null) return;
        const frame = eraseCell(sel);
        if (frame) setUndoStack((s) => [...s, frame]);
      },
      hint: () => {
        const frame = hintMutation(myRole, myPresence.selectedCell ?? null);
        if (frame) setUndoStack((s) => [...s, frame]);
      },
      undo: () => {
        setUndoStack((s) => {
          const frame = s[s.length - 1];
          if (frame) restore(frame);
          return s.slice(0, -1);
        });
      },
      setPaused: () => {},
    } satisfies GameController);

  return {
    ready: !!snapshot && snapshot.status !== "lobby",
    loading: !meta || !cellsMap,
    status: meta?.status ?? "lobby",
    controller,
    me: { name: myPresence.name, dogId: myPresence.dogId, role: myRole },
    opponent,
    peers,
    playerCount: others.length + 1,
    rematch: () => rematchMutation(),
  };
}

/** Builds the initial storage payload for a new room. */
export function buildInitialStorage(args: {
  difficulty: Difficulty;
  mode: GameMode;
}) {
  return {
    cells: new LiveMap<string, CellEntry>(),
    meta: new LiveObject({
      puzzle: "",
      solution: "",
      difficulty: args.difficulty,
      mode: args.mode,
      status: "lobby" as const,
      startedAt: null as number | null,
      finishedAt: null as number | null,
      mistakes: 0,
      hintsUsed: 0,
      hostName: "",
    }),
  };
}
