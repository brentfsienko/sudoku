"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { passwordsMatch } from "@/lib/auth/password";
import { isStandalonePwa } from "@/lib/pwa/standalone";
import type { UseUserData } from "@/lib/stats/useUserData";

type Props = {
  userData: UseUserData;
};

export function ResetPasswordForm({ userData }: Props) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [error, setError] = useState<string | null>(null);
  const inPwa = isStandalonePwa();

  async function submit() {
    const check = passwordsMatch(password, confirm);
    if (!check.ok) {
      setError(check.error);
      return;
    }
    setStatus("loading");
    setError(null);
    const res = await userData.updatePassword(password);
    if (res.ok) {
      setStatus("done");
      if (inPwa) {
        setTimeout(() => router.replace("/"), 800);
      }
    } else {
      setStatus("error");
      setError(res.error ?? "Could not update password.");
    }
  }

  if (status === "done") {
    if (inPwa) {
      return (
        <p className="font-serif-title text-center text-lg text-[var(--foreground)]">
          Password updated. Taking you home…
        </p>
      );
    }
    return (
      <div className="flex flex-col gap-4 text-center">
        <p className="font-serif-title text-lg text-[var(--foreground)]">
          Password updated
        </p>
        <p className="text-sm leading-relaxed text-[var(--muted)]">
          Open <span className="font-bold text-[var(--foreground)]">Floof Sudoku</span>{" "}
          from your home screen, tap Sign in, and use your email with the new password
          you just set.
        </p>
        <p className="text-xs text-[var(--muted)]">
          You can close this browser tab — your home screen app is separate on iPhone.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-center text-sm text-[var(--muted)]">
        Choose a new password for your account.
      </p>
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="New password"
        autoComplete="new-password"
        className="ui-input w-full rounded-2xl border-2 border-[var(--border)] bg-white px-4 py-3 text-sm outline-none focus:border-[var(--foreground)]"
      />
      <input
        type="password"
        value={confirm}
        onChange={(e) => setConfirm(e.target.value)}
        placeholder="Confirm new password"
        autoComplete="new-password"
        className="ui-input w-full rounded-2xl border-2 border-[var(--border)] bg-white px-4 py-3 text-sm outline-none focus:border-[var(--foreground)]"
      />
      <button
        type="button"
        onClick={submit}
        disabled={status === "loading"}
        className="ui-button w-full rounded-full bg-[var(--primary)] py-3.5 text-sm font-bold text-white active:scale-[0.98] disabled:opacity-60"
      >
        {status === "loading" ? "Saving…" : "Save new password"}
      </button>
      {error && <p className="text-center text-xs text-[#ef6f6c]">{error}</p>}
    </div>
  );
}
