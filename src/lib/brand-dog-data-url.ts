import { readFileSync } from "node:fs";
import { join } from "node:path";

let cached: string | null = null;

/** Base64 data URL for OG / server-rendered assets (Satori cannot load /public paths). */
export function brandDogDataUrl(): string {
  if (cached) return cached;
  const buf = readFileSync(
    join(process.cwd(), "public/dogs/golden.png"),
  );
  cached = `data:image/png;base64,${buf.toString("base64")}`;
  return cached;
}
