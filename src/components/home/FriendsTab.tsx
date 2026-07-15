"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { DogAvatar } from "@/components/DogAvatar";
import {
  GameSetupSheet,
  type GameSetupResult,
} from "@/components/home/GameSetupSheet";
import {
  FriendListPanel,
  FriendListRow,
  FriendPillButton,
} from "@/components/home/FriendListPanel";
import { AddFriendSheet } from "@/components/home/AddFriendSheet";
import { TabScreenHeader } from "@/components/home/TabScreenHeader";
import { DailyLeaderboard } from "@/components/home/DailyLeaderboard";
import { isTodayComplete } from "@/lib/daily/puzzle";
import { SearchIcon, UserPlusIcon } from "@/components/icons";
import type { DogId } from "@/lib/theme/dogs";
import { GAME_MODE_LABELS } from "@/lib/game/types";
import { newRoomCode } from "@/lib/game/room";
import {
  createGameInvite,
  markInviteJoined,
} from "@/lib/friends/api";
import { useFriends } from "@/lib/friends/useFriends";
import type { UseUserData } from "@/lib/stats/useUserData";
import type { PublicProfile } from "@/lib/friends/types";

type SubTab = "friends" | "daily";

type Props = {
  userData: UseUserData;
  onSignIn: () => void;
  initialSubTab?: SubTab;
};

export function FriendsTab({ userData, onSignIn, initialSubTab }: Props) {
  const router = useRouter();
  const searchRef = useRef<HTMLInputElement>(null);
  const profile = userData.data?.profile ?? null;
  const friends = useFriends(userData.user, profile);
  const [subTab, setSubTab] = useState<SubTab>(initialSubTab ?? "friends");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<PublicProfile[]>([]);
  const [searching, setSearching] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [inviteFriend, setInviteFriend] = useState<PublicProfile | null>(null);
  const [addFriendOpen, setAddFriendOpen] = useState(false);

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
            className="ui-button rounded-full bg-[var(--foreground)] px-6 py-3 text-sm font-bold text-white"
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

  async function sendInvite(result: GameSetupResult) {
    if (!inviteFriend || !userData.user || result.kind !== "multiplayer") return;
    const code = newRoomCode();
    const res = await createGameInvite(
      userData.user.id,
      inviteFriend.userId,
      code,
      result.mode,
      result.difficulty,
    );
    if (!res.ok) {
      setMsg(res.error ?? "Could not send invite");
      return;
    }
    const name = inviteFriend.username;
    setInviteFriend(null);
    setMsg(`Invite sent to @${name}!`);
    router.push(
      `/game/${code}?host=1&m=${result.mode}&d=${result.difficulty}`,
    );
  }

  const friendIds = new Set(friends.friends.map((f) => f.userId));
  const discover = results.filter((p) => !friendIds.has(p.userId));

  // Segmented sub-tab pill (shared across both views)
  const subTabPill = (
    <div className="flex self-start rounded-full border border-[var(--border)] bg-[var(--surface-soft)] p-0.5">
      {(["friends", "daily"] as SubTab[]).map((t) => (
        <button
          key={t}
          type="button"
          onClick={() => setSubTab(t)}
          className={`rounded-full px-4 py-1.5 text-[13px] font-semibold transition ${
            subTab === t
              ? "bg-white text-[var(--foreground)] shadow-sm"
              : "text-[var(--muted)]"
          }`}
        >
          {t === "daily" ? "Daily" : "Friends"}
        </button>
      ))}
    </div>
  );

  // Daily leaderboard sub-tab
  if (subTab === "daily") {
    const dailyDone = isTodayComplete();
    return (
      <div className="flex flex-col gap-5">
        <TabScreenHeader title="Friends" />
        {subTabPill}
        {!dailyDone && (
          <button
            type="button"
            onClick={() => router.push("/play/daily")}
            className="flex w-full items-center justify-between rounded-2xl bg-[var(--primary)] px-5 py-3.5 text-left text-white active:opacity-90"
          >
            <div>
              <p className="font-display text-sm font-extrabold">Today's Daily Challenge</p>
              <p className="text-xs opacity-80">Play now to get on the leaderboard</p>
            </div>
            <svg viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5 shrink-0 opacity-80">
              <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" />
            </svg>
          </button>
        )}
        <DailyLeaderboard
          friends={friends.friends}
          myId={userData.user?.id ?? ""}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <TabScreenHeader
        title="Friends"
        action={
          <button
            type="button"
            onClick={() => setAddFriendOpen(true)}
            className="rounded-full p-2 text-[var(--foreground)] active:bg-[var(--surface-soft)]"
            aria-label="Add friend"
          >
            <UserPlusIcon width={24} height={24} />
          </button>
        }
      />
      {subTabPill}

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
          placeholder="Search by @username"
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
                onClick={() => setInviteFriend(f)}
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
            action={
              <FriendPillButton onClick={() => void addFriend(p)}>Invite</FriendPillButton>
            }
          />
        ))}
      </FriendListPanel>

      <AddFriendSheet
        open={addFriendOpen}
        onClose={() => setAddFriendOpen(false)}
        myUsername={friends.myProfile?.username ?? null}
        onSearch={friends.search}
        onAddFriend={(p) => friends.requestFriend(p.userId)}
        friendIds={friendIds}
      />

      <GameSetupSheet
        open={!!inviteFriend}
        onClose={() => setInviteFriend(null)}
        kind="multiplayer"
        opponentName={inviteFriend?.username}
        onConfirm={(r) => void sendInvite(r)}
      />
    </div>
  );
}
