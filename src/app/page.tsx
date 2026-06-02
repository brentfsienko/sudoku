"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { DifficultySelect } from "@/components/home/DifficultySelect";
import { ModeSelect } from "@/components/home/ModeSelect";
import { BottomNav, type HomeTab } from "@/components/home/BottomNav";
import { FriendsTab } from "@/components/home/FriendsTab";
import { DogAvatar } from "@/components/DogAvatar";
import { ProgressChart } from "@/components/stats/ProgressChart";
import { WinLossBar } from "@/components/stats/WinLossBar";
import {
  ChartIcon,
  ClockIcon,
  FlameIcon,
  PawIcon,
  TargetIcon,
  TrophyIcon,
  UserIcon,
} from "@/components/icons";
import { multiWinLoss } from "@/lib/friends/api";
import { DIFFICULTY_LABELS, type Difficulty, type GameMode } from "@/lib/game/types";
import { DOGS, type DogId } from "@/lib/theme/dogs";
import { formatTime } from "@/lib/game/scoring";
import { useUserData } from "@/lib/stats/useUserData";
import {
  emptyUserData,
  mostPlayedOpponent,
  type GameLog,
  type MultiStats,
  type Profile,
  type SoloStats,
} from "@/lib/stats/types";
import {
  formatDuration,
  METRICS,
  thisWeekTotals,
  weeklySeries,
  weekStarts,
  type Metric,
} from "@/lib/stats/progress";

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
  const [mode, setMode] = useState<GameMode>("coop");
  const [joinCode, setJoinCode] = useState("");

  const userData = useUserData();
  const data = userData.data;
  const statsForMe = data ?? emptyUserData();

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

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-1 flex-col bg-[var(--background)]">
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
            {data?.solo.streak ?? 0}
          </span>
        </div>
      </header>

      <main className="flex flex-1 flex-col gap-4 px-5 pb-6">
        {tab === "main" && (
          <>
            <div className="flex items-center justify-between rounded-3xl bg-gradient-to-br from-[var(--primary-soft)] to-[var(--surface-soft)] px-5 py-4">
              <div>
                <div className="text-sm font-semibold text-[var(--paw)]">
                  Multiplayer record
                </div>
                <div className="font-display text-3xl font-extrabold text-[var(--foreground)]">
                  {data
                    ? (() => {
                        const m = multiWinLoss(data.multi);
                        return `${m.wins}-${m.losses}`;
                      })()
                    : "0-0"}
                </div>
                <div className="text-xs font-semibold text-[var(--muted)]">
                  wins · losses
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
                className="font-display mt-1 rounded-full border-2 border-[var(--border)] bg-white py-4 text-xl font-extrabold text-[var(--foreground)] transition active:scale-[0.98]"
              >
                Solo Practice
              </button>
            ) : (
              <div className="mt-1 flex flex-col gap-3 rounded-3xl bg-white p-4 shadow-sm">
                <p className="text-center text-sm text-[var(--muted)]">
                  Create a room and share the code, invite from the Friends tab,
                  or join a friend&apos;s game.
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

        {tab === "friends" && <FriendsTab userData={userData} />}

        {tab === "me" &&
          (userData.loading ? (
            <div className="flex flex-1 items-center justify-center">
              <span className="font-display animate-pulse text-[var(--muted)]">
                Loading your stats… 🐾
              </span>
            </div>
          ) : (
            <MeTab
              data={{
                profile: statsForMe.profile,
                solo: statsForMe.solo,
                multi: statsForMe.multi,
                history: statsForMe.history,
              }}
              userData={userData}
            />
          ))}
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
  data,
  userData,
}: {
  data: { profile: Profile; solo: SoloStats; multi: MultiStats; history: GameLog[] };
  userData: ReturnType<typeof useUserData>;
}) {
  const [editing, setEditing] = useState(false);
  const { profile, solo, multi, history } = data;

  const totalGames = solo.played + multi.coopPlayed + multi.compPlayed;

  return (
    <div className="flex flex-col gap-5">
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
            onChange={(e) => void userData.updateProfile({ name: e.target.value.slice(0, 16) })}
            className="font-display w-full rounded-2xl border-2 border-[var(--border)] bg-[var(--background)] px-4 py-2.5 text-center text-lg font-bold outline-none focus:border-[var(--primary)]"
            placeholder="Your name"
          />
          <div className="grid grid-cols-4 gap-2">
            {DOGS.map((d) => (
              <button
                key={d.id}
                type="button"
                onClick={() => void userData.updateProfile({ dogId: d.id as DogId })}
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

      {/* Account / sync */}
      <AccountCard userData={userData} />

      {/* Multiplayer win/loss — top of stats (Crossplay-style) */}
      <WinLossBar {...multiWinLoss(multi)} />

      {/* Progress */}
      <ProgressSection history={history} />

      {/* Multiplayer details */}
      <MultiSection multi={multi} />

      {/* Solo */}
      <SoloSection solo={solo} />

      {totalGames > 0 && (
        <button
          type="button"
          onClick={() => {
            if (confirm("Reset all your stats? This can't be undone."))
              void userData.reset();
          }}
          className="mx-auto text-xs font-semibold text-[var(--muted)] underline underline-offset-2"
        >
          Reset stats
        </button>
      )}
    </div>
  );
}

function AccountCard({ userData }: { userData: ReturnType<typeof useUserData> }) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  if (!userData.authConfigured) {
    return (
      <div className="rounded-3xl bg-[var(--surface-soft)] p-4 text-center text-xs text-[var(--muted)]">
        Stats are saved on this device. Add Supabase keys to enable cloud sync
        across devices.
      </div>
    );
  }

  if (userData.user) {
    return (
      <div className="flex items-center gap-3 rounded-3xl bg-white p-4 shadow-sm">
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--primary-soft)] text-[var(--primary)]">
          <UserIcon width={18} height={18} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="text-xs font-semibold text-[var(--muted)]">
            Synced across devices
          </div>
          <div className="truncate text-sm font-bold text-[var(--foreground)]">
            {userData.user.email ?? "Signed in"}
          </div>
        </div>
        <button
          type="button"
          onClick={() => void userData.signOut()}
          className="rounded-full bg-[var(--surface-soft)] px-3 py-1.5 text-xs font-bold text-[var(--paw)] active:scale-95"
        >
          Sign out
        </button>
      </div>
    );
  }

  async function send() {
    setStatus("sending");
    setError(null);
    const res = await userData.signIn(email);
    if (res.ok) setStatus("sent");
    else {
      setStatus("error");
      setError(res.error ?? "Something went wrong.");
    }
  }

  return (
    <div className="flex flex-col gap-2 rounded-3xl bg-white p-4 shadow-sm">
      <div className="text-sm font-bold text-[var(--foreground)]">
        Save your stats across devices
      </div>
      {status === "sent" ? (
        <p className="text-sm text-[var(--muted)]">
          Check your email for a magic link to finish signing in. ✉️
        </p>
      ) : (
        <>
          <div className="flex items-center gap-2">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@email.com"
              className="w-full rounded-full border-2 border-[var(--border)] bg-[var(--background)] px-4 py-2.5 text-sm outline-none focus:border-[var(--primary)]"
            />
            <button
              type="button"
              onClick={send}
              disabled={status === "sending"}
              className="font-display shrink-0 rounded-full bg-[var(--primary)] px-4 py-2.5 text-sm font-extrabold text-white active:scale-95 disabled:opacity-60"
            >
              {status === "sending" ? "…" : "Sign in"}
            </button>
          </div>
          {error && <p className="text-xs text-[#ef6f6c]">{error}</p>}
        </>
      )}
    </div>
  );
}

