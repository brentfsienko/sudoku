import { BRAND_DOG_IMAGE } from "@/lib/brand";

/** Pixel golden dog head — Sudogku brand mark. */
export function AppDogIcon({ size = 42 }: { size?: number }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={BRAND_DOG_IMAGE}
      alt=""
      width={size}
      height={size}
      className="block shrink-0 object-contain"
      style={{ imageRendering: "pixelated" }}
      aria-hidden
    />
  );
}
