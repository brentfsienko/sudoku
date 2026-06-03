import { ImageResponse } from "next/og";
import { brandDogDataUrl } from "@/lib/brand-dog-data-url";

export const alt = "Sudogku — dog-themed Sudoku";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OgImage() {
  const dogSrc = brandDogDataUrl();

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
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={dogSrc}
            width={280}
            height={280}
            alt=""
            style={{ objectFit: "contain" }}
          />
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
