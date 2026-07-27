"use client";

import { useOnline } from "@/lib/hooks/useOnline";

export function OfflineBanner() {
  const online = useOnline();
  if (online) return null;

  return (
    <div
      role="status"
      className="shrink-0 bg-[var(--foreground)] px-3 py-2 text-center text-[11px] font-semibold leading-snug text-white"
      style={{ paddingTop: "max(0.5rem, env(safe-area-inset-top))" }}
    >
      Playing offline — multiplayer and leaderboards need a connection.
    </div>
  );
}
