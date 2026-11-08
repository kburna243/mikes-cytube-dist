import { useMemo } from 'react';
import type { PitchApi } from '../api/pitchApi';
import { Link, useDocumentTitle } from '../router';
import { PRODUCT_NAME } from './constants';
import { ContactTalkLink, DemoTryButton } from './SiteLayout';
import { IconArrowRight, IconEar, IconEye, IconFolder, IconSend } from './icons';
import { createInitialFictionalState } from '../shared/fictionalData';
import type { PitchDemoState } from '../components/pitch-demo/types';
import { ComposerHomeView } from '../components/pitch-demo/ComposerHomeView';
import { RecipientPitchView } from '../components/pitch-demo/RecipientPitchView';
import { InquiriesView } from '../components/pitch-demo/InquiriesView';
import { ARTIST_PROFILES } from '../artist/artists';
import { brandValuesToStyle } from '../artist/types';
import { ARTIST_LAYOUT_LABELS } from '../shared/limits';
import { CoverArt } from '../artist/CoverArt';

/** Fantasiedaten mit gültig aussehenden Tokens für die statischen Ausschnitte (nur Anzeige). */
function buildShowcaseState(): PitchDemoState {
  const state = createInitialFictionalState();
  state.pitchLinks = state.pitchLinks.map((link, index) => ({
    ...link,
    token: `${String(index + 1).repeat(2)}`.padEnd(32, '0').replace(/[^0-9a-f]/g, 'a'),
  }));
  return state;
}

function AppSnippetFrame({
  title,
  caption,
  children,
}: {
  title: string;
  caption: string;
  children: React.ReactNode;
}) {
  return (
    <figure className="overflow-hidden rounded-xl border border-white/15 bg-stone-100">
      <div className="flex items-center justify-between gap-2 border-b border-white/10 bg-[#12151E] px-4 py-2">
        <figcaption className="text-xs font-semibold uppercase tracking-widest text-[#9AA3B2]">
          {title}
        </figcaption>
        <span
          className="rounded bg-amber-300 px-1.5 py-0.5 text-[10px] font-bold text-slate-950"
        >
          Demo
        </span>
      </div>
      <div className="relative max-h-[380px] overflow-hidden">
        {/* Echte Komponenten aus der App, als nicht bedienbarer Ausschnitt */}
        <div inert aria-hidden="true" className="pointer-events-none select-none">
          {children}
        </div>
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-stone-100 to-transparent"
        />
      </div>
      <p className="border-t border-white/10 bg-[#12151E] px-4 py-2.5 text-sm text-[#B8BFD0]">
        {caption}
      </p>
    </figure>
  );
}

