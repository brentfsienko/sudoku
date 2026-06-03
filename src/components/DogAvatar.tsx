import { displayDogId } from "@/lib/dogs/display";
import { dogById } from "@/lib/theme/dogs";
import type { UserData } from "@/lib/stats/types";

type Props = {
  dogId: string;
  size?: number;
  /** Optional colored ring (e.g. the player's color). */
  ringColor?: string;
  className?: string;
  username?: string;
  userData?: UserData;
};

/** Pixel art profile dog. */
export function DogAvatar({
  dogId,
  size = 48,
  ringColor,
  className,
  username,
  userData,
}: Props) {
  const resolved = displayDogId(dogId, { username, userData });
  const dog = dogById(resolved);
  const ring = ringColor ? Math.max(2, Math.round(size * 0.06)) : 0;

  const img = (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={dog.image}
      alt=""
      width={size}
      height={size}
      className={`block rounded-[22%] object-cover ${className ?? ""}`}
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
      className="inline-flex rounded-[24%]"
      style={{
        padding: ring,
        background: ringColor,
      }}
    >
      {img}
    </span>
  );
}
