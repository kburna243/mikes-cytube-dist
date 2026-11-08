import { useState } from 'react';
import { flushSync } from 'react-dom';
import { ARTIST_PROFILES } from '../../artist/artists';
import { ArtistSurface } from '../../artist/ArtistPage';
import { ARTIST_LAYOUT_LABELS } from '../../shared/limits';
import { Link } from '../../router';
import type { ShowcaseTrack } from '../../artist/types';
import { useAudio, sketchForTrack } from '../../audio/AudioProvider';

const SAME_TRACK: ShowcaseTrack = {
  id: 'glyph-track',
  catalogNo: 'PR-01',
  title: 'Sprungfeder',
  durationFormatted: '02:48',
  bpm: 112,
  musicalKey: 'D-Moll',
  genre: 'Treibende Kammermusik',
  mood: 'Treibend',
  instrumentation: 'Marimba, Pizzicato-Streicher, Subbass',
  description:
    'Derselbe Track, fünf Bühnen: Ein Motiv steigt an, hält kurz inne und fällt zurück. Wie es wirkt, entscheidet die Gestalt.',
};

/**
 * Derselbe Track in allen fünf Gestalten. Der Wechsel läuft über die
 * View Transitions API, mit harter Blende als Rückfall. Jede Gestalt
 * bringt ein eigenes Verhalten mit; nur der Inhalt bleibt gleich.
 */
export function GesichterSection() {
  const [index, setIndex] = useState(0);
  const [pending, setPending] = useState(false);
  const { meta, playing, toggle } = useAudio();
  const artist = ARTIST_PROFILES[index];
  const active = playing && meta.id === SAME_TRACK.id;

  function change(next: number) {
    if (next === index) return;
    const update = () => {
      flushSync(() => setIndex(next));
    };
    const doc = document as Document & {
      startViewTransition?: (callback: () => void) => { finished: Promise<void> };
    };
    if (doc.startViewTransition) {
      setPending(true);
      const transition = doc.startViewTransition(update);
      void transition.finished.finally(() => setPending(false));
    } else {
      update();
    }
  }

  return (
    <section className="section glyph-section" id="fuenf-gesichter" aria-labelledby="glyph-heading">
      <div className="shell">
        <div className="montage-head">
          <div>
            <p className="eyebrow">Fünf Gesichter · eine Künstlerin, ein Track</p>
            <h2 id="glyph-heading" className="display">
              Fünf Bühnen.
              <br />
              <span className="accent-text">Ein Stück.</span>
            </h2>
          </div>
          <p className="montage-head__note">
            Künstlerseiten sind keine Themes. Plakat atmet, Archiv rechnet, Atelier schweigt,
            Leinwand projiziert, Raster öffnet sich. Wechsle die Gestalt — der Track bleibt
            derselbe, die Seite baut sich sichtbar um.
          </p>
        </div>

        <div className="glyph-toolbar">
          <div className="glyph-switch" role="group" aria-label="Gestalt für denselben Track">
            {ARTIST_PROFILES.map((entry, entryIndex) => (
              <button
                key={entry.slug}
                type="button"
                aria-pressed={entryIndex === index}
                onClick={() => change(entryIndex)}
              >
                <span>0{entryIndex + 1}</span>
                <span>{ARTIST_LAYOUT_LABELS[entry.layoutId]}</span>
              </button>
            ))}
          </div>
          <div className="glyph-meta">
            <p className="mono">
              {SAME_TRACK.title} · 02:48 · {SAME_TRACK.bpm} BPM
            </p>
            <button
              type="button"
              className="text-link"
              onClick={() => void toggle(sketchForTrack(SAME_TRACK))}
              aria-pressed={active}
            >
              {active ? 'Klangskizze anhalten' : 'Klangskizze hören'}
            </button>
          </div>
        </div>

        <div className="glyph-stage" tabIndex={0} aria-label={`Vorschau: Gestalt ${ARTIST_LAYOUT_LABELS[artist.layoutId]}`}>
          <div className="glyph-stage__chrome">
            <p className="mono">
              <strong>{ARTIST_LAYOUT_LABELS[artist.layoutId]}</strong> — {artist.brand.name}
            </p>
            <p className="mono">
              Gestalt 0{index + 1} / 05 {pending ? '· blendet' : '· live'}
            </p>
          </div>
          <div className="glyph-stage__inner">
            <ArtistSurface
              brandValues={artist.brand.values}
              layoutId={artist.layoutId}
              content={{
                name: artist.name,
                tagline: artist.tagline,
                intro: artist.intro,
                roleLine: artist.roleLine,
                tracks: [SAME_TRACK],
                featuredTrackId: SAME_TRACK.id,
              }}
            />
          </div>
        </div>

        <div className="glyph-caption">
          <p className="mono">
            {artist.brand.toneKeywords.join(' / ')} · Schriften aus dem Markenpaket
          </p>
          <Link to={`/k/${artist.slug}`} className="text-link">
            Ganze Seite ansehen: {artist.name} <span aria-hidden="true">↗</span>
          </Link>
        </div>
        <p className="mono" style={{ color: 'var(--paper-faint)', marginTop: '0.75rem', textTransform: 'none' }}>
          Die Gestalten lesen nur --brand-* und --font-family-* aus ihrem Markenpaket. Keine
          Akzentfarbe der Website wird übertragen. Klangskizzen im Browser erzeugt.
        </p>
        <nav aria-label="Alle fünf Beispielseiten" className="glyph-all">
          {ARTIST_PROFILES.map((entry, entryIndex) => (
            <Link key={entry.slug} to={`/k/${entry.slug}`}>
              <span className="mono">0{entryIndex + 1}</span>
              <span>{ARTIST_LAYOUT_LABELS[entry.layoutId]}</span>
              <span className="mono">{entry.name}</span>
            </Link>
          ))}
        </nav>
      </div>
    </section>
  );
}
