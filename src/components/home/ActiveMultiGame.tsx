"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { UsersIcon } from "@/components/icons";
import { FriendListPanel, homeSectionTitleClass } from "@/components/home/FriendListPanel";
import {
  loadActiveMulti,
  clearActiveMulti,
  ACTIVE_MULTI_UPDATED_EVENT,
  type ActiveMultiSave,
} from "@/lib/game/activeMulti";
import { DIFFICULTY_LABELS, GAME_MODE_LABELS } from "@/lib/game/types";

const MULTI_ACCENT = "#3b82f6";

export function ActiveMultiGame() {
  const router = useRouter();
  const [active, setActive] = useState<ActiveMultiSave | null>(() => loadActiveMulti());

  useEffect(() => {
    const refresh = () => setActive(loadActiveMulti());
    window.addEventListener(ACTIVE_MULTI_UPDATED_EVENT, refresh);
    window.addEventListener("focus", refresh);
    return () => {
      window.removeEventListener(ACTIVE_MULTI_UPDATED_EVENT, refresh);
      window.removeEventListener("focus", refresh);
    };
  }, []);

  if (!active) return null;

  function handleRejoin() {
    if (!active) return;
    router.push(`/game/${active.code}?m=${active.mode}&d=${active.difficulty}`);
  }

  function handleDismiss() {
    clearActiveMulti();
    setActive(null);
  }

  return (
    <section className="mb-5">
      <FriendListPanel title="Active games" titleClassName={homeSectionTitleClass}>
        <div className="flex w-full items-center gap-3 px-3 py-2.5">
          <span
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-white"
            style={{ backgroundColor: MULTI_ACCENT }}
          >
            <UsersIcon width={20} height={20} />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <span className="truncate text-sm font-bold text-[var(--foreground)]">
                Room {active.code}
              </span>
              <span
                className="shrink-0 rounded-full px-1.5 py-px text-[9px] font-bold uppercase tracking-wide text-white"
                style={{ backgroundColor: MULTI_ACCENT }}
              >
                {GAME_MODE_LABELS[active.mode]}
              </span>
            </div>
            <span className="text-[10px] font-semibold text-[var(--muted)]">
              {DIFFICULTY_LABELS[active.difficulty]} · In progress
            </span>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={handleRejoin}
              className="font-display rounded-full bg-[var(--primary)] px-3.5 py-1.5 text-xs font-extrabold text-white active:scale-95"
            >
              Rejoin
            </button>
            <button
              type="button"
              onClick={handleDismiss}
              aria-label="Dismiss"
              className="rounded-full px-2 py-1 text-xs font-semibold text-[var(--muted)] active:scale-95"
            >
              ✕
            </button>
          </div>
        </div>
      </FriendListPanel>
    </section>
  );
}
