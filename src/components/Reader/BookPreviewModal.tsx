import React, { useState, useEffect, useMemo } from 'react';
import {
  BookOpen,
  ChevronLeft,
  ChevronRight,
  X,
  Volume2,
  Type,
  Maximize2,
  Minimize2,
  Columns,
  Square,
} from 'lucide-react';
import { Chapter, Work, AccessibilitySettings } from '../../types/domain.js';
import { speechService } from '../../services/speech.js';

interface BookPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  work: Work | null;
  chapters: Chapter[];
  currentChapterId: string;
  accessibility: AccessibilitySettings;
}

export const BookPreviewModal: React.FC<BookPreviewModalProps> = ({
  isOpen,
  onClose,
  work,
  chapters,
  currentChapterId,
  accessibility,
}) => {
  const [selectedChapterId, setSelectedChapterId] = useState(currentChapterId);
  const [pageIndex, setPageIndex] = useState(0); // 0 = first spread (pages 1 & 2)
  const [serifSize, setSerifSize] = useState<number>(20);
  const [forceSinglePage, setForceSinglePage] = useState<boolean>(false);

  const activeChapter = chapters.find((c) => c.id === selectedChapterId) || chapters[0];

  useEffect(() => {
    if (currentChapterId) {
      setSelectedChapterId(currentChapterId);
      setPageIndex(0);
    }
  }, [currentChapterId, isOpen]);

  // Split chapter body into realistic book pages (~220 words or paragraph boundaries)
  const bookPages = useMemo(() => {
    if (!activeChapter || !activeChapter.body.trim()) {
      return ['(Dieses Kapitel hat noch keinen Text.)'];
    }

    const paragraphs = activeChapter.body.split(/\n\s*\n/).filter((p) => p.trim());
    const pages: string[] = [];
    let currentPage = '';
    let currentWords = 0;

    for (const p of paragraphs) {
      const wordsInP = p.trim().split(/\s+/).length;
      if (currentWords > 0 && currentWords + wordsInP > 230) {
        pages.push(currentPage.trim());
        currentPage = p + '\n\n';
        currentWords = wordsInP;
      } else {
        currentPage += p + '\n\n';
        currentWords += wordsInP;
      }
    }

    if (currentPage.trim()) {
      pages.push(currentPage.trim());
    }

    return pages.length > 0 ? pages : ['(Keine Seiten verfügbar)'];
  }, [activeChapter?.body]);

  const totalPages = bookPages.length;
  // If double page, we step by 2: spread 0 = pages 1 & 2; spread 1 = pages 3 & 4
  const step = forceSinglePage ? 1 : 2;
  const maxSpreadIndex = Math.max(0, Math.ceil(totalPages / step) - 1);
  const currentSpread = Math.min(pageIndex, maxSpreadIndex);

  const leftPageIndex = currentSpread * step;
  const rightPageIndex = !forceSinglePage && leftPageIndex + 1 < totalPages ? leftPageIndex + 1 : null;

  const leftPageText = bookPages[leftPageIndex] || '';
  const rightPageText = rightPageIndex !== null ? bookPages[rightPageIndex] : null;

  // Keyboard navigation: Pfeiltasten links/rechts
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'PageDown') {
        handleNext();
      } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        handlePrev();
      } else if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, currentSpread, maxSpreadIndex]);

  const handleNext = () => {
    if (currentSpread < maxSpreadIndex) {
      setPageIndex((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentSpread > 0) {
      setPageIndex((prev) => prev - 1);
    }
  };

  const handleReadSpread = () => {
    if (speechService.isSpeaking()) {
      speechService.stop();
      return;
    }
    const combined = [leftPageText, rightPageText].filter(Boolean).join('\n\n');
    speechService.speak(combined);
  };

  if (!isOpen) return null;

  const bookTitle = work?.title || 'Schatten über Altwald';

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Buch-Probelesemodus"
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-6 bg-black/90 backdrop-blur-md overflow-y-auto"
    >
      <div className="w-full max-w-6xl rounded-3xl bg-[#fdfbf7] text-[#1c1917] border-4 border-[#78350f]/30 shadow-2xl flex flex-col max-h-[94vh] overflow-hidden">
        {/* Top Header Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-4 bg-[#f5ede0] border-b-2 border-[#d7c4a7] text-[#451a03]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#78350f] text-white flex items-center justify-center font-bold">
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-serif font-black tracking-tight text-[#451a03]">
                Buch-Probelesemodus
              </h2>
              <p className="text-xs text-[#78350f]/80 font-sans">
                Doppelseitiges Buchlayout mit Serifenschrift & Seitenzahlen
              </p>
            </div>
          </div>

          {/* Controls: Chapter Select, Font Size, Layout Toggle, TTS, Close */}
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            {/* Chapter Picker */}
            <select
              value={selectedChapterId}
              onChange={(e) => {
                setSelectedChapterId(e.target.value);
                setPageIndex(0);
              }}
              className="px-3 py-2 rounded-xl bg-white border border-[#b49875] text-[#451a03] font-serif text-sm font-bold shadow-sm focus:outline-none"
              aria-label="Kapitel für Buchansicht wählen"
            >
              {chapters.map((ch) => (
                <option key={ch.id} value={ch.id}>
                  {ch.title}
                </option>
              ))}
            </select>

            {/* Font Size Button */}
            <div className="flex items-center gap-1 bg-white border border-[#b49875] rounded-xl px-2 py-1">
              <button
                type="button"
                onClick={() => setSerifSize((s) => Math.max(16, s - 2))}
                className="px-2 py-1 font-bold text-sm text-[#78350f] hover:bg-[#f5ede0] rounded"
                title="Schrift verkleinern"
              >
                A-
              </button>
              <span className="text-xs font-mono text-[#78350f]">{serifSize}px</span>
              <button
                type="button"
                onClick={() => setSerifSize((s) => Math.min(28, s + 2))}
                className="px-2 py-1 font-bold text-sm text-[#78350f] hover:bg-[#f5ede0] rounded"
                title="Schrift vergrößern"
              >
                A+
              </button>
            </div>

            {/* Page Mode Toggle */}
            <button
              type="button"
              onClick={() => setForceSinglePage(!forceSinglePage)}
              className="p-2.5 rounded-xl border border-[#b49875] bg-white text-[#78350f] hover:bg-[#f5ede0] font-bold text-xs flex items-center gap-1.5 shadow-sm hidden md:flex"
              title={forceSinglePage ? 'Auf Doppelseite wechseln' : 'Auf Einzelseite wechseln'}
            >
              {forceSinglePage ? <Columns className="w-4 h-4" /> : <Square className="w-4 h-4" />}
              <span>{forceSinglePage ? 'Doppelseite' : 'Einzelseite'}</span>
            </button>

            {/* Read Spread (TTS) */}
            <button
              type="button"
              onClick={handleReadSpread}
              className="p-2.5 rounded-xl border border-[#b49875] bg-white text-[#78350f] hover:bg-[#f5ede0] font-bold text-xs flex items-center gap-1.5 shadow-sm"
              title="Aktuelle Doppelseite vorlesen"
            >
              <Volume2 className="w-4 h-4" />
              <span className="hidden sm:inline">Vorlesen</span>
            </button>

            {/* Close */}
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-[#78350f] hover:bg-[#e7d8c0] touch-target"
              aria-label="Buch-Modus schließen"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Book Body: Two Pages side by side with spine crease */}
        <div className="flex-1 p-4 sm:p-8 overflow-y-auto bg-[#faf6ed]">
          <div className="mx-auto max-w-5xl rounded-2xl bg-[#fffefc] border-2 border-[#d5c3a5] shadow-2xl overflow-hidden flex flex-col md:flex-row min-h-[520px]">
            {/* Left Page */}
            <div className="flex-1 p-6 sm:p-10 flex flex-col justify-between border-b md:border-b-0 md:border-r border-[#d5c3a5] relative">
              {/* Kolumnentitel oben */}
              <div className="text-center font-serif text-xs italic tracking-widest text-[#78350f]/70 uppercase pb-4 border-b border-[#e9ded0]">
                {bookTitle}
              </div>

              {/* Seiteninhalt in edler Serifenschrift */}
              <div
                className="py-6 font-serif leading-relaxed text-[#1c1917] whitespace-pre-line select-text"
                style={{ fontSize: `${serifSize}px`, lineHeight: 1.8 }}
              >
                {leftPageText}
              </div>

              {/* Echte Seitenzahl unten */}
              <div className="text-center font-serif text-sm font-bold text-[#78350f]/80 pt-4 border-t border-[#e9ded0]">
                — {leftPageIndex + 1} —
              </div>
            </div>

            {/* Right Page (or placeholder if single / odd end) */}
            {!forceSinglePage && (
              <div className="flex-1 p-6 sm:p-10 flex flex-col justify-between relative bg-[#fffdfa] shadow-inner">
                {/* Buchfalz-Schatten links */}
                <div
                  aria-hidden="true"
                  className="absolute left-0 top-0 bottom-0 w-4 bg-gradient-to-r from-black/10 to-transparent pointer-events-none"
                />

                {/* Kolumnentitel oben */}
                <div className="text-center font-serif text-xs italic tracking-widest text-[#78350f]/70 uppercase pb-4 border-b border-[#e9ded0] truncate">
                  {activeChapter.title}
                </div>

                {/* Seiteninhalt in edler Serifenschrift */}
                <div
                  className="py-6 font-serif leading-relaxed text-[#1c1917] whitespace-pre-line select-text"
                  style={{ fontSize: `${serifSize}px`, lineHeight: 1.8 }}
                >
                  {rightPageText || (
                    <span className="text-[#a89984] italic">
                      [Ende des Kapitels]
                    </span>
                  )}
                </div>

                {/* Echte Seitenzahl unten */}
                <div className="text-center font-serif text-sm font-bold text-[#78350f]/80 pt-4 border-t border-[#e9ded0]">
                  {rightPageIndex !== null ? `— ${rightPageIndex + 1} —` : ''}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Bottom Pagination & Turn Controls */}
        <div className="flex items-center justify-between px-6 py-4 bg-[#f5ede0] border-t-2 border-[#d7c4a7]">
          <button
            type="button"
            onClick={handlePrev}
            disabled={currentSpread === 0}
            className={`min-h-[52px] px-6 py-3 rounded-2xl font-serif font-bold text-base flex items-center gap-2 border shadow-sm transition-all ${
              currentSpread > 0
                ? 'bg-white border-[#b49875] text-[#78350f] hover:bg-[#fff9ed] active:scale-95'
                : 'opacity-40 bg-[#f5ede0] border-transparent text-[#a89984] cursor-not-allowed'
            }`}
            aria-label="Vorherige Doppelseite"
          >
            <ChevronLeft className="w-5 h-5" />
            <span>Zurückblättern</span>
          </button>

          <div className="text-center font-serif text-sm font-bold text-[#78350f]">
            Doppelseite {currentSpread + 1} von {maxSpreadIndex + 1} (Seiten {leftPageIndex + 1}
            {rightPageIndex !== null ? `–${rightPageIndex + 1}` : ''} von {totalPages})
          </div>

          <button
            type="button"
            onClick={handleNext}
            disabled={currentSpread >= maxSpreadIndex}
            className={`min-h-[52px] px-6 py-3 rounded-2xl font-serif font-bold text-base flex items-center gap-2 border shadow-sm transition-all ${
              currentSpread < maxSpreadIndex
                ? 'bg-[#78350f] text-white hover:opacity-95 active:scale-95'
                : 'opacity-40 bg-[#f5ede0] border-transparent text-[#a89984] cursor-not-allowed'
            }`}
            aria-label="Nächste Doppelseite"
          >
            <span>Weiterblättern</span>
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};
