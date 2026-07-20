"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { fetchMyPublicProfile, syncPublicProfile } from "@/lib/friends/api";
import { resetPasswordRedirectUrl } from "@/lib/auth/password";
import { getSupabase, isSupabaseConfigured } from "@/lib/supabase/client";
import { loadLocal } from "./local";
import {
  loadUserData,
  saveUserData,
  seedRemoteIfMissing,
  STATS_UPDATED_EVENT,
} from "./store";
import { EXCLUSIVE_BONE_COSTS } from "@/lib/bones/config";
import { ownsExclusiveDog } from "@/lib/bones/ownership";
import type { ExclusiveDogId } from "@/lib/theme/dogs";
import { coerceProfile } from "./profile";
import { emptyUserData, type Profile, type UserData } from "./types";

/**
 * Adopt the canonical public @username onto local/cloud user_data.
 * Dog skin stays whatever mergeUserData already picked from user_data.
 */
async function reconcileProfileFromCloud(
  data: UserData,
  userId: string,
  email?: string | null,
): Promise<UserData> {
  const pub = await fetchMyPublicProfile(userId);
  if (!pub?.username) return data;

  const next = coerceProfile(
    {
      username: pub.username,
      dogId: data.profile.dogId,
    },
    data,
    email,
  );

  if (next.username === data.profile.username) return data;
  return { ...data, profile: next };
}

export type AuthUser = { id: string; email: string | null };

export type UseUserData = {
  data: UserData | null;
  user: AuthUser | null;
  loading: boolean;
  authConfigured: boolean;
  refresh: () => Promise<void>;
  updateProfile: (next: Partial<Profile>) => Promise<void>;
  purchaseExclusiveDog: (
    dogId: ExclusiveDogId,
  ) => Promise<{ ok: boolean; error?: string }>;
  reset: () => Promise<void>;
  signInWithPassword: (
    email: string,
    password: string,
  ) => Promise<{ ok: boolean; error?: string }>;
  signUp: (
    email: string,
    password: string,
  ) => Promise<{ ok: boolean; error?: string; needsConfirmation?: boolean }>;
  resetPassword: (email: string) => Promise<{ ok: boolean; error?: string }>;
  updatePassword: (password: string) => Promise<{ ok: boolean; error?: string }>;
  signOut: () => Promise<void>;
};

