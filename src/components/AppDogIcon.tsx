import { BRAND_DOG_IMAGE } from "@/lib/brand";

/** Pixel golden dog head on accent header — cream tile knocked out via multiply. */
export function AppDogIcon({ size = 42 }: { size?: number }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={BRAND_DOG_IMAGE}
      alt=""
      width={size}
      height={size}
      className="block shrink-0 object-contain mix-blend-multiply"
      style={{ imageRendering: "pixelated" }}
      aria-hidden
    />
  );
}
