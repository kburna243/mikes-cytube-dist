import type { PitchApi } from '../api/pitchApi';
import { PRODUCT_NAME } from './constants';
import { ContactTalkLink, DemoTryButton } from './SiteLayout';
import { useDocumentTitle } from '../router';

const FAQ = [
  {
    q: `Was ist ${PRODUCT_NAME}?`,
    a: 'Ein Werkzeug für Komponistinnen und Producer: eine Musikauswahl gezielt an eine Person bei Film oder Fernsehen schicken, sehen was geöffnet und angehört wurde, und Anfragen sowie Angaben zu jedem Track an einem Ort halten.',
  },
  {
    q: 'Brauchen die Empfänger ein Konto?',
    a: 'Nein. Der Link funktioniert ohne Anmeldung in jedem Browser. Er zeigt genau die Tracks dieser Auswahl — und keine internen Notizen oder Unterlagen.',
  },
  {
    q: 'Was bedeutet „Eigenangabe, ungeprüft“?',
    a: 'Anteile, Beteiligte und Unterlagen sind deine eigenen Angaben. Das Produkt prüft sie nicht nach und verspricht keine Rechte. Fehlende Unterlagen werden ehrlich als fehlend angezeigt.',
  },
  {
    q: 'Hört man in der Demo echte Aufnahmen?',
    a: 'Nein. Solange keine Audiodatei vorliegt, erzeugt der Browser eine Klangskizze aus Tempo, Stimmung und Tonart. Das ist so gekennzeichnet — und ersetzt keine Aufnahme.',
  },
  {
    q: 'Was passiert mit meinen Eingaben?',
    a: 'Der Demo-Arbeitsbereich liegt nur im Arbeitsspeicher des Servers und wird nach 24 Stunden gelöscht. Danach verfallen auch die Links. Es gibt keine Anmeldung und keine Pflichtangaben zur Person.',
  },
  {
    q: 'Kann ich das Produkt kaufen?',
    a: 'Nein. Die Preise sind geplant. Es gibt keine Kaufmöglichkeit, keine Warteliste und keine E-Mail-Sammlung.',
  },
  {
    q: 'Was tun die Künstlerseiten?',
    a: 'Sie zeigen, wie unterschiedlich eine Künstlerseite aussehen kann: Markenpaket als Werte, Gestalt als Komposition, Inhalt aus dem Profil. Fünf erfundene Beispiele, jedes mit eigenem Verhalten.',
  },
];

export function FaqPage({ api }: { api: PitchApi }) {
  useDocumentTitle(`Fragen — ${PRODUCT_NAME}`);
  return (
    <div className="page">
      <header className="page-head shell">
        <p className="eyebrow">Fragen · ehrlich beantwortet</p>
        <h1 className="display page-head__title">
          Kurze
          <br />
          Antworten.
          <br />
          <span className="accent-text">Keine Mythen.</span>
        </h1>
        <div className="page-head__side">
          <p className="lede">
            Was {PRODUCT_NAME} kann — und was nicht. Wenn hier etwas fehlt, fehlt es, weil es
            noch nicht feststeht.
          </p>
          <DemoTryButton api={api} />
        </div>
      </header>

      <section className="faq shell" aria-label="Fragen und Antworten">
        {FAQ.map((entry, index) => (
          <details className="faq-row" key={entry.q}>
            <summary>
              <span className="mono faq-row__no">{String(index + 1).padStart(2, '0')}</span>
              <span className="faq-row__q">{entry.q}</span>
              <span className="faq-row__sign" aria-hidden="true">+</span>
            </summary>
            <p className="faq-row__a">{entry.a}</p>
          </details>
        ))}
      </section>

      <section className="section faq-limits" aria-labelledby="limits-heading">
        <div className="shell">
          <h2 id="limits-heading" className="display faq-limits__title">
            Und was
            <br />
            <span className="outline-word">nicht?</span>
          </h2>
          <div className="faq-limits__grid">
            <p>Keine Distribution zu Streamingdiensten.</p>
            <p>Keine Tantiemen-Abrechnung oder Auszahlung.</p>
            <p>Kein Marktplatz für zufällige Entdeckung.</p>
            <p>Keine Prüfung deiner Rechte durch uns.</p>
            <p>Keine Rechtsberatung.</p>
            <p>Keine erfundenen Kundenstimmen, Logos oder Zahlen — auch nicht als Demo.</p>
          </div>
          <div style={{ marginTop: '2rem', display: 'flex', flexWrap: 'wrap', gap: '0.6rem' }}>
            <DemoTryButton api={api} />
            <ContactTalkLink />
          </div>
        </div>
      </section>
    </div>
  );
}
