"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { DogAvatar } from "@/components/DogAvatar";
import { AddFriendSheet } from "@/components/home/AddFriendSheet";
import { FriendPillButton } from "@/components/home/FriendListPanel";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { SearchIcon, UserPlusIcon } from "@/components/icons";
import type { UseFriends } from "@/lib/friends/useFriends";
import type { PublicProfile } from "@/lib/friends/types";
import type { UseUserData } from "@/lib/stats/useUserData";
import type { DogId } from "@/lib/theme/dogs";
import { newRoomCode } from "@/lib/game/room";

type Props = {
  open: boolean;
  onClose: () => void;
  userData: UseUserData;
  friends: UseFriends;
  onPickOpponent: (profile: PublicProfile) => void;
  onSignIn: () => void;
};

function lastPlayedLabel(profile: PublicProfile, friendIds: Set<string>): string {
  if (friendIds.has(profile.userId)) return "On your friends list";
  return "Found by search";
}

function JoinCodeInput({ onJoin }: { onJoin: (code: string) => void }) {
  const [code, setCode] = useState("");
  const clean = code.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 4);

  return (
    <div className="mt-5 rounded-2xl border-2 border-[var(--border)] bg-[var(--background)] p-4">
      <p className="mb-2 text-xs font-bold uppercase tracking-wide text-[var(--muted)]">
        Join by code
      </p>
      <div className="flex gap-2">
        <input
          value={code}
          onChange={(e) => setCode(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && clean.length === 4 && onJoin(clean)}
          placeholder="ABCD"
          maxLength={4}
          className="ui-input flex-1 rounded-2xl border border-[var(--border)] bg-white py-3 text-center text-xl font-bold uppercase tracking-widest text-[var(--foreground)] outline-none focus:border-[var(--foreground)]"
        />
        <button
          type="button"
          disabled={clean.length !== 4}
          onClick={() => onJoin(clean)}
          className="rounded-2xl bg-[var(--foreground)] px-5 py-3 text-sm font-bold text-white disabled:opacity-40 active:scale-[0.98]"
        >
          Join
        </button>
      </div>
      <p className="mt-1.5 text-[11px] text-[var(--muted)]">
        Ask your friend for their 4-letter room code.
      </p>
    </div>
  );
}

function QuickStartSection({ onQuickStart }: { onQuickStart: () => void }) {
  return (
    <button
      type="button"
      onClick={onQuickStart}
      className="mt-3 flex w-full items-center justify-between rounded-2xl border-2 border-dashed border-[var(--border)] bg-white px-4 py-3 text-left transition active:scale-[0.99]"
    >
      <div>
        <p className="font-display text-sm font-bold text-[var(--foreground)]">
          Quick game (no friends needed)
        </p>
        <p className="text-xs text-[var(--muted)]">
          Get a code to share with anyone
        </p>
      </div>
      <span className="shrink-0 rounded-full bg-[var(--primary)] px-3 py-1 text-[11px] font-bold text-white">
        Create
      </span>
    </button>
  );
}

