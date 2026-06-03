import { BRAND_DOG_IMAGE } from "@/lib/brand";

/** Pixel golden dog head — Sudogku brand mark (no background tile). */
export function AppDogIcon({ size = 42 }: { size?: number }) {
  return (
    <span
      className="relative block shrink-0 overflow-hidden rounded-[22%]"
      style={{ width: size, height: size }}
      aria-hidden
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={BRAND_DOG_IMAGE}
        alt=""
        className="absolute left-1/2 top-[46%] max-w-none -translate-x-1/2 -translate-y-1/2"
        style={{
          width: size * 1.55,
          height: size * 1.55,
          imageRendering: "pixelated",
        }}
      />
    </span>
  );
}
