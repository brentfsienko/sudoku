"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { DifficultySelect } from "@/components/home/DifficultySelect";
import { ModeSelect } from "@/components/home/ModeSelect";
import { BottomNav, type HomeTab } from "@/components/home/BottomNav";
import { DogAvatar } from "@/components/DogAvatar";
import { FlameIcon, PawIcon, TrophyIcon } from "@/components/icons";
import { DIFFICULTY_LABELS, type Difficulty, type GameMode } from "@/lib/game/types";
import { DOGS, type DogId } from "@/lib/theme/dogs";
import { getProfile, setProfile, type Profile } from "@/lib/profile";
import { loadStats, type LocalStats } from "@/lib/storage";
import { formatTime } from "@/lib/game/scoring";

function newRoomCode(): string {
  const letters = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  let code = "";
  for (let i = 0; i < 4; i++) {
    code += letters[Math.floor(Math.random() * letters.length)];
  }
  return code;
}

export default function Home() {
  const router = useRouter();
  const [tab, setTab] = useState<HomeTab>("main");
  const [difficulty, setDifficulty] = useState<Difficulty>("medium");
  const [mode, setMode] = useState<GameMode>("single");
  const [joinCode, setJoinCode] = useState("");
  const [profile, setLocalProfile] = useState<Profile | null>(null);
  const [stats, setStats] = useState<LocalStats | null>(null);

  useEffect(() => {
    // Client-only read: kept in an effect so SSR markup matches first render.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLocalProfile(getProfile());
    setStats(loadStats());
  }, []);

  function startGame() {
    if (mode === "single") {
      router.push(`/play?d=${difficulty}`);
    } else {
      const code = newRoomCode();
      router.push(`/game/${code}?host=1&m=${mode}&d=${difficulty}`);
    }
  }

  function joinGame() {
    const code = joinCode.trim().toUpperCase();
    if (code.length < 3) return;
    router.push(`/game/${code}`);
  }

  function updateProfile(next: Partial<Profile>) {
    const merged = { ...(profile ?? getProfile()), ...next };
    setLocalProfile(merged);
    setProfile(merged);
  }

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-1 flex-col bg-[var(--background)]">
      {/* Header */}
      <header
        className="flex items-center justify-between px-5 pb-3 pt-5"
        style={{ paddingTop: "calc(env(safe-area-inset-top) + 1.25rem)" }}
      >
        <div className="flex items-center gap-2">
          <span className="text-[var(--primary)]">
            <PawIcon width={26} height={26} />
          </span>
          <h1 className="font-display text-2xl font-extrabold text-[var(--foreground)]">
            Floof Sudoku
          </h1>
        </div>
        <div className="flex items-center gap-1 rounded-full bg-white px-3 py-1.5 shadow-sm">
          <span className="text-[var(--primary)]">
            <FlameIcon width={18} height={18} />
          </span>
          <span className="font-display font-bold text-[var(--foreground)]">
            {stats?.streak ?? 0}
          </span>
        </div>
      </header>

      <main className="flex flex-1 flex-col gap-4 px-5 pb-6">
        {tab === "main" && (
          <>
            {/* Best score */}
            <div className="flex items-center justify-between rounded-3xl bg-gradient-to-br from-[var(--primary-soft)] to-[var(--surface-soft)] px-5 py-4">
              <div>
                <div className="text-sm font-semibold text-[var(--paw)]">
                  All-Time Best Score
                </div>
                <div className="font-display text-3xl font-extrabold text-[var(--foreground)]">
                  {(stats?.bestScore ?? 0).toLocaleString()}
                </div>
              </div>
              <span className="text-[var(--primary)]">
                <TrophyIcon width={44} height={44} />
              </span>
            </div>

            <DifficultySelect value={difficulty} onChange={setDifficulty} />
            <ModeSelect value={mode} onChange={setMode} />

            {mode === "single" ? (
              <button
                type="button"
                onClick={startGame}
                className="font-display mt-1 rounded-full bg-[var(--primary)] py-4 text-xl font-extrabold text-white shadow-lg shadow-[var(--primary)]/30 transition active:scale-[0.98]"
              >
                New Game
              </button>
            ) : (
              <div className="mt-1 flex flex-col gap-3 rounded-3xl bg-white p-4 shadow-sm">
                <p className="text-center text-sm text-[var(--muted)]">
                  Play with a friend over Wi-Fi. Create a room and share the
                  code, or join theirs.
                </p>
                <button
                  type="button"
                  onClick={startGame}
                  className="font-display rounded-full bg-[var(--primary)] py-3.5 text-lg font-extrabold text-white shadow-md transition active:scale-[0.98]"
                >
                  Create Room
                </button>
                <div className="flex items-center gap-2">
                  <input
                    value={joinCode}
                    onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                    placeholder="CODE"
                    maxLength={4}
                    className="font-display w-full rounded-full border-2 border-[var(--border)] bg-[var(--background)] px-4 py-3 text-center text-lg font-bold tracking-[0.3em] outline-none focus:border-[var(--accent)]"
                  />
                  <button
                    type="button"
                    onClick={joinGame}
                    className="font-display rounded-full bg-[var(--accent)] px-6 py-3 text-lg font-extrabold text-white transition active:scale-95"
                  >
                    Join
                  </button>
                </div>
              </div>
            )}
          </>
        )}

        {tab === "daily" && (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
            <DogAvatar dogId="corgi" size={120} />
            <h2 className="font-display text-2xl font-extrabold text-[var(--foreground)]">
              Daily Challenges
            </h2>
            <p className="max-w-xs text-[var(--muted)]">
              A fresh puzzle every day is coming soon. Keep your streak warm in
              the meantime!
            </p>
          </div>
        )}

        {tab === "me" && profile && (
          <MeTab profile={profile} stats={stats} onUpdate={updateProfile} />
        )}
      </main>

      <BottomNav active={tab} onChange={setTab} />
    </div>
  );
}

