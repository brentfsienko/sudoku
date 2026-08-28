"use client";

import { PawIcon } from "@/components/icons";

type Props = {
  onAllow: () => void;
  onDismiss: () => void;
};

/**
 * One-time prompt shown after a friend request or game invite arrives.
 * Sits above the bottom nav as a slim banner.
 */
export function PushPermissionPrompt({ onAllow, onDismiss }: Props) {
  return (
    <div className="fixed bottom-[calc(env(safe-area-inset-bottom)+3.5rem+0.75rem)] left-1/2 z-40 w-full max-w-sm -translate-x-1/2 px-3">
      <div className="flex items-center gap-3 rounded-2xl border border-[var(--border)] bg-[var(--background)] px-4 py-3 shadow-lg">
        <span className="shrink-0 text-[var(--primary)]">
          <PawIcon width={20} height={20} />
        </span>
        <p className="min-w-0 flex-1 text-xs font-semibold leading-snug text-[var(--foreground)]">
          get notified when friends invite you — even when sudogku is closed
        </p>
        <div className="flex shrink-0 flex-col gap-1">
          <button
            type="button"
            onClick={onAllow}
            className="rounded-full bg-[var(--primary)] px-3 py-1 text-xs font-bold text-white"
          >
            allow
          </button>
          <button
            type="button"
            onClick={onDismiss}
            className="text-center text-xs font-semibold text-[var(--muted)]"
          >
            not now
          </button>
        </div>
      </div>
    </div>
  );
}
