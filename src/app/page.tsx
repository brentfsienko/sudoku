"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { DifficultySelect } from "@/components/home/DifficultySelect";
import { ModeSelect } from "@/components/home/ModeSelect";
import { BottomNav, type HomeTab } from "@/components/home/BottomNav";
import { DogAvatar } from "@/components/DogAvatar";
import {
  ClockIcon,
  FlameIcon,
  PawIcon,
  TargetIcon,
  TrophyIcon,
} from "@/components/icons";
import { DIFFICULTY_LABELS, type Difficulty, type GameMode } from "@/lib/game/types";
import { DOGS, type DogId } from "@/lib/theme/dogs";
import { getProfile, setProfile, type Profile } from "@/lib/profile";
import { loadStats, resetStats, type LocalStats } from "@/lib/storage";
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
          <MeTab
            profile={profile}
            stats={stats}
            onUpdate={updateProfile}
            onReset={() => setStats(resetStats())}
          />
        )}
      </main>

      <BottomNav active={tab} onChange={setTab} />
    </div>
  );
}

const DIFFICULTY_ORDER: Difficulty[] = [
  "easy",
  "medium",
  "hard",
  "expert",
  "master",
];

const DIFFICULTY_COLORS: Record<Difficulty, string> = {
  easy: "#5cc98b",
  medium: "#f4a259",
  hard: "#ef8f4a",
  expert: "#ef6f6c",
  master: "#a06bd6",
};

