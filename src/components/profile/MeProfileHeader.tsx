"use client";

import { useState } from "react";
import { BoneIcon } from "@/components/BoneIcon";
import { DogAvatar } from "@/components/DogAvatar";
import { TabScreenHeader } from "@/components/home/TabScreenHeader";
import { FriendCodeModal } from "@/components/profile/FriendCodeModal";
import { ProfileEditModal } from "@/components/profile/ProfileEditModal";
import { ProfileEditForm } from "@/components/profile/ProfileEditForm";
import { WinLossBar } from "@/components/stats/WinLossBar";
import { FlameIcon, PencilIcon, SettingsIcon, ShareIcon } from "@/components/icons";
import { COOP_ACCENT, VERSUS_ACCENT, compWinLoss, coopWinLoss } from "@/lib/stats/multi";
import { GAME_MODE_LABELS } from "@/lib/game/types";
import { useFriends } from "@/lib/friends/useFriends";
import { emptyUserData, type MultiStats, type Profile } from "@/lib/stats/types";
import type { UseUserData } from "@/lib/stats/useUserData";

type Props = {
  profile: Profile;
  multi: MultiStats;
  soloStreak: number;
  bones: number;
  userData: UseUserData;
  onSignIn: () => void;
};

export function MeProfileHeader({
  profile,
  multi,
  soloStreak,
  bones,
  userData,
  onSignIn,
}: Props) {
  const [editing, setEditing] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [friendCodeOpen, setFriendCodeOpen] = useState(false);
  const friends = useFriends(userData.user, profile);
  const coop = coopWinLoss(multi);
  const versus = compWinLoss(multi);

  const username = friends.myProfile?.username ?? profile.username;
  const statsData = userData.data ?? emptyUserData(profile);

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

      <div className="flex flex-col items-center gap-4 text-center">
        <div className="relative mx-auto w-fit px-12">
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="relative block rounded-full active:scale-95"
            aria-label="Edit profile"
          >
            <DogAvatar
              dogId={profile.dogId}
              size={128}
              bare
              username={username}
              email={userData.user?.email}
              userData={statsData}
            />
            <span className="absolute bottom-0 right-0 flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-[var(--surface-soft)] text-[var(--muted)]">
              <PencilIcon width={14} height={14} />
            </span>
          </button>
          {friends.myProfile && (
            <button
              type="button"
              onClick={() => setFriendCodeOpen(true)}
              className="absolute right-0 top-2 flex h-10 w-10 items-center justify-center rounded-full border border-[var(--border)] bg-white text-[var(--foreground)] shadow-sm active:scale-95"
              aria-label="Share friend code"
            >
              <ShareIcon width={20} height={20} />
            </button>
          )}
        </div>

        <p className="font-serif-title max-w-full px-2 text-lg leading-snug text-[var(--foreground)]">
          Here are your stats,{" "}
          <span className="font-semibold">{username}</span>.
        </p>

        <div className="flex w-full max-w-xs justify-center gap-10">
          <div className="flex flex-col items-center gap-1">
            <span className="text-[var(--primary)]">
              <FlameIcon width={22} height={22} />
            </span>
            <p className="font-display text-2xl font-extrabold text-[var(--foreground)]">
              {soloStreak}
            </p>
            <p className="text-xs font-bold uppercase tracking-wide text-[var(--muted)]">
              Day streak
            </p>
          </div>
          <div className="flex flex-col items-center gap-1">
            <BoneIcon size={22} />
            <p className="font-display text-2xl font-extrabold text-[var(--foreground)]">
              {bones}
            </p>
            <p className="text-xs font-bold uppercase tracking-wide text-[var(--muted)]">
              Bones
            </p>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-5">
        <WinLossBar
          {...coop}
          title={GAME_MODE_LABELS.coop}
          subtitle={
            coop.played > 0 ? `${coop.wins} solved · ${coop.played} played` : "No games yet"
          }
          color={COOP_ACCENT}
        />
        <WinLossBar
          wins={versus.wins}
          losses={versus.losses}
          winPct={versus.winPct}
          title={GAME_MODE_LABELS.competitive}
          subtitle={
            versus.played > 0
              ? `${versus.record} W-L-T · ${versus.played} played`
              : "No games yet"
          }
          color={VERSUS_ACCENT}
        />
      </div>

      <ProfileEditModal open={editing} onClose={() => setEditing(false)}>
        <ProfileEditForm
          profile={profile}
          userData={statsData}
          userEmail={userData.user?.email}
          currentUsername={friends.myProfile?.username ?? profile.username}
          userId={userData.user?.id ?? null}
          onSaveUsername={async (uname) => {
            if (userData.user) {
              const res = await friends.setUsername(uname);
              if (res.ok) await userData.updateProfile({ username: uname });
              return res;
            }
            await userData.updateProfile({ username: uname });
            return { ok: true };
          }}
          onSaveDog={async (dogId) => {
            await userData.updateProfile({ dogId });
          }}
          onPurchaseExclusiveDog={(dogId) =>
            userData.purchaseExclusiveDog(dogId)
          }
          onDone={() => setEditing(false)}
        />
      </ProfileEditModal>

      {friendCodeOpen && friends.myProfile && (
        <FriendCodeModal
          username={friends.myProfile.username}
          onClose={() => setFriendCodeOpen(false)}
        />
      )}
    </div>
  );
}
