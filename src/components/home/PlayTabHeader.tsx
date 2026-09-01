/** Pinned header for the Play tab — Sudogku wordmark in white, no paw. */
export function PlayTabHeader() {
  return (
    <div className="flex items-center justify-between">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/brand/Sudogku_Text_White.svg"
        alt="Sudogku"
        className="h-[35px] w-auto"
        style={{ imageRendering: "pixelated" }}
        aria-label="Sudogku"
      />
    </div>
  );
}
