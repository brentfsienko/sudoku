"use client";

import { useEffect, useState } from "react";
import { BRAND_SPIN_FRAMES } from "@/lib/brand";

const FRAME_MS = 140;

/** Pixel golden dog head — spins on the main tab header. */
export function AppDogIcon({ size = 42 }: { size?: number }) {
  const [frame, setFrame] = useState(0);
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const apply = () => setReduceMotion(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  useEffect(() => {
    if (reduceMotion) return;
    const id = window.setInterval(() => {
      setFrame((f) => (f + 1) % BRAND_SPIN_FRAMES.length);
    }, FRAME_MS);
    return () => window.clearInterval(id);
  }, [reduceMotion]);

  const src = BRAND_SPIN_FRAMES[reduceMotion ? 0 : frame];

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt=""
      width={size}
      height={size}
      className="block shrink-0 object-contain"
      style={{ imageRendering: "pixelated" }}
      aria-hidden
    />
  );
}
