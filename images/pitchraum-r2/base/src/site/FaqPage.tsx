import type { PitchApi } from '../api/pitchApi';
import { PRODUCT_NAME } from './constants';
import { ContactTalkLink, DemoTryButton } from './SiteLayout';
import { useDocumentTitle } from '../router';

interface FaqEntry {
  question: string;
  answer: string;
}

/**
 * Ehrliche Fragen und Antworten — inklusive dem, was das Produkt ausdrücklich nicht tut.
 */
const FAQ_ENTRIES: FaqEntry[] = [
  {
    question: `Was ist ${PRODUCT_NAME}?`,
    answer:
      'Ein Werkzeug, mit dem du deine Musik gezielt an einzelne Menschen bei Film und Fernsehen schickst: Du stellst eine Auswahl zusammen, verschickst sie als Link, siehst, was geöffnet und angehört wurde, und hältst Anfragen und Angaben zu jedem Track an einem Ort.',
  },
  {
    question: 'Für wen ist es gedacht?',
    answer:
      'Für unabhängige Komponistinnen, Komponisten und Producer, die ihre Musik selbst an Film- und Fernsehproduktionen lizenzieren — ohne Verlag, ohne Agentur und ohne Technik-Kenntnisse.',
  },
  {
    question: 'Brauchen die Empfänger ein Konto?',
    answer:
      'Nein. Wer deinen Link bekommt, öffnet ihn einfach im Browser — ohne Anmeldung, ohne Passwort. Der Link zeigt nur die Tracks dieser einen Auswahl.',
  },
  {
    question: 'Was bedeutet der Rechtestatus „Eigenangabe, ungeprüft“?',
    answer:
      'Alles, was du zu Anteilen, Beteiligten und Unterlagen einträgst, ist deine eigene Angabe. Das Produkt prüft diese Angaben nicht nach und gibt keine rechtlichen Versprechen ab — und so wird es auch der anderen Seite angezeigt. Wenn dir etwas fehlt (z. B. eine Vereinbarung), sagt dir die Liste ehrlich, was offen ist.',
  },
  {
    question: `Was tut ${PRODUCT_NAME} ausdrücklich nicht?`,
    answer:
      'Keine Distribution zu Streaming-Diensten. Keine Abrechnung oder Auszahlung von Tantiemen. Kein Marktplatz, auf dem Fremde deine Musik entdecken. Keine Prüfung deiner Rechte durch uns. Keine Rechtsberatung. Für all das brauchst du die üblichen Anlaufstellen — wir ersetzen sie nicht.',
  },
  {
    question: 'Lädt das Produkt meine Musikdateien hoch?',
    answer:
      'In der Demo wird nichts hochgeladen: Deine Tracks sind Angaben in einer Liste, und bei Unterlagen wird nur der Dateiname gespeichert — klar als Demo gekennzeichnet. Hörproben gibt es nur, wenn auf dem Server wirklich eine Datei dazu liegt; sonst steht dort offen „Hörprobe in der Demo nicht verfügbar“.',
  },
  {
    question: 'Was passiert mit meinen Eingaben in der Demo?',
    answer:
      'Die Demo läuft ohne Anmeldung und ohne personenbezogene Pflichtangaben. Dein Arbeitsbereich liegt nur vorübergehend auf dem Server und wird nach 24 Stunden gelöscht — deine Links verlieren dann ihre Gültigkeit.',
  },
  {
    question: 'Kann ich das Produkt schon kaufen?',
    answer:
      'Nein. Die Preise auf der Preisseite sind geplant, es gibt keine Kaufmöglichkeit, keine Warteliste und kein E-Mail-Formular. Du kannst nur die Demo ausprobieren.',
  },
  {
    question: 'Was ist mit den Künstlerseiten?',
    answer:
      'In der Demo stellst du dir eine schlichte öffentliche Seite mit deinen Tracks zusammen: Du beantwortest drei kurze Fragen, wählst Farben und Schriften aus einer begleiteten Auswahl und siehst sofort eine Vorschau. Drei fiktive Beispielseiten sind auf der Startseite verlinkt.',
  },
];

export function FaqPage({ api }: { api: PitchApi }) {
  useDocumentTitle(`Fragen — ${PRODUCT_NAME}`);
  return (
    <div className="px-4 py-14 sm:px-6">
      <div className="mx-auto max-w-3xl">
        <p
          className="text-xs font-semibold uppercase tracking-[0.3em] text-[#57E8C6]"
          style={{ fontFamily: "'IBM Plex Mono', 'Courier New', monospace" }}
        >
          Fragen
        </p>
        <h1
          className="mt-3 text-3xl font-bold tracking-tight text-[#F2F4FA] sm:text-4xl"
          style={{ fontFamily: "'Space Grotesk', 'Arial Narrow', sans-serif" }}
        >
          Ehrlich beantwortet — auch das Unbequeme
        </h1>

        <div className="mt-10 space-y-3">
          {FAQ_ENTRIES.map((entry) => (
            <details
              key={entry.question}
              className="group rounded-xl border border-white/12 bg-[#12151E] open:border-[#7C8CFF]/60"
            >
              <summary className="flex min-h-[48px] cursor-pointer list-none items-center justify-between gap-3 px-5 py-4 text-base font-bold text-[#F2F4FA] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#57E8C6] [&::-webkit-details-marker]:hidden">
                {entry.question}
                <span
                  aria-hidden="true"
                  className="shrink-0 text-xl text-[#9AA3B2] transition-transform group-open:rotate-45"
                >
                  +
                </span>
              </summary>
              <p className="border-t border-white/10 px-5 py-4 text-base leading-relaxed text-[#B8BFD0]">
                {entry.answer}
              </p>
            </details>
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
