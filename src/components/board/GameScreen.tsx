"use client";

import { useEffect, useMemo, useState } from "react";
import { Board } from "./Board";
import { NumberPad } from "./NumberPad";
import { ActionBar } from "./ActionBar";
import { StatsBar } from "./StatsBar";
import { ResultsOverlay } from "./ResultsOverlay";
import { PlayerBadge } from "@/components/PlayerBadge";
import { ChevronLeftIcon, PlayIcon } from "@/components/icons";
import type { GameController } from "@/lib/game/store";
import { elapsedSeconds } from "@/lib/game/store";
import {
  cellContributions,
  digitCounts,
  isSolved,
  MAX_MISTAKES,
} from "@/lib/game/engine";
import { finalScore, liveScore } from "@/lib/game/scoring";
import {
  DIFFICULTY_LABELS,
  GAME_MODE_LABELS,
  type PeerCursor,
  type PlayerRole,
} from "@/lib/game/types";
import { playerColor } from "@/lib/theme/dogs";

type Player = { name: string; dogId: string; role: PlayerRole };

type Props = {
  controller: GameController;
  me: Player;
  opponent?: Player | null;
  peers?: PeerCursor[];
  onExit: () => void;
  onRematch?: () => void;
  /** Called once when the game reaches a finished state. */
  onFinish?: (info: {
    solved: boolean;
    score: number;
    elapsedSeconds: number;
  }) => void;
};

function useNow(active: boolean): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!active) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [active]);
  return now;
}

