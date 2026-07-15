"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { GameScreen } from "@/components/board/GameScreen";
import {
  isActiveSolo,
  loadActiveSolo,
  removeActiveSolo,
  upsertActiveSolo,
} from "@/lib/game/activeSolo";
import { claimSoloFinish } from "@/lib/game/finishedSolo";
import { createSnapshot, useLocalGame, type GameSnapshot } from "@/lib/game/store";
import { getProfile } from "@/lib/profile";
import { loadUserData, recordSoloGame, STATS_UPDATED_EVENT } from "@/lib/stats/store";
import { loadLocal } from "@/lib/stats/local";
import {
  getDailyActiveId,
  getDailyPuzzle,
  getPSTDate,
  isTodayComplete,
} from "@/lib/daily/puzzle";
import { submitDailyResult } from "@/lib/daily/api";
import { DailyLeaderboard } from "@/components/home/DailyLeaderboard";
import { LoadingPaws } from "@/app/play/page";
import { fetchFriends } from "@/lib/friends/api";
import { getSupabase } from "@/lib/supabase/client";
import type { Friend } from "@/lib/friends/types";

function buildInitialSnapshot(activeId: string): GameSnapshot {
  const saved = loadActiveSolo(activeId);
  if (saved && isActiveSolo(saved.snapshot)) return saved.snapshot;

  const dateStr = getPSTDate();
  const puzzle = getDailyPuzzle(dateStr);
  return createSnapshot({
    puzzle: puzzle.puzzle,
    solution: puzzle.solution,
    difficulty: puzzle.difficulty,
    mode: "single",
  });
}

function DailyGame({
  activeId,
  dateStr,
  streak,
  savedBones,
  onExit,
  onFinish,
}: {
  activeId: string;
  dateStr: string;
  streak: number;
  savedBones: number;
  onExit: () => void;
  onFinish: (elapsedSeconds: number, mistakes: number) => void;
}) {
  const [snapshot] = useState(() => buildInitialSnapshot(activeId));
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

  return (
    <GameScreen
      controller={controller}
      me={me}
      streak={streak}
      savedBones={savedBones}
      onExit={persistAndExit}
      onRematch={onExit}
      onFinish={({ solved, score, elapsedSeconds, mistakes, hintsUsed, squaresFilled, bonesFound }) =>
        void (async () => {
          if (!claimSoloFinish(activeId)) return;
          removeActiveSolo(activeId);
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
          await submitDailyResult(dateStr, elapsedSeconds, mistakes);
          onFinish(elapsedSeconds, mistakes);
        })()
      }
    />
  );
}

function DailyInner() {
  const router = useRouter();
  const dateStr = getPSTDate();
  const activeId = getDailyActiveId(dateStr);

  const [wallet, setWallet] = useState({ streak: 0, bones: 0 });
  const [userId, setUserId] = useState<string | null>(null);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [alreadyDone] = useState(() => isTodayComplete());

  useEffect(() => {
    void loadUserData().then((d) => {
      setWallet({ streak: d.solo.streak, bones: d.bones ?? 0 });
    });

    void (async () => {
      const session = await getSupabase()?.auth.getSession();
      const uid = session?.data.session?.user?.id ?? null;
      setUserId(uid);
      if (uid) {
        const f = await fetchFriends(uid);
        setFriends(f);
      }
    })();
  }, []);

  useEffect(() => {
    const onStats = () => {
      const d = loadLocal();
      setWallet({ streak: d.solo.streak, bones: d.bones ?? 0 });
    };
    window.addEventListener(STATS_UPDATED_EVENT, onStats);
    return () => window.removeEventListener(STATS_UPDATED_EVENT, onStats);
  }, []);

  if (alreadyDone || showLeaderboard) {
    return (
      <div className="flex min-h-dvh flex-1 flex-col items-center bg-[var(--background)] p-4 pt-safe">
        <div className="w-full max-w-md pt-8">
          <div className="mb-4 flex items-center justify-between">
            <h1 className="font-display text-xl font-extrabold text-[var(--foreground)]">
              Daily Leaderboard
            </h1>
            <button
              onClick={() => router.push("/")}
              className="text-sm font-semibold text-[var(--primary)]"
            >
              Done
            </button>
          </div>
          <DailyLeaderboard
            friends={friends}
            myId={userId ?? ""}
            initialDate={dateStr}
          />
        </div>
      </div>
    );
  }

  return (
    <DailyGame
      activeId={activeId}
      dateStr={dateStr}
      streak={wallet.streak}
      savedBones={wallet.bones}
      onExit={() => router.push("/")}
      onFinish={() => setShowLeaderboard(true)}
    />
  );
}

export default function DailyPage() {
  return (
    <Suspense fallback={<LoadingPaws />}>
      <DailyInner />
    </Suspense>
  );
}
