import React, { useState } from 'react';
import { Search, Plus, BookOpen, Tag, Volume2, ExternalLink, Upload } from 'lucide-react';
import { ResearchSource, AccessibilitySettings } from '../types/domain.js';
import { speechService } from '../services/speech.js';
import { ResearchImport } from './Research/ResearchImport.js';

interface ResearchHubProps {
  research: ResearchSource[];
  onSaveResearch: (item: ResearchSource) => Promise<void>;
  onImportNotes?: (items: ResearchSource[]) => Promise<void>;
  accessibility: AccessibilitySettings;
}

export const ResearchHub: React.FC<ResearchHubProps> = ({
  research,
  onSaveResearch,
  onImportNotes,
  accessibility,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newTags, setNewTags] = useState('');
  const [newCitation, setNewCitation] = useState('');

  const filtered = research.filter((item) => {
    const q = searchQuery.toLowerCase();
    return (
      item.title.toLowerCase().includes(q) ||
      item.content.toLowerCase().includes(q) ||
      item.tags.some((t) => t.toLowerCase().includes(q)) ||
      (item.citation && item.citation.toLowerCase().includes(q))
    );
  });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newContent.trim()) return;

    const item: ResearchSource = {
      id: `res-${Date.now().toString(36)}`,
      title: newTitle.trim(),
      type: 'note',
      content: newContent.trim(),
      tags: newTags.split(',').map((t) => t.trim()).filter(Boolean),
      citation: newCitation.trim() || undefined,
      created_at: Date.now(),
    };

    await onSaveResearch(item);
    setNewTitle('');
    setNewContent('');
    setNewTags('');
    setNewCitation('');
    setShowAddModal(false);
  };

  const handleImportComplete = async (items: ResearchSource[]) => {
    if (onImportNotes) {
      await onImportNotes(items);
    } else {
      for (const item of items) {
        await onSaveResearch(item);
      }
    }
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 pb-24 space-y-6">
      {/* Top search & Add / Import note actions */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="relative flex-1 min-w-[260px]">
          <Search className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Recherche, Zitate oder Notizen durchsuchen…"
            aria-label="Recherche, Zitate oder Notizen durchsuchen"
            className="w-full pl-11 pr-4 py-3 rounded-2xl bg-[var(--bg-surface)] text-[var(--text-primary)] border-2 border-[var(--border-color)] focus:border-[var(--accent)] text-base"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => setShowImport((prev) => !prev)}
            aria-expanded={showImport}
            className={`min-h-[48px] px-4 py-2.5 rounded-2xl font-bold text-sm sm:text-base flex items-center gap-2 border-2 transition-all focus-visible:ring-4 focus-visible:ring-[var(--accent)] ${
              showImport
                ? 'bg-[var(--accent)] text-[var(--bg-canvas)] border-[var(--accent)] shadow-md'
                : 'bg-[var(--bg-surface)] text-[var(--text-primary)] border-[var(--border-color)] hover:border-[var(--accent)]'
            }`}
          >
            <Upload className="w-5 h-5" aria-hidden="true" />
            <span>{showImport ? 'Import schließen' : 'Importieren / Smart Paste'}</span>
          </button>

          <button
            onClick={() => setShowAddModal(true)}
            className="min-h-[48px] px-4 py-2.5 rounded-2xl bg-[var(--accent)] text-[var(--accent-contrast)] font-bold text-sm sm:text-base flex items-center gap-2 shadow hover:brightness-110 focus-visible:ring-4 focus-visible:ring-[var(--accent)]"
          >
            <Plus className="w-5 h-5" aria-hidden="true" />
            <span>Notiz anlegen</span>
          </button>
        </div>
      </div>

      {/* Robust Research Import Area */}
      {showImport && (
        <ResearchImport
          onImportComplete={handleImportComplete}
          onClose={() => setShowImport(false)}
          accessibility={accessibility}
        />
      )}

      {/* Results grid */}
      <div className="space-y-4">
        {filtered.length === 0 ? (
          <div className="p-12 text-center text-[var(--text-muted)] bg-[var(--bg-surface)] rounded-2xl border border-[var(--border-color)]">
            Keine passenden Recherche-Quellen gefunden.
          </div>
        ) : (
          filtered.map((item) => (
            <div
              key={item.id}
              className="p-5 sm:p-6 rounded-2xl bg-[var(--bg-surface)] border-2 border-[var(--border-color)] space-y-3 shadow-sm"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-xl font-bold text-[var(--text-primary)]">
                  {item.title}
                </h3>
                <button
                  onClick={() => speechService.speak(`${item.title}. ${item.content}`)}
                  className="touch-target px-3 py-1.5 rounded-lg text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] flex items-center gap-1.5"
                  title="Vorlesen"
                >
                  <Volume2 className="w-4 h-4 text-[var(--accent)]" />
                  <span>Vorlesen</span>
                </button>
              </div>

              <p className="text-base sm:text-lg text-[var(--text-secondary)] leading-relaxed">
                {item.content}
              </p>

              <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[var(--border-color)] text-xs text-[var(--text-muted)]">
                {item.citation ? (
                  <span>Fundstelle: <strong className="text-[var(--text-secondary)]">{item.citation}</strong></span>
                ) : (
                  <span>Eigene Notiz</span>
                )}

                {item.tags.length > 0 && (
                  <div className="flex items-center gap-1.5">
                    {item.tags.map((t) => (
                      <span key={t} className="px-2 py-0.5 rounded bg-[var(--bg-canvas)] border border-[var(--border-color)] font-medium">
                        #{t}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal: New Research Note */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl bg-[var(--bg-surface-elevated)] border-2 border-[var(--border-color)] p-6 shadow-2xl">
            <h3 className="text-xl font-bold text-[var(--text-primary)] mb-4">
              Recherche-Notiz oder Quellenauszug anlegen
            </h3>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] mb-1">
                  Titel der Notiz
                </label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="z. B. Badische Schamotte-Öfen 1928"
                  required
                  className="w-full px-4 py-2.5 rounded-xl bg-[var(--bg-canvas)] text-[var(--text-primary)] border border-[var(--border-color)] text-base"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] mb-1">
                  Inhalt & Zitat
                </label>
                <textarea
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  placeholder="Inhalt, historischer Beleg oder Beobachtung…"
                  rows={4}
                  required
                  className="w-full p-4 rounded-xl bg-[var(--bg-canvas)] text-[var(--text-primary)] border border-[var(--border-color)] text-base"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] mb-1">
                    Quelle / Zitatangabe
                  </label>
                  <input
                    type="text"
                    value={newCitation}
                    onChange={(e) => setNewCitation(e.target.value)}
                    placeholder="Buch, Archiv, Webseite"
                    className="w-full px-3.5 py-2 rounded-xl bg-[var(--bg-canvas)] text-[var(--text-primary)] border border-[var(--border-color)] text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] mb-1">
                    Schlagwörter (kommagetrennt)
                  </label>
                  <input
                    type="text"
                    value={newTags}
                    onChange={(e) => setNewTags(e.target.value)}
                    placeholder="Bäckerei, Handwerk, 1920er"
                    className="w-full px-3.5 py-2 rounded-xl bg-[var(--bg-canvas)] text-[var(--text-primary)] border border-[var(--border-color)] text-sm"
                  />
                </div>
              </div>

              <div className="mt-6 flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="touch-target px-4 py-2 rounded-xl text-[var(--text-secondary)] font-bold text-sm"
                >
                  Abbrechen
                </button>
                <button
                  type="submit"
                  className="touch-target px-5 py-2.5 rounded-xl bg-[var(--accent)] text-[var(--accent-contrast)] font-bold text-sm shadow"
                >
                  Speichern
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
