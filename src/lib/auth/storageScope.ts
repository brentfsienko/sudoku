"use client";

/**
 * User-scoped localStorage keys.
 *
 * Signed-in keys are `${base}:${userId}` so two accounts on one browser
 * never share profile, stats, actives, or daily results. Guest/signed-out
 * uses the bare `base` key.
 *
 * The owner is persisted in `sudogku-storage-owner` so a reload can scope
 * keys before the async Supabase session hydrates.
 */

const OWNER_KEY = "sudogku-storage-owner";

function readPersistedOwner(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const v = window.localStorage.getItem(OWNER_KEY);
    return v && v.length > 0 ? v : null;
  } catch {
    return null;
  }
}

let _userId: string | null = readPersistedOwner();

export function setStorageScopeUserId(uid: string | null): void {
  _userId = uid;
  if (typeof window === "undefined") return;
  try {
    if (uid) window.localStorage.setItem(OWNER_KEY, uid);
    else window.localStorage.removeItem(OWNER_KEY);
  } catch {
    // ignore quota / private mode
  }
}

export function getStorageScopeUserId(): string | null {
  return _userId;
}

/** Returns the storage key scoped to the current user, or the bare key if anonymous. */
export function scopedKey(base: string): string {
  return _userId ? `${base}:${_userId}` : base;
}
