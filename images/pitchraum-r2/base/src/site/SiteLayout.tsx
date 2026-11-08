import React, { useState } from 'react';
import { CONTACT_EMAIL, PRODUCT_NAME, contactMailto } from './constants';
import { Link, navigate } from '../router';
import type { PitchApi } from '../api/pitchApi';
import { usePath } from '../router';

const SITE_NAV: { to: string; label: string }[] = [
  { to: '/so-funktioniert-es', label: 'So funktioniert es' },
  { to: '/preise', label: 'Preise' },
  { to: '/fragen', label: 'Fragen' },
];

/**
 * Hauptknopf der Website: „Demo ausprobieren“ legt ohne Anmeldung einen
 * Demo-Arbeitsbereich an und öffnet die verdrahtete App.
 */
export function DemoTryButton({
  api,
  className,
  onError,
}: {
  api: PitchApi;
  className?: string;
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
    <span className="inline-flex flex-col gap-2">
      <button
        type="button"
        onClick={() => void handleClick()}
        disabled={busy}
        className={
          className ||
          'inline-flex min-h-[48px] items-center justify-center rounded-md border border-[#7C8CFF] bg-[#7C8CFF] px-6 py-3 text-base font-bold text-[#0C0E14] transition-colors hover:bg-[#98A4FF] disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#57E8C6]'
        }
      >
        {busy ? 'Demo wird gestartet …' : 'Demo ausprobieren'}
      </button>
      {error && (
        <span role="alert" className="max-w-md text-sm font-semibold text-[#FF9AA0]">
          {error}
        </span>
      )}
    </span>
  );
}

/** Zweiter Weg: „Gespräch anfragen“ per mailto — nur sichtbar, wenn eine Adresse eingetragen ist. */
export function ContactTalkLink({ className }: { className?: string }) {
  if (!CONTACT_EMAIL) return null;
  return (
    <a
      href={contactMailto()}
      className={
        className ||
        'inline-flex min-h-[48px] items-center justify-center rounded-md border border-white/25 bg-transparent px-6 py-3 text-base font-semibold text-[#EEF0F6] transition-colors hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#57E8C6]'
      }
    >
      Gespräch anfragen
    </a>
  );
}

export function SiteLayout({ api, children }: { api: PitchApi; children: React.ReactNode }) {
  const path = usePath();
  return (
    <div
      className="min-h-screen bg-[#0C0E14] text-[#EEF0F6]"
      style={{ fontFamily: "'Inter', 'Helvetica Neue', Arial, sans-serif" }}
    >
      <a
        href="#hauptinhalt"
        className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:m-2 focus:rounded focus:bg-[#57E8C6] focus:px-4 focus:py-2 focus:font-bold focus:text-[#0C0E14]"
      >
        Zum Inhalt springen
      </a>

      <header className="sticky top-0 z-40 border-b border-white/10 bg-[#0C0E14]/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <Link
            to="/"
            className="text-lg font-bold tracking-tight text-[#EEF0F6] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#57E8C6]"
            style={{ fontFamily: "'Space Grotesk', 'Arial Narrow', sans-serif" }}
          >
            {PRODUCT_NAME}
            <span className="ml-2 rounded-sm border border-[#57E8C6]/50 px-1.5 py-0.5 align-middle text-[10px] font-semibold uppercase tracking-widest text-[#57E8C6]">
              Demo
            </span>
          </Link>

          <nav aria-label="Website-Navigation">
            <ul className="flex flex-wrap items-center gap-1 sm:gap-2">
              {SITE_NAV.map((item) => {
                const active = path === item.to;
                return (
                  <li key={item.to}>
                    <Link
                      to={item.to}
                      aria-current={active ? 'page' : undefined}
                      className={`inline-flex min-h-[44px] items-center rounded-md px-3 py-2 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#57E8C6] ${
                        active ? 'bg-white/10 text-white' : 'text-[#B8BFD0] hover:text-white'
                      }`}
                    >
                      {item.label}
                    </Link>
                  </li>
                );
              })}
              <li>
                <DemoTryButton
                  api={api}
                  className="inline-flex min-h-[44px] items-center justify-center rounded-md border border-[#7C8CFF] bg-[#7C8CFF] px-4 py-2 text-sm font-bold text-[#0C0E14] transition-colors hover:bg-[#98A4FF] disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#57E8C6]"
                />
              </li>
            </ul>
          </nav>
        </div>
      </header>

      <main id="hauptinhalt">{children}</main>

      <footer className="border-t border-white/10 px-4 py-10 sm:px-6">
        <div className="mx-auto flex max-w-6xl flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-2">
            <p
              className="text-base font-bold text-[#EEF0F6]"
              style={{ fontFamily: "'Space Grotesk', 'Arial Narrow', sans-serif" }}
            >
              {PRODUCT_NAME}
            </p>
            <p className="max-w-sm text-sm text-[#9AA3B2]">
              Arbeitstitel. Noch in Entwicklung — diese Seite ist eine Demo mit Fantasiedaten,
              es gibt nichts zu kaufen.
            </p>
          </div>
          <nav aria-label="Fußnavigation">
            <ul className="flex flex-wrap gap-x-5 gap-y-2 text-sm">
              <li>
                <Link to="/so-funktioniert-es" className="inline-flex min-h-[44px] items-center text-[#B8BFD0] hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#57E8C6]">
                  So funktioniert es
                </Link>
              </li>
              <li>
                <Link to="/preise" className="inline-flex min-h-[44px] items-center text-[#B8BFD0] hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#57E8C6]">
                  Preise
                </Link>
              </li>
              <li>
                <Link to="/fragen" className="inline-flex min-h-[44px] items-center text-[#B8BFD0] hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#57E8C6]">
                  Fragen
                </Link>
              </li>
              <li>
                <Link to="/impressum" className="inline-flex min-h-[44px] items-center text-[#B8BFD0] hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#57E8C6]">
                  Impressum
                </Link>
              </li>
              <li>
                <Link to="/datenschutz" className="inline-flex min-h-[44px] items-center text-[#B8BFD0] hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#57E8C6]">
                  Datenschutz
                </Link>
              </li>
            </ul>
          </nav>
        </div>
      </footer>
    </div>
  );
}
