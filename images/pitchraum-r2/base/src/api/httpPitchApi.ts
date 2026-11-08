import type {
  PitchApi,
  WorkspaceSnapshot,
  PublicLinkPayload,
  CreatePitchLinkInput,
  AddSplitInput,
  AddContractInput,
  RightsPatchInput,
  PublicInquiryInput,
} from './pitchApi';
import { PitchApiError } from './pitchApi';
import type { PipelineStage, PitchLinkRecord } from '../components/pitch-demo/types';
import type { MyPageSettings } from '../shared/brand';

/**
 * Einzige Stelle im gesamten Frontend, die fetch aufruft.
 * Spricht per HTTP mit dem Demo-Server (gleiche Herkunft).
 */
async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(path, {
      credentials: 'same-origin',
      headers: init?.body ? { 'Content-Type': 'application/json' } : undefined,
      ...init,
    });
  } catch {
    throw new PitchApiError(
      0,
      'Der Demo-Server ist gerade nicht erreichbar. Bitte prüfe, ob der Server läuft, und lade die Seite neu.'
    );
  }

  let body: unknown = null;
  try {
    body = await response.json();
  } catch {
    body = null;
  }

  if (!response.ok) {
    const serverMessage =
      body && typeof body === 'object' && 'error' in body && typeof (body as { error?: unknown }).error === 'string'
        ? (body as { error: string }).error
        : null;
    throw new PitchApiError(
      response.status,
      serverMessage ||
        `Etwas ist auf dem Server schiefgelaufen (Fehler ${response.status}). Bitte versuche es erneut.`
    );
  }
  return body as T;
}

export const httpPitchApi: PitchApi = {
  createWorkspace() {
    return request<WorkspaceSnapshot>('/api/demo-workspaces', { method: 'POST' });
  },

  getSnapshot() {
    return request<WorkspaceSnapshot>('/api/state');
  },

  resetWorkspace() {
    return request<WorkspaceSnapshot>('/api/workspace/reset', { method: 'POST' });
  },

  createPitchLink(input: CreatePitchLinkInput) {
    return request<{ snapshot: WorkspaceSnapshot; link: PitchLinkRecord }>('/api/pitch-links', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  },

  updateInquiryStage(inquiryId: string, stage: PipelineStage) {
    return request<WorkspaceSnapshot>(
      `/api/inquiries/${encodeURIComponent(inquiryId)}/stage`,
      { method: 'POST', body: JSON.stringify({ stage }) }
    );
  },

  updateTrackRights(trackId: string, patch: RightsPatchInput) {
    return request<WorkspaceSnapshot>(`/api/tracks/${encodeURIComponent(trackId)}/rights`, {
      method: 'PATCH',
      body: JSON.stringify(patch),
    });
  },

  addSplit(trackId: string, input: AddSplitInput) {
    return request<WorkspaceSnapshot>(`/api/tracks/${encodeURIComponent(trackId)}/splits`, {
      method: 'POST',
      body: JSON.stringify(input),
    });
  },

  addContract(trackId: string, input: AddContractInput) {
    return request<WorkspaceSnapshot>(`/api/tracks/${encodeURIComponent(trackId)}/contracts`, {
      method: 'POST',
      body: JSON.stringify(input),
    });
  },

  getPublicLink(token: string) {
    return request<PublicLinkPayload>(`/api/l/${encodeURIComponent(token)}`);
  },

  markLinkListened(token: string, trackId: string) {
    return request<PublicLinkPayload>(`/api/l/${encodeURIComponent(token)}/listened`, {
      method: 'POST',
      body: JSON.stringify({ trackId }),
    });
  },

  async createPublicInquiry(token: string, input: PublicInquiryInput) {
    await request<{ ok: true }>(`/api/l/${encodeURIComponent(token)}/inquiries`, {
      method: 'POST',
      body: JSON.stringify(input),
    });
  },

  audioSrcFor(token: string, trackId: string) {
    return `/api/l/${encodeURIComponent(token)}/audio/${encodeURIComponent(trackId)}`;
  },

  saveMyPage(settings: MyPageSettings) {
    return request<MyPageSettings>('/api/meine-seite', {
      method: 'PUT',
      body: JSON.stringify(settings),
    });
  },
};
