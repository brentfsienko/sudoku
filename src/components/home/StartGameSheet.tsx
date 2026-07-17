"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
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
  /** Max friends to invite (playerCount − 1). */
  maxGuests: number;
  onConfirmGuests: (guests: PublicProfile[]) => void;
  /** Optional mode/difficulty for quick-start (open lobby without invites). */
  onQuickStart?: () => void;
  onSignIn: () => void;
};

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

export function StartGameSheet({
  open,
  onClose,
  userData,
  friends,
  maxGuests,
  onConfirmGuests,
  onQuickStart,
  onSignIn,
}: Props) {
  const router = useRouter();
  const [selected, setSelected] = useState<PublicProfile[]>([]);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<PublicProfile[]>([]);
  const [searching, setSearching] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [addFriendOpen, setAddFriendOpen] = useState(false);

  useEffect(() => {
    if (!open) {
      setSelected([]);
      setQuery("");
      setResults([]);
      setMsg(null);
    }
  }, [open]);

  const friendIds = useMemo(
    () => new Set(friends.friends.map((f) => f.userId)),
    [friends.friends],
  );
  const discover = results.filter((p) => !friendIds.has(p.userId));

  function toggle(friend: PublicProfile) {
    setSelected((prev) => {
      const exists = prev.some((p) => p.userId === friend.userId);
      if (exists) return prev.filter((p) => p.userId !== friend.userId);
      if (prev.length >= maxGuests) return prev;
      return [...prev, friend];
    });
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

  function handleClose() {
    onClose();
  }

  function handleJoinCode(code: string) {
    handleClose();
    router.push(`/game/${code}`);
  }

  function handleQuickStart() {
    if (onQuickStart) {
      onQuickStart();
      return;
    }
    handleClose();
    const code = newRoomCode();
    router.push(`/game/${code}?host=1&m=coop&d=medium`);
  }

  const canConfirm = selected.length > 0;

  if (!userData.authConfigured) {
    return (
      <BottomSheet open={open} onClose={handleClose} title="Invite friends">
        <p className="text-center text-sm text-[var(--muted)]">
          Multiplayer needs Supabase on this deployment.
        </p>
        <JoinCodeInput onJoin={handleJoinCode} />
      </BottomSheet>
    );
  }

  if (!userData.user) {
    return (
      <BottomSheet open={open} onClose={handleClose} title="Invite friends">
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
      </BottomSheet>
    );
  }

  return (
    <>
      <BottomSheet
        open={open}
        onClose={handleClose}
        title="Invite friends"
        tall
      >
        <p className="mb-3 text-sm text-[var(--muted)]">
          Pick up to {maxGuests} {maxGuests === 1 ? "friend" : "friends"} (
          {selected.length}/{maxGuests} selected)
        </p>

        <h3 className="font-serif-title mb-2 text-lg text-[var(--foreground)]">
          Your friends
        </h3>

        <div className="mb-4 overflow-hidden rounded-2xl bg-[var(--list-panel)]">
          {friends.loading ? (
            <p className="px-4 py-6 text-center text-sm text-[var(--muted)]">
              Loading…
            </p>
          ) : friends.friends.length === 0 ? (
            <p className="px-4 py-6 text-center text-sm text-[var(--muted)]">
              No friends yet — search below or add a friend.
            </p>
          ) : (
            friends.friends.map((f, i) => {
              const isSelected = selected.some((p) => p.userId === f.userId);
              const atCap = !isSelected && selected.length >= maxGuests;
              return (
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
                    variant={isSelected ? "primary" : "neutral"}
                    disabled={atCap}
                    onClick={() => toggle(f)}
                  >
                    {isSelected ? "Added" : atCap ? "Full" : "Add"}
                  </FriendPillButton>
                </div>
              );
            })
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
          <p className="mb-3 text-center text-xs font-semibold text-[var(--muted)]">
            {msg}
          </p>
        )}

        {discover.length > 0 && (
          <div className="mb-4 overflow-hidden rounded-2xl bg-[var(--list-panel)]">
            {discover.map((p, i) => {
              const isSelected = selected.some((s) => s.userId === p.userId);
              const atCap = !isSelected && selected.length >= maxGuests;
              return (
                <div
                  key={p.userId}
                  className={`flex items-center gap-3 px-4 py-3 ${
                    i < discover.length - 1 ? "border-b border-white/80" : ""
                  }`}
                >
                  <DogAvatar dogId={p.dogId as DogId} size={40} />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-bold">@{p.username}</div>
                    <div className="text-xs text-[var(--muted)]">Found by search</div>
                  </div>
                  <FriendPillButton
                    compact
                    variant={isSelected ? "primary" : "neutral"}
                    disabled={atCap}
                    onClick={() => toggle(p)}
                  >
                    {isSelected ? "Added" : atCap ? "Full" : "Add"}
                  </FriendPillButton>
                </div>
              );
            })}
          </div>
        )}

        <button
          type="button"
          disabled={!canConfirm}
          onClick={() => onConfirmGuests(selected)}
          className="font-display mb-3 w-full rounded-2xl bg-[var(--primary)] py-3.5 text-sm font-bold text-white shadow-md transition active:scale-[0.98] disabled:opacity-40"
        >
          {canConfirm
            ? `Send ${selected.length} invite${selected.length === 1 ? "" : "s"} & play`
            : "Select at least one friend"}
        </button>

        <button
          type="button"
          onClick={handleQuickStart}
          className="mb-1 flex w-full items-center justify-between rounded-2xl border-2 border-dashed border-[var(--border)] bg-white px-4 py-3 text-left transition active:scale-[0.99]"
        >
          <div>
            <p className="font-display text-sm font-bold text-[var(--foreground)]">
              Start without inviting
            </p>
            <p className="text-xs text-[var(--muted)]">
              Get a code to share with anyone
            </p>
          </div>
          <span className="shrink-0 rounded-full bg-[var(--primary)] px-3 py-1 text-[11px] font-bold text-white">
            Create
          </span>
        </button>

        <JoinCodeInput onJoin={handleJoinCode} />
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
