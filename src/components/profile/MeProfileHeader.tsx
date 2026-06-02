"use client";

import { useState } from "react";
import { DogAvatar } from "@/components/DogAvatar";
import { TabScreenHeader } from "@/components/home/TabScreenHeader";
import { FriendCodeModal } from "@/components/profile/FriendCodeModal";
import { ProfileEditForm } from "@/components/profile/ProfileEditForm";
import { WinLossBar } from "@/components/stats/WinLossBar";
import { PencilIcon, SettingsIcon } from "@/components/icons";
import { multiWinLoss } from "@/lib/friends/api";
import { useFriends } from "@/lib/friends/useFriends";
import type { MultiStats, Profile } from "@/lib/stats/types";
import type { UseUserData } from "@/lib/stats/useUserData";

type Props = {
  profile: Profile;
  multi: MultiStats;
  userData: UseUserData;
  onSignIn: () => void;
};

export function MeProfileHeader({ profile, multi, userData, onSignIn }: Props) {
  const [editing, setEditing] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [friendCodeOpen, setFriendCodeOpen] = useState(false);
  const friends = useFriends(userData.user, profile);
  const wl = multiWinLoss(multi);

  const username =
    friends.myProfile?.username ?? profile.name.toLowerCase().replace(/\s+/g, "");

  return (
    <div className="flex flex-col gap-6">
      <TabScreenHeader
        title="Me"
        action={
          <button
            type="button"
            onClick={() => setSettingsOpen((v) => !v)}
            className="rounded-full p-2 text-[var(--foreground)] active:bg-[var(--surface-soft)]"
            aria-label="Settings"
          >
            <SettingsIcon width={24} height={24} />
          </button>
        }
      />

      {settingsOpen && (
        <div className="rounded-2xl border border-[var(--border)] bg-white p-3 text-sm shadow-sm">
          {userData.user ? (
            <>
              <p className="mb-2 truncate text-xs text-[var(--muted)]">
                {userData.user.email}
              </p>
              <button
                type="button"
                onClick={() => {
                  setSettingsOpen(false);
                  setEditing(true);
                }}
                className="block w-full py-2 text-left font-semibold text-[var(--foreground)]"
              >
                Edit profile
              </button>
              <button
                type="button"
                onClick={() => void userData.signOut()}
                className="block w-full py-2 text-left font-semibold text-[var(--paw)]"
              >
                Sign out
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => {
                setSettingsOpen(false);
                onSignIn();
              }}
              className="block w-full py-2 text-left font-semibold text-[var(--primary)]"
            >
              Sign in
            </button>
          )}
        </div>
      )}

      <div className="flex flex-col items-center gap-3 text-center">
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="relative rounded-full active:scale-95"
          aria-label="Edit profile"
        >
          <DogAvatar dogId={profile.dogId} size={96} ringColor="#7ec4cf" />
          <span className="absolute bottom-0 right-0 flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-[var(--surface-soft)] text-[var(--muted)]">
            <PencilIcon width={14} height={14} />
          </span>
        </button>

        <p className="font-serif-title max-w-full px-2 text-lg leading-snug text-[var(--foreground)]">
          Here are your stats,{" "}
          <span className="font-semibold">{username}</span>.
        </p>

        {friends.myProfile && (
          <button
            type="button"
            onClick={() => setFriendCodeOpen(true)}
            className="rounded-full border-2 border-[var(--border)] bg-white px-5 py-2 text-sm font-bold text-[var(--foreground)] active:scale-95"
          >
            View friend code
          </button>
        )}
      </div>

      <WinLossBar {...wl} />

      {editing && (
        <ProfileEditForm
          profile={profile}
          currentUsername={friends.myProfile?.username ?? null}
          userId={userData.user?.id ?? null}
          onSaveDisplayName={async (name) => {
            await userData.updateProfile({ name });
          }}
          onSaveUsername={friends.setUsername}
          onSaveDog={async (dogId) => {
            await userData.updateProfile({ dogId });
          }}
          onDone={() => setEditing(false)}
        />
      )}

      {friendCodeOpen && friends.myProfile && (
        <FriendCodeModal
          username={friends.myProfile.username}
          onClose={() => setFriendCodeOpen(false)}
        />
      )}
    </div>
  );
}
