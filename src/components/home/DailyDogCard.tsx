"use client";

import { useEffect, useMemo, useRef, useState, type MutableRefObject } from "react";
import { createPortal } from "react-dom";
import { ChevronDownIcon, PlayIcon, VolumeIcon, XIcon } from "@/components/icons";
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

function playClip(
  src: string,
  audioRef: MutableRefObject<HTMLAudioElement | null>,
  onDone: () => void,
  maxMs?: number,
) {
  audioRef.current?.pause();
  const audio = new Audio(src);
  audio.volume = 0.8;
  audioRef.current = audio;
  let stop: number | undefined;
  if (maxMs) {
    stop = window.setTimeout(() => {
      audio.pause();
      onDone();
    }, maxMs);
  }
  audio.addEventListener(
    "ended",
    () => {
      if (stop) window.clearTimeout(stop);
      onDone();
    },
    { once: true },
  );
  void audio.play().catch(() => {
    if (stop) window.clearTimeout(stop);
    onDone();
  });
}

export function DailyDogCard() {
  const { breed, dayKey } = useDailyBreed();
  const [open, setOpen] = useState(false);
  const [unseen, setUnseen] = useState(false);
  const [photoOpen, setPhotoOpen] = useState(false);
  const [barking, setBarking] = useState(false);
  const [saying, setSaying] = useState(false);
  const [portalReady, setPortalReady] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    setPortalReady(true);
  }, []);

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
  }

  function onBark() {
    if (barking) return;
    setSaying(false);
    setBarking(true);
    playClip(`/sounds/barks/${breed.bark as BarkKind}.m4a`, audioRef, () => setBarking(false), 2500);
  }

  function onSayName() {
    if (saying) return;
    setBarking(false);
    setSaying(true);
    playClip(`/sounds/names/${breed.id}.m4a`, audioRef, () => setSaying(false));
  }

  const photoViewer =
    portalReady && photoOpen
      ? createPortal(
          <div
            className="fixed inset-0 z-[200] flex items-center justify-center p-6"
            onClick={() => setPhotoOpen(false)}
            role="presentation"
          >
            <div
              className="relative max-h-[85dvh] max-w-[min(28rem,92vw)]"
              onClick={(e) => e.stopPropagation()}
              role="dialog"
              aria-modal="true"
              aria-label={`${breed.name} photo`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={breed.image}
                alt={breed.name}
                className="max-h-[85dvh] w-full rounded-md object-contain shadow-xl"
              />
              <button
                type="button"
                onClick={() => setPhotoOpen(false)}
                className="absolute right-1.5 top-1.5 rounded-md bg-white p-1.5 text-[var(--foreground)] shadow"
                aria-label="Close photo"
              >
                <XIcon width={18} height={18} />
              </button>
            </div>
          </div>,
          document.body,
        )
      : null;

  return (
    <section className="mb-5">
      <h2 className={`${homeSectionTitleClass} mb-2.5 flex items-center gap-2`}>
        Daily Dog
        {unseen && (
          <span
            className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#e23d3d] text-[12px] font-bold leading-none text-white animate-new-badge"
            aria-label="New daily dog"
          >
            !
          </span>
        )}
      </h2>

      <div className="overflow-hidden rounded-md border border-[var(--primary)]/35 bg-[var(--primary-soft)]">
        {!open && (
          <button
            type="button"
            onClick={toggle}
            aria-expanded={false}
            className="flex w-full items-center gap-3 px-4 py-3 text-left transition active:scale-[0.99]"
          >
            <div className="min-w-0 flex-1">
              <p className="font-display text-sm font-bold text-[var(--foreground)]">
                Today’s pup
              </p>
              <p className="text-xs text-[var(--muted)]">
                {unseen ? "New pup today — tap for the story" : "Tap for the story"}
              </p>
            </div>
            <ChevronDownIcon width={20} height={20} className="shrink-0 text-[var(--muted)]" />
          </button>
        )}

        {open && (
          <div className="px-4 py-3">
            <div className="flex items-start gap-2">
              <div className="min-w-0 flex-1">
                <p className="font-display text-base font-bold leading-snug text-[var(--foreground)]">
                  {breed.name}{" "}
                  <span className="font-sans text-sm font-normal italic text-[var(--muted)]">
                    ({breed.pronunciation})
                  </span>
                  <button
                    type="button"
                    onClick={onSayName}
                    disabled={saying}
                    className="ml-1.5 inline-flex align-middle text-[var(--foreground)] active:scale-95 disabled:opacity-60"
                    aria-label={`Hear how to say ${breed.name}`}
                  >
                    <VolumeIcon width={16} height={16} />
                  </button>
                </p>
              </div>
              <button
                type="button"
                onClick={toggle}
                aria-expanded
                className="shrink-0 p-0.5 text-[var(--muted)]"
                aria-label="Hide today’s dog"
              >
                <ChevronDownIcon width={20} height={20} className="rotate-180" />
              </button>
            </div>

            <button
              type="button"
              onClick={openPhoto}
              className="mt-3 block w-full"
              aria-label={`View larger photo of ${breed.name}`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={breed.image}
                alt={breed.name}
                className="h-44 w-full rounded-md object-cover"
              />
            </button>

            <div className="mt-3 flex items-start gap-3">
              <dl className="min-w-0 flex-1 space-y-1.5 text-sm">
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
              <div className="flex w-[7.25rem] shrink-0 flex-col items-stretch gap-1">
                <button
                  type="button"
                  onClick={onBark}
                  disabled={barking}
                  className="inline-flex flex-col items-center gap-1 rounded-md bg-[var(--foreground)] px-2 py-2.5 text-center text-[11px] font-bold leading-tight text-white active:scale-95 disabled:opacity-70"
                >
                  <PlayIcon width={16} height={16} />
                  {barking ? "Woofing…" : "Play a similar bark"}
                </button>
                <p className="text-[10px] leading-snug text-[var(--muted)]">
                  Not this exact breed — just a similar size of bark.
                </p>
              </div>
            </div>

            <p className="mt-3 font-display text-sm font-bold text-[var(--foreground)]">
              {breed.intro}
            </p>
            <p className="mt-1.5 text-sm leading-relaxed text-[var(--foreground)]">
              {breed.story}
            </p>

            <div className="mt-3">
              <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wide text-[var(--muted)]">
                Where they come from
              </p>
              <OriginMiniMap lat={breed.lat} lng={breed.lng} label={breed.origin} />
            </div>

            <a
              href={breed.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-block text-xs font-bold text-[var(--primary)] underline underline-offset-2"
            >
              Story sources · {breed.sourceLabel}
            </a>
          </div>
        )}
      </div>

      {photoViewer}
    </section>
  );
}
