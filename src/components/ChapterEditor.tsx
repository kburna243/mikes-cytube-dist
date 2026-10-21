import React, { useState, useEffect, useRef } from 'react';
import {
  Volume2,
  Mic,
  MicOff,
  AlertTriangle,
  CheckCircle,
  Plus,
  Trash2,
  ChevronDown,
  Sparkles,
  History,
  RotateCcw,
  RotateCw,
  Clock,
  Wand2,
  Bookmark,
  Award,
  Shield,
  X,
  BookOpen,
  Radio,
} from 'lucide-react';
import { Chapter, ContinuityConflict, AccessibilitySettings, Work } from '../types/domain.js';
import { speechService } from '../services/speech.js';
import { createDictationRecognition } from '../services/speech.js';
import { requestScreenWakeLock, releaseScreenWakeLock } from '../services/offlineDb.js';
import { api } from '../services/api.js';
import { LektoratPanel } from './Editor/LektoratPanel.js';
import { ZeitmaschineModal } from './Editor/ZeitmaschineModal.js';
import { VoiceNoteModal } from './Audio/VoiceNoteModal.js';
import { BookPreviewModal } from './Reader/BookPreviewModal.js';

interface ChapterEditorProps {
  chapters: Chapter[];
  currentChapterId: string;
  onSelectChapter: (id: string) => void;
  onSaveChapter: (chapter: Partial<Chapter> & { id: string }) => Promise<void>;
  onCreateChapter: () => Promise<void>;
  onDeleteChapter: (id: string) => Promise<void>;
  accessibility: AccessibilitySettings;
  onOpenAssistantForChapter: (chapterId: string, prompt?: string) => void;
  projectEpoch?: string;
  targetParagraphIndex?: number | null;
  work?: Work | null;
}

