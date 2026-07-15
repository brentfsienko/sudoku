"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Board } from "./Board";
import { NumberPad } from "./NumberPad";
import { ActionBar } from "./ActionBar";
import { StatsBar } from "./StatsBar";
import { ResultsOverlay } from "./ResultsOverlay";
import { PlayerBadge } from "@/components/PlayerBadge";
import { StreakBonePill } from "@/components/home/StreakBonePill";
import { countCollectedBones } from "@/lib/bones/collect";
import { useGameBones } from "@/lib/bones/useGameBones";
import { GAME_WIN_BONE_BONUS } from "@/lib/bones/config";
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
  streak?: number;
  savedBones?: number;
  onFinish?: (info: {
    solved: boolean;
    score: number;
    elapsedSeconds: number;
    mistakes: number;
    hintsUsed: number;
    squaresFilled: number;
    bonesFound: number;
    winBoneBonus: number;
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
  streak = 0,
  savedBones = 0,
}: Props) {
  const { snapshot } = controller;
  const bonePlay = useGameBones(
    controller,
    snapshot.puzzle,
    snapshot.difficulty,
    savedBones,
  );
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
  const winBoneBonus = useMemo(() => {
    if (!solved) return 0;
    if (mode === "single") return GAME_WIN_BONE_BONUS;
    if (mode === "coop") return GAME_WIN_BONE_BONUS;
    if (mode === "competitive" && opponent) {
      const myCount = contrib[me.role];
      const oppCount = contrib[opponent.role];
      return myCount > oppCount ? GAME_WIN_BONE_BONUS : 0;
    }
    return 0;
  }, [solved, mode, opponent, contrib, me.role]);

  const finishReported = useRef(false);
  useEffect(() => {
    finishReported.current = false;
  }, [snapshot.puzzle, snapshot.startedAt]);

  useEffect(() => {
    if (!done || !onFinish || finishReported.current) return;
    finishReported.current = true;
    const frame = requestAnimationFrame(() => {
      const fromBoard = countCollectedBones(snapshot, bonePlay.boneCells);
      const bonesFound = Math.max(fromBoard, bonePlay.sessionBones);
      onFinish({
        solved,
        score: computedFinal,
        elapsedSeconds: elapsed,
        mistakes: snapshot.mistakes,
        hintsUsed: snapshot.hintsUsed,
        squaresFilled: contrib[me.role] ?? contrib.total,
        bonesFound,
        winBoneBonus,
      });
    });
    return () => cancelAnimationFrame(frame);
  }, [
    done,
    onFinish,
    solved,
    computedFinal,
    elapsed,
    snapshot.mistakes,
    snapshot.hintsUsed,
    snapshot.cells,
    snapshot.puzzle,
    snapshot.startedAt,
    bonePlay.boneCells,
    contrib,
    me.role,
    winBoneBonus,
  ]);

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
      className="game-viewport mx-auto flex w-full max-w-md flex-1 flex-col bg-[var(--background)]"
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
        <StreakBonePill
          streak={streak}
          bones={bonePlay.displayBones}
          className="scale-[0.88] origin-top-right"
        />
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
          boneCells={bonePlay.boneCells}
          collectedBones={bonePlay.collectedBones}
          popCell={bonePlay.popCell}
          onSelect={controller.select}
        />
        {paused && (
          <div className="absolute inset-3 flex flex-col items-center justify-center gap-5 rounded-2xl bg-[var(--background)]/95">
            <span className="text-[var(--primary)]">
              <PlayIcon width={52} height={52} />
            </span>
            <span className="font-display text-xl font-extrabold text-[var(--foreground)]">
              Paused
            </span>
            <div className="flex flex-col items-center gap-2.5 w-full max-w-[180px]">
              <button
                type="button"
                onClick={() => controller.setPaused(false)}
                className="font-display w-full rounded-full bg-[var(--primary)] py-3 text-base font-extrabold text-white shadow-sm active:scale-[0.98]"
              >
                Resume
              </button>
              <button
                type="button"
                onClick={onExit}
                className="font-display w-full rounded-full border-2 border-[var(--border)] bg-white py-3 text-base font-extrabold text-[var(--foreground)] active:scale-[0.98]"
              >
                End Game
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="flex flex-col gap-3 px-4 pb-4">
        <ActionBar
          notesMode={controller.notesMode}
          hintsRemaining={controller.hintsRemaining}
          disabled={done || paused}
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
          winBoneBonus={winBoneBonus}
          bonesFound={bonePlay.sessionBones}
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
