"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { GameHistoryList } from "@/components/home/GameHistoryList";
import {
  GameSetupSheet,
  type GameSetupResult,
} from "@/components/home/GameSetupSheet";
import { FactGuessCard } from "@/components/home/FactGuessCard";
import { StartGameSheet } from "@/components/home/StartGameSheet";
import { FlameIcon, PlusIcon } from "@/components/icons";
import { createGameInvite } from "@/lib/friends/api";
import type { PublicProfile } from "@/lib/friends/types";
import { useFriends } from "@/lib/friends/useFriends";
import { newRoomCode } from "@/lib/game/room";
import type { UseUserData } from "@/lib/stats/useUserData";
import type { UserData } from "@/lib/stats/types";

type Props = {
  data: UserData;
  userData: UseUserData;
  onSignIn: () => void;
};

export function MainTab({ data, userData, onSignIn }: Props) {
  const router = useRouter();
  const friends = useFriends(userData.user, data.profile);
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
    <div className="flex min-h-0 flex-1 flex-col">
      {/* Colored header — title stays visible above the sheet */}
      <div
        className="shrink-0 px-5 pb-10"
        style={{
          paddingTop: "calc(env(safe-area-inset-top) + 0.75rem)",
          backgroundColor: "var(--accent)",
        }}
      >
        <h1 className="font-serif-title text-[2.5rem] leading-none text-white">
          Floof Sudoku
        </h1>

        <div className="mt-4 flex items-stretch gap-3">
          <div className="flex min-w-0 flex-1 items-center gap-3 rounded-2xl border border-white/40 bg-white/95 px-3 py-2.5 shadow-sm">
            <div className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[var(--primary-soft)]">
              <span className="text-[var(--primary)]">
                <FlameIcon width={22} height={22} />
              </span>
            </div>
            <div className="min-w-0">
              <p className="font-serif-title text-sm leading-tight text-[var(--foreground)]">
                Day streak
              </p>
              <p className="font-display text-xl font-extrabold leading-none text-[var(--foreground)]">
                {streak} {streak === 1 ? "day" : "days"}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setStartSheetOpen(true)}
            className="flex w-[7.25rem] shrink-0 flex-col justify-between rounded-2xl bg-[var(--foreground)] px-3 py-3 text-left shadow-md transition active:scale-[0.98]"
          >
            <span className="font-display text-base font-extrabold leading-tight text-white">
              Start
              <br />
              game
            </span>
            <span className="self-end rounded-md bg-white/15 p-1 text-white">
              <PlusIcon width={18} height={18} />
            </span>
          </button>
        </div>
      </div>

      {/* Pull-up content sheet */}
      <div className="-mt-6 flex min-h-0 flex-1 flex-col overflow-y-auto rounded-t-[28px] bg-white px-5 pb-4 pt-5 shadow-[0_-4px_24px_rgba(74,59,47,0.08)]">
        <section className="mb-5">
          <h2 className="font-serif-title mb-2 text-lg text-[var(--foreground)]">
            Play against the computer
          </h2>
          <button
            type="button"
            onClick={openSoloSetup}
            className="flex w-full items-center gap-3 rounded-2xl bg-[var(--list-panel)] px-4 py-3 text-left transition active:scale-[0.99]"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#5cc98b] text-lg text-white">
              🖥️
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
