"use client";

const KEY = "sudogku-install-coach-v3";

export type InstallPlatform =
  | "ios-safari"
  | "ios-chrome"
  | "android-chrome"
  | "desktop-chrome";

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
  return isAndroid() ? "android-chrome" : "desktop-chrome";
}

export function hasInstallCoachCompleted(): boolean {
  if (typeof window === "undefined") return true;
  try {
    return window.localStorage.getItem(KEY) === "1";
  } catch {
    return true;
  }
}

export function markInstallCoachCompleted(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, "1");
  } catch {
    // ignore quota / private mode
  }
}

/**
 * Persist "shown once" to this browser and to the signed-in account blob
 * so other devices skip the coach too.
 */
export async function persistInstallCoachSeen(): Promise<void> {
  markInstallCoachCompleted();
  try {
    const { loadUserData, saveUserData } = await import("@/lib/stats/store");
    const data = await loadUserData();
    await saveUserData({ ...data, installCoachPathSeen: true });
  } catch {
    // localStorage is enough if cloud write fails
  }
}

/** @deprecated use hasInstallCoachCompleted */
export const hasIosInstallCoachCompleted = hasInstallCoachCompleted;
/** @deprecated use markInstallCoachCompleted */
export const markIosInstallCoachCompleted = markInstallCoachCompleted;
