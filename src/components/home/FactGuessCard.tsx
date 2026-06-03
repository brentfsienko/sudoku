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
    setUserGuess(saved ?? null);
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
          onClick={() => {
            setExpanded((e) => {
              const next = !e;
              if (next) void fetchGlobalStats().then(setGlobal);
              return next;
            });
          }}
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
              {expanded
                ? "tap to collapse"
                : userGuess
                  ? "tap to see result"
                  : "dog or Sudoku?"}
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
            <div className="border-t border-[var(--border)]/70 px-4 pb-3 pt-2">
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
      <div className="flex items-center justify-center gap-2 py-0.5">
        <GuessChip label="Dog" onClick={() => onGuess("dog")} />
        <span className="text-[11px] font-semibold text-[var(--muted)]">or</span>
        <GuessChip label="Sudoku" onClick={() => onGuess("sudoku")} />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
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
        <div className="rounded-xl bg-[var(--list-panel)]/80 px-3 py-2">
          <p className="mb-1 text-center text-[10px] font-bold uppercase tracking-wide text-[var(--muted)]">
            Sudogku players worldwide
          </p>
          <div
            className="h-1.5 overflow-hidden rounded-full bg-[#ef6f6c]"
            role="img"
            aria-label={`${globalPct.correctPct}% correct, ${globalPct.wrongPct}% incorrect`}
          >
            <div
              className="h-full rounded-l-full bg-[#5cc98b] transition-[width] duration-300"
              style={{ width: `${globalPct.correctPct}%` }}
            />
          </div>
          <div className="mt-1 flex justify-between text-[11px] font-semibold text-[var(--muted)]">
            <span>{globalPct.correctPct}% correct</span>
            <span>{globalPct.wrongPct}% incorrect</span>
          </div>
        </div>
      )}
    </div>
  );
}

function GuessChip({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="font-display rounded-lg px-3.5 py-1 text-sm font-bold text-[var(--foreground)] underline decoration-[var(--primary)] decoration-2 underline-offset-[3px] transition active:text-[var(--primary)]"
    >
      {label}
    </button>
  );
}
