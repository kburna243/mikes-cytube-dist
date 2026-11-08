import { PRODUCT_NAME } from './constants';
import { useDocumentTitle } from '../router';

/**
 * Impressum und Datenschutz: bewusst nur ein sichtbarer Platzhalter.
 * Es werden keine Rechtstexte oder Firmendaten erfunden.
 */
export function LegalPage({ kind }: { kind: 'impressum' | 'datenschutz' }) {
  const title = kind === 'impressum' ? 'Impressum' : 'Datenschutz';
  useDocumentTitle(`${title} — ${PRODUCT_NAME}`);
  return (
    <div className="px-4 py-14 sm:px-6">
      <div className="mx-auto max-w-3xl">
        <h1
          className="text-3xl font-bold tracking-tight text-[#F2F4FA] sm:text-4xl"
          style={{ fontFamily: "'Space Grotesk', 'Arial Narrow', sans-serif" }}
        >
          {title}
        </h1>
        <div className="mt-8 rounded-xl border-2 border-dashed border-[#57E8C6]/50 bg-[#12151E] p-6">
          <p className="text-lg font-bold text-[#57E8C6]">Rechtstext folgt vor Veröffentlichung</p>
          <p className="mt-3 text-base leading-relaxed text-[#B8BFD0]">
            Das hier ist eine Demo mit Fantasiedaten, noch in Entwicklung. Es wird absichtlich kein
            Platzhalter-Unternehmen erfunden und kein vorgefertigter Rechtstext übernommen.
          </p>
        </div>
      </div>
    </div>
  );
}
