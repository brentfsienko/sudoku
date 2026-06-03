"use client";

import { useState } from "react";
import { copyToClipboard } from "@/lib/clipboard";

type Props = {
  username: string;
  onClose: () => void;
};

export function FriendCodeModal({ username, onClose }: Props) {
  const handle = `@${username}`;
  const [status, setStatus] = useState<"idle" | "copied" | "failed">("idle");

  async function copy() {
    const ok = await copyToClipboard(handle);
    setStatus(ok ? "copied" : "failed");
    if (ok) {
      window.setTimeout(() => setStatus("idle"), 2000);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-6"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xs rounded-3xl bg-white p-6 text-center shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="font-serif-title mb-2 text-2xl text-[var(--foreground)]">
          Friend code
        </h3>
        <p className="mb-4 text-sm text-[var(--muted)]">
          Share this so friends can find you in search.
        </p>
        <button
          type="button"
          onClick={() => void copy()}
          className="font-display mb-1 w-full text-2xl text-[var(--foreground)] underline decoration-dotted underline-offset-4 active:opacity-70"
          title="Tap to copy"
        >
          {handle}
        </button>
        <p className="mb-4 text-[11px] text-[var(--muted)]">Tap the code or Copy below</p>
        <div className="flex flex-col gap-2">
          <button
            type="button"
            onClick={() => void copy()}
            className="ui-button w-full rounded-full bg-[var(--primary)] py-3 text-sm font-bold text-white active:scale-[0.98]"
          >
            {status === "copied" ? "Copied!" : status === "failed" ? "Copy failed — tap code" : "Copy"}
          </button>
          {status === "failed" && (
            <p className="text-xs text-[#ef6f6c]">
              Couldn&apos;t access clipboard. Long-press the code to copy manually.
            </p>
          )}
          <button
            type="button"
            onClick={onClose}
            className="py-2 text-sm font-semibold text-[var(--muted)]"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
