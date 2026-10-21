import React, { useState } from 'react';
import { Download, FileText, Database, Printer, X, CheckCircle } from 'lucide-react';
import { api } from '../services/api.js';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  workTitle: string;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  workTitle,
}) => {
  const [isExporting, setIsExporting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleDownload = async (format: 'markdown' | 'json') => {
    setIsExporting(true);
    setSuccessMessage(null);
    try {
      const blob = await api.exportBook(format);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = format === 'markdown'
        ? `${workTitle.replace(/\s+/g, '_')}.md`
        : `${workTitle.replace(/\s+/g, '_')}_backup.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      setSuccessMessage(
        format === 'markdown'
          ? 'Manuskript erfolgreich als Markdown (.md) heruntergeladen!'
          : 'Gesamtsicherung (.json) erfolgreich gespeichert!'
      );
    } catch (e: any) {
      alert(`Exportfehler: ${e?.message || 'Unbekannter Fehler'}`);
    } finally {
      setIsExporting(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="export-dialog-title"
    >
      <div className="w-full max-w-lg rounded-3xl bg-[var(--bg-surface-elevated)] border-2 border-[var(--border-color)] p-6 sm:p-8 shadow-2xl space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-[var(--border-color)]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[var(--accent)] text-[var(--accent-contrast)] flex items-center justify-center font-bold">
              <Download className="w-6 h-6" />
            </div>
            <div>
              <h2 id="export-dialog-title" className="text-2xl font-bold text-[var(--text-primary)]">
                Buch sichern & teilen
              </h2>
              <p className="text-xs text-[var(--text-muted)]">
                Deine Texte gehören für immer dir – sicher verwahrt und exportierbar
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="touch-target p-2 rounded-xl text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            aria-label="Schließen"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {successMessage && (
          <div className="p-3.5 rounded-xl bg-[var(--success)]/20 border border-[var(--success)] text-[var(--text-primary)] text-sm flex items-center gap-2 font-medium">
            <CheckCircle className="w-5 h-5 text-[var(--success)] shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        <div className="space-y-3">
          {/* Option 1: Markdown Book */}
          <button
            onClick={() => handleDownload('markdown')}
            disabled={isExporting}
            className="touch-target w-full p-4 rounded-2xl bg-[var(--bg-canvas)] border-2 border-[var(--border-color)] hover:border-[var(--accent)] text-left flex items-start gap-4 transition-all group"
          >
            <FileText className="w-6 h-6 text-[var(--accent)] shrink-0 mt-0.5" />
            <div>
              <div className="font-bold text-base text-[var(--text-primary)] group-hover:text-[var(--accent)]">
                Manuskript als Markdown (.md)
              </div>
              <div className="text-xs text-[var(--text-muted)] mt-0.5">
                Alle Kapitel zusammengefasst inklusive Kanonischem Weltenbuch-Anhang. Universell lesbar in Obsidian, Word oder Pandoc.
              </div>
            </div>
          </button>

          {/* Option 2: JSON Backup */}
          <button
            onClick={() => handleDownload('json')}
            disabled={isExporting}
            className="touch-target w-full p-4 rounded-2xl bg-[var(--bg-canvas)] border-2 border-[var(--border-color)] hover:border-[var(--accent)] text-left flex items-start gap-4 transition-all group"
          >
            <Database className="w-6 h-6 text-[var(--info)] shrink-0 mt-0.5" />
            <div>
              <div className="font-bold text-base text-[var(--text-primary)] group-hover:text-[var(--info)]">
                Vollständiges Backup (.json)
              </div>
              <div className="text-xs text-[var(--text-muted)] mt-0.5">
                Enthält das gesamte Werk, alle Entitäten, kanonische Fakten, Beziehungen, Zeitleisten und Recherchen.
              </div>
            </div>
          </button>

          {/* Option 3: Print / PDF */}
          <button
            onClick={handlePrint}
            className="touch-target w-full p-4 rounded-2xl bg-[var(--bg-canvas)] border-2 border-[var(--border-color)] hover:border-[var(--accent)] text-left flex items-start gap-4 transition-all group"
          >
            <Printer className="w-6 h-6 text-[var(--warning)] shrink-0 mt-0.5" />
            <div>
              <div className="font-bold text-base text-[var(--text-primary)] group-hover:text-[var(--warning)]">
                Drucken / Als PDF speichern
              </div>
              <div className="text-xs text-[var(--text-muted)] mt-0.5">
                Öffnet den browser-eigenen Druckdialog für eine saubere Druckvorschau.
              </div>
            </div>
          </button>
        </div>

        <div className="pt-2 flex justify-end">
          <button
            onClick={onClose}
            className="touch-target px-5 py-2.5 rounded-xl text-[var(--text-secondary)] font-bold text-sm hover:text-[var(--text-primary)]"
          >
            Schließen
          </button>
        </div>
      </div>
    </div>
  );
};
