import type { LayoutContent } from '../types';

/**
 * Gestalt „Plakat“: übergroße Typografie, ein Haupttrack, klare vertikale Blöcke.
 * Liest ausschließlich die Markenvariablen — keine festen Farben.
 */
export function PlakatLayout({ content }: { content: LayoutContent }) {
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
      {/* Block 1: Name als Plakatschrift */}
      <header className="border-b-4 px-5 py-10 sm:px-10" style={{ borderColor: 'var(--brand-text)' }}>
        <p
          className="text-xs uppercase tracking-[0.35em] sm:text-sm"
          style={{ fontFamily: 'var(--font-family-mono)', color: 'var(--brand-accent)' }}
        >
          {content.roleLine}
        </p>
        <h1
          className="mt-3 break-words font-black uppercase leading-[0.95]"
          style={{
            fontFamily: 'var(--font-family-display)',
            fontSize: 'clamp(2.6rem, 11vw, 8.5rem)',
          }}
        >
          {content.name}
        </h1>
        {content.tagline && (
          <p className="mt-4 max-w-2xl text-lg sm:text-2xl" style={{ color: 'var(--brand-primary)' }}>
            {content.tagline}
          </p>
        )}
      </header>

      {/* Block 2: Der eine Haupttrack, überlebensgroß */}
      {featured && (
        <section
          aria-labelledby="plakat-haupttrack"
          className="border-b-4 px-5 py-12 sm:px-10 sm:py-16"
          style={{ borderColor: 'var(--brand-text)', backgroundColor: 'var(--brand-secondary)' }}
        >
          <p
            className="text-xs uppercase tracking-[0.3em]"
            style={{ fontFamily: 'var(--font-family-mono)', color: 'var(--brand-accent)' }}
          >
            Hauptstück · {featured.catalogNo}
          </p>
          <h2
            id="plakat-haupttrack"
            className="mt-3 font-black uppercase leading-[1.02]"
            style={{
              fontFamily: 'var(--font-family-display)',
              fontSize: 'clamp(1.9rem, 7.5vw, 5.5rem)',
            }}
          >
            {featured.title}
          </h2>
          <p
            className="mt-4 text-sm sm:text-base"
            style={{ fontFamily: 'var(--font-family-mono)' }}
          >
            {featured.durationFormatted} · {featured.bpm} BPM · {featured.genre}
          </p>
          <p className="mt-4 max-w-3xl text-base leading-relaxed sm:text-lg">
            {featured.description}
          </p>
        </section>
      )}

      {/* Block 3: Weitere Stücke als typografisches Verzeichnis */}
      <section aria-labelledby="plakat-weitere" className="px-5 py-12 sm:px-10">
        <h2
          id="plakat-weitere"
          className="text-sm uppercase tracking-[0.3em]"
          style={{ fontFamily: 'var(--font-family-mono)', color: 'var(--brand-accent)' }}
        >
          Weitere Stücke
        </h2>
        <ul className="mt-6 divide-y-2" style={{ borderColor: 'var(--brand-text)' }}>
          {rest.map((track, index) => (
            <li
              key={track.id}
              className="grid grid-cols-[auto_1fr] items-baseline gap-4 py-5"
              style={{ borderColor: 'var(--brand-text)', opacity: 0.96 }}
            >
              <span
                className="text-sm"
                style={{ fontFamily: 'var(--font-family-mono)', color: 'var(--brand-accent)' }}
              >
                {String(index + 1).padStart(2, '0')}
              </span>
              <div>
                <h3
                  className="font-black uppercase leading-tight"
                  style={{
                    fontFamily: 'var(--font-family-display)',
                    fontSize: 'clamp(1.4rem, 4.5vw, 3rem)',
                  }}
                >
                  {track.title}
                </h3>
                <p
                  className="mt-1 text-xs sm:text-sm"
                  style={{ fontFamily: 'var(--font-family-mono)', opacity: 0.85 }}
                >
                  {track.durationFormatted} · {track.bpm} BPM · Stimmung: {track.mood}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </section>

      {/* Block 4: Schlussblock mit persönlichem Satz */}
      <footer
        className="border-t-4 px-5 py-10 sm:px-10"
        style={{ borderColor: 'var(--brand-text)' }}
      >
        <p className="max-w-3xl text-base leading-relaxed sm:text-lg">{content.intro}</p>
        <p
          className="mt-6 text-xs uppercase tracking-[0.3em]"
          style={{ fontFamily: 'var(--font-family-mono)', opacity: 0.75 }}
        >
          Kontakt über einen persönlichen Musikauswahl-Link · Demo
        </p>
      </footer>
    </div>
  );
}
