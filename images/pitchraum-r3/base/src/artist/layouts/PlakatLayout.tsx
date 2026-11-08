import { useEffect, useRef } from 'react';
import type { LayoutContent } from '../types';
import { PlaySketch } from '../PlaySketch';
import { useAudio, sketchForTrack } from '../../audio/AudioProvider';
import { useReducedMotion } from '../../site/useReducedMotion';

/**
 * PLATKAT — übergroße Typografie, ein Haupttrack, vertikale Blöcke.
 * Eigenes Verhalten: Die Hauptzeile atmet mit der laufenden Klangskizze;
 * ein Pegelbalken zittert am Rand.
 */
export function PlakatLayout({ content }: { content: LayoutContent }) {
  const featured = content.tracks.find((t) => t.id === content.featuredTrackId) || content.tracks[0];
  const rest = content.tracks.filter((t) => t.id !== featured?.id);
  const titleRef = useRef<HTMLHeadingElement | null>(null);
  const meterRef = useRef<HTMLSpanElement | null>(null);
  const { getSignal, meta, playing, enabled } = useAudio();
  const reduced = useReducedMotion();
  const active = !!featured && enabled && playing && meta.id === featured.id;

  useEffect(() => {
    if (!featured || reduced) return undefined;
    const title = titleRef.current;
    const meter = meterRef.current;
    let frame = 0;
    const tick = () => {
      const signal = getSignal();
      const energy = active ? signal.level : 0.08;
      if (title) {
        title.style.setProperty('--plakat-scale', String(1 + energy * 0.045));
        title.style.setProperty('--plakat-track', `${-0.035 - energy * 0.018}em`);
      }
      if (meter) meter.style.transform = `scaleY(${Math.max(0.12, energy * 2.4)})`;
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [active, featured, getSignal, reduced]);

  const sketch = featured ? sketchForTrack(featured) : null;

  return (
    <div
      className="artist-surface layout-plakat"
      style={{
        background: 'var(--brand-background)',
        color: 'var(--brand-text)',
        fontFamily: 'var(--font-family-body)',
      }}
    >
      <div className="plakat-top">
        <span className="mono" style={{ color: 'var(--brand-primary)' }}>
          {content.roleLine}
        </span>
        <span className="mono" style={{ color: 'var(--brand-primary)' }}>
          Werkverzeichnis / laufend
        </span>
      </div>

      <h1 className="display" style={{ fontSize: 'clamp(3.4rem, 13.2vw, 12rem)', lineHeight: 0.78 }}>
        {content.name}
      </h1>

      <div className="plakat-rule" aria-hidden="true">
        <span />
        <span className="mono">Hauptstück {featured?.catalogNo?.replace(/\D/g, '')}</span>
        <span ref={meterRef} className="plakat-meter" />
      </div>

      {featured && (
        <section aria-labelledby="plakat-featured" className="plakat-feature">
          <div>
            <p className="mono" style={{ color: 'var(--brand-accent)' }}>
              {featured.catalogNo} · {featured.mood} · {featured.bpm} BPM
            </p>
            <h2
              id="plakat-featured"
              ref={titleRef}
              className="plakat-feature__title"
              style={{
                fontFamily: 'var(--font-family-display)',
                color: 'var(--brand-text)',
                transform: 'scale(var(--plakat-scale, 1))',
                letterSpacing: 'var(--plakat-track, -0.035em)',
                transformOrigin: 'left bottom',
              }}
            >
              {featured.title}
            </h2>
            <p className="plakat-feature__desc">{featured.description}</p>
            <p className="plakat-feature__inst">{featured.instrumentation}</p>
          </div>

          <div className="plakat-feature__side">
            <div className="plakat-timecode mono">
              <span>{featured.durationFormatted}</span>
              <span>aus {featured.bpm} BPM</span>
              <span>{featured.genre}</span>
            </div>
            {sketch && (
              <PlaySketch
                track={featured}
                className="plakat-play"
                label={active ? 'Klangskizze anhalten' : 'Hauptstück anhören'}
                style={{ borderColor: 'var(--brand-accent)', color: 'var(--brand-accent)' }}
              />
            )}
            <p className="mono plakat-note" style={{ color: 'var(--brand-primary)' }}>
              Klangskizze, im Browser erzeugt
            </p>
          </div>
        </section>
      )}

      <section aria-labelledby="plakat-more" className="plakat-list">
        <h3 id="plakat-more" className="mono" style={{ color: 'var(--brand-accent)' }}>
          Weitere Stücke
        </h3>
        <ul>
          {rest.map((track, index) => (
            <li key={track.id}>
              <span className="mono plakat-list__no">{String(index + 2).padStart(2, '0')}</span>
              <div>
                <p className="plakat-list__title">{track.title}</p>
                <p className="mono plakat-list__meta">
                  {track.durationFormatted} · {track.bpm} BPM · {track.genre}
                </p>
              </div>
              <PlaySketch
                track={track}
                className="plakat-list__play"
                label="Hören"
                style={{ borderColor: 'var(--brand-primary)', color: 'var(--brand-text)' }}
              />
            </li>
          ))}
        </ul>
      </section>

      <footer className="plakat-foot">
        <p className="plakat-intro">{content.intro}</p>
        <p className="mono" style={{ color: 'var(--brand-primary)' }}>
          {content.tagline}
        </p>
      </footer>
    </div>
  );
}
