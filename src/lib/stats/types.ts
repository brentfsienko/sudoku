import {
  isActiveSolo,
  type ActiveSoloSave,
} from "@/lib/game/activeSolo";
import { DIFFICULTIES, type Difficulty } from "@/lib/game/types";
import type { DogId, ExclusiveDogId } from "@/lib/theme/dogs";
import { GAME_WIN_BONE_BONUS } from "@/lib/bones/config";
import { coerceProfile } from "./profile";

export type { ActiveSoloSave };

/** Max in-progress solo games synced per account (keeps user_data JSON reasonable). */
export const MAX_ACTIVE_SOLOS = 10;

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
  /** Multiplayer: correct cells each player placed (non-given). */
  mySquares?: number;
  opponentSquares?: number;
  /** Competitive mode only. */
  tied?: boolean;
};

/** Daily fact guess stored per account (synced with localStorage). */
export type TriviaUserGuess = {
  factId: string;
  guess: "dog" | "sudoku";
  correct: boolean;
  at: number;
};

export type UserData = {
  profile: Profile;
  solo: SoloStats;
  multi: MultiStats;
  history: GameLog[];
  bones: number;
  ownedExclusiveDogs: ExclusiveDogId[];
  triviaGuesses?: Record<string, TriviaUserGuess>;
  /** In-progress solo boards — synced when signed in. */
  activeSolos?: ActiveSoloSave[];
  /**
   * IDs of games that have been finished or quit on any device.
   * Synced to cloud so every device knows which games to permanently hide.
   */
  finishedSoloIds?: string[];
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

function historyLogKey(log: GameLog): string {
  return `${log.t}:${log.mode}`;
}

/** Union local + remote game logs so solo rows are not dropped on sync. */
export function mergeHistory(a: GameLog[], b: GameLog[]): GameLog[] {
  const map = new Map<string, GameLog>();
  for (const log of [...a, ...b]) {
    const key = historyLogKey(log);
    const prev = map.get(key);
    if (!prev || (log.squares ?? 0) >= (prev.squares ?? 0)) {
      map.set(key, log);
    }
  }
  const merged = [...map.values()].sort((x, y) => x.t - y.t);
  return merged.length > MAX_HISTORY
    ? merged.slice(merged.length - MAX_HISTORY)
    : merged;
}

function mergeSoloStats(a: SoloStats, b: SoloStats): SoloStats {
  const bestTimeByDifficulty: SoloStats["bestTimeByDifficulty"] = {
    ...a.bestTimeByDifficulty,
    ...b.bestTimeByDifficulty,
  };
  for (const d of DIFFICULTIES) {
    const ta = a.bestTimeByDifficulty[d];
    const tb = b.bestTimeByDifficulty[d];
    if (ta != null && tb != null) bestTimeByDifficulty[d] = Math.min(ta, tb);
  }
  const playsByDifficulty: SoloStats["playsByDifficulty"] = {
    ...a.playsByDifficulty,
  };
  for (const d of DIFFICULTIES) {
    playsByDifficulty[d] = Math.max(
      playsByDifficulty[d] ?? 0,
      b.playsByDifficulty[d] ?? 0,
    );
  }
  const lastDates = [a.lastPlayedDate, b.lastPlayedDate].filter(Boolean) as string[];
  return {
    played: Math.max(a.played, b.played),
    won: Math.max(a.won, b.won),
    bestScore: Math.max(a.bestScore, b.bestScore),
    totalScore: Math.max(a.totalScore, b.totalScore),
    totalSolveSeconds: Math.max(a.totalSolveSeconds, b.totalSolveSeconds),
    fastestSolveSeconds:
      a.fastestSolveSeconds != null && b.fastestSolveSeconds != null
        ? Math.min(a.fastestSolveSeconds, b.fastestSolveSeconds)
        : a.fastestSolveSeconds ?? b.fastestSolveSeconds ?? null,
    perfectGames: Math.max(a.perfectGames, b.perfectGames),
    streak: Math.max(a.streak, b.streak),
    bestStreak: Math.max(a.bestStreak, b.bestStreak),
    lastPlayedDate: lastDates.sort().at(-1) ?? null,
    bestTimeByDifficulty,
    playsByDifficulty,
    totalSquares: Math.max(a.totalSquares, b.totalSquares),
  };
}

function mergeMultiStats(a: MultiStats, b: MultiStats): MultiStats {
  const opponents: MultiStats["opponents"] = { ...a.opponents };
  for (const [key, rec] of Object.entries(b.opponents)) {
    const prev = opponents[key];
    if (!prev) {
      opponents[key] = rec;
      continue;
    }
    opponents[key] = {
      name: prev.name || rec.name,
      dogId: prev.dogId || rec.dogId,
      games: Math.max(prev.games, rec.games),
      wins: Math.max(prev.wins, rec.wins),
      coopGames: Math.max(prev.coopGames, rec.coopGames),
      compGames: Math.max(prev.compGames, rec.compGames),
      compWins: Math.max(prev.compWins, rec.compWins),
    };
  }
  return {
    coopPlayed: Math.max(a.coopPlayed, b.coopPlayed),
    coopSolved: Math.max(a.coopSolved, b.coopSolved),
    compPlayed: Math.max(a.compPlayed, b.compPlayed),
    compWon: Math.max(a.compWon, b.compWon),
    compTied: Math.max(a.compTied, b.compTied),
    coopSquares: Math.max(a.coopSquares, b.coopSquares),
    compSquares: Math.max(a.compSquares, b.compSquares),
    opponents,
  };
}

/** Merge in-progress solo games from two devices (newer `updatedAt` wins per id). */
export function mergeActiveSolos(
  a: ActiveSoloSave[] | undefined,
  b: ActiveSoloSave[] | undefined,
): ActiveSoloSave[] {
  const map = new Map<string, ActiveSoloSave>();
  for (const item of [...(a ?? []), ...(b ?? [])]) {
    if (!item?.id || !item.snapshot?.puzzle || !isActiveSolo(item.snapshot)) continue;
    const at = typeof item.updatedAt === "number" ? item.updatedAt : 0;
    const prev = map.get(item.id);
    if (!prev || at >= (prev.updatedAt ?? 0)) {
      map.set(item.id, { id: item.id, snapshot: item.snapshot, updatedAt: at });
    }
  }
  return [...map.values()]
    .sort((x, y) => y.updatedAt - x.updatedAt)
    .slice(0, MAX_ACTIVE_SOLOS);
}

/** Merge two device copies without losing solo (or any) history rows. */
export function mergeUserData(local: UserData, remote: UserData): UserData {
  return normalizeUserData({
    profile: local.profile.username?.trim() ? local.profile : remote.profile,
    solo: mergeSoloStats(local.solo, remote.solo),
    multi: mergeMultiStats(local.multi, remote.multi),
    history: mergeHistory(local.history, remote.history),
    bones: Math.max(local.bones ?? 0, remote.bones ?? 0),
    ownedExclusiveDogs: [
      ...new Set([
        ...(local.ownedExclusiveDogs ?? []),
        ...(remote.ownedExclusiveDogs ?? []),
      ]),
    ],
    triviaGuesses: mergeTriviaGuesses(
      local.triviaGuesses ?? {},
      remote.triviaGuesses ?? {},
    ),
    activeSolos: mergeActiveSolos(local.activeSolos, remote.activeSolos),
    finishedSoloIds: mergeFinishedIds(local.finishedSoloIds, remote.finishedSoloIds),
  });
}

const MAX_FINISHED_IDS = 500;

function mergeFinishedIds(
  a: string[] | undefined,
  b: string[] | undefined,
): string[] {
  const merged = [...new Set([...(a ?? []), ...(b ?? [])])];
  // Keep the tail (most recently added) when over the limit
  return merged.length > MAX_FINISHED_IDS
    ? merged.slice(merged.length - MAX_FINISHED_IDS)
    : merged;
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
    bones: 0,
    ownedExclusiveDogs: [],
    triviaGuesses: {},
    activeSolos: [],
  };
}

