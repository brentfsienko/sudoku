/** Golden dog from /icon.svg — app brand mark. */
export function AppDogIcon({ size = 42 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      className="block shrink-0"
      role="img"
      aria-hidden
    >
      <circle cx="50" cy="52" r="34" fill="#f4c87a" />
      <ellipse
        cx="26"
        cy="42"
        rx="10"
        ry="17"
        fill="#e0a956"
        transform="rotate(-18 26 42)"
      />
      <ellipse
        cx="74"
        cy="42"
        rx="10"
        ry="17"
        fill="#e0a956"
        transform="rotate(18 74 42)"
      />
      <ellipse cx="50" cy="62" rx="17" ry="14" fill="#fbe7c2" />
      <circle cx="40" cy="48" r="4" fill="#3a2c20" />
      <circle cx="60" cy="48" r="4" fill="#3a2c20" />
      <ellipse cx="50" cy="58" rx="5" ry="3.6" fill="#3a2c20" />
      <path
        d="M50 61 Q50 68 44 68 M50 61 Q50 68 56 68"
        stroke="#3a2c20"
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
      />
    </svg>
  );
}
