"use client";

import { useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { BoneIcon } from "@/components/BoneIcon";
import { usePullToRefresh } from "@/lib/hooks/usePullToRefresh";
import { ActiveSoloGames } from "@/components/home/ActiveSoloGames";
import { GameHistoryList } from "@/components/home/GameHistoryList";
import { DogAvatar } from "@/components/DogAvatar";
import { PlayTabHeader } from "@/components/home/PlayTabHeader";
import {
  GameSetupSheet,
  type GameSetupResult,
} from "@/components/home/GameSetupSheet";
import { FactGuessCard } from "@/components/home/FactGuessCard";
import { homeSectionTitleClass } from "@/components/home/FriendListPanel";
import { StartGameSheet } from "@/components/home/StartGameSheet";
import { DogGreetingBubble } from "@/components/home/DogGreetingBubble";
import { StreakBonePill } from "@/components/home/StreakBonePill";
import { DailySection } from "@/components/home/DailySection";
import { PawIcon, UsersIcon } from "@/components/icons";
import { createGameInvite } from "@/lib/friends/api";
import type { PublicProfile } from "@/lib/friends/types";
import { useFriends } from "@/lib/friends/useFriends";
import { newRoomCode } from "@/lib/game/room";
import { usePullableSheet } from "@/lib/hooks/usePullableSheet";
import type { UseUserData } from "@/lib/stats/useUserData";
import type { UserData } from "@/lib/stats/types";

/** Space reserved for pinned title (must match header + scroll padding-top). */
const PLAY_HEADER_HEIGHT =
  "calc(env(safe-area-inset-top) + 1.25rem + 2.75rem + 0.75rem)";

/** Min height for white sheet so it reaches the nav when content is short. */
const PLAY_SHEET_MIN_HEIGHT =
  "calc(var(--app-height, 100dvh) - env(safe-area-inset-top) - env(safe-area-inset-bottom) - 1.25rem - 2.75rem - 0.75rem - 3.25rem - 3.5rem)";

type Props = {
  data: UserData;
  userData: UseUserData;
  onSignIn: () => void;
  onViewDailyLeaderboard: () => void;
};

function PlayRow({
  icon,
  title,
  subtitle,
  onClick,
}: {
  icon: ReactNode;
  title: string;
  subtitle: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-3 rounded-2xl bg-[var(--list-panel)] px-4 py-3 text-left transition active:scale-[0.99]"
    >
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[var(--primary-soft)] text-[var(--primary)]">
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-display text-sm font-bold text-[var(--foreground)]">
          {title}
        </p>
        <p className="text-xs text-[var(--muted)]">{subtitle}</p>
      </div>
      <span className="shrink-0 rounded-full border border-[var(--border)] bg-white px-3 py-1 text-[11px] font-bold text-[var(--foreground)]">
        Start
      </span>
    </button>
  );
}

export function MainTab({ data, userData, onSignIn, onViewDailyLeaderboard }: Props) {
  const router = useRouter();
  const friends = useFriends(userData.user, data.profile);
  const { sheetRef, offset, pulling } = usePullableSheet();
  const { containerRef, pull, progress, state: ptrState, snapping } = usePullToRefresh(
    () => userData.refresh(),
  );
  const [inviteSheetOpen, setInviteSheetOpen] = useState(false);
  const [setupOpen, setSetupOpen] = useState(false);
  const [setupKind, setSetupKind] = useState<"solo" | "multiplayer">("solo");
  const [pendingMulti, setPendingMulti] = useState<Extract<
    GameSetupResult,
    { kind: "multiplayer" }
  > | null>(null);
  const [greetingReopenToken, setGreetingReopenToken] = useState(0);

  const streak = data.solo.streak;
  const bones = data.bones ?? 0;

  const sheetMotion = {
    transform: `translateY(${offset}px)`,
    transition: pulling ? "none" : "transform 0.28s cubic-bezier(0.32, 0.72, 0, 1)",
  };

  function openSoloSetup() {
    setPendingMulti(null);
    setSetupKind("solo");
    setSetupOpen(true);
  }

  function openMultiSetup() {
    if (!userData.authConfigured || !userData.user) {
      onSignIn();
      return;
    }
    setPendingMulti(null);
    setSetupKind("multiplayer");
    setSetupOpen(true);
  }

  function handleSetupConfirm(result: GameSetupResult) {
    setSetupOpen(false);

    if (result.kind === "solo") {
      router.push(`/play?d=${result.difficulty}`);
      return;
    }

    if (!userData.user) {
      onSignIn();
      return;
    }

    setPendingMulti(result);
    setInviteSheetOpen(true);
  }

  async function handleConfirmGuests(guests: PublicProfile[]) {
    if (!userData.user || !pendingMulti) return;
    const code = newRoomCode();
    for (const guest of guests) {
      await createGameInvite(
        userData.user.id,
        guest.userId,
        code,
        pendingMulti.mode,
        pendingMulti.difficulty,
      );
    }
    const { mode, difficulty } = pendingMulti;
    setInviteSheetOpen(false);
    setPendingMulti(null);
    router.push(`/game/${code}?host=1&m=${mode}&d=${difficulty}`);
  }

  function handleQuickStartLobby() {
    if (!pendingMulti) return;
    const code = newRoomCode();
    const { mode, difficulty } = pendingMulti;
    setInviteSheetOpen(false);
    setPendingMulti(null);
    router.push(`/game/${code}?host=1&m=${mode}&d=${difficulty}`);
  }

  const isRefreshing = ptrState === "refreshing";
  // Bone is pinned — only opacity changes. Sheet moves to reveal/cover it.
  const boneOpacity = Math.min(1, progress * 1.4);
  const sheetPullOffset = Math.min(pull, 72);

  return (
    <div
      ref={containerRef}
      className="relative flex min-h-0 flex-1 flex-col overflow-hidden bg-[var(--accent)]"
    >
      {/* Bone pinned in dog-saddle zone (below title, above white card).
          IMPORTANT: animation transform and position transform must live on
          separate elements — CSS animations override inline style.transform,
          so combining them would snap the bone to the container origin. */}
      <div
        className="pointer-events-none absolute inset-x-0 z-[15] flex justify-center"
        style={{
          /* Center the 32 px bone in the dog-saddle zone (3.25 rem tall) that
             sits between the header bottom and the white card top.
             Bone top = PLAY_HEADER_HEIGHT + (3.25rem - 2rem) / 2 ≈ header + 0.625rem */
          top: `calc(${PLAY_HEADER_HEIGHT} + 0.625rem)`,
          opacity: boneOpacity,
          transition: snapping ? "opacity 0.4s ease" : "none",
        }}
      >
        {/* Animation on inner element so rotate() doesn't fight with top positioning */}
        <div className={pull > 0 || isRefreshing ? "animate-bone-spin" : ""}>
          <BoneIcon size={32} />
        </div>
      </div>

      {/* Pinned title — lower z so the sheet can slide over it when scrolling */}
      <header
        className="pointer-events-none absolute inset-x-0 top-0 z-10 bg-[var(--accent)] px-5"
        style={{
          paddingTop: "calc(env(safe-area-inset-top) + 1.25rem)",
          height: PLAY_HEADER_HEIGHT,
        }}
      >
        <PlayTabHeader />
      </header>

      <div
        ref={sheetRef}
        data-ptr-scroll
        className="relative z-20 min-h-0 flex-1 touch-pan-y overflow-y-auto overscroll-y-contain"
        style={{
          transform: `translateY(${sheetPullOffset}px)`,
          // Snap back smoothly; no transition while actively pulling
          transition: snapping
            ? "transform 0.5s cubic-bezier(0.32, 0.72, 0, 1)"
            : isRefreshing
              ? "none"
              : "transform 0.2s ease",
        }}
      >
        <div
          className="relative flex flex-col"
          style={{ ...sheetMotion, paddingTop: PLAY_HEADER_HEIGHT }}
        >
          {/* Dog saddle — sheet edge only; no negative margin into title zone */}
          <div className="relative h-[3.25rem] shrink-0">
            <div className="pointer-events-none absolute bottom-0 left-3 z-[60] translate-y-1/2 sm:left-5">
              {/* Hold space until profile is loaded so we never flash the default golden pup. */}
              {userData.loading || !userData.data ? (
                <span
                  className="block"
                  style={{ width: 128, height: 128 }}
                  aria-hidden
                />
              ) : (
                <button
                  type="button"
                  className="pointer-events-auto block rounded-full active:scale-[0.98]"
                  onClick={() => setGreetingReopenToken((n) => n + 1)}
                  aria-label="Show pup message"
                >
                  <DogAvatar
                    dogId={userData.data.profile.dogId}
                    username={userData.data.profile.username}
                    email={userData.user?.email}
                    userData={userData.data}
                    size={128}
                    bare
                  />
                </button>
              )}
              {!userData.loading && userData.user && userData.data && (
                <DogGreetingBubble
                  userId={userData.user.id}
                  reopenToken={greetingReopenToken}
                />
              )}
            </div>
          </div>

          <div className="relative">
            <div className="pointer-events-none absolute right-1.5 top-0 z-50 -translate-y-1/2 sm:right-3">
              <StreakBonePill
                streak={streak}
                bones={bones}
                className="pointer-events-auto"
              />
            </div>

            <div
              className="relative rounded-t-[28px] bg-white px-5 pb-4 pt-12 shadow-[0_-4px_24px_rgba(74,59,47,0.08)]"
              style={{ minHeight: PLAY_SHEET_MIN_HEIGHT }}
            >
              <ActiveSoloGames
                profile={data.profile}
                userEmail={userData.user?.email}
              />

              <DailySection onViewLeaderboard={onViewDailyLeaderboard} />

              <section className="mb-5">
                <h2 className={`${homeSectionTitleClass} mb-2.5`}>Play</h2>
                <div className="flex flex-col gap-2">
                  <PlayRow
                    icon={<PawIcon width={24} height={24} />}
                    title="Solo play"
                    subtitle="Pick difficulty when you start"
                    onClick={openSoloSetup}
                  />
                  <PlayRow
                    icon={<UsersIcon width={24} height={24} />}
                    title="Multiplayer"
                    subtitle="Friends, search, and invites"
                    onClick={openMultiSetup}
                  />
                </div>
              </section>

              <div className="mb-5">
                <FactGuessCard />
              </div>

              <GameHistoryList
                history={data.history}
                profile={data.profile}
                opponents={data.multi.opponents}
                userId={userData.user?.id ?? null}
                userEmail={userData.user?.email}
                authConfigured={userData.authConfigured}
              />
            </div>
          </div>
        </div>
      </div>

      <GameSetupSheet
        open={setupOpen}
        onClose={() => setSetupOpen(false)}
        kind={setupKind}
        onConfirm={handleSetupConfirm}
      />

      <StartGameSheet
        open={inviteSheetOpen}
        onClose={() => {
          setInviteSheetOpen(false);
          setPendingMulti(null);
        }}
        userData={userData}
        friends={friends}
        maxGuests={Math.max(1, (pendingMulti?.playerCount ?? 2) - 1)}
        onConfirmGuests={(guests) => void handleConfirmGuests(guests)}
        onQuickStart={handleQuickStartLobby}
        onSignIn={onSignIn}
      />
    </div>
  );
}
