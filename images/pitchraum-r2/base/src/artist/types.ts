import type { BrandPackage, BrandPackageValues } from '../shared/brand';
import type { ArtistLayoutId } from '../shared/limits';

/**
 * Ebene 3 der Künstlerseiten: der Inhalt aus dem jeweiligen Künstlerprofil.
 */
export interface ShowcaseTrack {
  id: string;
  /** Verzeichnisnummer im Stil eines Werkverzeichnisses, z. B. „AD-01“ */
  catalogNo: string;
  title: string;
  durationFormatted: string;
  bpm: number;
  genre: string;
  mood: string;
  instrumentation: string;
  description: string;
}

export interface ArtistProfile {
  slug: string;
  name: string;
  roleLine: string;
  tagline: string;
  intro: string;
  layoutId: ArtistLayoutId;
  /** Ebene 1: Markenpaket als JSON (Name, Tonfall, Werte) */
  brand: BrandPackage;
  tracks: ShowcaseTrack[];
}

/** Einheitlicher Eingabe-Querschnitt für alle fünf Gestalt-Kompositionen. */
export interface LayoutContent {
  name: string;
  tagline: string;
  intro: string;
  roleLine: string;
  tracks: ShowcaseTrack[];
  featuredTrackId?: string | null;
}

/** Hilfstyp: Markenwerte als CSS-Custom-Properties-Objekt. */
export function brandValuesToStyle(values: BrandPackageValues): React.CSSProperties {
  return values as unknown as React.CSSProperties;
}
