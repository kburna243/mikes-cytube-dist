import React, { useEffect, useRef, useState } from 'react';
import type { PitchApi } from '../api/pitchApi';
import { CONTACT_EMAIL, PRODUCT_NAME, contactMailto } from './constants';
import { Link, navigate, usePath } from '../router';
import { useAudio } from '../audio/AudioProvider';
import { useReducedMotion } from './useReducedMotion';

const SITE_NAV: { to: string; label: string }[] = [
  { to: '/so-funktioniert-es', label: 'Ablauf' },
  { to: '/preise', label: 'Preise' },
  { to: '/fragen', label: 'Fragen' },
  { to: '/impressum', label: 'Impressum' },
];

/** Hauptaktion: legt einen Demo-Arbeitsbereich an und öffnet die App. */
export function DemoTryButton({
  api,
  className,
  label = 'Demo ausprobieren',
  onError,
}: {
  api: PitchApi;
  className?: string;
  label?: string;
  onError?: (message: string) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    setBusy(true);
    setError(null);
    try {
      await api.createWorkspace();
      navigate('/demo');
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : 'Die Demo konnte nicht gestartet werden. Bitte versuche es erneut.';
      setError(message);
      onError?.(message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <span className="inline-flex flex-col items-start gap-2">
      <button
        type="button"
        onClick={() => void handleClick()}
        disabled={busy}
        className={className || 'btn btn--accent'}
      >
        {busy ? 'Demo wird geöffnet …' : label}
        <span aria-hidden="true">↗</span>
      </button>
      {error && (
        <span role="alert" className="mono" style={{ color: '#ff9a8a', maxWidth: '34ch' }}>
          {error}
        </span>
      )}
    </span>
  );
}

/** Zweiter Weg — nur sichtbar, wenn eine Kontaktadresse eingetragen ist. */
export function ContactTalkLink({ className }: { className?: string }) {
  if (!CONTACT_EMAIL) return null;
  return (
    <a href={contactMailto()} className={className || 'btn'}>
      Gespräch anfragen
    </a>
  );
}

/**
 * Mitlaufender Timecode. Schreibt direkt in den DOM-Knoten,
 * damit die Seite nicht 25-mal pro Sekunde neu rendert.
 */
export function RunningTimecode({ className }: { className?: string }) {
  const ref = useRef<HTMLSpanElement | null>(null);
  const reduced = useReducedMotion();
  useEffect(() => {
    if (!ref.current) return undefined;
    if (reduced) {
      ref.current.textContent = '00:00:00:00';
      return undefined;
    }
    const started = performance.now();
    let frame = 0;
    const tick = () => {
      const elapsed = (performance.now() - started) / 1000;
      const hours = Math.floor(elapsed / 3600);
      const minutes = Math.floor((elapsed % 3600) / 60);
      const seconds = Math.floor(elapsed % 60);
      const frames = Math.floor((elapsed % 1) * 25);
      if (ref.current) {
        ref.current.textContent = [hours, minutes, seconds, frames]
          .map((part) => String(part).padStart(2, '0'))
          .join(':');
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [reduced]);
  return (
    <span ref={ref} className={className || 'mono'} aria-label="Laufender Timecode der Demo">
      00:00:00:00
    </span>
  );
}

function SoundToggle({ variant = 'header' }: { variant?: 'header' | 'hero' }) {
  const { enabled, playing, unavailable, toggle, meta, pause } = useAudio();
  const reduced = useReducedMotion();
  const label = unavailable
    ? 'Ton nicht verfügbar'
    : !enabled
      ? 'Ton einschalten'
      : playing
        ? 'Ton anhalten'
        : 'Ton fortsetzen';

  return (
    <button
      type="button"
      className={variant === 'hero' ? 'btn btn--accent' : 'sound-toggle'}
      onClick={() => {
        if (unavailable) return;
        if (enabled && playing) pause();
        else void toggle(meta);
      }}
      aria-pressed={enabled && playing}
      disabled={unavailable}
    >
      <span className="sound-toggle__bars" aria-hidden="true" data-playing={enabled && playing}>
        <i style={reduced ? { animation: 'none' } : undefined} />
        <i style={reduced ? { animation: 'none' } : undefined} />
        <i style={reduced ? { animation: 'none' } : undefined} />
      </span>
      {label}
    </button>
  );
}

export function SiteLayout({ api, children }: { api: PitchApi; children: React.ReactNode }) {
  const path = usePath();
  const { meta } = useAudio();

  return (
    <div className="site" style={{ ['--accent' as string]: meta.accent }}>
      <a href="#hauptinhalt" className="skip-link">
        Zum Inhalt springen
      </a>

      <div className="demo-strip">
        <div className="demo-strip__inner">
          <span className="mono">Demo mit Fantasiedaten</span>
          <span className="demo-strip__note mono">
            Noch in Entwicklung, das ist eine Demo · keine Käufe, keine Anmeldung
          </span>
          <RunningTimecode className="mono demo-strip__time" />
        </div>
      </div>

      <header className="site-head">
        <div className="site-head__inner">
          <Link to="/" className="wordmark" aria-label={`${PRODUCT_NAME} — Startseite`}>
            <span>{PRODUCT_NAME}</span>
            <span className="wordmark__cut" aria-hidden="true" />
          </Link>

          <nav aria-label="Website-Navigation" className="site-nav">
            <ul>
              {SITE_NAV.map((item) => {
                const active = path === item.to;
                return (
                  <li key={item.to}>
                    <Link
                      to={item.to}
                      className="site-nav__link"
                      aria-current={active ? 'page' : undefined}
                    >
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          <div className="site-head__actions">
            <SoundToggle />
            <DemoTryButton
              api={api}
              className="site-head__demo mono"
              label="Demo ausprobieren"
            />
          </div>
        </div>
      </header>

      <main id="hauptinhalt">{children}</main>

      <footer className="site-foot">
        <div className="shell">
          <div className="site-foot__top">
            <p className="site-foot__claim display">Musik ist<br />die zweite Kamera.</p>
            <div className="site-foot__meta">
              <p className="mono">Noch in Entwicklung, das ist eine Demo.</p>
              <p className="site-foot__small">
                Alle Personen, Werke und Produktionen auf dieser Seite sind erfunden.
                Rechteangaben sind Eigenangaben, ungeprüft. Preise sind geplant, es gibt keine
                Kaufmöglichkeit. Eingaben werden nach 24 Stunden gelöscht.
              </p>
            </div>
          </div>
          <hr className="hairline" />
          <div className="site-foot__bottom">
            <div className="site-foot__links">
              <Link to="/so-funktioniert-es">Ablauf</Link>
              <Link to="/preise">Preise</Link>
              <Link to="/fragen">Fragen</Link>
              <Link to="/impressum">Impressum</Link>
              <Link to="/datenschutz">Datenschutz</Link>
              <Link to="/demo">Demo</Link>
            </div>
            <p className="mono site-foot__time">
              {PRODUCT_NAME} / Demobau · <RunningTimecode /> · Fragment-Shader &amp; Web Audio
            </p>
          </div>
        </div>
      </footer>

      <div className="grain-overlay" aria-hidden="true" />
    </div>
  );
}
