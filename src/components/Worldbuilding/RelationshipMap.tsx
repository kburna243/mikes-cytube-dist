import React, { useState } from 'react';
import {
  List,
  Eye,
  ArrowRight,
  Sparkles,
  User,
  MapPin,
  Shield,
  Package,
  Layers,
  ChevronRight,
  Info,
  X,
  Volume2,
} from 'lucide-react';
import { Entity, Relation, PlotThread, TimelineEvent, AccessibilitySettings } from '../../types/domain.js';
import { speechService } from '../../services/speech.js';
import { GraphView } from './GraphView.js';

export interface RelationshipMapProps {
  entities: Entity[];
  relations: Relation[];
  threads?: PlotThread[];
  timeline?: TimelineEvent[];
  accessibility: AccessibilitySettings;
  onAskCopilot?: (prompt: string, context?: { entityId?: string; threadId?: string; relationId?: string }) => void;
}

export const RelationshipMap: React.FC<RelationshipMapProps> = ({
  entities,
  relations,
  threads = [],
  timeline = [],
  accessibility,
  onAskCopilot,
}) => {
  // 1. Toggle-Steuerung: SegmentedControl ("Listenansicht (Barrierefrei)" als Standard)
  const [activeView, setActiveView] = useState<'list' | 'graph'>('list');

  // Detail Modal / Side-Panel State
  const [selectedEntity, setSelectedEntity] = useState<Entity | null>(null);
  const [selectedRelation, setSelectedRelation] = useState<Relation | null>(null);
  const [selectedThread, setSelectedThread] = useState<PlotThread | null>(null);
  const [selectedTimelineEvent, setSelectedTimelineEvent] = useState<TimelineEvent | null>(null);

  // Filter nach Entity-Typ (optional für bessere Übersicht)
  const [filterType, setFilterType] = useState<string>('all');

  const filteredEntities = entities.filter((e) => {
    if (filterType === 'all') return true;
    return e.type === filterType;
  });

  const getEntityIcon = (type: string) => {
    switch (type) {
      case 'character':
        return <User className="w-4 h-4 text-[var(--accent)]" aria-hidden="true" />;
      case 'location':
        return <MapPin className="w-4 h-4 text-emerald-400" aria-hidden="true" />;
      case 'faction':
        return <Shield className="w-4 h-4 text-sky-400" aria-hidden="true" />;
      case 'item':
        return <Package className="w-4 h-4 text-amber-400" aria-hidden="true" />;
      default:
        return <User className="w-4 h-4 text-[var(--accent)]" aria-hidden="true" />;
    }
  };

  const getEntityTypeName = (type: string) => {
    switch (type) {
      case 'character':
        return 'Figur / Charakter';
      case 'location':
        return 'Schauplatz / Ort';
      case 'faction':
        return 'Fraktion / Gruppe';
      case 'item':
        return 'Gegenstand / Artefakt';
      default:
        return 'Entität';
    }
  };

  const closeDetail = () => {
    setSelectedEntity(null);
    setSelectedRelation(null);
    setSelectedThread(null);
    setSelectedTimelineEvent(null);
  };

  const handleAskCopilot = (subject: string, details?: string) => {
    if (onAskCopilot) {
      const prompt = `Welche Rolle und Motive hat "${subject}" im Manuskript und wie passt dies zu den bisherigen Fakten? ${details ? `Zusatzkontext: ${details}` : ''}`;
      onAskCopilot(prompt, {
        entityId: selectedEntity?.id,
        threadId: selectedThread?.id,
        relationId: selectedRelation?.id,
      });
    }
  };

  const readOverviewAloud = () => {
    const text = `Beziehungsübersicht. ${entities.length} Figuren und Schauplätze erfasst, mit ${relations.length} verknüpften Beziehungen.`;
    speechService.speak(text);
  };

  return (
    <div className="w-full space-y-6">
      {/* 1. Toggle-Steuerung: SegmentedControl */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-[var(--bg-surface)] border-2 border-[var(--border-color)]">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-[var(--text-primary)] tracking-tight">
            Plot & Beziehungen
          </h2>
          <p className="text-sm text-[var(--text-secondary)] mt-0.5">
            Übersicht über Figurengeflechte, Motive und Handlungsstränge.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={readOverviewAloud}
            className="touch-target px-3.5 py-2.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-canvas)] text-[var(--text-primary)] hover:border-[var(--accent)] text-sm font-bold flex items-center gap-2 transition-colors focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
            aria-label="Beziehungsübersicht vorlesen lassen"
          >
            <Volume2 className="w-4 h-4 text-[var(--accent)]" aria-hidden="true" />
            <span className="hidden md:inline">Vorlesen</span>
          </button>

          {/* Segmented Control */}
          <div
            role="radiogroup"
            aria-label="Ansichtsmodus für Plot und Beziehungen"
            className="inline-flex p-1 rounded-xl bg-[var(--bg-canvas)] border-2 border-[var(--border-color)]"
          >
            <button
              role="radio"
              aria-checked={activeView === 'list'}
              onClick={() => setActiveView('list')}
              className={`touch-target px-4 py-2.5 rounded-lg text-sm font-black flex items-center gap-2 transition-all focus-visible:ring-2 focus-visible:ring-[var(--accent)] ${
                activeView === 'list'
                  ? 'bg-[var(--accent)] text-[var(--accent-contrast)] shadow-sm'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              <List className="w-4 h-4" aria-hidden="true" />
              <span>Listenansicht (Barrierefrei)</span>
            </button>

            <button
              role="radio"
              aria-checked={activeView === 'graph'}
              onClick={() => setActiveView('graph')}
              className={`touch-target px-4 py-2.5 rounded-lg text-sm font-black flex items-center gap-2 transition-all focus-visible:ring-2 focus-visible:ring-[var(--accent)] ${
                activeView === 'graph'
                  ? 'bg-[var(--accent)] text-[var(--accent-contrast)] shadow-sm'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              <Eye className="w-4 h-4" aria-hidden="true" />
              <span>Grafische Ansicht</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Listenansicht (Priorität für A11y) */}
      {activeView === 'list' && (
        <section aria-label="Barrierefreie Beziehungsliste" className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
            <span className="text-[var(--text-secondary)] font-medium">
              Tastatur-Navigation mit <kbd className="px-1.5 py-0.5 rounded bg-[var(--bg-surface)] border border-[var(--border-color)] text-xs font-mono font-bold">TAB</kbd> und <kbd className="px-1.5 py-0.5 rounded bg-[var(--bg-surface)] border border-[var(--border-color)] text-xs font-mono font-bold">ENTER</kbd> zum Aufklappen.
            </span>

            {/* Schnellfilter */}
            <div className="flex items-center gap-2" role="group" aria-label="Entitäts-Filter">
              <span className="text-xs font-bold text-[var(--text-muted)]">Filtern:</span>
              {['all', 'character', 'location', 'faction'].map((type) => (
                <button
                  key={type}
                  onClick={() => setFilterType(type)}
                  className={`text-xs px-2.5 py-1 rounded-md font-bold transition-colors border ${
                    filterType === type
                      ? 'bg-[var(--accent)] text-[var(--accent-contrast)] border-[var(--accent)]'
                      : 'bg-[var(--bg-surface)] text-[var(--text-secondary)] border-[var(--border-color)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  {type === 'all' ? 'Alle' : type === 'character' ? 'Figuren' : type === 'location' ? 'Orte' : 'Fraktionen'}
                </button>
              ))}
            </div>
          </div>

          <ul className="space-y-3" role="list">
            {filteredEntities.map((entity) => {
              const outgoing = relations.filter((r) => r.source_id === entity.id);
              const incoming = relations.filter((r) => r.target_id === entity.id);
              const totalRelCount = outgoing.length + incoming.length;

              return (
                <li
                  key={entity.id}
                  className="rounded-2xl border-2 border-[var(--border-color)] bg-[var(--bg-surface)] overflow-hidden transition-all shadow-sm focus-within:border-[var(--accent)]"
                >
                  <details className="group">
                    <summary className="touch-target cursor-pointer list-none p-5 flex items-center justify-between gap-4 hover:bg-[var(--bg-canvas)]/40 transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--accent)]">
                      <div className="flex items-center gap-3.5">
                        <div className="w-10 h-10 rounded-xl bg-[var(--bg-canvas)] border border-[var(--border-color)] flex items-center justify-center shrink-0">
                          {getEntityIcon(entity.type)}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-lg font-bold text-[var(--text-primary)] group-hover:text-[var(--accent)] transition-colors">
                              {entity.name}
                            </span>
                            <span className="text-xs px-2 py-0.5 rounded-full bg-[var(--bg-canvas)] border border-[var(--border-color)] text-[var(--text-muted)] font-medium">
                              {getEntityTypeName(entity.type)}
                            </span>
                          </div>
                          <div className="text-xs text-[var(--text-secondary)] mt-0.5">
                            {totalRelCount === 0
                              ? 'Keine Verknüpfungen'
                              : `${totalRelCount} Verknüpfung${totalRelCount > 1 ? 'en' : ''}`}
                            {entity.aliases.length > 0 && ` • Auch bekannt als: ${entity.aliases.join(', ')}`}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedEntity(entity);
                          }}
                          className="touch-target px-3 py-1.5 rounded-lg border border-[var(--border-color)] bg-[var(--bg-canvas)] hover:border-[var(--accent)] text-xs font-bold text-[var(--text-primary)] transition-colors"
                          aria-label={`Details zu ${entity.name} ansehen`}
                        >
                          Details & Co-Pilot
                        </button>
                        <ChevronRight
                          className="w-5 h-5 text-[var(--text-muted)] group-open:rotate-90 transition-transform duration-200"
                          aria-hidden="true"
                        />
                      </div>
                    </summary>

                    {/* Aufgeklappte semantische Liste der Beziehungen */}
                    <div className="p-5 pt-2 border-t border-[var(--border-color)] bg-[var(--bg-canvas)]/50 space-y-4">
                      {totalRelCount === 0 ? (
                        <p className="text-sm text-[var(--text-muted)] py-2">
                          Für diese Entität sind bisher keine Beziehungen angelegt.
                        </p>
                      ) : (
                        <div className="space-y-4">
                          {outgoing.length > 0 && (
                            <div>
                              <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] mb-2">
                                Ausgehende Beziehungen ({outgoing.length})
                              </h4>
                              <ul className="space-y-2">
                                {outgoing.map((rel) => {
                                  const target = entities.find((e) => e.id === rel.target_id);
                                  const targetName = target?.name || rel.target_id;
                                  return (
                                    <li
                                      key={rel.id}
                                      className="p-3 rounded-xl border border-[var(--border-color)] bg-[var(--bg-surface)] flex flex-wrap items-center justify-between gap-3"
                                    >
                                      <div className="flex items-center gap-2 flex-wrap text-base font-semibold">
                                        <span className="text-[var(--text-primary)] font-bold">{entity.name}</span>
                                        <span
                                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[var(--accent)]/15 text-[var(--accent)] border border-[var(--accent)]/30 text-xs font-black uppercase tracking-tight"
                                          aria-label={`Beziehung zu ${targetName}`}
                                        >
                                          <ArrowRight className="w-3.5 h-3.5" aria-label="beziehung zu" />
                                          {rel.label}
                                        </span>
                                        <span className="text-[var(--text-primary)] font-bold">{targetName}</span>
                                        {rel.notes && (
                                          <span className="text-xs text-[var(--text-muted)] italic font-normal">
                                            ({rel.notes})
                                          </span>
                                        )}
                                      </div>

                                      <button
                                        onClick={() => setSelectedRelation(rel)}
                                        className="touch-target px-2.5 py-1 rounded-lg text-xs font-bold text-[var(--accent)] hover:underline border border-transparent hover:border-[var(--accent)] transition-all"
                                        aria-label={`Beziehungsdetail ${entity.name} zu ${targetName} öffnen`}
                                      >
                                        Beziehungs-Details
                                      </button>
                                    </li>
                                  );
                                })}
                              </ul>
                            </div>
                          )}

                          {incoming.length > 0 && (
                            <div>
                              <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] mb-2">
                                Eingehende Beziehungen ({incoming.length})
                              </h4>
                              <ul className="space-y-2">
                                {incoming.map((rel) => {
                                  const source = entities.find((e) => e.id === rel.source_id);
                                  const sourceName = source?.name || rel.source_id;
                                  return (
                                    <li
                                      key={rel.id}
                                      className="p-3 rounded-xl border border-[var(--border-color)] bg-[var(--bg-surface)] flex flex-wrap items-center justify-between gap-3"
                                    >
                                      <div className="flex items-center gap-2 flex-wrap text-base font-semibold">
                                        <span className="text-[var(--text-primary)] font-bold">{sourceName}</span>
                                        <span
                                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[var(--bg-canvas)] text-[var(--text-secondary)] border border-[var(--border-color)] text-xs font-black uppercase tracking-tight"
                                          aria-label={`Beziehung von ${sourceName}`}
                                        >
                                          <ArrowRight className="w-3.5 h-3.5" aria-label="beziehung zu" />
                                          {rel.label}
                                        </span>
                                        <span className="text-[var(--text-primary)] font-bold">{entity.name}</span>
                                      </div>

                                      <button
                                        onClick={() => setSelectedRelation(rel)}
                                        className="touch-target px-2.5 py-1 rounded-lg text-xs font-bold text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-transparent hover:border-[var(--border-color)] transition-all"
                                        aria-label={`Beziehungsdetail ${sourceName} zu ${entity.name} öffnen`}
                                      >
                                        Beziehungs-Details
                                      </button>
                                    </li>
                                  );
                                })}
                              </ul>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </details>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {/* 3. Grafische Ansicht mit professionellem GraphView */}
      {activeView === 'graph' && (
        <section aria-label="Grafische Beziehungsansicht" className="space-y-4">
          <div className="sr-only" role="status" aria-live="polite">
            Grafische Ansicht aktiv. Bitte wechseln Sie für eine optimierte Screenreader-Nutzung zur barrierefreien Listenansicht.
          </div>

          <GraphView
            entities={entities}
            relations={relations}
            threads={threads}
            timeline={timeline}
            accessibility={accessibility}
            onAskCopilot={onAskCopilot}
            onSwitchToList={() => setActiveView('list')}
          />
        </section>
      )}

      {/* 4. Side-Panel / Modal für Details mit "Im Co-Pilot nachfragen" */}
      {selectedEntity && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="entity-detail-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
        >
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border-2 border-[var(--border-color)] bg-[var(--bg-surface)] p-6 sm:p-8 space-y-6 shadow-2xl focus:outline-none">
            <div className="flex items-start justify-between gap-4 border-b border-[var(--border-color)] pb-4">
              <div className="space-y-1">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[var(--bg-canvas)] border border-[var(--border-color)] text-xs font-bold text-[var(--accent)]">
                  {getEntityIcon(selectedEntity.type)}
                  <span>{getEntityTypeName(selectedEntity.type)}</span>
                </div>
                <h3
                  id="entity-detail-title"
                  className="text-2xl sm:text-3xl font-black text-[var(--text-primary)] tracking-tight"
                >
                  {selectedEntity.name}
                </h3>
              </div>

              <button
                onClick={closeDetail}
                className="touch-target p-2 rounded-xl border border-[var(--border-color)] bg-[var(--bg-canvas)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--accent)] transition-colors"
                aria-label="Detail-Ansicht schließen"
              >
                <X className="w-5 h-5" aria-hidden="true" />
              </button>
            </div>

            {selectedEntity.aliases.length > 0 && (
              <div>
                <strong className="text-xs uppercase tracking-wider text-[var(--text-muted)] block mb-1">
                  Alternative Namen / Aliase:
                </strong>
                <p className="text-base text-[var(--text-primary)]">{selectedEntity.aliases.join(', ')}</p>
              </div>
            )}

            {selectedEntity.markdown_body && (
              <div>
                <strong className="text-xs uppercase tracking-wider text-[var(--text-muted)] block mb-1">
                  Beschreibung & Profil:
                </strong>
                <p className="text-base text-[var(--text-secondary)] leading-relaxed whitespace-pre-wrap">
                  {selectedEntity.markdown_body}
                </p>
              </div>
            )}

            {/* Verknüpfte Relationen dieser Entity */}
            <div className="space-y-2">
              <strong className="text-xs uppercase tracking-wider text-[var(--text-muted)] block">
                Verknüpfungen im Handlungsnetz:
              </strong>
              <div className="space-y-2">
                {relations
                  .filter((r) => r.source_id === selectedEntity.id || r.target_id === selectedEntity.id)
                  .map((rel) => {
                    const isSource = rel.source_id === selectedEntity.id;
                    const otherId = isSource ? rel.target_id : rel.source_id;
                    const other = entities.find((e) => e.id === otherId);
                    return (
                      <div
                        key={rel.id}
                        className="p-3 rounded-xl bg-[var(--bg-canvas)] border border-[var(--border-color)] flex items-center justify-between text-sm"
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-[var(--text-primary)]">
                            {isSource ? '→ ' + rel.label : '← ' + rel.label}
                          </span>
                          <span className="text-[var(--accent)] font-semibold">{other?.name || otherId}</span>
                        </div>
                        {rel.notes && <span className="text-xs text-[var(--text-muted)]">{rel.notes}</span>}
                      </div>
                    );
                  })}
              </div>
            </div>

            {/* Aktionsleiste mit Co-Pilot-Button */}
            <div className="pt-4 border-t border-[var(--border-color)] flex flex-wrap items-center justify-end gap-3">
              <button
                onClick={closeDetail}
                className="touch-target px-5 py-3 rounded-xl border border-[var(--border-color)] bg-[var(--bg-canvas)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] text-sm font-bold"
              >
                Schließen
              </button>

              <button
                onClick={() => {
                  handleAskCopilot(selectedEntity.name, selectedEntity.markdown_body);
                  closeDetail();
                }}
                className="touch-target px-5 py-3 rounded-xl bg-[var(--accent)] text-[var(--accent-contrast)] font-black text-sm flex items-center gap-2 shadow-md hover:opacity-95 focus-visible:ring-4 focus-visible:ring-[var(--accent)]"
                aria-label={`Im Co-Pilot nach ${selectedEntity.name} fragen`}
              >
                <Sparkles className="w-4 h-4" aria-hidden="true" />
                <span>Im Co-Pilot nachfragen</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Detail-Modal für Relations */}
      {selectedRelation && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="relation-detail-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
        >
          <div className="w-full max-w-lg rounded-2xl border-2 border-[var(--border-color)] bg-[var(--bg-surface)] p-6 space-y-5 shadow-2xl">
            <div className="flex items-start justify-between border-b border-[var(--border-color)] pb-3">
              <h3 id="relation-detail-title" className="text-xl font-black text-[var(--text-primary)]">
                Beziehungsdetails
              </h3>
              <button
                onClick={closeDetail}
                className="p-2 rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                aria-label="Schließen"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-base">
              <div className="p-4 rounded-xl bg-[var(--bg-canvas)] border border-[var(--border-color)] space-y-2">
                <div className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">Verbindung:</div>
                <div className="flex items-center gap-2 font-bold text-lg text-[var(--text-primary)]">
                  <span>{entities.find((e) => e.id === selectedRelation.source_id)?.name || selectedRelation.source_id}</span>
                  <ArrowRight className="w-4 h-4 text-[var(--accent)]" />
                  <span>{entities.find((e) => e.id === selectedRelation.target_id)?.name || selectedRelation.target_id}</span>
                </div>
                <div className="text-sm font-semibold text-[var(--accent)] bg-[var(--bg-surface)] p-2 rounded-lg border border-[var(--border-color)]">
                  Art / Dynamik: {selectedRelation.label}
                </div>
              </div>

              {selectedRelation.notes && (
                <div>
                  <div className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] mb-1">
                    Notizen & Kontext:
                  </div>
                  <p className="text-sm text-[var(--text-secondary)]">{selectedRelation.notes}</p>
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-[var(--border-color)] flex justify-end gap-3">
              <button
                onClick={closeDetail}
                className="touch-target px-4 py-2.5 rounded-xl border border-[var(--border-color)] text-sm font-bold"
              >
                Schließen
              </button>

              <button
                onClick={() => {
                  const s = entities.find((e) => e.id === selectedRelation.source_id)?.name || selectedRelation.source_id;
                  const t = entities.find((e) => e.id === selectedRelation.target_id)?.name || selectedRelation.target_id;
                  handleAskCopilot(`Beziehung zwischen ${s} und ${t}`, `Art: ${selectedRelation.label}. ${selectedRelation.notes || ''}`);
                  closeDetail();
                }}
                className="touch-target px-4 py-2.5 rounded-xl bg-[var(--accent)] text-[var(--accent-contrast)] font-bold text-sm flex items-center gap-2"
              >
                <Sparkles className="w-4 h-4" />
                <span>Im Co-Pilot nachfragen</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
