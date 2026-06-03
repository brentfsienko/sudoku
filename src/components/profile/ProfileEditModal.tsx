"use client";

import type { ReactNode } from "react";

type Props = {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
};

export function ProfileEditModal({ open, onClose, children }: Props) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="animate-float-in max-h-[min(90dvh,640px)] w-full max-w-md overflow-y-auto rounded-3xl bg-white p-5 shadow-xl"
        style={{ paddingBottom: "max(1.25rem, env(safe-area-inset-bottom))" }}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="profile-edit-title"
      >
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2
            id="profile-edit-title"
            className="font-serif-title text-2xl text-[var(--foreground)]"
          >
            Edit profile
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="ui-button shrink-0 rounded-full p-2 text-2xl leading-none text-[var(--muted)]"
            aria-label="Close"
          >
            ×
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
