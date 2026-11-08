import { useEffect, useMemo, useRef, useState } from 'react';
import { useAudio } from '../audio/AudioProvider';
import { FilmSceneRenderer } from './sceneRenderer';
import { useReducedMotion } from '../site/useReducedMotion';

interface FilmSceneProps {
  /** Akzentfarbe des aktuellen Tracks */
  accent: string;
  /** 0 ruhig, 1 treibend, 2 bedrohlich */
  mode: number;
  className?: string;
  /** Nur dekorativ? Dann kein Titel für Screenreader */
  decorative?: boolean;
  /** kurze Szenenbeschreibung für Screenreader */
  label?: string;
  /** Grundfarben; Künstlerseiten übergeben ihr Markenpaket */
  ink?: string;
  paper?: string;
}

/**
 * Echtzeit-Filmmoment. Startet keinen Ton; nutzt das Signal der laufenden Skizze.
 * Ohne WebGL2 erscheint eine gestaltete CSS-Fassung mit denselben Farben.
 */
export function FilmScene({
  accent,
  mode,
  className,
  decorative = false,
  label = 'Nächtliche Scheibe: Regen, Scheinwerfer und Nebel',
  ink = '#08090A',
  paper = '#F2ECE1',
}: FilmSceneProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rendererRef = useRef<FilmSceneRenderer | null>(null);
  const { getSignal } = useAudio();
  const reducedMotion = useReducedMotion();
  const liveOptions = useRef({ accent, ink, paper, mode, reducedMotion });
  const [unsupported, setUnsupported] = useState(false);
  const [stats, setStats] = useState<{ fps: number; scale: number } | null>(null);

  useEffect(() => {
    liveOptions.current = { accent, ink, paper, mode, reducedMotion };
    rendererRef.current?.updateOptions({ accent, ink, paper, mode, reducedMotion });
  }, [accent, ink, paper, mode, reducedMotion]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    const renderer = new FilmSceneRenderer(canvas, {
      accent: liveOptions.current.accent,
      ink: liveOptions.current.ink,
      paper: liveOptions.current.paper,
      mode: liveOptions.current.mode,
      getSignal,
      reducedMotion: liveOptions.current.reducedMotion,
      onUnsupported: () => setUnsupported(true),
      onFrameStats: (fps, scale) =>
        setStats((prev) =>
          prev?.fps === fps && prev.scale === scale ? prev : { fps, scale }
        ),
    });
    rendererRef.current = renderer;
    const supported = renderer.init();
    if (!supported) {
      setUnsupported(true);
      return undefined;
    }
    renderer.start();
    return () => {
      renderer.destroy();
      rendererRef.current = null;
    };
  }, [getSignal]);

  const rainLines = useMemo(
    () =>
      Array.from({ length: 26 }, (_, index) => ({
        left: (index * 37.7 + 11) % 100,
        delay: (index * 0.37) % 4,
        duration: 1.4 + ((index * 7) % 13) / 10,
        height: 18 + ((index * 13) % 40),
      })),
    []
  );

  return (
    <div className={`film-scene ${className || ''}`} data-fps={stats?.fps ?? ''} data-scale={stats?.scale ?? ''}>
      {!unsupported && (
        <canvas
          ref={canvasRef}
          className="film-scene__canvas"
          aria-hidden="true"
        />
      )}
      {unsupported && (
        <div
          className="film-scene__fallback"
          style={{ ['--fallback-accent' as string]: accent, ['--fallback-ink' as string]: ink, ['--fallback-paper' as string]: paper }}
          role={decorative ? 'presentation' : 'img'}
          aria-label={decorative ? undefined : `${label} (als Fläche gestaltet, WebGL2 nicht verfügbar)`}
        >
          <div className="film-scene__glow" aria-hidden="true" />
          <div className="film-scene__fog" aria-hidden="true" />
          {rainLines.map((line, index) => (
            <span
              key={index}
              className="film-scene__rain"
              aria-hidden="true"
              style={{
                left: `${line.left}%`,
                height: `${line.height}px`,
                animationDelay: `${line.delay}s`,
                animationDuration: `${line.duration}s`,
              }}
            />
          ))}
          <div className="film-scene__grain" aria-hidden="true" />
        </div>
      )}
      {!unsupported && (
        <span className="film-scene__caption" aria-hidden="true">
          Echtzeit · {stats ? `${stats.fps} fps` : '—'} · Fragment-Shader
        </span>
      )}
    </div>
  );
}
