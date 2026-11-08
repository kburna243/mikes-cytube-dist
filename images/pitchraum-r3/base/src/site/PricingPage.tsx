import type { PitchApi } from '../api/pitchApi';
import { PRICING_PLANS, PRODUCT_NAME } from './constants';
import { ContactTalkLink, DemoTryButton } from './SiteLayout';
import { useDocumentTitle } from '../router';

export function PricingPage({ api }: { api: PitchApi }) {
  useDocumentTitle(`Preise — ${PRODUCT_NAME}`);
  return (
    <div className="page">
      <header className="page-head shell">
        <p className="eyebrow">Preise · alle Angaben geplant</p>
        <h1 className="display page-head__title">
          Noch
          <br />
          nichts
          <br />
          <span className="accent-text">zu kaufen.</span>
        </h1>
        <div className="page-head__side">
          <p className="lede">
            {PRODUCT_NAME} ist in Entwicklung. Diese Preise sind geplant und zeigen die Richtung —
            keine Bestellung, keine Zahlung, keine Warteliste. Die Demo kostet nichts.
          </p>
          <DemoTryButton api={api} />
        </div>
      </header>

      <section className="price-ledger shell" aria-label="Geplante Preise">
        {PRICING_PLANS.map((plan, index) => (
          <article className="price-row" key={plan.id}>
            <div className="price-row__index mono">0{index + 1}</div>
            <div className="price-row__name">
              <h2 className="display">{plan.name}</h2>
              <p className="mono price-row__tag">geplant · keine Buchung möglich</p>
            </div>
            <div className="price-row__price">
              <strong>{plan.priceLabel}</strong>
              <span className="mono">inkl. Demo-Arbeitsbereich · 24 h</span>
            </div>
            <ul className="price-row__includes">
              {plan.includes.map((entry) => (
                <li key={entry}>{entry}</li>
              ))}
            </ul>
            <p className="price-row__audience">{plan.audience}</p>
          </article>
        ))}
      </section>

      <section className="section price-note">
        <div className="shell price-note__grid">
          <h2 className="display">Bis dahin:</h2>
          <div>
            <p className="price-note__statement">
              Die Demo ist der ehrlichste Preis. Sie läuft 24 Stunden, ohne Konto, ohne
              Kreditkarte.
            </p>
            <p>
              Was danach kommt, entscheidet sich mit echten Gesprächen — nicht mit einem
              Bestellformular auf einer Demo-Seite.
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.6rem', marginTop: '1.25rem' }}>
              <DemoTryButton api={api} />
              <ContactTalkLink />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
