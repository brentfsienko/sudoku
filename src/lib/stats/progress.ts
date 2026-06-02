import { DIFFICULTY_RANK, type GameLog } from "./types";

export type Metric = "games" | "time" | "mistakes" | "climb";

export const METRICS: { id: Metric; label: string }[] = [
  { id: "games", label: "Games" },
  { id: "time", label: "Time" },
  { id: "mistakes", label: "Mistakes" },
  { id: "climb", label: "Climb" },
];

/** Per-game contribution to a metric. */
export function metricValue(log: GameLog, metric: Metric): number {
  switch (metric) {
    case "games":
      return 1;
    case "time":
      return log.seconds;
    case "mistakes":
      return log.mistakes;
    case "climb":
      // Only summited puzzles count toward the climb.
      return log.won ? DIFFICULTY_RANK[log.difficulty] : 0;
  }
}

export function startOfWeekMs(ms: number): number {
  const d = new Date(ms);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - d.getDay()); // back to Sunday
  return d.getTime();
}

/** Ascending list of the last `count` week-start timestamps (incl. current). */
export function weekStarts(count = 12): number[] {
  const current = startOfWeekMs(Date.now());
  const out: number[] = [];
  for (let i = count - 1; i >= 0; i--) {
    const d = new Date(current);
    d.setDate(d.getDate() - i * 7);
    out.push(d.getTime());
  }
  return out;
}

/** Summed metric per week, aligned to `weekStarts(count)`. */
export function weeklySeries(
  history: GameLog[],
  metric: Metric,
  count = 12,
): number[] {
  const starts = weekStarts(count);
  const index = new Map(starts.map((s, i) => [s, i]));
  const series = new Array(count).fill(0);
  for (const log of history) {
    const wk = startOfWeekMs(log.t);
    const i = index.get(wk);
    if (i != null) series[i] += metricValue(log, metric);
  }
  return series;
}

export type PeriodTotals = {
  games: number;
  seconds: number;
  mistakes: number;
  climb: number;
};

export function totalsSince(history: GameLog[], sinceMs: number): PeriodTotals {
  const t: PeriodTotals = { games: 0, seconds: 0, mistakes: 0, climb: 0 };
  for (const log of history) {
    if (log.t < sinceMs) continue;
    t.games += 1;
    t.seconds += log.seconds;
    t.mistakes += log.mistakes;
    t.climb += log.won ? DIFFICULTY_RANK[log.difficulty] : 0;
  }
  return t;
}

export function thisWeekTotals(history: GameLog[]): PeriodTotals {
  return totalsSince(history, startOfWeekMs(Date.now()));
}

const MONTHS = [
  "JAN", "FEB", "MAR", "APR", "MAY", "JUN",
  "JUL", "AUG", "SEP", "OCT", "NOV", "DEC",
];

/** X-axis labels: a month abbreviation the first week each month appears. */
export function monthLabels(starts: number[]): (string | null)[] {
  let prev = -1;
  return starts.map((ms) => {
    const m = new Date(ms).getMonth();
    if (m !== prev) {
      prev = m;
      return MONTHS[m];
    }
    return null;
  });
}

export function formatDuration(seconds: number): string {
  if (seconds <= 0) return "0m";
  const h = Math.floor(seconds / 3600);
  const m = Math.round((seconds % 3600) / 60);
  if (h > 0) return m > 0 ? `${h}h ${m}m` : `${h}h`;
  if (m > 0) return `${m}m`;
  return `${seconds}s`;
}

/** Compact axis value for a metric's max gridline. */
export function formatMetric(value: number, metric: Metric): string {
  if (metric === "time") return formatDuration(value);
  return Math.round(value).toLocaleString();
}
