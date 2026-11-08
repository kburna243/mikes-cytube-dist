import { PRODUCT_NAME } from './constants';
import { useDocumentTitle } from '../router';
import { Link } from '../router';

/**
 * Impressum & Datenschutz: absichtlich nur sichtbarer Platzhalter.
 * Keine erfundenen Firmendaten, keine vorgefertigten Rechtstexte.
 */
export function LegalPage({ kind }: { kind: 'impressum' | 'datenschutz' }) {
  const title = kind === 'impressum' ? 'Impressum' : 'Datenschutz';
  useDocumentTitle(`${title} — ${PRODUCT_NAME}`);
  return (
    <div className="page">
      <header className="page-head shell">
        <p className="eyebrow">{title} · Platzhalter</p>
        <h1 className="display page-head__title">
          Rechtstext
          <br />
          folgt vor
          <br />
          <span className="accent-text">Veröffentlichung.</span>
        </h1>
        <div className="page-head__side">
          <p className="lede">
            Hier steht bewusst kein erfundener Unternehmenstext und keine vorgefertigte
            Datenschutzerklärung. Diese Demo hat keine echten Vertragspartner und sammelt keine
            E-Mail-Adressen.
          </p>
          <Link to="/" className="text-link">Zurück zur Startseite</Link>
        </div>
      </header>

      <section className="section legal-note">
        <div className="shell legal-note__grid">
          <p className="mono">Status</p>
          <div>
            <p className="legal-note__big">Rechtstext folgt vor Veröffentlichung</p>
            <p>
              {kind === 'impressum'
                ? 'Anbieterkennzeichnung, Vertretung und Kontakt werden erst mit einer tatsächlichen Veröffentlichung ergänzt.'
                : 'Verantwortliche Stelle, Speicherfristen und Rechte werden ebenfalls erst mit der Veröffentlichung ergänzt. Für die Demo gilt: Arbeitsbereiche liegen nur im Arbeitsspeicher und werden nach 24 Stunden gelöscht.'}
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
