import { PITCH_PRODUCT_NAME } from '../components/pitch-demo/types';

export const PRODUCT_NAME = PITCH_PRODUCT_NAME;

/**
 * Zweiter Weg neben „Demo ausprobieren“: Kontaktadresse für ein Gespräch.
 * Solange sie leer ist, wird der Knopf „Gespräch anfragen“ nirgends angezeigt.
 */
export const CONTACT_EMAIL = '';

export function contactMailto(): string {
  return `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(`Gespräch zu ${PRODUCT_NAME}`)}`;
}

export interface PricingPlan {
  id: string;
  name: string;
  /** Auszeichnung, alle Preise sind geplant — es gibt keine Kaufmöglichkeit. */
  priceLabel: string;
  audience: string;
  includes: string[];
}

export const PRICING_PLANS: PricingPlan[] = [
  {
    id: 'solo',
    name: 'Solo',
    priceLabel: '49 €/Monat',
    audience: 'Für eine Person, die ihre Musik selbst an Film und Fernsehen schickt.',
    includes: [
      'Eigene Trackliste mit allen Angaben an einem Ort',
      'Persönliche Empfängerlinks ohne Anmeldung für die Empfängerin oder den Empfänger',
      'Du siehst, was geöffnet und angehört wurde',
      'Anfragen mit klaren Schritten (Neu → Im Gespräch → Vertrag offen → Abgeschlossen)',
    ],
  },
  {
    id: 'gruender',
    name: 'Gründerpreis',
    priceLabel: '29 €/Monat',
    audience: 'Für die ersten Nutzerinnen und Nutzer, die früh mitdenken und Rückmeldung geben.',
    includes: [
      'Alles aus „Solo“',
      'Fester Gründerpreis (geplant, nicht erhöhbar für die ersten Konten)',
      'Direkter Draht für Rückmeldungen',
    ],
  },
  {
    id: 'team',
    name: 'Team',
    priceLabel: 'ab 149 €/Monat',
    audience: 'Für kleine Teams und Publisher mit mehreren Katalogen.',
    includes: [
      'Alles aus „Solo“',
      'Mehrere Arbeitsplätze und Kataloge (geplant)',
      'Gemeinsame Übersicht über alle Anfragen (geplant)',
    ],
  },
];
