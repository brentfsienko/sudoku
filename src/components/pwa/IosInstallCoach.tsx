"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  ChevronDownIcon,
  InstallDesktopIcon,
  MoreHorizontalIcon,
  MoreVerticalIcon,
  PawIcon,
  PlusIcon,
  ShareIcon,
} from "@/components/icons";
import { isStandalonePwa } from "@/lib/pwa/standalone";
import {
  getInstallPlatform,
  hasInstallCoachCompleted,
  isIpad,
  persistInstallCoachSeen,
  type InstallPlatform,
} from "@/lib/pwa/iosInstall";

type Props = {
  /** Wait until splash / sign-in / other coachmarks are out of the way. */
  ready: boolean;
  /** Platforms this account already dismissed — each browser family shows once. */
  accountSeenPlatforms?: Partial<Record<InstallPlatform, boolean>>;
  /** Fired when the overlay is dismissed (or never shown). */
  onFinished?: () => void;
};

type PathStep = {
  icon: ReactNode;
  title: string;
  sub: string;
};

/** Survives React Strict Mode remount so the first paint isn't skipped. */
let shownThisLoad = false;

/**
 * One overlay: every Add-to-Home-Screen step stacked at once.
 * Safari and Chrome get different paths. Native chrome is pointed at,
 * but the whole sequence stays on screen — no auto-advance.
 */
export function IosInstallCoach({ ready, accountSeenPlatforms, onFinished }: Props) {
  const [open, setOpen] = useState(false);
  const [platform, setPlatform] = useState<InstallPlatform | null>(null);
  const [ipad, setIpad] = useState(false);
  const finishedRef = useRef(false);

  function finish() {
    if (finishedRef.current) return;
    finishedRef.current = true;
    onFinished?.();
  }

  useEffect(() => {
    if (!ready) return;
    if (isStandalonePwa()) {
      finish();
      return;
    }
    if (open) return;

    const p = getInstallPlatform();
    if (!p) {
      finish();
      return;
    }

    if (shownThisLoad) {
      setPlatform(p);
      setIpad(isIpad());
      setOpen(true);
      return;
    }

    if (accountSeenPlatforms?.[p] || hasInstallCoachCompleted(p)) {
      finish();
      return;
    }

    shownThisLoad = true;
    setPlatform(p);
    setIpad(isIpad());
    setOpen(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, accountSeenPlatforms, open]);

  function dismiss() {
    setOpen(false);
    shownThisLoad = false;
    void persistInstallCoachSeen(platform);
    finish();
  }

  if (!open || !platform) return null;

  const steps = pathSteps(platform, ipad);
  const desktop = platform === "desktop-chrome";
  const safariPhone = platform === "ios-safari" && !ipad;
  const topRight =
    platform === "ios-chrome" ||
    platform === "android-chrome" ||
    platform === "desktop-chrome" ||
    (platform === "ios-safari" && ipad);

  return (
    <div
      className="fixed inset-0 z-[120] flex flex-col"
      role="dialog"
      aria-modal="true"
      aria-labelledby="install-coach-title"
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/55"
        aria-label="Dismiss"
        onClick={dismiss}
      />

      {topRight && (
        <div className="pointer-events-none relative z-10 flex justify-end pr-3 pt-[max(0.4rem,env(safe-area-inset-top))]">
          <ChromeTarget platform={platform} />
        </div>
      )}

      <div className="relative z-10 mx-auto flex min-h-0 w-full max-w-sm flex-1 flex-col justify-center px-4 py-3">
        <div className="animate-float-in max-h-full overflow-y-auto rounded-3xl bg-white p-4 shadow-2xl">
          <div className="mb-2 flex items-center gap-2">
            <span className="text-[var(--primary)]">
              <PawIcon width={22} height={22} />
            </span>
            <h2
              id="install-coach-title"
              className="font-serif-title text-xl text-[var(--foreground)]"
            >
              {desktop ? "keep sudogku on your dock" : "keep sudogku in your pocket"}
            </h2>
          </div>
          <p className="mb-3 text-xs font-bold uppercase tracking-wide text-[var(--muted)]">
            {pathCaption(platform)} — do these in order
          </p>

          <ol className="flex flex-col">
            {steps.map((step, i) => (
              <li key={step.title} className="flex flex-col items-center">
                <div className="flex w-full items-center gap-3 rounded-2xl border-2 border-[var(--primary)] bg-[var(--primary-soft)] px-3 py-2.5">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--foreground)] text-xs font-bold text-white">
                    {i + 1}
                  </span>
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-[var(--foreground)] shadow-sm">
                    {step.icon}
                  </span>
                  <div className="min-w-0 text-left">
                    <p className="text-sm font-bold leading-tight text-[var(--foreground)]">
                      {step.title}
                    </p>
                    <p className="mt-0.5 text-[11px] font-medium leading-snug text-[var(--muted)]">
                      {step.sub}
                    </p>
                  </div>
                </div>
                {i < steps.length - 1 && (
                  <span className="flex h-5 items-center text-[var(--primary)]" aria-hidden>
                    <ChevronDownIcon width={18} height={18} />
                  </span>
                )}
              </li>
            ))}
          </ol>

          <button
            type="button"
            onClick={dismiss}
            className="ui-button mt-4 w-full rounded-full bg-[var(--foreground)] py-2.5 text-sm font-bold text-white active:scale-95"
          >
            got it 🐾
          </button>
        </div>
      </div>

      {safariPhone && (
        <div className="relative z-10 flex justify-end pr-3 pb-[max(0.25rem,env(safe-area-inset-bottom))]">
          <div className="animate-bounce">
            <ChromeTarget platform={platform} />
          </div>
        </div>
      )}
    </div>
  );
}

