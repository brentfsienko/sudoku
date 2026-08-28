"use client";

const KEY = "sudogku-install-coach";
const LEGACY_IOS_KEY = "sudogku-ios-install-coach";

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
    return (
      window.localStorage.getItem(KEY) === "1" ||
      window.localStorage.getItem(LEGACY_IOS_KEY) === "1"
    );
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

/** @deprecated use hasInstallCoachCompleted */
export const hasIosInstallCoachCompleted = hasInstallCoachCompleted;
/** @deprecated use markInstallCoachCompleted */
export const markIosInstallCoachCompleted = markInstallCoachCompleted;
