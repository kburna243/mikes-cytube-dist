import type { PitchApi } from '../api/pitchApi';
import { PRICING_PLANS, PRODUCT_NAME } from './constants';
import { ContactTalkLink, DemoTryButton } from './SiteLayout';
import { useDocumentTitle } from '../router';
import { IconCheck } from './icons';

export function PricingPage({ api }: { api: PitchApi }) {
  useDocumentTitle(`Preise — ${PRODUCT_NAME}`);
  return (
    <div className="px-4 py-14 sm:px-6">
      <div className="mx-auto max-w-5xl">
        <p
          className="text-xs font-semibold uppercase tracking-[0.3em] text-[#57E8C6]"
          style={{ fontFamily: "'IBM Plex Mono', 'Courier New', monospace" }}
        >
          Preise
        </p>
        <h1
          className="mt-3 text-3xl font-bold tracking-tight text-[#F2F4FA] sm:text-4xl"
          style={{ fontFamily: "'Space Grotesk', 'Arial Narrow', sans-serif" }}
        >
          Geplante Preise — noch nichts zu kaufen
        </h1>
        <p className="mt-4 max-w-2xl text-lg leading-relaxed text-[#B8BFD0]">
          {PRODUCT_NAME} ist noch in Entwicklung. Diese Preise sind <strong>geplant</strong>, nichts
          davon kann man heute kaufen — es gibt keinen Bestellknopf, keine Zahlung und keine
          Warteliste.
        </p>

        <ul className="mt-10 grid grid-cols-1 gap-5 md:grid-cols-3">
          {PRICING_PLANS.map((plan) => (
            <li
              key={plan.id}
              className="flex flex-col rounded-xl border border-white/12 bg-[#12151E] p-6"
            >
              <div className="flex items-center justify-between gap-2">
                <h2 className="text-xl font-bold text-[#F2F4FA]">{plan.name}</h2>
                <span className="rounded-sm border border-[#57E8C6]/50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-[#57E8C6]">
                  geplant
                </span>
              </div>
              <p
                className="mt-2 text-3xl font-black text-[#7C8CFF]"
                style={{ fontFamily: "'Space Grotesk', 'Arial Narrow', sans-serif" }}
              >
                {plan.priceLabel}
              </p>
              <p className="mt-2 text-sm text-[#9AA3B2]">{plan.audience}</p>
              <ul className="mt-5 flex-1 space-y-2 border-t border-white/10 pt-4">
                {plan.includes.map((entry) => (
                  <li key={entry} className="flex items-start gap-2 text-sm text-[#B8BFD0]">
                    <IconCheck className="mt-0.5 h-4 w-4 shrink-0 text-[#57E8C6]" />
                    {entry}
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>

        <p className="mt-8 max-w-2xl text-sm leading-relaxed text-[#8A90A0]">
          Solange es kein fertiges Produkt gibt, probierst du einfach die Demo mit Fantasiedaten
          aus — kostenlos und ohne Anmeldung.
        </p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
          <DemoTryButton api={api} />
          <ContactTalkLink />
        </div>
      </div>
    </div>
  );
}
