import { ImageResponse } from "next/og";

export const alt = "Sudogku — dog-themed Sudoku";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** Golden dog mark (same shapes as AppDogIcon / icon.svg, no background tile). */
function OgDogIcon({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100">
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

export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "#7ec4cf",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 40,
            background: "#fdf6ec",
            borderRadius: 40,
            padding: "56px 72px",
            boxShadow: "0 24px 48px rgba(74, 59, 47, 0.15)",
          }}
        >
          <OgDogIcon size={140} />
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 12,
            }}
          >
            <div
              style={{
                fontSize: 88,
                fontWeight: 700,
                color: "#4a3b2f",
                letterSpacing: "-0.02em",
              }}
            >
              Sudogku
            </div>
            <div
              style={{
                fontSize: 32,
                color: "#9a8a79",
              }}
            >
              Sudoku with friends
            </div>
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
