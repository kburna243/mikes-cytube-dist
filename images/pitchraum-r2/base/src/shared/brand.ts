import type { ArtistLayoutId } from './limits';

/**
 * Ebene 1 der Künstlerseiten: das Markenpaket als Daten.
 * Die Variablennamen sind verbindlich — Gestalt-Kompositionen lesen
 * ausschließlich diese Werte, keine festen Farben.
 */
export interface BrandPackageValues {
  '--brand-primary': string;
  '--brand-secondary': string;
  '--brand-background': string;
  '--brand-accent': string;
  '--brand-text': string;
  '--font-family-display': string;
  '--font-family-body': string;
  '--font-family-mono': string;
}

export interface BrandPackage {
  /** Name des Pakets, z. B. „Nachtstudio“ */
  name: string;
  /** Tonfall-Stichworte, die das Paket beschreiben */
  toneKeywords: string[];
  values: BrandPackageValues;
}

/**
 * Einstellungen der eigenen Seite eines Arbeitsbereichs („Meine Seite“).
 */
export interface MyPageSettings {
  artistName: string;
  tagline: string;
  intro: string;
  layoutId: ArtistLayoutId;
  brand: BrandPackageValues;
  featuredTrackId: string | null;
}

/** Kuratierte Schriftpaare (alles lokale OFL-Schriften über @fontsource). */
export interface FontPair {
  id: string;
  label: string;
  display: string;
  body: string;
  mono: string;
}

export const FONT_PAIRS: FontPair[] = [
  {
    id: 'fraunces-inter',
    label: 'Fraunces & Inter',
    display: "'Fraunces', Georgia, serif",
    body: "'Inter', 'Helvetica Neue', Arial, sans-serif",
    mono: "'IBM Plex Mono', 'Courier New', monospace",
  },
  {
    id: 'grotesk-inter',
    label: 'Space Grotesk & Inter',
    display: "'Space Grotesk', 'Arial Narrow', sans-serif",
    body: "'Inter', 'Helvetica Neue', Arial, sans-serif",
    mono: "'IBM Plex Mono', 'Courier New', monospace",
  },
  {
    id: 'archivo-dmsans',
    label: 'Archivo & DM Sans',
    display: "'Archivo', 'Arial Black', sans-serif",
    body: "'DM Sans', Verdana, sans-serif",
    mono: "'IBM Plex Mono', 'Courier New', monospace",
  },
  {
    id: 'playfair-worksans',
    label: 'Playfair Display & Work Sans',
    display: "'Playfair Display', Georgia, serif",
    body: "'Work Sans', Verdana, sans-serif",
    mono: "'IBM Plex Mono', 'Courier New', monospace",
  },
  {
    id: 'bebas-worksans',
    label: 'Bebas Neue & Work Sans',
    display: "'Bebas Neue', 'Arial Narrow', Impact, sans-serif",
    body: "'Work Sans', Verdana, sans-serif",
    mono: "'IBM Plex Mono', 'Courier New', monospace",
  },
];

/**
 * Kuratierte Markenpakete: bewusst unterschiedliche Stimmungen,
 * Text/Hintergrund erfüllen jeweils WCAG AA für normalen Text.
 */
export const CURATED_BRAND_PACKAGES: BrandPackage[] = [
  {
    name: 'Nachtstudio',
    toneKeywords: ['dunkel', 'konzentriert', 'präzise'],
    values: {
      '--brand-primary': '#8FB6FF',
      '--brand-secondary': '#1B2233',
      '--brand-background': '#0B0D12',
      '--brand-accent': '#FFD166',
      '--brand-text': '#F2F4F8',
      '--font-family-display': "'Space Grotesk', 'Arial Narrow', sans-serif",
      '--font-family-body': "'Inter', 'Helvetica Neue', Arial, sans-serif",
      '--font-family-mono': "'IBM Plex Mono', 'Courier New', monospace",
    },
  },
  {
    name: 'Papierleicht',
    toneKeywords: ['hell', 'sachlich', 'aufgeräumt'],
    values: {
      '--brand-primary': '#2F5D50',
      '--brand-secondary': '#E4E8EE',
      '--brand-background': '#FAFBFC',
      '--brand-accent': '#B33A3A',
      '--brand-text': '#17191D',
      '--font-family-display': "'Fraunces', Georgia, serif",
      '--font-family-body': "'Inter', 'Helvetica Neue', Arial, sans-serif",
      '--font-family-mono': "'IBM Plex Mono', 'Courier New', monospace",
    },
  },
  {
    name: 'Signalraum',
    toneKeywords: ['direkt', 'kräftig', 'modern'],
    values: {
      '--brand-primary': '#35D0C8',
      '--brand-secondary': '#1A2129',
      '--brand-background': '#101418',
      '--brand-accent': '#FF5C8A',
      '--brand-text': '#F5F7FA',
      '--font-family-display': "'Archivo', 'Arial Black', sans-serif",
      '--font-family-body': "'DM Sans', Verdana, sans-serif",
      '--font-family-mono': "'IBM Plex Mono', 'Courier New', monospace",
    },
  },
  {
    name: 'Studiobuch',
    toneKeywords: ['klassisch', 'ruhig', 'vertrauenswürdig'],
    values: {
      '--brand-primary': '#25437A',
      '--brand-secondary': '#DDE4EC',
      '--brand-background': '#EEF1F4',
      '--brand-accent': '#8A45B8',
      '--brand-text': '#14202B',
      '--font-family-display': "'Playfair Display', Georgia, serif",
      '--font-family-body': "'Work Sans', Verdana, sans-serif",
      '--font-family-mono': "'IBM Plex Mono', 'Courier New', monospace",
    },
  },
  {
    name: 'Hochspannung',
    toneKeywords: ['laut', 'komprimiert', 'mutig'],
    values: {
      '--brand-primary': '#E2FF54',
      '--brand-secondary': '#161616',
      '--brand-background': '#000000',
      '--brand-accent': '#8F8FFF',
      '--brand-text': '#FFFFFF',
      '--font-family-display': "'Bebas Neue', 'Arial Narrow', Impact, sans-serif",
      '--font-family-body': "'Work Sans', Verdana, sans-serif",
      '--font-family-mono': "'IBM Plex Mono', 'Courier New', monospace",
    },
  },
];

export function defaultBrandValues(): BrandPackageValues {
  return { ...CURATED_BRAND_PACKAGES[0].values };
}

/** Erkennt, ob ein Markenwert-Satz einem kuratierten Paket entspricht. */
export function findMatchingCuratedPackage(values: BrandPackageValues): string | null {
  const match = CURATED_BRAND_PACKAGES.find(
    (pkg) =>
      JSON.stringify(Object.entries(pkg.values).sort()) ===
      JSON.stringify(Object.entries(values).sort())
  );
  return match ? match.name : null;
}
