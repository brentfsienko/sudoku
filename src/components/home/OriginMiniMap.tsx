type Props = {
  lat: number;
  lng: number;
  label: string;
};

/** Static world image with a pin. Equirectangular: x=(lng+180)/360, y=(90-lat)/180 */
export function OriginMiniMap({ lat, lng, label }: Props) {
  const x = Math.min(196, Math.max(4, ((lng + 180) / 360) * 200));
  const y = Math.min(96, Math.max(4, ((90 - lat) / 180) * 100));

  return (
    <div className="overflow-hidden rounded-md border border-[var(--primary)]/25 bg-white">
      <svg viewBox="0 0 200 100" className="block h-[110px] w-full" aria-hidden>
        <rect width="200" height="100" fill="#7ec4cf" />
        {/* Simplified continents — readable at thumbnail size, not a real basemap */}
        <path
          fill="#c9b291"
          d="M18 30c4-12 22-18 36-12 8 2 14 8 12 16-3 10-8 16-18 22-8 4-16 2-22-4-6-6-10-14-8-22z"
        />
        <path fill="#c9b291" d="M40 58c6 2 12 10 10 22-2 8-10 16-16 14-8-2-10-14-6-24 2-6 8-14 12-12z" />
        <path fill="#c9b291" d="M88 22c10-6 18-4 22 6 2 8-2 16-8 22-8 6-16 4-20-4-4-10 0-18 6-24z" />
        <path fill="#c9b291" d="M98 48c8-2 14 6 12 18-2 12-10 22-16 20-8-2-10-16-4-26 2-6 6-10 8-12z" />
        <path
          fill="#c9b291"
          d="M118 24c16-10 36-8 48 4 10 10 14 22 6 32-10 10-28 12-42 6-12-6-16-18-12-28 2-6 0-10 0-14z"
        />
        <path fill="#c9b291" d="M158 68c8-2 16 2 18 10 2 6-2 12-10 14-8 0-16-6-16-12 0-6 4-10 8-12z" />
        <circle cx={x} cy={y} r="7" fill="white" />
        <circle cx={x} cy={y} r="4.5" fill="#f2a059" />
      </svg>
      <p className="px-2 py-1 text-center text-[10px] font-bold uppercase tracking-wide text-[var(--muted)]">
        {label}
      </p>
    </div>
  );
}
