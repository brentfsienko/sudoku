"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { AuthUser } from "@/lib/stats/useUserData";
import type { Profile } from "@/lib/stats/types";
import {
  fetchFriends,
  fetchIncomingRequests,
  fetchMyPublicProfile,
  fetchPendingInvites,
  respondFriendRequest,
  searchProfiles,
  sendFriendRequest,
  syncPublicProfile,
  updateUsername,
  deleteGameInvite,
} from "./api";
import type { Friend, FriendRequest, GameInvite, PublicProfile } from "./types";

function sameFriends(a: Friend[], b: Friend[]) {
  if (a.length !== b.length) return false;
  return a.every(
    (f, i) =>
      f.userId === b[i]?.userId &&
      f.username === b[i]?.username &&
      f.dogId === b[i]?.dogId,
  );
}

export function useFriends(user: AuthUser | null, profile: Profile | null) {
  const userId = user?.id ?? null;
  const [myProfile, setMyProfile] = useState<PublicProfile | null>(null);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [incoming, setIncoming] = useState<FriendRequest[]>([]);
  const [invites, setInvites] = useState<GameInvite[]>([]);
  const [loading, setLoading] = useState(() => !!userId);
  const loadedRef = useRef(false);

  const refresh = useCallback(async () => {
    if (!userId) {
      loadedRef.current = false;
      setMyProfile(null);
      setFriends([]);
      setIncoming([]);
      setInvites([]);
      setLoading(false);
      return;
    }
    if (!loadedRef.current) setLoading(true);
    try {
      const [me, f, inc, inv] = await Promise.all([
        fetchMyPublicProfile(userId),
        fetchFriends(userId),
        fetchIncomingRequests(userId),
        fetchPendingInvites(userId),
      ]);
      setMyProfile(me);
      setFriends((prev) => (sameFriends(prev, f) ? prev : f));
      setIncoming(inc);
      setInvites(inv);
      loadedRef.current = true;
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    if (!userId || !profile) return;
    void syncPublicProfile(userId, profile);
    // Sync when the public fields change, not when userData is rebuilt.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, profile?.username, profile?.dogId]);

  const search = useCallback(
    async (query: string) => {
      if (!userId) return [];
      return searchProfiles(query, userId);
    },
    [userId],
  );

  const requestFriend = useCallback(
    async (toUserId: string) => {
      if (!userId) return { ok: false, error: "Sign in first." };
      const res = await sendFriendRequest(userId, toUserId);
      if (res.ok) await refresh();
      return res;
    },
    [userId, refresh],
  );

  const respond = useCallback(
    async (requestId: string, accept: boolean) => {
      const res = await respondFriendRequest(requestId, accept);
      if (res.ok) await refresh();
      return res;
    },
    [refresh],
  );

  const dismissInvite = useCallback(
    async (inviteId: string) => {
      const res = await deleteGameInvite(inviteId);
      if (res.ok) await refresh();
      return res;
    },
    [refresh],
  );

  const setUsername = useCallback(
    async (username: string) => {
      if (!userId) return { ok: false, error: "Sign in to set a username." };
      const res = await updateUsername(userId, username);
      if (res.ok) await refresh();
      return res;
    },
    [userId, refresh],
  );

  return {
    myProfile,
    friends,
    incoming,
    invites,
    loading,
    refresh,
    search,
    requestFriend,
    respond,
    dismissInvite,
    setUsername,
  };
}

export type UseFriends = ReturnType<typeof useFriends>;
