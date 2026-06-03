"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { DogAvatar } from "@/components/DogAvatar";
import { FriendListPanel, homeSectionTitleClass } from "@/components/home/FriendListPanel";
import {
  ACTIVE_SOLO_UPDATED_EVENT,
  type ActiveSoloSave,
  isActiveSolo,
  loadActiveSolos,
} from "@/lib/game/activeSolo";
import { loadUserData, STATS_UPDATED_EVENT } from "@/lib/stats/store";
import { formatGameClock } from "@/lib/game/format";
import { elapsedSeconds, type GameSnapshot } from "@/lib/game/store";
import { DIFFICULTY_LABELS } from "@/lib/game/types";
import type { Profile } from "@/lib/stats/types";
import { dogIdForUsername } from "@/lib/theme/dogs";

const SOLO_ACCENT = "#a06bd6";

function displayUsername(raw: string): string {
  const clean = raw.replace(/^@/, "").trim();
  return clean || "pup";
}

function SoloModeBadge() {
  return (
    <span
      className="shrink-0 rounded-full px-1.5 py-px text-[9px] font-bold uppercase tracking-wide text-white"
      style={{ backgroundColor: SOLO_ACCENT }}
    >
      Solo
    </span>
  );
}

function ActiveSoloRow({
  snapshot,
  profile,
  userEmail,
  divider,
  onOpen,
}: {
  snapshot: GameSnapshot;
  profile: Profile;
  userEmail?: string | null;
  divider: boolean;
  onOpen: () => void;
}) {
  const [now, setNow] = useState(() => Date.now());
  const meName = displayUsername(profile.username);
  const spent = elapsedSeconds(snapshot, now);
  const paused = snapshot.status === "paused";

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <button
      type="button"
      onClick={onOpen}
      className={`flex w-full items-center gap-2.5 px-3 py-2 text-left transition active:bg-white/50 ${
        divider ? "border-b border-white/70" : ""
      }`}
    >
      <DogAvatar
        dogId={dogIdForUsername(meName, profile.dogId, userEmail)}
        username={meName}
        email={userEmail}
        size={40}
        bare
      />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <span className="truncate text-sm font-bold text-[var(--foreground)]">
            @{meName}
          </span>
          <SoloModeBadge />
        </div>
        <span className="text-[10px] font-semibold text-[var(--muted)]">
          {paused ? "Paused" : "In progress"} · {DIFFICULTY_LABELS[snapshot.difficulty]}
        </span>
      </div>
      <span className="shrink-0 text-[10px] font-semibold leading-none text-[var(--muted)]">
        {formatGameClock(spent)}
      </span>
    </button>
  );
}

type Props = {
  profile: Profile;
  userEmail?: string | null;
};

export function ActiveSoloGames({ profile, userEmail }: Props) {
  const router = useRouter();
  const [actives, setActives] = useState<ActiveSoloSave[]>([]);

  useEffect(() => {
    let syncing = false;
    const refreshLocal = () => setActives(loadActiveSolos());
    const syncFromAccount = async () => {
      if (syncing) return;
      syncing = true;
      try {
        await loadUserData();
        refreshLocal();
      } finally {
        syncing = false;
      }
    };
    void syncFromAccount();
    const onVisible = () => {
      if (document.visibilityState === "visible") void syncFromAccount();
    };
    const onFocus = () => void syncFromAccount();
    window.addEventListener(ACTIVE_SOLO_UPDATED_EVENT, refreshLocal);
    window.addEventListener(STATS_UPDATED_EVENT, refreshLocal);
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.removeEventListener(ACTIVE_SOLO_UPDATED_EVENT, refreshLocal);
      window.removeEventListener(STATS_UPDATED_EVENT, refreshLocal);
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);

  const rows = actives.filter((item) => isActiveSolo(item.snapshot));
  if (rows.length === 0) return null;

  return (
    <section className="mb-5">
      <FriendListPanel title="Active games" titleClassName={homeSectionTitleClass}>
        {rows.map((item, index) => (
          <ActiveSoloRow
            key={item.id}
            snapshot={item.snapshot}
            profile={profile}
            userEmail={userEmail}
            divider={index < rows.length - 1}
            onOpen={() => router.push(`/play?resume=${encodeURIComponent(item.id)}`)}
          />
        ))}
      </FriendListPanel>
    </section>
  );
}
