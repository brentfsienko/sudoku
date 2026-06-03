"use client";

import { useEffect, useState } from "react";
import { PawIcon } from "@/components/icons";
import { markAuthIntroCompleted } from "@/lib/auth/onboarding";
import { passwordsMatch } from "@/lib/auth/password";
import type { UseUserData } from "@/lib/stats/useUserData";

type Mode = "signin" | "signup" | "forgot";

type Props = {
  open: boolean;
  userData: UseUserData;
  onClose: () => void;
};

export function SignInGate({ open, userData, onClose }: Props) {
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "sent" | "error">("idle");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  useEffect(() => {
    if (userData.user) {
      markAuthIntroCompleted();
      onClose();
    }
  }, [userData.user, onClose]);

  if (!open || !userData.authConfigured || userData.user) return null;

  async function submit() {
    setStatus("loading");
    setError(null);
    setInfo(null);

    if (mode === "forgot") {
      const res = await userData.resetPassword(email);
      if (res.ok) {
        setStatus("sent");
        setInfo("Check your email for a link to set a new password.");
      } else {
        setStatus("error");
        setError(res.error ?? "Something went wrong.");
      }
      return;
    }

    if (mode === "signup") {
      const check = passwordsMatch(password, confirmPassword);
      if (!check.ok) {
        setStatus("error");
        setError(check.error);
        return;
      }
      const res = await userData.signUp(email, password);
      if (!res.ok) {
        setStatus("error");
        setError(res.error ?? "Could not create account.");
        return;
      }
      if (res.needsConfirmation) {
        setInfo("Account created. Check your email to confirm, then sign in.");
        setMode("signin");
        setPassword("");
        setConfirmPassword("");
        setStatus("idle");
        return;
      }
      markAuthIntroCompleted();
      onClose();
      return;
    }

    const res = await userData.signInWithPassword(email, password);
    if (res.ok) {
      markAuthIntroCompleted();
      onClose();
    } else {
      setStatus("error");
      setError(res.error ?? "Sign in failed.");
    }
  }

  function continueOnDevice() {
    markAuthIntroCompleted();
    onClose();
  }

  function switchMode(next: Mode) {
    setMode(next);
    setError(null);
    setInfo(null);
    setPassword("");
    setConfirmPassword("");
    setStatus("idle");
  }

  const title =
    mode === "signup"
      ? "Create account"
      : mode === "forgot"
        ? "Reset password"
        : "Sign in";

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
            className="font-serif-title text-xl text-[var(--foreground)]"
          >
            {title}
          </h2>
        </div>

        {info ? (
          <p className="mb-3 text-sm text-[var(--muted)]">{info}</p>
        ) : (
          <p className="mb-3 font-serif-title text-sm text-[var(--foreground)]">
            {mode === "forgot"
              ? "Enter your email and we'll send a reset link."
              : "Sign in with email and password to sync stats and play with friends."}
          </p>
        )}

        <div className="flex flex-col gap-2.5">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            autoComplete="email"
            className="ui-input w-full rounded-2xl border-2 border-[var(--border)] bg-[var(--background)] px-4 py-2.5 text-sm outline-none focus:border-[var(--foreground)]"
          />
          {mode !== "forgot" && (
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              autoComplete={mode === "signup" ? "new-password" : "current-password"}
              className="ui-input w-full rounded-2xl border-2 border-[var(--border)] bg-[var(--background)] px-4 py-2.5 text-sm outline-none focus:border-[var(--foreground)]"
            />
          )}
          {mode === "signup" && (
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm password"
              autoComplete="new-password"
              className="ui-input w-full rounded-2xl border-2 border-[var(--border)] bg-[var(--background)] px-4 py-2.5 text-sm outline-none focus:border-[var(--foreground)]"
            />
          )}
          <button
            type="button"
            onClick={submit}
            disabled={status === "loading"}
            className="ui-button rounded-full bg-[var(--foreground)] py-2.5 text-sm font-bold text-white active:scale-95 disabled:opacity-60"
          >
            {status === "loading"
              ? "…"
              : mode === "forgot"
                ? "Send reset link"
                : mode === "signup"
                  ? "Create account"
                  : "Sign in"}
          </button>
          {error && <p className="text-xs text-[#ef6f6c]">{error}</p>}

          <div className="flex flex-wrap justify-center gap-x-3 gap-y-1 text-xs font-semibold">
            {mode === "signin" && (
              <>
                <button
                  type="button"
                  onClick={() => switchMode("signup")}
                  className="text-[var(--primary)] underline underline-offset-2"
                >
                  Create account
                </button>
                <button
                  type="button"
                  onClick={() => switchMode("forgot")}
                  className="text-[var(--muted)] underline underline-offset-2"
                >
                  Forgot password?
                </button>
              </>
            )}
            {mode !== "signin" && (
              <button
                type="button"
                onClick={() => switchMode("signin")}
                className="text-[var(--primary)] underline underline-offset-2"
              >
                Back to sign in
              </button>
            )}
          </div>

          {mode === "signin" && (
            <button
              type="button"
              onClick={continueOnDevice}
              className="text-xs font-semibold text-[var(--muted)] underline underline-offset-2"
            >
              Continue on this device
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