function MeTab({
  profile,
  stats,
  onUpdate,
  onReset,
}: {
  profile: Profile;
  stats: LocalStats | null;
  onUpdate: (next: Partial<Profile>) => void;
  onReset: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const s = stats;

  const played = s?.gamesPlayed ?? 0;
  const won = s?.gamesWon ?? 0;
  const losses = Math.max(0, played - won);
  const winPct = played > 0 ? Math.round((won / played) * 100) : 0;
  const avgScore = won > 0 ? Math.round((s?.totalScore ?? 0) / won) : 0;
  const avgSolve = won > 0 ? Math.round((s?.totalSolveSeconds ?? 0) / won) : 0;

  const favorite = DIFFICULTY_ORDER.reduce<{ d: Difficulty; n: number } | null>(
    (best, d) => {
      const n = s?.playsByDifficulty?.[d] ?? 0;
      if (n > 0 && (!best || n > best.n)) return { d, n };
      return best;
    },
    null,
  );

  const fastestDifficulty =
    s?.fastestSolveSeconds != null
      ? (DIFFICULTY_ORDER.find(
          (d) => s.bestTimeByDifficulty?.[d] === s.fastestSolveSeconds,
        ) ?? null)
      : null;

  return (
    <div className="flex flex-col gap-4">
      {/* Greeting + profile */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => setEditing((v) => !v)}
          className="shrink-0 rounded-full transition active:scale-95"
          aria-label="Edit profile"
        >
          <DogAvatar dogId={profile.dogId} size={56} ringColor="#3b82f6" />
        </button>
        <div className="min-w-0">
          <div className="text-sm text-[var(--muted)]">Here are your stats,</div>
          <div className="font-display truncate text-xl font-extrabold text-[var(--foreground)]">
            {profile.name}
          </div>
        </div>
        <button
          type="button"
          onClick={() => setEditing((v) => !v)}
          className="ml-auto rounded-full bg-white px-4 py-2 text-sm font-bold text-[var(--paw)] shadow-sm transition active:scale-95"
        >
          {editing ? "Done" : "Edit"}
        </button>
      </div>

      {editing && (
        <div className="animate-float-in flex flex-col items-center gap-3 rounded-3xl bg-white p-4 shadow-sm">
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
      )}

      {/* Wins / Losses */}
      <div className="rounded-3xl bg-white p-5 shadow-sm">
        <div className="mb-2 flex items-center gap-2">
          <span className="text-[var(--primary)]">
            <TrophyIcon width={20} height={20} />
          </span>
          <span className="text-sm font-semibold text-[var(--muted)]">
            {winPct}% win rate
          </span>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-center">
            <div className="font-display text-3xl font-extrabold text-[var(--foreground)]">
              {won}
            </div>
            <div className="text-xs font-semibold text-[var(--muted)]">Wins</div>
          </div>
          <div className="h-3 flex-1 overflow-hidden rounded-full bg-[var(--surface-soft)]">
            <div
              className="h-full rounded-full bg-[var(--primary)] transition-all"
              style={{ width: `${winPct}%` }}
            />
          </div>
          <div className="text-center">
            <div className="font-display text-3xl font-extrabold text-[var(--muted)]">
              {losses}
            </div>
            <div className="text-xs font-semibold text-[var(--muted)]">Losses</div>
          </div>
        </div>
      </div>

      {/* Core stats */}
      <div className="grid grid-cols-3 gap-3">
        <BigStat label="Avg Score" value={avgScore.toLocaleString()} />
        <BigStat label="Best Score" value={(s?.bestScore ?? 0).toLocaleString()} />
        <BigStat label="Solved" value={String(won)} />
      </div>
      <div className="grid grid-cols-3 gap-3">
        <BigStat label="Day Streak" value={String(s?.streak ?? 0)} />
        <BigStat label="Best Streak" value={String(s?.bestStreak ?? 0)} />
        <BigStat label="Perfect" value={String(s?.perfectGames ?? 0)} />
      </div>

      {/* Highlights */}
      <div className="grid grid-cols-2 gap-3">
        <HighlightCard
          icon={<ClockIcon width={20} height={20} />}
          title="Fastest Solve"
          value={
            s?.fastestSolveSeconds != null
              ? formatTime(s.fastestSolveSeconds)
              : "--:--"
          }
          subtitle={
            won > 0
              ? `${fastestDifficulty ? DIFFICULTY_LABELS[fastestDifficulty] : "Solo"} · avg ${formatTime(avgSolve)}`
              : "No wins yet"
          }
        />
        <HighlightCard
          icon={<TargetIcon width={20} height={20} />}
          title="Favorite"
          value={favorite ? DIFFICULTY_LABELS[favorite.d] : "—"}
          subtitle={favorite ? `${favorite.n} games` : "Play to unlock"}
          accent={favorite ? DIFFICULTY_COLORS[favorite.d] : undefined}
        />
      </div>

      {/* Best times by difficulty */}
      <div className="rounded-3xl bg-white p-4 shadow-sm">
        <h3 className="font-display mb-3 font-bold text-[var(--foreground)]">
          Best Times
        </h3>
        <div className="flex flex-col gap-2.5">
          {DIFFICULTY_ORDER.map((d) => {
            const t = s?.bestTimeByDifficulty?.[d];
            return (
              <div key={d} className="flex items-center gap-3">
                <span
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: DIFFICULTY_COLORS[d] }}
                />
                <span className="text-sm font-semibold text-[var(--foreground)]">
                  {DIFFICULTY_LABELS[d]}
                </span>
                <span className="ml-auto font-display font-bold text-[var(--foreground)]">
                  {t != null ? formatTime(t) : "--:--"}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <p className="px-2 text-center text-xs text-[var(--muted)]">
        Only solo games count toward your stats — multiplayer is just for fun. 🐾
      </p>

      {played > 0 && (
        <button
          type="button"
          onClick={() => {
            if (confirm("Reset all your stats? This can't be undone.")) onReset();
          }}
          className="mx-auto text-xs font-semibold text-[var(--muted)] underline underline-offset-2"
        >
          Reset stats
        </button>
      )}
    </div>
  );
}

function BigStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-white p-3 text-center shadow-sm">
      <div className="font-display text-xl font-extrabold leading-tight text-[var(--foreground)]">
        {value}
      </div>
      <div className="text-[11px] font-semibold leading-tight text-[var(--muted)]">
        {label}
      </div>
    </div>
  );
}

function HighlightCard({
  icon,
  title,
  value,
  subtitle,
  accent,
}: {
  icon: React.ReactNode;
  title: string;
  value: string;
  subtitle: string;
  accent?: string;
}) {
  return (
    <div className="rounded-2xl bg-white p-4 shadow-sm">
      <div className="mb-1 flex items-center gap-1.5 text-[var(--muted)]">
        <span style={{ color: accent ?? "var(--primary)" }}>{icon}</span>
        <span className="text-xs font-semibold">{title}</span>
      </div>
      <div
        className="font-display text-2xl font-extrabold leading-tight"
        style={{ color: accent ?? "var(--foreground)" }}
      >
        {value}
      </div>
      <div className="text-xs text-[var(--muted)]">{subtitle}</div>
    </div>
  );
}
