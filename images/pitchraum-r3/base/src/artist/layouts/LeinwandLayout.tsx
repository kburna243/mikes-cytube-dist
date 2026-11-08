import { useEffect, useRef, useState } from 'react';
import type { LayoutContent } from '../types';
import { PlaySketch } from '../PlaySketch';
import { FilmScene } from '../../scene/FilmScene';
import { useAudio, sketchForTrack } from '../../audio/AudioProvider';

/**
 * LEINWAND — vollflächige Shader-Szene je Track, Titel darüber, filmisch.
 * Eigenes Verhalten: Trackwechsel schneidet die Szene um; Titel fährt ein,
 * die Klangskizze steuert die Intensität. Farben ausschließlich aus --brand-*.
 */
export function LeinwandLayout({ content }: { content: LayoutContent }) {
  const [selectedId, setSelectedId] = useState(content.featuredTrackId || content.tracks[0]?.id || '');
  const selected = content.tracks.find((track) => track.id === selectedId) || content.tracks[0];
  const { getSignal, meta, enabled, playing } = useAudio();
  const pulseRef = useRef<HTMLSpanElement | null>(null);

  useEffect(() => {
    let frame = 0;
    const tick = () => {
      if (pulseRef.current) {
        pulseRef.current.textContent = String(Math.round(getSignal().level * 100)).padStart(2, '0');
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [getSignal]);

  if (!selected) return null;
  const sketch = sketchForTrack(selected);
  const trackIndex = content.tracks.findIndex((track) => track.id === selected.id);
  const accent =
    content.brandValues?.[
      trackIndex % 2 === 0 ? '--brand-accent' : '--brand-primary'
    ] || 'var(--brand-accent)';
  const active = enabled && playing && meta.id === selected.id;

  return (
    <div
      className="artist-surface layout-leinwand"
      style={{
        background: 'var(--brand-background)',
        color: 'var(--brand-text)',
        fontFamily: 'var(--font-family-body)',
      }}
    >
      <div className="leinwand-stage">
        <FilmScene
          accent={accent}
          ink={content.brandValues?.['--brand-background'] || '#08090A'}
          paper={content.brandValues?.['--brand-text'] || '#F2ECE1'}
          mode={sketch.mode}
          decorative
        />
        <div className="leinwand-scrim" aria-hidden="true" />
        <header className="leinwand-top">
          <p className="mono" style={{ color: 'var(--brand-accent)' }}>{content.roleLine}</p>
          <p className="mono">Vollbild · Echtzeit · Pegel <span ref={pulseRef}>00</span></p>
        </header>

        <div className="leinwand-title">
          <p className="mono leinwand-kicker">
            {selected.catalogNo} · {selected.bpm} BPM · {selected.musicalKey || '—'}
          </p>
          <h1 key={selected.id} style={{ fontFamily: 'var(--font-family-display)' }}>
            {selected.title}
          </h1>
          <p className="leinwand-desc">{selected.description}</p>
          <PlaySketch
            track={selected}
            className="leinwand-play"
            label={active ? 'Klangskizze anhalten' : 'Klangskizze abspielen'}
            style={{ borderColor: 'var(--brand-accent)', color: 'var(--brand-accent)' }}
          />
        </div>

        <nav className="leinwand-reel" aria-label="Tracks dieser Projektion">
          {content.tracks.map((track, index) => (
            <button
              key={track.id}
              type="button"
              aria-pressed={track.id === selected.id}
              onClick={() => setSelectedId(track.id)}
              style={{
                borderColor: track.id === selected.id ? 'var(--brand-accent)' : 'transparent',
                color: track.id === selected.id ? 'var(--brand-text)' : 'var(--brand-primary)',
              }}
            >
              <span className="mono">{String(index + 1).padStart(2, '0')}</span>
              <span>{track.title}</span>
              <span className="mono">{track.durationFormatted}</span>
            </button>
          ))}
        </nav>
      </div>

      <section className="leinwand-notes">
        <div>
          <h2 style={{ fontFamily: 'var(--font-family-display)' }}>{content.name}</h2>
          <p>{content.intro}</p>
        </div>
        <p className="mono" style={{ color: 'var(--brand-accent)' }}>
          {content.tagline}
          <br />
          Klangskizze, im Browser erzeugt
          <br />
          Alle Personen und Werke sind fiktiv.
        </p>
      </section>
    </div>
  );
}
