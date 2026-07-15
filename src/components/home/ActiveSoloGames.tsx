"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { DogAvatar } from "@/components/DogAvatar";
import { FriendListPanel, homeSectionTitleClass } from "@/components/home/FriendListPanel";
import {
  ACTIVE_SOLO_UPDATED_EVENT,
  type ActiveSoloSave,
  isActiveSolo,
  loadActiveSolos,
} from "@/lib/game/activeSolo";
import { claimSoloFinish } from "@/lib/game/finishedSolo";
import { deleteActiveSolo, loadUserData, STATS_UPDATED_EVENT } from "@/lib/stats/store";
import { formatGameClock } from "@/lib/game/format";
import { elapsedSeconds, type GameSnapshot } from "@/lib/game/store";
import { DIFFICULTY_LABELS } from "@/lib/game/types";
import type { Profile } from "@/lib/stats/types";
import { dogIdForUsername } from "@/lib/theme/dogs";

const SOLO_ACCENT = "#a06bd6";
const SWIPE_THRESHOLD = 60; // px to trigger quit confirm

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
  onQuit,
}: {
  snapshot: GameSnapshot;
  profile: Profile;
  userEmail?: string | null;
  divider: boolean;
  onOpen: () => void;
  onQuit: () => void;
}) {
  const [now, setNow] = useState(() => Date.now());
  const [swipeX, setSwipeX] = useState(0);
  const [swiping, setSwiping] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const startX = useRef(0);
  const startY = useRef(0);
  const isHorizontal = useRef<boolean | null>(null);

  const meName = displayUsername(profile.username);
  const spent = elapsedSeconds(snapshot, now);
  const paused = snapshot.status === "paused";

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  function onTouchStart(e: React.TouchEvent) {
    const t = e.touches[0];
    startX.current = t.clientX;
    startY.current = t.clientY;
    isHorizontal.current = null;
    setSwiping(true);
  }

  function onTouchMove(e: React.TouchEvent) {
    if (!swiping) return;
    const t = e.touches[0];
    const dx = t.clientX - startX.current;
    const dy = t.clientY - startY.current;

    if (isHorizontal.current === null) {
      if (Math.abs(dx) > 6 || Math.abs(dy) > 6) {
        isHorizontal.current = Math.abs(dx) > Math.abs(dy);
      }
    }

    if (!isHorizontal.current) return;
    e.preventDefault();
    const clamped = Math.max(-(SWIPE_THRESHOLD * 2), Math.min(0, dx));
    setSwipeX(clamped);
  }

  function onTouchEnd() {
    setSwiping(false);
    if (swipeX <= -SWIPE_THRESHOLD) {
      setConfirming(true);
    }
    setSwipeX(0);
    isHorizontal.current = null;
  }

  function resetSwipe() {
    setSwipeX(0);
    setConfirming(false);
  }

  if (confirming) {
    return (
      <div
        className={`flex w-full items-center justify-between gap-3 px-3 py-2 animate-slide-in-right ${
          divider ? "border-b border-white/70" : ""
        }`}
      >
        <span className="text-sm font-semibold text-[var(--foreground)]">
          Quit this game?
        </span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={resetSwipe}
            className="rounded-full border border-[var(--border)] bg-white px-3 py-1 text-xs font-bold text-[var(--muted)] active:scale-95"
          >
            Keep
          </button>
          <button
            type="button"
            onClick={onQuit}
            className="rounded-full bg-red-500 px-3 py-1 text-xs font-bold text-white active:scale-95"
          >
            Quit
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`relative overflow-hidden ${divider ? "border-b border-white/70" : ""}`}
    >
      {/* Sliding row — solid background so nothing bleeds through */}
      <button
        type="button"
        onClick={swipeX === 0 ? onOpen : resetSwipe}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        style={{
          transform: `translateX(${swipeX}px)`,
          transition: swiping ? "none" : "transform 0.22s ease",
        }}
        className="relative z-10 flex w-full items-center gap-2.5 bg-[var(--list-panel)] px-3 py-2 text-left active:bg-white/50"
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
    </div>
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

  function handleQuit(id: string) {
    // Mark as finished FIRST — this is the permanent, sync guard that prevents
    // the game from ever reappearing via parseList/replaceActiveSolosLocal,
    // even if a cloud-sync races to restore it from remote.
    claimSoloFinish(id);
    // Remove from UI immediately, then clean up cloud async
    setActives((prev) => prev.filter((a) => a.id !== id));
    void deleteActiveSolo(id);
  }

  // Exclude daily puzzle games — they have their own dedicated section
  const rows = actives.filter(
    (item) => isActiveSolo(item.snapshot) && !item.id.startsWith("daily-"),
  );
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
            onQuit={() => handleQuit(item.id)}
          />
        ))}
      </FriendListPanel>
    </section>
  );
}
