import { ImageResponse } from "next/og";

export const alt = "Sudogku — dog-themed Sudoku";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

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
          <div
            style={{
              display: "flex",
              position: "relative",
              width: 140,
              height: 140,
            }}
          >
            <div
              style={{
                position: "absolute",
                width: 120,
                height: 120,
                borderRadius: "50%",
                background: "#f4c87a",
                left: 10,
                top: 14,
              }}
            />
            <div
              style={{
                position: "absolute",
                width: 36,
                height: 52,
                borderRadius: "50%",
                background: "#e0a956",
                left: 0,
                top: 18,
                transform: "rotate(-18deg)",
              }}
            />
            <div
              style={{
                position: "absolute",
                width: 36,
                height: 52,
                borderRadius: "50%",
                background: "#e0a956",
                right: 0,
                top: 18,
                transform: "rotate(18deg)",
              }}
            />
            <div
              style={{
                position: "absolute",
                width: 56,
                height: 44,
                borderRadius: "50%",
                background: "#fbe7c2",
                left: 42,
                top: 72,
              }}
            />
            <div
              style={{
                position: "absolute",
                width: 14,
                height: 14,
                borderRadius: "50%",
                background: "#3a2c20",
                left: 48,
                top: 52,
              }}
            />
            <div
              style={{
                position: "absolute",
                width: 14,
                height: 14,
                borderRadius: "50%",
                background: "#3a2c20",
                right: 48,
                top: 52,
              }}
            />
          </div>
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
