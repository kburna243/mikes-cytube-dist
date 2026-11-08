import type { LayoutContent } from '../types';
import { CoverArt } from '../CoverArt';

/**
 * Gestalt „Leinwand“: vollflächige Bildfläche, Titel darüber, filmisch.
 * Die Bildfläche ist eine selbst erzeugte, abstrakte SVG-Komposition
 * in den Markenfarben (kein Foto).
 */
export function LeinwandLayout({ content }: { content: LayoutContent }) {
  const featured =
    content.tracks.find((t) => t.id === content.featuredTrackId) || content.tracks[0] || null;
  const rest = content.tracks.filter((t) => t.id !== featured?.id);

  return (
    <div
      style={{
        backgroundColor: 'var(--brand-background)',
        color: 'var(--brand-text)',
        fontFamily: 'var(--font-family-body)',
      }}
      className="min-h-screen"
    >
      {/* Vollflächige Bildfläche mit Titel darüber */}
      <section
        aria-labelledby="leinwand-titel"
        className="relative flex min-h-[82vh] flex-col justify-end overflow-hidden"
      >
        <div className="absolute inset-0" aria-hidden="true">
          <CoverArt seed={`leinwand-${content.name}`} className="h-full w-full" />
          {/* Abdunkelnde Fläche aus der Marken-Hintergrundfarbe für Lesbarkeit */}
          <div
            className="absolute inset-0"
            style={{
              background:
                'linear-gradient(to top, var(--brand-background) 4%, transparent 55%)',
            }}
          />
        </div>

        <div className="relative px-5 pb-10 pt-24 sm:px-10">
          <p
            className="text-xs uppercase tracking-[0.4em]"
            style={{ fontFamily: 'var(--font-family-mono)', color: 'var(--brand-accent)' }}
          >
            {content.roleLine}
          </p>
          <h1
            id="leinwand-titel"
            className="mt-3 font-black uppercase leading-[0.95]"
            style={{
              fontFamily: 'var(--font-family-display)',
              fontSize: 'clamp(2.8rem, 12vw, 9rem)',
            }}
          >
            {content.name}
          </h1>
          {content.tagline && (
            <p className="mt-4 max-w-2xl text-lg sm:text-xl">{content.tagline}</p>
          )}
        </div>
      </section>

      {/* Hauptstück als Kino-Zeile */}
      {featured && (
        <section
          aria-labelledby="leinwand-hauptstueck"
          className="border-y-4 px-5 py-10 sm:px-10"
          style={{ borderColor: 'var(--brand-accent)', backgroundColor: 'var(--brand-secondary)' }}
        >
          <p
            className="text-xs uppercase tracking-[0.35em]"
            style={{ fontFamily: 'var(--font-family-mono)', color: 'var(--brand-accent)' }}
          >
            Aktuelles Hauptstück
          </p>
          <h2
            id="leinwand-hauptstueck"
            className="mt-4 font-black uppercase leading-tight"
            style={{
              fontFamily: 'var(--font-family-display)',
              fontSize: 'clamp(1.8rem, 6vw, 4.5rem)',
            }}
          >
            {featured.title}
          </h2>
          <p className="mt-3 text-sm" style={{ fontFamily: 'var(--font-family-mono)' }}>
            {featured.durationFormatted} · {featured.bpm} BPM · {featured.genre}
          </p>
          <p className="mt-4 max-w-3xl text-base leading-relaxed sm:text-lg">
            {featured.description}
          </p>
        </section>
      )}

      {/* Weitere Stücke als Szenen-Übersicht */}
      <section aria-labelledby="leinwand-szenen" className="px-5 py-12 sm:px-10">
        <h2
          id="leinwand-szenen"
          className="text-xs uppercase tracking-[0.35em]"
          style={{ fontFamily: 'var(--font-family-mono)', color: 'var(--brand-accent)' }}
        >
          Szenen aus dem Katalog
        </h2>
        <ul className="mt-8 grid grid-cols-1 gap-x-10 gap-y-8 sm:grid-cols-2">
          {rest.map((track) => (
            <li key={track.id}>
              <div className="aspect-[21/9] overflow-hidden" aria-hidden="true">
                <CoverArt seed={`leinwand-${track.id}`} className="h-full w-full" />
              </div>
              <h3
                className="mt-3 text-2xl font-bold uppercase leading-tight"
                style={{ fontFamily: 'var(--font-family-display)' }}
              >
                {track.title}
              </h3>
              <p
                className="mt-1 text-xs"
                style={{ fontFamily: 'var(--font-family-mono)', opacity: 0.85 }}
              >
                {track.catalogNo} · {track.durationFormatted} · {track.bpm} BPM · Stimmung: {track.mood}
              </p>
              <p className="mt-2 text-sm leading-relaxed" style={{ opacity: 0.9 }}>
                {track.description}
              </p>
            </li>
          ))}
        </ul>
      </section>

      <footer className="px-5 pb-10 pt-2 text-xs sm:px-10" style={{ opacity: 0.75 }}>
        <p style={{ fontFamily: 'var(--font-family-mono)' }}>
          {content.name} · Hörproben und Anfragen laufen über einen persönlichen Musikauswahl-Link.
        </p>
      </footer>
    </div>
  );
}