export const ChapterEditor: React.FC<ChapterEditorProps> = ({
  chapters,
  currentChapterId,
  onSelectChapter,
  onSaveChapter,
  onCreateChapter,
  onDeleteChapter,
  accessibility,
  onOpenAssistantForChapter,
  projectEpoch = '1928, Weimarer Republik / Schwarzwald',
  targetParagraphIndex = null,
  work = null,
}) => {
  const currentChapter = chapters.find((c) => c.id === currentChapterId) || chapters[0];
  const [title, setTitle] = useState(currentChapter?.title || '');
  const [body, setBody] = useState(currentChapter?.body || '');
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<string>('Gespeichert');
  const [isDictating, setIsDictating] = useState(false);
  const [dictationError, setDictationError] = useState<string | null>(null);
  const [conflicts, setConflicts] = useState<ContinuityConflict[]>([]);
  const [isCheckingContinuity, setIsCheckingContinuity] = useState(false);
  const [showChapterDropdown, setShowChapterDropdown] = useState(false);

  // Undo / Redo Buffers (Requirement 9)
  const [undoStack, setUndoStack] = useState<string[]>([]);
  const [redoStack, setRedoStack] = useState<string[]>([]);

  // Zeitmaschine Modal
  const [isZeitmaschineOpen, setIsZeitmaschineOpen] = useState(false);

  // Sprachnotiz & Probelesen Modals (Requirement 13)
  const [isVoiceNoteOpen, setIsVoiceNoteOpen] = useState(false);
  const [isBookPreviewOpen, setIsBookPreviewOpen] = useState(false);

  // Diktier-Datenschutzhinweis (Requirement 6)
  const [showDictationPrivacy, setShowDictationPrivacy] = useState(false);

  // Goldenes Lesezeichen
  const [highlightedParagraph, setHighlightedParagraph] = useState<number | null>(targetParagraphIndex);

  // Lektorat & Stil Panel
  const [isLektoratOpen, setIsLektoratOpen] = useState(false);
  const [selectedText, setSelectedText] = useState('');

  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const dictationRef = useRef<{ start: () => void; stop: () => void; isSupported: boolean } | null>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastActiveTimeRef = useRef<number>(Date.now());

  // Sync state when active chapter changes
  useEffect(() => {
    if (currentChapter) {
      setTitle(currentChapter.title);
      setBody(currentChapter.body);
      setUndoStack([]);
      setRedoStack([]);
      checkContinuity(currentChapter.id);
    }
  }, [currentChapter?.id]);

  // Target paragraph scroll if "Wo war ich?" was clicked
  useEffect(() => {
    if (targetParagraphIndex !== null) {
      setHighlightedParagraph(targetParagraphIndex);
      const timer = setTimeout(() => {
        if (textareaRef.current) {
          const lines = body.split('\n\n');
          let charOffset = 0;
          for (let i = 0; i < Math.min(targetParagraphIndex - 1, lines.length); i++) {
            charOffset += lines[i].length + 2;
          }
          textareaRef.current.setSelectionRange(charOffset, charOffset);
          textareaRef.current.focus();
        }
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [targetParagraphIndex, currentChapter?.id]);

  // Screen Wake Lock while active
  useEffect(() => {
    requestScreenWakeLock().catch(() => {});
    return () => {
      releaseScreenWakeLock();
    };
  }, []);

  // Snapshot timer: Alle 15 Minuten aktiver Schreibzeit ein Schnappschuss (Requirement 8)
  useEffect(() => {
    const interval = setInterval(async () => {
      if (!currentChapter || !body.trim()) return;
      const now = new Date();
      const timeStr = now.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
      const dayName = now.toLocaleDateString('de-DE', { weekday: 'long' });
      const label = `${dayName} ${timeStr} Uhr`;

      try {
        await api.createSnapshot(currentChapter.id, label, body);
      } catch (err) {
        console.warn('Snapshot error:', err);
      }
    }, 15 * 60 * 1000);

    return () => clearInterval(interval);
  }, [currentChapter?.id, body]);

  // Save last reading/writing position for "Wo war ich?" (Requirement 11)
  const recordPosition = (currentText: string) => {
    if (!currentChapter || !textareaRef.current) return;
    const cursor = textareaRef.current.selectionStart || 0;
    const textBefore = currentText.slice(0, cursor);
    const pIndex = textBefore.split(/\n\s*\n/).length;
    const scrollPos = textareaRef.current.scrollTop || 0;

    api.updateSettings({
      lastPosition: {
        chapterId: currentChapter.id,
        chapterTitle: currentChapter.title,
        paragraphIndex: Math.max(1, pIndex),
        scrollPosition: scrollPos,
        updatedAt: Date.now(),
      },
    }).catch(() => {});
  };

  // Autosave triggered after typing
  const triggerAutoSave = (newTitle: string, newBody: string) => {
    if (!currentChapter) return;
    setIsSaving(true);
    setLastSaved('Speichert…');
    lastActiveTimeRef.current = Date.now();

    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(async () => {
      try {
        await onSaveChapter({
          id: currentChapter.id,
          title: newTitle,
          body: newBody,
        });
        setIsSaving(false);
        setLastSaved('Gespeichert');
        checkContinuity(currentChapter.id);
        recordPosition(newBody);
      } catch (e: any) {
        setIsSaving(false);
        setLastSaved(e.message || 'Fehler beim Speichern');
      }
    }, 800);
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTitle(e.target.value);
    triggerAutoSave(e.target.value, body);
  };

  const handleBodyChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    // Push current to undoStack before modifying
    setUndoStack((prev) => [...prev.slice(-30), body]);
    setRedoStack([]);
    setBody(val);
    triggerAutoSave(title, val);
  };

  // Undo / Redo handlers (Requirement 9: Mind. 56px Knöpfe)
  const handleUndo = () => {
    if (undoStack.length === 0) return;
    const previous = undoStack[undoStack.length - 1];
    setUndoStack((prev) => prev.slice(0, prev.length - 1));
    setRedoStack((prev) => [...prev, body]);
    setBody(previous);
    triggerAutoSave(title, previous);
  };

  const handleRedo = () => {
    if (redoStack.length === 0) return;
    const next = redoStack[redoStack.length - 1];
    setRedoStack((prev) => prev.slice(0, prev.length - 1));
    setUndoStack((prev) => [...prev, body]);
    setBody(next);
    triggerAutoSave(title, next);
  };

  // Check continuity for current chapter
  const checkContinuity = async (chapterId: string) => {
    if (!chapterId) return;
    setIsCheckingContinuity(true);
    try {
      const res = await api.checkContinuity(chapterId);
      setConflicts(res.conflicts || []);
    } catch {
      // ignore
    } finally {
      setIsCheckingContinuity(false);
    }
  };

  // Dictation with privacy check (Requirement 6)
  const handleDictateClick = () => {
    if (isDictating) {
      if (dictationRef.current) dictationRef.current.stop();
      setIsDictating(false);
      releaseScreenWakeLock();
      return;
    }

    const privacyAccepted =
      accessibility.dictationPrivacyAccepted ||
      localStorage.getItem('dictation_privacy_accepted') === 'true';

    if (!privacyAccepted) {
      setShowDictationPrivacy(true);
      return;
    }

    startDictation();
  };

  const handleAcceptPrivacyAndStart = async () => {
    setShowDictationPrivacy(false);
    localStorage.setItem('dictation_privacy_accepted', 'true');
    try {
      await api.updateSettings({ dictationPrivacyAccepted: true });
    } catch {}
    startDictation();
  };

  const startDictation = () => {
    setDictationError(null);
    requestScreenWakeLock().catch(() => {});

    const recognition = createDictationRecognition(
      (transcript, isFinal) => {
        if (isFinal) {
          setBody((prev) => {
            const next = prev ? prev + ' ' + transcript : transcript;
            setUndoStack((u) => [...u.slice(-30), prev]);
            triggerAutoSave(title, next);
            return next;
          });
        }
      },
      (err) => {
        setDictationError(err);
        setIsDictating(false);
        releaseScreenWakeLock();
      },
      () => {
        setIsDictating(false);
        releaseScreenWakeLock();
      }
    );

    dictationRef.current = recognition;
    if (recognition.isSupported) {
      recognition.start();
      setIsDictating(true);
    } else {
      setDictationError('Spracherkennung auf diesem Gerät leider nicht verfügbar.');
    }
  };

  // Vorlesen handler
  const handleReadAloud = () => {
    if (speechService.isSpeaking()) {
      speechService.stop();
    } else {
      const fullText = `${title}. \n\n ${body}`;
      speechService.speak(fullText);
    }
  };

  // Quick fix for a detected continuity conflict
  const handleResolveConflict = (conflict: ContinuityConflict) => {
    if (!conflict.quote_in_chapter) return;
    let replacement = conflict.quote_in_chapter;
    if (replacement.toLowerCase().includes('braun')) {
      replacement = replacement.replace(/braun([a-z]*)/gi, 'grau$1');
    }
    const updatedBody = body.replace(conflict.quote_in_chapter, replacement);
    setUndoStack((prev) => [...prev, body]);
    setBody(updatedBody);
    triggerAutoSave(title, updatedBody);
  };

  // Lektorat Handlers
  const handleReplaceText = (searchTarget: string, replacement: string) => {
    setUndoStack((prev) => [...prev, body]);
    setRedoStack([]);
    let updated: string;
    if (body.includes(searchTarget)) {
      updated = body.replace(searchTarget, replacement);
    } else {
      const escaped = searchTarget.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      updated = body.replace(new RegExp(escaped, 'i'), replacement);
    }
    setBody(updated);
    triggerAutoSave(title, updated);
  };

  const handleAppendText = (addition: string) => {
    setUndoStack((prev) => [...prev, body]);
    setRedoStack([]);
    const updated = body + addition;
    setBody(updated);
    triggerAutoSave(title, updated);
  };

  const handleSelectText = () => {
    if (textareaRef.current) {
      const start = textareaRef.current.selectionStart;
      const end = textareaRef.current.selectionEnd;
      if (start !== end) {
        const sel = body.slice(start, end).trim();
        setSelectedText(sel);
      }
    }
  };

  // Stats, Lesezeit & Daily Word Goal (Requirement 13 & 14)
  const wordCount = body.trim() ? body.trim().split(/\s+/).length : 0;
  const bookPages = (wordCount / 250).toFixed(1);
  const readingTimeMinutes = Math.max(1, Math.round(wordCount / 180));
  const dailyGoal = accessibility.dailyWordGoal || 200;
  const goalReached = wordCount >= dailyGoal;
  const progressPercent = Math.min(100, Math.round((wordCount / dailyGoal) * 100));

  if (!currentChapter) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center">
        <h2 className="text-2xl font-bold mb-4">Kein Kapitel ausgewählt</h2>
        <button
          onClick={onCreateChapter}
          className="min-h-[56px] px-8 py-4 rounded-2xl bg-[var(--accent)] text-[var(--accent-contrast)] font-bold text-lg flex items-center gap-2 shadow"
        >
          <Plus className="w-6 h-6" /> Erstes Kapitel anlegen
        </button>
      </div>
    );
  }

  return (
    <div className={`mx-auto px-4 py-6 pb-24 transition-all ${isLektoratOpen ? 'max-w-7xl' : 'max-w-4xl'}`}>
      {/* Chapter Selection Bar & Toolbar */}
      <div
        data-tour="editor-toolbar"
        className="flex flex-wrap items-center justify-between gap-3 mb-6 p-3 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-color)] shadow-sm"
      >
        {/* Chapter Switcher Dropdown */}
        <div className="relative" data-tour="chapter-selector">
          <button
            onClick={() => setShowChapterDropdown(!showChapterDropdown)}
            className="min-h-[56px] px-5 py-3 rounded-xl bg-[var(--bg-canvas)] border border-[var(--border-color)] text-[var(--text-primary)] font-bold text-base sm:text-lg flex items-center gap-3 hover:border-[var(--accent)] shadow-sm"
            aria-expanded={showChapterDropdown}
            aria-label="Kapitel auswählen"
          >
            <span className="truncate max-w-[180px] sm:max-w-[260px]">
              {currentChapter.title}
            </span>
            <ChevronDown className="w-5 h-5 shrink-0 text-[var(--text-muted)]" />
          </button>

          {showChapterDropdown && (
            <div className="absolute left-0 top-full mt-2 z-30 w-72 sm:w-80 rounded-2xl bg-[var(--bg-surface-elevated)] border-2 border-[var(--border-color)] shadow-2xl p-2 max-h-96 overflow-y-auto">
              <div className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] px-3 py-1 mb-1">
                Kapitel im Buch
              </div>
              {chapters.map((ch) => (
                <button
                  key={ch.id}
                  onClick={() => {
                    onSelectChapter(ch.id);
                    setShowChapterDropdown(false);
                  }}
                  className={`w-full text-left px-3 py-3 rounded-xl font-medium text-base mb-1 transition-colors flex items-center justify-between ${
                    ch.id === currentChapter.id
                      ? 'bg-[var(--accent)] text-[var(--accent-contrast)] font-bold'
                      : 'text-[var(--text-primary)] hover:bg-[var(--bg-canvas)]'
                  }`}
                >
                  <span className="truncate">{ch.title}</span>
                  <span className="text-xs opacity-75 shrink-0 ml-2">
                    {ch.body.length > 0 ? `${ch.body.trim().split(/\s+/).length} W.` : 'leer'}
                  </span>
                </button>
              ))}
              <div className="border-t border-[var(--border-color)] my-1 pt-1">
                <button
                  onClick={() => {
                    setShowChapterDropdown(false);
                    onCreateChapter();
                  }}
                  className="w-full text-left px-3 py-2.5 rounded-xl font-bold text-[var(--accent)] hover:bg-[var(--bg-canvas)] flex items-center gap-2"
                >
                  <Plus className="w-5 h-5" /> Neues Kapitel anlegen
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Big Undo & Redo Buttons (Requirement 9: mind. 56px) */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleUndo}
            disabled={undoStack.length === 0}
            className={`min-h-[56px] min-w-[56px] px-4 rounded-xl font-bold text-base flex items-center justify-center gap-2 border transition-all ${
              undoStack.length > 0
                ? 'bg-[var(--bg-canvas)] border-[var(--border-color)] hover:border-[var(--accent)] text-[var(--text-primary)] shadow-sm'
                : 'opacity-40 bg-[var(--bg-canvas)] border-transparent text-[var(--text-muted)] cursor-not-allowed'
            }`}
            aria-label="Rückgängig machen"
            title="Macht den letzten Schreibschritt rückgängig"
          >
            <RotateCcw className="w-6 h-6 text-amber-400" />
            <span className="hidden md:inline font-semibold">Rückgängig</span>
          </button>

          <button
            type="button"
            onClick={handleRedo}
            disabled={redoStack.length === 0}
            className={`min-h-[56px] min-w-[56px] px-4 rounded-xl font-bold text-base flex items-center justify-center gap-2 border transition-all ${
              redoStack.length > 0
                ? 'bg-[var(--bg-canvas)] border-[var(--border-color)] hover:border-[var(--accent)] text-[var(--text-primary)] shadow-sm'
                : 'opacity-40 bg-[var(--bg-canvas)] border-transparent text-[var(--text-muted)] cursor-not-allowed'
            }`}
            aria-label="Wiederholen"
            title="Stellt den rückgängig gemachten Schritt wieder her"
          >
            <RotateCw className="w-6 h-6 text-amber-400" />
            <span className="hidden md:inline font-semibold">Wiederholen</span>
          </button>

          {/* Zeitmaschine Knopf (Requirement 8) */}
          <button
            type="button"
            onClick={() => setIsZeitmaschineOpen(true)}
            className="min-h-[56px] px-4 rounded-xl bg-[var(--bg-canvas)] border border-[var(--border-color)] hover:border-[var(--accent)] text-[var(--text-primary)] font-bold text-base flex items-center gap-2 shadow-sm"
            aria-label="Kapitel-Zeitmaschine öffnen"
            title="Frühere Fassungen ansehen oder zurückholen"
          >
            <History className="w-6 h-6 text-blue-400" />
            <span className="hidden lg:inline">Zeitmaschine</span>
          </button>
        </div>

        {/* Action Buttons: Sprach- & Schreibhelfer, Sprachnotiz, Buch-Probelesen, Vorlesen, Diktieren */}
        <div data-tour="editor-actions" className="flex items-center gap-2 sm:gap-3 flex-wrap">
          {/* Sprach- & Schreibhelfer (formerly Lektorat & Stil) */}
          <button
            onClick={() => setIsLektoratOpen(!isLektoratOpen)}
            className={`min-h-[56px] px-4 rounded-xl font-bold text-sm sm:text-base flex items-center gap-2 shadow-sm transition-all ${
              isLektoratOpen
                ? 'bg-[var(--accent)] text-[var(--accent-contrast)] ring-2 ring-[var(--accent)] shadow-md'
                : 'bg-[var(--bg-canvas)] border border-[var(--border-color)] hover:border-[var(--accent)] text-[var(--text-primary)]'
            }`}
            aria-expanded={isLektoratOpen}
            aria-label="Sprach- & Schreibhelfer öffnen"
            title="Andere Wörter finden, Zeitabschnitt prüfen und Figuren-Abgleich"
          >
            <Wand2 className="w-6 h-6 text-[var(--accent)]" />
            <span className="hidden sm:inline">Schreib-Helfer</span>
          </button>

          {/* Sprachnotiz aufnehmen (qwen-audio-3.0-asr-flash - Anforderung 13) */}
          <button
            type="button"
            onClick={() => setIsVoiceNoteOpen(true)}
            className="min-h-[56px] px-4 rounded-xl bg-[var(--bg-canvas)] border border-[var(--border-color)] hover:border-purple-400 text-[var(--text-primary)] font-bold text-sm sm:text-base flex items-center gap-2 shadow-sm"
            aria-label="Sprachnotiz aufnehmen"
            title="Schnelle Gedanken einsprechen & mit qwen-audio-3.0-asr-flash transkribieren"
          >
            <Radio className="w-6 h-6 text-purple-400" />
            <span className="hidden md:inline">Sprachnotiz</span>
          </button>

          {/* Buch-Probelesemodus (Anforderung 13) */}
          <button
            type="button"
            onClick={() => setIsBookPreviewOpen(true)}
            className="min-h-[56px] px-4 rounded-xl bg-[var(--bg-canvas)] border border-[var(--border-color)] hover:border-amber-400 text-[var(--text-primary)] font-bold text-sm sm:text-base flex items-center gap-2 shadow-sm"
            aria-label="Buch-Probelesemodus öffnen"
            title="Doppelseitiges Buchlayout mit Serifenschrift & Seitenzahlen"
          >
            <BookOpen className="w-6 h-6 text-amber-500" />
            <span className="hidden md:inline">Probelesen</span>
          </button>

          {/* TTS Vorlesen Button */}
          <button
            onClick={handleReadAloud}
            className="min-h-[56px] px-4 rounded-xl bg-[var(--bg-canvas)] border border-[var(--border-color)] hover:border-[var(--accent)] text-[var(--text-primary)] font-bold text-sm sm:text-base flex items-center gap-2 shadow-sm"
            aria-label="Kapitel vorlesen"
            title="Liest dieses Kapitel mit ruhiger deutscher Stimme vor"
          >
            <Volume2 className="w-6 h-6 text-[var(--accent)]" />
            <span className="hidden sm:inline">Vorlesen</span>
          </button>

          {/* Diktat / STT Button */}
          <button
            onClick={handleDictateClick}
            className={`min-h-[56px] px-5 rounded-xl font-bold text-sm sm:text-base flex items-center gap-2 shadow-sm transition-all ${
              isDictating
                ? 'bg-[var(--danger)] text-white border-2 border-[var(--danger)] animate-pulse'
                : 'bg-[var(--bg-canvas)] border border-[var(--border-color)] hover:border-[var(--accent)] text-[var(--text-primary)]'
            }`}
            aria-label={isDictating ? 'Diktat beenden' : 'Diktieren starten'}
            title="Sprich deinen Text ein, er wird automatisch geschrieben"
          >
            {isDictating ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6 text-[var(--info)]" />}
            <span>{isDictating ? 'Aufnahme…' : 'Diktieren'}</span>
          </button>
        </div>
      </div>

      {/* Dictation Privacy Modal (Requirement 6: Pflicht) */}
      {showDictationPrivacy && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm"
        >
          <div className="bg-[var(--bg-surface)] border-2 border-[var(--border-focus)] rounded-3xl max-w-lg w-full p-8 text-center shadow-2xl">
            <div className="p-4 bg-blue-500/20 text-blue-400 rounded-2xl w-fit mx-auto mb-4">
              <Shield className="w-10 h-10" />
            </div>
            <h3 className="text-2xl font-bold text-[var(--text-primary)] mb-3">
              Hinweis zum Diktieren
            </h3>
            <p className="text-lg text-[var(--text-secondary)] leading-relaxed mb-8">
              Beim Diktieren wird deine Stimme von Google in Text umgewandelt.
            </p>
            <button
              type="button"
              onClick={handleAcceptPrivacyAndStart}
              className="min-h-[56px] w-full py-4 px-6 rounded-2xl font-bold text-xl bg-[var(--accent)] text-[var(--accent-contrast)] shadow-xl hover:opacity-95 transition-transform active:scale-95"
            >
              Verstanden
            </button>
          </div>
        </div>
      )}

      {/* Dictation error banner if any */}
      {dictationError && (
        <div
          className="mb-4 p-4 rounded-2xl bg-[var(--danger)]/20 border-2 border-[var(--danger)] text-[var(--text-primary)] text-base flex items-center justify-between"
          role="alert"
        >
          <span>Mikrofon-Hinweis: {dictationError}</span>
          <button
            onClick={() => setDictationError(null)}
            className="font-bold underline ml-4 p-2"
          >
            Schließen
          </button>
        </div>
      )}

      {/* Gedächtnis-Helfer Banner (einfache Sprache für Kontinuitätsprüfung) */}
      {conflicts.length > 0 && (
        <div
          className="mb-6 p-5 rounded-2xl bg-amber-500/15 border-2 border-amber-500/60 shadow-lg"
          role="region"
          aria-label="Gedächtnis-Helfer"
        >
          <div className="flex items-center gap-2 font-bold text-xl text-amber-400 mb-2">
            <AlertTriangle className="w-6 h-6 shrink-0" />
            <span>Gedächtnis-Helfer: Kleiner Widerspruch zu deinen Figuren ({conflicts.length})</span>
          </div>
          {conflicts.map((conf) => (
            <div
              key={conf.id}
              className="mt-3 p-4 rounded-xl bg-[var(--bg-canvas)] border border-[var(--border-color)] text-base"
            >
              <div className="font-semibold text-[var(--text-primary)]">
                Im Text steht: <mark className="bg-amber-300 text-black px-1.5 py-0.5 rounded font-bold">»{conf.quote_in_chapter}«</mark>
              </div>
              <div className="text-[var(--text-secondary)] mt-1">
                Aus deinen Figuren-Notizen ({conf.entity_name}): <strong className="text-[var(--accent)]">»{conf.canonical_fact}«</strong>
              </div>
              <div className="text-sm text-[var(--text-muted)] mt-1">
                {conf.suggestion}
              </div>
              <div className="mt-4 flex flex-wrap items-center gap-3">
                <button
                  onClick={() => handleResolveConflict(conf)}
                  className="min-h-[48px] px-5 py-2.5 rounded-xl bg-[var(--accent)] text-[var(--accent-contrast)] font-bold text-base flex items-center gap-2 hover:opacity-90 shadow-sm"
                >
                  <CheckCircle className="w-5 h-5" /> Auf Figuren-Notiz korrigieren
                </button>
                <button
                  onClick={() => onOpenAssistantForChapter(currentChapter.id, `Wie lösen wir den Widerspruch zwischen '${conf.quote_in_chapter}' und dem Kanon '${conf.canonical_fact}' auf?`)}
                  className="text-base font-semibold underline text-[var(--text-secondary)] hover:text-[var(--text-primary)] p-2"
                >
                  Im Co-Pilot nachfragen
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Main Layout: Editor & Lektorat Side-by-Side */}
      <div className={`flex flex-col ${isLektoratOpen ? 'lg:flex-row gap-6 items-start' : ''}`}>
        {/* Left Column: Manuscript Title, Prose Editor, Footer */}
        <div className="flex-1 w-full min-w-0">
          {/* Chapter Title Input */}
          <div className="mb-4">
            <label htmlFor="chapter-title" className="block text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] mb-1">
              Kapiteltitel
            </label>
            <input
              id="chapter-title"
              type="text"
              value={title}
              onChange={handleTitleChange}
              placeholder="Kapiteltitel eingeben…"
              className="w-full text-2xl sm:text-3xl font-bold bg-transparent border-b-2 border-[var(--border-color)] focus:border-[var(--accent)] pb-2 text-[var(--text-primary)] placeholder-[var(--text-muted)] transition-colors"
            />
          </div>

          {/* Golden Bookmark indicator if navigated here */}
          {highlightedParagraph !== null && (
            <div className="mb-3 p-3 bg-amber-500/20 border-2 border-amber-400 rounded-xl flex items-center justify-between animate-pulse">
              <div className="flex items-center gap-2 text-amber-300 font-bold text-sm">
                <Bookmark className="w-5 h-5 fill-amber-400" />
                <span>Goldenes Lesezeichen: Zuletzt gelesener Absatz {highlightedParagraph}</span>
              </div>
              <button
                type="button"
                onClick={() => setHighlightedParagraph(null)}
                className="text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)]"
              >
                Ausblenden
              </button>
            </div>
          )}

          {/* Main Prose Editor (A1: 20px+ font, A4: max 68 chars measure, line-height 1.7) */}
          <div className="relative" data-tour="editor-body" lang="de-DE">
            <label htmlFor="manuscript-editor" className="sr-only">
              Kapiteltext Manuskript
            </label>
            <textarea
              ref={textareaRef}
              id="manuscript-editor"
              value={body}
              onChange={handleBodyChange}
              onSelect={handleSelectText}
              onMouseUp={handleSelectText}
              onKeyUp={handleSelectText}
              spellCheck={true}
              lang="de-DE"
              placeholder="Beginne hier zu schreiben oder nutze das Diktiergerät oben…"
              rows={16}
              style={{
                fontSize: `${accessibility.fontSizePx}px`,
                lineHeight: accessibility.lineHeight,
              }}
              className="w-full p-5 sm:p-7 rounded-2xl bg-[var(--bg-surface)] text-[var(--text-primary)] border-2 border-[var(--border-color)] focus:border-[var(--border-focus)] transition-colors resize-y prose-measure shadow-inner"
            />
          </div>

          {/* Quiet Daily Goal Congratulation (Requirement 14: kein Konfetti-Gewitter) */}
          {goalReached && (
            <div className="mt-4 p-4 bg-emerald-500/15 border-2 border-emerald-500/50 rounded-2xl flex items-center gap-3 text-emerald-300 font-medium">
              <Award className="w-7 h-7 shrink-0 text-emerald-400" />
              <span>
                Geschafft! Du hast dein heutiges Schreibziel von {dailyGoal} Wörtern erreicht. 📖
              </span>
            </div>
          )}

          {/* Editor Footer: Autosave Status, Word Count, Reading Time & Daily Goal mit Fortschrittsring */}
          <div className="mt-4 flex flex-wrap items-center justify-between gap-4 text-base text-[var(--text-secondary)]">
            <div className="flex flex-wrap items-center gap-3">
              <span className="flex items-center gap-1.5 font-medium">
                <CheckCircle className={`w-5 h-5 ${isSaving ? 'text-[var(--warning)] animate-spin' : 'text-[var(--success)]'}`} />
                {lastSaved}
              </span>
              <span aria-hidden="true">·</span>
              <span className="font-semibold">{wordCount} Wörter</span>
              <span aria-hidden="true">·</span>
              <span>ca. {bookPages} Buchseiten</span>
              <span aria-hidden="true">·</span>
              {/* Lesezeit-Schätzung (Anforderung 13) */}
              <span className="flex items-center gap-1.5 font-medium text-amber-300">
                <Clock className="w-4 h-4 text-amber-400" />
                ca. {readingTimeMinutes} Min. Lesezeit
              </span>
              <span aria-hidden="true">·</span>
              {/* Sanfter Fortschrittsring für Tagesziel (Anforderung 13) */}
              <div
                className="flex items-center gap-2 px-2.5 py-1 rounded-xl bg-[var(--bg-canvas)] border border-[var(--border-color)]"
                title={`Tagesziel: ${wordCount} von ${dailyGoal} Wörtern (${progressPercent}%)`}
              >
                <svg className="w-5 h-5 -rotate-90 shrink-0" viewBox="0 0 36 36">
                  <path
                    className="text-[var(--border-color)]"
                    strokeWidth="4"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  <path
                    className={goalReached ? 'text-emerald-400' : 'text-amber-400'}
                    strokeDasharray={`${progressPercent}, 100`}
                    strokeWidth="4"
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                </svg>
                <span className="text-xs font-bold text-[var(--text-primary)]">
                  Ziel: {wordCount}/{dailyGoal} W.
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  if (confirm(`Möchtest du Kapitel »${currentChapter.title}« in die Schreibtisch-Schublade legen? Es kann dort jederzeit zurückgeholt werden.`)) {
                    onDeleteChapter(currentChapter.id);
                  }
                }}
                className="min-h-[48px] px-4 py-2 rounded-xl text-[var(--danger)] hover:bg-[var(--danger)]/10 font-medium flex items-center gap-2 text-sm transition-colors"
                aria-label="In die Schreibtisch-Schublade legen"
              >
                <Trash2 className="w-5 h-5" /> In die Schublade legen
              </button>
            </div>
          </div>
        </div>

        {/* Right Column / Side-Panel: LektoratPanel */}
        <LektoratPanel
          chapterId={currentChapter.id}
          chapterTitle={currentChapter.title}
          text={body}
          selectedText={selectedText}
          onReplaceText={handleReplaceText}
          onAppendText={handleAppendText}
          onUndoLastChange={handleUndo}
          canUndo={undoStack.length > 0}
          accessibility={accessibility}
          isOpen={isLektoratOpen}
          onToggle={() => setIsLektoratOpen(!isLektoratOpen)}
          projectEpoch={projectEpoch}
        />
      </div>

      {/* Kapitel-Zeitmaschine Modal (Anforderung 8) */}
      <ZeitmaschineModal
        chapterId={currentChapter.id}
        chapterTitle={currentChapter.title}
        currentBody={body}
        isOpen={isZeitmaschineOpen}
        onClose={() => setIsZeitmaschineOpen(false)}
        onRestore={(restored) => {
          setUndoStack((prev) => [...prev, body]);
          setBody(restored);
          triggerAutoSave(title, restored);
        }}
      />

      {/* Buch-Probelesemodus Modal (Anforderung 13) */}
      <BookPreviewModal
        isOpen={isBookPreviewOpen}
        onClose={() => setIsBookPreviewOpen(false)}
        work={work}
        chapters={chapters}
        currentChapterId={currentChapter.id}
        accessibility={accessibility}
      />

      {/* Sprachnotiz-Transkription Modal (Anforderung 13) */}
      <VoiceNoteModal
        isOpen={isVoiceNoteOpen}
        onClose={() => setIsVoiceNoteOpen(false)}
        chapterId={currentChapter.id}
        chapterTitle={currentChapter.title}
        onAppendToChapter={(addition) => handleAppendText(addition)}
        onSaveAsResearch={async (noteTitle, content) => {
          await api.saveResearch({
            id: `res-voice-${Date.now()}`,
            title: noteTitle,
            type: 'note',
            content,
            tags: ['Sprachnotiz', 'Diktat'],
            created_at: Date.now(),
          });
        }}
      />
    </div>
  );
};
