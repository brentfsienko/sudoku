"use client";

import { useCallback, useEffect, useState } from "react";
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
} from "./api";
import type { Friend, FriendRequest, GameInvite, PublicProfile } from "./types";

export function useFriends(user: AuthUser | null, profile: Profile | null) {
  const [myProfile, setMyProfile] = useState<PublicProfile | null>(null);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [incoming, setIncoming] = useState<FriendRequest[]>([]);
  const [invites, setInvites] = useState<GameInvite[]>([]);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!user) {
      setMyProfile(null);
      setFriends([]);
      setIncoming([]);
      setInvites([]);
      return;
    }
    setLoading(true);
    try {
      if (profile) await syncPublicProfile(user.id, profile);
      const [me, f, inc, inv] = await Promise.all([
        fetchMyPublicProfile(user.id),
        fetchFriends(user.id),
        fetchIncomingRequests(user.id),
        fetchPendingInvites(user.id),
      ]);
      setMyProfile(me);
      setFriends(f);
      setIncoming(inc);
      setInvites(inv);
    } finally {
      setLoading(false);
    }
  }, [user, profile]);

  useEffect(() => {
    // Load friends when auth/profile changes (client-only).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void refresh();
  }, [refresh]);

  const search = useCallback(
    async (query: string) => {
      if (!user) return [];
      return searchProfiles(query, user.id);
    },
    [user],
  );

  const requestFriend = useCallback(
    async (toUserId: string) => {
      if (!user) return { ok: false, error: "Sign in first." };
      const res = await sendFriendRequest(user.id, toUserId);
      if (res.ok) await refresh();
      return res;
    },
    [user, refresh],
  );

  const respond = useCallback(
    async (requestId: string, accept: boolean) => {
      const res = await respondFriendRequest(requestId, accept);
      if (res.ok) await refresh();
      return res;
    },
    [refresh],
  );

  const setUsername = useCallback(
    async (username: string) => {
      if (!user) return { ok: false, error: "Sign in to set a username." };
      const res = await updateUsername(user.id, username);
      if (res.ok) await refresh();
      return res;
    },
    [user, refresh],
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
    setUsername,
  };
}
