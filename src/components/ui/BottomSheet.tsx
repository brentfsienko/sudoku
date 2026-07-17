"use client";

import type { ReactNode } from "react";
import { createPortal } from "react-dom";

type Props = {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  tall?: boolean;
};

export function BottomSheet({ open, onClose, title, children, tall }: Props) {
  if (!open) return null;
  if (typeof document === "undefined") return null;

  return createPortal(
    <div
      data-modal-layer
      className="fixed inset-0 z-50 flex flex-col justify-end bg-black/40"
    >
      <button
        type="button"
        className="min-h-0 flex-1"
        aria-label="Close"
        onClick={onClose}
      />
      <div
        className={`flex w-full max-w-md flex-col overflow-hidden self-center rounded-t-[28px] bg-white shadow-xl ${
          tall ? "max-h-[92dvh]" : "max-h-[85dvh]"
        }`}
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <div className="flex shrink-0 items-center justify-between border-b border-[var(--border)] px-5 py-4">
          <h2 className="font-serif-title text-2xl text-[var(--foreground)]">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="ui-button rounded-full p-2 text-2xl leading-none text-[var(--muted)]"
            aria-label="Close"
          >
            ×
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain px-5 py-4">
          {children}
        </div>
      </div>
    </div>,
    document.body,
  );
}
