"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { ActiveSoloGames } from "@/components/home/ActiveSoloGames";
import { GameHistoryList } from "@/components/home/GameHistoryList";
import { PlayTabHeader } from "@/components/home/PlayTabHeader";
import {
  GameSetupSheet,
  type GameSetupResult,
} from "@/components/home/GameSetupSheet";
import { FactGuessCard } from "@/components/home/FactGuessCard";
import { homeSectionTitleClass } from "@/components/home/FriendListPanel";
import { StartGameSheet } from "@/components/home/StartGameSheet";
import { StreakBonePill } from "@/components/home/StreakBonePill";
import { PawIcon, UsersIcon } from "@/components/icons";
import { createGameInvite } from "@/lib/friends/api";
import type { PublicProfile } from "@/lib/friends/types";
import { useFriends } from "@/lib/friends/useFriends";
import { newRoomCode } from "@/lib/game/room";
import { displayDogId } from "@/lib/dogs/display";
import { usePullableSheet } from "@/lib/hooks/usePullableSheet";
import type { UseUserData } from "@/lib/stats/useUserData";
import type { UserData } from "@/lib/stats/types";
import { canUseBeePup } from "@/lib/theme/dogs";
const ACCENT = "#7ec4cf";

type Props = {
  data: UserData;
  userData: UseUserData;
  onSignIn: () => void;
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

export function MainTab({ data, userData, onSignIn }: Props) {
  const router = useRouter();
  const friends = useFriends(userData.user, data.profile);
  const { sheetRef, offset, pulling } = usePullableSheet();
  const [startSheetOpen, setStartSheetOpen] = useState(false);
  const [setupOpen, setSetupOpen] = useState(false);
  const [setupKind, setSetupKind] = useState<"solo" | "multiplayer">("solo");
  const [pickedOpponent, setPickedOpponent] = useState<PublicProfile | null>(null);

  const streak = data.solo.streak;
  const bones = data.bones ?? 0;
  const headerUsername =
    friends.myProfile?.username ?? data.profile.username;
  const honeyHeader = canUseBeePup({
    username: headerUsername,
    email: userData.user?.email,
  });
  const headerDogId = displayDogId(data.profile.dogId, {
    username: headerUsername,
    email: userData.user?.email,
    userData: data,
  });

  useEffect(() => {
    const prevHtml = document.documentElement.style.backgroundColor;
    const prevBody = document.body.style.backgroundColor;
    document.documentElement.style.backgroundColor = ACCENT;
    document.body.style.backgroundColor = ACCENT;
    return () => {
      document.documentElement.style.backgroundColor = prevHtml;
      document.body.style.backgroundColor = prevBody;
    };
  }, []);

  const sheetMotion = {
    transform: `translateY(${offset}px)`,
    transition: pulling ? "none" : "transform 0.28s cubic-bezier(0.32, 0.72, 0, 1)",
  };

  function openSoloSetup() {
    setPickedOpponent(null);
    setSetupKind("solo");
    setSetupOpen(true);
  }

  function openMultiSetup(opponent: PublicProfile) {
    setPickedOpponent(opponent);
    setSetupKind("multiplayer");
    setSetupOpen(true);
  }

  async function handleSetupConfirm(result: GameSetupResult) {
    setSetupOpen(false);

    if (result.kind === "solo") {
      router.push(`/play?d=${result.difficulty}`);
      return;
    }

    if (!userData.user) {
      onSignIn();
      return;
    }

    const code = newRoomCode();
    const opponent = pickedOpponent;
    if (opponent) {
      await createGameInvite(
        userData.user.id,
        opponent.userId,
        code,
        result.mode,
        result.difficulty,
      );
    }
    router.push(
      `/game/${code}?host=1&m=${result.mode}&d=${result.difficulty}`,
    );
  }

  return (
    <div className="relative flex min-h-0 flex-1 flex-col bg-[var(--accent)]">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 bg-[var(--accent)]"
        style={{ height: "env(safe-area-inset-top)" }}
      />

      <header className="relative z-20 shrink-0">
        <PlayTabHeader
          dogId={headerDogId}
          appIcon={!honeyHeader}
          profileIcon={honeyHeader}
        />
      </header>

      {/* Pull moves sheet + streak together; overflow visible so pill isn't clipped */}
      <div
        className="relative z-10 mt-[1.5dvh] flex min-h-0 flex-1 flex-col overflow-visible"
        style={sheetMotion}
      >
        <div className="relative flex min-h-0 flex-1 flex-col overflow-visible">
          <div
            ref={sheetRef}
            className="flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-y-contain rounded-t-[28px] bg-white px-5 pb-4 pt-6 shadow-[0_-4px_24px_rgba(74,59,47,0.08)]"
          >
          <ActiveSoloGames
            profile={data.profile}
            userEmail={userData.user?.email}
          />

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
                onClick={() => setStartSheetOpen(true)}
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

          <div className="pointer-events-none absolute right-3 top-0 z-40 -translate-y-1/2 sm:right-5">
            <StreakBonePill
              streak={streak}
              bones={bones}
              className="pointer-events-auto"
            />
          </div>
        </div>
      </div>

      <StartGameSheet
        open={startSheetOpen}
        onClose={() => setStartSheetOpen(false)}
        userData={userData}
        friends={friends}
        onPickOpponent={openMultiSetup}
        onSignIn={onSignIn}
      />

      <GameSetupSheet
        open={setupOpen}
        onClose={() => setSetupOpen(false)}
        kind={setupKind}
        opponentName={pickedOpponent?.username}
        onConfirm={(r) => void handleSetupConfirm(r)}
      />
    </div>
  );
}
