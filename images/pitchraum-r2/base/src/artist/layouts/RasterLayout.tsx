import type { LayoutContent } from '../types';
import { CoverArt } from '../CoverArt';

/**
 * Gestalt „Raster“: Kachelraster mit Coverflächen, wenig Text.
 */
export function RasterLayout({ content }: { content: LayoutContent }) {
  return (
    <div
      style={{
        backgroundColor: 'var(--brand-background)',
        color: 'var(--brand-text)',
        fontFamily: 'var(--font-family-body)',
      }}
      className="min-h-screen"
    >
      {/* Schmaler Kopf — wenig Text */}
      <header className="flex flex-wrap items-baseline justify-between gap-2 px-5 py-6 sm:px-8">
        <h1
          className="text-2xl font-black uppercase tracking-tight sm:text-3xl"
          style={{ fontFamily: 'var(--font-family-display)' }}
        >
          {content.name}
        </h1>
        <p
          className="text-xs uppercase tracking-[0.25em]"
          style={{ fontFamily: 'var(--font-family-mono)', color: 'var(--brand-accent)' }}
        >
          {content.roleLine}
        </p>
      </header>

      {/* Kachelraster */}
      <ul
        aria-label="Stücke als Kacheln"
        className="grid grid-cols-2 gap-2 px-2 pb-2 sm:grid-cols-3 sm:gap-3 sm:px-3 sm:pb-3"
      >
        {content.tracks.map((track) => (
          <li key={track.id} className="group relative aspect-square overflow-hidden">
            <CoverArt seed={`raster-${track.id}`} className="h-full w-full" />
            {/* Wenig Text, erst recht sparsam — erscheint bei Fokus/Hover */}
            <div
              className="absolute inset-x-0 bottom-0 p-3 opacity-0 transition-opacity duration-200 group-hover:opacity-100 group-focus-within:opacity-100"
              style={{
                background:
                  'linear-gradient(to top, var(--brand-background) 12%, transparent)',
              }}
            >
              <p className="text-sm font-bold leading-tight">{track.title}</p>
              <p
                className="text-xs"
                style={{ fontFamily: 'var(--font-family-mono)', opacity: 0.85 }}
              >
                {track.catalogNo} · {track.durationFormatted}
              </p>
            </div>
            {/* Tastaturzugängliche Kachel */}
            <button
              type="button"
              aria-label={`${track.title}, ${track.durationFormatted}, Stimmung ${track.mood}: ${track.description}`}
              className="absolute inset-0 cursor-default focus-visible:outline-4 focus-visible:outline-offset-[-4px]"
              style={{ outlineColor: 'var(--brand-accent)' }}
            />
          </li>
        ))}
      </ul>

      {/* Schlusszeile */}
      <footer className="flex flex-wrap items-baseline justify-between gap-2 px-5 py-6 sm:px-8">
        <p className="max-w-md text-sm leading-relaxed" style={{ opacity: 0.9 }}>
          {content.tagline}
        </p>
        <p
          className="text-xs"
          style={{ fontFamily: 'var(--font-family-mono)', opacity: 0.7 }}
        >
          {content.tracks.length} Stücke · Demo
        </p>
      </footer>
    </div>
  );
}
