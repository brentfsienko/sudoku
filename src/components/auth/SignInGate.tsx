"use client";

import { useEffect, useState } from "react";
import { PawIcon } from "@/components/icons";
import { markAuthIntroCompleted } from "@/lib/auth/onboarding";
import type { UseUserData } from "@/lib/stats/useUserData";

type Props = {
  open: boolean;
  userData: UseUserData;
  onClose: () => void;
};

export function SignInGate({ open, userData, onClose }: Props) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (userData.user) {
      markAuthIntroCompleted();
      onClose();
    }
  }, [userData.user, onClose]);

  if (!open || !userData.authConfigured || userData.user) return null;

  async function send() {
    setStatus("sending");
    setError(null);
    const res = await userData.signIn(email);
    if (res.ok) {
      setStatus("sent");
      markAuthIntroCompleted();
    } else {
      setStatus("error");
      setError(res.error ?? "Something went wrong.");
    }
  }

  function continueOnDevice() {
    markAuthIntroCompleted();
    onClose();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/35 p-4 sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="sign-in-gate-title"
    >
      <div className="animate-float-in w-full max-w-sm rounded-3xl bg-white p-5 shadow-lg">
        <div className="mb-3 flex items-center gap-2">
          <span className="text-[var(--primary)]">
            <PawIcon width={22} height={22} />
          </span>
          <h2
            id="sign-in-gate-title"
            className="font-display text-lg font-extrabold text-[var(--foreground)]"
          >
            Save stats across devices
          </h2>
        </div>

        {status === "sent" ? (
          <div className="flex flex-col gap-3">
            <p className="text-sm text-[var(--muted)]">
              Check your email for a magic link to finish signing in.
            </p>
            <button
              type="button"
              onClick={onClose}
              className="font-display rounded-full bg-[var(--primary)] py-2.5 text-sm font-extrabold text-white active:scale-95"
            >
              Got it
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-2.5">
            <p className="text-xs text-[var(--muted)]">
              Sign in once with email — your stats sync everywhere.
            </p>
            <div className="flex items-center gap-2">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@email.com"
                autoComplete="email"
                className="min-w-0 flex-1 rounded-full border-2 border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm outline-none focus:border-[var(--primary)]"
              />
              <button
                type="button"
                onClick={send}
                disabled={status === "sending"}
                className="font-display shrink-0 rounded-full bg-[var(--primary)] px-3.5 py-2 text-sm font-extrabold text-white active:scale-95 disabled:opacity-60"
              >
                {status === "sending" ? "…" : "Sign in"}
              </button>
            </div>
            {error && <p className="text-xs text-[#ef6f6c]">{error}</p>}
            <button
              type="button"
              onClick={continueOnDevice}
              className="text-xs font-semibold text-[var(--muted)] underline underline-offset-2"
            >
              Continue on this device
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
