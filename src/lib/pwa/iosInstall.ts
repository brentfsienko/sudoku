"use client";

import { isStandalonePwa } from "@/lib/pwa/standalone";

const KEY_PREFIX = "sudogku-install-coach-v3";
/** Pre-platform key: same browser already dismissed the stacked overlay. */
const LEGACY_V3_KEY = "sudogku-install-coach-v3";

export type InstallPlatform =
  | "ios-safari"
  | "ios-chrome"
  | "android-chrome"
  | "desktop-chrome";

function storageKey(platform: InstallPlatform): string {
  return `${KEY_PREFIX}:${platform}`;
}

function ua(): string {
  return typeof window === "undefined" ? "" : window.navigator.userAgent;
}

export function isIosDevice(): boolean {
  if (typeof window === "undefined") return false;
  if (/iPhone|iPod|iPad/.test(ua())) return true;
  return window.navigator.platform === "MacIntel" && window.navigator.maxTouchPoints > 1;
}

export function isIpad(): boolean {
  if (typeof window === "undefined") return false;
  if (/iPad/.test(ua())) return true;
  return window.navigator.platform === "MacIntel" && window.navigator.maxTouchPoints > 1;
}

export function isAndroid(): boolean {
  return /Android/.test(ua());
}

/** Chrome or Chromium (not Edge / Opera / Samsung). Includes iOS Chrome. */
export function isChrome(): boolean {
  const s = ua();
  return /Chrome|CriOS|Chromium/.test(s) && !/Edg|OPR|SamsungBrowser/.test(s);
}

export function getInstallPlatform(): InstallPlatform | null {
  if (typeof window === "undefined") return null;
  if (isIosDevice()) {
    return /CriOS/.test(ua()) ? "ios-chrome" : "ios-safari";
  }
  if (!isChrome()) return null;
  // Desktop web: never prompt to download / install. Phones still get the coach.
  if (!isAndroid()) return null;
  return "android-chrome";
}

export function hasInstallCoachCompleted(
  platform?: InstallPlatform | null,
): boolean {
  if (typeof window === "undefined") return true;
  const p = platform ?? getInstallPlatform();
  if (!p) return true;
  try {
    return (
      window.localStorage.getItem(storageKey(p)) === "1" ||
      window.localStorage.getItem(LEGACY_V3_KEY) === "1"
    );
  } catch {
    return true;
  }
}

/** True when the add-to-home-screen overlay is about to show (or is showing). */
export function isInstallCoachPending(
  accountSeenPlatforms?: Partial<Record<InstallPlatform, boolean>>,
): boolean {
  if (typeof window === "undefined") return true;
  if (isStandalonePwa()) return false;
  const p = getInstallPlatform();
  if (!p) return false;
  return !accountSeenPlatforms?.[p] && !hasInstallCoachCompleted(p);
}

export function markInstallCoachCompleted(
  platform?: InstallPlatform | null,
): void {
  if (typeof window === "undefined") return;
  const p = platform ?? getInstallPlatform();
  if (!p) return;
  try {
    window.localStorage.setItem(storageKey(p), "1");
  } catch {
    // ignore quota / private mode
  }
}

/**
 * Persist "shown once" for this browser AND this platform on the account,
 * so another Safari skips it but Chrome still gets its own overlay.
 */
export async function persistInstallCoachSeen(
  platform?: InstallPlatform | null,
): Promise<void> {
  const p = platform ?? getInstallPlatform();
  if (!p) return;
  markInstallCoachCompleted(p);
  try {
    const { loadUserData, saveUserData } = await import("@/lib/stats/store");
    const data = await loadUserData();
    await saveUserData({
      ...data,
      installCoachSeenByPlatform: {
        ...data.installCoachSeenByPlatform,
        [p]: true,
      },
    });
  } catch {
    // localStorage is enough if cloud write fails
  }
}

/** @deprecated use hasInstallCoachCompleted */
export const hasIosInstallCoachCompleted = hasInstallCoachCompleted;
/** @deprecated use markInstallCoachCompleted */
export const markIosInstallCoachCompleted = markInstallCoachCompleted;
