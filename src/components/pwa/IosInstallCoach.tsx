"use client";

import { useEffect, useState, type ReactNode } from "react";
import {
  InstallDesktopIcon,
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
  type InstallPlatform,
} from "@/lib/pwa/iosInstall";

type Step = 0 | 1 | 2;

type Props = {
  /** Wait until splash / sign-in / other coachmarks are out of the way. */
  ready: boolean;
};

/**
 * One-time 3-step coach for installing Sudogku as an app.
 * Browser chrome lives outside the page — arrows point at it.
 */
export function IosInstallCoach({ ready }: Props) {
  const [step, setStep] = useState<Step | null>(null);
  const [platform, setPlatform] = useState<InstallPlatform | null>(null);
  const [ipad, setIpad] = useState(false);

  useEffect(() => {
    if (!ready) return;
    if (isStandalonePwa() || hasInstallCoachCompleted()) return;
    const p = getInstallPlatform();
    if (!p) return;
    setPlatform(p);
    setIpad(isIpad());
    setStep(0);
  }, [ready]);

  function finish() {
    markInstallCoachCompleted();
    setStep(null);
  }

  function next() {
    if (step === null) return;
    if (step >= 2) {
      finish();
      return;
    }
    setStep((s) => ((s ?? 0) + 1) as Step);
  }

  if (step === null || !platform) return null;

  return (
    <div
      className="fixed inset-0 z-[55] flex flex-col"
      role="dialog"
      aria-modal="true"
      aria-labelledby="install-coach-title"
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/45"
        aria-label="Dismiss"
        onClick={finish}
      />

      {step === 0 && <IntroCard platform={platform} onNext={next} onSkip={finish} />}
      {step === 1 && (
        <ChromePointStep
          platform={platform}
          ipad={ipad}
          onNext={next}
          onSkip={finish}
        />
      )}
      {step === 2 && (
        <AddStep platform={platform} onDone={finish} onSkip={finish} />
      )}
    </div>
  );
}

function browserName(platform: InstallPlatform): string {
  if (platform === "ios-safari") return "Safari";
  return "Chrome";
}

function IntroCard({
  platform,
  onNext,
  onSkip,
}: {
  platform: InstallPlatform;
  onNext: () => void;
  onSkip: () => void;
}) {
  const desktop = platform === "desktop-chrome";
  return (
    <div className="animate-float-in relative z-10 mx-auto mt-auto mb-24 w-full max-w-sm px-4">
      <div className="rounded-3xl bg-white p-5 shadow-lg">
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
            ? "install it from Chrome — one click, its own window, feels like a real app."
            : "add it to your home screen — one tap, full screen, feels like a real app."}{" "}
          takes about 10 seconds.
        </p>
        <button
          type="button"
          onClick={onNext}
          className="ui-button w-full rounded-full bg-[var(--foreground)] py-2.5 text-sm font-bold text-white active:scale-95"
        >
          show me how
        </button>
        <button
          type="button"
          onClick={onSkip}
          className="mt-2 w-full py-2 text-xs font-semibold text-[var(--muted)]"
        >
          not now
        </button>
      </div>
    </div>
  );
}

function ChromePointStep({
  platform,
  ipad,
  onNext,
  onSkip,
}: {
  platform: InstallPlatform;
  ipad: boolean;
  onNext: () => void;
  onSkip: () => void;
}) {
  const chromeTopRight =
    platform === "android-chrome" || platform === "desktop-chrome";
  const iosTop = platform.startsWith("ios") && ipad;

  const copy = pointCopy(platform, ipad);

  const bubble = (
    <div className="relative rounded-2xl bg-[var(--foreground)] px-4 py-3 text-center text-white shadow-xl">
      <p className="text-sm font-semibold">{copy.title}</p>
      <p className="mt-1 text-[11px] font-medium text-white/70">{copy.sub}</p>
      <span
        className={`absolute border-8 border-transparent ${
          chromeTopRight
            ? "bottom-full right-4 border-b-[var(--foreground)]"
            : iosTop
              ? "left-1/2 bottom-full -translate-x-1/2 border-b-[var(--foreground)]"
              : "left-1/2 top-full -translate-x-1/2 border-t-[var(--foreground)]"
        }`}
      />
    </div>
  );

  const target = (
    <div className="relative flex h-14 w-14 items-center justify-center">
      <span className="absolute inset-0 animate-ping rounded-full bg-[var(--primary)] opacity-40" />
      <span className="relative flex h-14 w-14 items-center justify-center rounded-full bg-white text-[var(--foreground)] shadow-lg">
        {pointIcon(platform)}
      </span>
    </div>
  );

  const nav = (
    <div className="flex w-full gap-2">
      <button
        type="button"
        onClick={onSkip}
        className="flex-1 rounded-full py-2.5 text-xs font-semibold text-white/80"
      >
        skip
      </button>
      <button
        type="button"
        onClick={onNext}
        className="flex-1 rounded-full bg-white py-2.5 text-sm font-bold text-[var(--foreground)] active:scale-95"
      >
        next →
      </button>
    </div>
  );

  if (chromeTopRight) {
    return (
      <div className="relative z-10 flex min-h-0 flex-1 flex-col">
        <div className="flex w-full justify-end pr-3 pt-[max(0.5rem,env(safe-area-inset-top))]">
          {target}
        </div>
        <div className="mt-3 flex w-full max-w-sm flex-col items-end gap-3 self-end px-4">
          {bubble}
          {nav}
        </div>
      </div>
    );
  }

  if (iosTop) {
    return (
      <div className="animate-float-in relative z-10 mx-auto mt-[max(0.75rem,env(safe-area-inset-top))] flex w-full max-w-sm flex-col items-center gap-4 px-4">
        {target}
        {bubble}
        {nav}
      </div>
    );
  }

  return (
    <div className="relative z-10 flex min-h-0 flex-1 flex-col">
      <div className="mt-auto flex w-full max-w-sm flex-col items-center gap-3 self-center px-4 pb-2">
        {nav}
        {bubble}
      </div>
      <div className="mb-1 flex justify-center pb-[env(safe-area-inset-bottom)]">
        <div className="animate-bounce">{target}</div>
      </div>
    </div>
  );
}