export function GameScreen({
  controller,
  me,
  opponent,
  peers = [],
  onExit,
  onRematch,
  onFinish,
}: Props) {
  const { snapshot } = controller;
  const mode = snapshot.mode;
  const isMulti = mode !== "single";
  const done = snapshot.status === "done";
  const paused = snapshot.status === "paused";

  const now = useNow(snapshot.status === "playing");
  const elapsed = elapsedSeconds(snapshot, now);

  const counts = useMemo(
    () => digitCounts(snapshot.puzzle, snapshot.solution, snapshot.cells),
    [snapshot.puzzle, snapshot.solution, snapshot.cells],
  );
  const contrib = useMemo(
    () => cellContributions(snapshot.puzzle, snapshot.solution, snapshot.cells),
    [snapshot.puzzle, snapshot.solution, snapshot.cells],
  );
  const solved = useMemo(
    () => isSolved(snapshot.puzzle, snapshot.solution, snapshot.cells),
    [snapshot.puzzle, snapshot.solution, snapshot.cells],
  );

  const score = liveScore({
    difficulty: snapshot.difficulty,
    correctPlaced: contrib.total,
    mistakes: snapshot.mistakes,
    hintsUsed: snapshot.hintsUsed,
  });

  const computedFinal = solved
    ? finalScore({
        difficulty: snapshot.difficulty,
        elapsedSeconds: elapsed,
        mistakes: snapshot.mistakes,
        hintsUsed: snapshot.hintsUsed,
      })
    : score;

  // Notify parent once when finished.
  useEffect(() => {
    if (done && onFinish)
      onFinish({ solved, score: computedFinal, elapsedSeconds: elapsed });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [done]);

  // Basic keyboard support for desktop testing.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (snapshot.status !== "playing") return;
      if (e.key >= "1" && e.key <= "9") controller.inputDigit(Number(e.key));
      else if (e.key === "Backspace" || e.key === "Delete") controller.erase();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [controller, snapshot.status]);

  return (
    <div
      className="mx-auto flex min-h-dvh w-full max-w-md flex-1 flex-col bg-[var(--background)]"
      style={{
        paddingTop: "env(safe-area-inset-top)",
        paddingBottom: "env(safe-area-inset-bottom)",
      }}
    >
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-3">
        <button
          type="button"
          onClick={onExit}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-[var(--paw)] shadow-sm active:scale-95"
          aria-label="Back"
        >
          <ChevronLeftIcon width={22} height={22} />
        </button>
        <div className="font-display text-base font-extrabold text-[var(--foreground)]">
          {isMulti ? GAME_MODE_LABELS[mode] : DIFFICULTY_LABELS[snapshot.difficulty]}
        </div>
        <div className="h-9 w-9" />
      </div>

      {/* Players strip (multiplayer) */}
      {isMulti && (
        <div className="flex items-center justify-between gap-2 px-4 pb-2">
          <PlayerStat
            player={me}
            you
            count={contrib[me.role]}
            showCount={mode === "competitive"}
            online
          />
          <span className="font-display text-sm font-bold text-[var(--muted)]">
            {mode === "competitive" ? "vs" : "🐾"}
          </span>
          {opponent ? (
            <PlayerStat
              player={opponent}
              count={contrib[opponent.role]}
              showCount={mode === "competitive"}
              online={peers.some((p) => p.role === opponent.role)}
              alignRight
            />
          ) : (
            <div className="flex items-center gap-2 text-sm text-[var(--muted)]">
              <span className="animate-pulse">Waiting for friend…</span>
            </div>
          )}
        </div>
      )}

      <div className="px-4">
        <StatsBar
          difficultyLabel={DIFFICULTY_LABELS[snapshot.difficulty]}
          mistakes={snapshot.mistakes}
          maxMistakes={MAX_MISTAKES}
          timeLabel={formatClock(elapsed)}
          score={score}
          paused={paused}
          showPause={!isMulti}
          onTogglePause={() => controller.setPaused(!paused)}
        />
      </div>

      {/* Board */}
      <div className="relative flex flex-1 items-center justify-center px-3 py-3">
        <Board
          snapshot={snapshot}
          selectedCell={controller.selectedCell}
          peers={peers}
          onSelect={controller.select}
        />
        {paused && (
          <button
            type="button"
            onClick={() => controller.setPaused(false)}
            className="absolute inset-3 flex flex-col items-center justify-center gap-3 rounded-2xl bg-[var(--background)]/95"
          >
            <span className="text-[var(--primary)]">
              <PlayIcon width={56} height={56} />
            </span>
            <span className="font-display text-xl font-extrabold text-[var(--foreground)]">
              Paused
            </span>
            <span className="text-sm text-[var(--muted)]">Tap to resume</span>
          </button>
        )}
      </div>

      {/* Controls */}
      <div className="flex flex-col gap-3 px-4 pb-4">
        <ActionBar
          canUndo={controller.canUndo}
          notesMode={controller.notesMode}
          hintsRemaining={controller.hintsRemaining}
          disabled={done || paused}
          onUndo={controller.undo}
          onErase={controller.erase}
          onToggleNotes={controller.toggleNotes}
          onHint={controller.hint}
        />
        <NumberPad
          counts={counts}
          disabled={done || paused}
          onInput={controller.inputDigit}
        />
      </div>

      {done && (
        <ResultsOverlay
          snapshot={snapshot}
          elapsedSeconds={elapsed}
          mode={mode}
          me={me}
          opponent={opponent}
          finalScore={computedFinal}
          solved={solved}
          onRematch={onRematch}
          onHome={onExit}
        />
      )}
    </div>
  );
}

function formatClock(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function PlayerStat({
  player,
  count,
  showCount,
  you,
  online,
  alignRight,
}: {
  player: Player;
  count: number;
  showCount: boolean;
  you?: boolean;
  online: boolean;
  alignRight?: boolean;
}) {
  const color = playerColor(player.role);
  return (
    <div className={`flex items-center gap-2 ${alignRight ? "flex-row-reverse text-right" : ""}`}>
      <PlayerBadge
        name=""
        dogId={player.dogId}
        role={player.role}
        size={36}
        compact
        online={online}
      />
      <div>
        <div className="font-display text-sm font-bold leading-tight" style={{ color: color.hex }}>
          {player.name}
          {you ? " (You)" : ""}
        </div>
        {showCount && (
          <div className="font-display text-lg font-extrabold leading-tight text-[var(--foreground)]">
            {count}
          </div>
        )}
      </div>
    </div>
  );
}