const METRIC_COLORS: Record<Metric, string> = {
  games: "#f4a259",
  time: "#4ea1a3",
  mistakes: "#ef6f6c",
};

function ProgressSection({ history }: { history: GameLog[] }) {
  const [metric, setMetric] = useState<Metric>("games");
  const starts = useMemo(() => weekStarts(12), []);
  const series = useMemo(
    () => weeklySeries(history, metric, 12),
    [history, metric],
  );
  const week = useMemo(() => thisWeekTotals(history), [history]);
  const color = METRIC_COLORS[metric];

  return (
    <section className="flex flex-col gap-3 border-t border-[var(--border)] pt-5">
      <SectionHeader
        icon={<ChartIcon width={18} height={18} />}
        title="Progress"
      />

      {/* Metric selector pills */}
      <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
        {METRICS.map((m) => {
          const active = m.id === metric;
          return (
            <button
              key={m.id}
              type="button"
              onClick={() => setMetric(m.id)}
              className="font-display shrink-0 rounded-full border-2 px-4 py-1.5 text-sm font-bold transition active:scale-95"
              style={{
                borderColor: active ? METRIC_COLORS[m.id] : "var(--border)",
                backgroundColor: active ? METRIC_COLORS[m.id] : "transparent",
                color: active ? "#fff" : "var(--muted)",
              }}
            >
              {m.label}
            </button>
          );
        })}
      </div>

      {/* This week */}
      <div className="font-display text-sm font-extrabold text-[var(--foreground)]">
        This week
      </div>
      <div className="grid grid-cols-3 gap-2">
        <WeekStat label="Games" value={week.games.toLocaleString()} />
        <WeekStat label="Time" value={formatDuration(week.seconds)} />
        <WeekStat label="Mistakes" value={week.mistakes.toLocaleString()} />
      </div>

      <div className="pt-1 text-[11px] font-semibold uppercase tracking-wide text-[var(--muted)]">
        Past 12 weeks
      </div>
      <ProgressChart
        series={series}
        starts={starts}
        metric={metric}
        color={color}
      />
    </section>
  );
}

function WeekStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <div className="font-display text-lg font-extrabold leading-tight text-[var(--foreground)]">
        {value}
      </div>
      <div className="text-[11px] font-semibold leading-tight text-[var(--muted)]">
        {label}
      </div>
    </div>
  );
}

function SoloSection({ solo }: { solo: SoloStats }) {
  const played = solo.played;
  const won = solo.won;
  const losses = Math.max(0, played - won);
  const winPct = played > 0 ? Math.round((won / played) * 100) : 0;
  const avgScore = won > 0 ? Math.round(solo.totalScore / won) : 0;
  const avgSolve = won > 0 ? Math.round(solo.totalSolveSeconds / won) : 0;

  const favorite = DIFFICULTY_ORDER.reduce<{ d: Difficulty; n: number } | null>(
    (best, d) => {
      const n = solo.playsByDifficulty?.[d] ?? 0;
      if (n > 0 && (!best || n > best.n)) return { d, n };
      return best;
    },
    null,
  );

  const fastestDifficulty =
    solo.fastestSolveSeconds != null
      ? (DIFFICULTY_ORDER.find(
          (d) => solo.bestTimeByDifficulty?.[d] === solo.fastestSolveSeconds,
        ) ?? null)
      : null;

  return (
    <section className="flex flex-col gap-3">
      <SectionHeader
        icon={<PawIcon width={18} height={18} />}
        title="Solo"
        trailing={`${winPct}% win rate`}
      />

      {/* Win / loss bar (flat) */}
      <div className="flex items-center gap-3">
        <div className="text-center">
          <div className="font-display text-2xl font-extrabold text-[var(--foreground)]">
            {won}
          </div>
          <div className="text-[11px] font-semibold uppercase tracking-wide text-[var(--muted)]">
            Wins
          </div>
        </div>
        <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-[var(--surface-soft)]">
          <div
            className="h-full rounded-full bg-[var(--primary)] transition-all"
            style={{ width: `${winPct}%` }}
          />
        </div>
        <div className="text-center">
          <div className="font-display text-2xl font-extrabold text-[var(--muted)]">
            {losses}
          </div>
          <div className="text-[11px] font-semibold uppercase tracking-wide text-[var(--muted)]">
            Losses
          </div>
        </div>
      </div>

      <StatGrid
        items={[
          { value: played.toLocaleString(), label: "Played" },
          { value: avgScore.toLocaleString(), label: "Avg Score" },
          { value: solo.bestScore.toLocaleString(), label: "Best Score" },
          { value: String(solo.streak), label: "Day Streak" },
          { value: String(solo.bestStreak), label: "Best Streak" },
          { value: String(solo.perfectGames), label: "Perfect" },
          {
            value:
              solo.fastestSolveSeconds != null
                ? formatTime(solo.fastestSolveSeconds)
                : "--:--",
            label: "Fastest",
          },
          {
            value: won > 0 ? formatTime(avgSolve) : "--:--",
            label: "Avg Time",
          },
          {
            value: favorite ? DIFFICULTY_LABELS[favorite.d] : "—",
            label: "Favorite",
          },
        ]}
      />

      {/* Best times by difficulty (flat list) */}
      <div className="flex flex-col gap-2.5 pt-1">
        <div className="flex items-center gap-1.5 text-[var(--muted)]">
          <ClockIcon width={15} height={15} />
          <span className="text-xs font-bold uppercase tracking-wide">
            Best Times
          </span>
          {fastestDifficulty && (
            <span className="ml-auto text-[11px] font-semibold text-[var(--muted)]">
              <TargetIcon width={12} height={12} className="mr-1 inline" />
              best on {DIFFICULTY_LABELS[fastestDifficulty]}
            </span>
          )}
        </div>
        {DIFFICULTY_ORDER.map((d) => {
          const t = solo.bestTimeByDifficulty?.[d];
          return (
            <div
              key={d}
              className="flex items-center gap-3 border-b border-[var(--border)] pb-2 last:border-b-0"
            >
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
    </section>
  );
}

function MultiSection({ multi }: { multi: MultiStats }) {
  const compGames = multi.compPlayed;
  const compRecord = `${multi.compWon}-${Math.max(
    0,
    compGames - multi.compWon - multi.compTied,
  )}-${multi.compTied}`;
  const top = mostPlayedOpponent(multi);

  return (
    <section className="flex flex-col gap-3 border-t border-[var(--border)] pt-5">
      <SectionHeader
        icon={<TrophyIcon width={18} height={18} />}
        title="Multiplayer"
        trailing={`${multi.coopPlayed + multi.compPlayed} games`}
      />

      <StatGrid
        items={[
          {
            value: `${multi.coopSolved}/${multi.coopPlayed}`,
            label: "Co-op Solved",
          },
          { value: compRecord, label: "Versus W-L-T" },
          { value: multi.totalSquares.toLocaleString(), label: "Squares Filled" },
        ]}
      />

      <div className="flex items-center gap-1.5 pt-1 text-[var(--muted)]">
        <UserIcon width={15} height={15} />
        <span className="text-xs font-bold uppercase tracking-wide">
          Most-Played Opponent
        </span>
      </div>
      {top ? (
        <div className="flex items-center gap-3 rounded-2xl bg-[var(--surface-soft)] p-3">
          <DogAvatar dogId={top.dogId as DogId} size={44} />
          <div className="min-w-0 flex-1">
            <div className="font-display truncate font-bold text-[var(--foreground)]">
              {top.name}
            </div>
            <div className="text-xs text-[var(--muted)]">
              {top.games} {top.games === 1 ? "game" : "games"} together
            </div>
          </div>
          <div className="text-right">
            <div className="font-display text-lg font-extrabold text-[var(--foreground)]">
              {top.wins}-{Math.max(0, top.games - top.wins)}
            </div>
            <div className="text-[11px] font-semibold uppercase tracking-wide text-[var(--muted)]">
              vs them
            </div>
          </div>
        </div>
      ) : (
        <p className="rounded-2xl bg-[var(--surface-soft)] p-3 text-center text-sm text-[var(--muted)]">
          Play a co-op or versus match to meet your rivals. 🐾
        </p>
      )}
    </section>
  );
}

function SectionHeader({
  icon,
  title,
  trailing,
}: {
  icon: React.ReactNode;
  title: string;
  trailing?: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-[var(--primary)]">{icon}</span>
      <h3 className="font-display text-lg font-extrabold text-[var(--foreground)]">
        {title}
      </h3>
      {trailing && (
        <span className="ml-auto text-xs font-semibold text-[var(--muted)]">
          {trailing}
        </span>
      )}
    </div>
  );
}

function StatGrid({ items }: { items: { value: string; label: string }[] }) {
  return (
    <div className="grid grid-cols-3 overflow-hidden rounded-3xl bg-white shadow-sm">
      {items.map((it, i) => (
        <div
          key={i}
          className="flex flex-col items-center justify-center gap-1 border-[var(--border)] px-2 py-4 [&:not(:nth-child(3n))]:border-r [&:nth-child(n+4)]:border-t"
        >
          <div className="font-display text-xl font-extrabold leading-tight text-[var(--foreground)]">
            {it.value}
          </div>
          <div className="text-[11px] font-semibold leading-tight text-[var(--muted)]">
            {it.label}
          </div>
        </div>
      ))}
    </div>
  );
}
