import React, { useState } from 'react';
import {
  GitFork,
  Calendar,
  Layers,
  List,
  Eye,
  Plus,
  ArrowRight,
  ShieldAlert,
  Volume2,
} from 'lucide-react';
import { Entity, Relation, PlotThread, TimelineEvent, AccessibilitySettings } from '../types/domain.js';
import { speechService } from '../services/speech.js';
import { RelationshipMap } from './Worldbuilding/RelationshipMap.js';

interface GraphAndTimelineProps {
  entities: Entity[];
  relations: Relation[];
  threads: PlotThread[];
  timeline: TimelineEvent[];
  onSaveThread: (thread: PlotThread) => Promise<void>;
  onSaveTimelineEvent: (event: TimelineEvent) => Promise<void>;
  accessibility: AccessibilitySettings;
  onAskCopilot?: (prompt: string, context?: { entityId?: string; threadId?: string; relationId?: string }) => void;
}

export const GraphAndTimeline: React.FC<GraphAndTimelineProps> = ({
  entities,
  relations,
  threads,
  timeline,
  onSaveThread,
  onSaveTimelineEvent,
  accessibility,
  onAskCopilot,
}) => {
  const [subView, setSubView] = useState<'network' | 'plot' | 'timeline'>('network');
  const [useAccessibleList, setUseAccessibleList] = useState(false); // Accessible List / Tree alternative (§8.2)

  // Vorlesen for current active overview
  const readCurrentView = () => {
    if (subView === 'network') {
      const text = `Beziehungsnetzwerk. ${relations
        .map((r) => {
          const s = entities.find((e) => e.id === r.source_id)?.name || r.source_id;
          const t = entities.find((e) => e.id === r.target_id)?.name || r.target_id;
          return `${s} ${r.label} ${t}`;
        })
        .join('. ')}`;
      speechService.speak(text);
    } else if (subView === 'plot') {
      const text = `Handlungsstränge. ${threads
        .map(
          (th) =>
            `Strang ${th.title}. ${th.beats.length} Beats: ${th.beats.map((b) => b.title).join(', ')}`
        )
        .join('. ')}`;
      speechService.speak(text);
    } else {
      const text = `Chronologische Zeitleiste. ${timeline
        .map((ev) => `${ev.in_universe_date}: ${ev.title}. ${ev.description}`)
        .join('. ')}`;
      speechService.speak(text);
    }
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 pb-24">
      {/* Top Controls: Sub-view Switcher & List/Graphic toggle */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-color)]">
          <button
            onClick={() => setSubView('network')}
            className={`touch-target px-3.5 py-2 rounded-xl text-sm font-bold flex items-center gap-1.5 transition-colors ${
              subView === 'network'
                ? 'bg-[var(--accent)] text-[var(--accent-contrast)]'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            <GitFork className="w-4 h-4" /> Beziehungsnetz
          </button>
          <button
            onClick={() => setSubView('plot')}
            className={`touch-target px-3.5 py-2 rounded-xl text-sm font-bold flex items-center gap-1.5 transition-colors ${
              subView === 'plot'
                ? 'bg-[var(--accent)] text-[var(--accent-contrast)]'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            <Layers className="w-4 h-4" /> Plot-Stränge ({threads.length})
          </button>
          <button
            onClick={() => setSubView('timeline')}
            className={`touch-target px-3.5 py-2 rounded-xl text-sm font-bold flex items-center gap-1.5 transition-colors ${
              subView === 'timeline'
                ? 'bg-[var(--accent)] text-[var(--accent-contrast)]'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            <Calendar className="w-4 h-4" /> Zeitleiste ({timeline.length})
          </button>
        </div>

        <div className="flex items-center gap-2">
          {/* TTS Read Aloud */}
          <button
            onClick={readCurrentView}
            className="touch-target px-3 py-2 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-color)] text-[var(--text-primary)] font-bold text-sm flex items-center gap-1.5 hover:border-[var(--accent)]"
            title="Diesen Bereich vorlesen lassen"
          >
            <Volume2 className="w-4 h-4 text-[var(--accent)]" />
            <span className="hidden sm:inline">Vorlesen</span>
          </button>

          {/* Accessible List Mode Toggle (Spec P3: Pflicht-Alternative für Sehbehinderte) */}
          <button
            onClick={() => setUseAccessibleList(!useAccessibleList)}
            className={`touch-target px-3.5 py-2 rounded-xl border text-sm font-bold flex items-center gap-1.5 transition-colors ${
              useAccessibleList
                ? 'bg-[var(--accent)] text-[var(--accent-contrast)] border-[var(--accent)]'
                : 'bg-[var(--bg-surface)] border-[var(--border-color)] text-[var(--text-primary)] hover:border-[var(--accent)]'
            }`}
            title="Zwischen visueller Darstellung und barrierefreier Listenansicht umschalten"
          >
            {useAccessibleList ? <Eye className="w-4 h-4" /> : <List className="w-4 h-4" />}
            <span>{useAccessibleList ? 'Grafische Ansicht' : 'Listenansicht (A11y)'}</span>
          </button>
        </div>
      </div>

      {/* VIEW 1: RELATION NETWORK / DUAL-VIEW RELATIONSHIP MAP */}
      {subView === 'network' && (
        <RelationshipMap
          entities={entities}
          relations={relations}
          threads={threads}
          timeline={timeline}
          accessibility={accessibility}
          onAskCopilot={onAskCopilot}
        />
      )}

      {/* VIEW 2: PLOT THREADS & BEATS (Spec A5: Color + Pattern + Label) */}
      {subView === 'plot' && (
        <div className="space-y-6">
          {threads.map((thread) => (
            <div
              key={thread.id}
              className="rounded-2xl bg-[var(--bg-surface)] border-2 border-[var(--border-color)] p-5 shadow-sm"
            >
              {/* Thread Header with A5 accessible pattern bar */}
              <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[var(--border-color)]">
                <div className="flex items-center gap-3">
                  {/* Visual Pattern Indicator (A5: color + pattern for color-blind accessibility) */}
                  <div
                    className="w-6 h-6 rounded-md border-2 border-white/80 shadow-sm flex items-center justify-center font-bold text-[10px]"
                    style={{ backgroundColor: thread.color }}
                    title={`Muster: ${thread.pattern}`}
                  >
                    {thread.pattern === 'dashed' ? '---' : thread.pattern === 'dotted' ? '•••' : '—'}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-[var(--text-primary)]">
                      {thread.title}
                    </h3>
                    <p className="text-xs text-[var(--text-muted)] mt-0.5">
                      {thread.description} · Muster: <span className="uppercase">{thread.pattern}</span>
                    </p>
                  </div>
                </div>

                <div className="text-xs font-bold px-3 py-1 rounded-lg bg-[var(--bg-canvas)] border border-[var(--border-color)] text-[var(--accent)]">
                  {thread.beats.length} Beats
                </div>
              </div>

              {/* Beats in this thread */}
              <div className="mt-4 space-y-3">
                {thread.beats.map((beat, idx) => (
                  <div
                    key={beat.id}
                    className="p-3.5 rounded-xl bg-[var(--bg-canvas)] border border-[var(--border-color)] flex flex-wrap items-start justify-between gap-3"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-[var(--bg-surface)] text-[var(--text-primary)] border border-[var(--border-color)] font-mono text-xs font-bold flex items-center justify-center">
                          {idx + 1}
                        </span>
                        <span className="font-bold text-base text-[var(--text-primary)]">
                          {beat.title}
                        </span>
                      </div>
                      <p className="text-sm text-[var(--text-secondary)] pl-8">
                        {beat.description}
                      </p>
                    </div>

                    <div className="shrink-0">
                      <span className={`text-xs font-bold px-2 py-1 rounded-md border ${
                        beat.status === 'completed'
                          ? 'bg-[var(--success)]/15 text-[var(--success)] border-[var(--success)]/30'
                          : beat.status === 'drafted'
                          ? 'bg-[var(--warning)]/15 text-[var(--warning)] border-[var(--warning)]/30'
                          : 'bg-[var(--text-muted)]/10 text-[var(--text-muted)] border-[var(--border-color)]'
                      }`}>
                        {beat.status === 'completed' ? 'Abgeschlossen' : beat.status === 'drafted' ? 'Im Entwurf' : 'Geplant'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* VIEW 3: CHRONOLOGICAL TIMELINE */}
      {subView === 'timeline' && (
        <div className="rounded-2xl bg-[var(--bg-surface)] border-2 border-[var(--border-color)] p-6 shadow-sm">
          <h2 className="text-xl font-bold text-[var(--text-primary)] mb-4">
            Chronologie der Ereignisse
          </h2>
          <div className="relative border-l-2 border-[var(--border-color)] ml-4 pl-6 space-y-6">
            {timeline.map((event) => (
              <div key={event.id} className="relative group">
                {/* Node dot on timeline */}
                <div className="absolute -left-[31px] top-1.5 w-4 h-4 rounded-full bg-[var(--accent)] border-2 border-[var(--bg-canvas)] shadow" />
                <div className="p-4 rounded-xl bg-[var(--bg-canvas)] border border-[var(--border-color)] shadow-sm">
                  <div className="text-xs font-bold uppercase tracking-wider text-[var(--accent)] mb-1">
                    {event.in_universe_date}
                  </div>
                  <h3 className="text-lg font-bold text-[var(--text-primary)]">
                    {event.title}
                  </h3>
                  <p className="text-sm text-[var(--text-secondary)] mt-1">
                    {event.description}
                  </p>
                  {event.entity_ids.length > 0 && (
                    <div className="mt-3 flex flex-wrap items-center gap-1.5 text-xs text-[var(--text-muted)]">
                      <span>Beteiligt:</span>
                      {event.entity_ids.map((eid) => {
                        const ent = entities.find((e) => e.id === eid);
                        return (
                          <span
                            key={eid}
                            className="px-2 py-0.5 rounded bg-[var(--bg-surface)] border border-[var(--border-color)] text-[var(--text-secondary)] font-medium"
                          >
                            {ent?.name || eid}
                          </span>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
