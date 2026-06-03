"use client";

import { useEffect, useState } from "react";
import { isStandalonePwa } from "@/lib/pwa/standalone";

type Props = {
  context?: "reset-password" | "general";
};

export function PwaBrowserHint({ context = "general" }: Props) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    setShow(!isStandalonePwa());
  }, []);

  if (!show) return null;

  const copy =
    context === "reset-password"
      ? "iPhone opens email links in Safari or Chrome, not your Floof Sudoku home screen app. Set your new password here, then open Floof Sudoku from your home screen and sign in with your new password."
      : "You are in the browser, not the home screen app. Open Floof Sudoku from your home screen for the full app experience.";

  return (
    <div className="mb-4 rounded-2xl border border-[var(--border)] bg-[var(--primary-soft)] px-4 py-3 text-sm leading-snug text-[var(--foreground)]">
      {copy}
    </div>
  );
}
