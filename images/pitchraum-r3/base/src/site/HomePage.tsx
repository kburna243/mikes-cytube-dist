import type { PitchApi } from '../api/pitchApi';
import { useDocumentTitle } from '../router';
import { PRODUCT_NAME } from './constants';
import { DemoTryButton, ContactTalkLink } from './SiteLayout';
import { Hero } from './home/Hero';
import { LinkSection } from './home/LinkSection';
import { AkteSection } from './home/AkteSection';
import { GesichterSection } from './home/GesichterSection';
import { useAudio } from '../audio/AudioProvider';
import { FilmScene } from '../scene/FilmScene';
import { HERO_SKETCHES } from '../audio/sketchData';
import { useState } from 'react';

function SchnittSection() {
  const { meta } = useAudio();
  const [stage, setStage] = useState<'bild' | 'link'>('bild');
  return (
    <section className="schnitt" id="schnitt" aria-labelledby="schnitt-heading">
      <div className="shell">
        <div className="schnitt__grid">
          <div className="schnitt__copy">
            <p className="eyebrow">Schnitt · aus dem Bild wird ein Link</p>
            <h2 id="schnitt-heading" className="display">
              Erst das Bild.
              <br />
              Dann der <span className="accent-text">Link.</span>
            </h2>
            <p>
              Dieselbe Szene, derselbe Track: Erst läuft sie im Kino, dann wird sie zum
              Empfängerlink. Kein Bearbeitungsfenster dazwischen — nur ein Schnitt.
            </p>
            <ol className="schnitt__steps">
              <li>
                <span>01</span>
                <span>Vorschau für dich</span>
                <span>Klang &amp; Bild</span>
              </li>
              <li>
                <span>02</span>
                <span>Link für die andere Seite</span>
                <span>ohne Konto</span>
              </li>
              <li>
                <span>03</span>
                <span>Antwort kommt zurück</span>
                <span>geöffnet · gehört · angefragt</span>
              </li>
            </ol>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '1.25rem' }}>
              <button
                type="button"
                className={stage === 'bild' ? 'btn btn--accent' : 'btn'}
                onClick={() => setStage('bild')}
                aria-pressed={stage === 'bild'}
              >
                Bild
              </button>
              <button
                type="button"
                className={stage === 'link' ? 'btn btn--accent' : 'btn'}
                onClick={() => setStage('link')}
                aria-pressed={stage === 'link'}
              >
                Empfängerlink
              </button>
            </div>
          </div>

          <div className="schnitt__strip">
            <div className="schnitt__screen scroll-shrink">
              <FilmScene accent={meta.accent} mode={meta.mode} decorative />
              <div className="schnitt__label">
                <span className="mono">{stage === 'bild' ? 'Vorschau · 16:9 · Regen' : 'Empfängerlink · geöffnet'}</span>
                <span className="mono">{HERO_SKETCHES.find((track) => track.id === meta.id)?.title || meta.title}</span>
              </div>
            </div>
            <div className="schnitt__recipient" aria-hidden={stage !== 'link'}>
              <p className="mono">Musikauswahl · Demo</p>
              <strong>Hafengrau</strong>
              <div className="schnitt__status">
                <span data-on="true">Geöffnet</span>
                <span data-on="true">Angehört</span>
                <span>Angefragt</span>
              </div>
              <p className="mono" style={{ color: 'var(--paper-faint)', margin: 0 }}>
                Läuft weiter, ohne neu zu laden.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function AbspannSection({ api }: { api: PitchApi }) {
  return (
    <section className="abspann" id="abspann" aria-labelledby="abspann-heading">
      <div className="shell">
        <div className="abspann__head">
          <p className="eyebrow">Abspann</p>
          <h2 id="abspann-heading" className="display abspann__title">
            Kein Applaus.
            <br />
            <span className="outline-word">Nur Arbeit,</span>
            <br />
            die man hört.
          </h2>
        </div>

        <dl className="abspann__credits">
          {[
            ['Bild', 'WebGL2, eigener Fragment-Shader in Echtzeit'],
            ['Ton', 'Web Audio API — Oszillatoren, Filter, Rauschen'],
            ['Schrift', 'Anybody, Instrument Sans, Martian Mono (OFL, lokal)'],
            ['Bewegung', 'CSS Scroll-driven Animations, View Transitions, WAAPI'],
            ['Daten', 'Express, nur im Arbeitsspeicher, 24 Stunden'],
            ['Rechte', 'Eigenangabe, ungeprüft'],
            ['Personen & Werke', 'vollständig erfunden'],
          ].map(([role, value]) => (
            <div key={role}>
              <dt className="mono">{role}</dt>
              <dd>{value}</dd>
            </div>
          ))}
        </dl>

        <div className="abspann__final">
          <p className="mono">Und jetzt du · Demo mit Fantasiedaten</p>
          <DemoTryButton api={api} className="abspann__cta" label="Demo ausprobieren" />
          <div className="abspann__foot">
            <p className="mono">
              Noch in Entwicklung, das ist eine Demo · keine Anmeldung, keine Käufe · Eingaben
              werden nach 24 Stunden gelöscht
            </p>
            <button
              type="button"
              className="text-link"
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            >
              Zurück zum Anfang <span aria-hidden="true">↑</span>
            </button>
          </div>
          <ContactTalkLink />
        </div>

        <p className="abspann__wordmark" aria-hidden="true">
          {PRODUCT_NAME}
        </p>
      </div>
    </section>
  );
}

/**
 * Die Startseite ist eine Montage: Szene, Schnitt, Link, Akte, fünf Gesichter,
 * Abspann. Natives Scrollen, keine Scroll-Sperren.
 */
export function HomePage({ api }: { api: PitchApi }) {
  useDocumentTitle(`${PRODUCT_NAME} — Dasselbe Bild. Drei Filme.`);
  return (
    <>
      <Hero />
      <SchnittSection />
      <LinkSection />
      <AkteSection />
      <GesichterSection />
      <AbspannSection api={api} />
    </>
  );
}
