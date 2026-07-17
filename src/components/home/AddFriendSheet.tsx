"use client";

import { useState } from "react";
import { DogAvatar } from "@/components/DogAvatar";
import { FriendPillButton } from "@/components/home/FriendListPanel";
import { SearchIcon } from "@/components/icons";
import type { DogId } from "@/lib/theme/dogs";
import { copyToClipboard } from "@/lib/clipboard";
import type { PublicProfile } from "@/lib/friends/types";

type View = "menu" | "search";

type Props = {
  open: boolean;
  onClose: () => void;
  myUsername: string | null;
  onSearch: (query: string) => Promise<PublicProfile[]>;
  onAddFriend: (profile: PublicProfile) => Promise<{ ok: boolean; error?: string }>;
  friendIds: Set<string>;
};

export function AddFriendSheet({
  open,
  onClose,
  myUsername,
  onSearch,
  onAddFriend,
  friendIds,
}: Props) {
  const [view, setView] = useState<View>("menu");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<PublicProfile[]>([]);
  const [searching, setSearching] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  if (!open) return null;

  function close() {
    setView("menu");
    setQuery("");
    setResults([]);
    setMsg(null);
    onClose();
  }

  async function runSearch() {
    setSearching(true);
    setMsg(null);
    const hits = await onSearch(query);
    setResults(hits.filter((p) => !friendIds.has(p.userId)));
    setSearching(false);
    if (!hits.length && query.trim().length >= 2) {
      setMsg("No players found — try their @username.");
    }
  }

  async function inviteFriend() {
    const handle = myUsername ? `@${myUsername}` : "Sudogku";
    const text = `Play Sudogku with me! Find me as ${handle} — ${window.location.origin}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: "Sudogku", text, url: window.location.origin });
        return;
      }
    } catch {
      // user cancelled share
    }
    const ok = await copyToClipboard(text);
    setMsg(ok ? "Invite message copied!" : text);
  }

  return (
    <div
      data-modal-layer
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40"
    >
      <div
        className="animate-float-in w-full max-w-md rounded-t-3xl bg-white px-5 pb-8 pt-4 shadow-xl"
        style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 2rem)" }}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="ui-button text-lg font-bold text-[var(--foreground)]">
            {view === "menu" ? "Add a friend" : "Search by friend code"}
          </h2>
          <button
            type="button"
            onClick={close}
            className="ui-button rounded-full p-2 text-xl leading-none text-[var(--muted)]"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        {view === "menu" ? (
          <div className="flex flex-col gap-4">
            <p className="text-center font-serif-title text-base leading-snug text-[var(--foreground)]">
              Add a friend to your friends list so you can play together.
            </p>
            <button
              type="button"
              onClick={() => void inviteFriend()}
              className="ui-button w-full rounded-full bg-[var(--foreground)] py-4 text-base font-bold text-white active:scale-[0.98]"
            >
              Invite a friend
            </button>
            <button
              type="button"
              onClick={() => setView("search")}
              className="ui-button flex w-full items-center justify-center gap-2 rounded-full bg-[var(--foreground)] py-4 text-base font-bold text-white active:scale-[0.98]"
            >
              <SearchIcon width={18} height={18} />
              Search by friend code
            </button>
            {msg && (
              <p className="text-center text-xs font-semibold text-[var(--muted)]">{msg}</p>
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <div className="relative">
              <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[var(--muted)]">
                <SearchIcon width={18} height={18} />
              </span>
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && void runSearch()}
                placeholder="@username"
                autoFocus
                className="ui-input w-full rounded-2xl border border-[var(--border)] bg-[var(--background)] py-3.5 pl-11 pr-4 text-sm outline-none focus:border-[var(--foreground)]"
              />
            </div>
            <button
              type="button"
              onClick={() => void runSearch()}
              disabled={searching}
              className="ui-button w-full rounded-full bg-[var(--foreground)] py-3 text-sm font-bold text-white disabled:opacity-60"
            >
              {searching ? "Searching…" : "Search"}
            </button>
            {msg && (
              <p className="text-center text-xs font-semibold text-[var(--muted)]">{msg}</p>
            )}
            <div className="max-h-48 overflow-y-auto rounded-2xl bg-[var(--list-panel)]">
              {results.map((p) => (
                <div
                  key={p.userId}
                  className="flex items-center gap-3 border-b border-white/70 px-4 py-3 last:border-b-0"
                >
                  <DogAvatar dogId={p.dogId as DogId} size={40} />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-bold">{p.username}</div>
                  </div>
                  <FriendPillButton
                    variant="primary"
                    onClick={async () => {
                      const res = await onAddFriend(p);
                      setMsg(res.ok ? `Request sent to @${p.username}` : res.error ?? "Failed");
                      if (res.ok) {
                        setResults((prev) => prev.filter((x) => x.userId !== p.userId));
                      }
                    }}
                  >
                    Invite
                  </FriendPillButton>
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={() => setView("menu")}
              className="text-sm font-semibold text-[var(--muted)] underline underline-offset-2"
            >
              Back
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