function ChromeTarget({ platform }: { platform: InstallPlatform }) {
  return (
    <div className="relative flex h-14 w-14 items-center justify-center">
      <span className="absolute inset-0 animate-ping rounded-full bg-[var(--primary)] opacity-40" />
      <span className="relative flex h-14 w-14 items-center justify-center rounded-full bg-white text-[var(--foreground)] shadow-lg">
        {pointIcon(platform)}
      </span>
    </div>
  );
}

function pathCaption(platform: InstallPlatform): string {
  switch (platform) {
    case "ios-safari":
      return "in Safari";
    case "ios-chrome":
    case "android-chrome":
    case "desktop-chrome":
      return "in Chrome";
  }
}

function pointIcon(platform: InstallPlatform): ReactNode {
  if (platform === "android-chrome") return <MoreVerticalIcon width={28} height={28} />;
  if (platform === "desktop-chrome") return <InstallDesktopIcon width={28} height={28} />;
  if (platform === "ios-safari") return <MoreHorizontalIcon width={28} height={28} />;
  return <ShareIcon width={28} height={28} />;
}

function pathSteps(platform: InstallPlatform, ipad: boolean): PathStep[] {
  const share = <ShareIcon width={20} height={20} />;
  const viewMore = <ChevronDownIcon width={20} height={20} />;
  const plus = <PlusIcon width={20} height={20} />;
  const moreH = <MoreHorizontalIcon width={20} height={20} />;
  const moreV = <MoreVerticalIcon width={20} height={20} />;
  const install = <InstallDesktopIcon width={20} height={20} />;

  switch (platform) {
    case "ios-safari":
      return [
        {
          icon: moreH,
          title: "tap •••",
          sub: ipad
            ? "three dots in Safari's toolbar, top-right"
            : "three dots in the bottom-right of Safari",
        },
        {
          icon: share,
          title: "tap Share",
          sub: "first row of the menu — square with the arrow pointing up",
        },
        {
          icon: viewMore,
          title: "tap View More",
          sub: "gray circle with the down arrow — far right of the bottom row",
        },
        {
          icon: plus,
          title: "Add to Home Screen",
          sub: "scroll the list, then tap Add in the top-right",
        },
      ];
    case "ios-chrome":
      return [
        {
          icon: share,
          title: "tap Share",
          sub: "square with the arrow, top-right of Chrome — not the ⋮ menu",
        },
        {
          icon: viewMore,
          title: "tap View More",
          sub: "gray circle with the down arrow — far right of the bottom row",
        },
        {
          icon: plus,
          title: "Add to Home Screen",
          sub: "scroll the list, then tap Add in the top-right",
        },
      ];
    case "android-chrome":
      return [
        {
          icon: moreV,
          title: "tap ⋮",
          sub: "three dots in the top-right of Chrome, next to the address bar",
        },
        {
          icon: plus,
          title: "Install app",
          sub: "or Add to Home screen — then tap Install",
        },
      ];
    case "desktop-chrome":
      return [
        {
          icon: install,
          title: "tap Install",
          sub: "computer icon on the right of the address bar — or the ⋮ menu",
        },
        {
          icon: plus,
          title: "confirm Install",
          sub: "sudogku opens in its own window from then on",
        },
      ];
  }
}