function normalizeTriviaGuesses(
  raw: Record<string, TriviaUserGuess> | undefined,
): Record<string, TriviaUserGuess> {
  if (!raw || typeof raw !== "object") return {};
  const out: Record<string, TriviaUserGuess> = {};
  for (const [id, entry] of Object.entries(raw)) {
    const guess = entry?.guess;
    if (guess !== "dog" && guess !== "sudoku") continue;
    out[id] = {
      factId: entry.factId ?? id,
      guess,
      correct: Boolean(entry.correct),
      at: typeof entry.at === "number" ? entry.at : 0,
    };
  }
  return out;
}

function mergeTriviaGuesses(
  a: Record<string, TriviaUserGuess>,
  b: Record<string, TriviaUserGuess>,
): Record<string, TriviaUserGuess> {
  const out = { ...a };
  for (const [id, guess] of Object.entries(b)) {
    const prev = out[id];
    if (!prev || guess.at >= prev.at) out[id] = guess;
  }
  return out;
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
  const history = backfillSoloHistory(
    backfillHistoryOpponents(
      backfillHistorySquares(normalizeHistory(raw.history), solo, multi),
      multi.opponents,
    ),
    solo,
  );
  const data: UserData = {
    profile: coerceProfile({
      ...base.profile,
      ...(raw.profile as Partial<Profile> & { name?: string }),
    }),
    solo,
    multi: { ...multi, opponents: reconcileOpponents(multi.opponents, history) },
    history,
    bones: typeof raw.bones === "number" ? Math.max(0, raw.bones) : 0,
    ownedExclusiveDogs: Array.isArray(raw.ownedExclusiveDogs)
      ? (raw.ownedExclusiveDogs as ExclusiveDogId[])
      : [],
    triviaGuesses: normalizeTriviaGuesses(raw.triviaGuesses),
    activeSolos: mergeActiveSolos([], raw.activeSolos),
    finishedSoloIds: Array.isArray(raw.finishedSoloIds)
      ? (raw.finishedSoloIds as string[])
      : [],
  };
  return {
    ...data,
    profile: coerceProfile(data.profile, data),
  };
}

