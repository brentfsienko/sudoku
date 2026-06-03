import { displayDogId } from "@/lib/dogs/display";
import { dogById, resolveDogId } from "@/lib/theme/dogs";
import type { UserData } from "@/lib/stats/types";

type Props = {
  dogId: string;
  size?: number;
  ringColor?: string;
  className?: string;
  username?: string;
  email?: string | null;
  userData?: UserData;
  preview?: boolean;
  /** Transparent head only — no tile (recent games, picker, etc.). */
  bare?: boolean;
};

export function DogAvatar({
  dogId,
  size = 48,
  ringColor,
  className,
  username,
  email,
  userData,
  preview,
  bare = false,
}: Props) {
  const resolved = preview
    ? resolveDogId(dogId, { username, email })
    : displayDogId(dogId, { username, email, userData });
  const dog = dogById(resolved);
  const ring = ringColor ? Math.max(2, Math.round(size * 0.06)) : 0;

  const img = (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={dog.image}
      alt=""
      width={size}
      height={size}
      className={`block object-contain ${bare ? "" : "rounded-[22%]"} ${className ?? ""}`}
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
