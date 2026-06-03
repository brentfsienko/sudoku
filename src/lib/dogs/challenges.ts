import type { UserData } from "@/lib/stats/types";
import type { ExclusiveDogId } from "@/lib/theme/dogs";

export type DogChallenge = {
  id: ExclusiveDogId;
  title: string;
  description: string;
  progressHint: (data: UserData) => string;
  isComplete: (data: UserData) => boolean;
};

function soloWinsAtOrAboveDifficulty(
  data: UserData,
  minRank: number,
  count: number,
): boolean {
  let n = 0;
  for (const log of data.history) {
    if (log.mode !== "solo" || !log.won) continue;
    const rank =
      log.difficulty === "easy"
        ? 1
        : log.difficulty === "medium"
          ? 2
          : log.difficulty === "hard"
            ? 3
            : log.difficulty === "expert"
              ? 4
              : 5;
    if (rank >= minRank) n += 1;
    if (n >= count) return true;
  }
  return false;
}

function hardPlusSoloWins(data: UserData): number {
  let n = 0;
  for (const log of data.history) {
    if (log.mode !== "solo" || !log.won) continue;
    if (
      log.difficulty === "hard" ||
      log.difficulty === "expert" ||
      log.difficulty === "master"
    ) {
      n += 1;
    }
  }
  return n;
}

/** Exclusive row unlocks left → right, easiest to hardest. */
export const EXCLUSIVE_DOG_CHALLENGES: DogChallenge[] = [
  {
    id: "royal",
    title: "Crowned Pup",
    description: "Win 5 solo puzzles.",
    progressHint: (d) => `${Math.min(d.solo.won, 5)} / 5 solo wins`,
    isComplete: (d) => d.solo.won >= 5,
  },
  {
    id: "hero",
    title: "Hero Hound",
    description: "Win 3 competitive multiplayer games.",
    progressHint: (d) => `${Math.min(d.multi.compWon, 3)} / 3 versus wins`,
    isComplete: (d) => d.multi.compWon >= 3,
  },
  {
    id: "galaxy",
    title: "Stellar Streak",
    description: "Reach a 7-day best solo streak.",
    progressHint: (d) => `${Math.min(d.solo.bestStreak, 7)} / 7 day best streak`,
    isComplete: (d) => d.solo.bestStreak >= 7,
  },
  {
    id: "party",
    title: "Party Animal",
    description: "Solve 5 co-op games and win 3 solo puzzles on Hard+.",
    progressHint: (d) => {
      const coop = Math.min(d.multi.coopSolved, 5);
      const hard = Math.min(hardPlusSoloWins(d), 3);
      return `${coop} / 5 co-op · ${hard} / 3 hard+ solo wins`;
    },
    isComplete: (d) =>
      d.multi.coopSolved >= 5 && soloWinsAtOrAboveDifficulty(d, 3, 3),
  },
];

export function isExclusiveDogUnlocked(
  dogId: ExclusiveDogId,
  data: UserData,
): boolean {
  const challenge = EXCLUSIVE_DOG_CHALLENGES.find((c) => c.id === dogId);
  return challenge?.isComplete(data) ?? false;
}

export function challengeForExclusiveDog(
  dogId: ExclusiveDogId,
): DogChallenge | undefined {
  return EXCLUSIVE_DOG_CHALLENGES.find((c) => c.id === dogId);
}
