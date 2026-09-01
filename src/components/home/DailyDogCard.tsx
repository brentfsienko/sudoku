"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronDownIcon } from "@/components/icons";
import { homeSectionTitleClass } from "@/components/home/FriendListPanel";
import { breedForDay, todayDateKey } from "@/lib/dailyDog/breeds";

function useDailyBreed() {
  const [dayKey, setDayKey] = useState(todayDateKey);
  const breed = useMemo(() => breedForDay(), [dayKey]);

  useEffect(() => {
    const tick = () => {
      const next = todayDateKey();
      setDayKey((prev) => (prev === next ? prev : next));
    };
    tick();
    const id = window.setInterval(tick, 60_000);
    return () => window.clearInterval(id);
  }, []);

  return breed;
}

export function DailyDogCard() {
  const breed = useDailyBreed();
  const [open, setOpen] = useState(false);

  return (
    <section className="mb-5">
      <h2 className={`${homeSectionTitleClass} mb-2.5`}>Daily Dog</h2>

      <div className="overflow-hidden rounded-md bg-[var(--list-panel)]">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className="flex w-full items-center gap-3 px-4 py-3 text-left transition active:scale-[0.99]"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={breed.image}
            alt=""
            width={48}
            height={48}
            className="h-12 w-12 shrink-0 rounded-md object-cover"
          />
          <div className="min-w-0 flex-1">
            <p className="font-display text-sm font-bold text-[var(--foreground)]">
              {breed.name}
            </p>
            <p className="text-xs text-[var(--muted)]">
              {open ? "Tap to hide facts" : "Tap for facts"}
            </p>
          </div>
          <ChevronDownIcon
            width={20}
            height={20}
            className={`shrink-0 text-[var(--muted)] transition-transform duration-200 ${
              open ? "rotate-180" : ""
            }`}
          />
        </button>

        <div
          className="grid transition-[grid-template-rows] duration-300 ease-out"
          style={{ gridTemplateRows: open ? "1fr" : "0fr" }}
        >
          <div className="min-h-0 overflow-hidden">
            <div className="border-t border-white/70 px-4 py-3">
              <div className="flex gap-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={breed.image}
                  alt={breed.name}
                  width={120}
                  height={120}
                  className="h-[120px] w-[120px] shrink-0 rounded-md object-cover"
                />
                <dl className="min-w-0 flex-1 space-y-2 text-sm">
                  <div>
                    <dt className="text-[10px] font-bold uppercase tracking-wide text-[var(--muted)]">
                      Origin
                    </dt>
                    <dd className="font-display text-[var(--foreground)]">{breed.origin}</dd>
                  </div>
                  <div>
                    <dt className="text-[10px] font-bold uppercase tracking-wide text-[var(--muted)]">
                      Height
                    </dt>
                    <dd className="font-display text-[var(--foreground)]">{breed.height}</dd>
                  </div>
                  <div>
                    <dt className="text-[10px] font-bold uppercase tracking-wide text-[var(--muted)]">
                      Weight
                    </dt>
                    <dd className="font-display text-[var(--foreground)]">{breed.weight}</dd>
                  </div>
                </dl>
              </div>

              <ul className="mt-3 space-y-2">
                {breed.facts.map((fact) => (
                  <li
                    key={fact}
                    className="text-sm leading-snug text-[var(--foreground)]"
                  >
                    <span className="mr-1.5 text-[var(--primary)]">•</span>
                    {fact}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