function normalizeHistory(raw: GameLog[] | undefined): GameLog[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((log) => {
    const rawMode = (log as { mode?: string }).mode;
    const mode: GameLog["mode"] =
      rawMode === "single" ? "solo" : (log.mode as GameLog["mode"]);
    return {
      ...log,
      mode,
      squares: log.squares ?? 0,
      mySquares: log.mySquares ?? log.squares ?? 0,
      opponentSquares: log.opponentSquares ?? 0,
      tied: log.tied ?? false,
    };
  });
}

/**
 * Older saves incremented solo.played without appending history rows.
 * Add placeholder solo entries so Recent games can list past solo play.
 */
function backfillSoloHistory(history: GameLog[], solo: SoloStats): GameLog[] {
  const existing = history.filter((l) => l.mode === "solo");
  const missing = solo.played - existing.length;
  if (missing <= 0) return history;

  let wonLeft = Math.max(0, solo.won - existing.filter((l) => l.won).length);
  const now = Date.now();
  const diffQueue: { difficulty: Difficulty; count: number }[] = DIFFICULTIES.map(
    (d) => ({ difficulty: d, count: solo.playsByDifficulty[d] ?? 0 }),
  ).filter((x) => x.count > 0);
  if (diffQueue.length === 0) {
    diffQueue.push({ difficulty: "medium", count: missing });
  }

  let qi = 0;
  let diffLeft = diffQueue[0]?.count ?? missing;
  let difficulty = diffQueue[0]?.difficulty ?? "medium";
  const placeholders: GameLog[] = [];

  for (let i = 0; i < missing; i++) {
    while (diffLeft <= 0 && qi < diffQueue.length - 1) {
      qi += 1;
      diffLeft = diffQueue[qi].count;
      difficulty = diffQueue[qi].difficulty;
    }
    if (diffLeft > 0) diffLeft -= 1;

    const won = wonLeft > 0;
    if (won) wonLeft -= 1;

    placeholders.push({
      t: now - (missing - i) * 3_600_000,
      mode: "solo",
      won,
      seconds: solo.bestTimeByDifficulty[difficulty] ?? 0,
      mistakes: 0,
      squares: 0,
      difficulty,
      score: won ? solo.bestScore : 0,
    });
  }

  let next = history;
  for (const entry of placeholders) {
    next = appendHistory(next, entry);
  }
  return next;
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

/** Rebuild per-opponent stats from game history (source of truth for mode counts). */
function reconcileOpponents(
  opponents: MultiStats["opponents"],
  history: GameLog[],
): MultiStats["opponents"] {
  const next: MultiStats["opponents"] = {};

  for (const log of history) {
    if (log.mode === "solo") continue;
    const key = opponentKey(log.opponentName);
    const stored = opponents[key];
    const displayName =
      log.opponentName?.replace(/^@/, "").trim() ||
      stored?.name ||
      "Anon Pup";
    const prev = next[key] ?? {
      name: displayName,
      dogId: log.opponentDogId || stored?.dogId || "golden",
      games: 0,
      wins: 0,
      coopGames: 0,
      compGames: 0,
      compWins: 0,
    };
    const win = log.mode === "coop" ? log.won : log.won && !log.tied;
    const coopGames = prev.coopGames + (log.mode === "coop" ? 1 : 0);
    const compGames = prev.compGames + (log.mode === "competitive" ? 1 : 0);
    next[key] = {
      name: prev.name || displayName,
      dogId: log.opponentDogId || prev.dogId || stored?.dogId || "golden",
      coopGames,
      compGames,
      games: coopGames + compGames,
      wins: prev.wins + (win ? 1 : 0),
      compWins:
        prev.compWins +
        (log.mode === "competitive" && win ? 1 : 0),
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
  /** Bones found on the board during this game. */
  bonesFound: number;
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
  bonesFound: number;
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

/** Bump streak when any game finishes (solo, co-op, or versus; win or loss). */
function applyPlayStreak(solo: SoloStats): SoloStats {
  const today = todayKey();
  const next = { ...solo };
  if (next.lastPlayedDate === today) {
    next.streak = Math.max(next.streak, 1);
  } else if (next.lastPlayedDate && isYesterday(next.lastPlayedDate)) {
    next.streak = next.streak + 1;
  } else {
    next.streak = 1;
  }
  next.lastPlayedDate = today;
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

  const winBonus = r.won ? GAME_WIN_BONE_BONUS : 0;
  const bones = (data.bones ?? 0) + r.bonesFound + winBonus;

  return { ...data, solo, history, bones };
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
  const coopGames = prev.coopGames + (r.mode === "coop" ? 1 : 0);
  const compGames = prev.compGames + (r.mode === "competitive" ? 1 : 0);
  multi.opponents[key] = {
    name: oppName || prev.name,
    dogId: r.opponentDogId || prev.dogId,
    coopGames,
    compGames,
    games: coopGames + compGames,
    wins: prev.wins + (myWin ? 1 : 0),
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
    mySquares: r.mySquares,
    opponentSquares: r.opponentSquares,
    tied: r.mode === "competitive" ? tie : undefined,
  });

  const winBonus =
    r.mode === "coop"
      ? r.solved
        ? GAME_WIN_BONE_BONUS
        : 0
      : myWin && !tie
        ? GAME_WIN_BONE_BONUS
        : 0;
  const bones = (data.bones ?? 0) + r.bonesFound + winBonus;

  return { ...data, solo, multi, history, bones };
}

export function mostPlayedOpponent(multi: MultiStats): OpponentRecord | null {
  let best: OpponentRecord | null = null;
  for (const rec of Object.values(multi.opponents)) {
    if (!best || rec.games > best.games) best = rec;
  }
  return best;
}
