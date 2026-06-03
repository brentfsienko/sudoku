"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AppBrandTitle } from "@/components/AppBrandTitle";
import { GameHistoryList } from "@/components/home/GameHistoryList";
import {
  GameSetupSheet,
  type GameSetupResult,
} from "@/components/home/GameSetupSheet";
import { FactGuessCard } from "@/components/home/FactGuessCard";
import { StartGameSheet } from "@/components/home/StartGameSheet";
import { FlameIcon, PawIcon, PlusIcon } from "@/components/icons";
import { createGameInvite } from "@/lib/friends/api";
import type { PublicProfile } from "@/lib/friends/types";
import { useFriends } from "@/lib/friends/useFriends";
import { newRoomCode } from "@/lib/game/room";
import { usePullableSheet } from "@/lib/hooks/usePullableSheet";
import type { UseUserData } from "@/lib/stats/useUserData";
import type { UserData } from "@/lib/stats/types";
import type { DogId } from "@/lib/theme/dogs";

type Props = {
  data: UserData;
  userData: UseUserData;
  onSignIn: () => void;
};

export function MainTab({ data, userData, onSignIn }: Props) {
  const router = useRouter();
  const friends = useFriends(userData.user, data.profile);
  const { sheetRef, offset, pulling } = usePullableSheet();
  const [startSheetOpen, setStartSheetOpen] = useState(false);
  const [setupOpen, setSetupOpen] = useState(false);
  const [setupKind, setSetupKind] = useState<"solo" | "multiplayer">("solo");
  const [pickedOpponent, setPickedOpponent] = useState<PublicProfile | null>(null);

  const streak = data.solo.streak;

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
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-[var(--accent)]">
      {/* Blue fills behind notch via parent bg; content inset below safe area */}
      <header
        className="relative z-20 shrink-0 px-5 pb-12"
        style={{ paddingTop: "calc(env(safe-area-inset-top) + 0.75rem)" }}
      >
        <AppBrandTitle dogId={data.profile.dogId as DogId} light />
      </header>

      {/* Hero pills sit above the white sheet */}
      <div className="relative z-30 mx-5 -mt-8 mb-[-1.65rem] flex items-stretch gap-2.5">
        <div className="flex min-w-0 flex-1 items-center gap-2 rounded-full bg-white px-2.5 py-2 shadow-md ring-1 ring-black/[0.04]">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--primary-soft)]">
            <span className="text-[var(--primary)]">
              <FlameIcon width={18} height={18} />
            </span>
          </div>
          <div className="min-w-0 leading-none">
            <p className="text-[10px] font-bold uppercase tracking-wide text-[var(--muted)]">
              Streak
            </p>
            <p className="font-display text-lg font-extrabold text-[var(--foreground)]">
              {streak} {streak === 1 ? "day" : "days"}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setStartSheetOpen(true)}
          className="flex w-[6.5rem] shrink-0 flex-col justify-between rounded-[1.35rem] bg-[var(--foreground)] px-2.5 py-2.5 text-left shadow-md transition active:scale-[0.98]"
        >
          <span className="font-display text-[15px] font-extrabold leading-tight text-white">
            Start
            <br />
            game
          </span>
          <span className="self-end rounded-lg bg-white/15 p-0.5 text-white">
            <PlusIcon width={16} height={16} />
          </span>
        </button>
      </div>

      {/* White sheet — below hero pills in stacking order */}
      <div
        ref={sheetRef}
        className="relative z-10 flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-y-contain rounded-t-[28px] bg-white px-5 pb-4 pt-10 shadow-[0_-4px_24px_rgba(74,59,47,0.08)]"
        style={{
          transform: `translateY(${offset}px)`,
          transition: pulling ? "none" : "transform 0.28s cubic-bezier(0.32, 0.72, 0, 1)",
        }}
      >
        <section className="mb-5">
          <h2 className="font-serif-title mb-2 text-lg text-[var(--foreground)]">
            Play against the computer
          </h2>
          <button
            type="button"
            onClick={openSoloSetup}
            className="flex w-full items-center gap-3 rounded-2xl bg-[var(--list-panel)] px-4 py-3 text-left transition active:scale-[0.99]"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--primary-soft)] text-[var(--primary)]">
              <PawIcon width={20} height={20} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-display text-sm font-bold text-[var(--foreground)]">
                Solo practice
              </p>
              <p className="text-xs text-[var(--muted)]">
                Pick difficulty when you start
              </p>
            </div>
            <span className="shrink-0 rounded-full border border-[var(--border)] bg-white px-3 py-1 text-[11px] font-bold text-[var(--foreground)]">
              Start
            </span>
          </button>
        </section>

        <div className="mb-5">
          <FactGuessCard />
        </div>

        <GameHistoryList
          history={data.history}
          profile={data.profile}
          opponents={data.multi.opponents}
          userId={userData.user?.id ?? null}
          authConfigured={userData.authConfigured}
        />
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
