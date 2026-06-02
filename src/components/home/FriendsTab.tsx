"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { DogAvatar } from "@/components/DogAvatar";
import { DifficultySelect } from "@/components/home/DifficultySelect";
import {
  FriendListPanel,
  FriendListRow,
  FriendPillButton,
} from "@/components/home/FriendListPanel";
import { TabScreenHeader } from "@/components/home/TabScreenHeader";
import { SearchIcon, UserPlusIcon } from "@/components/icons";
import type { DogId } from "@/lib/theme/dogs";
import { GAME_MODE_LABELS, type Difficulty, type GameMode } from "@/lib/game/types";
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
  onSignIn: () => void;
};

export function FriendsTab({ userData, onSignIn }: Props) {
  const router = useRouter();
  const searchRef = useRef<HTMLInputElement>(null);
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
      <div className="flex flex-1 flex-col gap-6">
        <TabScreenHeader title="Friends" />
        <div className="flex flex-1 flex-col items-center justify-center gap-3 px-2 text-center">
          <p className="font-serif-title text-lg text-[var(--foreground)]">
            Sign in to play with friends
          </p>
          <button
            type="button"
            onClick={onSignIn}
            className="font-display rounded-full bg-[var(--primary)] px-6 py-3 text-sm font-extrabold text-white"
          >
            Sign in
          </button>
        </div>
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
    if (res.ok) {
      setResults((prev) => prev.filter((p) => p.userId !== target.userId));
    }
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
    setMsg(`Invite sent to @${inviteFriend.username}!`);
    router.push(`/game/${code}?host=1&m=${mode}&d=${inviteDiff}`);
  }

  const friendIds = new Set(friends.friends.map((f) => f.userId));
  const discover = results.filter((p) => !friendIds.has(p.userId));

  return (
    <div className="flex flex-col gap-5">
      <TabScreenHeader
        title="Friends"
        action={
          <button
            type="button"
            onClick={() => searchRef.current?.focus()}
            className="rounded-full p-2 text-[var(--foreground)] active:bg-[var(--surface-soft)]"
            aria-label="Add friend"
          >
            <UserPlusIcon width={24} height={24} />
          </button>
        }
      />

      <div className="relative">
        <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[var(--muted)]">
          <SearchIcon width={18} height={18} />
        </span>
        <input
          ref={searchRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && void runSearch()}
          onBlur={() => query.trim().length >= 2 && void runSearch()}
          placeholder="Search by name"
          className="w-full rounded-2xl border border-[var(--border)] bg-white py-3.5 pl-11 pr-4 text-sm outline-none focus:border-[var(--primary)]"
        />
      </div>

      {msg && (
        <p className="rounded-2xl bg-[var(--primary-soft)] px-3 py-2 text-center text-sm font-semibold text-[var(--foreground)]">
          {msg}
        </p>
      )}

      {friends.invites.length > 0 && (
        <FriendListPanel title="Game invites">
          {friends.invites.map((inv) => (
            <FriendListRow
              key={inv.id}
              avatar={<DogAvatar dogId={inv.host.dogId as DogId} size={44} />}
              primary={inv.host.username}
              secondary={`${GAME_MODE_LABELS[inv.mode]} · ${inv.roomCode}`}
              action={
                <FriendPillButton
                  variant="primary"
                  onClick={async () => {
                    await markInviteJoined(inv.id);
                    router.push(`/game/${inv.roomCode}?m=${inv.mode}&d=${inv.difficulty}`);
                  }}
                >
                  Join
                </FriendPillButton>
              }
            />
          ))}
        </FriendListPanel>
      )}

      {friends.incoming.length > 0 && (
        <FriendListPanel title="Friend requests">
          {friends.incoming.map((req) => (
            <FriendListRow
              key={req.id}
              avatar={<DogAvatar dogId={req.profile.dogId as DogId} size={44} />}
              primary={req.profile.username}
              secondary="Wants to be friends"
              action={
                <div className="flex gap-2">
                  <FriendPillButton
                    variant="primary"
                    onClick={() => void friends.respond(req.id, true)}
                  >
                    Accept
                  </FriendPillButton>
                  <FriendPillButton onClick={() => void friends.respond(req.id, false)}>
                    Decline
                  </FriendPillButton>
                </div>
              }
            />
          ))}
        </FriendListPanel>
      )}

      <FriendListPanel
        title="Your friends"
        empty={
          friends.loading
            ? "Loading…"
            : friends.friends.length === 0
              ? "No friends yet — search above to add someone."
              : undefined
        }
      >
        {friends.friends.map((f) => (
          <FriendListRow
            key={f.userId}
            avatar={<DogAvatar dogId={f.dogId as DogId} size={44} />}
            primary={f.username}
            secondary="Ready to play"
            action={
              <FriendPillButton
                onClick={() => {
                  setInviteFriend(f);
                  setInviteMode("coop");
                  setInviteDiff("medium");
                }}
              >
                Start
              </FriendPillButton>
            }
          />
        ))}
      </FriendListPanel>

      <FriendListPanel
        title="Add friends"
        empty={
          discover.length === 0 && !searching
            ? "Search by @username or display name."
            : undefined
        }
      >
        {discover.map((p) => (
          <FriendListRow
            key={p.userId}
            avatar={<DogAvatar dogId={p.dogId as DogId} size={44} />}
            primary={p.username}
            secondary={p.displayName !== p.username ? p.displayName : undefined}
            action={
              <FriendPillButton onClick={() => void addFriend(p)}>Invite</FriendPillButton>
            }
          />
        ))}
      </FriendListPanel>

      {inviteFriend && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-3xl bg-white p-5 shadow-xl">
            <h3 className="font-serif-title mb-3 text-2xl text-[var(--foreground)]">
              Start with @{inviteFriend.username}
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
                Send &amp; start
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
