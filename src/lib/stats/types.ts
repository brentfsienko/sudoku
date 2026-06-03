import type { Difficulty } from "@/lib/game/types";
import type { DogId } from "@/lib/theme/dogs";
import { coerceProfile } from "./profile";

export type SoloStats = {
  played: number;
  won: number;
  bestScore: number;
  totalScore: number;
  totalSolveSeconds: number;
  fastestSolveSeconds: number | null;
  perfectGames: number;
  streak: number;
  bestStreak: number;
  lastPlayedDate: string | null;
  bestTimeByDifficulty: Partial<Record<Difficulty, number>>;
  playsByDifficulty: Partial<Record<Difficulty, number>>;
  totalSquares: number;
};

export type OpponentRecord = {
  name: string;
  dogId: string;
  games: number;
  wins: number;
  coopGames: number;
  compGames: number;
  compWins: number;
};

export type MultiStats = {
  coopPlayed: number;
  coopSolved: number;
  compPlayed: number;
  compWon: number;
  compTied: number;
  coopSquares: number;
  compSquares: number;
  /** @deprecated Migrated to coopSquares + compSquares on load. */
  totalSquares?: number;
  opponents: Record<string, OpponentRecord>;
};

export type Profile = {
  username: string;
  dogId: DogId;
};

/** One completed game, kept for the progress timeline. */
export type GameLog = {
  t: number; // epoch ms when finished
  mode: "solo" | "coop" | "competitive";
  won: boolean;
  seconds: number;
  mistakes: number;
  /** Correct cells filled by the player (all modes). */
  squares: number;
  difficulty: Difficulty;
  score: number;
  opponentName?: string;
  opponentDogId?: string;
  /** Competitive mode only. */
  tied?: boolean;
};

export type UserData = {
  profile: Profile;
  solo: SoloStats;
  multi: MultiStats;
  history: GameLog[];
};

/** "Elevation" analog: harder puzzles climb higher. */
export const DIFFICULTY_RANK: Record<Difficulty, number> = {
  easy: 1,
  medium: 2,
  hard: 3,
  expert: 4,
  master: 5,
};

const MAX_HISTORY = 1000;

function appendHistory(history: GameLog[], entry: GameLog): GameLog[] {
  const next = [...history, entry];
  return next.length > MAX_HISTORY
    ? next.slice(next.length - MAX_HISTORY)
    : next;
}

export function emptySolo(): SoloStats {
  return {
    played: 0,
    won: 0,
    bestScore: 0,
    totalScore: 0,
    totalSolveSeconds: 0,
    fastestSolveSeconds: null,
    perfectGames: 0,
    streak: 0,
    bestStreak: 0,
    lastPlayedDate: null,
    bestTimeByDifficulty: {},
    playsByDifficulty: {},
    totalSquares: 0,
  };
}

export function emptyMulti(): MultiStats {
  return {
    coopPlayed: 0,
    coopSolved: 0,
    compPlayed: 0,
    compWon: 0,
    compTied: 0,
    coopSquares: 0,
    compSquares: 0,
    opponents: {},
  };
}

/** Lifetime correct cells filled across solo, co-op, and versus. */
export function lifetimeSquares(data: UserData): number {
  return (
    data.solo.totalSquares + data.multi.coopSquares + data.multi.compSquares
  );
}

export function sumHistorySquares(history: GameLog[] | undefined): number {
  if (!Array.isArray(history)) return 0;
  return history.reduce((s, log) => s + (log.squares ?? 0), 0);
}

export function emptyUserData(profile?: Partial<Profile> & { name?: string }): UserData {
  return {
    profile: coerceProfile(profile),
    solo: emptySolo(),
    multi: emptyMulti(),
    history: [],
  };
}