export function HomePage({ api }: { api: PitchApi }) {
  useDocumentTitle(`${PRODUCT_NAME} — Musik gezielt an Film und Fernsehen schicken`);
  const showcase = useMemo(buildShowcaseState, []);

  return (
    <div>
      {/* Klare Ansage: noch in Entwicklung */}
      <div className="border-b border-[#57E8C6]/30 bg-[#0E2A24] px-4 py-3 sm:px-6">
        <p className="mx-auto max-w-6xl text-sm text-[#B4F2E3]">
          <strong className="font-bold">Noch in Entwicklung.</strong> Das hier ist eine Demo mit
          Fantasiedaten. Es gibt noch kein fertiges Produkt, nichts zu kaufen und keine Warteliste.
        </p>
      </div>

      {/* Hero */}
      <section aria-labelledby="hero-heading" className="px-4 pb-16 pt-14 sm:px-6 sm:pt-20">
        <div className="mx-auto max-w-6xl">
          <p
            className="text-xs font-semibold uppercase tracking-[0.3em] text-[#57E8C6]"
            style={{ fontFamily: "'IBM Plex Mono', 'Courier New', monospace" }}
          >
            Für Komponistinnen und Producer
          </p>
          <h1
            id="hero-heading"
            className="mt-4 max-w-4xl font-bold leading-[1.02] tracking-tight text-[#F2F4FA]"
            style={{
              fontFamily: "'Space Grotesk', 'Arial Narrow', sans-serif",
              fontSize: 'clamp(2.2rem, 6vw, 4.6rem)',
            }}
          >
            Schick deine Musik direkt an die Menschen, die sie im Film brauchen.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-[#B8BFD0]">
            {PRODUCT_NAME} schickt deine Tracks gezielt an Menschen bei Film und Fernsehen. Du
            siehst, was geöffnet und angehört wurde — und alle Anfragen und Angaben zu jedem
            Track bleiben an einem Ort.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
            <DemoTryButton api={api} />
            <ContactTalkLink />
          </div>
          <p className="mt-4 text-sm text-[#8A90A0]">
            Ohne Anmeldung, ohne Angabe deiner Daten. Deine Eingaben werden nach 24 Stunden
            gelöscht.
          </p>
        </div>
      </section>

      {/* Nutzen */}
      <section aria-labelledby="nutzen-heading" className="border-t border-white/10 px-4 py-14 sm:px-6">
        <div className="mx-auto max-w-6xl">
          <h2
            id="nutzen-heading"
            className="text-2xl font-bold tracking-tight text-[#F2F4FA] sm:text-3xl"
            style={{ fontFamily: "'Space Grotesk', 'Arial Narrow', sans-serif" }}
          >
            Was dir das bringt
          </h2>
          <ul className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-3">
            <li className="rounded-xl border border-white/12 bg-[#12151E] p-5">
              <IconSend className="h-6 w-6 text-[#7C8CFF]" />
              <h3 className="mt-3 text-lg font-bold text-[#F2F4FA]">Gezielt statt gestreut</h3>
              <p className="mt-2 text-sm leading-relaxed text-[#B8BFD0]">
                Du stellst eine Auswahl für genau eine Person und ein Projekt zusammen und
                verschickst sie als Link — statt deine Musik in den großen Topf zu werfen.
              </p>
            </li>
            <li className="rounded-xl border border-white/12 bg-[#12151E] p-5">
              <IconEar className="h-6 w-6 text-[#57E8C6]" />
              <h3 className="mt-3 text-lg font-bold text-[#F2F4FA]">Du siehst, was passiert</h3>
              <p className="mt-2 text-sm leading-relaxed text-[#B8BFD0]">
                Geöffnet, angehört, angefragt: Für jeden Link siehst du, was die andere Seite
                getan hat — und kannst ruhig nachfassen, statt im Dunkeln zu warten.
              </p>
            </li>
            <li className="rounded-xl border border-white/12 bg-[#12151E] p-5">
              <IconFolder className="h-6 w-6 text-[#FF9AA0]" />
              <h3 className="mt-3 text-lg font-bold text-[#F2F4FA]">Ordnung pro Track</h3>
              <p className="mt-2 text-sm leading-relaxed text-[#B8BFD0]">
                Anteile, Unterlagen und Notizen liegen bei jedem Stück beieinander. Wenn eine
                Anfrage kommt, weißt du sofort, was eingetragen ist und was fehlt.
              </p>
            </li>
          </ul>
        </div>
      </section>

      {/* Drei Schritte */}
      <section aria-labelledby="schritte-heading" className="border-t border-white/10 px-4 py-14 sm:px-6">
        <div className="mx-auto max-w-6xl">
          <h2
            id="schritte-heading"
            className="text-2xl font-bold tracking-tight text-[#F2F4FA] sm:text-3xl"
            style={{ fontFamily: "'Space Grotesk', 'Arial Narrow', sans-serif" }}
          >
            In drei Schritten verschickt
          </h2>
          <ol className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-3">
            {[
              {
                no: '01',
                title: 'Tracks aussuchen',
                text: 'Wähle aus deiner Liste die Stücke, die zum Projekt passen — mit kurzer persönlicher Nachricht dazu.',
              },
              {
                no: '02',
                title: 'Link verschicken',
                text: 'Du bekommst einen Link für genau diese Auswahl. Die Empfängerin öffnet ihn ohne Anmeldung und findet nur diese Tracks.',
              },
              {
                no: '03',
                title: 'Reagieren und ordnen',
                text: 'Du siehst „Geöffnet“ und „Angehört“. Anfragen landen in deiner Liste und wachsen Schritt für Schritt Richtung Abschluss.',
              },
            ].map((stepItem) => (
              <li key={stepItem.no} className="relative rounded-xl border border-white/12 bg-[#12151E] p-5">
                <span
                  className="text-4xl font-black text-[#2A3040]"
                  style={{ fontFamily: "'Space Grotesk', 'Arial Narrow', sans-serif" }}
                  aria-hidden="true"
                >
                  {stepItem.no}
                </span>
                <h3 className="mt-2 text-lg font-bold text-[#F2F4FA]">{stepItem.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-[#B8BFD0]">{stepItem.text}</p>
              </li>
            ))}
          </ol>
          <div className="mt-8">
            <Link
              to="/so-funktioniert-es"
              className="inline-flex min-h-[48px] items-center gap-2 rounded-md border border-white/25 px-5 py-2.5 text-sm font-bold text-[#EEF0F6] hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#57E8C6]"
            >
              Genauer erklärt
              <IconArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Echte Oberflächen-Ausschnitte aus der App */}
      <section aria-labelledby="ausschnitte-heading" className="border-t border-white/10 px-4 py-14 sm:px-6">
        <div className="mx-auto max-w-6xl">
          <h2
            id="ausschnitte-heading"
            className="text-2xl font-bold tracking-tight text-[#F2F4FA] sm:text-3xl"
            style={{ fontFamily: "'Space Grotesk', 'Arial Narrow', sans-serif" }}
          >
            So sieht die Demo aus
          </h2>
          <p className="mt-3 max-w-2xl text-base text-[#B8BFD0]">
            Das sind echte Ausschnitte der Oberfläche — dieselben Ansichten, die du in der Demo
            selbst bedienen kannst. Alle Namen und Werke darin sind fiktiv.
          </p>
          <div className="mt-8 grid grid-cols-1 gap-5 lg:grid-cols-2">
            <AppSnippetFrame
              title="Dein Start als Komponistin"
              caption="Zuletzt verschickte Links mit deutlichem Status: noch nicht geöffnet, geöffnet, angehört."
            >
              <div className="bg-stone-100 p-4 text-stone-900">
                <ComposerHomeView
                  state={showcase}
                  onStartSendMusic={() => {}}
                  onOpenInquiries={() => {}}
                  onOpenMyMusic={() => {}}
                  onPreviewLinkAsRecipient={() => {}}
                />
              </div>
            </AppSnippetFrame>
            <AppSnippetFrame
              title="So sieht es die Empfängerin"
              caption="Nur die Tracks dieses Links, mit persönlicher Nachricht, Infoblatt und Anfragen-Knopf."
            >
              <div className="bg-stone-100 p-4 text-stone-900">
                <RecipientPitchView
                  state={showcase}
                  activeLink={showcase.pitchLinks[0]}
                  onPlayTrack={async () => {}}
                  onSubmitInquiry={async () => {}}
                />
              </div>
            </AppSnippetFrame>
            <AppSnippetFrame
              title="Anfragen im Griff"
              caption="Jede Anfrage wandert in klaren Schritten: Neu, Im Gespräch, Vertrag offen, Abgeschlossen."
            >
              <div className="bg-stone-100 p-4 text-stone-900">
                <InquiriesView inquiries={showcase.inquiries} onChangeStage={async () => {}} />
              </div>
            </AppSnippetFrame>
            <div className="flex flex-col justify-center rounded-xl border border-[#7C8CFF]/40 bg-[#12151E] p-6">
              <IconEye className="h-6 w-6 text-[#7C8CFF]" />
              <h3 className="mt-3 text-lg font-bold text-[#F2F4FA]">Selbst durchklicken</h3>
              <p className="mt-2 text-sm leading-relaxed text-[#B8BFD0]">
                In der Demo kannst du Tracks verschicken, den Empfänger-Link in einem anderen
                Browser öffnen und sehen, wie der Status zurück bei dir ankommt.
              </p>
              <div className="mt-4">
                <DemoTryButton api={api} />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Künstlerseiten-Beispiele */}
      <section aria-labelledby="artist-examples-heading" className="border-t border-white/10 px-4 py-14 sm:px-6">
        <div className="mx-auto max-w-6xl">
          <h2
            id="artist-examples-heading"
            className="text-2xl font-bold tracking-tight text-[#F2F4FA] sm:text-3xl"
            style={{ fontFamily: "'Space Grotesk', 'Arial Narrow', sans-serif" }}
          >
            Deine eigene Seite — nicht wie ein Template
          </h2>
          <p className="mt-3 max-w-2xl text-base text-[#B8BFD0]">
            In der Demo stellst du dir eine schlichte Künstlerseite zusammen: Gestalt, Farben und
            Schriften passen zu dir. Drei fiktive Beispiele — alle erfunden, alle in Eigenregie
            gesetzt:
          </p>
          <ul className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
            {ARTIST_PROFILES.map((artist) => (
              <li key={artist.slug}>
                <Link
                  to={`/k/${artist.slug}`}
                  className="group block overflow-hidden rounded-xl border border-white/12 transition-colors hover:border-white/40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#57E8C6]"
                  style={brandValuesToStyle(artist.brand.values)}
                >
                  <div className="aspect-[4/3] overflow-hidden">
                    <CoverArt seed={`karte-${artist.slug}`} className="h-full w-full transition-transform duration-300 group-hover:scale-[1.03]" />
                  </div>
                  <div
                    className="p-4"
                    style={{
                      backgroundColor: 'var(--brand-background)',
                      color: 'var(--brand-text)',
                      fontFamily: 'var(--font-family-body)',
                    }}
                  >
                    <p className="text-base font-bold" style={{ fontFamily: 'var(--font-family-display)' }}>
                      {artist.name}
                    </p>
                    <p className="mt-1 text-xs" style={{ fontFamily: 'var(--font-family-mono)', color: 'var(--brand-primary)' }}>
                      Gestalt: {ARTIST_LAYOUT_LABELS[artist.layoutId]} · fiktiv
                    </p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Schluss-CTA */}
      <section aria-labelledby="cta-heading" className="border-t border-white/10 px-4 py-16 sm:px-6">
        <div className="mx-auto max-w-6xl rounded-2xl border border-white/12 bg-[#12151E] p-8 sm:p-10">
          <h2
            id="cta-heading"
            className="max-w-2xl text-3xl font-bold leading-tight tracking-tight text-[#F2F4FA] sm:text-4xl"
            style={{ fontFamily: "'Space Grotesk', 'Arial Narrow', sans-serif" }}
          >
            Zwei Tracks verschicken. Einen Link kopieren. Zusehen, was zurückkommt.
          </h2>
          <p className="mt-4 max-w-xl text-base text-[#B8BFD0]">
            Die Demo läuft komplett im Browser deiner Wahl — und der Empfängerlink funktioniert
            auch in einem zweiten, ganz anderen Browser.
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
            <DemoTryButton api={api} />
            <ContactTalkLink />
          </div>
        </div>
      </section>
    </div>
  );
}
