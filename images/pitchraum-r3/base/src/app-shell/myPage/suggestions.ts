import type { ArtistLayoutId } from '../../shared/limits';
import { ARTIST_LAYOUT_LABELS, ARTIST_LAYOUT_DESCRIPTIONS } from '../../shared/limits';
import type { BrandPackageValues } from '../../shared/brand';
import { CURATED_BRAND_PACKAGES } from '../../shared/brand';

/**
 * Aus drei kurzen Gefühls-Fragen entsteht ein nachvollziehbarer Vorschlag
 * für Gestalt und Markenpaket. Alles bleibt jederzeit änderbar.
 */

export interface FeelAnswers {
  /** Q1: Wie klingt deine Musik eher? */
  energy: 'ruhig' | 'geerdet' | 'kraeftig' | '';
  /** Q2: Was darf man zuerst sehen? */
  firstImpression: 'track_gross' | 'werkliste' | 'text_ich' | 'bildflaeche' | 'cover_wand' | '';
  /** Q3: Wie viel Text verträgt deine Seite? */
  textAmount: 'wenig' | 'mittel' | 'viel' | '';
}

export function answersComplete(answers: FeelAnswers): boolean {
  return answers.energy !== '' && answers.firstImpression !== '' && answers.textAmount !== '';
}

const IMPRESSION_TO_LAYOUT: Record<string, ArtistLayoutId> = {
  track_gross: 'plakat',
  werkliste: 'archiv',
  text_ich: 'atelier',
  bildflaeche: 'leinwand',
  cover_wand: 'raster',
};

export const IMPRESSION_LABELS: Record<string, string> = {
  track_gross: 'einen wichtigen Track, richtig groß',
  werkliste: 'eine dichte, sortierbare Werkliste',
  text_ich: 'einen ruhigen Absatz über dich',
  bildflaeche: 'eine große Bildfläche wie im Kino',
  cover_wand: 'eine Wand aus Coverflächen',
};

export interface LayoutSuggestion {
  layoutId: ArtistLayoutId;
  layoutLabel: string;
  brandPackageName: string;
  brandValues: BrandPackageValues;
  /** Verständliche Begründung in Alltagssprache */
  reason: string;
}

export function suggestFromFeel(answers: FeelAnswers): LayoutSuggestion | null {
  if (!answersComplete(answers)) return null;

  const layoutId = IMPRESSION_TO_LAYOUT[answers.firstImpression];
  const layoutLabel = ARTIST_LAYOUT_LABELS[layoutId];

  // Markenpaket aus Klang (Q1) und Textmenge (Q3)
  let packageName: string;
  if (answers.energy === 'ruhig') {
    packageName = answers.textAmount === 'viel' ? 'Papierleicht' : 'Nachtstudio';
  } else if (answers.energy === 'geerdet') {
    packageName = answers.textAmount === 'wenig' ? 'Signalraum' : 'Studiobuch';
  } else {
    packageName = answers.textAmount === 'viel' ? 'Signalraum' : 'Hochspannung';
  }
  const pkg = CURATED_BRAND_PACKAGES.find((p) => p.name === packageName) || CURATED_BRAND_PACKAGES[0];

  const reason = `Du magst es eher ${
    answers.energy === 'ruhig' ? 'ruhig' : answers.energy === 'geerdet' ? 'geerdet' : 'kräftig'
  } und willst zuerst ${IMPRESSION_LABELS[answers.firstImpression]} zeigen. Deshalb schlagen wir
die Gestalt „${layoutLabel}“ vor — ${ARTIST_LAYOUT_DESCRIPTIONS[layoutId]} Dazu passt das
Markenpaket „${pkg.name}“ (${pkg.toneKeywords.join(', ')}). Beides kannst du unten jederzeit ändern.`;

  return {
    layoutId,
    layoutLabel,
    brandPackageName: pkg.name,
    brandValues: { ...pkg.values },
    reason: reason.replace(/\s+/g, ' ').trim(),
  };
}
