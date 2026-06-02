import { dogById } from "@/lib/theme/dogs";

type Props = {
  dogId: string;
  size?: number;
  /** Optional colored ring (e.g. the player's color). */
  ringColor?: string;
  className?: string;
};

/** A friendly, parametric cartoon dog face rendered as SVG. */
export function DogAvatar({ dogId, size = 48, ringColor, className }: Props) {
  const dog = dogById(dogId);
  const ringWidth = ringColor ? 3 : 0;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      className={className}
      role="img"
      aria-label={`${dog.breed} avatar`}
    >
      {ringColor && (
        <circle
          cx="50"
          cy="50"
          r={48}
          fill="none"
          stroke={ringColor}
          strokeWidth={ringWidth}
        />
      )}
      <circle cx="50" cy="50" r="44" fill={dog.fur} />

      {/* Ears */}
      <ellipse cx="20" cy="40" rx="13" ry="22" fill={dog.ear} transform="rotate(-18 20 40)" />
      <ellipse cx="80" cy="40" rx="13" ry="22" fill={dog.ear} transform="rotate(18 80 40)" />

      {/* Spots for dalmatian */}
      {dog.spots && (
        <>
          <circle cx="34" cy="32" r="6" fill="#2f2f2f" opacity="0.85" />
          <circle cx="70" cy="60" r="5" fill="#2f2f2f" opacity="0.85" />
          <circle cx="60" cy="28" r="3.5" fill="#2f2f2f" opacity="0.85" />
        </>
      )}

      {/* Muzzle */}
      <ellipse cx="50" cy="62" rx="22" ry="18" fill={dog.muzzle} />

      {/* Eyes */}
      <circle cx="38" cy="46" r="5" fill="#3a2c20" />
      <circle cx="62" cy="46" r="5" fill="#3a2c20" />
      <circle cx="39.5" cy="44.5" r="1.6" fill="#fff" />
      <circle cx="63.5" cy="44.5" r="1.6" fill="#fff" />

      {/* Nose */}
      <ellipse cx="50" cy="58" rx="6" ry="4.5" fill="#3a2c20" />
      {/* Smile */}
      <path
        d="M50 62 Q50 70 42 70 M50 62 Q50 70 58 70"
        stroke="#3a2c20"
        strokeWidth="2.4"
        fill="none"
        strokeLinecap="round"
      />
      {/* Tongue */}
      <path d="M46 70 Q50 78 54 70 Z" fill="#ef8fa0" />
    </svg>
  );
}
