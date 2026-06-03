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
  totalSquares: number;
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
  difficulty: Difficulty;
  score: number;
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
  };
}

export function emptyMulti(): MultiStats {
  return {
    coopPlayed: 0,
    coopSolved: 0,
    compPlayed: 0,
    compWon: 0,
    compTied: 0,
    totalSquares: 0,
    opponents: {},
  };
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
  return {
    profile: coerceProfile({
      ...base.profile,
      ...(raw.profile as Partial<Profile> & { name?: string }),
    }),
    solo: { ...base.solo, ...raw.solo },
    multi: {
      ...base.multi,
      ...raw.multi,
      opponents: normalizeOpponents(raw.multi?.opponents),
    },
    history: Array.isArray(raw.history) ? raw.history : [],
  };
}

export type SoloResult = {
  won: boolean;
  score: number;
  difficulty: Difficulty;
  elapsedSeconds: number;
  mistakes: number;
  hintsUsed: number;
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

/** Returns a new UserData with the solo game result merged in. */
export function applySoloResult(data: UserData, r: SoloResult): UserData {
  const solo: SoloStats = {
    ...data.solo,
    bestTimeByDifficulty: { ...data.solo.bestTimeByDifficulty },
    playsByDifficulty: { ...data.solo.playsByDifficulty },
  };
  const today = todayKey();

  if (solo.lastPlayedDate !== today) {
    solo.streak =
      solo.lastPlayedDate && isYesterday(solo.lastPlayedDate) ? solo.streak + 1 : 1;
    solo.lastPlayedDate = today;
  } else if (solo.streak === 0) {
    solo.streak = 1;
  }
  solo.bestStreak = Math.max(solo.bestStreak, solo.streak);

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

  const history = appendHistory(data.history, {
    t: Date.now(),
    mode: "solo",
    won: r.won,
    seconds: r.elapsedSeconds,
    mistakes: r.mistakes,
    difficulty: r.difficulty,
    score: r.score,
  });

  return { ...data, solo, history };
}

/** Returns a new UserData with the multiplayer game result merged in. */
export function applyMultiResult(data: UserData, r: MultiResult): UserData {
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
  multi.totalSquares += r.mySquares;

  const key = (r.opponentName || "anon").trim().toLowerCase() || "anon";
  const prev = multi.opponents[key] ?? {
    name: r.opponentName || "Anon Pup",
    dogId: r.opponentDogId,
    games: 0,
    wins: 0,
    coopGames: 0,
    compGames: 0,
    compWins: 0,
  };
  multi.opponents[key] = {
    name: r.opponentName || prev.name,
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
    difficulty: r.difficulty,
    score: r.score,
  });

  return { ...data, multi, history };
}

export function mostPlayedOpponent(multi: MultiStats): OpponentRecord | null {
  let best: OpponentRecord | null = null;
  for (const rec of Object.values(multi.opponents)) {
    if (!best || rec.games > best.games) best = rec;
  }
  return best;
}
