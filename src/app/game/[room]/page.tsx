"use client";

import { Suspense, useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import {
  LiveblocksProvider,
  RoomProvider,
  useStatus,
} from "@/lib/liveblocks/config";
import { buildInitialStorage, useLiveGame } from "@/lib/liveblocks/useLiveGame";
import { GameScreen } from "@/components/board/GameScreen";
import { PlayerBadge } from "@/components/PlayerBadge";
import { DogAvatar } from "@/components/DogAvatar";
import { ChevronLeftIcon, PawIcon } from "@/components/icons";
import { LoadingPaws } from "@/app/play/page";
import { getProfile, type Profile } from "@/lib/profile";
import { cellContributions } from "@/lib/game/engine";
import { loadUserData, recordMultiGame } from "@/lib/stats/store";
import {
  DIFFICULTIES,
  DIFFICULTY_LABELS,
  GAME_MODE_LABELS,
  type Difficulty,
  type GameMode,
} from "@/lib/game/types";

function parseDifficulty(value: string | null): Difficulty {
  return DIFFICULTIES.includes(value as Difficulty)
    ? (value as Difficulty)
    : "medium";
}
function parseMode(value: string | null): GameMode {
  return value === "competitive" ? "competitive" : "coop";
}

export default function GameRoomPage() {
  return (
    <Suspense fallback={<LoadingPaws />}>
      <RoomRoute />
    </Suspense>
  );
}

function RoomRoute() {
  const params = useParams();
  const search = useSearchParams();
  const code = String(params.room ?? "").toUpperCase();
  const isHost = search.get("host") === "1";
  const seedDifficulty = parseDifficulty(search.get("d"));
  const seedMode = parseMode(search.get("m"));
  const [profile] = useState<Profile>(() => getProfile());

  return (
    <LiveblocksProvider>
      <RoomProvider
        id={`floof-${code}`}
        initialPresence={{
          name: profile.username,
          dogId: profile.dogId,
          role: isHost ? "player-1" : "player-2",
          selectedCell: null,
          online: true,
        }}
        initialStorage={buildInitialStorage({
          difficulty: seedDifficulty,
          mode: seedMode,
        })}
      >
        <RoomInner
          code={code}
          isHost={isHost}
          seedDifficulty={seedDifficulty}
          seedMode={seedMode}
          profile={profile}
        />
      </RoomProvider>
    </LiveblocksProvider>
  );
}

function RoomInner({
  code,
  isHost,
  seedDifficulty,
  seedMode,
  profile,
}: {
  code: string;
  isHost: boolean;
  seedDifficulty: Difficulty;
  seedMode: GameMode;
  profile: Profile;
}) {
  const router = useRouter();
  const connection = useStatus();
  const [wallet, setWallet] = useState({ streak: 0, bones: 0 });

  useEffect(() => {
    void loadUserData().then((d) => {
      setWallet({ streak: d.solo.streak, bones: d.bones ?? 0 });
    });
  }, []);

  const game = useLiveGame({
    isHost,
    seedDifficulty,
    seedMode,
    hostName: profile.username,
  });

  const exit = () => router.push("/");

  if (game.loading) {
    return <ConnectingScreen connection={connection} onExit={exit} />;
  }

  if (!game.ready || !game.controller) {
    return (
      <Lobby
        code={code}
        isHost={isHost}
        mode={game.controller?.snapshot.mode ?? seedMode}
        difficulty={game.controller?.snapshot.difficulty ?? seedDifficulty}
        me={game.me}
        opponent={game.opponent}
        onExit={exit}
      />
    );
  }

  return (
    <GameScreen
      controller={game.controller}
      me={game.me}
      opponent={game.opponent}
      peers={game.peers}
      onExit={exit}
      onRematch={game.rematch}
      streak={wallet.streak}
      savedBones={wallet.bones}
      onFinish={({
        solved,
        score,
        elapsedSeconds,
        mistakes,
        bonesFound,
      }) => {
        const snap = game.controller?.snapshot;
        if (!snap) return;
        const contrib = cellContributions(snap.puzzle, snap.solution, snap.cells);
        const oppRole = game.opponent?.role;
        void recordMultiGame({
          mode: snap.mode === "competitive" ? "competitive" : "coop",
          solved,
          mySquares: contrib[game.me.role] ?? 0,
          opponentSquares: oppRole ? contrib[oppRole] ?? 0 : 0,
          opponentName: game.opponent?.name ?? "",
          opponentDogId: game.opponent?.dogId ?? "",
          difficulty: snap.difficulty,
          elapsedSeconds,
          mistakes,
          score,
          bonesFound,
        });
      }}
    />
  );
}

function ConnectingScreen({
  connection,
  onExit,
}: {
  connection: string;
  onExit: () => void;
}) {
  const [slow, setSlow] = useState(false);
  useEffect(() => {
    const id = setTimeout(() => setSlow(true), 6000);
    return () => clearTimeout(id);
  }, []);

  const failed = connection === "disconnected";

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
      <DogAvatar dogId="husky" size={96} />
      {failed || slow ? (
        <>
          <h2 className="font-display text-xl font-extrabold text-[var(--foreground)]">
            Can&apos;t reach the dog park
          </h2>
          <p className="text-sm text-[var(--muted)]">
            Multiplayer needs a Liveblocks key. Make sure{" "}
            <code className="rounded bg-[var(--surface-soft)] px-1">
              LIVEBLOCKS_SECRET_KEY
            </code>{" "}
            is set in your environment, then try again.
          </p>
          <button
            type="button"
            onClick={onExit}
            className="font-display mt-2 rounded-full bg-[var(--primary)] px-6 py-3 font-extrabold text-white"
          >
            Back home
          </button>
        </>
      ) : (
        <p className="font-display animate-pulse text-lg font-bold text-[var(--muted)]">
          Sniffing out the room… 🐾
        </p>
      )}
    </div>
  );
}

