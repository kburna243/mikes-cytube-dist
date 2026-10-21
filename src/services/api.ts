import {
  DatabaseState,
  Work,
  Chapter,
  Entity,
  Fact,
  PlotThread,
  TimelineEvent,
  Relation,
  ResearchSource,
  Proposal,
  AccessibilitySettings,
  ContinuityConflict,
  DrawerItem,
  ChapterSnapshot,
  IdeaNote,
} from '../types/domain.js';
import { offlineDb } from './offlineDb.js';

const API_BASE = '/api/v1';

async function request<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${endpoint}`, {
    credentials: 'same-origin',
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  });

  // Bei 401: Zur Login-Seite umleiten
  if (res.status === 401) {
    // Nur umleiten wenn wir nicht schon auf der Login-Seite sind
    if (!window.location.pathname.includes('login')) {
      window.location.href = '/login';
    }
  }

  if (!res.ok) {
    let errMessage = 'Der Schreib-Helfer macht gerade Pause. Dein Text ist sicher gespeichert. Versuch es gleich nochmal.';
    if (res.status === 404) {
      errMessage = 'Dieser Abschnitt konnte leider nicht gefunden werden. Bitte versuche es noch einmal.';
    } else if (res.status === 409) {
      errMessage = 'Auf dem Tablet und auf dem Server gibt es zwei Fassungen. Welche möchtest du behalten?';
    } else if (res.status >= 500) {
      errMessage = 'Der Schreib-Helfer macht gerade Pause. Dein Text ist sicher gespeichert. Versuch es gleich nochmal.';
    } else {
      try {
        const errJson = await res.json();
        errMessage = errJson.detail || errJson.message || errMessage;
      } catch {
        // ignore
      }
    }
    throw new Error(errMessage);
  }

  return res.json();
}

export const api = {
  // Work
  getWork: () => request<Work>('/works'),
  updateWork: (patch: Partial<Work>) =>
    request<Work>('/works/current', { method: 'PATCH', body: JSON.stringify(patch) }),

  // Chapters & Offline Sync (TEIL C)
  getChapters: () => request<Chapter[]>('/chapters'),
  getChapter: (id: string) => request<Chapter>(`/chapters/${id}`),

  saveChapter: async (chapter: Partial<Chapter> & { id: string }): Promise<Chapter> => {
    // 1. Immer sofort in IndexedDB zwischenspeichern
    await offlineDb.saveDraft(chapter.id, chapter.title || '', chapter.body || '', chapter.revision || 1);

    // 2. Wenn offline, in Sync-Warteschlange legen
    if (!navigator.onLine) {
      await offlineDb.enqueueSync(chapter.id, chapter.title || '', chapter.body || '', chapter.revision || 1);
      return {
        id: chapter.id,
        work_id: chapter.work_id || 'work-01',
        order: chapter.order || 1,
        title: chapter.title || 'Kapitel',
        summary: chapter.summary || '',
        body: chapter.body || '',
        status: chapter.status || 'draft',
        revision: (chapter.revision || 1) + 1,
        updated_at: Date.now(),
      };
    }

    // 3. Online: An Server senden mit Basis-Version
    try {
      const res = await fetch(`${API_BASE}/chapters/${chapter.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...chapter,
          baseServerVersion: chapter.revision || 1,
        }),
      });

      if (res.status === 409) {
        const conflictData = await res.json();
        await offlineDb.saveConflict(
          chapter.id,
          chapter.title || 'Kapitel',
          chapter.body || '',
          conflictData.body || ''
        );
        offlineDb.setStatus('conflict');
        throw new Error('Auf dem Tablet und auf dem Server gibt es zwei Fassungen. Welche möchtest du behalten?');
      }

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.detail || 'Speichern fehlgeschlagen');
      }

      return res.json();
    } catch (err: any) {
      if (err.message?.includes('zwei Fassungen')) {
        throw err;
      }
      // Bei Netzwerkabbruch während des Sendens -> Sync-Queue
      await offlineDb.enqueueSync(chapter.id, chapter.title || '', chapter.body || '', chapter.revision || 1);
      throw err;
    }
  },

  deleteChapter: (id: string) => request<{ success: boolean }>(`/chapters/${id}`, { method: 'DELETE' }),

  // Entities & Facts
  getEntities: (type?: string) => request<Entity[]>(`/entities${type ? `?type=${type}` : ''}`),
  getEntity: (id: string) => request<Entity>(`/entities/${id}`),
  saveEntity: (entity: Partial<Entity> & { id: string; name: string }) =>
    request<Entity>('/entities', { method: 'POST', body: JSON.stringify(entity) }),
  deleteEntity: (id: string) => request<{ success: boolean }>(`/entities/${id}`, { method: 'DELETE' }),
  getFacts: (entityId?: string) => request<Fact[]>(`/entities/${entityId}/facts`),
  addFact: (entityId: string, fact: Partial<Fact>) =>
    request<Fact>(`/entities/${entityId}/facts`, { method: 'POST', body: JSON.stringify(fact) }),
  deleteFact: (id: string) => request<{ success: boolean }>(`/facts/${id}`, { method: 'DELETE' }),

  // Relations & Graph
  getGraph: () => request<{ nodes: any[]; edges: any[] }>('/graph'),
  saveNodePositions: (positions: Record<string, { x: number; y: number }>) =>
    request<{ success: boolean }>('/graph/positions', { method: 'POST', body: JSON.stringify({ positions }) }),
  getRelations: () => request<Relation[]>('/relations'),
  saveRelation: (rel: Relation) => request<Relation>('/relations', { method: 'POST', body: JSON.stringify(rel) }),
  deleteRelation: (id: string) => request<{ success: boolean }>(`/relations/${id}`, { method: 'DELETE' }),

  // Plot & Timeline
  getThreads: () => request<PlotThread[]>('/plot/threads'),
  saveThread: (thread: PlotThread) =>
    request<PlotThread>('/plot/threads', { method: 'POST', body: JSON.stringify(thread) }),
  getTimeline: () => request<TimelineEvent[]>('/timeline/events'),
  saveTimelineEvent: (event: TimelineEvent) =>
    request<TimelineEvent>('/timeline/events', { method: 'POST', body: JSON.stringify(event) }),

  // Research
  getResearch: () => request<ResearchSource[]>('/research/sources'),
  searchResearch: (query: string) =>
    request<ResearchSource[]>(`/research/search?q=${encodeURIComponent(query)}`),
  saveResearch: (item: ResearchSource) =>
    request<ResearchSource>('/research/sources', { method: 'POST', body: JSON.stringify(item) }),
  importResearchNotes: (notes: Array<{ title: string; content: string; source?: string; citation?: string; tags: string[] }>) =>
    request<{ success: boolean; count: number; items: ResearchSource[] }>('/research/import', {
      method: 'POST',
      body: JSON.stringify({ notes }),
    }),

  // Continuity Check
  checkContinuity: (chapterId: string) =>
    request<{ chapter_id: string; conflicts: ContinuityConflict[] }>(
      `/continuity/check?chapter=${encodeURIComponent(chapterId)}`,
      {
        method: 'POST',
      }
    ),

  // ==========================================
  // TEIL A: Neue dedizierte Server-KI-Endpunkte (/api/ai/...)
  // ==========================================
  aiCopilot: async (message: string, chapterId?: string, projectId?: string) => {
    const res = await fetch('/api/ai/copilot', {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, chapterId, projectId }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || `KI-Fehler (${res.status})`);
    }

    return res.json() as Promise<{ answer: string; model: string; durationMs: number }>;
  },

  aiRecherche: async (query: string, projectId?: string) => {
    const res = await fetch('/api/ai/recherche', {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, projectId }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || `Recherche-Fehler (${res.status})`);
    }
    return res.json() as Promise<{ answer: string; model: string }>;
  },

  aiZusammenfassen: async (chapterId: string, text?: string) => {
    const res = await fetch('/api/ai/zusammenfassen', {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chapterId, text }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || `Zusammenfassungs-Fehler (${res.status})`);
    }
    return res.json() as Promise<{ summary: string; model: string }>;
  },

  aiUmformulieren: async (text: string, style?: string) => {
    const res = await fetch('/api/ai/umformulieren', {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, style }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || `Umformulierungs-Fehler (${res.status})`);
    }
    return res.json() as Promise<{ result: string; model: string }>;
  },

  aiKonsistenzPruefung: async (chapterId: string, projectId?: string) => {
    const res = await fetch('/api/ai/konsistenz-pruefung', {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chapterId, projectId }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || `Konsistenz-Fehler (${res.status})`);
    }
    return res.json() as Promise<{ conflicts: ContinuityConflict[]; aiAnalysis?: string; model?: string }>;
  },

  // 6. Lektorat: Thesaurus
  aiThesaurus: async (word: string, sentence?: string) => {
    const res = await fetch('/api/ai/thesaurus', {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ word, sentence }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || `Thesaurus-Fehler (${res.status})`);
    }
    return res.json() as Promise<{ word: string; sentence: string; synonyms: string[]; model: string }>;
  },

  // 7. Lektorat: Epochen-Checker
  aiEpochenCheck: async (text: string, epoch?: string, chapterId?: string) => {
    const res = await fetch('/api/ai/epochen-check', {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, epoch, chapterId }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || `Epochenprüfungs-Fehler (${res.status})`);
    }
    return res.json() as Promise<{
      epoch: string;
      anachronisms: Array<{ suspect: string; eraNote: string; suggestion: string; quote?: string }>;
      rawAnalysis?: string;
      model: string;
    }>;
  },

  // 8. Lektorat: Fakten- & Kanon-Checker
  aiKanonCheck: async (text: string, chapterId?: string, projectId?: string) => {
    const res = await fetch('/api/ai/kanon-check', {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, chapterId, projectId }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || `Kanonprüfungs-Fehler (${res.status})`);
    }
    return res.json() as Promise<{
      contradictions: Array<{ quote: string; fact: string; entity: string; suggestion: string; explanation: string }>;
      aiAnalysis?: string;
      model: string;
    }>;
  },

  // 9. Lektorat: Sinnlicher-Checker (Show, don't tell)
  aiSinneCheck: async (text: string) => {
    const res = await fetch('/api/ai/sinne-check', {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || `Sinnesprüfungs-Fehler (${res.status})`);
    }
    return res.json() as Promise<{
      scores: Record<string, number>;
      leastUsedSense: string;
      analysis: string;
      suggestion: string;
      exampleSnippet: string;
      model: string;
    }>;
  },


  // Legacy fallback Chat & Proposals
  chat: async (message: string, chapterId?: string) => {
    try {
      // 1. Zuerst den neuen OmniRoute Server-Endpunkt /api/ai/copilot anfragen
      const aiRes = await api.aiCopilot(message, chapterId);
      return {
        answer: aiRes.answer,
        used_context: [aiRes.model],
        tool_calls: [],
        proposals: [],
      };
    } catch (err: any) {
      // 2. Bei 503 (fehlt OMNIR_URL auf dem Server): Fallback auf lokale Vorschlags-Engine
      return request<{
        answer: string;
        used_context: string[];
        tool_calls: Array<{ name: string; args: any }>;
        proposals: Proposal[];
      }>('/assistant/chat', {
        method: 'POST',
        body: JSON.stringify({ message, chapter_id: chapterId }),
      });
    }
  },

  getProposals: () => request<Proposal[]>('/assistant/proposals'),
  acceptProposal: (id: string) =>
    request<{ success: boolean; proposal: Proposal; message: string }>(
      `/assistant/proposals/${id}/accept`,
      { method: 'POST' }
    ),
  rejectProposal: (id: string) =>
    request<{ success: boolean; message: string }>(`/assistant/proposals/${id}/reject`, {
      method: 'POST',
    }),

  // Accessibility & Full Settings
  getAccessibility: () => request<AccessibilitySettings>('/settings/accessibility'),
  updateAccessibility: (settings: Partial<AccessibilitySettings>) =>
    request<AccessibilitySettings>('/settings/accessibility', {
      method: 'PUT',
      body: JSON.stringify(settings),
    }),
  getSettings: () => request<AccessibilitySettings>('/settings'),
  updateSettings: (settings: Partial<AccessibilitySettings>) =>
    request<AccessibilitySettings>('/settings', {
      method: 'PATCH',
      body: JSON.stringify(settings),
    }),

  // Schreibtisch-Schublade (Soft-Delete)
  getDrawer: () => request<DrawerItem[]>('/drawer'),
  restoreDrawerItem: (id: string) =>
    request<{ success: boolean; message: string }>(`/drawer/${id}/restore`, { method: 'POST' }),
  permanentlyDeleteDrawerItem: (id: string) =>
    request<{ success: boolean; message: string }>(`/drawer/${id}/permanent`, { method: 'DELETE' }),

  // Kapitel-Zeitmaschine (Schnappschüsse)
  getSnapshots: (chapterId: string) => request<ChapterSnapshot[]>(`/chapters/${chapterId}/snapshots`),
  createSnapshot: (chapterId: string, label: string, content: string) =>
    request<ChapterSnapshot>(`/chapters/${chapterId}/snapshots`, {
      method: 'POST',
      body: JSON.stringify({ label, content }),
    }),
  restoreSnapshot: (chapterId: string, snapId: string) =>
    request<{ success: boolean; content: string; message: string }>(
      `/chapters/${chapterId}/snapshots/${snapId}/restore`,
      { method: 'POST' }
    ),

  // Autoren-Whitelist (Rechtschreibung)
  getCustomWords: (projectId: string = 'work-01') =>
    request<string[]>(`/projects/${projectId}/custom-words`),
  addCustomWord: (word: string, projectId: string = 'work-01') =>
    request<string[]>(`/projects/${projectId}/custom-words`, {
      method: 'POST',
      body: JSON.stringify({ word }),
    }),
  removeCustomWord: (word: string, projectId: string = 'work-01') =>
    request<string[]>(`/projects/${projectId}/custom-words/${encodeURIComponent(word)}`, {
      method: 'DELETE',
    }),

  // Sprachnotiz-Transkription via qwen-audio-3.0-asr-flash (Anforderung 13)
  transcribeAudio: async (audioBase64: string, mimeType: string = 'audio/webm') => {
    const res = await fetch('/api/ai/transcribe', {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ audioBase64, mimeType }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Fehler bei der Audio-Transkription');
    }
    return res.json() as Promise<{ transcript: string; model: string; success: boolean; hint?: string }>;
  },

  // Export & Datensicherung (TEIL B)
  exportBook: async (format: 'markdown' | 'json') => {
    const res = await fetch(`/api/export?format=${format}`, {
      credentials: 'same-origin',
    });
    return res.blob();
  },
};
