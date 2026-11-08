import {
  ARTIST_LAYOUT_IDS,
  CONTRACT_DOCUMENT_TYPES,
  INPUT_LIMITS,
} from '../../src/shared/limits';
import { FONT_PAIRS } from '../../src/shared/brand';
import type { PitchDemoState } from '../../src/components/pitch-demo/types';

/**
 * Serverseitige Prüfung aller Eingaben: Pflichtfelder, Typen, Längen,
 * Anteile 0 bis 100. Jede Ablehnung kommt mit verständlicher deutscher Meldung.
 */

export type ValidationResult<T> =
  | { ok: true; value: T }
  | { ok: false; message: string };

type HeaderCheckInput = Record<string, unknown>;

function isPlainObject(value: unknown): value is HeaderCheckInput {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function checkString(
  raw: unknown,
  label: string,
  limits: { min: number; max: number },
  options: { required: boolean }
): ValidationResult<string> {
  if (raw === undefined || raw === null || raw === '') {
    if (options.required) {
      return { ok: false, message: `Das Feld „${label}“ fehlt. Bitte fülle es aus.` };
    }
    return { ok: true, value: '' };
  }
  if (typeof raw !== 'string') {
    return { ok: false, message: `Das Feld „${label}“ hat einen ungültigen Typ.` };
  }
  const value = raw.trim();
  if (options.required && value.length < limits.min) {
    return { ok: false, message: `Das Feld „${label}“ fehlt. Bitte fülle es aus.` };
  }
  if (value.length > limits.max) {
    return {
      ok: false,
      message: `Das Feld „${label}“ ist zu lang (höchstens ${limits.max} Zeichen). Bitte kürze es.`,
    };
  }
  return { ok: true, value };
}

export interface PitchLinkInput {
  recipientName: string;
  productionTitle: string;
  personalNote: string;
  trackIds: string[];
}

export function validatePitchLinkInput(
  body: unknown,
  state: PitchDemoState
): ValidationResult<PitchLinkInput> {
  if (!isPlainObject(body)) {
    return { ok: false, message: 'Die Anfrage war leer oder ungültig. Bitte versuche es erneut.' };
  }
  const recipientName = checkString(body.recipientName, 'Name der Person', INPUT_LIMITS.recipientName, { required: true });
  if (!recipientName.ok) return recipientName;
  const productionTitle = checkString(body.productionTitle, 'Projekt oder Film', INPUT_LIMITS.productionTitle, { required: true });
  if (!productionTitle.ok) return productionTitle;
  const personalNote = checkString(body.personalNote ?? '', 'Persönliche Nachricht', INPUT_LIMITS.personalNote, { required: false });
  if (!personalNote.ok) return personalNote;

  if (!Array.isArray(body.trackIds) || body.trackIds.length < INPUT_LIMITS.trackIdsPerLink.min) {
    return { ok: false, message: 'Bitte wähle mindestens einen Track aus, den du verschicken möchtest.' };
  }
  if (body.trackIds.length > INPUT_LIMITS.trackIdsPerLink.max) {
    return { ok: false, message: `Es sind höchstens ${INPUT_LIMITS.trackIdsPerLink.max} Tracks pro Link möglich.` };
  }
  for (const id of body.trackIds) {
    if (typeof id !== 'string' || !state.tracks.some((t) => t.id === id)) {
      return { ok: false, message: 'Mindestens ein ausgewählter Track gehört nicht zu deinem Katalog.' };
    }
  }
  const uniqueIds = Array.from(new Set(body.trackIds as string[]));
  return {
    ok: true,
    value: {
      recipientName: recipientName.value,
      productionTitle: productionTitle.value,
      personalNote: personalNote.value,
      trackIds: uniqueIds,
    },
  };
}

const PIPELINE_STAGES = ['neu_eingegangen', 'in_abstimmung', 'vorvertrag_offen', 'abgeschlossen'] as const;

export function validatePipelineStage(body: unknown): ValidationResult<(typeof PIPELINE_STAGES)[number]> {
  if (!isPlainObject(body) || typeof body.stage !== 'string' || !PIPELINE_STAGES.includes(body.stage as (typeof PIPELINE_STAGES)[number])) {
    return { ok: false, message: 'Dieser Status ist unbekannt. Bitte wähle einen der angebotenen Status.' };
  }
  return { ok: true, value: body.stage as (typeof PIPELINE_STAGES)[number] };
}

export interface RightsPatch {
  isrcCode?: string;
  workRegistrationCode?: string;
  notes?: string;
}

export function validateRightsPatch(body: unknown): ValidationResult<RightsPatch> {
  if (!isPlainObject(body)) {
    return { ok: false, message: 'Die Anfrage war leer oder ungültig. Bitte versuche es erneut.' };
  }
  const patch: RightsPatch = {};
  if (body.isrcCode !== undefined) {
    const checked = checkString(body.isrcCode, 'ISRC-Nummer', INPUT_LIMITS.isrcCode, { required: false });
    if (!checked.ok) return checked;
    patch.isrcCode = checked.value;
  }
  if (body.workRegistrationCode !== undefined) {
    const checked = checkString(body.workRegistrationCode, 'Werknummer', INPUT_LIMITS.workRegistrationCode, { required: false });
    if (!checked.ok) return checked;
    patch.workRegistrationCode = checked.value;
  }
  if (body.notes !== undefined) {
    const checked = checkString(body.notes, 'Notiz', INPUT_LIMITS.rightsNotes, { required: false });
    if (!checked.ok) return checked;
    patch.notes = checked.value;
  }
  return { ok: true, value: patch };
}

export interface SplitInput {
  personName: string;
  role: string;
  sharePercent: number;
  optionalIdentifier: string;
}

export function validateSplitInput(body: unknown): ValidationResult<SplitInput> {
  if (!isPlainObject(body)) {
    return { ok: false, message: 'Die Anfrage war leer oder ungültig. Bitte versuche es erneut.' };
  }
  const personName = checkString(body.personName, 'Name der Person', INPUT_LIMITS.splitPersonName, { required: true });
  if (!personName.ok) return personName;
  const role = checkString(body.role, 'Aufgabe beim Track', INPUT_LIMITS.splitRole, { required: true });
  if (!role.ok) return role;

  const rawShare = body.sharePercent;
  const share = typeof rawShare === 'string' && rawShare.trim() !== '' ? Number(rawShare) : rawShare;
  if (typeof share !== 'number' || Number.isNaN(share) || !Number.isFinite(share)) {
    return { ok: false, message: 'Bitte gib beim Anteil eine Zahl ein.' };
  }
  if (share < INPUT_LIMITS.splitSharePercent.min || share > INPUT_LIMITS.splitSharePercent.max) {
    return { ok: false, message: 'Der Anteil muss zwischen 0 und 100 Prozent liegen.' };
  }
  const identifier = checkString(body.optionalIdentifier ?? '', 'Kennnummer', INPUT_LIMITS.splitIdentifier, { required: false });
  if (!identifier.ok) return identifier;

  return {
    ok: true,
    value: {
      personName: personName.value,
      role: role.value,
      sharePercent: Math.round(share * 100) / 100,
      optionalIdentifier: identifier.value,
    },
  };
}

export interface ContractInput {
  fileName: string;
  documentType: string;
  note: string;
}

export function validateContractInput(body: unknown): ValidationResult<ContractInput> {
  if (!isPlainObject(body)) {
    return { ok: false, message: 'Die Anfrage war leer oder ungültig. Bitte versuche es erneut.' };
  }
  const fileName = checkString(body.fileName, 'Dateiname', INPUT_LIMITS.contractFileName, { required: true });
  if (!fileName.ok) return fileName;
  if (fileName.value.includes('/') || fileName.value.includes('\\')) {
    return { ok: false, message: 'Im Dateinamen sind keine Pfadangaben erlaubt. Bitte gib nur den Dateinamen an.' };
  }
  if (typeof body.documentType !== 'string' || !CONTRACT_DOCUMENT_TYPES.includes(body.documentType as (typeof CONTRACT_DOCUMENT_TYPES)[number])) {
    return { ok: false, message: 'Bitte wähle eine der angebotenen Arten von Unterlagen.' };
  }
  const note = checkString(body.note ?? '', 'Notiz zur Unterlage', INPUT_LIMITS.contractNote, { required: false });
  if (!note.ok) return note;
  return {
    ok: true,
    value: { fileName: fileName.value, documentType: body.documentType, note: note.value },
  };
}

export interface PublicInquiryValidated {
  trackId: string;
  recipientName: string;
  productionTitle: string;
  usageScope: string;
  message: string;
}

export function validatePublicInquiry(
  body: unknown,
  allowedTrackIds: string[]
): ValidationResult<PublicInquiryValidated> {
  if (!isPlainObject(body)) {
    return { ok: false, message: 'Die Anfrage war leer oder ungültig. Bitte versuchen Sie es erneut.' };
  }
  if (typeof body.trackId !== 'string' || !allowedTrackIds.includes(body.trackId)) {
    return { ok: false, message: 'Dieser Track gehört nicht zu dieser Auswahl.' };
  }
  const recipientName = checkString(body.recipientName, 'Ihr Name', INPUT_LIMITS.inquiryName, { required: true });
  if (!recipientName.ok) return adaptSie(recipientName);
  const productionTitle = checkString(body.productionTitle, 'Projekt', INPUT_LIMITS.inquiryProduction, { required: true });
  if (!productionTitle.ok) return adaptSie(productionTitle);
  const usageScope = checkString(body.usageScope, 'Geplante Nutzung', INPUT_LIMITS.usageScope, { required: true });
  if (!usageScope.ok) return adaptSie(usageScope);
  const message = checkString(body.message ?? '', 'Ihre Nachricht', INPUT_LIMITS.inquiryMessage, { required: false });
  if (!message.ok) return adaptSie(message);
  return {
    ok: true,
    value: {
      trackId: body.trackId,
      recipientName: recipientName.value,
      productionTitle: productionTitle.value,
      usageScope: usageScope.value,
      message: message.value,
    },
  };
}

/** Empfänger werden mit „Sie“ angesprochen. */
function adaptSie<T>(result: { ok: false; message: string }): ValidationResult<T> {
  return { ok: false, message: result.message.replace('Bitte fülle es aus.', 'Bitte füllen Sie es aus.').replace('Bitte kürze es.', 'Bitte kürzen Sie es.') };
}

const HEX_COLOR_PATTERN = /^#[0-9a-fA-F]{6}$/;
const KNOWN_FONT_VALUES = new Set([
  ...FONT_PAIRS.flatMap((pair) => [pair.display, pair.body, pair.mono]),
  // Frühere kuratierte Pakete bleiben akzeptiert, damit bestehende
  // Einstellungen nicht ungültig werden. Die Oberfläche bietet sie nicht mehr an.
  "'Space Grotesk', 'Arial Narrow', sans-serif",
  "'Inter', 'Helvetica Neue', Arial, sans-serif",
  "'IBM Plex Mono', 'Courier New', monospace",
]);
const BRAND_COLOR_KEYS = [
  '--brand-primary',
  '--brand-secondary',
  '--brand-background',
  '--brand-accent',
  '--brand-text',
] as const;
const BRAND_FONT_KEYS = [
  '--font-family-display',
  '--font-family-body',
  '--font-family-mono',
] as const;

export interface MyPageValidated {
  artistName: string;
  tagline: string;
  intro: string;
  layoutId: (typeof ARTIST_LAYOUT_IDS)[number];
  brand: { [key: string]: string };
  featuredTrackId: string | null;
}

export function validateMyPageSettings(
  body: unknown,
  state: PitchDemoState
): ValidationResult<MyPageValidated> {
  if (!isPlainObject(body)) {
    return { ok: false, message: 'Die Anfrage war leer oder ungültig. Bitte versuche es erneut.' };
  }
  const artistName = checkString(body.artistName, 'Künstlername', INPUT_LIMITS.artistName, { required: true });
  if (!artistName.ok) return artistName;
  const tagline = checkString(body.tagline ?? '', 'Kurzbeschreibung', INPUT_LIMITS.artistTagline, { required: false });
  if (!tagline.ok) return tagline;
  const intro = checkString(body.intro ?? '', 'Vorstellungstext', INPUT_LIMITS.artistIntro, { required: false });
  if (!intro.ok) return intro;

  if (typeof body.layoutId !== 'string' || !ARTIST_LAYOUT_IDS.includes(body.layoutId as (typeof ARTIST_LAYOUT_IDS)[number])) {
    return { ok: false, message: 'Bitte wähle eine der angebotenen Gestalten für deine Seite.' };
  }
  if (!isPlainObject(body.brand)) {
    return { ok: false, message: 'Das Markenpaket fehlt oder ist ungültig.' };
  }
  const brand: { [key: string]: string } = {};
  for (const key of BRAND_COLOR_KEYS) {
    const value = body.brand[key];
    if (typeof value !== 'string' || !HEX_COLOR_PATTERN.test(value)) {
      return { ok: false, message: `Der Farbwert ${key} ist ungültig. Bitte nutze eine Farbe wie #1A2B3C.` };
    }
    brand[key] = value.toUpperCase();
  }
  for (const key of BRAND_FONT_KEYS) {
    const value = body.brand[key];
    if (typeof value !== 'string' || !KNOWN_FONT_VALUES.has(value)) {
      return { ok: false, message: 'Bitte nutze eine der angebotenen Schriften für deine Seite.' };
    }
    brand[key] = value;
  }

  let featuredTrackId: string | null = null;
  if (body.featuredTrackId !== null && body.featuredTrackId !== undefined) {
    if (
      typeof body.featuredTrackId !== 'string' ||
      !state.tracks.some((t) => t.id === body.featuredTrackId)
    ) {
      return { ok: false, message: 'Der ausgewählte Haupttrack gehört nicht zu deinem Katalog.' };
    }
    featuredTrackId = body.featuredTrackId;
  }

  return {
    ok: true,
    value: {
      artistName: artistName.value,
      tagline: tagline.value,
      intro: intro.value,
      layoutId: body.layoutId as (typeof ARTIST_LAYOUT_IDS)[number],
      brand,
      featuredTrackId,
    },
  };
}
