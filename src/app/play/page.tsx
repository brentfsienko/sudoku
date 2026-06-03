"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { GameScreen } from "@/components/board/GameScreen";
import {
  clearActiveSolo,
  isActiveSolo,
  loadActiveSolo,
  saveActiveSolo,
} from "@/lib/game/activeSolo";
import { createSnapshot, useLocalGame, type GameSnapshot } from "@/lib/game/store";
import { generatePuzzle } from "@/lib/sudoku/generator";
import { DIFFICULTIES, type Difficulty } from "@/lib/game/types";
import { getProfile } from "@/lib/profile";
import {
  loadUserData,
  recordSoloGame,
  STATS_UPDATED_EVENT,
} from "@/lib/stats/store";
import { loadLocal } from "@/lib/stats/local";

function parseDifficulty(value: string | null): Difficulty {
  return DIFFICULTIES.includes(value as Difficulty)
    ? (value as Difficulty)
    : "medium";
}

function initialSnapshot(resume: boolean, difficulty: Difficulty): GameSnapshot {
  if (resume) {
    const active = loadActiveSolo();
    if (active) return active.snapshot;
  } else {
    clearActiveSolo();
  }
  const puzzle = generatePuzzle(difficulty);
  return createSnapshot({
    puzzle: puzzle.puzzle,
    solution: puzzle.solution,
    difficulty,
    mode: "single",
  });
}

function SoloGame({
  resume,
  difficulty,
  streak,
  savedBones,
  onExit,
  onRematch,
  onWalletSync,
}: {
  resume: boolean;
  difficulty: Difficulty;
  streak: number;
  savedBones: number;
  onExit: () => void;
  onRematch: () => void;
  onWalletSync: () => void;
}) {
  const [snapshot] = useState(() => initialSnapshot(resume, difficulty));
  const [me] = useState(() => {
    const p = getProfile();
    return { name: p.username, dogId: p.dogId, role: "player-1" as const };
  });

  const controller = useLocalGame(snapshot);

  useEffect(() => {
    const s = controller.snapshot;
    if (!isActiveSolo(s)) return;
    const id = setTimeout(() => saveActiveSolo(s), 250);
    return () => clearTimeout(id);
  }, [controller.snapshot]);

  const handleExit = () => {
    const s = controller.snapshot;
    if (isActiveSolo(s)) saveActiveSolo(s);
    onExit();
  };

  return (
    <GameScreen
      controller={controller}
      me={me}
      streak={streak}
      savedBones={savedBones}
      onExit={handleExit}
      onRematch={onRematch}
      onFinish={({
        solved,
        score,
        elapsedSeconds,
        mistakes,
        hintsUsed,
        squaresFilled,
        bonesFound,
      }) =>
        void (async () => {
          clearActiveSolo();
          await recordSoloGame({
            won: solved,
            score,
            difficulty: snapshot.difficulty,
            elapsedSeconds,
            mistakes,
            hintsUsed,
            squaresFilled,
            bonesFound,
          });
          onWalletSync();
        })()
      }
    />
  );
}

function PlayInner() {
  const router = useRouter();
  const params = useSearchParams();
  const resume = params.get("resume") === "1";
  const difficulty = parseDifficulty(params.get("d"));
  const [round, setRound] = useState(0);
  const [wallet, setWallet] = useState({ streak: 0, bones: 0 });

  const syncWallet = () => {
    const d = loadLocal();
    setWallet({ streak: d.solo.streak, bones: d.bones ?? 0 });
  };

  useEffect(() => {
    void loadUserData().then((d) => {
      setWallet({ streak: d.solo.streak, bones: d.bones ?? 0 });
    });
  }, [round]);

  useEffect(() => {
    const onStats = () => syncWallet();
    window.addEventListener(STATS_UPDATED_EVENT, onStats);
    return () => window.removeEventListener(STATS_UPDATED_EVENT, onStats);
  }, []);

  return (
    <SoloGame
      key={resume ? "resume" : `${round}-${difficulty}`}
      resume={resume}
      difficulty={difficulty}
      streak={wallet.streak}
      savedBones={wallet.bones}
      onExit={() => router.push("/")}
      onRematch={() => {
        clearActiveSolo();
        setRound((r) => r + 1);
      }}
      onWalletSync={syncWallet}
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