function Lobby({
  code,
  isHost,
  mode,
  difficulty,
  me,
  opponent,
  onExit,
}: {
  code: string;
  isHost: boolean;
  mode: GameMode;
  difficulty: Difficulty;
  me: { name: string; dogId: string; role: "player-1" | "player-2" };
  opponent: { name: string; dogId: string; role: "player-1" | "player-2" } | null;
  onExit: () => void;
}) {
  const [copied, setCopied] = useState(false);

  async function share() {
    const url =
      typeof window !== "undefined" ? `${window.location.origin}/game/${code}` : "";
    try {
      if (navigator.share) {
        await navigator.share({ title: "Sudogku", text: `Join my game! Code: ${code}`, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // user cancelled or clipboard unavailable
    }
  }

  return (
    <div
      className="mx-auto flex min-h-dvh w-full max-w-md flex-1 flex-col px-5"
      style={{ paddingTop: "calc(env(safe-area-inset-top) + 0.75rem)" }}
    >
      <div className="flex items-center justify-between py-2">
        <button
          type="button"
          onClick={onExit}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-[var(--paw)] shadow-sm active:scale-95"
          aria-label="Back"
        >
          <ChevronLeftIcon width={22} height={22} />
        </button>
        <div className="flex items-center gap-2 font-display font-extrabold text-[var(--foreground)]">
          <span className="text-[var(--primary)]">
            <PawIcon width={20} height={20} />
          </span>
          {GAME_MODE_LABELS[mode]}
        </div>
        <div className="h-9 w-9" />
      </div>

      <div className="flex flex-1 flex-col items-center justify-center gap-6">
        <div className="w-full rounded-3xl bg-white p-6 text-center shadow-sm">
          <div className="text-sm font-semibold text-[var(--muted)]">
            Room code
          </div>
          <div className="font-display my-1 text-5xl font-extrabold tracking-[0.3em] text-[var(--primary)]">
            {code}
          </div>
          <div className="text-xs text-[var(--muted)]">
            {DIFFICULTY_LABELS[difficulty]} · {GAME_MODE_LABELS[mode]}
          </div>
          <button
            type="button"
            onClick={share}
            className="font-display mt-4 w-full rounded-full bg-[var(--accent)] py-3 font-extrabold text-white transition active:scale-[0.98]"
          >
            {copied ? "Link copied!" : "Share invite"}
          </button>
        </div>

        <div className="flex w-full items-center justify-around rounded-3xl bg-[var(--surface-soft)] p-5">
          <div className="flex flex-col items-center gap-2">
            <PlayerBadge
              name=""
              dogId={me.dogId}
              role={me.role}
              size={56}
              compact
            />
            <span className="font-display text-sm font-bold text-[var(--foreground)]">
              {me.name} (You)
            </span>
          </div>
          <span className="text-2xl">🐾</span>
          <div className="flex flex-col items-center gap-2">
            {opponent ? (
              <>
                <PlayerBadge
                  name=""
                  dogId={opponent.dogId}
                  role={opponent.role}
                  size={56}
                  compact
                />
                <span className="font-display text-sm font-bold text-[var(--foreground)]">
                  {opponent.name}
                </span>
              </>
            ) : (
              <>
                <div className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-dashed border-[var(--muted)] text-2xl text-[var(--muted)]">
                  ?
                </div>
                <span className="font-display animate-pulse text-sm font-bold text-[var(--muted)]">
                  Waiting…
                </span>
              </>
            )}
          </div>
        </div>

        <p className="text-center text-sm text-[var(--muted)]">
          {opponent
            ? "Starting the game…"
            : isHost
              ? "Share the code with your friend. The game starts when they join."
              : "Waiting for the host to start the game…"}
        </p>
      </div>
    </div>
  );
}
