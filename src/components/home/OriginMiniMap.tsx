type Props = {
  lat: number;
  lng: number;
  label: string;
};

/** Small OSM map of the breed’s origin. Tap opens the full map. */
export function OriginMiniMap({ lat, lng, label }: Props) {
  const zoom = 4;
  const pad = 18;
  const bbox = `${lng - pad},${lat - pad / 2},${lng + pad},${lat + pad / 2}`;
  const embed = `https://www.openstreetmap.org/export/embed.html?bbox=${encodeURIComponent(bbox)}&layer=mapnik&marker=${lat}%2C${lng}`;
  const openUrl = `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=${zoom}/${lat}/${lng}`;

  return (
    <div className="overflow-hidden rounded-md border border-[var(--primary)]/25 bg-white">
      <div className="relative">
        <iframe
          title={`Map of ${label}`}
          src={embed}
          className="pointer-events-none block h-[120px] w-full border-0"
          loading="lazy"
          tabIndex={-1}
          referrerPolicy="no-referrer-when-downgrade"
        />
        <a
          href={openUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="absolute inset-0"
          aria-label={`Open a map of ${label}`}
        />
      </div>
      <p className="px-2 py-1 text-center text-[10px] font-bold uppercase tracking-wide text-[var(--muted)]">
        {label} · Open map
      </p>
    </div>
  );
}
