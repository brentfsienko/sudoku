"use client";

import { useEffect, useState } from "react";
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

const ACCENT = "#7ec4cf";

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
    <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden bg-[var(--accent)]">
      {/* Accent fill behind notch / status bar */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 bg-[var(--accent)]"
        style={{ height: "env(safe-area-inset-top)" }}
      />

      {/* Fixed title — stays put when pulling down */}
      <header
        className="relative z-20 shrink-0 px-5 pb-3"
        style={{ paddingTop: "calc(env(safe-area-inset-top) + 0.75rem)" }}
      >
        <AppBrandTitle dogId={data.profile.dogId as DogId} light />
      </header>

      {/* Pills + white sheet move together */}
      <div
        ref={sheetRef}
        className="relative z-10 flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-y-contain"
        style={sheetMotion}
      >
        <div className="flex shrink-0 items-stretch gap-2.5 px-5 pb-2 pt-1">
          <div className="flex shrink-0 items-center gap-2 rounded-full bg-white py-2 pl-2 pr-3 shadow-md ring-1 ring-black/[0.04]">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--primary-soft)]">
              <span className="text-[var(--primary)]">
                <FlameIcon width={18} height={18} />
              </span>
            </div>
            <div className="leading-none">
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
            className="flex min-w-0 flex-1 items-center justify-between gap-2 rounded-[1.35rem] bg-[var(--foreground)] px-3 py-2.5 shadow-md transition active:scale-[0.98]"
          >
            <span className="font-display text-[15px] font-extrabold leading-tight text-white">
              Start game
            </span>
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white/20 text-white">
              <PlusIcon width={18} height={18} />
            </span>
          </button>
        </div>

        <div className="flex min-h-0 flex-1 flex-col rounded-t-[28px] bg-white px-5 pb-4 pt-6 shadow-[0_-4px_24px_rgba(74,59,47,0.08)]">
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
