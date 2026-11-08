import { useAudio } from '../../audio/AudioProvider';
import type { LayoutContent } from '../types';
import { PlaySketch } from '../PlaySketch';

/**
 * ATELIER — ruhige Lesefläche, persönliche Vorstellung zuerst.
 * Eigenes Verhalten: Bewegung fast nur beim Abspielen. Dann erscheint unter
 * dem laufenden Stück ein feiner Pegelstrich; sonst bleibt alles still.
 */
export function AtelierLayout({ content }: { content: LayoutContent }) {
  const { enabled, playing, meta, getSignal } = useAudio();

  return (
    <div
      className="artist-surface layout-atelier"
      style={{
        background: 'var(--brand-background)',
        color: 'var(--brand-text)',
        fontFamily: 'var(--font-family-body)',
      }}
    >
      <div className="atelier-column">
        <header className="atelier-head">
          <p className="mono" style={{ color: 'var(--brand-accent)' }}>{content.roleLine}</p>
          <h1
            style={{
              fontFamily: 'var(--font-family-display)',
              fontSize: 'clamp(2.6rem, 6vw, 4.6rem)',
              lineHeight: 1.02,
              margin: 0,
              paddingBlock: '1.4rem 0.8rem',
            }}
          >
            {content.name}
          </h1>
          <p className="atelier-tagline">{content.tagline}</p>
        </header>

        <section aria-labelledby="atelier-about" className="atelier-about">
          <h2 id="atelier-about" className="mono" style={{ color: 'var(--brand-primary)' }}>
            Über mich
          </h2>
          <p>{content.intro}</p>
        </section>

        <section aria-labelledby="atelier-works">
          <h2 id="atelier-works" className="mono atelier-works-title" style={{ color: 'var(--brand-primary)' }}>
            Stücke / {String(content.tracks.length).padStart(2, '0')}
          </h2>
          <ul className="atelier-list">
            {content.tracks.map((track) => {
              const active = enabled && playing && meta.id === track.id;
              const level = active ? getSignal().level : 0;
              return (
                <li key={track.id} className="atelier-track" data-active={active}>
                  <div className="atelier-track__head">
                    <span className="mono" style={{ color: 'var(--brand-primary)' }}>{track.catalogNo}</span>
                    <h3 style={{ fontFamily: 'var(--font-family-display)' }}>{track.title}</h3>
                    <span className="mono atelier-track__time">{track.durationFormatted}</span>
                  </div>
                  <p className="atelier-track__desc">{track.description}</p>
                  <div className="atelier-track__foot">
                    <span className="mono">
                      {track.instrumentation} · {track.musicalKey || '—'}
                    </span>
                    <PlaySketch
                      track={track}
                      className="atelier-play"
                      label={active ? 'Anhalten' : 'Hören'}
                      style={{ color: 'var(--brand-accent)', borderColor: 'var(--brand-accent)' }}
                    />
                  </div>
                  {active && (
                    <div
                      className="atelier-level"
                      aria-hidden="true"
                      style={{ transform: `scaleX(${Math.max(0.04, level * 1.8)})`, background: 'var(--brand-accent)' }}
                    />
                  )}
                </li>
              );
            })}
          </ul>
          <p className="mono atelier-note" style={{ color: 'var(--brand-primary)' }}>
            Klangskizze, im Browser erzeugt · keine fertigen Aufnahmen
          </p>
        </section>

        <footer className="atelier-foot">
          <p>Für Regie, Schnitt und Produktion: Schreiben Sie mir, welches Bild Sie vor Augen haben.</p>
          <span className="mono">Fiktives Beispiel · Demo</span>
        </footer>
      </div>
    </div>
  );
}
