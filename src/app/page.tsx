"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { SignInGate } from "@/components/auth/SignInGate";
import { AppFrame } from "@/components/layout/AppFrame";
import { MobileAppRoot } from "@/components/layout/MobileAppRoot";
import { MainTab } from "@/components/home/MainTab";
import { TabScreenHeader } from "@/components/home/TabScreenHeader";
import { BottomNav, type HomeTab } from "@/components/home/BottomNav";
import { FriendsTab } from "@/components/home/FriendsTab";
import { AppSplash } from "@/components/AppSplash";
import { MeProfileHeader } from "@/components/profile/MeProfileHeader";
import { DogAvatar } from "@/components/DogAvatar";
import { ProgressChart } from "@/components/stats/ProgressChart";
import { WinLossBar } from "@/components/stats/WinLossBar";
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
import { useOnlineFriends } from "@/lib/friends/useOnlineFriends";
import { useNotifications } from "@/lib/friends/useNotifications";
import { usePushNotifications } from "@/lib/push/usePushNotifications";
import { PushPermissionPrompt } from "@/components/pwa/PushPermissionPrompt";
import { IosInstallCoach } from "@/components/pwa/IosInstallCoach";
import { useOnline } from "@/lib/hooks/useOnline";
import {
  getCoachmarkStep,
  advanceCoachmarkToAvatar,
  type CoachmarkStep,
} from "@/lib/onboarding";
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
  const router = useRouter();
  const [tab, setTab] = useState<HomeTab>("main");
  // Desired sub-tab when switching to the Friends tab from elsewhere.
  // FriendsTab remounts on tab switch, so it reads this as initialSubTab.
  const [friendsInitSubTab, setFriendsInitSubTab] = useState<"friends" | "daily">("friends");
  const [coachmarkStep, setCoachmarkStep] = useState<CoachmarkStep | null>(null);
  const [playReady, setPlayReady] = useState(false);

  useEffect(() => {
    setCoachmarkStep(getCoachmarkStep());
  }, []);

  // Deep-link from daily finish (and similar): /?tab=friends&sub=daily
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tabParam = params.get("tab");
    const subParam = params.get("sub");
    if (tabParam !== "main" && tabParam !== "friends" && tabParam !== "me") return;

    if (tabParam === "friends" && (subParam === "daily" || subParam === "friends")) {
      setFriendsInitSubTab(subParam);
    }
    setTab(tabParam);
    window.history.replaceState(null, "", "/");
  }, []);

  function handleTabChange(next: HomeTab) {
    if (next === "me" && coachmarkStep === "nav") {
      advanceCoachmarkToAvatar();
      setCoachmarkStep("avatar");
    }
    setTab(next);
  }

  const userData = useUserData();
  const data = userData.data;
  // Always-on presence: tracks from app mount regardless of active tab
  const onlineIds = useOnlineFriends(userData.user?.id ?? null);
  const online = useOnline();

  // Push notification subscription
  const push = usePushNotifications();
  const [showPushPrompt, setShowPushPrompt] = useState(false);

  // Real-time toasts for friend requests and game invites
  const handleGameInvite = useCallback(
    ({ roomCode }: { roomCode: string }) => {
      router.push(`/game/${roomCode}`);
    },
    [router],
  );
  useNotifications({
    userId: userData.user?.id ?? null,
    onRefresh: () => setTab((t) => t), // nudge friends tab to re-fetch on next mount
    onGameInvite: handleGameInvite,
    // Show the push permission prompt once when the first notification arrives
    // and the user hasn't granted permission yet
    onFirstNotification: () => {
      if (push.supported && push.permission === "default" && !push.subscribed) {
        setShowPushPrompt(true);
      }
    },
  });
  const statsForMe = data ?? emptyUserData();
  const [signInGateOpen, setSignInGateOpen] = useState(false);
  const statsReady = !userData.loading && !!data;

  // If we land on a non-play tab first, dismiss splash once stats are ready
  // (Play tab reports readiness itself via onReady).
  useEffect(() => {
    if (playReady || !statsReady || tab === "main") return;
    let cancelled = false;
    const id = requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        if (!cancelled) setPlayReady(true);
      });
    });
    return () => {
      cancelled = true;
      cancelAnimationFrame(id);
    };
  }, [playReady, statsReady, tab]);

  function requestSignIn() {
    if (!online) return;
    setSignInGateOpen(true);
  }

  useEffect(() => {
    if (!online) {
      setSignInGateOpen(false);
      return;
    }
    if (
      !userData.loading &&
      userData.authConfigured &&
      !userData.user &&
      !hasAuthIntroCompleted()
    ) {
      setSignInGateOpen(true);
    }
  }, [userData.loading, userData.authConfigured, userData.user, online]);

  return (
    <>
      <SignInGate
        open={signInGateOpen}
        userData={userData}
        onClose={() => setSignInGateOpen(false)}
      />
      {showPushPrompt && (
        <PushPermissionPrompt
          onAllow={async () => {
            setShowPushPrompt(false);
            if (userData.user) await push.subscribe(userData.user.id);
          }}
          onDismiss={() => setShowPushPrompt(false)}
        />
      )}
      <IosInstallCoach
        ready={playReady && !signInGateOpen && !coachmarkStep && !userData.loading}
        accountSeen={Boolean(userData.data?.installCoachPathSeen)}
      />
      <AppSplash ready={playReady} />
    <MobileAppRoot>
      <AppFrame variant={tab === "main" ? "accent" : "background"}>
        <main
          className={`flex min-h-0 flex-1 flex-col overflow-hidden ${
            tab === "main" ? "bg-[var(--accent)]" : "bg-[var(--background)]"
          }`}
        >
          {(tab === "main" || !playReady) && (
            <div
              className={
                tab === "main"
                  ? "flex min-h-0 flex-1 flex-col overflow-hidden"
                  : "pointer-events-none invisible absolute inset-0"
              }
              aria-hidden={tab !== "main"}
            >
              <MainTab
                data={statsForMe}
                userData={userData}
                onSignIn={requestSignIn}
                onReady={() => setPlayReady(true)}
                onViewDailyLeaderboard={() => {
                  setFriendsInitSubTab("daily");
                  setTab("friends");
                }}
              />
            </div>
          )}

          {tab === "friends" && (
            <div
              className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto bg-[var(--background)] px-5 pb-6"
              style={{ paddingTop: "calc(env(safe-area-inset-top) + 1.25rem)" }}
            >
              <FriendsTab
                userData={userData}
                onSignIn={requestSignIn}
                initialSubTab={friendsInitSubTab}
                onlineIds={onlineIds}
              />
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
                onSignIn={requestSignIn}
                coachmarkStep={coachmarkStep}
                onCoachmarkDismiss={() => setCoachmarkStep(null)}
              />
            )}
            </div>
          )}
        </main>
        <BottomNav active={tab} onChange={handleTabChange} variant="inline" coachmarkStep={coachmarkStep} />
      </AppFrame>
      <BottomNav active={tab} onChange={handleTabChange} variant="dock" coachmarkStep={coachmarkStep} />
    </MobileAppRoot>
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
  coachmarkStep,
  onCoachmarkDismiss,
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
  coachmarkStep?: import("@/lib/onboarding").CoachmarkStep | null;
  onCoachmarkDismiss?: () => void;
}) {
  const { profile, solo, multi, history } = data;
  const [statsTab, setStatsTab] = useState<"solo" | "multi">("solo");
  const coop = coopWinLoss(multi);
  const versus = compWinLoss(multi);
  const lifetime = lifetimeSquares({
    profile,
    solo,
    multi,
    history,
    bones: data.bones,
    ownedExclusiveDogs: userData.data?.ownedExclusiveDogs ?? [],
  });

  return (
    <div className="flex flex-col gap-5">
      <MeProfileHeader
        profile={profile}
        history={history}
        soloStreak={solo.streak}
        bones={data.bones ?? 0}
        userData={userData}
        onSignIn={onSignIn}
        coachmarkStep={coachmarkStep}
        onCoachmarkDismiss={onCoachmarkDismiss}
      />

      <div className="flex rounded-2xl border border-[var(--border)] bg-[var(--surface-soft)] p-1">
        {(
          [
            { id: "solo", label: "Solo" },
            { id: "multi", label: "Multiplayer" },
          ] as const
        ).map((t) => {
          const active = statsTab === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setStatsTab(t.id)}
              className={`font-display flex-1 rounded-xl py-2.5 text-sm font-bold transition active:scale-[0.98] ${
                active
                  ? "bg-white text-[var(--foreground)] shadow-sm"
                  : "text-[var(--muted)]"
              }`}
            >
              {t.label}
            </button>
          );
        })}
      </div>

      {statsTab === "solo" ? (
        <>
          <SoloSection solo={solo} />
          <ProgressSection
            history={history}
            lifetimeSquares={lifetime}
            scope="solo"
          />
        </>
      ) : (
        <>
          <div className="flex flex-col gap-5">
            <WinLossBar
              {...coop}
              title={GAME_MODE_LABELS.coop}
              subtitle={
                coop.played > 0
                  ? `${coop.wins} solved · ${coop.played} played`
                  : "No games yet"
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
          <CoopSection multi={multi} />
          <VersusSection multi={multi} />
          <ProgressSection
            history={history}
            lifetimeSquares={lifetime}
            scope="multi"
          />
        </>
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

const MULTI_HISTORY_FILTERS = HISTORY_FILTERS.filter(
  (f) => f.id === "all" || f.id === "coop" || f.id === "competitive",
);

function ProgressSection({
  history,
  lifetimeSquares: lifetimeTotal,
  scope,
}: {
  history: GameLog[];
  lifetimeSquares: number;
  scope: "solo" | "multi";
}) {
  const [metric, setMetric] = useState<Metric>("games");
  const [historyFilter, setHistoryFilter] = useState<HistoryFilter>(
    scope === "solo" ? "solo" : "all",
  );
  const [selectedWeek, setSelectedWeek] = useState<number | null>(null);

  useEffect(() => {
    setHistoryFilter(scope === "solo" ? "solo" : "all");
    setSelectedWeek(null);
  }, [scope]);

  const scopedHistory = useMemo(() => {
    if (scope === "solo") return filterHistory(history, "solo");
    return history.filter(
      (log) => log.mode === "coop" || log.mode === "competitive",
    );
  }, [history, scope]);

  const filteredHistory = useMemo(() => {
    if (scope === "solo") return scopedHistory;
    if (historyFilter === "all") return scopedHistory;
    return filterHistory(scopedHistory, historyFilter);
  }, [scopedHistory, scope, historyFilter]);

  const starts = useMemo(() => weekStarts(12), []);
  const series = useMemo(
    () => weeklySeries(filteredHistory, metric, 12),
    [filteredHistory, metric],
  );
  const week = useMemo(() => thisWeekTotals(filteredHistory), [filteredHistory]);

  const selectedWeekTotals = useMemo(() => {
    if (selectedWeek === null) return null;
    const startMs = starts[selectedWeek];
    const endMs = startMs + 7 * 24 * 60 * 60 * 1000;
    const t = { games: 0, seconds: 0, squares: 0 };
    for (const log of filteredHistory) {
      if (log.t >= startMs && log.t < endMs) {
        t.games += 1;
        t.seconds += log.seconds;
        t.squares += log.squares ?? 0;
      }
    }
    return t;
  }, [selectedWeek, starts, filteredHistory]);

  const chartColor =
    MULTI_HISTORY_FILTERS.find((f) => f.id === historyFilter)?.color ??
    (scope === "solo" ? "#a06bd6" : METRIC_COLORS[metric]);
  const color =
    scope === "multi" && historyFilter !== "all"
      ? chartColor
      : scope === "solo"
        ? "#a06bd6"
        : METRIC_COLORS[metric];

  const displayWeek = selectedWeekTotals ?? week;
  const weekLabel = selectedWeek !== null
    ? (() => {
        const d = new Date(starts[selectedWeek]);
        return `Week of ${d.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`;
      })()
    : "This week";

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

      {scope === "multi" && (
        <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
          {MULTI_HISTORY_FILTERS.map((f) => {
            const active = f.id === historyFilter;
            return (
              <button
                key={f.id}
                type="button"
                onClick={() => {
                  setHistoryFilter(f.id);
                  setSelectedWeek(null);
                }}
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
      )}

      {/* Week stats — changes when a week is selected in the chart */}
      <div className="flex items-center justify-between">
        <div className="font-display text-sm font-extrabold text-[var(--foreground)]">
          {weekLabel}
        </div>
        {selectedWeek !== null && (
          <button
            type="button"
            onClick={() => setSelectedWeek(null)}
            className="text-xs font-semibold text-[var(--muted)] underline underline-offset-2"
          >
            Clear
          </button>
        )}
      </div>
      <div className="grid grid-cols-3 gap-2">
        <WeekStat label="Games" value={displayWeek.games.toLocaleString()} />
        <WeekStat label="Time" value={formatDuration(displayWeek.seconds)} />
        <WeekStat label="Squares" value={displayWeek.squares.toLocaleString()} />
      </div>
      {metric === "squares" && selectedWeek === null && (
        <p className="text-xs font-semibold text-[var(--muted)]">
          {lifetimeTotal.toLocaleString()} lifetime · chart shows squares per week
        </p>
      )}

      <div className="pt-1 text-[11px] font-semibold uppercase tracking-wide text-[var(--muted)]">
        Past 12 weeks · tap a week to inspect
      </div>
      <ProgressChart
        series={series}
        starts={starts}
        metric={metric}
        color={color}
        selectedIndex={selectedWeek}
        onSelect={setSelectedWeek}
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
