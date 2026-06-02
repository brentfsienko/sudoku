"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { GameScreen } from "@/components/board/GameScreen";
import { createSnapshot, useLocalGame } from "@/lib/game/store";
import { generatePuzzle } from "@/lib/sudoku/generator";
import { DIFFICULTIES, type Difficulty } from "@/lib/game/types";
import { getProfile } from "@/lib/profile";
import { recordGame } from "@/lib/storage";

function parseDifficulty(value: string | null): Difficulty {
  return DIFFICULTIES.includes(value as Difficulty)
    ? (value as Difficulty)
    : "medium";
}

function SoloGame({
  difficulty,
  onExit,
  onRematch,
}: {
  difficulty: Difficulty;
  onExit: () => void;
  onRematch: () => void;
}) {
  const [snapshot] = useState(() => {
    const puzzle = generatePuzzle(difficulty);
    return createSnapshot({
      puzzle: puzzle.puzzle,
      solution: puzzle.solution,
      difficulty,
      mode: "single",
    });
  });
  const [me] = useState(() => {
    const p = getProfile();
    return { name: p.name, dogId: p.dogId, role: "player-1" as const };
  });

  const controller = useLocalGame(snapshot);

  return (
    <GameScreen
      controller={controller}
      me={me}
      onExit={onExit}
      onRematch={onRematch}
      onFinish={({ solved, score, elapsedSeconds, mistakes, hintsUsed }) =>
        recordGame({
          won: solved,
          score,
          difficulty,
          elapsedSeconds,
          mistakes,
          hintsUsed,
        })
      }
    />
  );
}

function PlayInner() {
  const router = useRouter();
  const params = useSearchParams();
  const difficulty = parseDifficulty(params.get("d"));
  const [round, setRound] = useState(0);

  return (
    <SoloGame
      key={round}
      difficulty={difficulty}
      onExit={() => router.push("/")}
      onRematch={() => setRound((r) => r + 1)}
    />
  );
}

export default function PlayPage() {
  return (
    <Suspense fallback={<LoadingPaws />}>
      <PlayInner />
    </Suspense>
  );
}

export function LoadingPaws() {
  return (
    <div className="flex min-h-dvh flex-1 items-center justify-center bg-[var(--background)]">
      <div className="font-display animate-pulse text-lg font-bold text-[var(--muted)]">
        Fetching a fresh puzzle… 🐾
      </div>
    </div>
  );
}
