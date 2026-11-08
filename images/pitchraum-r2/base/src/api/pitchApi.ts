import type {
  PipelineStage,
  PitchDemoState,
  PitchLinkRecord,
  TrackRightsFile,
  PitchTrack,
} from '../components/pitch-demo/types';
import type { MyPageSettings } from '../shared/brand';

/**
 * Vollständiger Datenstand eines Demo-Arbeitsbereichs (Komponisten-Sicht).
 */
export interface WorkspaceSnapshot {
  state: PitchDemoState;
  /** Einstellungen für „Meine Seite“, null solange der Wizard nicht durchlaufen wurde */
  myPage: MyPageSettings | null;
  /** Pro Track: gibt es in demo-assets/audio eine Datei? */
  audioAvailability: Record<string, boolean>;
}

/**
 * Öffentliche Daten genau eines Empfängerlinks (ohne Arbeitsbereich-Cookie).
 */
export interface PublicLinkPayload {
  composerName: string;
  studioLabel: string;
  link: PitchLinkRecord;
  /** Nur die Tracks dieses Links */
  tracks: PitchTrack[];
  /** Rechteangaben nur zu diesen Tracks */
  rightsFiles: Record<string, TrackRightsFile>;
  audioAvailability: Record<string, boolean>;
}

export interface CreatePitchLinkInput {
  recipientName: string;
  productionTitle: string;
  personalNote: string;
  trackIds: string[];
}

export interface AddSplitInput {
  personName: string;
  role: string;
  sharePercent: number;
  optionalIdentifier?: string;
}

export interface AddContractInput {
  fileName: string;
  documentType: string;
  note: string;
}

export interface RightsPatchInput {
  isrcCode?: string;
  workRegistrationCode?: string;
  notes?: string;
}

export interface PublicInquiryInput {
  trackId: string;
  recipientName: string;
  productionTitle: string;
  usageScope: string;
  message: string;
}

/**
 * Fehler der Datenschicht mit verständlicher deutscher Meldung für die Oberfläche.
 */
export class PitchApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.name = 'PitchApiError';
    this.status = status;
  }
}

/**
 * TypeScript-Schnittstelle für alle Datenzugriffe der Demo.
 * Keine Komponente ruft fetch direkt auf — alles läuft über diese Schnittstelle.
 */
export interface PitchApi {
  /** Legt einen neuen Demo-Arbeitsbereich an (setzt das Cookie) und liefert den Stand. */
  createWorkspace(): Promise<WorkspaceSnapshot>;
  /** Liest den Stand des Arbeitsbereichs aus dem Cookie. 401, wenn es keinen gibt. */
  getSnapshot(): Promise<WorkspaceSnapshot>;
  /** Setzt den aktuellen Arbeitsbereich auf die Ausgangs-Fantasiedaten zurück. */
  resetWorkspace(): Promise<WorkspaceSnapshot>;

  createPitchLink(input: CreatePitchLinkInput): Promise<{ snapshot: WorkspaceSnapshot; link: PitchLinkRecord }>;
  updateInquiryStage(inquiryId: string, stage: PipelineStage): Promise<WorkspaceSnapshot>;
  updateTrackRights(trackId: string, patch: RightsPatchInput): Promise<WorkspaceSnapshot>;
  addSplit(trackId: string, input: AddSplitInput): Promise<WorkspaceSnapshot>;
  addContract(trackId: string, input: AddContractInput): Promise<WorkspaceSnapshot>;

  /** Öffentlicher Empfängerlink — zählt beim Abruf als „geöffnet“. */
  getPublicLink(token: string): Promise<PublicLinkPayload>;
  /** Meldet eine Wiedergabe über den Empfängerlink. */
  markLinkListened(token: string, trackId: string): Promise<PublicLinkPayload>;
  /** Sendet eine Anfrage über den Empfängerlink. */
  createPublicInquiry(token: string, input: PublicInquiryInput): Promise<void>;
  /** Adresse der Hörprobe zu einem Track innerhalb eines Links. */
  audioSrcFor(token: string, trackId: string): string;

  /** Einstellungen „Meine Seite“ speichern. */
  saveMyPage(settings: MyPageSettings): Promise<MyPageSettings>;
}
