import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { createInitialFictionalState } from '../../src/shared/fictionalData';
import { WORKSPACE_MAX_COUNT, WORKSPACE_TTL_MS } from '../../src/shared/limits';
import type { MyPageSettings } from '../../src/shared/brand';
import type {
  PitchDemoState,
  PitchLinkRecord,
} from '../../src/components/pitch-demo/types';

/**
 * Speicher der Demo-Arbeitsbereiche — alles nur im Arbeitsspeicher.
 * Jeder Arbeitsbereich wird nach 24 Stunden gelöscht.
 * Es gibt höchstens 500 Arbeitsbereiche gleichzeitig.
 */
export interface Workspace {
  id: string;
  state: PitchDemoState;
  myPage: MyPageSettings | null;
  createdAt: number;
  /** Laufende Nummer für verständliche Datensatz-IDs (link-011, inq-012, …) */
  recordCounter: number;
}

const workspaces = new Map<string, Workspace>();
/** Öffentliches Link-Token → Arbeitsbereich, damit Empfängerlinks ohne Cookie funktionieren */
const tokenIndex = new Map<string, string>();

export function randomToken(): string {
  return crypto.randomBytes(16).toString('hex');
}

export function newWorkspaceId(): string {
  return crypto.randomBytes(16).toString('hex');
}

function todayISODate(): string {
  return new Date().toISOString().slice(0, 10);
}

function seedStateWithTokens(): PitchDemoState {
  const state = createInitialFictionalState();
  state.pitchLinks = state.pitchLinks.map((link) => ({ ...link, token: randomToken() }));
  return state;
}

/** Entfernt abgelaufene Arbeitsbereiche und deren Tokens. Läuft zusätzlich per Intervall. */
export function sweepExpiredWorkspaces(now: number = Date.now()): void {
  for (const [id, ws] of workspaces) {
    if (now - ws.createdAt > WORKSPACE_TTL_MS) {
      for (const link of ws.state.pitchLinks) tokenIndex.delete(link.token);
      workspaces.delete(id);
    }
  }
}

let sweepTimer: ReturnType<typeof setInterval> | null = null;
export function startSweeper(): void {
  if (sweepTimer) return;
  sweepTimer = setInterval(() => sweepExpiredWorkspaces(), 10 * 60 * 1000);
  if (typeof sweepTimer.unref === 'function') sweepTimer.unref();
}

export type CreateWorkspaceResult =
  | { ok: true; workspace: Workspace }
  | { ok: false; message: string };

export function createWorkspace(): CreateWorkspaceResult {
  sweepExpiredWorkspaces();
  if (workspaces.size >= WORKSPACE_MAX_COUNT) {
    return {
      ok: false,
      message:
        'Im Moment sind alle 500 Demo-Arbeitsbereiche belegt. Bitte versuche es später erneut — belegte Bereiche werden nach 24 Stunden automatisch frei.',
    };
  }
  const workspace: Workspace = {
    id: newWorkspaceId(),
    state: seedStateWithTokens(),
    myPage: null,
    createdAt: Date.now(),
    recordCounter: 10,
  };
  workspaces.set(workspace.id, workspace);
  for (const link of workspace.state.pitchLinks) {
    tokenIndex.set(link.token, workspace.id);
  }
  return { ok: true, workspace };
}

/** Der Server leitet den Arbeitsbereich ausschließlich aus der Cookie-ID ab. */
export function getWorkspace(id: string | undefined): Workspace | null {
  if (!id) return null;
  const ws = workspaces.get(id) || null;
  if (!ws) return null;
  if (Date.now() - ws.createdAt > WORKSPACE_TTL_MS) {
    sweepExpiredWorkspaces();
    return null;
  }
  return ws;
}

export function resetWorkspace(workspace: Workspace): Workspace {
  for (const link of workspace.state.pitchLinks) tokenIndex.delete(link.token);
  workspace.state = seedStateWithTokens();
  workspace.myPage = null;
  workspace.recordCounter = 10;
  for (const link of workspace.state.pitchLinks) tokenIndex.set(link.token, workspace.id);
  return workspace;
}

export function nextRecordId(workspace: Workspace, prefix: string): string {
  workspace.recordCounter += 1;
  return `${prefix}-${String(workspace.recordCounter).padStart(3, '0')}`;
}

export function findWorkspaceByLinkToken(token: string): Workspace | null {
  const wsId = tokenIndex.get(token);
  if (!wsId) return null;
  return getWorkspace(wsId);
}

export function findLinkByToken(
  workspace: Workspace,
  token: string
): PitchLinkRecord | null {
  return workspace.state.pitchLinks.find((l) => l.token === token) || null;
}

export function addCreatedLink(workspace: Workspace, link: PitchLinkRecord): void {
  workspace.state = { ...workspace.state, pitchLinks: [link, ...workspace.state.pitchLinks] };
  tokenIndex.set(link.token, workspace.id);
}

export function currentDateLabel(): string {
  return todayISODate();
}

/* ------------------------------------------------------------------ */
/* Audio: nicht erfundene Dateien, nur was in demo-assets/audio liegt */
/* ------------------------------------------------------------------ */

const AUDIO_EXTENSIONS = ['.mp3', '.wav', '.m4a', '.ogg', '.flac'] as const;
const audioDirectory = path.resolve(process.cwd(), 'demo-assets', 'audio');
const audioDirExists = fs.existsSync(audioDirectory);

/** Liefert den Dateipfad, wenn es zur Track-ID eine passende Audiodatei gibt. */
export function findAudioFileForTrack(trackId: string): string | null {
  if (!audioDirExists) return null;
  // trackId kommt nur aus den eigenen Arbeitsbereich-Daten (trk-101 …), nie frei formbar
  for (const ext of AUDIO_EXTENSIONS) {
    const candidate = path.join(audioDirectory, `${trackId}${ext}`);
    if (fs.existsSync(candidate)) return candidate;
  }
  return null;
}

export function audioAvailabilityForTracks(trackIds: string[]): Record<string, boolean> {
  const result: Record<string, boolean> = {};
  for (const id of trackIds) result[id] = findAudioFileForTrack(id) !== null;
  return result;
}
