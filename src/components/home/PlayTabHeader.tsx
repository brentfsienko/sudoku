/** Pinned header for the Play tab — Sudogku wordmark only, peach on accent background. */
export function PlayTabHeader() {
  return (
    <div className="flex items-center justify-between">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/brand/Sudogku_Text_Peach.svg"
        alt="Sudogku"
        className="h-8 w-auto"
        style={{ imageRendering: "pixelated" }}
        aria-label="Sudogku"
      />
    </div>
  );
}
