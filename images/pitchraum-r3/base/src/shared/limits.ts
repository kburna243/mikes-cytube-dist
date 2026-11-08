/**
 * Verbindliche Längen- und Wertgrenzen für Eingaben.
 * Werden serverseitig geprüft und in der Oberfläche für Hinweise genutzt.
 */
export const INPUT_LIMITS = {
  recipientName: { min: 1, max: 80 },
  productionTitle: { min: 1, max: 120 },
  personalNote: { min: 0, max: 600 },
  trackIdsPerLink: { min: 1, max: 20 },
  inquiryName: { min: 1, max: 80 },
  inquiryProduction: { min: 1, max: 120 },
  usageScope: { min: 1, max: 200 },
  inquiryMessage: { min: 0, max: 1000 },
  splitPersonName: { min: 1, max: 80 },
  splitRole: { min: 1, max: 80 },
  splitSharePercent: { min: 0, max: 100 },
  splitIdentifier: { min: 0, max: 40 },
  contractFileName: { min: 1, max: 160 },
  contractNote: { min: 0, max: 300 },
  isrcCode: { min: 0, max: 20 },
  workRegistrationCode: { min: 0, max: 40 },
  rightsNotes: { min: 0, max: 1000 },
  artistName: { min: 1, max: 80 },
  artistTagline: { min: 0, max: 160 },
  artistIntro: { min: 0, max: 800 },
} as const;

/** Erlaubte Arten von Unterlagen (kein freier Text). */
export const CONTRACT_DOCUMENT_TYPES = [
  'Vereinbarung (Entwurf)',
  'Musiker-Freigabe',
  'Aufnahmeprotokoll',
  'Urheber-Notiz (Entwurf)',
  'Vereinbarung (Intern)',
  'Sonstige Unterlage',
] as const;

/** Erlaubte Gestalt-Kennungen für Künstlerseiten. */
export const ARTIST_LAYOUT_IDS = [
  'plakat',
  'archiv',
  'atelier',
  'leinwand',
  'raster',
] as const;

export type ArtistLayoutId = (typeof ARTIST_LAYOUT_IDS)[number];

export const ARTIST_LAYOUT_LABELS: Record<ArtistLayoutId, string> = {
  plakat: 'Plakat',
  archiv: 'Archiv',
  atelier: 'Atelier',
  leinwand: 'Leinwand',
  raster: 'Raster',
};

export const ARTIST_LAYOUT_DESCRIPTIONS: Record<ArtistLayoutId, string> = {
  plakat: 'Übergroße Schrift, ein Haupttrack, klare vertikale Blöcke.',
  archiv: 'Dichte Katalogliste wie ein Werkverzeichnis, Filter im Mittelpunkt.',
  atelier: 'Viel Weißraum, ruhige Textspalte, persönliche Vorstellung zuerst.',
  leinwand: 'Vollflächige Bildfläche, Titel darüber, filmisch.',
  raster: 'Kachelraster mit Coverflächen, wenig Text.',
};

/** Maximale Größe eines Anfrage-Körpers auf dem Server. */
export const REQUEST_BODY_LIMIT = '100kb';

/** Demo-Arbeitsbereiche werden nach dieser Zeit gelöscht. */
export const WORKSPACE_TTL_MS = 24 * 60 * 60 * 1000;

/** Höchstzahl gleichzeitiger Demo-Arbeitsbereiche. */
export const WORKSPACE_MAX_COUNT = 500;
