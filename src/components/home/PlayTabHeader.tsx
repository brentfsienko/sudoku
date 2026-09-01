/** Pinned header for the Play tab — Sudogku logo lockup. */
export function PlayTabHeader() {
  return (
    <div className="flex items-center justify-between">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/brand/Sudogku_Orange.svg"
        alt="Sudogku"
        className="h-10 w-auto"
        style={{ imageRendering: "pixelated" }}
        aria-label="Sudogku"
      />
    </div>
  );
}
