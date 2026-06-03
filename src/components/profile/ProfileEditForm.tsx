"use client";

import { useEffect, useState } from "react";
import { BoneIcon } from "@/components/BoneIcon";
import { DogAvatar } from "@/components/DogAvatar";
import { NeedMoreBonesDialog } from "@/components/profile/NeedMoreBonesDialog";
import { EXCLUSIVE_BONE_COSTS } from "@/lib/bones/config";
import { ownsExclusiveDog } from "@/lib/bones/ownership";
import { displayDogId } from "@/lib/dogs/display";
import { isUsernameAvailable } from "@/lib/friends/api";
import { normalizeUsername, validateUsername } from "@/lib/friends/username";
import {
  EXCLUSIVE_DOGS,
  STANDARD_DOGS,
  isExclusiveDogId,
  type DogId,
  type ExclusiveDogId,
} from "@/lib/theme/dogs";
import type { Profile, UserData } from "@/lib/stats/types";

type UsernameStatus = "idle" | "checking" | "available" | "taken" | "invalid" | "unchanged";

type Props = {
  profile: Profile;
  currentUsername: string | null;
  userId: string | null;
  userData: UserData;
  onSaveUsername: (username: string) => Promise<{ ok: boolean; error?: string }>;
  onSaveDog: (dogId: DogId) => Promise<void>;
  onPurchaseExclusiveDog: (
    dogId: ExclusiveDogId,
  ) => Promise<{ ok: boolean; error?: string }>;
  onDone: () => void;
};

const PICKER_DOG_SIZE = 58;

function DogPickerButton({
  dogId,
  breed,
  selected,
  owned,
  cost,
  onSelect,
  username,
  userData,
}: {
  dogId: DogId;
  breed: string;
  selected: boolean;
  owned: boolean;
  cost?: number;
  onSelect: () => void;
  username: string;
  userData: UserData;
}) {
  const showCost = cost != null && !owned;

  return (
    <button
      type="button"
      onClick={onSelect}
      title={breed}
      className={`relative flex aspect-square flex-col items-center justify-center gap-0.5 rounded-2xl p-1 transition active:scale-95 ${
        selected
          ? "bg-[var(--primary-soft)] ring-2 ring-[var(--primary)]"
          : "bg-[var(--surface-soft)]"
      }`}
      aria-label={breed}
    >
      <DogAvatar
        dogId={dogId}
        size={PICKER_DOG_SIZE}
        username={username}
        userData={userData}
        preview={!owned && cost != null}
        className="block shrink-0"
      />
      {showCost && (
        <span className="flex items-center gap-0.5 text-[10px] font-bold text-[var(--foreground)]">
          <BoneIcon size={12} />
          {cost}
        </span>
      )}
      {!owned && cost != null && (
        <span
          className="pointer-events-none absolute inset-0 rounded-2xl bg-white/55"
          aria-hidden
        />
      )}
    </button>
  );
}

export function ProfileEditForm({
  profile,
  currentUsername,
  userId,
  userData,
  onSaveUsername,
  onSaveDog,
  onPurchaseExclusiveDog,
  onDone,
}: Props) {
  const [username, setUsername] = useState(currentUsername ?? profile.username);
  const [usernameStatus, setUsernameStatus] = useState<UsernameStatus>("idle");
  const [usernameHint, setUsernameHint] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [needBones, setNeedBones] = useState<{
    cost: number;
    balance: number;
  } | null>(null);

  const displayUsername = normalizeUsername(
    currentUsername ?? profile.username,
  );
  const resolvedDogId = displayDogId(profile.dogId, {
    username: displayUsername,
    userData,
  });
  const bones = userData.bones ?? 0;

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

  async function handleDogPick(dogId: DogId) {
    if (isExclusiveDogId(dogId)) {
      const owned = ownsExclusiveDog(dogId, userData);
      if (owned) {
        await onSaveDog(dogId);
        return;
      }
      const cost = EXCLUSIVE_BONE_COSTS[dogId];
      if (bones < cost) {
        setNeedBones({ cost, balance: bones });
        return;
      }
      const res = await onPurchaseExclusiveDog(dogId);
      if (!res.ok) {
        setSaveError(res.error ?? "Could not unlock this pup.");
      }
      return;
    }
    await onSaveDog(dogId);
  }

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
    <div className="flex flex-col gap-3">
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

      <div className="flex flex-col gap-2">
        <span className="text-xs font-bold uppercase tracking-wide text-[var(--muted)]">
          Profile pup
        </span>
        <div className="grid grid-cols-4 gap-2">
          {STANDARD_DOGS.map((d) => (
            <DogPickerButton
              key={d.id}
              dogId={d.id}
              breed={d.breed}
              selected={resolvedDogId === d.id}
              owned
              onSelect={() => void handleDogPick(d.id)}
              username={displayUsername}
              userData={userData}
            />
          ))}
        </div>
        <p className="text-[11px] font-bold uppercase tracking-wide text-[var(--muted)]">
          Exclusive — unlock with bones
        </p>
        <div className="grid grid-cols-4 gap-2">
          {EXCLUSIVE_DOGS.map((d) => {
            const id = d.id as ExclusiveDogId;
            const owned = ownsExclusiveDog(id, userData);
            const cost = EXCLUSIVE_BONE_COSTS[id];
            return (
              <DogPickerButton
                key={d.id}
                dogId={d.id}
                breed={d.breed}
                selected={resolvedDogId === d.id}
                owned={owned}
                cost={cost}
                onSelect={() => void handleDogPick(d.id)}
                username={displayUsername}
                userData={userData}
              />
            );
          })}
        </div>
        <p className="flex items-center justify-center gap-1 text-xs text-[var(--muted)]">
          Your balance: <BoneIcon size={14} />
          <span className="font-bold text-[var(--foreground)]">{bones}</span>
        </p>
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

      {needBones && (
        <NeedMoreBonesDialog
          open
          cost={needBones.cost}
          balance={needBones.balance}
          onClose={() => setNeedBones(null)}
        />
      )}
    </div>
  );
}
