"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { GameScreen } from "@/components/board/GameScreen";
import {
  isActiveSolo,
  loadActiveSolo,
  loadLatestActiveSolo,
  newActiveSoloId,
  removeActiveSolo,
  upsertActiveSolo,
} from "@/lib/game/activeSolo";
import { createSnapshot, useLocalGame, type GameSnapshot } from "@/lib/game/store";
import { generatePuzzle } from "@/lib/sudoku/generator";
import { DIFFICULTIES, type Difficulty } from "@/lib/game/types";
import { getProfile } from "@/lib/profile";
import {
  abandonSoloGame,
  loadUserData,
  recordSoloGame,
  STATS_UPDATED_EVENT,
} from "@/lib/stats/store";
import { loadLocal } from "@/lib/stats/local";
import { useTrackRedditGameStart } from "@/lib/analytics/useTrackRedditGameStart";

function parseDifficulty(value: string | null): Difficulty {
  return DIFFICULTIES.includes(value as Difficulty)
    ? (value as Difficulty)
    : "medium";
}

function resolveResumeId(resumeParam: string | null): string | null {
  if (!resumeParam) return null;
  if (resumeParam === "1") return loadLatestActiveSolo()?.id ?? null;
  return loadActiveSolo(resumeParam) ? resumeParam : null;
}

function initialState(playId: string, difficulty: Difficulty): GameSnapshot {
  const saved = loadActiveSolo(playId);
  if (saved) {
    if (!isActiveSolo(saved.snapshot)) {
      removeActiveSolo(playId);
    } else {
      return saved.snapshot;
    }
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
  activeId,
  difficulty,
  streak,
  savedBones,
  onExit,
  onRematch,
  onWalletSync,
}: {
  activeId: string;
  difficulty: Difficulty;
  streak: number;
  savedBones: number;
  onExit: () => void;
  onRematch: () => void;
  onWalletSync: () => void;
}) {
  useTrackRedditGameStart("solo");
  const [snapshot] = useState(() => initialState(activeId, difficulty));
  const [me] = useState(() => {
    const p = getProfile();
    return { name: p.username, dogId: p.dogId, role: "player-1" as const };
  });

  const controller = useLocalGame(snapshot);
  const controllerRef = useRef(controller);
  controllerRef.current = controller;

  useEffect(() => {
    if (!isActiveSolo(controller.snapshot)) return;
    const id = setTimeout(() => {
      const s = controllerRef.current.snapshot;
      if (!isActiveSolo(s)) return;
      upsertActiveSolo(s, activeId);
    }, 250);
    return () => clearTimeout(id);
  }, [controller.snapshot, activeId]);

  useEffect(() => {
    return () => {
      const s = controllerRef.current.snapshot;
      if (isActiveSolo(s)) upsertActiveSolo(s, activeId, { pauseIfPlaying: true });
    };
  }, [activeId]);

  const persistAndExit = () => {
    const s = controller.snapshot;
    if (isActiveSolo(s)) upsertActiveSolo(s, activeId, { pauseIfPlaying: true });
    onExit();
  };

  const abandonAndExit = () => {
    void (async () => {
      const s = controller.snapshot;
      await abandonSoloGame(activeId, s);
      onWalletSync();
      onExit();
    })();
  };

  return (
    <GameScreen
      controller={controller}
      me={me}
      streak={streak}
      savedBones={savedBones}
      onExit={persistAndExit}
      onAbandon={abandonAndExit}
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
          await recordSoloGame(
            {
              won: solved,
              score,
              difficulty: snapshot.difficulty,
              elapsedSeconds,
              mistakes,
              hintsUsed,
              squaresFilled,
              bonesFound,
            },
            { activeId },
          );
          onWalletSync();
        })()
      }
    />
  );
}

function PlayInner() {
  const router = useRouter();
  const params = useSearchParams();
  const resumeParam = params.get("resume");
  const difficulty = parseDifficulty(params.get("d"));
  const [round, setRound] = useState(0);
  const [wallet, setWallet] = useState({ streak: 0, bones: 0 });

  const [playId, setPlayId] = useState(
    () => resolveResumeId(resumeParam) ?? newActiveSoloId(),
  );

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
      key={`${playId}-${round}`}
      activeId={playId}
      difficulty={difficulty}
      streak={wallet.streak}
      savedBones={wallet.bones}
      onExit={() => router.push("/")}
      onRematch={() => {
        removeActiveSolo(playId);
        setPlayId(newActiveSoloId());
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
