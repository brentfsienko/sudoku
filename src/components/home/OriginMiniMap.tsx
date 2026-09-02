type Props = {
  lat: number;
  lng: number;
  label: string;
};

/** Real equirectangular world map with a pin. x=(lng+180)/360, y=(90-lat)/180 */
export function OriginMiniMap({ lat, lng, label }: Props) {
  const left = Math.min(98, Math.max(2, ((lng + 180) / 360) * 100));
  const top = Math.min(96, Math.max(4, ((90 - lat) / 180) * 100));

  return (
    <div className="overflow-hidden rounded-md border border-[var(--primary)]/25 bg-white">
      <div className="relative w-full" style={{ aspectRatio: "2 / 1" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/maps/world.png"
          alt=""
          className="absolute inset-0 h-full w-full object-fill"
        />
        <span
          className="absolute z-[1] h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-[#f2a059] shadow-[0_1px_4px_rgba(0,0,0,0.35)]"
          style={{ left: `${left}%`, top: `${top}%` }}
          aria-hidden
        />
      </div>
      <p className="px-2 py-1 text-center text-[10px] font-bold uppercase tracking-wide text-[var(--muted)]">
        {label}
      </p>
    </div>
  );
}
