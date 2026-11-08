import type { LayoutContent } from '../types';

/**
 * Gestalt „Atelier“: viel Weißraum, ruhige Textspalte,
 * die persönliche Vorstellung steht an erster Stelle.
 */
export function AtelierLayout({ content }: { content: LayoutContent }) {
  return (
    <div
      style={{
        backgroundColor: 'var(--brand-background)',
        color: 'var(--brand-text)',
        fontFamily: 'var(--font-family-body)',
      }}
      className="min-h-screen px-5 py-14 sm:py-24"
    >
      <div className="mx-auto max-w-xl">
        {/* Persönliche Vorstellung zuerst */}
        <header>
          <p
            className="text-xs uppercase tracking-[0.3em]"
            style={{ fontFamily: 'var(--font-family-mono)', color: 'var(--brand-accent)' }}
          >
            {content.roleLine}
          </p>
          <h1
            className="mt-4 text-4xl leading-tight sm:text-5xl"
            style={{ fontFamily: 'var(--font-family-display)' }}
          >
            {content.name}
          </h1>
          {content.tagline && (
            <p
              className="mt-4 text-xl leading-snug"
              style={{ color: 'var(--brand-primary)' }}
            >
              {content.tagline}
            </p>
          )}
        </header>

        <section aria-labelledby="atelier-ueber" className="mt-12">
          <h2
            id="atelier-ueber"
            className="text-xs font-bold uppercase tracking-[0.3em]"
            style={{ fontFamily: 'var(--font-family-mono)', opacity: 0.75 }}
          >
            Über mich
          </h2>
          <p className="mt-4 text-lg leading-relaxed">{content.intro}</p>
        </section>

        {/* Ruhige Stückliste mit feinen Linien */}
        <section aria-labelledby="atelier-stuecke" className="mt-16">
          <h2
            id="atelier-stuecke"
            className="text-xs font-bold uppercase tracking-[0.3em]"
            style={{ fontFamily: 'var(--font-family-mono)', opacity: 0.75 }}
          >
            Ausgewählte Stücke
          </h2>
          <ul className="mt-4">
            {content.tracks.map((track) => (
              <li
                key={track.id}
                className="border-t py-7"
                style={{ borderColor: 'var(--brand-secondary)' }}
              >
                <div className="flex items-baseline justify-between gap-3">
                  <h3
                    className="text-xl leading-snug sm:text-2xl"
                    style={{ fontFamily: 'var(--font-family-display)' }}
                  >
                    {track.title}
                  </h3>
                  <span
                    className="shrink-0 text-xs"
                    style={{ fontFamily: 'var(--font-family-mono)', color: 'var(--brand-primary)' }}
                  >
                    {track.durationFormatted}
                  </span>
                </div>
                <p className="mt-2 text-base leading-relaxed" style={{ opacity: 0.9 }}>
                  {track.description}
                </p>
                <p
                  className="mt-2 text-xs"
                  style={{ fontFamily: 'var(--font-family-mono)', opacity: 0.7 }}
                >
                  {track.catalogNo} · {track.instrumentation}
                </p>
              </li>
            ))}
          </ul>
        </section>

        <footer
          className="mt-16 border-t pt-6 text-sm leading-relaxed"
          style={{ borderColor: 'var(--brand-secondary)', opacity: 0.85 }}
        >
          <p>
            Eine Hörprobe oder ein Angebot bekommst du über einen persönlichen Link — schreib mir
            einfach über den üblichen Weg.
          </p>
        </footer>
      </div>
    </div>
  );
}