/** Defensively fill any missing fields after loading from storage/remote. */
function normalizeOpponents(
  raw: MultiStats["opponents"] | undefined,
): MultiStats["opponents"] {
  if (!raw) return {};
  const out: MultiStats["opponents"] = {};
  for (const [key, rec] of Object.entries(raw)) {
    out[key] = {
      name: rec.name,
      dogId: rec.dogId,
      games: rec.games ?? 0,
      wins: rec.wins ?? 0,
      coopGames: rec.coopGames ?? 0,
      compGames: rec.compGames ?? 0,
      compWins: rec.compWins ?? 0,
    };
  }
  return out;
}

export function normalizeUserData(raw: Partial<UserData> | null | undefined): UserData {
  const base = emptyUserData();
  if (!raw) return base;
  const solo = { ...base.solo, ...raw.solo, totalSquares: raw.solo?.totalSquares ?? 0 };
  const multi = normalizeMulti(raw.multi);
  const history = backfillHistoryOpponents(
    backfillHistorySquares(normalizeHistory(raw.history), solo, multi),
    multi.opponents,
  );
  return {
    profile: coerceProfile({
      ...base.profile,
      ...(raw.profile as Partial<Profile> & { name?: string }),
    }),
    solo,
    multi: { ...multi, opponents: reconcileOpponents(multi.opponents, history) },
    history,
  };
}

function normalizeHistory(raw: GameLog[] | undefined): GameLog[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((log) => ({
    ...log,
    squares: log.squares ?? 0,
    tied: log.tied ?? false,
  }));
}

/** Match per-game history squares to stored lifetime totals (pre-tracking migration). */
function backfillHistorySquares(
  history: GameLog[],
  solo: SoloStats,
  multi: MultiStats,
): GameLog[] {
  if (history.length === 0) return history;

  const next = history.map((log) => ({ ...log }));

  const sumForMode = (mode: GameLog["mode"]) =>
    next
      .filter((l) => l.mode === mode)
      .reduce((s, l) => s + (l.squares ?? 0), 0);

  const assignOrphan = (mode: GameLog["mode"], target: number) => {
    let orphan = target - sumForMode(mode);
    if (orphan <= 0) return;
    for (let i = next.length - 1; i >= 0 && orphan > 0; i--) {
      if (next[i].mode !== mode) continue;
      if ((next[i].squares ?? 0) > 0) continue;
      next[i] = { ...next[i], squares: orphan };
      orphan = 0;
    }
  };

  assignOrphan("solo", solo.totalSquares);
  assignOrphan("coop", multi.coopSquares);
  assignOrphan("competitive", multi.compSquares);

  return next;
}

/** Fill missing opponent names on older multiplayer history rows. */
function backfillHistoryOpponents(
  history: GameLog[],
  opponents: MultiStats["opponents"],
): GameLog[] {
  const records = Object.values(opponents);
  if (records.length === 0) return history;

  const pickOpponent = (mode: "coop" | "competitive") => {
    const eligible = records.filter((r) =>
      mode === "coop"
        ? r.coopGames > 0 || (r.games > 0 && r.compGames === 0)
        : r.compGames > 0 || (r.games > 0 && r.coopGames === 0),
    );
    const pool = eligible.length > 0 ? eligible : records;
    return pool.sort((a, b) => b.games - a.games)[0] ?? null;
  };

  return history.map((log) => {
    if (log.mode === "solo" || log.opponentName?.trim()) return log;
    const rec = records.length === 1 ? records[0] : pickOpponent(log.mode);
    if (!rec) return log;
    return {
      ...log,
      opponentName: rec.name,
      opponentDogId: log.opponentDogId || rec.dogId,
    };
  });
}

function opponentKey(name: string | undefined): string {
  const clean = (name ?? "").replace(/^@/, "").trim().toLowerCase();
  return clean || "anon";
}