export function StartGameSheet({
  open,
  onClose,
  userData,
  friends,
  onPickOpponent,
  onSignIn,
}: Props) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<PublicProfile[]>([]);
  const [searching, setSearching] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [addFriendOpen, setAddFriendOpen] = useState(false);

  const friendIds = new Set(friends.friends.map((f) => f.userId));
  const discover = results.filter((p) => !friendIds.has(p.userId));

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

  function handleClose() {
    setQuery("");
    setResults([]);
    setMsg(null);
    onClose();
  }

  function handleJoinCode(code: string) {
    handleClose();
    router.push(`/game/${code}`);
  }

  function handleQuickStart() {
    handleClose();
    const code = newRoomCode();
    router.push(`/game/${code}?host=1&m=coop&d=medium`);
  }

  if (!userData.authConfigured) {
    return (
      <BottomSheet open={open} onClose={handleClose} title="Start game">
        <p className="text-center text-sm text-[var(--muted)]">
          Multiplayer needs Supabase on this deployment.
        </p>
        <JoinCodeInput onJoin={handleJoinCode} />
      </BottomSheet>
    );
  }

  if (!userData.user) {
    return (
      <BottomSheet open={open} onClose={handleClose} title="Start game">
        <p className="mb-4 text-center font-serif-title text-lg text-[var(--foreground)]">
          Sign in to play with friends
        </p>
        <button
          type="button"
          onClick={() => {
            handleClose();
            onSignIn();
          }}
          className="ui-button w-full rounded-full bg-[var(--foreground)] py-4 text-sm font-bold text-white"
        >
          Sign in
        </button>
        <JoinCodeInput onJoin={handleJoinCode} />
        <QuickStartSection onQuickStart={handleQuickStart} />
      </BottomSheet>
    );
  }

  return (
    <>
      <BottomSheet open={open} onClose={handleClose} title="Start game" tall>
        <h3 className="font-serif-title mb-2 text-lg text-[var(--foreground)]">
          Suggested matches
        </h3>

        <div className="mb-4 overflow-hidden rounded-2xl bg-[var(--list-panel)]">
          {friends.loading ? (
            <p className="px-4 py-6 text-center text-sm text-[var(--muted)]">Loading…</p>
          ) : friends.friends.length === 0 ? (
            <p className="px-4 py-6 text-center text-sm text-[var(--muted)]">
              No friends yet — search below or add a friend.
            </p>
          ) : (
            friends.friends.map((f, i) => (
              <div
                key={f.userId}
                className={`flex items-center gap-3 px-4 py-3 ${
                  i < friends.friends.length - 1 ? "border-b border-white/80" : ""
                }`}
              >
                <DogAvatar dogId={f.dogId as DogId} size={40} />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-bold text-[var(--foreground)]">
                    @{f.username}
                  </div>
                  <div className="text-xs text-[var(--muted)]">Ready to play</div>
                </div>
                <FriendPillButton
                  compact
                  variant="neutral"
                  onClick={() => {
                    handleClose();
                    onPickOpponent(f);
                  }}
                >
                  Start
                </FriendPillButton>
              </div>
            ))
          )}
        </div>

        <button
          type="button"
          onClick={() => setAddFriendOpen(true)}
          className="ui-button mb-5 flex w-full items-center justify-center gap-2 rounded-full border-2 border-[var(--foreground)] bg-white py-3 text-sm font-bold text-[var(--foreground)]"
        >
          <UserPlusIcon width={18} height={18} />
          Add a friend
        </button>

        <h3 className="font-serif-title mb-2 text-lg text-[var(--foreground)]">
          Find by username
        </h3>
        <div className="relative mb-2">
          <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[var(--muted)]">
            <SearchIcon width={18} height={18} />
          </span>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && void runSearch()}
            placeholder="@username"
            className="ui-input w-full rounded-2xl border border-[var(--border)] bg-[var(--background)] py-3.5 pl-11 pr-4 text-sm outline-none focus:border-[var(--foreground)]"
          />
        </div>
        <button
          type="button"
          onClick={() => void runSearch()}
          disabled={searching}
          className="ui-button mb-3 w-full rounded-full bg-[var(--foreground)] py-3 text-sm font-bold text-white disabled:opacity-60"
        >
          {searching ? "Searching…" : "Search"}
        </button>

        {msg && (
          <p className="mb-3 text-center text-xs font-semibold text-[var(--muted)]">{msg}</p>
        )}

        {discover.length > 0 && (
          <div className="mb-4 overflow-hidden rounded-2xl bg-[var(--list-panel)]">
            {discover.map((p, i) => (
              <div
                key={p.userId}
                className={`flex items-center gap-3 px-4 py-3 ${
                  i < discover.length - 1 ? "border-b border-white/80" : ""
                }`}
              >
                <DogAvatar dogId={p.dogId as DogId} size={40} />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-bold">@{p.username}</div>
                  <div className="text-xs text-[var(--muted)]">
                    {lastPlayedLabel(p, friendIds)}
                  </div>
                </div>
                <FriendPillButton
                  compact
                  variant="primary"
                  onClick={() => {
                    handleClose();
                    onPickOpponent(p);
                  }}
                >
                  Start
                </FriendPillButton>
              </div>
            ))}
          </div>
        )}

        <JoinCodeInput onJoin={handleJoinCode} />
        <QuickStartSection onQuickStart={handleQuickStart} />
      </BottomSheet>

      <AddFriendSheet
        open={addFriendOpen}
        onClose={() => setAddFriendOpen(false)}
        myUsername={friends.myProfile?.username ?? null}
        onSearch={friends.search}
        onAddFriend={(p) => friends.requestFriend(p.userId)}
        friendIds={friendIds}
      />
    </>
  );
}
