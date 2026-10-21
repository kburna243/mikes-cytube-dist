import React, { useState } from 'react';
import {
  Users,
  MapPin,
  Shield,
  Box,
  Plus,
  Trash2,
  Volume2,
  FileCode,
  CheckCircle,
  AlertCircle,
  HelpCircle,
  Sparkles,
} from 'lucide-react';
import { Entity, EntityType, Fact, AccessibilitySettings } from '../types/domain.js';
import { speechService } from '../services/speech.js';

interface WorldDatabaseProps {
  entities: Entity[];
  facts: Fact[];
  onSaveEntity: (entity: Partial<Entity> & { id: string; name: string }) => Promise<void>;
  onDeleteEntity: (id: string) => Promise<void>;
  onAddFact: (entityId: string, fact: Partial<Fact>) => Promise<void>;
  onDeleteFact: (id: string) => Promise<void>;
  accessibility: AccessibilitySettings;
  onOpenAssistantForEntity: (entityId: string) => void;
}

export const WorldDatabase: React.FC<WorldDatabaseProps> = ({
  entities,
  facts,
  onSaveEntity,
  onDeleteEntity,
  onAddFact,
  onDeleteFact,
  accessibility,
  onOpenAssistantForEntity,
}) => {
  const [selectedType, setSelectedType] = useState<EntityType | 'all'>('all');
  const [activeEntityId, setActiveEntityId] = useState<string>(entities[0]?.id || '');
  const [isEditingMarkdown, setIsEditingMarkdown] = useState(false);
  const [newFactStatement, setNewFactStatement] = useState('');
  const [newFactSource, setNewFactSource] = useState('');
  const [newFactCertainty, setNewFactCertainty] = useState<'canonical' | 'uncertain'>('canonical');
  const [showNewEntityModal, setShowNewEntityModal] = useState(false);
  const [newEntityName, setNewEntityName] = useState('');
  const [newEntityType, setNewEntityType] = useState<EntityType>('character');

  const filteredEntities = selectedType === 'all'
    ? entities
    : entities.filter((e) => e.type === selectedType);

  const activeEntity = entities.find((e) => e.id === activeEntityId) || filteredEntities[0];
  const activeFacts = activeEntity ? facts.filter((f) => f.entity_id === activeEntity.id) : [];

  const handleCreateEntity = async () => {
    if (!newEntityName.trim()) return;
    const prefix = newEntityType === 'character' ? 'fig' : newEntityType === 'location' ? 'ort' : 'ent';
    const id = `${prefix}-${Date.now().toString(36)}`;
    const templateMarkdown = `---
id: ${id}
type: ${newEntityType}
name: ${newEntityName}
aliases: []
threads: []
---
## Motivation & Wesen
Beschreibe hier die Motivation und das Wesen.

## Geheimnis
Welches Geheimnis hütet diese Entität?`;

    await onSaveEntity({
      id,
      name: newEntityName,
      type: newEntityType,
      aliases: [],
      threads: [],
      path: `${newEntityType}/${id}.md`,
      markdown_body: templateMarkdown,
    });

    setActiveEntityId(id);
    setNewEntityName('');
    setShowNewEntityModal(false);
  };

  const handleAddFactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeEntity || !newFactStatement.trim()) return;

    await onAddFact(activeEntity.id, {
      statement: newFactStatement.trim(),
      source: newFactSource.trim() || 'Notizen der Autorin',
      certainty: newFactCertainty,
    });

    setNewFactStatement('');
    setNewFactSource('');
  };

  const readEntityAloud = () => {
    if (!activeEntity) return;
    const factsText = activeFacts.map((f) => f.statement).join('. ');
    const fullText = `${activeEntity.name}. ${activeEntity.markdown_body}. Kanonische Fakten: ${factsText}`;
    speechService.speak(fullText);
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 pb-24">
      {/* Type Filter Tabs (Accessible Functional Buttons) */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-color)]">
          <button
            onClick={() => setSelectedType('all')}
            className={`touch-target px-3.5 py-2 rounded-xl text-sm font-bold transition-colors ${
              selectedType === 'all'
                ? 'bg-[var(--accent)] text-[var(--accent-contrast)]'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            Alle ({entities.length})
          </button>
          <button
            onClick={() => setSelectedType('character')}
            className={`touch-target px-3.5 py-2 rounded-xl text-sm font-bold flex items-center gap-1.5 transition-colors ${
              selectedType === 'character'
                ? 'bg-[var(--accent)] text-[var(--accent-contrast)]'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            <Users className="w-4 h-4" /> Figuren
          </button>
          <button
            onClick={() => setSelectedType('location')}
            className={`touch-target px-3.5 py-2 rounded-xl text-sm font-bold flex items-center gap-1.5 transition-colors ${
              selectedType === 'location'
                ? 'bg-[var(--accent)] text-[var(--accent-contrast)]'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            <MapPin className="w-4 h-4" /> Orte
          </button>
          <button
            onClick={() => setSelectedType('faction')}
            className={`touch-target px-3.5 py-2 rounded-xl text-sm font-bold flex items-center gap-1.5 transition-colors ${
              selectedType === 'faction'
                ? 'bg-[var(--accent)] text-[var(--accent-contrast)]'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            <Shield className="w-4 h-4" /> Fraktionen
          </button>
          <button
            onClick={() => setSelectedType('item')}
            className={`touch-target px-3.5 py-2 rounded-xl text-sm font-bold flex items-center gap-1.5 transition-colors ${
              selectedType === 'item'
                ? 'bg-[var(--accent)] text-[var(--accent-contrast)]'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            <Box className="w-4 h-4" /> Gegenstände
          </button>
        </div>

        <button
          onClick={() => setShowNewEntityModal(true)}
          className="touch-target px-4 py-2.5 rounded-xl bg-[var(--accent)] text-[var(--accent-contrast)] font-bold text-sm flex items-center gap-2 shadow hover:opacity-90 transition-opacity"
        >
          <Plus className="w-5 h-5" /> Eintrag hinzufügen
        </button>
      </div>

      {/* Main Split Grid: Entities list on left, detail & facts on right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left column: List of entities */}
        <div className="lg:col-span-4 space-y-2">
          <div className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] mb-2">
            Einträge ({filteredEntities.length})
          </div>
          {filteredEntities.map((ent) => {
            const entFacts = facts.filter((f) => f.entity_id === ent.id);
            const isSelected = activeEntity?.id === ent.id;
            return (
              <button
                key={ent.id}
                onClick={() => {
                  setActiveEntityId(ent.id);
                  setIsEditingMarkdown(false);
                }}
                className={`touch-target w-full text-left p-3.5 rounded-2xl border-2 transition-all flex flex-col justify-between ${
                  isSelected
                    ? 'border-[var(--accent)] bg-[var(--bg-surface-elevated)] shadow-md'
                    : 'border-[var(--border-color)] bg-[var(--bg-surface)] hover:border-[var(--accent)]/50'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-bold text-lg text-[var(--text-primary)] truncate">
                    {ent.name}
                  </span>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-[var(--bg-canvas)] border border-[var(--border-color)] text-[var(--text-secondary)]">
                    {ent.type === 'character' ? 'Figur' : ent.type === 'location' ? 'Ort' : ent.type}
                  </span>
                </div>
                <div className="mt-1 flex items-center gap-2 text-xs text-[var(--text-muted)]">
                  <span>{entFacts.length} Fakten</span>
                  {ent.aliases.length > 0 && (
                    <>
                      <span aria-hidden="true">·</span>
                      <span className="truncate">Alias: {ent.aliases[0]}</span>
                    </>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Right column: Detailed View & Canonical Facts */}
        <div className="lg:col-span-8">
          {activeEntity ? (
            <div className="rounded-2xl bg-[var(--bg-surface)] border-2 border-[var(--border-color)] p-4 sm:p-6 shadow-sm">
              {/* Header with Title and Actions */}
              <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-[var(--border-color)]">
                <div>
                  <h2 className="text-2xl sm:text-3xl font-bold text-[var(--text-primary)]">
                    {activeEntity.name}
                  </h2>
                  <div className="text-xs text-[var(--text-muted)] mt-0.5 font-mono">
                    ID: {activeEntity.id} · Pfad: {activeEntity.path}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={readEntityAloud}
                    className="touch-target px-3 py-2 rounded-xl bg-[var(--bg-canvas)] border border-[var(--border-color)] hover:border-[var(--accent)] text-[var(--text-primary)] font-bold text-sm flex items-center gap-1.5"
                    title="Vorlesen"
                  >
                    <Volume2 className="w-5 h-5 text-[var(--accent)]" />
                    <span>Vorlesen</span>
                  </button>
                  <button
                    onClick={() => setIsEditingMarkdown(!isEditingMarkdown)}
                    className={`touch-target px-3 py-2 rounded-xl border text-sm font-bold flex items-center gap-1.5 transition-colors ${
                      isEditingMarkdown
                        ? 'bg-[var(--accent)] text-[var(--accent-contrast)] border-[var(--accent)]'
                        : 'bg-[var(--bg-canvas)] border-[var(--border-color)] text-[var(--text-primary)] hover:border-[var(--accent)]'
                    }`}
                  >
                    <FileCode className="w-4 h-4" />
                    <span>{isEditingMarkdown ? 'Vorschau' : 'Markdown'}</span>
                  </button>
                  <button
                    onClick={() => onOpenAssistantForEntity(activeEntity.id)}
                    className="touch-target px-3 py-2 rounded-xl bg-[var(--accent)] text-[var(--accent-contrast)] font-bold text-sm flex items-center gap-1.5"
                    title="Im Co-Pilot öffnen"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>Co-Pilot</span>
                  </button>
                </div>
              </div>

              {/* Entity Body (Markdown view or Raw editor) */}
              <div className="mt-4">
                {isEditingMarkdown ? (
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] mb-1">
                      Markdown-Quelle mit YAML-Frontmatter (§5.2)
                    </label>
                    <textarea
                      value={activeEntity.markdown_body}
                      onChange={(e) => {
                        onSaveEntity({
                          ...activeEntity,
                          markdown_body: e.target.value,
                        });
                      }}
                      rows={10}
                      className="w-full p-4 rounded-xl font-mono text-sm bg-[var(--bg-canvas)] text-[var(--text-primary)] border border-[var(--border-color)] focus:border-[var(--accent)]"
                    />
                  </div>
                ) : (
                  <div className="prose prose-invert max-w-none text-base text-[var(--text-secondary)] whitespace-pre-wrap leading-relaxed py-2">
                    {activeEntity.markdown_body.replace(/---[\s\S]*?---/, '').trim() || 'Noch kein Freitext hinterlegt.'}
                  </div>
                )}
              </div>

              {/* Canonical Facts Section (§5.1) */}
              <div className="mt-8 pt-6 border-t border-[var(--border-color)]">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xl font-bold text-[var(--text-primary)] flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-[var(--accent)]" />
                    Kanonische Fakten ({activeFacts.length})
                  </h3>
                  <span className="text-xs text-[var(--text-muted)]">
                    Wird für automatische Kontinuitätsprüfung genutzt
                  </span>
                </div>

                {activeFacts.length === 0 ? (
                  <div className="p-4 rounded-xl bg-[var(--bg-canvas)] border border-[var(--border-color)] text-sm text-[var(--text-muted)] text-center">
                    Noch keine Fakten hinterlegt. Füge den ersten kanonischen Fakt hinzu (z. B. Augenfarbe, Handhabung, Geheimnis).
                  </div>
                ) : (
                  <div className="space-y-2 mb-4">
                    {activeFacts.map((fact) => (
                      <div
                        key={fact.id}
                        className="p-3.5 rounded-xl bg-[var(--bg-canvas)] border border-[var(--border-color)] flex items-start justify-between gap-3"
                      >
                        <div className="space-y-1">
                          <div className="font-bold text-base text-[var(--text-primary)]">
                            {fact.statement}
                          </div>
                          <div className="text-xs text-[var(--text-muted)] flex items-center gap-2">
                            <span>Quelle: {fact.source}</span>
                            <span aria-hidden="true">·</span>
                            <span className={fact.certainty === 'canonical' ? 'text-[var(--success)] font-semibold' : 'text-[var(--warning)]'}>
                              {fact.certainty === 'canonical' ? 'Kanonisch' : 'Unsicher'}
                            </span>
                          </div>
                        </div>

                        <button
                          onClick={() => onDeleteFact(fact.id)}
                          className="touch-target p-1.5 text-[var(--text-muted)] hover:text-[var(--danger)] transition-colors"
                          aria-label="Fakt löschen"
                          title="Fakt löschen"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Form to add a new canonical fact */}
                <form onSubmit={handleAddFactSubmit} className="mt-4 p-4 rounded-xl bg-[var(--bg-surface-elevated)] border border-[var(--border-color)] space-y-3">
                  <div className="text-sm font-bold text-[var(--text-primary)]">
                    Neuen Fakt hinzufügen
                  </div>
                  <div>
                    <input
                      type="text"
                      value={newFactStatement}
                      onChange={(e) => setNewFactStatement(e.target.value)}
                      placeholder="z. B. Marta hat auffallend graue Augen"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--bg-canvas)] text-[var(--text-primary)] border border-[var(--border-color)] text-base"
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <input
                      type="text"
                      value={newFactSource}
                      onChange={(e) => setNewFactSource(e.target.value)}
                      placeholder="Fundstelle (z. B. Kap. 1, S. 2)"
                      className="px-3.5 py-2 rounded-xl bg-[var(--bg-canvas)] text-[var(--text-primary)] border border-[var(--border-color)] text-sm"
                    />
                    <select
                      value={newFactCertainty}
                      onChange={(e) => setNewFactCertainty(e.target.value as any)}
                      className="px-3.5 py-2 rounded-xl bg-[var(--bg-canvas)] text-[var(--text-primary)] border border-[var(--border-color)] text-sm"
                    >
                      <option value="canonical">Kanonisch (verbindlich)</option>
                      <option value="uncertain">Unsicher (Arbeitshypothese)</option>
                    </select>
                  </div>
                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={!newFactStatement.trim()}
                      className="touch-target px-4 py-2 rounded-xl bg-[var(--accent)] text-[var(--accent-contrast)] font-bold text-sm disabled:opacity-50"
                    >
                      Fakt im Kanon speichern
                    </button>
                  </div>
                </form>
              </div>

              {/* Delete entity button */}
              <div className="mt-6 pt-4 border-t border-[var(--border-color)] flex justify-end">
                <button
                  onClick={() => {
                    if (confirm(`Entität »${activeEntity.name}« und alle zugehörigen Fakten löschen?`)) {
                      onDeleteEntity(activeEntity.id);
                    }
                  }}
                  className="touch-target px-3 py-1.5 rounded-lg text-[var(--danger)] hover:bg-[var(--danger)]/10 text-xs font-semibold flex items-center gap-1.5"
                >
                  <Trash2 className="w-4 h-4" /> Eintrag löschen
                </button>
              </div>
            </div>
          ) : (
            <div className="p-8 text-center text-[var(--text-muted)] bg-[var(--bg-surface)] rounded-2xl border border-[var(--border-color)]">
              Kein Eintrag ausgewählt.
            </div>
          )}
        </div>
      </div>

      {/* Modal: New Entity */}
      {showNewEntityModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl bg-[var(--bg-surface-elevated)] border-2 border-[var(--border-color)] p-6 shadow-2xl">
            <h3 className="text-xl font-bold text-[var(--text-primary)] mb-4">
              Neuen Weltenbuch-Eintrag anlegen
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] mb-1">
                  Typ
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setNewEntityType('character')}
                    className={`touch-target p-2.5 rounded-xl border font-bold text-sm flex items-center justify-center gap-2 ${
                      newEntityType === 'character'
                        ? 'bg-[var(--accent)] text-[var(--accent-contrast)] border-[var(--accent)]'
                        : 'bg-[var(--bg-canvas)] border-[var(--border-color)] text-[var(--text-primary)]'
                    }`}
                  >
                    <Users className="w-4 h-4" /> Figur
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewEntityType('location')}
                    className={`touch-target p-2.5 rounded-xl border font-bold text-sm flex items-center justify-center gap-2 ${
                      newEntityType === 'location'
                        ? 'bg-[var(--accent)] text-[var(--accent-contrast)] border-[var(--accent)]'
                        : 'bg-[var(--bg-canvas)] border-[var(--border-color)] text-[var(--text-primary)]'
                    }`}
                  >
                    <MapPin className="w-4 h-4" /> Ort
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewEntityType('faction')}
                    className={`touch-target p-2.5 rounded-xl border font-bold text-sm flex items-center justify-center gap-2 ${
                      newEntityType === 'faction'
                        ? 'bg-[var(--accent)] text-[var(--accent-contrast)] border-[var(--accent)]'
                        : 'bg-[var(--bg-canvas)] border-[var(--border-color)] text-[var(--text-primary)]'
                    }`}
                  >
                    <Shield className="w-4 h-4" /> Fraktion
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewEntityType('item')}
                    className={`touch-target p-2.5 rounded-xl border font-bold text-sm flex items-center justify-center gap-2 ${
                      newEntityType === 'item'
                        ? 'bg-[var(--accent)] text-[var(--accent-contrast)] border-[var(--accent)]'
                        : 'bg-[var(--bg-canvas)] border-[var(--border-color)] text-[var(--text-primary)]'
                    }`}
                  >
                    <Box className="w-4 h-4" /> Gegenstand
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] mb-1">
                  Name
                </label>
                <input
                  type="text"
                  value={newEntityName}
                  onChange={(e) => setNewEntityName(e.target.value)}
                  placeholder="z. B. Heinrich von Berg"
                  className="w-full px-4 py-2.5 rounded-xl bg-[var(--bg-canvas)] text-[var(--text-primary)] border border-[var(--border-color)] text-base"
                />
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowNewEntityModal(false)}
                className="touch-target px-4 py-2 rounded-xl text-[var(--text-secondary)] font-bold text-sm hover:text-[var(--text-primary)]"
              >
                Abbrechen
              </button>
              <button
                type="button"
                onClick={handleCreateEntity}
                disabled={!newEntityName.trim()}
                className="touch-target px-5 py-2.5 rounded-xl bg-[var(--accent)] text-[var(--accent-contrast)] font-bold text-sm disabled:opacity-50 shadow"
              >
                Eintrag erstellen
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
