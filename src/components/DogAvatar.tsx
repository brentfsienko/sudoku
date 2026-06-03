import { displayDogId } from "@/lib/dogs/display";
import { dogById, resolveDogId } from "@/lib/theme/dogs";
import type { UserData } from "@/lib/stats/types";

type Props = {
  dogId: string;
  size?: number;
  ringColor?: string;
  className?: string;
  username?: string;
  userData?: UserData;
  preview?: boolean;
  /**
   * Show head only on light panels (e.g. recent games) — no tile or circle;
   * cream in the PNG is knocked out via multiply blend.
   */
  bare?: boolean;
};

export function DogAvatar({
  dogId,
  size = 48,
  ringColor,
  className,
  username,
  userData,
  preview,
  bare = false,
}: Props) {
  const resolved = preview
    ? resolveDogId(dogId, { username })
    : displayDogId(dogId, { username, userData });
  const dog = dogById(resolved);
  const ring = ringColor ? Math.max(2, Math.round(size * 0.06)) : 0;

  const img = bare ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={dog.image}
      alt=""
      width={size}
      height={size}
      className={`block object-contain mix-blend-multiply ${className ?? ""}`}
      style={{ imageRendering: "pixelated" }}
      aria-hidden
    />
  ) : (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={dog.image}
      alt=""
      width={size}
      height={size}
      className={`block rounded-[22%] object-cover ${className ?? ""}`}
      style={{ imageRendering: "pixelated" }}
      aria-hidden
    />
  );

  if (!ring) {
    return (
      <span role="img" aria-label={`${dog.breed} avatar`}>
        {img}
      </span>
    );
  }

  return (
    <span
      role="img"
      aria-label={`${dog.breed} avatar`}
      className="inline-flex items-center justify-center rounded-full"
      style={{
        padding: ring,
        background: ringColor,
      }}
    >
      {img}
    </span>
  );
}
