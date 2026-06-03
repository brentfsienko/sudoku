"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ResetPasswordForm } from "@/components/auth/ResetPasswordForm";
import { PwaBrowserHint } from "@/components/pwa/PwaBrowserHint";
import { getSupabase } from "@/lib/supabase/client";
import { useUserData } from "@/lib/stats/useUserData";

export default function ResetPasswordPage() {
  const userData = useUserData();
  const [state, setState] = useState<"loading" | "ready" | "invalid">("loading");

  useEffect(() => {
    const sb = getSupabase();
    if (!sb) {
      setState("invalid");
      return;
    }

    let ready = false;

    const finish = () => {
      if (!ready) {
        ready = true;
        setState("ready");
        window.history.replaceState(null, "", "/auth/reset-password");
      }
    };

    const { data: sub } = sb.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY") {
        finish();
        return;
      }
      const hash = window.location.hash;
      if (
        session &&
        hash.includes("type=recovery") &&
        (event === "INITIAL_SESSION" || event === "SIGNED_IN")
      ) {
        finish();
      }
    });

    const hash = window.location.hash;
    if (hash.includes("access_token") || hash.includes("type=recovery")) {
      void sb.auth.getSession().then(({ data: { session } }) => {
        if (session) finish();
      });
    } else {
      void sb.auth.getSession().then(({ data: { session } }) => {
        if (session) finish();
        else if (!ready) setState("invalid");
      });
    }

    const timeout = setTimeout(() => {
      if (!ready) setState("invalid");
    }, 6000);

    return () => {
      clearTimeout(timeout);
      sub.subscription.unsubscribe();
    };
  }, []);

  return (
    <div
      className="mx-auto flex min-h-dvh w-full max-w-md flex-col bg-[var(--background)] px-5"
      style={{ paddingTop: "calc(env(safe-area-inset-top) + 2rem)" }}
    >
      <h1 className="font-serif-title mb-2 text-[2.75rem] leading-none text-[var(--foreground)]">
        New password
      </h1>
      <p className="mb-4 font-serif-title text-base text-[var(--foreground)]">
        Set a new password to finish resetting your account.
      </p>

      <PwaBrowserHint context="reset-password" />

      {state === "loading" && (
        <p className="text-sm text-[var(--muted)] animate-pulse">Loading…</p>
      )}
      {state === "ready" && <ResetPasswordForm userData={userData} />}
      {state === "invalid" && (
        <div className="flex flex-col gap-3 text-center">
          <p className="text-sm text-[var(--muted)]">
            This reset link is invalid or has expired. Request a new one from sign
            in.
          </p>
          <Link
            href="/"
            className="ui-button mx-auto rounded-full bg-[var(--foreground)] px-6 py-3 text-sm font-bold text-white"
          >
            Back to app
          </Link>
        </div>
      )}
    </div>
  );
}
