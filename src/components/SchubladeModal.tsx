import React, { useState, useEffect } from 'react';
import { Archive, RotateCcw, Trash2, X, AlertTriangle, FileText, User, MapPin, BookOpen } from 'lucide-react';
import { DrawerItem } from '../types/domain.js';
import { api } from '../services/api.js';

interface SchubladeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onItemRestored: () => void;
}

export const SchubladeModal: React.FC<SchubladeModalProps> = ({
  isOpen,
  onClose,
  onItemRestored,
}) => {
  const [items, setItems] = useState<DrawerItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [doubleConfirm, setDoubleConfirm] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadDrawer();
    }
  }, [isOpen]);

  const loadDrawer = async () => {
    setIsLoading(true);
    try {
      const data = await api.getDrawer();
      setItems(data);
    } catch (e) {
      console.warn('Could not load drawer items:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRestore = async (id: string) => {
    try {
      await api.restoreDrawerItem(id);
      setItems((prev) => prev.filter((i) => i.id !== id));
      onItemRestored();
    } catch (e) {
      console.warn('Restore failed:', e);
    }
  };

  const handlePermanentDelete = async (id: string) => {
    try {
      await api.permanentlyDeleteDrawerItem(id);
      setItems((prev) => prev.filter((i) => i.id !== id));
      setConfirmDeleteId(null);
      setDoubleConfirm(false);
      onItemRestored();
    } catch (e) {
      console.warn('Permanent delete failed:', e);
    }
  };

  if (!isOpen) return null;

  const filteredItems = items.filter((item) => {
    if (filter === 'all') return true;
    return item.type === filter;
  });

  const getItemIcon = (type: string) => {
    switch (type) {
      case 'chapter':
        return <FileText className="w-5 h-5 text-amber-400" />;
      case 'character':
        return <User className="w-5 h-5 text-blue-400" />;
      case 'location':
        return <MapPin className="w-5 h-5 text-emerald-400" />;
      default:
        return <BookOpen className="w-5 h-5 text-purple-400" />;
    }
  };

  const getItemTypeName = (type: string) => {
    switch (type) {
      case 'chapter':
        return 'Kapitel';
      case 'character':
        return 'Figur';
      case 'location':
        return 'Ort';
      case 'fact':
        return 'Fakt';
      case 'research':
        return 'Recherche-Notiz';
      default:
        return 'Eintrag';
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="schublade-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
    >
      <div className="bg-[var(--bg-surface)] border-2 border-[var(--border-focus)] rounded-3xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-6 bg-[var(--bg-surface-elevated)] border-b border-[var(--border-color)] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-amber-500/20 text-amber-400 rounded-2xl">
              <Archive className="w-8 h-8" />
            </div>
            <div>
              <h2 id="schublade-title" className="text-2xl font-bold">
                Schreibtisch-Schublade
              </h2>
              <p className="text-[var(--text-muted)] text-base mt-0.5">
                Hier landen entfernte Texte, Figuren und Notizen, damit nichts versehentlich verloren geht.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="touch-target p-3 rounded-xl hover:bg-[var(--bg-canvas)] text-[var(--text-muted)] hover:text-[var(--text-primary)]"
            aria-label="Schublade schließen"
          >
            <X className="w-7 h-7" />
          </button>
        </div>

        {/* Filter bar */}
        <div className="p-4 bg-[var(--bg-canvas)] border-b border-[var(--border-color)] flex flex-wrap gap-2">
          {['all', 'chapter', 'character', 'research'].map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setFilter(t)}
              className={`px-4 py-2 rounded-xl text-sm font-bold transition-colors ${
                filter === t
                  ? 'bg-[var(--accent)] text-[var(--accent-contrast)] shadow-sm'
                  : 'bg-[var(--bg-surface)] border border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              {t === 'all'
                ? `Alle (${items.length})`
                : t === 'chapter'
                ? 'Kapitel'
                : t === 'character'
                ? 'Figuren'
                : 'Recherche'}
            </button>
          ))}
        </div>

        {/* Items List */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-[var(--bg-surface)]">
          {isLoading ? (
            <div className="py-12 text-center text-[var(--text-muted)]">Lade Schublade…</div>
          ) : filteredItems.length === 0 ? (
            <div className="py-16 text-center text-[var(--text-muted)]">
              <Archive className="w-16 h-16 mx-auto mb-3 opacity-30" />
              <p className="text-xl font-medium">Die Schreibtisch-Schublade ist leer.</p>
              <p className="text-sm mt-1">Alle deine Texte und Figuren sind aktiv im Buch vorhanden.</p>
            </div>
          ) : (
            filteredItems.map((item) => (
              <div
                key={item.id}
                className="p-5 rounded-2xl bg-[var(--bg-canvas)] border border-[var(--border-color)] shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    {getItemIcon(item.type)}
                    <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
                      {getItemTypeName(item.type)}
                    </span>
                    <span className="text-xs text-[var(--text-muted)]">·</span>
                    <span className="text-xs text-[var(--text-muted)]">
                      Entfernt am {new Date(item.deletedAt).toLocaleDateString('de-DE')}
                    </span>
                  </div>
                  <h3 className="font-bold text-lg text-[var(--text-primary)] truncate">
                    {item.title}
                  </h3>
                  <p className="text-sm text-[var(--text-secondary)] line-clamp-2 mt-0.5 font-serif">
                    {item.preview}
                  </p>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
                  <button
                    type="button"
                    onClick={() => handleRestore(item.id)}
                    className="min-h-[48px] flex-1 sm:flex-initial px-5 py-2.5 rounded-xl font-bold text-base bg-emerald-600 hover:bg-emerald-500 text-white flex items-center justify-center gap-2 shadow-sm transition-transform active:scale-95"
                  >
                    <RotateCcw className="w-5 h-5" />
                    <span>Zurücklegen</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setConfirmDeleteId(item.id);
                      setDoubleConfirm(false);
                    }}
                    className="min-h-[48px] px-3.5 py-2.5 rounded-xl text-[var(--danger)] hover:bg-[var(--danger)]/10 font-medium flex items-center justify-center gap-1.5 transition-colors"
                    aria-label="Endgültig löschen"
                    title="Endgültig löschen"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer info */}
        <div className="p-4 bg-[var(--bg-surface-elevated)] border-t border-[var(--border-color)] text-xs text-[var(--text-muted)] text-center">
          Inhalte bleiben mindestens 90 Tage sicher in der Schublade aufbewahrt und können jederzeit zurückgelegt werden.
        </div>
      </div>

      {/* Double confirmation modal */}
      {confirmDeleteId && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/90">
          <div className="bg-[var(--bg-surface)] border-2 border-red-500 rounded-2xl max-w-md w-full p-6 text-center shadow-2xl">
            <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-3" />
            <h3 className="text-xl font-bold text-[var(--text-primary)] mb-2">
              Endgültig löschen?
            </h3>
            <p className="text-sm text-[var(--text-secondary)] mb-6">
              Dieser Text wird vollständig gelöscht und kann danach <strong>nicht mehr</strong> wiederhergestellt werden.
            </p>

            <div className="flex flex-col gap-3">
              {!doubleConfirm ? (
                <button
                  type="button"
                  onClick={() => setDoubleConfirm(true)}
                  className="min-h-[52px] py-3 rounded-xl font-bold bg-amber-600 hover:bg-amber-500 text-white text-base shadow"
                >
                  Ja, ich möchte diesen Eintrag endgültig entfernen
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => handlePermanentDelete(confirmDeleteId)}
                  className="min-h-[52px] py-3 rounded-xl font-bold bg-red-600 hover:bg-red-500 text-white text-base shadow animate-pulse"
                >
                  Jetzt wirklich unwiderruflich löschen
                </button>
              )}

              <button
                type="button"
                onClick={() => {
                  setConfirmDeleteId(null);
                  setDoubleConfirm(false);
                }}
                className="min-h-[48px] py-2.5 rounded-xl border border-[var(--border-color)] text-[var(--text-muted)] hover:text-[var(--text-primary)] font-semibold"
              >
                Abbrechen
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
