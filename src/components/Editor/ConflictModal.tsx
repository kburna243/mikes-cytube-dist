import React, { useState } from 'react';
import { SyncConflict, offlineDb } from '../../services/offlineDb.js';
import { Tablet, Cloud, Check, Copy, AlertTriangle } from 'lucide-react';

interface ConflictModalProps {
  conflict: SyncConflict;
  onResolved: (chosenContent: string) => void;
  onKeepBoth?: (tabletContent: string) => void;
}

export const ConflictModal: React.FC<ConflictModalProps> = ({
  conflict,
  onResolved,
  onKeepBoth,
}) => {
  const [activeTab, setActiveTab] = useState<'tablet' | 'server'>('tablet');

  const localWords = conflict.localContent.trim() ? conflict.localContent.trim().split(/\s+/).length : 0;
  const serverWords = conflict.serverContent.trim() ? conflict.serverContent.trim().split(/\s+/).length : 0;

  const handleChoose = async (content: string) => {
    await offlineDb.resolveConflict(conflict.chapterId, content);
    onResolved(content);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="conflict-dialog-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
    >
      <div className="bg-[var(--bg-surface)] border-2 border-[var(--border-focus)] rounded-2xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl p-6 sm:p-8">
        {/* Header */}
        <div className="flex items-start gap-4 mb-6">
          <div className="p-3 bg-amber-500/20 text-amber-400 rounded-xl">
            <AlertTriangle className="w-8 h-8" />
          </div>
          <div>
            <h2 id="conflict-dialog-title" className="text-2xl font-bold leading-snug">
              Auf dem Tablet und auf dem Server gibt es zwei Fassungen. Welche möchtest du behalten?
            </h2>
            <p className="text-[var(--text-muted)] text-base mt-1">
              Kapitel: <span className="font-semibold text-[var(--text-primary)]">{conflict.chapterTitle}</span>
            </p>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex gap-2 p-1 bg-[var(--bg-surface-elevated)] rounded-xl mb-4">
          <button
            type="button"
            onClick={() => setActiveTab('tablet')}
            className={`flex-1 py-3 px-4 rounded-lg font-bold text-base flex items-center justify-center gap-2 transition-colors ${
              activeTab === 'tablet'
                ? 'bg-[var(--accent)] text-[var(--accent-contrast)] shadow-md'
                : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
            }`}
          >
            <Tablet className="w-5 h-5" />
            <span>Fassung auf diesem Tablet ({localWords} Wörter)</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('server')}
            className={`flex-1 py-3 px-4 rounded-lg font-bold text-base flex items-center justify-center gap-2 transition-colors ${
              activeTab === 'server'
                ? 'bg-[var(--accent)] text-[var(--accent-contrast)] shadow-md'
                : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
            }`}
          >
            <Cloud className="w-5 h-5" />
            <span>Fassung auf dem Server ({serverWords} Wörter)</span>
          </button>
        </div>

        {/* Text Preview */}
        <div className="flex-1 overflow-y-auto p-4 bg-[var(--bg-canvas)] rounded-xl border border-[var(--border-color)] mb-6 font-serif text-lg leading-relaxed whitespace-pre-wrap select-text">
          {activeTab === 'tablet' ? conflict.localContent : conflict.serverContent}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 pt-2 border-t border-[var(--border-color)]">
          <button
            type="button"
            onClick={() => handleChoose(conflict.localContent)}
            className="flex-1 min-h-[56px] px-6 py-4 rounded-xl font-bold text-lg bg-emerald-600 hover:bg-emerald-500 text-white flex items-center justify-center gap-2 shadow-lg transition-transform active:scale-95"
          >
            <Tablet className="w-6 h-6" />
            <span>Tablet-Fassung behalten</span>
          </button>

          <button
            type="button"
            onClick={() => handleChoose(conflict.serverContent)}
            className="flex-1 min-h-[56px] px-6 py-4 rounded-xl font-bold text-lg bg-blue-600 hover:bg-blue-500 text-white flex items-center justify-center gap-2 shadow-lg transition-transform active:scale-95"
          >
            <Cloud className="w-6 h-6" />
            <span>Server-Fassung behalten</span>
          </button>

          {onKeepBoth && (
            <button
              type="button"
              onClick={() => onKeepBoth(conflict.localContent)}
              className="min-h-[56px] px-5 py-4 rounded-xl font-bold text-base bg-[var(--bg-surface-elevated)] border border-[var(--border-color)] text-[var(--text-primary)] hover:border-[var(--accent)] flex items-center justify-center gap-2 transition-colors"
            >
              <Copy className="w-5 h-5" />
              <span>Beide behalten</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
