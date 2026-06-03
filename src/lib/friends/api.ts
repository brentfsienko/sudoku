"use client";

import { getSupabase } from "@/lib/supabase/client";
import type { Profile } from "@/lib/stats/types";
import type { Difficulty, GameMode } from "@/lib/game/types";
import type { Friend, FriendRequest, GameInvite, PublicProfile } from "./types";
import { resolveDogId } from "@/lib/theme/dogs";
import { normalizeUsername, validateUsername } from "./username";

type ProfileRow = {
  user_id: string;
  username: string;
  display_name: string;
  dog_id: string;
};

function mapProfile(row: ProfileRow): PublicProfile {
  return {
    userId: row.user_id,
    username: row.username,
    dogId: resolveDogId(row.dog_id, { username: row.username }),
  };
}

/** Ensures the signed-in user has a searchable public profile. */
export async function syncPublicProfile(
  userId: string,
  profile: Profile,
  preferredUsername?: string,
): Promise<{ ok: boolean; username?: string; error?: string }> {
  const sb = getSupabase();
  if (!sb) return { ok: false, error: "Not configured" };

  const { data: existing } = await sb
    .from("player_profiles")
    .select("username")
    .eq("user_id", userId)
    .maybeSingle();

  let username =
    preferredUsername?.toLowerCase().replace(/[^a-z0-9_]/g, "") ||
    existing?.username;

  const base = normalizeUsername(profile.username) || "pup";

  if (!username) {
    for (let i = 0; i < 8; i++) {
      const candidate = `${base}_${Math.floor(1000 + Math.random() * 9000)}`;
      const { data: taken } = await sb
        .from("player_profiles")
        .select("user_id")
        .ilike("username", candidate)
        .maybeSingle();
      if (!taken) {
        username = candidate;
        break;
      }
    }
    username ??= `pup_${Date.now().toString(36).slice(-6)}`;
  }

  const { error } = await sb.from("player_profiles").upsert(
    {
      user_id: userId,
      username,
      display_name: username,
      dog_id: profile.dogId,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" },
  );

  if (error) return { ok: false, error: error.message };
  return { ok: true, username };
}

export async function fetchMyPublicProfile(
  userId: string,
): Promise<PublicProfile | null> {
  const sb = getSupabase();
  if (!sb) return null;
  const { data } = await sb
    .from("player_profiles")
    .select("user_id, username, display_name, dog_id")
    .eq("user_id", userId)
    .maybeSingle();
  return data ? mapProfile(data as ProfileRow) : null;
}

export async function isUsernameAvailable(
  username: string,
  excludeUserId?: string,
): Promise<boolean> {
  const clean = normalizeUsername(username);
  const validation = validateUsername(clean);
  if (validation) return false;

  const sb = getSupabase();
  if (!sb) return false;

  let query = sb
    .from("player_profiles")
    .select("user_id")
    .ilike("username", clean);

  if (excludeUserId) {
    query = query.neq("user_id", excludeUserId);
  }

  const { data } = await query.maybeSingle();
  return !data;
}

export async function updateUsername(
  userId: string,
  username: string,
): Promise<{ ok: boolean; error?: string }> {
  const clean = normalizeUsername(username);
  const validation = validateUsername(clean);
  if (validation) return { ok: false, error: validation };

  const available = await isUsernameAvailable(clean, userId);
  if (!available) {
    return { ok: false, error: "Username already taken." };
  }

  const sb = getSupabase();
  if (!sb) return { ok: false, error: "Not configured" };
  const { error } = await sb
    .from("player_profiles")
    .update({
      username: clean,
      display_name: clean,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", userId);
  if (error) {
    if (error.code === "23505") return { ok: false, error: "Username already taken." };
    return { ok: false, error: error.message };
  }
  return { ok: true };
}

export async function searchProfiles(
  query: string,
  myUserId: string,
): Promise<PublicProfile[]> {
  const sb = getSupabase();
  if (!sb) return [];
  const q = query.trim().toLowerCase().replace(/[^a-z0-9_]/g, "");
  if (q.length < 2) return [];

  const { data } = await sb
    .from("player_profiles")
    .select("user_id, username, display_name, dog_id")
    .ilike("username", `%${q}%`)
    .neq("user_id", myUserId)
    .limit(12);

  return (data ?? []).map((r) => mapProfile(r as ProfileRow));
}

/** Exact @username lookup for rematch invites. */
export async function lookupProfileByUsername(
  username: string,
  excludeUserId?: string,
): Promise<PublicProfile | null> {
  const clean = normalizeUsername(username);
  if (!clean) return null;

  const sb = getSupabase();
  if (!sb) return null;

  let query = sb
    .from("player_profiles")
    .select("user_id, username, display_name, dog_id")
    .ilike("username", clean);

  if (excludeUserId) query = query.neq("user_id", excludeUserId);

  const { data } = await query.maybeSingle();
  return data ? mapProfile(data as ProfileRow) : null;
}

export async function sendFriendRequest(
  fromUserId: string,
  toUserId: string,
): Promise<{ ok: boolean; error?: string }> {
  const sb = getSupabase();
  if (!sb) return { ok: false, error: "Not configured" };

  const [{ data: sent }, { data: recv }] = await Promise.all([
    sb
      .from("friend_requests")
      .select("id, status")
      .eq("from_user_id", fromUserId)
      .eq("to_user_id", toUserId)
      .maybeSingle(),
    sb
      .from("friend_requests")
      .select("id, status")
      .eq("from_user_id", toUserId)
      .eq("to_user_id", fromUserId)
      .maybeSingle(),
  ]);
  const existing = sent ?? recv;

  if (existing?.status === "accepted") {
    return { ok: false, error: "Already friends." };
  }
  if (existing?.status === "pending") {
    return { ok: false, error: "Request already pending." };
  }
  if (existing?.status === "declined" && existing.id) {
    await sb.from("friend_requests").delete().eq("id", existing.id);
  }

  const { error } = await sb.from("friend_requests").insert({
    from_user_id: fromUserId,
    to_user_id: toUserId,
    status: "pending",
  });
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function respondFriendRequest(
  requestId: string,
  accept: boolean,
): Promise<{ ok: boolean; error?: string }> {
  const sb = getSupabase();
  if (!sb) return { ok: false, error: "Not configured" };
  const { error } = await sb
    .from("friend_requests")
    .update({ status: accept ? "accepted" : "declined" })
    .eq("id", requestId);
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function fetchFriends(userId: string): Promise<Friend[]> {
  const sb = getSupabase();
  if (!sb) return [];

  const { data: reqs } = await sb
    .from("friend_requests")
    .select("from_user_id, to_user_id")
    .eq("status", "accepted")
    .or(`from_user_id.eq.${userId},to_user_id.eq.${userId}`);

  const friendIds = new Set<string>();
  for (const r of reqs ?? []) {
    const other =
      r.from_user_id === userId ? r.to_user_id : r.from_user_id;
    friendIds.add(other);
  }
  if (friendIds.size === 0) return [];

  const { data: profiles } = await sb
    .from("player_profiles")
    .select("user_id, username, display_name, dog_id")
    .in("user_id", [...friendIds]);

  return (profiles ?? []).map((p) => mapProfile(p as ProfileRow));
}

export async function fetchIncomingRequests(
  userId: string,
): Promise<FriendRequest[]> {
  const sb = getSupabase();
  if (!sb) return [];

  const { data } = await sb
    .from("friend_requests")
    .select("id, from_user_id, to_user_id, status, created_at")
    .eq("to_user_id", userId)
    .eq("status", "pending")
    .order("created_at", { ascending: false });

  if (!data?.length) return [];

  const ids = data.map((r) => r.from_user_id);
  const { data: profiles } = await sb
    .from("player_profiles")
    .select("user_id, username, display_name, dog_id")
    .in("user_id", ids);

  const byId = new Map(
    (profiles ?? []).map((p) => [p.user_id, mapProfile(p as ProfileRow)]),
  );

  return data
    .map((r) => {
      const profile = byId.get(r.from_user_id);
      if (!profile) return null;
      return {
        id: r.id,
        fromUserId: r.from_user_id,
        toUserId: r.to_user_id,
        status: r.status as FriendRequest["status"],
        createdAt: r.created_at,
        profile,
      };
    })
    .filter(Boolean) as FriendRequest[];
}

export async function fetchPendingInvites(
  userId: string,
): Promise<GameInvite[]> {
  const sb = getSupabase();
  if (!sb) return [];

  const { data } = await sb
    .from("game_invites")
    .select("id, room_code, host_id, guest_id, mode, difficulty, status, created_at")
    .eq("guest_id", userId)
    .eq("status", "pending")
    .order("created_at", { ascending: false });

  if (!data?.length) return [];

  const hostIds = [...new Set(data.map((i) => i.host_id))];
  const { data: profiles } = await sb
    .from("player_profiles")
    .select("user_id, username, display_name, dog_id")
    .in("user_id", hostIds);

  const byId = new Map(
    (profiles ?? []).map((p) => [p.user_id, mapProfile(p as ProfileRow)]),
  );

  return data
    .map((i) => {
      const host = byId.get(i.host_id);
      if (!host) return null;
      return {
        id: i.id,
        roomCode: i.room_code,
        hostId: i.host_id,
        guestId: i.guest_id,
        mode: i.mode as GameInvite["mode"],
        difficulty: i.difficulty,
        status: i.status as GameInvite["status"],
        createdAt: i.created_at,
        host,
      };
    })
    .filter(Boolean) as GameInvite[];
}

export async function createGameInvite(
  hostId: string,
  guestId: string,
  roomCode: string,
  mode: GameMode,
  difficulty: Difficulty,
): Promise<{ ok: boolean; error?: string }> {
  const sb = getSupabase();
  if (!sb) return { ok: false, error: "Not configured" };
  if (mode === "single") return { ok: false, error: "Invalid mode" };

  const { error } = await sb.from("game_invites").insert({
    room_code: roomCode,
    host_id: hostId,
    guest_id: guestId,
    mode,
    difficulty,
    status: "pending",
  });
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function markInviteJoined(inviteId: string): Promise<void> {
  const sb = getSupabase();
  if (!sb) return;
  await sb.from("game_invites").update({ status: "joined" }).eq("id", inviteId);
}

/** Multiplayer win/loss totals for the Me tab bar. */
export function multiWinLoss(multi: {
  coopPlayed: number;
  coopSolved: number;
  compPlayed: number;
  compWon: number;
  compTied: number;
}) {
  const wins = multi.coopSolved + multi.compWon;
  const losses =
    multi.coopPlayed -
    multi.coopSolved +
    (multi.compPlayed - multi.compWon - multi.compTied);
  const played = multi.coopPlayed + multi.compPlayed;
  const winPct = played > 0 ? Math.round((wins / played) * 100) : 0;
  return { wins, losses: Math.max(0, losses), played, winPct };
}