export function useUserData(): UseUserData {
  const [data, setData] = useState<UserData | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const dataRef = useRef<UserData | null>(null);
  const userRef = useRef<AuthUser | null>(null);

  const setDataBoth = useCallback((next: UserData) => {
    dataRef.current = next;
    setData(next);
  }, []);

  const withOwnerProfile = useCallback(
    (data: UserData, email?: string | null): UserData => ({
      ...data,
      profile: coerceProfile(data.profile, data, email ?? userRef.current?.email),
    }),
    [],
  );

  const refresh = useCallback(async () => {
    const d = await loadUserData();
    setDataBoth(d);
  }, [setDataBoth]);

  useEffect(() => {
    let active = true;

    async function init() {
      let authUser: { id: string; email: string | null } | null = null;
      try {
        const sb = getSupabase();
        if (sb) {
          const { data: sessionData } = await sb.auth.getSession();
          const u = sessionData.session?.user;
          authUser = u ? { id: u.id, email: u.email ?? null } : null;
          userRef.current = authUser;
          if (active) setUser(authUser);
        }
        let d = withOwnerProfile(await loadUserData(), authUser?.email);
        if (authUser) {
          d = withOwnerProfile(
            await reconcileProfileFromCloud(d, authUser.id, authUser.email),
            authUser.email,
          );
        }
        if (active) setDataBoth(d);
        if (authUser && active) void seedRemoteIfMissing();
        if (authUser && active) {
          // Push reconciled dog/username to the public profile so friends see
          // the same pup across devices — never the other way around first.
          const synced = await syncPublicProfile(authUser.id, d.profile);
          const next = {
            ...d,
            profile: {
              ...d.profile,
              username: synced.username ?? d.profile.username,
            },
          };
          if (active) setDataBoth(next);
          await saveUserData(next);
        }
      } catch (err) {
        console.warn("[stats] init failed, using local data:", err);
        if (active) setDataBoth(loadLocal());
      } finally {
        if (active) setLoading(false);
      }
    }

    void init();

    const sb = getSupabase();
    const sub = sb?.auth.onAuthStateChange((event, session) => {
      if (!active) return;
      const u = session?.user;
      const authUser = u ? { id: u.id, email: u.email ?? null } : null;
      userRef.current = authUser;
      setUser(authUser);

      // Never await heavy I/O in the auth listener — it can block updateUser().
      void (async () => {
        try {
          if (event === "SIGNED_OUT" || !u) {
            if (active) setDataBoth(loadLocal());
            return;
          }
          if (event === "PASSWORD_RECOVERY" || event === "USER_UPDATED") {
            return;
          }
          let d = withOwnerProfile(await loadUserData(), u.email ?? null);
          d = withOwnerProfile(
            await reconcileProfileFromCloud(d, u.id, u.email ?? null),
            u.email ?? null,
          );
          if (!active) return;
          setDataBoth(d);
          const synced = await syncPublicProfile(u.id, d.profile);
          const merged = {
            ...d,
            profile: {
              ...d.profile,
              username: synced.username ?? d.profile.username,
            },
          };
          if (active) setDataBoth(merged);
          void saveUserData(merged);
        } catch {
          if (active) setDataBoth(loadLocal());
        } finally {
          if (active) setLoading(false);
        }
      })();
    });

    const onVisible = () => {
      if (document.visibilityState === "visible") void refresh();
    };
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", onVisible);
    window.addEventListener("pageshow", onVisible);
    window.addEventListener(STATS_UPDATED_EVENT, onVisible);

    return () => {
      active = false;
      sub?.data.subscription.unsubscribe();
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", onVisible);
      window.removeEventListener("pageshow", onVisible);
      window.removeEventListener(STATS_UPDATED_EVENT, onVisible);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const updateProfile = useCallback(
    async (next: Partial<Profile>) => {
      const current = dataRef.current ?? (await loadUserData());
      let merged: UserData = {
        ...current,
        profile: coerceProfile(
          { ...current.profile, ...next },
          { ...current, profile: { ...current.profile, ...next } },
          userRef.current?.email,
        ),
        // Stamp so other devices take this customization on merge.
        profileUpdatedAt: Date.now(),
      };
      setDataBoth(merged);
      await saveUserData(merged);
      const uid = (await getSupabase()?.auth.getSession())?.data.session?.user?.id;
      if (uid) {
        const synced = await syncPublicProfile(uid, merged.profile);
        if (synced.username && synced.username !== merged.profile.username) {
          merged = {
            ...merged,
            profile: { ...merged.profile, username: synced.username },
          };
          setDataBoth(merged);
          await saveUserData(merged);
        }
      }
    },
    [setDataBoth],
  );

  const purchaseExclusiveDog = useCallback(
    async (dogId: ExclusiveDogId) => {
      const current = dataRef.current ?? (await loadUserData());
      const cost = EXCLUSIVE_BONE_COSTS[dogId];
      if ((current.bones ?? 0) < cost) {
        return { ok: false, error: "Need more bones." };
      }
      const owned = current.ownedExclusiveDogs ?? [];
      const alreadyOwned = ownsExclusiveDog(dogId, current);
      const nextOwned = alreadyOwned ? owned : [...owned, dogId];
      const nextBones = alreadyOwned ? current.bones : current.bones - cost;
      let merged: UserData = {
        ...current,
        bones: nextBones,
        bonesUpdatedAt: alreadyOwned ? current.bonesUpdatedAt : Date.now(),
        ownedExclusiveDogs: nextOwned,
        profile: coerceProfile(
          { ...current.profile, dogId },
          {
            ...current,
            bones: nextBones,
            ownedExclusiveDogs: nextOwned,
          },
          userRef.current?.email,
        ),
        profileUpdatedAt: Date.now(),
      };
      setDataBoth(merged);
      await saveUserData(merged);
      const uid = (await getSupabase()?.auth.getSession())?.data.session?.user
        ?.id;
      if (uid) {
        const synced = await syncPublicProfile(uid, merged.profile);
        if (synced.username && synced.username !== merged.profile.username) {
          merged = {
            ...merged,
            profile: { ...merged.profile, username: synced.username },
          };
          setDataBoth(merged);
          await saveUserData(merged);
        }
      }
      return { ok: true };
    },
    [setDataBoth],
  );

  const reset = useCallback(async () => {
    const current = dataRef.current ?? (await loadUserData());
    const fresh = emptyUserData(current.profile);
    setDataBoth(fresh);
    await saveUserData(fresh);
  }, [setDataBoth]);

  const signInWithPassword = useCallback(async (email: string, password: string) => {
    const sb = getSupabase();
    if (!sb) return { ok: false, error: "Sign-in is not configured." };
    const clean = email.trim();
    if (!clean) return { ok: false, error: "Enter your email." };
    if (!password) return { ok: false, error: "Enter your password." };
    const { error } = await sb.auth.signInWithPassword({ email: clean, password });
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  }, []);

  const signUp = useCallback(async (email: string, password: string) => {
    const sb = getSupabase();
    if (!sb) return { ok: false, error: "Sign-in is not configured." };
    const clean = email.trim();
    if (!clean) return { ok: false, error: "Enter your email." };
    if (password.length < 6) {
      return { ok: false, error: "Password must be at least 6 characters." };
    }
    const { data, error } = await sb.auth.signUp({ email: clean, password });
    if (error) return { ok: false, error: error.message };
    if (data.session) return { ok: true };
    return {
      ok: true,
      needsConfirmation: true,
    };
  }, []);

  const resetPassword = useCallback(async (email: string) => {
    const sb = getSupabase();
    if (!sb) return { ok: false, error: "Sign-in is not configured." };
    const clean = email.trim();
    if (!clean) return { ok: false, error: "Enter your email." };
    const { error } = await sb.auth.resetPasswordForEmail(clean, {
      redirectTo: resetPasswordRedirectUrl(),
    });
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  }, []);

  const updatePassword = useCallback(async (password: string) => {
    const { completePasswordReset } = await import("@/lib/auth/password");
    return completePasswordReset(password);
  }, []);

  const signOut = useCallback(async () => {
    const sb = getSupabase();
    if (sb) await sb.auth.signOut();
    setUser(null);
    await refresh();
  }, [refresh]);

  return {
    data,
    user,
    loading,
    authConfigured: isSupabaseConfigured,
    refresh,
    updateProfile,
    purchaseExclusiveDog,
    reset,
    signInWithPassword,
    signUp,
    resetPassword,
    updatePassword,
    signOut,
  };
}
