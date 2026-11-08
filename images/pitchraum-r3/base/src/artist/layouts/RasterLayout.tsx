import { useState } from 'react';
import { flushSync } from 'react-dom';
import type { LayoutContent } from '../types';
import { PlaySketch } from '../PlaySketch';
import { CoverArt } from '../CoverArt';
import { useAudio, sketchForTrack } from '../../audio/AudioProvider';

function transition(callback: () => void) {
  const doc = document as Document & {
    startViewTransition?: (update: () => void) => { finished: Promise<void> };
  };
  if (doc.startViewTransition) {
    doc.startViewTransition(callback);
  } else {
    callback();
  }
}

/**
 * RASTER — Kachelraster mit generierten Coverflächen, wenig Text.
 * Eigenes Verhalten: Beim Abspielen öffnet sich die Kachel, rückt in den
 * Vordergrund und verschiebt ihre Nachbarn (View Transition, wenn verfügbar).
 */
export function RasterLayout({ content }: { content: LayoutContent }) {
  const [openId, setOpenId] = useState<string | null>(content.featuredTrackId || null);
  const { enabled, playing, meta, toggle } = useAudio();

  function toggleOpen(id: string) {
    transition(() => {
      flushSync(() => setOpenId((current) => (current === id ? null : id)));
    });
  }

  return (
    <div
      className="artist-surface layout-raster"
      style={{
        background: 'var(--brand-background)',
        color: 'var(--brand-text)',
        fontFamily: 'var(--font-family-body)',
      }}
    >
      <header className="raster-head">
        <h1 className="display" style={{ fontFamily: 'var(--font-family-display)', fontSize: 'clamp(2rem, 5vw, 4rem)' }}>
          {content.name}
        </h1>
        <p className="mono" style={{ color: 'var(--brand-accent)' }}>{content.roleLine}</p>
      </header>

      <ul className="raster-grid">
        {content.tracks.map((track) => {
          const isOpen = openId === track.id;
          const active = enabled && playing && meta.id === track.id;
          return (
            <li
              key={track.id}
              className="raster-tile"
              data-open={isOpen}
              data-active={active}
              style={{ viewTransitionName: isOpen ? 'raster-tile' : undefined }}
            >
              <div className="raster-tile__art">
                <CoverArt seed={track.id} title={track.title} bpm={track.bpm} mood={track.mood} />
              </div>
              <button
                type="button"
                className="raster-tile__hit"
                aria-expanded={isOpen}
                onClick={() => {
                  if (!isOpen) void toggle(sketchForTrack(track));
                  toggleOpen(track.id);
                }}
              >
                <span className="raster-tile__no mono">{track.catalogNo}</span>
                <span className="raster-tile__title">{track.title}</span>
                <span className="mono raster-tile__meta">
                  {track.durationFormatted} · {track.bpm} BPM
                </span>
              </button>
              {isOpen && (
                <div className="raster-tile__panel" style={{ background: 'var(--brand-secondary)' }}>
                  <p>{track.description}</p>
                  <p className="mono">{track.instrumentation} · {track.mood}</p>
                  <PlaySketch
                    track={track}
                    className="raster-play"
                    label={active ? 'Anhalten' : 'Klangskizze'}
                    style={{ borderColor: 'var(--brand-accent)', color: 'var(--brand-background)', background: 'var(--brand-accent)' }}
                  />
                </div>
              )}
            </li>
          );
        })}
      </ul>

      <footer className="raster-foot">
        <p>{content.tagline}</p>
        <p className="mono">Fiktives Beispiel · Klangskizzen im Browser erzeugt</p>
      </footer>
    </div>
  );
}
