import { readFileSync } from "node:fs";
import { join } from "node:path";

let cachedOrange: string | null = null;

/** Base64 PNG data URL for the Sudogku orange logo lockup (OG / server-rendered assets). */
export function brandLogoDataUrl(): string {
  if (cachedOrange) return cachedOrange;
  const buf = readFileSync(
    join(process.cwd(), "public/brand/Sudogku_Orange.png"),
  );
  cachedOrange = `data:image/png;base64,${buf.toString("base64")}`;
  return cachedOrange;
}
