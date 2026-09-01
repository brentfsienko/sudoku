"use client";

import { PawIcon } from "@/components/icons";

type Props = {
  onAllow: () => void;
  onDismiss: () => void;
};

/**
 * One-time popup asking signed-in users to enable push notifications.
 */
export function PushPermissionPrompt({ onAllow, onDismiss }: Props) {
  return (
    <div
      className="fixed inset-0 z-[110] flex items-center justify-center bg-black/40 p-5 backdrop-blur-sm animate-float-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="push-prompt-title"
    >
      <div className="animate-pop w-full max-w-sm rounded-3xl bg-[var(--surface)] p-6 shadow-2xl">
        <div className="flex flex-col items-center gap-2 text-center">
          <span className="text-[var(--primary)]">
            <PawIcon width={36} height={36} />
          </span>
          <h2
            id="push-prompt-title"
            className="font-display text-xl font-extrabold text-[var(--foreground)]"
          >
            Enable notifications?
          </h2>
          <p className="text-sm text-[var(--muted)]">
            Get a ping when a friend invites you to play — even if Sudogku is closed.
          </p>
        </div>

        <div className="mt-6 flex flex-col gap-2">
          <button
            type="button"
            onClick={onAllow}
            className="font-display w-full rounded-full bg-[var(--primary)] py-3 text-base font-extrabold text-white shadow-sm active:scale-[0.98]"
          >
            Enable
          </button>
          <button
            type="button"
            onClick={onDismiss}
            className="font-display w-full rounded-full border-2 border-[var(--border)] bg-white py-3 text-base font-extrabold text-[var(--foreground)] active:scale-[0.98]"
          >
            Not now
          </button>
        </div>
      </div>
    </div>
  );
}
