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
    <section>
      <div className="overflow-hidden rounded-3xl border border-[var(--border)] bg-[var(--surface-soft)]">
        <button
          type="button"
          onClick={() => setExpanded((e) => !e)}
          className="flex w-full items-start gap-3 px-4 py-3.5 text-left transition active:bg-white/40"
        >
          <span className="mt-0.5 shrink-0 text-[var(--primary)]">
            <BulbIcon width={18} height={18} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="font-serif-title text-sm leading-snug text-[var(--foreground)]">
              {fact.text}
            </p>
            <p className="mt-1 text-[10px] font-semibold uppercase tracking-wide text-[var(--muted)]">
              Today&apos;s fact ·{" "}
              {expanded ? "tap to collapse" : "dog or Sudoku?"}
            </p>
          </div>
          <span
            className={`mt-1 shrink-0 text-xs text-[var(--muted)] transition-transform duration-200 ${
              expanded ? "rotate-180" : ""
            }`}
            aria-hidden
          >
            ▾
          </span>
        </button>

        <div
          className={`grid transition-[grid-template-rows] duration-200 ease-out ${
            expanded ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
          }`}
        >
          <div className="overflow-hidden">
            <div className="border-t border-[var(--border)]/70 px-4 pb-4 pt-3">
              <FactGuessBody
                fact={fact}
                userGuess={userGuess}
                globalPct={pct}
                onGuess={(g) => void submit(g)}
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function FactGuessBody({
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
  if (!userGuess) {
    return (
      <div className="flex flex-col gap-2.5">
        <p className="text-center text-[11px] font-semibold text-[var(--muted)]">
          Is this about dogs or Sudoku?
        </p>
        <div className="flex gap-1 rounded-full bg-white p-1 shadow-sm ring-1 ring-[var(--border)]">
          <GuessButton label="Dog" onClick={() => onGuess("dog")} />
          <GuessButton label="Sudoku" onClick={() => onGuess("sudoku")} />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2.5">
      <p
        className={`text-center text-sm font-bold ${
          userGuess.correct ? "text-[#3d9a6a]" : "text-[#d64545]"
        }`}
      >
        {userGuess.correct
          ? "Nice — you got it!"
          : `It was ${fact.topic === "dog" ? "about dogs" : "about Sudoku"}.`}
      </p>
      {globalPct && (
        <div className="rounded-2xl bg-white/70 px-3 py-2.5 ring-1 ring-[var(--border)]/60">
          <p className="mb-1.5 text-center text-[10px] font-bold uppercase tracking-wide text-[var(--muted)]">
            Floof players worldwide
          </p>
          <div className="flex h-1.5 overflow-hidden rounded-full bg-[var(--list-panel)]">
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
  );
}

function GuessButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="font-display flex-1 rounded-full py-2 text-sm font-bold text-[var(--foreground)] transition active:scale-[0.98] active:bg-[var(--primary-soft)]"
    >
      {label}
    </button>
  );
}
