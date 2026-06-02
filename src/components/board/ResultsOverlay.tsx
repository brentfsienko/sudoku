"use client";

import type { GameSnapshot } from "@/lib/game/store";
import type { GameMode, PlayerRole } from "@/lib/game/types";
import { cellContributions } from "@/lib/game/engine";
import { formatTime } from "@/lib/game/scoring";
import { DogAvatar } from "@/components/DogAvatar";
import { playerColor } from "@/lib/theme/dogs";

type Player = { name: string; dogId: string; role: PlayerRole };

type Props = {
  snapshot: GameSnapshot;
  elapsedSeconds: number;
  mode: GameMode;
  me: Player;
  opponent?: Player | null;
  finalScore: number;
  solved: boolean;
  onRematch?: () => void;
  onHome: () => void;
};

function StatRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-1.5">
      <span className="text-[var(--muted)]">{label}</span>
      <span className="font-display font-bold text-[var(--foreground)]">{value}</span>
    </div>
  );
}

export function ResultsOverlay({
  snapshot,
  elapsedSeconds,
  mode,
  me,
  opponent,
  finalScore,
  solved,
  onRematch,
  onHome,
}: Props) {
  const contrib = cellContributions(snapshot.puzzle, snapshot.solution, snapshot.cells);

  let title: string;
  let subtitle: string;
  let heroDogId = me.dogId;
  let heroRing = playerColor(me.role).hex;

  if (mode === "competitive" && opponent) {
    const myCount = contrib[me.role];
    const oppCount = contrib[opponent.role];
    if (myCount === oppCount) {
      title = "It's a tie!";
      subtitle = `${myCount} squares each`;
    } else {
      const iWon = myCount > oppCount;
      const winner = iWon ? me : opponent;
      heroDogId = winner.dogId;
      heroRing = playerColor(winner.role).hex;
      title = iWon ? "You win!" : `${winner.name} wins!`;
      subtitle = `${Math.max(myCount, oppCount)} squares vs ${Math.min(myCount, oppCount)}`;
    }
  } else if (!solved) {
    title = "Out of hearts";
    subtitle = "The pups need another go!";
  } else if (mode === "coop") {
    title = "Puzzle solved!";
    subtitle = "Great teamwork! 🐾";
  } else {
    title = "Puzzle solved!";
    subtitle = "Nicely done! 🐾";
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-5 backdrop-blur-sm">
      <div className="animate-pop w-full max-w-sm rounded-3xl bg-[var(--surface)] p-6 shadow-2xl">
        <div className="flex flex-col items-center gap-2 text-center">
          <DogAvatar dogId={heroDogId} size={88} ringColor={heroRing} />
          <h2 className="font-display text-2xl font-extrabold text-[var(--foreground)]">
            {title}
          </h2>
          <p className="text-sm text-[var(--muted)]">{subtitle}</p>
        </div>

        <div className="mt-5 rounded-2xl bg-[var(--surface-soft)] px-4 py-2">
          <StatRow label="Time" value={formatTime(elapsedSeconds)} />
          <StatRow label="Mistakes" value={`${snapshot.mistakes}`} />
          <StatRow label="Hints used" value={`${snapshot.hintsUsed}`} />
          {mode === "single" && solved && (
            <StatRow label="Score" value={finalScore.toLocaleString()} />
          )}
        </div>

        {opponent && (
          <div className="mt-4 space-y-2">
            <h3 className="text-sm font-semibold text-[var(--muted)]">
              {mode === "competitive" ? "Squares filled" : "Squares each"}
            </h3>
            <PlayerScore player={me} count={contrib[me.role]} total={contrib.total} />
            <PlayerScore
              player={opponent}
              count={contrib[opponent.role]}
              total={contrib.total}
            />
          </div>
        )}

        <div className="mt-6 flex flex-col gap-2">
          {onRematch && (
            <button
              type="button"
              onClick={onRematch}
              className="font-display rounded-full bg-[var(--primary)] py-3.5 text-lg font-extrabold text-white shadow-md transition active:scale-[0.98]"
            >
              Rematch
            </button>
          )}
          <button
            type="button"
            onClick={onHome}
            className="font-display rounded-full bg-white py-3.5 text-lg font-extrabold text-[var(--foreground)] shadow-sm transition active:scale-[0.98]"
          >
            Home
          </button>
        </div>
      </div>
    </div>
  );
}

function PlayerScore({
  player,
  count,
  total,
}: {
  player: Player;
  count: number;
  total: number;
}) {
  const color = playerColor(player.role);
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div className="flex items-center gap-3">
      <DogAvatar dogId={player.dogId} size={36} ringColor={color.hex} />
      <div className="flex-1">
        <div className="flex justify-between text-sm">
          <span className="font-display font-bold" style={{ color: color.hex }}>
            {player.name}
          </span>
          <span className="font-display font-bold text-[var(--foreground)]">
            {count}
          </span>
        </div>
        <div className="mt-1 h-2 overflow-hidden rounded-full bg-[var(--surface-soft)]">
          <div
            className="h-full rounded-full"
            style={{ width: `${pct}%`, backgroundColor: color.hex }}
          />
        </div>
      </div>
    </div>
  );
}