/** Sync per-mode opponent counts from game history and fix legacy rows. */
function reconcileOpponents(
  opponents: MultiStats["opponents"],
  history: GameLog[],
): MultiStats["opponents"] {
  const next: MultiStats["opponents"] = {};
  for (const [key, rec] of Object.entries(opponents)) {
    next[key] = { ...rec };
  }

  for (const log of history) {
    if (log.mode === "solo") continue;
    const key = opponentKey(log.opponentName);
    const displayName =
      log.opponentName?.replace(/^@/, "").trim() ||
      next[key]?.name ||
      opponents[key]?.name ||
      "Anon Pup";
    const prev = next[key] ?? {
      name: displayName,
      dogId: log.opponentDogId || "golden",
      games: 0,
      wins: 0,
      coopGames: 0,
      compGames: 0,
      compWins: 0,
    };
    const win = log.mode === "coop" ? log.won : log.won && !log.tied;
    next[key] = {
      name: displayName || prev.name,
      dogId: log.opponentDogId || prev.dogId,
      games: prev.games + 1,
      wins: prev.wins + (win ? 1 : 0),
      coopGames: prev.coopGames + (log.mode === "coop" ? 1 : 0),
      compGames: prev.compGames + (log.mode === "competitive" ? 1 : 0),
      compWins: prev.compWins + (log.mode === "competitive" && win ? 1 : 0),
    };
  }

  const coopHist = history.filter((l) => l.mode === "coop").length;
  const compHist = history.filter((l) => l.mode === "competitive").length;

  for (const [key, rec] of Object.entries(next)) {
    let coopGames = rec.coopGames;
    let compGames = rec.compGames;
    if (coopGames === 0 && compGames === 0 && rec.games > 0) {
      if (coopHist > 0 && compHist === 0) coopGames = rec.games;
      else if (compHist > 0 && coopHist === 0) compGames = rec.games;
    }
    next[key] = {
      ...rec,
      coopGames,
      compGames,
      games: Math.max(rec.games, coopGames + compGames),
    };
  }

  return next;
}

function normalizeMulti(raw: Partial<MultiStats> | undefined): MultiStats {
  const base = emptyMulti();
  if (!raw) return base;

  let coopSquares = raw.coopSquares ?? 0;
  let compSquares = raw.compSquares ?? 0;
  const legacy = raw.totalSquares ?? 0;
  if (coopSquares + compSquares === 0 && legacy > 0) {
    coopSquares = legacy;
  }

  return {
    ...base,
    ...raw,
    coopSquares,
    compSquares,
    opponents: normalizeOpponents(raw.opponents),
  };
}

export type SoloResult = {
  won: boolean;
  score: number;
  difficulty: Difficulty;
  elapsedSeconds: number;
  mistakes: number;
  hintsUsed: number;
  squaresFilled: number;
};

export type MultiResult = {
  mode: "coop" | "competitive";
  solved: boolean;
  mySquares: number;
  opponentSquares: number;
  opponentName: string;
  opponentDogId: string;
  difficulty: Difficulty;
  elapsedSeconds: number;
  mistakes: number;
  score: number;
};

function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

function isYesterday(dateStr: string): boolean {
  const d = new Date(dateStr + "T00:00:00");
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return d.toISOString().slice(0, 10) === yesterday.toISOString().slice(0, 10);
}

/** Bump day streak for any completed game (solo, co-op, or versus). */
function applyPlayStreak(solo: SoloStats): SoloStats {
  const today = todayKey();
  const next = { ...solo };
  if (next.lastPlayedDate !== today) {
    next.streak =
      next.lastPlayedDate && isYesterday(next.lastPlayedDate) ? next.streak + 1 : 1;
    next.lastPlayedDate = today;
  } else if (next.streak === 0) {
    next.streak = 1;
  }
  next.bestStreak = Math.max(next.bestStreak, next.streak);
  return next;
}

