"use client";

import { useEffect, useMemo, useState } from "react";
import { SignInGate } from "@/components/auth/SignInGate";
import { AppFrame } from "@/components/layout/AppFrame";
import { MainTab } from "@/components/home/MainTab";
import { TabScreenHeader } from "@/components/home/TabScreenHeader";
import { BottomNav, type HomeTab } from "@/components/home/BottomNav";
import { FriendsTab } from "@/components/home/FriendsTab";
import { MeProfileHeader } from "@/components/profile/MeProfileHeader";
import { DogAvatar } from "@/components/DogAvatar";
import { ProgressChart } from "@/components/stats/ProgressChart";
import {
  ChartIcon,
  ClockIcon,
  PawIcon,
  TargetIcon,
  TrophyIcon,
  UserIcon,
} from "@/components/icons";
import { DIFFICULTY_LABELS, GAME_MODE_LABELS, type Difficulty } from "@/lib/game/types";
import type { DogId } from "@/lib/theme/dogs";
import { formatTime } from "@/lib/game/scoring";
import { hasAuthIntroCompleted } from "@/lib/auth/onboarding";
import { useUserData } from "@/lib/stats/useUserData";
import {
  COOP_ACCENT,
  VERSUS_ACCENT,
  compWinLoss,
  coopWinLoss,
  filterHistory,
  mostPlayedOpponentForMode,
  opponentModeGames,
  type HistoryFilter,
} from "@/lib/stats/multi";
import {
  emptyUserData,
  lifetimeSquares,
  type GameLog,
  type MultiStats,
  type OpponentRecord,
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

export default function Home() {
  const [tab, setTab] = useState<HomeTab>("main");

  const userData = useUserData();
  const data = userData.data;
  const statsForMe = data ?? emptyUserData();
  const [signInGateOpen, setSignInGateOpen] = useState(false);

  useEffect(() => {
    if (
      !userData.loading &&
      userData.authConfigured &&
      !userData.user &&
      !hasAuthIntroCompleted()
    ) {
      setSignInGateOpen(true);
    }
  }, [userData.loading, userData.authConfigured, userData.user]);

  return (
    <>
      <SignInGate
        open={signInGateOpen}
        userData={userData}
        onClose={() => setSignInGateOpen(false)}
      />
    <AppFrame variant={tab === "main" ? "accent" : "background"}>
      <main
        className={`flex min-h-0 flex-1 flex-col overflow-hidden max-md:pb-[calc(4.25rem+env(safe-area-inset-bottom,0px))] md:pb-0 ${
          tab === "main" ? "bg-[var(--accent)]" : "bg-[var(--background)]"
        }`}
      >
        {tab === "main" && (
          <MainTab
            data={statsForMe}
            userData={userData}
            onSignIn={() => setSignInGateOpen(true)}
          />
        )}

        {tab === "friends" && (
          <div
            className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto bg-[var(--background)] px-5 pb-6"
            style={{ paddingTop: "calc(env(safe-area-inset-top) + 1.25rem)" }}
          >
            <FriendsTab userData={userData} onSignIn={() => setSignInGateOpen(true)} />
          </div>
        )}

        {tab === "me" && (
          <div
            className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto bg-[var(--background)] px-5 pb-6"
            style={{ paddingTop: "calc(env(safe-area-inset-top) + 1.25rem)" }}
          >
          {userData.loading ? (
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
                bones: statsForMe.bones ?? 0,
              }}
              userData={userData}
              onSignIn={() => setSignInGateOpen(true)}
            />
          )}
          </div>
        )}
      </main>
      <BottomNav active={tab} onChange={setTab} variant="inline" />
    </AppFrame>
    <BottomNav active={tab} onChange={setTab} variant="fixed" />
    </>
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
  onSignIn,
}: {
  data: {
    profile: Profile;
    solo: SoloStats;
    multi: MultiStats;
    history: GameLog[];
    bones: number;
  };
  userData: ReturnType<typeof useUserData>;
  onSignIn: () => void;
}) {
  const { profile, solo, multi, history } = data;

  const totalGames = solo.played + multi.coopPlayed + multi.compPlayed;

  return (
    <div className="flex flex-col gap-5">
      <MeProfileHeader
        profile={profile}
        multi={multi}
        soloStreak={solo.streak}
        bones={data.bones ?? 0}
        userData={userData}
        onSignIn={onSignIn}
      />

      {/* Progress */}
      <ProgressSection
        history={history}
        lifetimeSquares={lifetimeSquares({
          profile,
          solo,
          multi,
          history,
          bones: data.bones,
          ownedExclusiveDogs: userData.data?.ownedExclusiveDogs ?? [],
        })}
      />

      {/* Multiplayer details */}
      <CoopSection multi={multi} />
      <VersusSection multi={multi} />

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

const METRIC_COLORS: Record<Metric, string> = {
  games: "#f4a259",
  time: "#4ea1a3",
  squares: "#7c6fdc",
};

const HISTORY_FILTERS: { id: HistoryFilter; label: string; color: string }[] = [
  { id: "all", label: "All", color: METRIC_COLORS.games },
  { id: "coop", label: GAME_MODE_LABELS.coop, color: COOP_ACCENT },
  { id: "competitive", label: "Versus", color: VERSUS_ACCENT },
  { id: "solo", label: "Solo", color: "#a06bd6" },
];

function ProgressSection({
  history,
  lifetimeSquares: lifetimeTotal,
}: {
  history: GameLog[];
  lifetimeSquares: number;
}) {
  const [metric, setMetric] = useState<Metric>("games");
  const [historyFilter, setHistoryFilter] = useState<HistoryFilter>("all");
  const filteredHistory = useMemo(
    () => filterHistory(history, historyFilter),
    [history, historyFilter],
  );
  const starts = useMemo(() => weekStarts(12), []);
  const series = useMemo(
    () => weeklySeries(filteredHistory, metric, 12),
    [filteredHistory, metric],
  );
  const week = useMemo(() => thisWeekTotals(filteredHistory), [filteredHistory]);
  const chartColor =
    HISTORY_FILTERS.find((f) => f.id === historyFilter)?.color ?? METRIC_COLORS[metric];
  const color = historyFilter === "all" ? METRIC_COLORS[metric] : chartColor;

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

      <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
        {HISTORY_FILTERS.map((f) => {
          const active = f.id === historyFilter;
          return (
            <button
              key={f.id}
              type="button"
              onClick={() => setHistoryFilter(f.id)}
              className="shrink-0 rounded-full border-2 px-3 py-1 text-xs font-bold transition active:scale-95"
              style={{
                borderColor: active ? f.color : "var(--border)",
                backgroundColor: active ? f.color : "transparent",
                color: active ? "#fff" : "var(--muted)",
              }}
            >
              {f.label}
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
        <WeekStat label="Squares" value={week.squares.toLocaleString()} />
      </div>
      {metric === "squares" && (
        <p className="text-xs font-semibold text-[var(--muted)]">
          {lifetimeTotal.toLocaleString()} lifetime · chart shows squares per week
        </p>
      )}

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

function CoopSection({ multi }: { multi: MultiStats }) {
  const coop = coopWinLoss(multi);
  const top = mostPlayedOpponentForMode(multi, "coop");

  return (
    <section className="flex flex-col gap-3 border-t border-[var(--border)] pt-5">
      <SectionHeader
        icon={<PawIcon width={18} height={18} />}
        title={GAME_MODE_LABELS.coop}
        trailing={`${coop.played} games`}
        accent={COOP_ACCENT}
      />

      <StatGrid
        items={[
          { value: `${coop.wins}/${coop.played}`, label: "Solved" },
          { value: `${coop.winPct}%`, label: "Solve Rate" },
          { value: multi.coopSquares.toLocaleString(), label: "Squares Filled" },
        ]}
      />

      <OpponentHighlight
        top={top}
        mode="coop"
        emptyMessage="Play co-op with a friend to track your puzzle partners. 🐶🐶"
      />
    </section>
  );
}

function VersusSection({ multi }: { multi: MultiStats }) {
  const versus = compWinLoss(multi);
  const top = mostPlayedOpponentForMode(multi, "competitive");

  return (
    <section className="flex flex-col gap-3 border-t border-[var(--border)] pt-5">
      <SectionHeader
        icon={<TrophyIcon width={18} height={18} />}
        title={GAME_MODE_LABELS.competitive}
        trailing={`${versus.played} games`}
        accent={VERSUS_ACCENT}
      />

      <StatGrid
        items={[
          { value: versus.record, label: "W-L-T" },
          { value: String(versus.wins), label: "Wins" },
          { value: multi.compSquares.toLocaleString(), label: "Squares Filled" },
        ]}
      />

      <OpponentHighlight
        top={top}
        mode="competitive"
        emptyMessage="Challenge a friend head-to-head to see your rival stats. 🏆"
      />
    </section>
  );
}

function OpponentHighlight({
  top,
  mode,
  emptyMessage,
}: {
  top: OpponentRecord | null;
  mode: "coop" | "competitive";
  emptyMessage: string;
}) {
  const games = top ? opponentModeGames(top, mode) : 0;
  const label = mode === "coop" ? "Top co-op partner" : "Top rival";

  return (
    <>
      <div className="flex items-center gap-1.5 pt-1 text-[var(--muted)]">
        <UserIcon width={15} height={15} />
        <span className="text-xs font-bold uppercase tracking-wide">{label}</span>
      </div>
      {top && games > 0 ? (
        <div className="flex items-center gap-3 rounded-2xl bg-[var(--surface-soft)] p-3">
          <DogAvatar dogId={top.dogId as DogId} size={44} />
          <div className="min-w-0 flex-1">
            <div className="font-display truncate font-bold text-[var(--foreground)]">
              {top.name}
            </div>
            <div className="text-xs text-[var(--muted)]">
              {games} {games === 1 ? "game" : "games"}{" "}
              {mode === "coop" ? "together" : "versus"}
            </div>
          </div>
          {mode === "competitive" && (
            <div className="text-right">
              <div className="font-display text-lg font-extrabold text-[var(--foreground)]">
                {top.compWins}-{Math.max(0, top.compGames - top.compWins)}
              </div>
              <div className="text-[11px] font-semibold uppercase tracking-wide text-[var(--muted)]">
                vs them
              </div>
            </div>
          )}
        </div>
      ) : (
        <p className="rounded-2xl bg-[var(--surface-soft)] p-3 text-center text-sm text-[var(--muted)]">
          {emptyMessage}
        </p>
      )}
    </>
  );
}

function SectionHeader({
  icon,
  title,
  trailing,
  accent,
}: {
  icon: React.ReactNode;
  title: string;
  trailing?: string;
  accent?: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <span style={{ color: accent ?? "var(--primary)" }}>{icon}</span>
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
