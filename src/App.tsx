/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Header } from './components/Header.js';
import { BottomNav } from './components/BottomNav.js';
import { ChapterEditor } from './components/ChapterEditor.js';
import { WorldDatabase } from './components/WorldDatabase.js';
import { GraphAndTimeline } from './components/GraphAndTimeline.js';
import { AssistantChat } from './components/AssistantChat.js';
import { ResearchHub } from './components/ResearchHub.js';
import { AccessibilityModal } from './components/AccessibilityModal.js';
import { ExportModal } from './components/ExportModal.js';
import { AppTour } from './components/Tour/AppTour.js';
import { Dashboard } from './components/Dashboard.js';
import { ConflictModal } from './components/Editor/ConflictModal.js';
import { SchubladeModal } from './components/SchubladeModal.js';
import { LoginPage } from './components/LoginPage.js';
import { offlineDb, SyncConflict } from './services/offlineDb.js';
import { api } from './services/api.js';
import {
  Chapter,
  Entity,
  Fact,
  PlotThread,
  TimelineEvent,
  Relation,
  ResearchSource,
  Proposal,
  AccessibilitySettings,
  Work,
} from './types/domain.js';

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null); // null = wird geprüft
  const [currentTab, setCurrentTab] = useState<'dashboard' | 'editor' | 'world' | 'graph' | 'assistant' | 'research'>('dashboard');
  const [work, setWork] = useState<Work | null>(null);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [currentChapterId, setCurrentChapterId] = useState<string>('');
  const [entities, setEntities] = useState<Entity[]>([]);
  const [facts, setFacts] = useState<Fact[]>([]);
  const [relations, setRelations] = useState<Relation[]>([]);
  const [threads, setThreads] = useState<PlotThread[]>([]);
  const [timeline, setTimeline] = useState<TimelineEvent[]>([]);
  const [research, setResearch] = useState<ResearchSource[]>([]);
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [accessibility, setAccessibility] = useState<AccessibilitySettings>({
    fontSizePx: 22,
    theme: 'dark-high',
    lineHeight: 1.7,
    readingSpeed: 1.0,
    autoReadResponses: false,
    reducedMotion: false,
    simplifiedView: false,
    bigButtons: true,
  });

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isTourOpen, setIsTourOpen] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [activeConflict, setActiveConflict] = useState<SyncConflict | null>(null);
  const [targetParagraphIndex, setTargetParagraphIndex] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Offline-Sync Status & Konflikt-Überwachung
  useEffect(() => {
    return offlineDb.onStatusChange(async (status) => {
      if (status === 'conflict') {
        const conf = await offlineDb.getConflict(currentChapterId);
        if (conf) setActiveConflict(conf);
      } else if (status === 'saved') {
        setActiveConflict(null);
      }
    });
  }, [currentChapterId]);

  const refreshAllData = async () => {
    try {
      const [chs, ents, fts, res] = await Promise.all([
        api.getChapters(),
        api.getEntities(),
        api.getFacts(),
        api.getResearch(),
      ]);
      setChapters(chs);
      setEntities(ents);
      setFacts(fts);
      setResearch(res);
    } catch (e) {
      console.warn('Could not refresh data:', e);
    }
  };

  const handleJumpToPosition = (chapterId: string, paragraphIndex: number) => {
    setCurrentChapterId(chapterId);
    setTargetParagraphIndex(paragraphIndex);
    setCurrentTab('editor');
  };

  // Apply theme and font size to document root
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', accessibility.theme);
    document.documentElement.style.setProperty('--base-font-size', `${accessibility.fontSizePx}px`);
    document.documentElement.style.setProperty('--line-height-ratio', `${accessibility.lineHeight}`);
  }, [accessibility]);

  // Load initial data and check for first-time tour trigger
  useEffect(() => {
    async function checkAuth() {
      try {
        const res = await fetch('/api/auth/me', { credentials: 'same-origin' });
        if (res.ok) {
          setIsLoggedIn(true);
        } else {
          setIsLoggedIn(false);
        }
      } catch {
        setIsLoggedIn(false);
      }
    }

    checkAuth();
  }, []);

  // Load data after login
  useEffect(() => {
    if (isLoggedIn !== true) return;

    async function loadData() {
      try {
        const [w, chs, ents, fts, rels, ths, tl, res, props, a11y] = await Promise.all([
          api.getWork(),
          api.getChapters(),
          api.getEntities(),
          api.getFacts(),
          api.getRelations(),
          api.getThreads(),
          api.getTimeline(),
          api.getResearch(),
          api.getProposals(),
          api.getAccessibility(),
        ]);

        setWork(w);
        setChapters(chs);
        if (chs.length > 0) setCurrentChapterId(chs[0].id);
        setEntities(ents);
        setFacts(fts);
        setRelations(rels);
        setThreads(ths);
        setTimeline(tl);
        setResearch(res);
        setProposals(props);
        if (a11y) setAccessibility(a11y);

        // Check if tour was already completed
        try {
          const completed = localStorage.getItem('tourCompleted');
          if (completed !== 'true') {
            setTimeout(() => {
              setIsTourOpen(true);
            }, 600);
          }
        } catch {
          // ignore
        }
      } catch (err) {
        console.error('Failed to load initial data from server:', err);
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
  }, [isLoggedIn]);

  // Chapter operations
  const handleSaveChapter = async (patch: Partial<Chapter> & { id: string }) => {
    const updated = await api.saveChapter(patch);
    setChapters((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
  };

  const handleCreateChapter = async () => {
    const nextOrder = chapters.length + 1;
    const newCh = await api.saveChapter({
      id: `ch-${Date.now().toString(36)}`,
      title: `Kapitel ${nextOrder}: Neuer Abschnitt`,
      body: '',
      order: nextOrder,
      summary: '',
      status: 'draft',
    });
    setChapters((prev) => [...prev, newCh]);
    setCurrentChapterId(newCh.id);
  };

  const handleDeleteChapter = async (id: string) => {
    await api.deleteChapter(id);
    setChapters((prev) => prev.filter((c) => c.id !== id));
    if (currentChapterId === id) {
      const remaining = chapters.filter((c) => c.id !== id);
      if (remaining.length > 0) setCurrentChapterId(remaining[0].id);
    }
  };

  // Entity & Facts operations
  const handleSaveEntity = async (entity: Partial<Entity> & { id: string; name: string }) => {
    const updated = await api.saveEntity(entity);
    setEntities((prev) => {
      const idx = prev.findIndex((e) => e.id === updated.id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = updated;
        return copy;
      }
      return [...prev, updated];
    });
  };

  const handleDeleteEntity = async (id: string) => {
    await api.deleteEntity(id);
    setEntities((prev) => prev.filter((e) => e.id !== id));
    setFacts((prev) => prev.filter((f) => f.entity_id !== id));
  };

  const handleAddFact = async (entityId: string, fact: Partial<Fact>) => {
    const created = await api.addFact(entityId, fact);
    setFacts((prev) => [...prev, created]);
  };

  const handleDeleteFact = async (id: string) => {
    await api.deleteFact(id);
    setFacts((prev) => prev.filter((f) => f.id !== id));
  };

  // Threads & Timeline operations
  const handleSaveThread = async (thread: PlotThread) => {
    const updated = await api.saveThread(thread);
    setThreads((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
  };

  const handleSaveTimelineEvent = async (event: TimelineEvent) => {
    const updated = await api.saveTimelineEvent(event);
    setTimeline((prev) => {
      const idx = prev.findIndex((e) => e.id === updated.id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = updated;
        return copy;
      }
      return [...prev, updated];
    });
  };

  const handleSaveResearch = async (item: ResearchSource) => {
    const saved = await api.saveResearch(item);
    setResearch((prev) => [saved, ...prev.filter((r) => r.id !== saved.id)]);
  };

  const handleImportResearch = async (items: ResearchSource[]) => {
    try {
      const res = await api.importResearchNotes(
        items.map((i) => ({
          title: i.title,
          content: i.content,
          citation: i.citation,
          tags: i.tags,
        }))
      );
      if (res.items && res.items.length > 0) {
        setResearch((prev) => {
          const newIds = new Set(res.items.map((x) => x.id));
          return [...res.items, ...prev.filter((r) => !newIds.has(r.id))];
        });
        return;
      }
    } catch (e) {
      console.warn('[App] Bulk-Import API-Fehler, wechsle zu Einzelspeicherung:', e);
    }

    for (const item of items) {
      await handleSaveResearch(item);
    }
  };

  // Proposal operations (P4 Human-in-the-Loop)
  const handleAcceptProposal = async (id: string) => {
    const res = await api.acceptProposal(id);
    if (res.success) {
      setProposals((prev) =>
        prev.map((p) => (p.id === id ? { ...p, status: 'accepted' as const } : p))
      );
      // Refresh facts & chapters to reflect accepted changes
      const [newFacts, newChapters, newThreads] = await Promise.all([
        api.getFacts(),
        api.getChapters(),
        api.getThreads(),
      ]);
      setFacts(newFacts);
      setChapters(newChapters);
      setThreads(newThreads);
    }
  };

  const handleRejectProposal = async (id: string) => {
    await api.rejectProposal(id);
    setProposals((prev) =>
      prev.map((p) => (p.id === id ? { ...p, status: 'rejected' as const } : p))
    );
  };

  // Accessibility update
  const handleUpdateAccessibility = async (patch: Partial<AccessibilitySettings>) => {
    const next = { ...accessibility, ...patch };
    setAccessibility(next);
    try {
      await api.updateAccessibility(patch);
    } catch {
      // ignore
    }
  };

  // Co-Pilot context jumper
  const handleOpenAssistantForChapter = (chapterId: string, prompt?: string) => {
    setCurrentChapterId(chapterId);
    setCurrentTab('assistant');
  };

  const handleOpenAssistantForEntity = (entityId: string) => {
    setCurrentTab('assistant');
  };

  const pendingCount = proposals.filter((p) => p.status === 'pending').length;

  // Auth-Prüfung läuft noch
  if (isLoggedIn === null) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--bg-canvas)] text-[var(--text-primary)]">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-[var(--accent)] text-[var(--accent-contrast)] mx-auto flex items-center justify-center font-bold text-xl animate-pulse">
            F
          </div>
          <div className="text-xl font-bold tracking-tight">Federführer lädt…</div>
          <div className="text-sm text-[var(--text-muted)]">Local-First Schreibstudio mit LLM-Co-Pilot</div>
        </div>
      </div>
    );
  }

  // Nicht eingeloggt - Login-Seite anzeigen
  if (!isLoggedIn) {
    return <LoginPage onLoginSuccess={() => setIsLoggedIn(true)} />;
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--bg-canvas)] text-[var(--text-primary)]">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-[var(--accent)] text-[var(--accent-contrast)] mx-auto flex items-center justify-center font-bold text-xl animate-pulse">
            F
          </div>
          <div className="text-xl font-bold tracking-tight">Federführer lädt…</div>
          <div className="text-sm text-[var(--text-muted)]">Local-First Schreibstudio mit LLM-Co-Pilot</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[var(--bg-canvas)] text-[var(--text-primary)] transition-colors">
      {/* Top Header Contract */}
      <Header
        currentTab={currentTab}
        onTabChange={(tab) => setCurrentTab(tab as any)}
        accessibility={accessibility}
        onUpdateAccessibility={handleUpdateAccessibility}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenExport={() => setIsExportOpen(true)}
        onStartTour={() => setIsTourOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 w-full" id="main-content">
        {currentTab === 'dashboard' && (
          <Dashboard
            work={work}
            chapters={chapters}
            currentChapterId={currentChapterId}
            onSelectChapter={setCurrentChapterId}
            onNavigateTab={(tab) => setCurrentTab(tab as any)}
            accessibility={accessibility}
            onStartTour={() => setIsTourOpen(true)}
            onOpenDrawer={() => setIsDrawerOpen(true)}
            onJumpToPosition={handleJumpToPosition}
          />
        )}

        {currentTab === 'editor' && (
          <ChapterEditor
            chapters={chapters}
            currentChapterId={currentChapterId}
            onSelectChapter={setCurrentChapterId}
            onSaveChapter={handleSaveChapter}
            onCreateChapter={handleCreateChapter}
            onDeleteChapter={handleDeleteChapter}
            accessibility={accessibility}
            onOpenAssistantForChapter={handleOpenAssistantForChapter}
            projectEpoch={work?.genre ? `${work.genre} (1928, Weimarer Republik)` : '1928, Weimarer Republik / Schwarzwald'}
            targetParagraphIndex={targetParagraphIndex}
            work={work}
          />
        )}

        {currentTab === 'world' && (
          <WorldDatabase
            entities={entities}
            facts={facts}
            onSaveEntity={handleSaveEntity}
            onDeleteEntity={handleDeleteEntity}
            onAddFact={handleAddFact}
            onDeleteFact={handleDeleteFact}
            accessibility={accessibility}
            onOpenAssistantForEntity={handleOpenAssistantForEntity}
          />
        )}

        {currentTab === 'graph' && (
          <GraphAndTimeline
            entities={entities}
            relations={relations}
            threads={threads}
            timeline={timeline}
            onSaveThread={handleSaveThread}
            onSaveTimelineEvent={handleSaveTimelineEvent}
            accessibility={accessibility}
            onAskCopilot={(prompt, context) => {
              if (context?.entityId) {
                handleOpenAssistantForEntity(context.entityId);
              } else {
                setCurrentTab('assistant');
              }
            }}
          />
        )}

        {currentTab === 'assistant' && (
          <AssistantChat
            proposals={proposals}
            onAcceptProposal={handleAcceptProposal}
            onRejectProposal={handleRejectProposal}
            chapters={chapters}
            entities={entities}
            currentChapterId={currentChapterId}
            accessibility={accessibility}
          />
        )}

        {currentTab === 'research' && (
          <ResearchHub
            research={research}
            onSaveResearch={handleSaveResearch}
            onImportNotes={handleImportResearch}
            accessibility={accessibility}
          />
        )}
      </main>

      {/* Mobile Bottom Navigation (48px Touch Targets) */}
      <BottomNav
        currentTab={currentTab}
        onTabChange={(tab) => setCurrentTab(tab as any)}
        pendingProposalsCount={pendingCount}
      />

      {/* Interactive Onboarding Tour Modal */}
      <AppTour
        isOpen={isTourOpen}
        onClose={() => setIsTourOpen(false)}
        onNavigateTab={(tab) => setCurrentTab(tab)}
        currentTab={currentTab}
      />

      {/* Settings Modal */}
      <AccessibilityModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={accessibility}
        onUpdate={handleUpdateAccessibility}
      />

      {/* Export & Backup Modal */}
      <ExportModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        workTitle={work?.title || 'Federführer_Roman'}
      />

      {/* Schreibtisch-Schublade Modal (Requirement 10) */}
      <SchubladeModal
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        onItemRestored={refreshAllData}
      />

      {/* Offline-Sync Konflikt-Dialog (Requirement 4) */}
      {activeConflict && (
        <ConflictModal
          conflict={activeConflict}
          onResolved={(chosenContent) => {
            setActiveConflict(null);
            setChapters((prev) =>
              prev.map((c) =>
                c.id === activeConflict.chapterId ? { ...c, body: chosenContent } : c
              )
            );
          }}
          onKeepBoth={async (tabletContent) => {
            setActiveConflict(null);
            const nextOrder = chapters.length + 1;
            await api.saveChapter({
              id: `ch-${Date.now().toString(36)}`,
              title: `${activeConflict.chapterTitle} (Tablet-Fassung)`,
              body: tabletContent,
              order: nextOrder,
              status: 'draft',
            });
            refreshAllData();
          }}
        />
      )}
    </div>
  );
}
