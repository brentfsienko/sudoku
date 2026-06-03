"use client";

import { useEffect, useState } from "react";
import { DogAvatar } from "@/components/DogAvatar";
import { isUsernameAvailable } from "@/lib/friends/api";
import { normalizeUsername, validateUsername } from "@/lib/friends/username";
import { DOGS, type DogId } from "@/lib/theme/dogs";
import type { Profile } from "@/lib/stats/types";

type UsernameStatus = "idle" | "checking" | "available" | "taken" | "invalid" | "unchanged";

type Props = {
  profile: Profile;
  currentUsername: string | null;
  userId: string | null;
  onSaveUsername: (username: string) => Promise<{ ok: boolean; error?: string }>;
  onSaveDog: (dogId: DogId) => Promise<void>;
  onDone: () => void;
};

export function ProfileEditForm({
  profile,
  currentUsername,
  userId,
  onSaveUsername,
  onSaveDog,
  onDone,
}: Props) {
  const [username, setUsername] = useState(currentUsername ?? profile.username);
  const [usernameStatus, setUsernameStatus] = useState<UsernameStatus>("idle");
  const [usernameHint, setUsernameHint] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setUsername(currentUsername ?? profile.username);
  }, [currentUsername, profile.username]);

  useEffect(() => {
    if (!userId) {
      setUsernameStatus("idle");
      setUsernameHint("Sign in to choose a unique @username.");
      return;
    }

    const clean = normalizeUsername(username);
    if (!clean) {
      setUsernameStatus("idle");
      setUsernameHint(null);
      return;
    }

    if (clean === currentUsername) {
      setUsernameStatus("unchanged");
      setUsernameHint("This is your current username.");
      return;
    }

    const validation = validateUsername(clean);
    if (validation) {
      setUsernameStatus("invalid");
      setUsernameHint(validation);
      return;
    }

    setUsernameStatus("checking");
    setUsernameHint(null);
    const timer = setTimeout(() => {
      void (async () => {
        const available = await isUsernameAvailable(clean, userId);
        if (normalizeUsername(username) !== clean) return;
        if (available) {
          setUsernameStatus("available");
          setUsernameHint("@username is available");
        } else {
          setUsernameStatus("taken");
          setUsernameHint("That username is already taken");
        }
      })();
    }, 350);

    return () => clearTimeout(timer);
  }, [username, userId, currentUsername]);

  async function handleDone() {
    setSaveError(null);
    setSaving(true);
    try {
      if (userId) {
        const clean = normalizeUsername(username);
        const validation = validateUsername(clean);
        if (validation) {
          setSaveError(validation);
          return;
        }
        if (clean !== currentUsername) {
          if (usernameStatus === "taken") {
            setSaveError("Username already taken.");
            return;
          }
          const res = await onSaveUsername(clean);
          if (!res.ok) {
            setSaveError(res.error ?? "Could not save username.");
            return;
          }
        }
      } else {
        const clean = normalizeUsername(username);
        const validation = validateUsername(clean);
        if (validation) {
          setSaveError(validation);
          return;
        }
        if (clean !== profile.username) {
          const res = await onSaveUsername(clean);
          if (!res.ok) {
            setSaveError(res.error ?? "Could not save username.");
            return;
          }
        }
      }

      onDone();
    } finally {
      setSaving(false);
    }
  }

  const usernameBorder =
    usernameStatus === "taken" || usernameStatus === "invalid"
      ? "border-[#ef6f6c]"
      : usernameStatus === "available"
        ? "border-[#5cc98b]"
        : "border-[var(--border)]";

  return (
    <div className="animate-float-in flex flex-col gap-3 rounded-3xl bg-white p-4 shadow-sm">
      <label className="flex flex-col gap-1">
        <span className="text-xs font-bold uppercase tracking-wide text-[var(--muted)]">
          Username
        </span>
        <div className="flex items-center gap-1">
          <span className="pl-1 text-sm font-bold text-[var(--muted)]">@</span>
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            maxLength={24}
            autoCapitalize="off"
            autoCorrect="off"
            spellCheck={false}
            className={`ui-input w-full rounded-2xl border-2 bg-[var(--background)] px-3 py-2.5 text-sm font-bold outline-none focus:border-[var(--primary)] ${usernameBorder}`}
            placeholder="your_username"
          />
        </div>
        {usernameHint && (
          <p
            className={`text-xs ${
              usernameStatus === "taken" || usernameStatus === "invalid"
                ? "text-[#ef6f6c]"
                : "text-[var(--muted)]"
            }`}
          >
            {usernameStatus === "checking" ? "Checking availability…" : usernameHint}
          </p>
        )}
        {!userId && (
          <p className="text-xs text-[var(--muted)]">
            Saved on this device. Sign in to claim it and play with friends.
          </p>
        )}
      </label>

      <div className="grid grid-cols-4 gap-2">
        {DOGS.map((d) => (
          <button
            key={d.id}
            type="button"
            onClick={() => void onSaveDog(d.id as DogId)}
            className={`rounded-2xl p-1 transition ${
              profile.dogId === d.id
                ? "bg-[var(--primary-soft)] ring-2 ring-[var(--primary)]"
                : "bg-[var(--surface-soft)]"
            }`}
            aria-label={d.breed}
          >
            <DogAvatar dogId={d.id} size={48} />
          </button>
        ))}
      </div>

      {saveError && <p className="text-center text-xs text-[#ef6f6c]">{saveError}</p>}

      <button
        type="button"
        onClick={handleDone}
        disabled={saving || usernameStatus === "checking"}
        className="ui-button w-full rounded-full bg-[var(--foreground)] py-2.5 text-sm font-bold text-white active:scale-95 disabled:opacity-60"
      >
        {saving ? "Saving…" : "Save profile"}
      </button>
    </div>
  );
}
