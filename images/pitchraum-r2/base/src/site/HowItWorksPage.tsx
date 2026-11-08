import type { PitchApi } from '../api/pitchApi';
import { PRODUCT_NAME } from './constants';
import { ContactTalkLink, DemoTryButton } from './SiteLayout';
import { useDocumentTitle } from '../router';
import { IconCheck } from './icons';

const BLOCKS: { title: string; paragraphs: string[]; points?: string[] }[] = [
  {
    title: '1. Deine Musik bleibt bei dir',
    paragraphs: [
      'Du lädst in der Demo nichts hoch. Deine Tracks sind Listen-Einträge mit den Angaben, die du selbst gemacht hast: Titel, Tempo, Stimmung, wer mitgewirkt hat, welche Unterlagen es gibt.',
      'Was du nicht einträgst, bleibt leer. Es werden keine Kennnummern für dich erfunden und nichts automatisch ausgefüllt.',
    ],
  },
  {
    title: '2. Du schickst eine Auswahl an eine Person',
    paragraphs: [
      'Du wählst Tracks aus, schreibst kurz, für wen und für welches Projekt die Auswahl ist, und bekommst einen Link. Den schickst du selbst weiter — per E-Mail oder Nachricht, wie du willst.',
      'Der Link zeigt wirklich nur diese Auswahl. Die Empfängerin oder der Empfänger braucht kein Konto und keine Anmeldung.',
    ],
    points: [
      'Persönliche Nachricht direkt über der Trackliste',
      'Infoblatt pro Track: Stil, Instrumente, Beteiligte',
      'Anfragen-Knopf direkt beim Stück',
    ],
  },
  {
    title: '3. Du siehst, was passiert',
    paragraphs: [
      'Sobald jemand deinen Link öffnet, steht der Status auf „Geöffnet“. Wird ein Track abgespielt, steht dort „Angehört“. Kommt eine Anfrage, landet sie oben in deiner Anfragen-Liste.',
      'Anfragen sortierst du in einfachen Schritten: Neu, Im Gespräch, Vertrag offen, Abgeschlossen. So verlierst du nichts zwischen Posteingang und Notizzettel.',
    ],
  },
  {
    title: '4. Deine Angaben bleiben deine',
    paragraphs: [
      'Alles, was du zu Rechten und Anteilen einträgst, ist in der Demo mit „Eigenangabe, ungeprüft" gekennzeichnet — so sieht es auch die andere Seite. Niemand prüft das für dich nach, und das Produkt gibt keine rechtlichen Versprechen ab.',
      'Die Demo speichert deine Eingaben nur vorübergehend: Nach 24 Stunden wird dein Arbeitsbereich gelöscht. Links verlieren dann ihre Gültigkeit.',
    ],
  },
];

export function HowItWorksPage({ api }: { api: PitchApi }) {
  useDocumentTitle(`So funktioniert es — ${PRODUCT_NAME}`);
  return (
    <div className="px-4 py-14 sm:px-6">
      <div className="mx-auto max-w-3xl">
        <p
          className="text-xs font-semibold uppercase tracking-[0.3em] text-[#57E8C6]"
          style={{ fontFamily: "'IBM Plex Mono', 'Courier New', monospace" }}
        >
          So funktioniert es
        </p>
        <h1
          className="mt-3 text-3xl font-bold tracking-tight text-[#F2F4FA] sm:text-4xl"
          style={{ fontFamily: "'Space Grotesk', 'Arial Narrow', sans-serif" }}
        >
          Der ganze Weg eines Tracks — in Alltagssprache
        </h1>
        <p className="mt-4 text-lg leading-relaxed text-[#B8BFD0]">
          Kein Fachchinesisch, keine versteckten Schritte. So läuft es in der Demo, und so soll es
          sich auch später anfühlen.
        </p>

        <div className="mt-10 space-y-6">
          {BLOCKS.map((block) => (
            <section
              key={block.title}
              aria-label={block.title}
              className="rounded-xl border border-white/12 bg-[#12151E] p-6"
            >
              <h2 className="text-xl font-bold text-[#F2F4FA]">{block.title}</h2>
              {block.paragraphs.map((paragraph, index) => (
                <p key={index} className="mt-3 text-base leading-relaxed text-[#B8BFD0]">
                  {paragraph}
                </p>
              ))}
              {block.points && (
                <ul className="mt-4 space-y-2">
                  {block.points.map((point) => (
                    <li key={point} className="flex items-start gap-2 text-sm text-[#B8BFD0]">
                      <IconCheck className="mt-0.5 h-4 w-4 shrink-0 text-[#57E8C6]" />
                      {point}
                    </li>
                  ))}
                </ul>
              )}
            </section>
          ))}
        </div>

        <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-center">
          <DemoTryButton api={api} />
          <ContactTalkLink />
        </div>
      </div>
    </div>
  );
}