function MeTab({
  profile,
  stats,
  onUpdate,
}: {
  profile: Profile;
  stats: LocalStats | null;
  onUpdate: (next: Partial<Profile>) => void;
}) {
  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col items-center gap-3 rounded-3xl bg-white p-5 shadow-sm">
        <DogAvatar dogId={profile.dogId} size={96} ringColor="#3b82f6" />
        <input
          value={profile.name}
          onChange={(e) => onUpdate({ name: e.target.value.slice(0, 16) })}
          className="font-display w-full rounded-2xl border-2 border-[var(--border)] bg-[var(--background)] px-4 py-2.5 text-center text-lg font-bold outline-none focus:border-[var(--primary)]"
          placeholder="Your name"
        />
        <div className="grid grid-cols-4 gap-2">
          {DOGS.map((d) => (
            <button
              key={d.id}
              type="button"
              onClick={() => onUpdate({ dogId: d.id as DogId })}
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
      </div>

      <div className="grid grid-cols-2 gap-3">
        <StatCard label="Games Played" value={String(stats?.gamesPlayed ?? 0)} />
        <StatCard label="Games Won" value={String(stats?.gamesWon ?? 0)} />
        <StatCard label="Day Streak" value={String(stats?.streak ?? 0)} />
        <StatCard
          label="Best Score"
          value={(stats?.bestScore ?? 0).toLocaleString()}
        />
      </div>

      <div className="rounded-3xl bg-white p-4 shadow-sm">
        <h3 className="font-display mb-2 font-bold text-[var(--foreground)]">
          Best Times
        </h3>
        <div className="flex flex-col gap-1.5">
          {(["easy", "medium", "hard", "expert", "master"] as Difficulty[]).map(
            (d) => (
              <div key={d} className="flex justify-between text-sm">
                <span className="text-[var(--muted)]">{DIFFICULTY_LABELS[d]}</span>
                <span className="font-display font-bold text-[var(--foreground)]">
                  {stats?.bestTimeByDifficulty?.[d] != null
                    ? formatTime(stats.bestTimeByDifficulty[d]!)
                    : "--:--"}
                </span>
              </div>
            ),
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-white p-4 text-center shadow-sm">
      <div className="font-display text-2xl font-extrabold text-[var(--foreground)]">
        {value}
      </div>
      <div className="text-xs font-semibold text-[var(--muted)]">{label}</div>
    </div>
  );
}
