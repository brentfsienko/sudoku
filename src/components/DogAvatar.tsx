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
  /** Slightly zoomed head in a circle (game history, etc.). */
  headCrop?: boolean;
};

const HEAD_ZOOM = 1.28;

export function DogAvatar({
  dogId,
  size = 48,
  ringColor,
  className,
  username,
  userData,
  preview,
  headCrop = false,
}: Props) {
  const resolved = preview
    ? resolveDogId(dogId, { username })
    : displayDogId(dogId, { username, userData });
  const dog = dogById(resolved);
  const ring = ringColor ? Math.max(2, Math.round(size * 0.06)) : 0;

  const img = headCrop ? (
    <span
      className="relative block overflow-hidden rounded-full bg-[var(--surface-soft)]"
      style={{ width: size, height: size }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={dog.image}
        alt=""
        className={`absolute left-1/2 top-1/2 max-w-none -translate-x-1/2 -translate-y-1/2 object-cover ${className ?? ""}`}
        style={{
          width: size * HEAD_ZOOM,
          height: size * HEAD_ZOOM,
          imageRendering: "pixelated",
        }}
        aria-hidden
      />
    </span>
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
