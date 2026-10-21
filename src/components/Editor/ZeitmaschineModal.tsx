import React, { useState, useEffect } from 'react';
import { History, Clock, ArrowLeft, Check, RotateCcw, X, ShieldCheck } from 'lucide-react';
import { ChapterSnapshot } from '../../types/domain.js';
import { api } from '../../services/api.js';

interface ZeitmaschineModalProps {
  chapterId: string;
  chapterTitle: string;
  currentBody: string;
  isOpen: boolean;
  onClose: () => void;
  onRestore: (restoredContent: string) => void;
}

export const ZeitmaschineModal: React.FC<ZeitmaschineModalProps> = ({
  chapterId,
  chapterTitle,
  currentBody,
  isOpen,
  onClose,
  onRestore,
}) => {
  const [snapshots, setSnapshots] = useState<ChapterSnapshot[]>([]);
  const [selectedSnapshot, setSelectedSnapshot] = useState<ChapterSnapshot | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRestoring, setIsRestoring] = useState(false);

  useEffect(() => {
    if (isOpen && chapterId) {
      loadSnapshots();
    }
  }, [isOpen, chapterId]);

  const loadSnapshots = async () => {
    setIsLoading(true);
    try {
      const data = await api.getSnapshots(chapterId);
      setSnapshots(data);
      if (data.length > 0) {
        setSelectedSnapshot(data[0]);
      } else {
        setSelectedSnapshot(null);
      }
    } catch (e) {
      console.warn('Could not load snapshots:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateManualSnapshot = async () => {
    const label = `Manuell gesichert (${new Date().toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })})`;
    try {
      const created = await api.createSnapshot(chapterId, label, currentBody);
      setSnapshots((prev) => [created, ...prev]);
      setSelectedSnapshot(created);
    } catch (e) {
      console.warn('Error creating snapshot:', e);
    }
  };

  const handleRestore = async (snap: ChapterSnapshot) => {
    setIsRestoring(true);
    try {
      const res = await api.restoreSnapshot(chapterId, snap.id);
      if (res && res.content !== undefined) {
        onRestore(res.content);
        onClose();
      }
    } catch (e) {
      console.warn('Error restoring snapshot:', e);
    } finally {
      setIsRestoring(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="zeitmaschine-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
    >
      <div className="bg-[var(--bg-surface)] border-2 border-[var(--border-focus)] rounded-3xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-6 bg-[var(--bg-surface-elevated)] border-b border-[var(--border-color)] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-amber-500/20 text-amber-400 rounded-2xl">
              <History className="w-8 h-8" />
            </div>
            <div>
              <h2 id="zeitmaschine-title" className="text-2xl font-bold">
                Kapitel-Zeitmaschine
              </h2>
              <p className="text-[var(--text-muted)] text-base mt-0.5">
                Frühere Fassungen von »{chapterTitle}« ansehen und sicher zurückholen
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="touch-target p-3 rounded-xl hover:bg-[var(--bg-canvas)] text-[var(--text-muted)] hover:text-[var(--text-primary)]"
            aria-label="Zeitmaschine schließen"
          >
            <X className="w-7 h-7" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 flex flex-col md:flex-row min-h-0 overflow-hidden">
          {/* Left: Snapshots List */}
          <div className="w-full md:w-80 border-b md:border-b-0 md:border-r border-[var(--border-color)] p-4 overflow-y-auto bg-[var(--bg-surface)]">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
                Gespeicherte Zeitpunkte
              </span>
              <button
                type="button"
                onClick={handleCreateManualSnapshot}
                className="text-xs font-bold text-[var(--accent)] hover:underline flex items-center gap-1"
              >
                + Jetzt sichern
              </button>
            </div>

            {isLoading ? (
              <div className="py-8 text-center text-[var(--text-muted)]">Lade frühere Fassungen…</div>
            ) : snapshots.length === 0 ? (
              <div className="py-8 text-center text-[var(--text-muted)]">
                <Clock className="w-10 h-10 mx-auto mb-2 opacity-40" />
                <p>Noch keine Schnappschüsse.</p>
                <p className="text-xs mt-1">Alle 15 Minuten wird automatisch eine Fassung angelegt.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {snapshots.map((snap) => (
                  <button
                    key={snap.id}
                    type="button"
                    onClick={() => setSelectedSnapshot(snap)}
                    className={`w-full text-left p-3.5 rounded-xl border transition-all ${
                      selectedSnapshot?.id === snap.id
                        ? 'bg-[var(--accent)] text-[var(--accent-contrast)] border-[var(--accent)] font-bold shadow-md'
                        : 'bg-[var(--bg-canvas)] border-[var(--border-color)] text-[var(--text-primary)] hover:border-[var(--accent)]'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-base">{snap.label}</span>
                      <span className="text-xs opacity-75">{snap.wordCount} W.</span>
                    </div>
                    <div className="text-xs opacity-80 mt-1">
                      {new Date(snap.createdAt).toLocaleDateString('de-DE', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right: Snapshot Preview & Restore */}
          <div className="flex-1 flex flex-col p-6 overflow-hidden bg-[var(--bg-canvas)]">
            {selectedSnapshot ? (
              <>
                <div className="flex items-center justify-between pb-3 border-b border-[var(--border-color)] mb-4">
                  <div>
                    <h3 className="font-bold text-lg text-[var(--text-primary)]">
                      {selectedSnapshot.label}
                    </h3>
                    <p className="text-sm text-[var(--text-muted)]">
                      Umfang: {selectedSnapshot.wordCount} Wörter
                    </p>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-emerald-400 bg-emerald-500/10 px-3 py-1.5 rounded-lg">
                    <ShieldCheck className="w-4 h-4" />
                    <span>Nichts geht verloren</span>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-color)] font-serif text-lg leading-relaxed whitespace-pre-wrap select-text mb-6">
                  {selectedSnapshot.content || <em className="text-[var(--text-muted)]">Leerer Textinhalt</em>}
                </div>

                <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <p className="text-xs text-[var(--text-muted)]">
                    💡 Beim Zurückholen wird deine aktuelle Fassung automatisch als neuer Schnappschuss gespeichert.
                  </p>
                  <button
                    type="button"
                    disabled={isRestoring}
                    onClick={() => handleRestore(selectedSnapshot)}
                    className="min-h-[56px] w-full sm:w-auto px-8 py-4 rounded-2xl font-bold text-lg bg-[var(--accent)] text-[var(--accent-contrast)] hover:opacity-90 shadow-xl flex items-center justify-center gap-3 transition-transform active:scale-95 shrink-0"
                  >
                    <RotateCcw className="w-6 h-6" />
                    <span>Diese Fassung zurückholen</span>
                  </button>
                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-[var(--text-muted)]">
                <History className="w-16 h-16 mb-4 opacity-30" />
                <p className="text-lg">Wähle links eine Fassung aus, um sie anzuschauen.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
