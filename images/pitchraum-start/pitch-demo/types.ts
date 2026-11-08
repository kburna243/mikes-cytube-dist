/**
 * Einzige Stelle für den Arbeitstitel des Produkts.
 */
export const PITCH_PRODUCT_NAME = 'Pitchraum';

/**
 * Verbindliche Kennzeichnung des Rechtestatus in der gesamten Demo.
 */
export const RIGHTS_STATUS_LABEL = 'Eigenangabe, ungeprüft' as const;

export type PitchDemoViewId =
  | 'komponist_katalog'
  | 'empfaenger_raum'
  | 'komponist_pipeline_rechte';

export type ComposerSectionId =
  | 'start'
  | 'meine_musik'
  | 'anfragen'
  | 'musik_verschicken';

export interface SplitEntry {
  id: string;
  personName: string;
  role: string;
  sharePercent: number;
  /** Bleibt standardmäßig leer; es werden keine Nummern automatisch erzeugt */
  optionalIdentifier: string;
}

export interface ContractDocumentEntry {
  id: string;
  fileName: string;
  documentType: string;
  uploadedDate: string;
  note: string;
}

export interface TrackRightsFile {
  trackId: string;
  rightsStatus: typeof RIGHTS_STATUS_LABEL;
  /** Leere Felder bleiben leer — keine automatische Generierung */
  isrcCode: string;
  workRegistrationCode: string;
  splits: SplitEntry[];
  contracts: ContractDocumentEntry[];
  notes: string;
}

export interface PitchTrack {
  id: string;
  title: string;
  composer: string;
  durationFormatted: string;
  bpm: number;
  musicalKey: string;
  genre: string;
  mood: string;
  instrumentation: string;
  description: string;
  rightsStatus: typeof RIGHTS_STATUS_LABEL;
}

export interface PitchLinkRecord {
  id: string;
  slug: string;
  recipientName: string;
  productionTitle: string;
  personalNote: string;
  trackIds: string[];
  createdDate: string;
  statusOpened: boolean;
  statusListened: boolean;
  lastListenedTrackId: string | null;
}

export type PipelineStage =
  | 'neu_eingegangen'
  | 'in_abstimmung'
  | 'vorvertrag_offen'
  | 'abgeschlossen';

export interface LicenseInquiryRecord {
  id: string;
  pitchLinkId: string;
  trackId: string;
  trackTitle: string;
  recipientName: string;
  productionTitle: string;
  usageScope: string;
  message: string;
  createdDate: string;
  stage: PipelineStage;
}

export interface PitchDemoState {
  composerName: string;
  studioLabel: string;
  tracks: PitchTrack[];
  rightsFiles: Record<string, TrackRightsFile>;
  pitchLinks: PitchLinkRecord[];
  inquiries: LicenseInquiryRecord[];
}
