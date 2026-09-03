"use client";

import { Suspense, useEffect, useRef, useState } from "react";
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
import {
  loadUserData,
  recordMultiGame,
  STATS_UPDATED_EVENT,
} from "@/lib/stats/store";
import { loadLocal } from "@/lib/stats/local";
import {
  DIFFICULTIES,
  DIFFICULTY_LABELS,
  GAME_MODE_LABELS,
  MAX_PLAYERS,
  type Difficulty,
  type GameMode,
  type PlayerRole,
} from "@/lib/game/types";
import type { LivePlayer } from "@/lib/liveblocks/useLiveGame";
import { useTrackRedditGameStart } from "@/lib/analytics/useTrackRedditGameStart";
import { useGameEvents } from "@/lib/game/useGameEvents";
import { useRoomChat } from "@/lib/liveblocks/useRoomChat";
import { ChatSheet } from "@/components/game/ChatSheet";
import { ChatToggleButton } from "@/components/game/ChatToggleButton";
import {
  saveActiveMulti,
  clearActiveMulti,
} from "@/lib/game/activeMulti";

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
  const router = useRouter();
  const code = String(params.room ?? "").toUpperCase();
  const wantHost = search.get("host") === "1";
  const seedDifficulty = parseDifficulty(search.get("d"));
  const seedMode = parseMode(search.get("m"));
  const needsConfirm = search.get("confirm") === "1";
  const fromName = search.get("from") ?? "Someone";
  const [profile] = useState<Profile>(() => getProfile());

  // Show confirmation gate before entering the Liveblocks room
  if (needsConfirm) {
    return (
      <JoinConfirmScreen
        code={code}
        fromName={fromName}
        mode={seedMode}
        difficulty={seedDifficulty}
        onJoin={() =>
          router.replace(`/game/${code}?m=${seedMode}&d=${seedDifficulty}`)
        }
        onDecline={() => router.replace("/")}
      />
    );
  }

  return (
    <LiveblocksProvider>
      <RoomProvider
        id={`floof-${code}`}
        initialPresence={{
          name: profile.username,
          dogId: profile.dogId,
          role: null, // claimed dynamically in useLiveGame
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
          wantHost={wantHost}
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
  wantHost,
  seedDifficulty,
  seedMode,
  profile,
}: {
  code: string;
  wantHost: boolean;
  seedDifficulty: Difficulty;
  seedMode: GameMode;
  profile: Profile;
}) {
  useTrackRedditGameStart("multiplayer");
  const router = useRouter();
  const connection = useStatus();
  const [wallet, setWallet] = useState({ streak: 0, bones: 0 });

  const syncWallet = () => {
    const d = loadLocal();
    setWallet({ streak: d.solo.streak, bones: d.bones ?? 0 });
  };

  useEffect(() => {
    void loadUserData().then((d) => {
      setWallet({ streak: d.solo.streak, bones: d.bones ?? 0 });
    });
  }, []);

  useEffect(() => {
    const onStats = () => syncWallet();
    window.addEventListener(STATS_UPDATED_EVENT, onStats);
    return () => window.removeEventListener(STATS_UPDATED_EVENT, onStats);
  }, []);

  const game = useLiveGame({
    wantHost,
    seedDifficulty,
    seedMode,
    hostName: profile.username,
  });

  const chat = useRoomChat(game.me.role, profile.username);
  const [chatOpen, setChatOpen] = useState(false);

  function toggleChat() {
    setChatOpen((open) => !open);
    chat.markRead();
  }

  const chatOverlay = chatOpen ? (
    <ChatSheet
      chat={chat}
      myRole={game.me.role}
      onClose={() => setChatOpen(false)}
    />
  ) : null;

  // Persist active room so the home screen can offer a rejoin card.
  useEffect(() => {
    const snap = game.controller?.snapshot;
    if (!snap) return;
    if (snap.status === "playing") {
      saveActiveMulti({
        code,
        mode: snap.mode,
        difficulty: snap.difficulty,
        joinedAt: snap.startedAt ?? Date.now(),
      });
    } else if (snap.status === "done") {
      clearActiveMulti();
    }
  }, [code, game.controller?.snapshot?.status, game.controller?.snapshot?.mode, game.controller?.snapshot?.difficulty, game.controller?.snapshot?.startedAt]);

  // Clear on unmount (navigating away from the room).
  useEffect(() => {
    return () => clearActiveMulti();
  }, []);

  const exit = () => router.push("/");

  if (game.loading) {
    return <ConnectingScreen connection={connection} onExit={exit} />;
  }

  if (!game.ready || !game.controller) {
    return (
      <>
        <Lobby
          code={code}
          isHost={game.isHost}
          mode={game.controller?.snapshot.mode ?? seedMode}
          difficulty={game.controller?.snapshot.difficulty ?? seedDifficulty}
          allPlayers={game.allPlayers}
          canStart={game.canStart}
          isFull={game.isFull}
          onStart={game.startGame}
          onExit={exit}
          chat={chat}
          onToggleChat={toggleChat}
        />
        {chatOverlay}
      </>
    );
  }

  return (
    <>
      <GameEventsWatcher
        myRole={game.me.role ?? "host"}
        mode={game.controller.snapshot.mode}
        playing={game.controller.snapshot.status === "playing"}
      />
    <GameScreen
      controller={game.controller}
      me={game.me}
      opponent={game.opponent}
      allPlayers={game.allPlayers}
      peers={game.peers}
      analyticsMode="multiplayer"
      onExit={exit}
      onNext={game.returnToLobby}
      onToggleChat={toggleChat}
      streak={wallet.streak}
      savedBones={wallet.bones}
      chat={chat}
      onFinish={async ({
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
        await recordMultiGame(
          {
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
          },
          { roomCode: code },
        );
        syncWallet();
      }}
    />
      {chatOverlay}
    </>
  );
}

function GameEventsWatcher({
  myRole,
  mode,
  playing,
}: {
  myRole: PlayerRole;
  mode: GameMode;
  playing: boolean;
}) {
  useGameEvents({ myRole, mode, playing });
  return null;
}

function JoinConfirmScreen({
  code,
  fromName,
  mode,
  difficulty,
  onJoin,
  onDecline,
}: {
  code: string;
  fromName: string;
  mode: GameMode;
  difficulty: Difficulty;
  onJoin: () => void;
  onDecline: () => void;
}) {
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-1 flex-col items-center justify-center gap-7 px-6 text-center">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/brand/Sudogku_Orange.svg"
        alt="Sudogku"
        className="w-48"
        style={{ imageRendering: "pixelated" }}
        aria-hidden
      />
      <div className="space-y-2">
        <h2 className="font-display text-2xl font-extrabold text-[var(--foreground)]">
          Game invite 🎮
        </h2>
        <p className="text-base text-[var(--muted)]">
          <span className="font-bold text-[var(--foreground)]">{fromName}</span> invited you to a{" "}
          <span className="font-semibold">{GAME_MODE_LABELS[mode]}</span> ·{" "}
          <span className="font-semibold">{DIFFICULTY_LABELS[difficulty]}</span> game
        </p>
        <p className="text-sm text-[var(--muted)]">Room {code}</p>
      </div>
      <div className="flex w-full max-w-xs flex-col gap-3">
        <button
          type="button"
          onClick={onJoin}
          className="font-display w-full rounded-md bg-[var(--primary)] py-3.5 font-extrabold text-white transition active:scale-[0.98]"
        >
          Join game
        </button>
        <button
          type="button"
          onClick={onDecline}
          className="font-display w-full rounded-md border-2 border-[var(--border)] bg-white py-3 font-bold text-[var(--muted)] transition active:scale-[0.98]"
        >
          No thanks
        </button>
      </div>
    </div>
  );
}

/** Liveblocks can report "disconnected" briefly during auth — don't fail on that. */
const CONNECT_GRACE_MS = 15_000;

function ConnectingScreen({
  connection,
  onExit,
}: {
  connection: string;
  onExit: () => void;
}) {
  const [timedOut, setTimedOut] = useState(false);
  useEffect(() => {
    const id = setTimeout(() => setTimedOut(true), CONNECT_GRACE_MS);
    return () => clearTimeout(id);
  }, []);

  // Only show failure after a grace period. Transient "disconnected" during
  // handshake used to flash a false error immediately.
  const failed = timedOut && connection !== "connected";

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
      <DogAvatar dogId="husky" size={96} />
      {failed ? (
        <>
          <h2 className="font-display text-xl font-extrabold text-[var(--foreground)]">
            Can&apos;t reach the dog park
          </h2>
          <p className="text-sm text-[var(--muted)]">
            Having trouble joining the room. Check your connection, then try
            again.
          </p>
          <div className="mt-2 flex flex-col items-center gap-2">
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="font-display rounded-md bg-[var(--primary)] px-6 py-3 font-extrabold text-white"
            >
              Try again
            </button>
            <button
              type="button"
              onClick={onExit}
              className="font-display rounded-md px-6 py-2 text-sm font-bold text-[var(--muted)]"
            >
              Back home
            </button>
          </div>
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
  allPlayers,
  canStart,
  isFull,
  onStart,
  onExit,
  chat,
  onToggleChat,
}: {
  code: string;
  isHost: boolean;
  mode: GameMode;
  difficulty: Difficulty;
  allPlayers: LivePlayer[];
  canStart: boolean;
  isFull: boolean;
  onStart: () => void;
  onExit: () => void;
  chat: ReturnType<typeof useRoomChat>;
  onToggleChat: () => void;
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

  const slots = Array.from({ length: MAX_PLAYERS });

  return (
    <div
      className="mx-auto flex min-h-dvh w-full max-w-md flex-1 flex-col px-5"
      style={{ paddingTop: "calc(env(safe-area-inset-top) + 0.75rem)" }}
    >
      <div className="flex items-center justify-between py-2">
        <button
          type="button"
          onClick={onExit}
          className="flex h-9 w-9 items-center justify-center rounded-md bg-white text-[var(--paw)] shadow-sm active:scale-95"
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
        <ChatToggleButton
          unread={chat.unread}
          onClick={onToggleChat}
        />
      </div>

      <div className="flex flex-1 flex-col items-center justify-center gap-5">
        {/* Room code card */}
        <div className="w-full rounded-lg bg-white p-6 text-center shadow-sm">
          <div className="text-sm font-semibold text-[var(--muted)]">Room code</div>
          <div className="font-display my-1 text-5xl font-extrabold tracking-[0.3em] text-[var(--primary)]">
            {code}
          </div>
          <div className="text-xs text-[var(--muted)]">
            {DIFFICULTY_LABELS[difficulty]} · {GAME_MODE_LABELS[mode]}
          </div>
          {!isFull && (
            <button
              type="button"
              onClick={share}
              className="font-display mt-4 w-full rounded-md bg-[var(--accent)] py-3 font-extrabold text-white transition active:scale-[0.98]"
            >
              {copied ? "Link copied!" : "Share invite"}
            </button>
          )}
          {isFull && (
            <p className="mt-3 text-sm font-semibold text-[var(--muted)]">Room full (4/4)</p>
          )}
        </div>

        {/* Player slots — 2×2 grid */}
        <div className="grid w-full grid-cols-2 gap-3">
          {slots.map((_, i) => {
            const player = allPlayers[i];
            const isMe = player?.role === allPlayers[0]?.role && i === 0;
            return (
              <div
                key={i}
                className="flex flex-col items-center gap-2 rounded-md bg-[var(--surface-soft)] py-4"
              >
                {player ? (
                  <>
                    <PlayerBadge
                      name=""
                      dogId={player.dogId}
                      role={player.role}
                      size={52}
                      compact
                      bubble={player.role ? (chat.latestByRole[player.role] ?? null) : null}
                      bubbleAlign={i % 2 === 0 ? "left" : "right"}
                    />
                    <span className="font-display text-sm font-bold text-[var(--foreground)]">
                      {player.name}
                      {isMe && (
                        <span className="ml-1 text-xs font-normal text-[var(--muted)]">(you)</span>
                      )}
                    </span>
                  </>
                ) : (
                  <>
                    <div className="flex h-[52px] w-[52px] items-center justify-center rounded-md border-2 border-dashed border-[var(--muted)] text-xl text-[var(--muted)]">
                      ?
                    </div>
                    <span className="font-display animate-pulse text-sm font-bold text-[var(--muted)]">
                      Waiting…
                    </span>
                  </>
                )}
              </div>
            );
          })}
        </div>

        {/* Host controls / status */}
        {isHost ? (
          <div className="w-full space-y-2">
            <button
              type="button"
              onClick={onStart}
              disabled={!canStart}
              className="font-display w-full rounded-md bg-[var(--primary)] py-3.5 font-extrabold text-white transition active:scale-[0.98] disabled:opacity-40"
            >
              {canStart ? `Start game (${allPlayers.length} players)` : "Waiting for players…"}
            </button>
            <p className="text-center text-xs text-[var(--muted)]">
              You can start with 2–{MAX_PLAYERS} players
            </p>
          </div>
        ) : (
          <p className="text-center text-sm text-[var(--muted)]">
            Waiting for the host to start the game…
          </p>
        )}
      </div>
    </div>
  );
}
