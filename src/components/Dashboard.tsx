import React from 'react';
import {
  BookOpen,
  ArrowRight,
  Search,
  Users,
  Sparkles,
  Feather,
  CheckCircle2,
  Bookmark,
  FileText,
  Clock,
  Compass,
} from 'lucide-react';
import { Work, Chapter, AccessibilitySettings } from '../types/domain.js';

interface DashboardProps {
  work: Work | null;
  chapters: Chapter[];
  currentChapterId: string;
  onSelectChapter: (id: string) => void;
  onNavigateTab: (tab: 'dashboard' | 'editor' | 'world' | 'graph' | 'assistant' | 'research') => void;
  accessibility: AccessibilitySettings;
  onStartTour?: () => void;
  onOpenDrawer?: () => void;
  onJumpToPosition?: (chapterId: string, paragraphIndex: number) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  work,
  chapters,
  currentChapterId,
  onSelectChapter,
  onNavigateTab,
  accessibility,
  onStartTour,
  onOpenDrawer,
  onJumpToPosition,
}) => {
  // Determine active/latest chapter
  const activeChapter =
    chapters.find((c) => c.id === currentChapterId) ||
    chapters[0] || {
      id: 'default',
      order: 1,
      title: 'Kapitel 1: Der Geruch von Mehl und Asche',
      body: '',
      summary: '',
      status: 'draft',
      revision: 1,
      updated_at: Date.now(),
      work_id: work?.id || 'work-1',
    };

  // Word counts calculation
  const chapterWords = activeChapter.body
    ? activeChapter.body.trim().split(/\s+/).filter(Boolean).length
    : 0;

  const totalWords = chapters.reduce((sum, ch) => {
    return sum + (ch.body ? ch.body.trim().split(/\s+/).filter(Boolean).length : 0);
  }, 0);

  // Realistic target words (default 50.000 for standard novel)
  const targetWords = 50000;
  const progressPercent = Math.min(100, Math.round((totalWords / targetWords) * 100));

  const lastPos = accessibility.lastPosition;

  const handleContinueWriting = () => {
    if (lastPos && onJumpToPosition) {
      onJumpToPosition(lastPos.chapterId, lastPos.paragraphIndex);
    } else {
      onSelectChapter(activeChapter.id);
      onNavigateTab('editor');
    }
  };

  const authorName = accessibility.displayName || 'Marion';
  const dailyGoal = accessibility.dailyWordGoal || 200;
  const goalPages = (dailyGoal / 250).toFixed(1);

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 py-8 pb-28 space-y-10 focus:outline-none">
      {/* 1. Header Bereich mit klarer H1-Hierarchie und persönlicher Anrede */}
      <section aria-labelledby="dashboard-heading" className="space-y-2 border-b border-[var(--border-color)] pb-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="text-sm font-semibold tracking-wider uppercase text-[var(--accent)] flex items-center gap-1.5">
              <Feather className="w-4 h-4" aria-hidden="true" />
              Schreibzimmer-Übersicht
            </span>
            <h1
              id="dashboard-heading"
              className="text-3xl sm:text-4xl font-black tracking-tight text-[var(--text-primary)]"
            >
              Guten Tag, {authorName}!
            </h1>
          </div>

          <div className="flex items-center gap-3">
            {onOpenDrawer && (
              <button
                type="button"
                onClick={onOpenDrawer}
                className="touch-target inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--accent)] text-sm font-bold transition-colors shadow-sm"
                aria-label="Schreibtisch-Schublade öffnen"
              >
                <span>Schublade</span>
              </button>
            )}

            {onStartTour && (
              <button
                onClick={onStartTour}
                className="touch-target inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--accent)] text-sm font-bold transition-colors focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
                aria-label="Interaktive Tour starten"
              >
                <Compass className="w-4 h-4 text-[var(--accent)]" aria-hidden="true" />
                <span>Tour starten</span>
              </button>
            )}
          </div>
        </div>
        <p className="text-base sm:text-lg text-[var(--text-secondary)] max-w-3xl leading-relaxed">
          Willkommen zurück an deinem Schreibtisch. Dein heutiges Tagesziel: {dailyGoal} Wörter (ca. {goalPages} Buchseiten).
        </p>
      </section>

      {/* »Wo war ich?« - Prominenter Wiedereinstieg mit goldenem Lesezeichen (Requirement 11) */}
      {lastPos && (
        <section
          aria-labelledby="wo-war-ich-heading"
          className="rounded-3xl border-2 border-amber-400 bg-amber-500/10 p-6 sm:p-7 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-md"
        >
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-amber-400 font-bold text-sm uppercase tracking-wider">
              <Bookmark className="w-5 h-5 fill-amber-400" />
              <span>Goldenes Lesezeichen</span>
            </div>
            <h2 id="wo-war-ich-heading" className="text-2xl font-black text-[var(--text-primary)]">
              Wo war ich?
            </h2>
            <p className="text-base text-[var(--text-secondary)]">
              Zuletzt hast du an <strong className="text-[var(--text-primary)]">{lastPos.chapterTitle}</strong> (Absatz {lastPos.paragraphIndex}) geschrieben.
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              if (onJumpToPosition) {
                onJumpToPosition(lastPos.chapterId, lastPos.paragraphIndex);
              } else {
                onSelectChapter(lastPos.chapterId);
                onNavigateTab('editor');
              }
            }}
            className="min-h-[56px] px-8 py-4 rounded-2xl bg-amber-400 hover:bg-amber-300 text-black font-black text-lg flex items-center justify-center gap-3 shadow-xl transition-transform active:scale-95 shrink-0"
          >
            <Bookmark className="w-6 h-6 fill-black" />
            <span>Genau hier weiterschreiben</span>
            <ArrowRight className="w-5 h-5" />
          </button>
        </section>
      )}

      {/* 2. Aktuelles Buchprojekt (Prominent, ruhig, aufgeräumt) */}
      <section
        aria-labelledby="current-project-heading"
        className="rounded-2xl border-2 border-[var(--border-color)] bg-[var(--bg-surface)] p-6 sm:p-8 space-y-6 shadow-sm"
      >
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
          <div className="space-y-2 flex-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--bg-canvas)] border border-[var(--border-color)] text-xs font-bold text-[var(--accent)]">
              <Bookmark className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Aktuelles Buchprojekt</span>
              {work?.genre && <span className="text-[var(--text-muted)]">• {work.genre}</span>}
            </div>

            <h2
              id="current-project-heading"
              className="text-2xl sm:text-3xl font-extrabold text-[var(--text-primary)] tracking-tight pt-1"
            >
              {work?.title || 'Das Schweigen der Mühlsteine'}
            </h2>

            {work?.synopsis ? (
              <p className="text-base text-[var(--text-secondary)] max-w-2xl leading-relaxed pt-1 line-clamp-2">
                {work.synopsis}
              </p>
            ) : (
              <p className="text-base text-[var(--text-secondary)] max-w-2xl leading-relaxed pt-1">
                Historischer Kriminalroman im preußischen Oderbruch um 1848.
              </p>
            )}
          </div>

          {/* Großer Hauptbutton: Weiterschreiben */}
          <div className="shrink-0 pt-2 md:pt-0">
            <button
              onClick={handleContinueWriting}
              className="touch-target min-h-[56px] w-full sm:w-auto inline-flex items-center justify-center gap-3 px-8 py-4 rounded-2xl bg-[var(--accent)] text-[var(--accent-contrast)] hover:opacity-95 font-black text-lg shadow-md transition-all focus-visible:ring-4 focus-visible:ring-[var(--accent)]"
              aria-label={`Weiterschreiben an ${activeChapter.title}`}
            >
              <BookOpen className="w-6 h-6" aria-hidden="true" />
              <span>Weiterschreiben an Kapitel {activeChapter.order || 1}</span>
              <ArrowRight className="w-5 h-5 ml-1" aria-hidden="true" />
            </button>
          </div>
        </div>

        {/* Kapitel-Metadaten & Sanfter, barrierefreier Fortschritt */}
        <div className="pt-4 border-t border-[var(--border-color)] space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 text-sm font-semibold">
            <div className="flex items-center gap-2 text-[var(--text-secondary)]">
              <FileText className="w-4 h-4 text-[var(--accent)]" aria-hidden="true" />
              <span>
                Aktives Kapitel: <strong className="text-[var(--text-primary)]">{activeChapter.title}</strong>
              </span>
              <span className="text-[var(--text-muted)]">({chapterWords.toLocaleString('de-DE')} Wörter)</span>
            </div>

            <div className="text-[var(--text-secondary)] flex items-center gap-2">
              <Clock className="w-4 h-4 text-[var(--accent)]" aria-hidden="true" />
              <span>
                Gesamtumfang: <strong className="text-[var(--text-primary)]">{totalWords.toLocaleString('de-DE')}</strong> von {targetWords.toLocaleString('de-DE')} Wörtern
              </span>
            </div>
          </div>

          {/* Barrierefreier Fortschrittsbalken ohne Streaks / Gamification */}
          <div className="space-y-1.5" role="region" aria-label="Projektfortschritt">
            <div className="flex justify-between items-center text-xs text-[var(--text-muted)] font-medium">
              <span>Manuskript-Ziel ({progressPercent} %)</span>
              <span>{targetWords.toLocaleString('de-DE')} Wörter Ziel</span>
            </div>
            <div
              className="w-full h-3.5 bg-[var(--bg-canvas)] rounded-full overflow-hidden border border-[var(--border-color)]"
              role="progressbar"
              aria-valuenow={totalWords}
              aria-valuemin={0}
              aria-valuemax={targetWords}
              aria-label={`Fortschritt: ${totalWords.toLocaleString('de-DE')} von ${targetWords.toLocaleString('de-DE')} Wörtern`}
            >
              <div
                className="h-full bg-[var(--accent)] transition-all duration-300 rounded-full"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* 3. Schnellzugriffe (Drei große, gut erkennbare Karten, min. 48x48px Touch-Target) */}
      <section aria-labelledby="quick-actions-heading" className="space-y-4">
        <div className="space-y-1">
          <h2
            id="quick-actions-heading"
            className="text-xl sm:text-2xl font-bold text-[var(--text-primary)] tracking-tight"
          >
            Schnellzugriffe
          </h2>
          <p className="text-sm text-[var(--text-secondary)]">
            Direkter Sprung in die Recherche, die Figurenkartei oder die Co-Pilot-Unterstützung.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
          {/* Karte 1: Neue Recherche notieren */}
          <button
            onClick={() => onNavigateTab('research')}
            className="touch-target group flex flex-col items-start text-left p-6 rounded-2xl border-2 border-[var(--border-color)] bg-[var(--bg-surface)] hover:border-[var(--accent)] transition-all shadow-sm focus-visible:ring-4 focus-visible:ring-[var(--accent)]"
            aria-label="Neue Recherche notieren: Quellenauszüge, Notizen und historische Details festhalten"
          >
            <div className="w-12 h-12 rounded-xl bg-[var(--bg-canvas)] border border-[var(--border-color)] text-[var(--accent)] group-hover:scale-105 transition-transform flex items-center justify-center mb-4">
              <Search className="w-6 h-6" aria-hidden="true" />
            </div>
            <h3 className="text-lg font-bold text-[var(--text-primary)] group-hover:text-[var(--accent)] transition-colors flex items-center gap-1.5 w-full">
              <span>Neue Recherche notieren</span>
              <ArrowRight className="w-4 h-4 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" aria-hidden="true" />
            </h3>
            <p className="text-sm text-[var(--text-secondary)] mt-2 leading-relaxed">
              Historische Belege, Notizen und Quellenzitate festhalten und ordnen.
            </p>
            <span className="mt-4 text-xs font-bold text-[var(--accent)] underline decoration-dotted">
              Zur Recherche &rarr;
            </span>
          </button>

          {/* Karte 2: Figuren & Beziehungen prüfen */}
          <button
            onClick={() => onNavigateTab('world')}
            className="touch-target group flex flex-col items-start text-left p-6 rounded-2xl border-2 border-[var(--border-color)] bg-[var(--bg-surface)] hover:border-[var(--accent)] transition-all shadow-sm focus-visible:ring-4 focus-visible:ring-[var(--accent)]"
            aria-label="Figuren und Beziehungen prüfen: Weltenbuch, Fakten und Kanon aufschlagen"
          >
            <div className="w-12 h-12 rounded-xl bg-[var(--bg-canvas)] border border-[var(--border-color)] text-[var(--accent)] group-hover:scale-105 transition-transform flex items-center justify-center mb-4">
              <Users className="w-6 h-6" aria-hidden="true" />
            </div>
            <h3 className="text-lg font-bold text-[var(--text-primary)] group-hover:text-[var(--accent)] transition-colors flex items-center gap-1.5 w-full">
              <span>Figuren & Beziehungen prüfen</span>
              <ArrowRight className="w-4 h-4 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" aria-hidden="true" />
            </h3>
            <p className="text-sm text-[var(--text-secondary)] mt-2 leading-relaxed">
              Charakter-Profile, kanonische Fakten und Beziehungsgeflechte überblicken.
            </p>
            <span className="mt-4 text-xs font-bold text-[var(--accent)] underline decoration-dotted">
              Zum Weltenbuch &rarr;
            </span>
          </button>

          {/* Karte 3: Co-Pilot fragen */}
          <button
            onClick={() => onNavigateTab('assistant')}
            className="touch-target group flex flex-col items-start text-left p-6 rounded-2xl border-2 border-[var(--border-color)] bg-[var(--bg-surface)] hover:border-[var(--accent)] transition-all shadow-sm focus-visible:ring-4 focus-visible:ring-[var(--accent)]"
            aria-label="Co-Pilot fragen: KI-Assistenz für Dialoge, Motive und Fakten-Prüfung starten"
          >
            <div className="w-12 h-12 rounded-xl bg-[var(--bg-canvas)] border border-[var(--border-color)] text-[var(--accent)] group-hover:scale-105 transition-transform flex items-center justify-center mb-4">
              <Sparkles className="w-6 h-6" aria-hidden="true" />
            </div>
            <h3 className="text-lg font-bold text-[var(--text-primary)] group-hover:text-[var(--accent)] transition-colors flex items-center gap-1.5 w-full">
              <span>Co-Pilot fragen</span>
              <ArrowRight className="w-4 h-4 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" aria-hidden="true" />
            </h3>
            <p className="text-sm text-[var(--text-secondary)] mt-2 leading-relaxed">
              Ideen reflektieren, Motive schärfen oder Szenen dialogisch durchsprechen.
            </p>
            <span className="mt-4 text-xs font-bold text-[var(--accent)] underline decoration-dotted">
              Zum Co-Pilot &rarr;
            </span>
          </button>
        </div>
      </section>

      {/* 4. Letzte Kapitelübersicht zur Orientierung (ruhig und geordnet) */}
      <section aria-labelledby="recent-chapters-heading" className="space-y-4 pt-2">
        <div className="flex items-center justify-between">
          <h2
            id="recent-chapters-heading"
            className="text-xl sm:text-2xl font-bold text-[var(--text-primary)] tracking-tight"
          >
            Kapitel im Manuskript
          </h2>
          <button
            onClick={() => onNavigateTab('editor')}
            className="text-sm font-bold text-[var(--accent)] hover:underline inline-flex items-center gap-1"
          >
            Alle Kapitel im Editor ansehen &rarr;
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {(() => {
            const sortedChapters = [...chapters].sort((a, b) => {
              if (lastPos && a.id === lastPos.chapterId) return -1;
              if (lastPos && b.id === lastPos.chapterId) return 1;
              return a.order - b.order;
            });

            return sortedChapters.map((ch) => {
              const isLastWritten = lastPos && ch.id === lastPos.chapterId;
              const isCurrent = ch.id === activeChapter.id;
              const words = ch.body ? ch.body.trim().split(/\s+/).filter(Boolean).length : 0;
              return (
                <button
                  key={ch.id}
                  onClick={() => {
                    if (isLastWritten && onJumpToPosition) {
                      onJumpToPosition(ch.id, lastPos.paragraphIndex);
                    } else {
                      onSelectChapter(ch.id);
                      onNavigateTab('editor');
                    }
                  }}
                  className={`touch-target flex flex-col text-left p-4 rounded-xl border transition-all ${
                    isLastWritten
                      ? 'border-amber-400 bg-amber-500/10 ring-2 ring-amber-400 shadow-md'
                      : isCurrent
                      ? 'border-[var(--accent)] bg-[var(--bg-surface)] ring-1 ring-[var(--accent)]'
                      : 'border-[var(--border-color)] bg-[var(--bg-surface)] hover:border-[var(--text-muted)]'
                  }`}
                  aria-label={`${ch.title}, ${words} Wörter${isLastWritten ? ', hier hast du zuletzt geschrieben' : isCurrent ? ', aktuell geöffnet' : ''}`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="text-xs font-bold text-[var(--accent)] uppercase tracking-wider">
                      Kapitel {ch.order}
                    </span>
                    {isLastWritten ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-300 bg-amber-400/20 px-2 py-0.5 rounded-full">
                        <Bookmark className="w-3.5 h-3.5 fill-amber-300" aria-hidden="true" />
                        Hier hast du zuletzt geschrieben
                      </span>
                    ) : isCurrent ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[var(--accent)]">
                        <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />
                        Aktiv
                      </span>
                    ) : null}
                  </div>
                  <h3 className="text-base font-bold text-[var(--text-primary)] mt-1 truncate w-full">
                    {ch.title}
                  </h3>
                  <div className="text-xs text-[var(--text-secondary)] mt-2 flex items-center justify-between w-full">
                    <span>{words.toLocaleString('de-DE')} Wörter</span>
                    <span className="capitalize">{ch.status === 'canonical' ? 'Fertig' : ch.status === 'in_review' ? 'Überarbeitung' : 'Entwurf'}</span>
                  </div>
                </button>
              );
            });
          })()}
        </div>
      </section>
    </div>
  );
};