/** Returns a new UserData with the solo game result merged in. */
export function applySoloResult(data: UserData, r: SoloResult): UserData {
  let solo = applyPlayStreak({
    ...data.solo,
    bestTimeByDifficulty: { ...data.solo.bestTimeByDifficulty },
    playsByDifficulty: { ...data.solo.playsByDifficulty },
  });

  solo.played += 1;
  solo.playsByDifficulty[r.difficulty] =
    (solo.playsByDifficulty[r.difficulty] ?? 0) + 1;

  if (r.won) {
    solo.won += 1;
    solo.totalScore += r.score;
    solo.bestScore = Math.max(solo.bestScore, r.score);
    solo.totalSolveSeconds += r.elapsedSeconds;
    if (solo.fastestSolveSeconds == null || r.elapsedSeconds < solo.fastestSolveSeconds) {
      solo.fastestSolveSeconds = r.elapsedSeconds;
    }
    const prev = solo.bestTimeByDifficulty[r.difficulty];
    if (prev == null || r.elapsedSeconds < prev) {
      solo.bestTimeByDifficulty[r.difficulty] = r.elapsedSeconds;
    }
    if (r.mistakes === 0 && r.hintsUsed === 0) solo.perfectGames += 1;
  }

  solo.totalSquares += r.squaresFilled;

  const history = appendHistory(data.history, {
    t: Date.now(),
    mode: "solo",
    won: r.won,
    seconds: r.elapsedSeconds,
    mistakes: r.mistakes,
    squares: r.squaresFilled,
    difficulty: r.difficulty,
    score: r.score,
  });

  return { ...data, solo, history };
}

/** Returns a new UserData with the multiplayer game result merged in. */
export function applyMultiResult(data: UserData, r: MultiResult): UserData {
  const solo = applyPlayStreak({ ...data.solo });
  const multi: MultiStats = {
    ...data.multi,
    opponents: { ...data.multi.opponents },
  };

  const myWin =
    r.mode === "coop" ? r.solved : r.mySquares > r.opponentSquares;
  const tie = r.mode === "competitive" && r.mySquares === r.opponentSquares;

  if (r.mode === "coop") {
    multi.coopPlayed += 1;
    if (r.solved) multi.coopSolved += 1;
  } else {
    multi.compPlayed += 1;
    if (tie) multi.compTied += 1;
    else if (myWin) multi.compWon += 1;
  }
  if (r.mode === "coop") multi.coopSquares += r.mySquares;
  else multi.compSquares += r.mySquares;

  const oppName = r.opponentName.replace(/^@/, "").trim();
  const key = opponentKey(oppName);
  const prev = multi.opponents[key] ?? {
    name: oppName || "Anon Pup",
    dogId: r.opponentDogId,
    games: 0,
    wins: 0,
    coopGames: 0,
    compGames: 0,
    compWins: 0,
  };
  multi.opponents[key] = {
    name: oppName || prev.name,
    dogId: r.opponentDogId || prev.dogId,
    games: prev.games + 1,
    wins: prev.wins + (myWin ? 1 : 0),
    coopGames: prev.coopGames + (r.mode === "coop" ? 1 : 0),
    compGames: prev.compGames + (r.mode === "competitive" ? 1 : 0),
    compWins:
      prev.compWins +
      (r.mode === "competitive" && myWin && !tie ? 1 : 0),
  };

  const history = appendHistory(data.history, {
    t: Date.now(),
    mode: r.mode,
    won: myWin,
    seconds: r.elapsedSeconds,
    mistakes: r.mistakes,
    squares: r.mySquares,
    difficulty: r.difficulty,
    score: r.score,
    opponentName:
      r.opponentName.replace(/^@/, "").trim() || undefined,
    opponentDogId: r.opponentDogId || undefined,
    tied: r.mode === "competitive" ? tie : undefined,
  });

  return { ...data, solo, multi, history };
}

export function mostPlayedOpponent(multi: MultiStats): OpponentRecord | null {
  let best: OpponentRecord | null = null;
  for (const rec of Object.values(multi.opponents)) {
    if (!best || rec.games > best.games) best = rec;
  }
  return best;
}
