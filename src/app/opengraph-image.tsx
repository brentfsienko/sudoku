import { ImageResponse } from "next/og";
import { brandLogoDataUrl } from "@/lib/brand-logo-data-url";

export const alt = "Sudogku — free online Sudoku, solo and multiplayer";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OgImage() {
  const logoSrc = brandLogoDataUrl();

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
          background: "#fdf6ec",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 32,
            background: "#ffffff",
            borderRadius: 48,
            padding: "64px 80px 56px",
            boxShadow: "0 24px 64px rgba(73,59,47,0.12)",
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={logoSrc}
            width={560}
            height={232}
            alt="Sudogku"
            style={{ objectFit: "contain" }}
          />
          <div
            style={{
              fontSize: 28,
              fontWeight: 600,
              color: "#9a8a79",
              letterSpacing: "0.02em",
            }}
          >
            Sudoku with friends
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