function pointCopy(
  platform: InstallPlatform,
  ipad: boolean,
): { title: string; sub: string } {
  switch (platform) {
    case "android-chrome":
      return {
        title: "tap the ⋮ menu in the top-right of Chrome",
        sub: "three dots, next to the address bar",
      };
    case "desktop-chrome":
      return {
        title: "tap Install in Chrome's address bar",
        sub: "computer icon on the right — or the ⋮ menu",
      };
    case "ios-chrome":
      return {
        title: ipad
          ? "tap Share at the top of Chrome"
          : "tap Share at the bottom of Chrome",
        sub: "the square with the arrow pointing up",
      };
    default:
      return {
        title: ipad
          ? "tap Share at the top of Safari"
          : "tap Share at the bottom of Safari",
        sub: "the square with the arrow pointing up",
      };
  }
}

function pointIcon(platform: InstallPlatform): ReactNode {
  if (platform === "android-chrome") {
    return <MoreVerticalIcon width={28} height={28} />;
  }
  if (platform === "desktop-chrome") {
    return <InstallDesktopIcon width={28} height={28} />;
  }
  return <ShareIcon width={28} height={28} />;
}

function AddStep({
  platform,
  onDone,
  onSkip,
}: {
  platform: InstallPlatform;
  onDone: () => void;
  onSkip: () => void;
}) {
  const row = addRow(platform);
  return (
    <div className="animate-float-in relative z-10 mx-auto my-auto w-full max-w-sm px-4">
      <div className="rounded-3xl bg-white p-5 shadow-lg">
        <p className="mb-3 text-center text-xs font-bold uppercase tracking-wide text-[var(--muted)]">
          {row.caption}
        </p>
        <div className="mb-4 flex items-center gap-3 rounded-2xl border-2 border-[var(--primary)] bg-[var(--primary-soft)] px-3 py-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-white text-[var(--foreground)] shadow-sm">
            {row.icon}
          </span>
          <div className="min-w-0 text-left">
            <p className="text-sm font-bold text-[var(--foreground)]">{row.title}</p>
            {row.sub && (
              <p className="text-[11px] font-medium text-[var(--muted)]">{row.sub}</p>
            )}
          </div>
        </div>
        <p className="mb-4 text-center text-sm leading-snug text-[var(--foreground)]">
          {row.footer}
        </p>
        <button
          type="button"
          onClick={onDone}
          className="ui-button w-full rounded-full bg-[var(--foreground)] py-2.5 text-sm font-bold text-white active:scale-95"
        >
          got it 🐾
        </button>
        <button
          type="button"
          onClick={onSkip}
          className="mt-2 w-full py-2 text-xs font-semibold text-[var(--muted)]"
        >
          skip
        </button>
      </div>
    </div>
  );
}

function addRow(platform: InstallPlatform): {
  caption: string;
  title: string;
  sub?: string;
  footer: string;
  icon: ReactNode;
} {
  switch (platform) {
    case "android-chrome":
      return {
        caption: "in the Chrome menu",
        title: "Install app",
        sub: "or Add to Home screen — same idea",
        footer: "then tap Install. sudogku will land on your home screen like any other app.",
        icon: <PlusIcon width={20} height={20} />,
      };
    case "desktop-chrome":
      return {
        caption: `in the ${browserName(platform)} dialog`,
        title: "Install",
        sub: "or ⋮ → Cast, save, and share → Install Sudogku",
        footer: "confirm Install. sudogku opens in its own window from then on.",
        icon: <InstallDesktopIcon width={20} height={20} />,
      };
    default:
      return {
        caption: "in the share menu",
        title: "Add to Home Screen",
        sub: "scroll down if you don't see it",
        footer: "then tap Add in the top-right. sudogku will land on your home screen like any other app.",
        icon: <PlusIcon width={20} height={20} />,
      };
  }
}
