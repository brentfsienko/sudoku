"use client";

import { useEffect, useMemo, useRef, useState, type MutableRefObject } from "react";
import { BoneIcon } from "@/components/BoneIcon";
import { ChevronDownIcon, PlayIcon, XIcon } from "@/components/icons";
import { OriginMiniMap } from "@/components/home/OriginMiniMap";
import { homeSectionTitleClass } from "@/components/home/FriendListPanel";
import { breedForDay, todayDateKey, type BarkKind } from "@/lib/dailyDog/breeds";
import { hasSeenDailyDog, markDailyDogSeen } from "@/lib/dailyDog/seen";

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

  return { breed, dayKey };
}

function playBark(
  kind: BarkKind,
  audioRef: MutableRefObject<HTMLAudioElement | null>,
  onDone: () => void,
) {
  audioRef.current?.pause();
  const audio = new Audio(`/sounds/barks/${kind}.m4a`);
  audio.volume = 0.75;
  audioRef.current = audio;
  const stop = window.setTimeout(() => {
    audio.pause();
    onDone();
  }, 2500);
  audio.addEventListener(
    "ended",
    () => {
      window.clearTimeout(stop);
      onDone();
    },
    { once: true },
  );
  void audio.play().catch(() => {
    window.clearTimeout(stop);
    onDone();
  });
}

export function DailyDogCard() {
  const { breed, dayKey } = useDailyBreed();
  const [open, setOpen] = useState(false);
  const [unseen, setUnseen] = useState(false);
  const [photoOpen, setPhotoOpen] = useState(false);
  const [barking, setBarking] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    setUnseen(!hasSeenDailyDog(dayKey));
  }, [dayKey]);

  useEffect(() => {
    return () => {
      audioRef.current?.pause();
    };
  }, []);

  useEffect(() => {
    if (!photoOpen) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setPhotoOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [photoOpen]);

  function markSeen() {
    if (!unseen) return;
    markDailyDogSeen(dayKey);
    setUnseen(false);
  }

  function toggle() {
    setOpen((v) => !v);
    markSeen();
  }

  function openPhoto() {
    setPhotoOpen(true);
    markSeen();
    setOpen(true);
  }

  function onBark() {
    if (barking) return;
    setBarking(true);
    playBark(breed.bark, audioRef, () => setBarking(false));
  }

  return (
    <section className="mb-5">
      <h2 className={`${homeSectionTitleClass} mb-2.5`}>Daily Dog</h2>

      <div className="overflow-hidden rounded-md border border-[var(--primary)]/35 bg-[var(--primary-soft)]">
        <div className="flex w-full items-center gap-3 px-4 py-3">
          <button
            type="button"
            onClick={openPhoto}
            className="relative shrink-0"
            aria-label={`View larger photo of ${breed.name}`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={breed.image}
              alt=""
              width={48}
              height={48}
              className="h-12 w-12 rounded-md object-cover"
            />
            {unseen && (
              <span
                className="absolute -right-1.5 -top-1.5 flex h-6 w-6 items-center justify-center rounded-md bg-white shadow-sm animate-bone-badge"
                aria-label="New daily dog"
              >
                <BoneIcon size={14} />
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={toggle}
            aria-expanded={open}
            className="flex min-w-0 flex-1 items-center gap-3 text-left transition active:scale-[0.99]"
          >
            <div className="min-w-0 flex-1">
              <p className="font-display text-sm font-bold text-[var(--foreground)]">
                {breed.name}
              </p>
              <p className="text-xs text-[var(--muted)]">
                {open
                  ? "Tap to hide story"
                  : unseen
                    ? "New pup today — tap for the story"
                    : "Tap for the story"}
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
        </div>

        <div
          className="grid transition-[grid-template-rows] duration-300 ease-out"
          style={{ gridTemplateRows: open ? "1fr" : "0fr" }}
        >
          <div className="min-h-0 overflow-hidden">
            <div className="border-t border-[var(--primary)]/25 px-4 py-3">
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={openPhoto}
                  className="relative shrink-0"
                  aria-label={`View larger photo of ${breed.name}`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={breed.image}
                    alt={breed.name}
                    width={120}
                    height={120}
                    className="h-[120px] w-[120px] rounded-md object-cover"
                  />
                  <span className="absolute bottom-1.5 right-1.5 rounded bg-black/55 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-white">
                    Expand
                  </span>
                </button>
                <div className="min-w-0 flex-1 space-y-2">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wide text-[var(--muted)]">
                      Say it
                    </p>
                    <p className="text-[13px] italic text-[var(--foreground)]">
                      {breed.pronunciation}
                    </p>
                  </div>
                  <dl className="space-y-1.5 text-sm">
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
              </div>

              <p className="mt-3 text-sm leading-relaxed text-[var(--foreground)]">
                {breed.story}
              </p>

              {open && (
                <div className="mt-3">
                  <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wide text-[var(--muted)]">
                    Where they come from
                  </p>
                  <OriginMiniMap lat={breed.lat} lng={breed.lng} label={breed.origin} />
                </div>
              )}

              <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2">
                <button
                  type="button"
                  onClick={onBark}
                  disabled={barking}
                  className="inline-flex items-center gap-1.5 rounded-md bg-[var(--foreground)] px-3 py-2 text-xs font-bold text-white active:scale-95 disabled:opacity-70"
                >
                  <PlayIcon width={14} height={14} />
                  {barking ? "Woofing…" : "Play bark"}
                </button>
                <a
                  href={breed.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-bold text-[var(--primary)] underline underline-offset-2"
                >
                  Story sources · {breed.sourceLabel}
                </a>
                <a
                  href="https://en.wikipedia.org/wiki/List_of_dog_breeds"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-bold text-[var(--primary)] underline underline-offset-2"
                >
                  More dog facts
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      {photoOpen && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-black/55 p-5"
          onClick={() => setPhotoOpen(false)}
          role="presentation"
        >
          <div
            className="relative w-full max-w-sm"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label={`${breed.name} photo`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={breed.image}
              alt={breed.name}
              className="max-h-[70dvh] w-full rounded-lg bg-white object-contain"
            />
            <p className="mt-2 text-center text-sm font-bold text-white">{breed.name}</p>
            <button
              type="button"
              onClick={() => setPhotoOpen(false)}
              className="absolute right-2 top-2 rounded-md bg-white/90 p-1.5 text-[var(--foreground)]"
              aria-label="Close photo"
            >
              <XIcon width={18} height={18} />
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
