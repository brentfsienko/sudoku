"use client";

import { useEffect, useMemo, useState } from "react";
import { BulbIcon } from "@/components/icons";
import {
  factForDay,
  todayDateKey,
  type FactTopic,
  type TriviaFact,
} from "@/lib/trivia/facts";
import {
  fetchGlobalStats,
  globalPercentages,
  loadUserGuesses,
  recordGuess,
  type GlobalTriviaStats,
  type UserGuess,
} from "@/lib/trivia/stats";

function useDailyFact() {
  const [dayKey, setDayKey] = useState(todayDateKey);
  const fact = useMemo(() => factForDay(), [dayKey]);

  useEffect(() => {
    const tick = () => {
      const next = todayDateKey();
      setDayKey((prev) => (prev === next ? prev : next));
    };
    tick();
    const id = window.setInterval(tick, 60_000);
    return () => window.clearInterval(id);
  }, []);

  return fact;
}

export function FactGuessCard() {
  const fact = useDailyFact();
  const [expanded, setExpanded] = useState(false);
  const [userGuess, setUserGuess] = useState<UserGuess | null>(null);
  const [global, setGlobal] = useState<GlobalTriviaStats | null>(null);

  useEffect(() => {
    setExpanded(false);
    const saved = loadUserGuesses()[fact.id];
    if (saved) {
      setUserGuess(saved);
      setExpanded(true);
    } else {
      setUserGuess(null);
    }
    void fetchGlobalStats().then(setGlobal);
  }, [fact.id]);

  async function submit(guess: FactTopic) {
    if (userGuess) return;
    const correct = guess === fact.topic;
    const next = await recordGuess(fact.id, guess, correct);
    setUserGuess({ factId: fact.id, guess, correct, at: Date.now() });
    setGlobal(next);
    setExpanded(true);
  }

  const pct = global ? globalPercentages(global) : null;

  return (
    <section className="flex flex-col gap-2">
      <button
        type="button"
        onClick={() => setExpanded((e) => !e)}
        className="w-full rounded-2xl border border-[var(--border)] bg-[var(--surface-soft)] px-4 py-3 text-left transition active:scale-[0.99]"
      >
        <div className="flex items-start gap-3">
          <span className="mt-0.5 shrink-0 text-[var(--primary)]">
            <BulbIcon width={20} height={20} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="font-serif-title text-sm leading-snug text-[var(--foreground)]">
              {fact.text}
            </p>
            <p className="mt-1.5 text-[10px] font-bold uppercase tracking-wide text-[var(--muted)]">
              Today&apos;s fact ·{" "}
              {expanded ? "tap to collapse" : "dog or Sudoku? tap to guess"}
            </p>
          </div>
          <span
            className={`shrink-0 text-[var(--muted)] transition ${expanded ? "rotate-180" : ""}`}
            aria-hidden
          >
            ▾
          </span>
        </div>
      </button>

      {expanded && (
        <FactGuessPanel
          fact={fact}
          userGuess={userGuess}
          globalPct={pct}
          onGuess={(g) => void submit(g)}
        />
      )}
    </section>
  );
}

function FactGuessPanel({
  fact,
  userGuess,
  globalPct,
  onGuess,
}: {
  fact: TriviaFact;
  userGuess: UserGuess | null;
  globalPct: { correctPct: number; wrongPct: number } | null;
  onGuess: (guess: FactTopic) => void;
}) {
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-white px-4 py-3 shadow-sm">
      {!userGuess ? (
        <>
          <p className="mb-2 text-center text-xs font-semibold text-[var(--muted)]">
            Is this fact about dogs or Sudoku?
          </p>
          <div className="flex gap-2">
            <GuessButton label="🐶 Dog" onClick={() => onGuess("dog")} />
            <GuessButton label="9️⃣ Sudoku" onClick={() => onGuess("sudoku")} />
          </div>
        </>
      ) : (
        <div className="flex flex-col gap-2">
          <p
            className={`text-center text-sm font-bold ${
              userGuess.correct ? "text-[#3d9a6a]" : "text-[#d64545]"
            }`}
          >
            {userGuess.correct
              ? "Nice nose — you got it!"
              : `It's ${fact.topic === "dog" ? "about dogs" : "about Sudoku"}.`}
          </p>
          {globalPct && (
            <div className="rounded-xl bg-[var(--list-panel)] px-3 py-2.5">
              <p className="mb-1.5 text-center text-[10px] font-bold uppercase tracking-wide text-[var(--muted)]">
                Floof players worldwide
              </p>
              <div className="flex h-2 overflow-hidden rounded-full bg-white">
                <div
                  className="bg-[#5cc98b] transition-all"
                  style={{ width: `${globalPct.correctPct}%` }}
                />
                <div
                  className="bg-[#ef6f6c] transition-all"
                  style={{ width: `${globalPct.wrongPct}%` }}
                />
              </div>
              <div className="mt-1.5 flex justify-between text-[11px] font-semibold text-[var(--muted)]">
                <span>{globalPct.correctPct}% correct</span>
                <span>{globalPct.wrongPct}% incorrect</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function GuessButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="font-display flex-1 rounded-xl border-2 border-[var(--border)] bg-[var(--background)] py-2.5 text-sm font-bold text-[var(--foreground)] transition active:scale-[0.98]"
    >
      {label}
    </button>
  );
}
