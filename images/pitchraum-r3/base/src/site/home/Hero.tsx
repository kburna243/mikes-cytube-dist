import { useEffect, useRef } from 'react';
import { useAudio } from '../../audio/AudioProvider';
import { HERO_SKETCHES, type SketchMeta } from '../../audio/sketchData';
import { FilmScene } from '../../scene/FilmScene';
import { useReducedMotion } from '../useReducedMotion';
import { RunningTimecode } from '../SiteLayout';

/**
 * Die Headline atmet mit dem Analyser-Signal: Gewicht und Breite der
 * variablen Anybody-Schrift folgen Bass, Mitten und Höhen.
 */
function ReactiveTitle({ playing }: { playing: boolean }) {
  const titleRef = useRef<HTMLHeadingElement | null>(null);
  const axisRef = useRef<HTMLSpanElement | null>(null);
  const { getSignal } = useAudio();
  const reduced = useReducedMotion();

  useEffect(() => {
    const element = titleRef.current;
    if (!element) return undefined;
    if (reduced) {
      element.style.setProperty('--head-wght', '740');
      element.style.setProperty('--head-wdth', '86');
      if (axisRef.current) axisRef.current.textContent = 'WGHT 740 / WDTH 86';
      return undefined;
    }
    let frame = 0;
    const tick = (time: number) => {
      const signal = getSignal();
      const ambient = 0.06 + Math.sin(time / 2100) * 0.035;
      const energy = playing ? signal.level : ambient;
      const wght = Math.round(560 + (playing ? signal.mid * 300 + signal.bass * 120 : 40));
      const wdth = Math.round(76 + (playing ? signal.high * 40 + signal.level * 18 : 6 + Math.sin(time / 2600) * 3));
      element.style.setProperty('--head-wght', String(Math.min(900, wght)));
      element.style.setProperty('--head-wdth', String(Math.min(140, wdth)));
      if (axisRef.current) {
        axisRef.current.textContent = `WGHT ${Math.min(900, wght)} / WDTH ${Math.min(140, wdth)}`;
      }
      void energy;
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [getSignal, playing, reduced]);

  return (
    <div className="hero__title-wrap">
      <h1
        id="hero-heading"
        ref={titleRef}
        className="display display--tight hero__title"
        style={{ fontSize: 'clamp(2.9rem, 11.4vw, 10rem)' }}
      >
        <span className="hero__title-lines">Dasselbe</span>
        <span className="hero__title-lines">
          Bild. <span className="outline-word">Drei</span>
        </span>
        <span className="hero__title-lines accent-word">Filme.</span>
      </h1>
      <p className="hero__axis" aria-hidden="true">
        <span>Variable Font · Achsen live</span>
        <span ref={axisRef}>WGHT 740 / WDTH 86</span>
      </p>
    </div>
  );
}

function Waveform({ seed, active }: { seed: number; active: boolean }) {
  return (
    <span className="track-btn__wave" aria-hidden="true">
      {Array.from({ length: 16 }, (_, index) => (
        <i
          key={index}
          style={
            {
              '--h': 2 + ((seed * 13 + index * 7) % 9),
              '--i': index,
              animationPlayState: active ? 'running' : 'paused',
            } as React.CSSProperties
          }
        />
      ))}
    </span>
  );
}

function TrackButton({ sketch, index }: { sketch: SketchMeta; index: number }) {
  const { meta, playing, enabled, toggle, error } = useAudio();
  const active = enabled && playing && meta.id === sketch.id;
  return (
    <button
      type="button"
      className="track-btn"
      aria-pressed={active}
      onClick={() => void toggle(sketch)}
      aria-label={`${sketch.title} — ${sketch.character}, ${sketch.bpm} BPM. ${
        active ? 'Klangskizze pausieren' : 'Klangskizze abspielen'
      }`}
    >
      <span className="track-btn__index">0{index + 1}</span>
      <span className="track-btn__title">{sketch.title}</span>
      <span className="track-btn__meta">
        <span>
          {sketch.character} · {sketch.bpm} BPM
        </span>
        <Waveform seed={index + 2} active={active} />
      </span>
      {error && index === 0 && (
        <span className="visually-hidden" role="alert">
          {error}
        </span>
      )}
    </button>
  );
}

export function Hero() {
  const { enabled, playing, meta, toggle, pause, unavailable } = useAudio();
  const reduced = useReducedMotion();
  const cutRef = useRef<HTMLSpanElement | null>(null);
  const firstRun = useRef(true);

  useEffect(() => {
    if (firstRun.current) {
      firstRun.current = false;
      return;
    }
    if (reduced || !cutRef.current) return;
    // WAAPI: ein einzelner harter Filmschnitt, keine Dauerbewegung.
    cutRef.current.animate(
      [
        { opacity: 0.55, transform: 'scaleY(1)' },
        { opacity: 0, transform: 'scaleY(0.2)' },
      ],
      { duration: 280, easing: 'cubic-bezier(0.16, 1, 0.3, 1)' }
    );
  }, [meta.id, reduced]);

  return (
    <section className="hero film-markers" aria-labelledby="hero-heading">
      <div className="hero__scene">
        <span ref={cutRef} className="hero__cut" aria-hidden="true" />
        <FilmScene accent={meta.accent} mode={meta.mode} decorative />
        <div className="hero__shade" aria-hidden="true" />
        <div className="hero__skyline" aria-hidden="true" />
      </div>

      <div className="hero__meta">
        <p className="mono" style={{ margin: 0 }}>
          Ein Fenster / drei Filme / 23:40
        </p>
        <p className="hero__meta-right">
          <strong>Szene · WebGL2 · eigener Fragment-Shader</strong>
          Klang · Web Audio API
          <br />
          Timecode <RunningTimecode />
        </p>
      </div>

      <div className="hero__content">
        <ReactiveTitle playing={playing} />

        <div className="hero__subline">
          <div>
            <p className="hero__lead">
              Drei Klangskizzen für dieselbe nächtliche Scheibe. <em>Schalte den Ton ein</em> und
              höre, wie aus Regen ein Thriller, ein Roadmovie oder eine leere Wohnung wird.
            </p>
            <p className="hero__hint" style={{ marginTop: '0.85rem' }}>
              Klangskizze, im Browser erzeugt · kein fertiger Track
            </p>
          </div>

          <div className="hero__actions">
            <button
              type="button"
              className="btn btn--accent"
              onClick={() => {
                if (unavailable) return;
                if (enabled && playing) pause();
                else void toggle(meta);
              }}
              aria-pressed={enabled && playing}
              disabled={unavailable}
            >
              <span aria-hidden="true">{enabled && playing ? '❙❙' : '▶'}</span>
              {unavailable
                ? 'Ton nicht verfügbar'
                : !enabled
                  ? 'Ton einschalten'
                  : playing
                    ? 'Anhalten'
                    : 'Weiterhören'}
            </button>
            <a className="btn" href="#schnitt">
              Wie das zum Link wird <span aria-hidden="true">↓</span>
            </a>
          </div>
        </div>
      </div>

      <div className="hero__timeline" role="group" aria-label="Drei Klangskizzen zur Szene">
        {HERO_SKETCHES.map((sketch, index) => (
          <TrackButton key={sketch.id} sketch={sketch} index={index} />
        ))}
      </div>
      <p className="visually-hidden" aria-live="polite">
        {playing
          ? `Klangskizze läuft: ${meta.title}, ${meta.character}.`
          : 'Ton ist ausgeschaltet. Szene läuft ruhig weiter.'}
      </p>
      {!reduced && (
        <div className="hero__corner" aria-hidden="true">
          <span className="hero__corner-line" />
        </div>
      )}
    </section>
  );
}
