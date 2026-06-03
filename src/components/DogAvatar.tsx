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
  /** Crop to head and blend out the cream tile (history, lists). */
  headCrop?: boolean;
};

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
      className="relative block overflow-hidden rounded-full"
      style={{ width: size, height: size }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={dog.image}
        alt=""
        className={`pixel-dog-head pixel-dog-knockout absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 ${className ?? ""}`}
        style={{
          width: size * 1.85,
          height: size * 1.85,
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
      className={`block object-cover pixel-dog-knockout ${headCrop ? "rounded-full" : "rounded-[22%]"} ${className ?? ""}`}
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
