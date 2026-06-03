"use client";

import type { ReactNode } from "react";

/** Wraps the app on mobile so the bottom nav anchors to real innerHeight, not dvh. */
export function MobileAppRoot({ children }: { children: ReactNode }) {
  return <div className="app-viewport-root">{children}</div>;
}
