import Link from "next/link";
import { AppFrame } from "@/components/layout/AppFrame";

export default function OfflinePage() {
  return (
    <AppFrame>
      <div className="flex flex-1 flex-col items-center justify-center gap-6 px-6 py-10 text-center">
        <p className="font-display text-2xl font-extrabold text-[var(--foreground)]">
          You&apos;re offline
        </p>
        <p className="max-w-xs text-sm text-[var(--muted)]">
          Solo and daily puzzles still work without a connection. Multiplayer and
          leaderboards need the internet.
        </p>
        <div className="flex w-full max-w-xs flex-col gap-3">
          <Link
            href="/play"
            className="font-display rounded-full bg-[var(--primary)] py-3.5 text-lg font-extrabold text-white shadow-md transition active:scale-[0.98]"
          >
            Play solo
          </Link>
          <Link
            href="/play/daily"
            className="font-display rounded-full bg-[var(--accent)] py-3.5 text-lg font-extrabold text-white shadow-md transition active:scale-[0.98]"
          >
            Daily puzzle
          </Link>
          <Link
            href="/"
            className="text-sm font-semibold text-[var(--muted)] underline-offset-2 hover:underline"
          >
            Back home
          </Link>
        </div>
      </div>
    </AppFrame>
  );
}
