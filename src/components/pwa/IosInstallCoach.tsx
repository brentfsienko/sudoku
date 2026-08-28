"use client";

import { useEffect, useState, type ReactNode } from "react";
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
  markInstallCoachCompleted,
  persistInstallCoachSeen,
  type InstallPlatform,
} from "@/lib/pwa/iosInstall";

type Props = {
  /** Wait until splash / sign-in / other coachmarks are out of the way. */
  ready: boolean;
  /** Synced from the signed-in account so this never repeats on another device. */
  accountSeen?: boolean;
};

type PathStep = {
  icon: ReactNode;
  title: string;
  sub: string;
};

/** Survives React Strict Mode remount so persisting "seen" doesn't skip the first paint. */
let shownThisLoad = false;

/**
 * One-time add-to-home-screen coach.
 * Native browser chrome can't be clicked from the page, so this is a single
 * overlay with the full path stacked — Chrome and Safari get different steps.
 */
export function IosInstallCoach({ ready, accountSeen = false }: Props) {
  const [open, setOpen] = useState(false);
  const [platform, setPlatform] = useState<InstallPlatform | null>(null);
  const [ipad, setIpad] = useState(false);

  useEffect(() => {
    if (!ready) return;
    if (isStandalonePwa()) return;
    if (open) return;

    const p = getInstallPlatform();
    if (!p) return;

    // Strict Mode remounts after persist — still show this visit.
    if (shownThisLoad) {
      setPlatform(p);
      setIpad(isIpad());
      setOpen(true);
      return;
    }

    if (accountSeen) {
      markInstallCoachCompleted();
      return;
    }
    if (hasInstallCoachCompleted()) {
      // Prior visit marked this browser; sync onto the account blob once.
      void persistInstallCoachSeen();
      return;
    }

    shownThisLoad = true;
    setPlatform(p);
    setIpad(isIpad());
    setOpen(true);
    void persistInstallCoachSeen();
  }, [ready, accountSeen, open]);

  function dismiss() {
    setOpen(false);
    shownThisLoad = false;
    void persistInstallCoachSeen();
  }

  if (!open || !platform) return null;

  const steps = pathSteps(platform, ipad);
  const desktop = platform === "desktop-chrome";

  return (
    <div
      className="fixed inset-0 z-[55] flex flex-col items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="install-coach-title"
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/45"
        aria-label="Dismiss"
        onClick={dismiss}
      />
      <div className="animate-float-in relative z-10 max-h-[min(90dvh,40rem)] w-full max-w-sm overflow-y-auto rounded-3xl bg-white p-5 shadow-lg">
        <div className="mb-3 flex items-center gap-2">
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
        <p className="mb-4 text-sm leading-snug text-[var(--foreground)]">
          {desktop
            ? "install it from Chrome — its own window, feels like a real app."
            : "add it to your home screen — one tap, full screen, feels like a real app."}
        </p>
        <p className="mb-3 text-xs font-bold uppercase tracking-wide text-[var(--muted)]">
          {pathCaption(platform)}
        </p>
        <ol className="mb-5">
          {steps.map((step, i) => (
            <li key={step.title} className="flex gap-3">
              <div className="flex w-11 shrink-0 flex-col items-center">
                <span className="relative flex h-11 w-11 items-center justify-center rounded-2xl border-2 border-[var(--primary)] bg-[var(--primary-soft)] text-[var(--foreground)]">
                  {step.icon}
                </span>
                {i < steps.length - 1 && (
                  <span
                    className="my-1 w-px flex-1 min-h-4 bg-[var(--primary)]/40"
                    aria-hidden
                  />
                )}
              </div>
              <div className={i < steps.length - 1 ? "pb-3" : "pb-0"}>
                <p className="pt-2.5 text-sm font-bold leading-snug text-[var(--foreground)]">
                  {i + 1}. {step.title}
                </p>
                <p className="mt-0.5 text-[11px] font-medium leading-snug text-[var(--muted)]">
                  {step.sub}
                </p>
              </div>
            </li>
          ))}
        </ol>
        <button
          type="button"
          onClick={dismiss}
          className="ui-button w-full rounded-full bg-[var(--foreground)] py-2.5 text-sm font-bold text-white active:scale-95"
        >
          got it 🐾
        </button>
      </div>
    </div>
  );
}

function pathCaption(platform: InstallPlatform): string {
  switch (platform) {
    case "ios-chrome":
      return "in Chrome";
    case "ios-safari":
      return "in Safari";
    case "android-chrome":
      return "in Chrome";
    case "desktop-chrome":
      return "in Chrome";
  }
}

function pathSteps(platform: InstallPlatform, ipad: boolean): PathStep[] {
  const share = <ShareIcon width={20} height={20} />;
  const viewMore = <ChevronDownIcon width={20} height={20} />;
  const plus = <PlusIcon width={20} height={20} />;
  const moreH = <MoreHorizontalIcon width={20} height={20} />;
  const moreV = <MoreVerticalIcon width={20} height={20} />;
  const install = <InstallDesktopIcon width={20} height={20} />;

  switch (platform) {
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
