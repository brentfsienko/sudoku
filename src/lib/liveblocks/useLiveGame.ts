"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { LiveMap, LiveObject } from "@liveblocks/client";
import {
  useMutation,
  useMyPresence,
  useOthers,
  useSelf,
  useStorage,
} from "./config";
import type { GameSnapshot, GameController } from "@/lib/game/store";
import {
  isGiven,
  isSolved,
  MAX_HINTS,
  MAX_MISTAKES,
  pickHintCell,
  relatedCells,
  solutionDigit,
} from "@/lib/game/engine";
import type {
  CellEntry,
  Difficulty,
  GameMode,
  PeerCursor,
  PlayerRole,
} from "@/lib/game/types";
import { MAX_PLAYERS } from "@/lib/game/types";
import { generatePuzzle } from "@/lib/sudoku/generator";

type UndoFrame = { index: number; prev: CellEntry | undefined };

function readBoard(cells: LiveMap<string, CellEntry>): Record<number, CellEntry> {
  const board: Record<number, CellEntry> = {};
  for (const [k, v] of cells.entries()) board[Number(k)] = v;
  return board;
}

export type LivePlayer = { name: string; dogId: string; role: PlayerRole };

export type LiveGame = {
  ready: boolean;
  /** Storage still loading. */
  loading: boolean;
  status: "lobby" | "playing" | "paused" | "done";
  controller: GameController | null;
  me: LivePlayer;
  /** First non-self player — kept for backward compat with 2-player UI paths. */
  opponent: LivePlayer | null;
  /** All players including self, in role order. */
  allPlayers: LivePlayer[];
  peers: PeerCursor[];
  playerCount: number;
  isFull: boolean;
  isHost: boolean;
  canStart: boolean;
  startGame: () => void;
  rematch: () => void;
};

export function useLiveGame(opts: {
  /** Hint from ?host=1 — only used to claim host when none is set yet. */
  wantHost: boolean;
  seedDifficulty: Difficulty;
  seedMode: GameMode;
  hostName: string;
}): LiveGame {
  const { wantHost } = opts;
  const self = useSelf();
  const meta = useStorage((root) => root.meta);
  const cellsMap = useStorage((root) => root.cells) as unknown as
    | ReadonlyMap<string, CellEntry>
    | Record<string, CellEntry>
    | null;
  const [myPresence, updateMyPresence] = useMyPresence();
  const others = useOthers();

  const isHost = Boolean(self?.id && meta?.hostId && meta.hostId === self.id);

  const [notesMode, setNotesMode] = useState(false);
  const [undoStack, setUndoStack] = useState<UndoFrame[]>([]);

  const claimHost = useMutation(
    ({ storage }, userId: string, hostName: string) => {
      const m = storage.get("meta");
      if (m.get("hostId")) return;
      m.update({ hostId: userId, hostName });
    },
    [],
  );

  const ensurePuzzle = useMutation(
    ({ storage }, hostName: string, hostUserId: string) => {
      const m = storage.get("meta");
      if (!m.get("hostId") && hostUserId) {
        m.update({ hostId: hostUserId, hostName });
      }
      if (m.get("puzzle")) return;
      // Only the claimed host may generate the puzzle.
      if (m.get("hostId") && m.get("hostId") !== hostUserId) return;
      const p = generatePuzzle(m.get("difficulty"));
      m.update({ puzzle: p.puzzle, solution: p.solution, hostName });
    },
    [],
  );

  const startGameMutation = useMutation(({ storage }, hostUserId: string) => {
    const m = storage.get("meta");
    if (m.get("hostId") !== hostUserId) return;
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

      // Auto-erase: remove this digit from notes of every peer cell.
      for (const peer of relatedCells(index)) {
        const peerCell = cells.get(String(peer));
        if (peerCell && peerCell.notes.includes(digit)) {
          cells.set(String(peer), { ...peerCell, notes: peerCell.notes.filter((n) => n !== digit) });
        }
      }

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

  const rematchMutation = useMutation(({ storage }, hostUserId: string) => {
    const m = storage.get("meta");
    if (m.get("hostId") !== hostUserId) return;
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

  // Claim host (first-writer) then generate puzzle.
  useEffect(() => {
    if (!self?.id || !meta) return;
    if (!meta.hostId && wantHost) {
      claimHost(self.id, opts.hostName);
    }
  }, [self?.id, meta, wantHost, claimHost, opts.hostName]);

  useEffect(() => {
    if (!self?.id || !meta) return;
    const amHost = meta.hostId === self.id || (!meta.hostId && wantHost);
    if (amHost && !meta.puzzle) ensurePuzzle(opts.hostName, self.id);
  }, [self?.id, meta, wantHost, ensurePuzzle, opts.hostName]);

  // Dynamic role claiming: host is always player-1; non-hosts grab the first
  // unclaimed slot among player-2/3/4.  We use a ref to avoid infinite loops.
  const roleClaimed = useRef(false);
  useEffect(() => {
    if (isHost) {
      updateMyPresence({ role: "player-1" });
      roleClaimed.current = true;
      return;
    }
    if (roleClaimed.current) return;
    const taken = new Set(others.map((o) => o.presence.role).filter(Boolean) as PlayerRole[]);
    const slot = (["player-2", "player-3", "player-4"] as PlayerRole[]).find(
      (r) => !taken.has(r),
    );
    if (slot) {
      updateMyPresence({ role: slot });
      roleClaimed.current = true;
    }
  // re-run whenever others list changes until we've claimed a slot
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isHost, others]);

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
    // Liveblocks' immutable storage may surface a Map or a plain object
    // depending on version; handle both defensively.
    const entries: [string, CellEntry][] =
      cellsMap instanceof Map
        ? Array.from(cellsMap.entries())
        : Object.entries(cellsMap as Record<string, CellEntry>);
    for (const [k, v] of entries) {
      cells[Number(k)] = v;
    }
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

  // All players (self + peers) sorted by role for consistent display order.
  const allPlayers: LivePlayer[] = useMemo(() => {
    const self: LivePlayer = { name: myPresence.name, dogId: myPresence.dogId, role: myRole };
    const others_: LivePlayer[] = peers
      .filter((p) => p.role != null)
      .map((p) => ({ name: p.name, dogId: p.dogId, role: p.role as PlayerRole }));
    return [self, ...others_].sort((a, b) => a.role.localeCompare(b.role));
  }, [myPresence.name, myPresence.dogId, myRole, peers]);

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

  const playerCount = others.length + 1;

  return {
    ready: !!snapshot && snapshot.status !== "lobby",
    loading: !meta || !cellsMap,
    status: meta?.status ?? "lobby",
    controller,
    me: { name: myPresence.name, dogId: myPresence.dogId, role: myRole },
    opponent,
    allPlayers,
    peers,
    playerCount,
    isFull: playerCount >= MAX_PLAYERS,
    isHost,
    canStart: isHost && others.length >= 1 && meta?.status === "lobby",
    startGame: () => {
      if (self?.id) startGameMutation(self.id);
    },
    rematch: () => {
      if (self?.id) rematchMutation(self.id);
    },
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
      hostId: "",
    }),
  };
}
