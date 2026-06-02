"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { syncPublicProfile } from "@/lib/friends/api";
import { getSupabase, isSupabaseConfigured } from "@/lib/supabase/client";
import { loadLocal } from "./local";
import { loadUserData, saveUserData } from "./store";
import { emptyUserData, type Profile, type UserData } from "./types";

export type AuthUser = { id: string; email: string | null };

export type UseUserData = {
  data: UserData | null;
  user: AuthUser | null;
  loading: boolean;
  authConfigured: boolean;
  refresh: () => Promise<void>;
  updateProfile: (next: Partial<Profile>) => Promise<void>;
  reset: () => Promise<void>;
  signIn: (email: string) => Promise<{ ok: boolean; error?: string }>;
  signOut: () => Promise<void>;
};

export function useUserData(): UseUserData {
  const [data, setData] = useState<UserData | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const dataRef = useRef<UserData | null>(null);

  const setDataBoth = useCallback((next: UserData) => {
    dataRef.current = next;
    setData(next);
  }, []);

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
          if (active) setUser(authUser);
        }
        const d = await loadUserData();
        if (active) setDataBoth(d);
        if (authUser && active) void syncPublicProfile(authUser.id, d.profile);
      } catch (err) {
        console.warn("[stats] init failed, using local data:", err);
        if (active) setDataBoth(loadLocal());
      } finally {
        if (active) setLoading(false);
      }
    }

    void init();

    const sb = getSupabase();
    const sub = sb?.auth.onAuthStateChange(async (_event, session) => {
      const u = session?.user;
      if (!active) return;
      setUser(u ? { id: u.id, email: u.email ?? null } : null);
      try {
        const d = await loadUserData();
        if (active) setDataBoth(d);
        if (u && active) void syncPublicProfile(u.id, d.profile);
      } catch {
        if (active) setDataBoth(loadLocal());
      } finally {
        if (active) setLoading(false);
      }
    });

    const onVisible = () => {
      if (document.visibilityState === "visible") void refresh();
    };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      active = false;
      sub?.data.subscription.unsubscribe();
      document.removeEventListener("visibilitychange", onVisible);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const updateProfile = useCallback(
    async (next: Partial<Profile>) => {
      const current = dataRef.current ?? (await loadUserData());
      const merged: UserData = {
        ...current,
        profile: { ...current.profile, ...next },
      };
      setDataBoth(merged);
      await saveUserData(merged);
      const uid = (await getSupabase()?.auth.getSession())?.data.session?.user?.id;
      if (uid) void syncPublicProfile(uid, merged.profile);
    },
    [setDataBoth],
  );

  const reset = useCallback(async () => {
    const current = dataRef.current ?? (await loadUserData());
    const fresh = emptyUserData(current.profile);
    setDataBoth(fresh);
    await saveUserData(fresh);
  }, [setDataBoth]);

  const signIn = useCallback(async (email: string) => {
    const sb = getSupabase();
    if (!sb) return { ok: false, error: "Sign-in is not configured." };
    const clean = email.trim();
    if (!clean) return { ok: false, error: "Enter an email address." };
    const { error } = await sb.auth.signInWithOtp({
      email: clean,
      options: { emailRedirectTo: window.location.origin },
    });
    if (error) return { ok: false, error: error.message };
    return { ok: true };
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
    reset,
    signIn,
    signOut,
  };
}
