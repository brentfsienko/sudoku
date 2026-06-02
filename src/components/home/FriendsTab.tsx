"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { DogAvatar } from "@/components/DogAvatar";
import { DifficultySelect } from "@/components/home/DifficultySelect";
import type { DogId } from "@/lib/theme/dogs";
import {
  DIFFICULTY_LABELS,
  GAME_MODE_LABELS,
  type Difficulty,
  type GameMode,
} from "@/lib/game/types";
import {
  createGameInvite,
  markInviteJoined,
} from "@/lib/friends/api";
import { useFriends } from "@/lib/friends/useFriends";
import type { UseUserData } from "@/lib/stats/useUserData";
import type { PublicProfile } from "@/lib/friends/types";

function newRoomCode(): string {
  const letters = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  let code = "";
  for (let i = 0; i < 4; i++) {
    code += letters[Math.floor(Math.random() * letters.length)];
  }
  return code;
}

type Props = {
  userData: UseUserData;
};

export function FriendsTab({ userData }: Props) {
  const router = useRouter();
  const profile = userData.data?.profile ?? null;
  const friends = useFriends(userData.user, profile);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<PublicProfile[]>([]);
  const [searching, setSearching] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [inviteFriend, setInviteFriend] = useState<PublicProfile | null>(null);
  const [inviteMode, setInviteMode] = useState<GameMode>("coop");
  const [inviteDiff, setInviteDiff] = useState<Difficulty>("medium");

  if (!userData.authConfigured) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 px-4 text-center">
        <p className="text-sm text-[var(--muted)]">
          Friends need Supabase to be configured on this deployment.
        </p>
      </div>
    );
  }

  if (!userData.user) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center">
        <h2 className="font-display text-xl font-extrabold text-[var(--foreground)]">
          Sign in to add friends
        </h2>
        <p className="text-sm text-[var(--muted)]">
          Sign in with email (from the prompt when you open the app, or Me →
          Sign in), then search, send requests, and invite pups to play.
        </p>
      </div>
    );
  }

  async function runSearch() {
    setSearching(true);
    setMsg(null);
    const hits = await friends.search(query);
    setResults(hits);
    setSearching(false);
    if (!hits.length && query.trim().length >= 2) {
      setMsg("No players found — try their @username.");
    }
  }

  async function addFriend(target: PublicProfile) {
    setMsg(null);
    const res = await friends.requestFriend(target.userId);
    setMsg(res.ok ? `Request sent to @${target.username}` : res.error ?? "Failed");
    if (res.ok) setResults([]);
  }

  async function sendInvite() {
    if (!inviteFriend || !userData.user) return;
    const mode = inviteMode === "competitive" ? "competitive" : "coop";
    const code = newRoomCode();
    const res = await createGameInvite(
      userData.user.id,
      inviteFriend.userId,
      code,
      mode,
      inviteDiff,
    );
    if (!res.ok) {
      setMsg(res.error ?? "Could not send invite");
      return;
    }
    setInviteFriend(null);
    setMsg(`Invite sent to ${inviteFriend.displayName}!`);
    router.push(`/game/${code}?host=1&m=${mode}&d=${inviteDiff}`);
  }

  const friendIds = new Set(friends.friends.map((f) => f.userId));

  return (
    <div className="flex flex-col gap-4">
      {friends.myProfile && (
        <p className="text-center text-xs text-[var(--muted)]">
          You&apos;re <span className="font-bold">@{friends.myProfile.username}</span>
        </p>
      )}

      {msg && (
        <p className="rounded-2xl bg-[var(--primary-soft)] px-3 py-2 text-center text-sm font-semibold text-[var(--foreground)]">
          {msg}
        </p>
      )}

      {/* Game invites */}
      {friends.invites.length > 0 && (
        <section className="flex flex-col gap-2">
          <h3 className="font-display text-sm font-extrabold text-[var(--foreground)]">
            Game invites
          </h3>
          {friends.invites.map((inv) => (
            <div
              key={inv.id}
              className="flex items-center gap-3 rounded-2xl bg-white p-3 shadow-sm"
            >
              <DogAvatar dogId={inv.host.dogId as DogId} size={44} />
              <div className="min-w-0 flex-1">
                <div className="font-display font-bold text-[var(--foreground)]">
                  {inv.host.displayName}
                </div>
                <div className="text-xs text-[var(--muted)]">
                  {GAME_MODE_LABELS[inv.mode]} · {DIFFICULTY_LABELS[inv.difficulty as Difficulty] ?? inv.difficulty} · {inv.roomCode}
                </div>
              </div>
              <button
                type="button"
                onClick={async () => {
                  await markInviteJoined(inv.id);
                  router.push(`/game/${inv.roomCode}?m=${inv.mode}&d=${inv.difficulty}`);
                }}
                className="font-display rounded-full bg-[var(--primary)] px-4 py-2 text-sm font-extrabold text-white active:scale-95"
              >
                Join
              </button>
            </div>
          ))}
        </section>
      )}

      {/* Incoming requests */}
      {friends.incoming.length > 0 && (
        <section className="flex flex-col gap-2">
          <h3 className="font-display text-sm font-extrabold text-[var(--foreground)]">
            Friend requests
          </h3>
          {friends.incoming.map((req) => (
            <div
              key={req.id}
              className="flex items-center gap-3 rounded-2xl bg-white p-3 shadow-sm"
            >
              <DogAvatar dogId={req.profile.dogId as DogId} size={44} />
              <div className="min-w-0 flex-1">
                <div className="font-display font-bold">{req.profile.displayName}</div>
                <div className="text-xs text-[var(--muted)]">@{req.profile.username}</div>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => void friends.respond(req.id, true)}
                  className="rounded-full bg-[var(--primary)] px-3 py-1.5 text-xs font-bold text-white"
                >
                  Accept
                </button>
                <button
                  type="button"
                  onClick={() => void friends.respond(req.id, false)}
                  className="rounded-full bg-[var(--surface-soft)] px-3 py-1.5 text-xs font-bold text-[var(--muted)]"
                >
                  Decline
                </button>
              </div>
            </div>
          ))}
        </section>
      )}

      {/* Search */}
      <section className="flex flex-col gap-2">
        <h3 className="font-display text-sm font-extrabold text-[var(--foreground)]">
          Find friends
        </h3>
        <div className="flex gap-2">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && void runSearch()}
            placeholder="Search @username or name"
            className="w-full rounded-full border-2 border-[var(--border)] bg-white px-4 py-2.5 text-sm outline-none focus:border-[var(--primary)]"
          />
          <button
            type="button"
            onClick={() => void runSearch()}
            disabled={searching}
            className="font-display shrink-0 rounded-full bg-[var(--accent)] px-4 py-2.5 text-sm font-extrabold text-white disabled:opacity-60"
          >
            {searching ? "…" : "Search"}
          </button>
        </div>
        {results.map((p) => (
          <div
            key={p.userId}
            className="flex items-center gap-3 rounded-2xl bg-[var(--surface-soft)] p-3"
          >
            <DogAvatar dogId={p.dogId as DogId} size={40} />
            <div className="min-w-0 flex-1">
              <div className="font-display font-bold">{p.displayName}</div>
              <div className="text-xs text-[var(--muted)]">@{p.username}</div>
            </div>
            {friendIds.has(p.userId) ? (
              <span className="text-xs font-bold text-[var(--muted)]">Friends</span>
            ) : (
              <button
                type="button"
                onClick={() => void addFriend(p)}
                className="rounded-full bg-[var(--primary)] px-3 py-1.5 text-xs font-bold text-white"
              >
                Add
              </button>
            )}
          </div>
        ))}
      </section>

      {/* Friends list */}
      <section className="flex flex-col gap-2">
        <h3 className="font-display text-sm font-extrabold text-[var(--foreground)]">
          Your friends ({friends.friends.length})
        </h3>
        {friends.loading && (
          <p className="text-center text-sm text-[var(--muted)] animate-pulse">Loading…</p>
        )}
        {!friends.loading && friends.friends.length === 0 && (
          <p className="rounded-2xl bg-[var(--surface-soft)] p-4 text-center text-sm text-[var(--muted)]">
            No friends yet — search above to send a request.
          </p>
        )}
        {friends.friends.map((f) => (
          <div
            key={f.userId}
            className="flex items-center gap-3 rounded-2xl bg-white p-3 shadow-sm"
          >
            <DogAvatar dogId={f.dogId as DogId} size={48} />
            <div className="min-w-0 flex-1">
              <div className="font-display font-bold text-[var(--foreground)]">
                {f.displayName}
              </div>
              <div className="text-xs text-[var(--muted)]">@{f.username}</div>
            </div>
            <button
              type="button"
              onClick={() => {
                setInviteFriend(f);
                setInviteMode("coop");
                setInviteDiff("medium");
              }}
              className="font-display rounded-full bg-[var(--primary)] px-4 py-2 text-sm font-extrabold text-white active:scale-95"
            >
              Invite
            </button>
          </div>
        ))}
      </section>

      {/* Invite modal */}
      {inviteFriend && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-3xl bg-white p-5 shadow-xl">
            <h3 className="font-display mb-3 text-lg font-extrabold">
              Invite {inviteFriend.displayName}
            </h3>
            <div className="mb-3 flex gap-2">
              {(["coop", "competitive"] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setInviteMode(m)}
                  className={`font-display flex-1 rounded-full py-2.5 text-sm font-bold ${
                    inviteMode === m
                      ? "bg-[var(--primary)] text-white"
                      : "bg-[var(--surface-soft)] text-[var(--muted)]"
                  }`}
                >
                  {GAME_MODE_LABELS[m]}
                </button>
              ))}
            </div>
            <DifficultySelect value={inviteDiff} onChange={setInviteDiff} />
            <div className="mt-4 flex gap-2">
              <button
                type="button"
                onClick={() => setInviteFriend(null)}
                className="flex-1 rounded-full bg-[var(--surface-soft)] py-3 font-bold text-[var(--muted)]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void sendInvite()}
                className="font-display flex-1 rounded-full bg-[var(--primary)] py-3 font-extrabold text-white"
              >
                Send &amp; start room
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
