import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  BookOpen,
  Volume2,
  Clock,
  Eye,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
  Search,
  ChevronRight,
  ChevronDown,
  Wand2,
  Check,
  Ear,
  Hand,
  Flame,
  Coffee,
  X,
  History,
  Info,
  Zap,
  Plus,
  Trash2,
  Sliders,
  ShieldCheck,
} from 'lucide-react';
import { api } from '../../services/api.js';
import { speechService } from '../../services/speech.js';
import {
  checkSpellingAndGrammar,
  getCustomDictionary,
  addWordToCustomDictionary,
  removeWordFromCustomDictionary,
  SpellError,
} from '../../services/spellcheck.js';
import { fetchThesaurusSynonyms } from '../../services/thesaurus.js';
import { AccessibilitySettings } from '../../types/domain.js';

export interface LektoratPanelProps {
  chapterId: string;
  chapterTitle: string;
  text: string;
  selectedText: string;
  onReplaceText: (searchTarget: string, replacement: string, reason?: string) => void;
  onAppendText: (addition: string) => void;
  onUndoLastChange?: () => void;
  canUndo?: boolean;
  accessibility: AccessibilitySettings;
  isOpen: boolean;
  onToggle: () => void;
  projectEpoch?: string;
}

type ActiveSection = 'spelling' | 'thesaurus' | 'epoch' | 'canon' | 'senses';

export const LektoratPanel: React.FC<LektoratPanelProps> = ({
  chapterId,
  chapterTitle,
  text,
  selectedText,
  onReplaceText,
  onAppendText,
  onUndoLastChange,
  canUndo,
  accessibility,
  isOpen,
  onToggle,
  projectEpoch = '1928, Weimarer Republik / Schwarzwald',
}) => {
  const [activeSection, setActiveSection] = useState<ActiveSection>('thesaurus');

  // 1. Rechtschreibung & Benutzerdefiniertes Wörterbuch (Nativ + Typo-JS)
  const [spellErrors, setSpellErrors] = useState<SpellError[]>([]);
  const [hasCheckedSpelling, setHasCheckedSpelling] = useState(false);
  const [appliedCorrections, setAppliedCorrections] = useState<Record<string, boolean>>({});
  const [customWords, setCustomWords] = useState<string[]>([]);
  const [newCustomWord, setNewCustomWord] = useState('');
  const [showDictionaryManager, setShowDictionaryManager] = useState(false);

  // 2. Thesaurus (Open API - Datamuse, 0 Tokens)
  const [thesaurusWord, setThesaurusWord] = useState<string>('');
  const [thesaurusResults, setThesaurusResults] = useState<string[]>([]);
  const [isThesaurusLoading, setIsThesaurusLoading] = useState(false);
  const [thesaurusContext, setThesaurusContext] = useState<string>('');
  const [thesaurusLatency, setThesaurusLatency] = useState<number | null>(null);
  const [thesaurusSource, setThesaurusSource] = useState<string>('OpenThesaurus (deutsch, LGPL)');

  // 3. Epochen-Checker (KI - OmniRoute Flash)
  const [epoch, setEpoch] = useState<string>(projectEpoch);
  const [epochAnachronisms, setEpochAnachronisms] = useState<
    Array<{ suspect: string; eraNote: string; suggestion: string; quote?: string }>
  >([]);
  const [isEpochLoading, setIsEpochLoading] = useState(false);
  const [hasCheckedEpoch, setHasCheckedEpoch] = useState(false);
  const [epochModel, setEpochModel] = useState<string>('flash');

  // 4. Kanon-Checker (KI - OmniRoute qwen3.7-plus + RAG)
  const [canonContradictions, setCanonContradictions] = useState<
    Array<{ quote: string; fact: string; entity: string; suggestion: string; explanation: string }>
  >([]);
  const [isCanonLoading, setIsCanonLoading] = useState(false);
  const [hasCheckedCanon, setHasCheckedCanon] = useState(false);
  const [canonAiAnalysis, setCanonAiAnalysis] = useState<string>('');
  const [canonModel, setCanonModel] = useState<string>('qwen3.7-plus');

  // 5. Sinne-Checker (KI - OmniRoute Flash)
  const [sensesData, setSensesData] = useState<{
    scores: Record<string, number>;
    leastUsedSense: string;
    analysis: string;
    suggestion: string;
    exampleSnippet: string;
  } | null>(null);
  const [isSensesLoading, setIsSensesLoading] = useState(false);
  const [hasCheckedSenses, setHasCheckedSenses] = useState(false);
  const [sensesModel, setSensesModel] = useState<string>('flash');

  // Status Notification für Screenreader
  const [statusMessage, setStatusMessage] = useState<string>('');

  // Initialisiere benutzerdefiniertes Wörterbuch
  useEffect(() => {
    setCustomWords(getCustomDictionary());
  }, []);

  // Wenn der Benutzer im Text ein Wort markiert, automatisch für Thesaurus vorschlagen
  useEffect(() => {
    if (selectedText && selectedText.trim().length > 0 && selectedText.trim().length < 50) {
      setThesaurusWord(selectedText.trim());
    }
  }, [selectedText]);

  // Vorlese-Helfer (Web Speech API)
  const readAloud = (content: string) => {
    if (speechService.isSpeaking()) {
      speechService.stop();
      setStatusMessage('Vorlesen angehalten.');
    } else {
      speechService.speak(content);
      setStatusMessage('Lese Inhalt vor…');
    }
  };

  // ----------------------------------------------------
  // 1. Handlers: Rechtschreibung & Wörterbuch (Lokal)
  // ----------------------------------------------------
  const handleCheckSpelling = () => {
    const errors = checkSpellingAndGrammar(text);
    setSpellErrors(errors);
    setHasCheckedSpelling(true);
    const msg =
      errors.length === 0
        ? 'Rechtschreibprüfung abgeschlossen: Keine auffälligen Fehler gefunden. Native Browser-Prüfung ist aktiv.'
        : `Rechtschreibprüfung abgeschlossen: ${errors.length} mögliche Unstimmigkeiten gefunden.`;
    setStatusMessage(msg);
  };

  const handleApplySpellCorrection = (error: SpellError, replacement: string) => {
    onReplaceText(error.word, replacement, `Korrektur von »${error.word}« zu »${replacement}«`);
    setAppliedCorrections((prev) => ({ ...prev, [error.id]: true }));
    setStatusMessage(`Wort »${error.word}« durch »${replacement}« ersetzt.`);
  };

  const handleAddToCustomDict = (wordToKeep: string, errorId?: string) => {
    const updated = addWordToCustomDictionary(wordToKeep);
    setCustomWords(updated);
    if (errorId) {
      setAppliedCorrections((prev) => ({ ...prev, [errorId]: true }));
    }
    // Fehlerliste sofort neu evaluieren
    const remaining = spellErrors.filter(
      (e) => e.word.toLowerCase() !== wordToKeep.toLowerCase()
    );
    setSpellErrors(remaining);
    setStatusMessage(`»${wordToKeep}« zum Autoren-Wörterbuch hinzugefügt. Wird künftig nicht mehr bemängelt.`);
  };

  const handleRemoveFromCustomDict = (wordToRemove: string) => {
    const updated = removeWordFromCustomDictionary(wordToRemove);
    setCustomWords(updated);
    setStatusMessage(`»${wordToRemove}« aus dem Wörterbuch entfernt.`);
  };

  const handleAddNewCustomWordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustomWord.trim()) return;
    handleAddToCustomDict(newCustomWord.trim());
    setNewCustomWord('');
  };

  // ----------------------------------------------------
  // 2. Handlers: Thesaurus (Open API - Datamuse)
  // ----------------------------------------------------
  const handleRunThesaurus = async (overrideWord?: string) => {
    const wordToLookup = (overrideWord || thesaurusWord || selectedText || '').trim();
    if (!wordToLookup) {
      setStatusMessage('Bitte markieren Sie ein Wort im Manuskript oder tippen Sie einen Begriff ein.');
      return;
    }

    setThesaurusWord(wordToLookup);
    setIsThesaurusLoading(true);
    setStatusMessage(`Suche Synonyme für »${wordToLookup}« über offene Datamuse API…`);

    // Umgebenden Satz als Kontext ermitteln
    let surroundingSentence = '';
    const wordIndex = text.indexOf(wordToLookup);
    if (wordIndex >= 0) {
      const sentenceStart = Math.max(0, text.lastIndexOf('.', wordIndex) + 1);
      const sentenceEnd = text.indexOf('.', wordIndex + wordToLookup.length);
      surroundingSentence = text.slice(sentenceStart, sentenceEnd > 0 ? sentenceEnd + 1 : undefined).trim();
    } else {
      surroundingSentence = wordToLookup;
    }
    setThesaurusContext(surroundingSentence);

    try {
      const res = await fetchThesaurusSynonyms(wordToLookup, surroundingSentence);
      setThesaurusResults(res.synonyms);
      setThesaurusLatency(res.latencyMs);
      setThesaurusSource(res.source || 'OpenThesaurus (deutsch, LGPL)');
      setStatusMessage(
        `Synonyme für »${wordToLookup}« in ${res.latencyMs}ms geladen: ${res.synonyms.join(', ')}`
      );
    } catch (err: any) {
      console.warn('[Thesaurus] Fehler beim Abruf:', err);
      setStatusMessage('Synonym-Suche konnte nicht ausgeführt werden.');
    } finally {
      setIsThesaurusLoading(false);
    }
  };

  const handleApplySynonym = (synonym: string) => {
    if (!thesaurusWord) return;
    onReplaceText(
      thesaurusWord,
      synonym,
      `Synonym-Ersetzung: »${thesaurusWord}« durch »${synonym}«`
    );
    setStatusMessage(`»${thesaurusWord}« wurde durch das Synonym »${synonym}« ersetzt.`);
  };

  // ----------------------------------------------------
  // 3. Handlers: Epochen-Checker (KI - Flash)
  // ----------------------------------------------------
  const handleRunEpochCheck = async () => {
    setIsEpochLoading(true);
    setStatusMessage(`Prüfe Text auf historische Anachronismen für Epoche: ${epoch} mit Flash-Modell…`);

    try {
      const res = await api.aiEpochenCheck(text, epoch);
      setEpochAnachronisms(res.anachronisms || []);
      setHasCheckedEpoch(true);
      if (res.model) setEpochModel(res.model);

      const count = res.anachronisms?.length || 0;
      setStatusMessage(
        count === 0
          ? `Epochen-Prüfung abgeschlossen: Keine sprachlichen Anachronismen für »${epoch}« gefunden.`
          : `Epochen-Prüfung abgeschlossen: ${count} verdächtige Begriffe gefunden.`
      );
    } catch (err: any) {
      console.error('[Epochen-Check] Fehler:', err);
      setStatusMessage(`Fehler bei der Epochen-Prüfung: ${err.message || 'Serverfehler'}`);
    } finally {
      setIsEpochLoading(false);
    }
  };

  const handleApplyEpochSuggestion = (suspect: string, suggestion: string) => {
    // Erste vorgeschlagene Alternative herausfiltern
    const firstOption = suggestion.split(/,|oder/i)[0].replace(/['"»«]/g, '').trim();
    const replacement = firstOption || suggestion;

    onReplaceText(
      suspect,
      replacement,
      `Epochen-Anpassung: »${suspect}« zu historischem »${replacement}«`
    );
    setStatusMessage(`Begriff »${suspect}« durch zeitgemäßes »${replacement}« ersetzt.`);
  };

  // ----------------------------------------------------
  // 4. Handlers: Kanon- & Fakten-Checker (KI - qwen3.7-plus + RAG)
  // ----------------------------------------------------
  const handleRunCanonCheck = async () => {
    setIsCanonLoading(true);
    setStatusMessage('Gleiche Manuskript mit Datenbank-Fakten und Figuren ab (qwen3.7-plus RAG)…');

    try {
      const res = await api.aiKanonCheck(text, chapterId);
      setCanonContradictions(res.contradictions || []);
      setCanonAiAnalysis(res.aiAnalysis || '');
      setHasCheckedCanon(true);
      if (res.model) setCanonModel(res.model);

      const count = res.contradictions?.length || 0;
      setStatusMessage(
        count === 0
          ? 'Kanon-Prüfung abgeschlossen: Keine logischen Widersprüche zu Figuren oder Fakten entdeckt.'
          : `Kanon-Prüfung abgeschlossen: ${count} logische Widersprüche gefunden.`
      );
    } catch (err: any) {
      console.error('[Kanon-Check] Fehler:', err);
      setStatusMessage(`Fehler beim Kanon-Abgleich: ${err.message || 'Serverfehler'}`);
    } finally {
      setIsCanonLoading(false);
    }
  };

  const handleApplyCanonCorrection = (contradiction: {
    quote: string;
    suggestion: string;
    fact: string;
  }) => {
    const match = contradiction.suggestion.match(/Ersetze\s+»?([^«]+)«?\s+durch\s+»?([^«]+)«?/i);
    let target = contradiction.quote;
    let replacement = contradiction.suggestion;

    if (match) {
      target = match[1].trim();
      replacement = match[2].trim();
    } else {
      // Wenn die Suggestion ein direktes Wort enthält
      const quoteMatch = contradiction.suggestion.match(/»([^«]+)«/g);
      if (quoteMatch && quoteMatch.length >= 2) {
        target = quoteMatch[0].replace(/[»«]/g, '');
        replacement = quoteMatch[1].replace(/[»«]/g, '');
      }
    }

    onReplaceText(
      target,
      replacement,
      `Kanon-Korrektur: »${target}« zu »${replacement}« (${contradiction.fact})`
    );
    setStatusMessage(`Kanon-Korrektur angewendet: »${target}« durch »${replacement}« ersetzt.`);
  };

  // ----------------------------------------------------
  // 5. Handlers: Sinne-Checker (KI - Flash)
  // ----------------------------------------------------
  const handleRunSensesCheck = async () => {
    setIsSensesLoading(true);
    setStatusMessage('Analysiere sensorische Dichte der 5 Sinne mit Flash-Modell…');

    try {
      const res = await api.aiSinneCheck(text);
      setSensesData({
        scores: res.scores || { sehen: 5, hoeren: 3, fuehlen: 2, riechen: 0, schmecken: 0 },
        leastUsedSense: res.leastUsedSense || 'Riechen',
        analysis: res.analysis || '',
        suggestion: res.suggestion || '',
        exampleSnippet: res.exampleSnippet || '',
      });
      setHasCheckedSenses(true);
      if (res.model) setSensesModel(res.model);
      setStatusMessage(
        `Sinne-Analyse abgeschlossen. Am wenigsten genutzter Sinn: ${res.leastUsedSense || 'Riechen'}.`
      );
    } catch (err: any) {
      console.error('[Sinne-Check] Fehler:', err);
      setStatusMessage(`Fehler bei der Sinne-Prüfung: ${err.message || 'Serverfehler'}`);
    } finally {
      setIsSensesLoading(false);
    }
  };

  const handleInsertSenseSnippet = (snippet: string) => {
    if (!snippet) return;
    onAppendText(`\n\n${snippet}`);
    setStatusMessage('Sensorische Ergänzung am Ende des Kapitels eingefügt.');
  };

  // Visuelle Badges für Technologie & Token-Kosten
  const renderBadge = (type: 'local' | 'llm', label?: string) => {
    if (type === 'local') {
      return (
        <span
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shadow-xs"
          title="Lokal / Sofort: 100% Client-seitig oder über kostenlose offene API. 0 Tokens, Antwortzeit <200ms."
        >
          <Zap className="w-3.5 h-3.5 text-emerald-400 fill-emerald-400/30" />
          <span>{label || 'Lokal / Sofort (0 Tokens)'}</span>
        </span>
      );
    }
    return (
      <span
        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-purple-500/15 text-purple-300 border border-purple-500/30 shadow-xs"
        title="KI-Analyse via OmniRoute LLM auf Abruf."
      >
        <Sparkles className="w-3.5 h-3.5 text-purple-400" />
        <span>{label || 'KI-Analyse (OmniRoute)'}</span>
      </span>
    );
  };

  // Wenn Panel eingeklappt ist
  if (!isOpen) {
    return (
      <div className="hidden lg:block shrink-0">
        <button
          onClick={onToggle}
          className="touch-target flex items-center gap-2 px-4 py-3 rounded-2xl bg-[var(--bg-surface)] border-2 border-[var(--border-color)] hover:border-[var(--accent)] text-[var(--text-primary)] font-bold shadow-md transition-all"
          aria-label="Lektorat & Stil Panel öffnen"
          title="Lektorat & Stil Werkzeuge öffnen"
        >
          <Wand2 className="w-5 h-5 text-[var(--accent)]" />
          <span className="hidden xl:inline">Lektorat & Stil</span>
          <ChevronRight className="w-4 h-4 text-[var(--text-muted)]" />
        </button>
      </div>
    );
  }

  return (
    <aside
      className="w-full lg:w-[420px] xl:w-[460px] shrink-0 rounded-2xl bg-[var(--bg-surface)] border-2 border-[var(--border-color)] shadow-xl flex flex-col max-h-[85vh] sticky top-4 overflow-hidden"
      aria-label="Lektorat und Stil Arbeitsbereich"
    >
      {/* Panel Header */}
      <div className="p-4 border-b border-[var(--border-color)] flex items-center justify-between bg-[var(--bg-canvas)]/60">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[var(--accent)]/20 border border-[var(--accent)]/40 flex items-center justify-center text-[var(--accent)]">
            <Wand2 className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-[var(--text-primary)] leading-tight">
              Lektorat & Stil
            </h2>
            <p className="text-xs text-[var(--text-muted)]">
              Hybride Assistenz · Native Tools & Gezielte KI
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {canUndo && onUndoLastChange && (
            <button
              onClick={onUndoLastChange}
              className="touch-target p-2 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-color)] hover:border-[var(--accent)] text-[var(--text-primary)] text-xs flex items-center gap-1.5 transition-colors"
              title="Letzte Lektorat-Änderung rückgängig machen"
              aria-label="Letzte Lektoratsänderung rückgängig machen"
            >
              <RotateCcw className="w-4 h-4 text-[var(--accent)]" />
              <span className="hidden sm:inline">Undo</span>
            </button>
          )}

          <button
            onClick={onToggle}
            className="touch-target p-2 rounded-xl text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface)] transition-colors"
            aria-label="Lektorat & Stil schließen"
            title="Panel schließen"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Tabs Navigation (Große Touch-Targets) */}
      <div
        className="flex items-center overflow-x-auto p-2 gap-1.5 border-b border-[var(--border-color)] bg-[var(--bg-surface)] scrollbar-none"
        role="tablist"
        aria-label="Lektorats-Kategorien"
      >
        <button
          role="tab"
          aria-selected={activeSection === 'thesaurus'}
          onClick={() => setActiveSection('thesaurus')}
          className={`touch-target px-3 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-1.5 shrink-0 transition-all ${
            activeSection === 'thesaurus'
              ? 'bg-[var(--accent)] text-[var(--accent-contrast)] shadow-sm'
              : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-canvas)]'
          }`}
        >
          <Zap className="w-3.5 h-3.5" />
          Thesaurus
        </button>

        <button
          role="tab"
          aria-selected={activeSection === 'spelling'}
          onClick={() => setActiveSection('spelling')}
          className={`touch-target px-3 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-1.5 shrink-0 transition-all ${
            activeSection === 'spelling'
              ? 'bg-[var(--accent)] text-[var(--accent-contrast)] shadow-sm'
              : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-canvas)]'
          }`}
        >
          <BookOpen className="w-3.5 h-3.5" />
          Rechtschreibung
        </button>

        <button
          role="tab"
          aria-selected={activeSection === 'epoch'}
          onClick={() => setActiveSection('epoch')}
          className={`touch-target px-3 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-1.5 shrink-0 transition-all ${
            activeSection === 'epoch'
              ? 'bg-[var(--accent)] text-[var(--accent-contrast)] shadow-sm'
              : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-canvas)]'
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          Epoche
        </button>

        <button
          role="tab"
          aria-selected={activeSection === 'canon'}
          onClick={() => setActiveSection('canon')}
          className={`touch-target px-3 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-1.5 shrink-0 transition-all ${
            activeSection === 'canon'
              ? 'bg-[var(--accent)] text-[var(--accent-contrast)] shadow-sm'
              : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-canvas)]'
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          Kanon
        </button>

        <button
          role="tab"
          aria-selected={activeSection === 'senses'}
          onClick={() => setActiveSection('senses')}
          className={`touch-target px-3 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-1.5 shrink-0 transition-all ${
            activeSection === 'senses'
              ? 'bg-[var(--accent)] text-[var(--accent-contrast)] shadow-sm'
              : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-canvas)]'
          }`}
        >
          <Eye className="w-3.5 h-3.5" />
          Sinne
        </button>
      </div>

      {/* Screenreader Live Region */}
      <div
        className="sr-only"
        role="status"
        aria-live="polite"
        aria-atomic="true"
      >
        {statusMessage}
      </div>

      {/* Panel Scrollable Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* ======================================================== */}
        {/* 2. THE SAURUS & FORMULIERUNGSHILFE (OPEN API: DATAMUSE) */}
        {/* ======================================================== */}
        {activeSection === 'thesaurus' && (
          <section
            role="tabpanel"
            aria-labelledby="tab-thesaurus"
            className="space-y-4"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-[var(--text-primary)] flex items-center gap-2">
                  <span>Deutscher Thesaurus</span>
                </h3>
                <p className="text-xs text-[var(--text-muted)]">
                  Datamuse Open API · Antwortzeit &lt;200ms
                </p>
              </div>
              {renderBadge('local', 'Sofort (<200ms) · 0 Tokens')}
            </div>

            <div className="p-3.5 rounded-xl bg-[var(--bg-canvas)] border border-[var(--border-color)] space-y-3">
              <label
                htmlFor="thesaurus-input"
                className="block text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]"
              >
                Suchbegriff (oder Wort im Text markieren)
              </label>

              <div className="flex gap-2">
                <input
                  id="thesaurus-input"
                  type="text"
                  value={thesaurusWord}
                  onChange={(e) => setThesaurusWord(e.target.value)}
                  placeholder="z.B. schweigen, kalt, angst, wald…"
                  className="flex-1 px-3 py-2 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-color)] focus:border-[var(--accent)] text-[var(--text-primary)] text-sm"
                  onKeyDown={(e) => e.key === 'Enter' && handleRunThesaurus()}
                />
                <button
                  onClick={() => handleRunThesaurus()}
                  disabled={isThesaurusLoading || !thesaurusWord.trim()}
                  className="touch-target px-4 py-2 rounded-xl bg-[var(--accent)] text-[var(--accent-contrast)] font-bold text-sm flex items-center gap-2 disabled:opacity-50 hover:opacity-90 transition-opacity"
                  aria-label="Synonyme über Datamuse abrufen"
                >
                  <Search className="w-4 h-4" />
                  <span>Synonyme</span>
                </button>
              </div>

              {selectedText && (
                <div className="text-xs text-[var(--text-secondary)] flex items-center justify-between">
                  <span>
                    Im Manuskript markiert: <strong>»{selectedText.trim()}«</strong>
                  </span>
                  <button
                    onClick={() => {
                      setThesaurusWord(selectedText.trim());
                      handleRunThesaurus(selectedText.trim());
                    }}
                    className="font-bold underline text-[var(--accent)]"
                  >
                    Als Suchwort übernehmen
                  </button>
                </div>
              )}
            </div>

            {/* Thesaurus Results */}
            {thesaurusResults.length > 0 && (
              <div
                className="space-y-3 p-3.5 rounded-xl bg-[var(--bg-canvas)] border border-[var(--border-color)]"
                aria-live="polite"
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-[var(--text-primary)]">
                    Passende Synonyme für »{thesaurusWord}« ({thesaurusResults.length})
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() =>
                        readAloud(
                          `Synonyme für ${thesaurusWord}: ${thesaurusResults.join(', ')}`
                        )
                      }
                      className="touch-target p-1.5 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-color)] hover:border-[var(--accent)] text-[var(--text-secondary)]"
                      title="Synonyme vorlesen"
                      aria-label="Synonyme vorlesen"
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 pt-1">
                  {thesaurusResults.map((syn, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleApplySynonym(syn)}
                      className="touch-target px-3 py-1.5 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-color)] hover:border-[var(--accent)] hover:bg-[var(--accent)]/10 text-sm font-semibold text-[var(--text-primary)] flex items-center gap-1.5 shadow-2xs transition-all active:scale-95"
                      title={`Klicken, um »${thesaurusWord}« im Text durch »${syn}« zu ersetzen`}
                      aria-label={`Ersetze Wort durch ${syn}`}
                    >
                      <span>{syn}</span>
                      <Check className="w-3.5 h-3.5 text-[var(--accent)] opacity-70" />
                    </button>
                  ))}
                </div>

                <p className="text-[11px] text-[var(--text-muted)] pt-1 flex items-center justify-between">
                  <span>Klick auf einen Chip ersetzt das Wort im Manuskript (mit Undo).</span>
                  {thesaurusLatency !== null && (
                    <span className="text-emerald-400 font-mono">
                      ⚡ {thesaurusLatency}ms
                    </span>
                  )}
                </p>
              </div>
            )}
          </section>
        )}

        {/* ======================================================== */}
        {/* 1. RECHTSCHREIBUNG & BENUTZERDEFINIERTES WÖRTERBUCH */}
        {/* ======================================================== */}
        {activeSection === 'spelling' && (
          <section
            role="tabpanel"
            aria-labelledby="tab-spelling"
            className="space-y-4"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-[var(--text-primary)]">
                  Rechtschreibung & Grammatik
                </h3>
                <p className="text-xs text-[var(--text-muted)]">
                  Natives Browser-Wörterbuch & Lokales Typo-JS
                </p>
              </div>
              {renderBadge('local', 'Nativ & Offline (0 Tokens)')}
            </div>

            {/* Native Browser Hinweis */}
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-[var(--text-secondary)] space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-emerald-400">
                <ShieldCheck className="w-4 h-4" />
                <span>Nativer Schutz aktiv (de-DE)</span>
              </div>
              <p>
                Der Manuskript-Editor ist auf <code className="px-1 bg-black/20 rounded">spellcheck=&quot;true&quot;</code> und <code className="px-1 bg-black/20 rounded">lang=&quot;de-DE&quot;</code> konfiguriert. Fehler werden im Text unterstrichen.
              </p>
            </div>

            {/* Prüf-Button */}
            <div className="flex gap-2">
              <button
                onClick={handleCheckSpelling}
                className="touch-target flex-1 px-4 py-3 rounded-xl bg-[var(--accent)] text-[var(--accent-contrast)] font-bold text-sm sm:text-base flex items-center justify-center gap-2 hover:opacity-90 shadow-sm transition-opacity"
                aria-label="Text lokal auf Rechtschreibung und Grammatik prüfen"
              >
                <BookOpen className="w-5 h-5" />
                <span>Text jetzt prüfen</span>
              </button>

              <button
                onClick={() => setShowDictionaryManager(!showDictionaryManager)}
                className={`touch-target px-3.5 py-3 rounded-xl border border-[var(--border-color)] hover:border-[var(--accent)] text-xs font-bold flex items-center gap-1.5 transition-colors ${
                  showDictionaryManager
                    ? 'bg-[var(--accent)]/20 text-[var(--accent)] border-[var(--accent)]'
                    : 'bg-[var(--bg-canvas)] text-[var(--text-secondary)]'
                }`}
                title="Eigenes Autoren-Wörterbuch verwalten"
                aria-expanded={showDictionaryManager}
              >
                <Sliders className="w-4 h-4" />
                <span className="hidden sm:inline">Wörterbuch ({customWords.length})</span>
              </button>
            </div>

            {/* Benutzerdefiniertes Wörterbuch Drawer */}
            {showDictionaryManager && (
              <div className="p-3.5 rounded-xl bg-[var(--bg-canvas)] border border-[var(--border-color)] space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
                    Autoren-Wörterbuch (Whitelist für Namen & Epochen-Wörter)
                  </h4>
                  <span className="text-xs text-[var(--text-secondary)]">
                    {customWords.length} Einträge
                  </span>
                </div>

                <form onSubmit={handleAddNewCustomWordSubmit} className="flex gap-2">
                  <input
                    type="text"
                    value={newCustomWord}
                    onChange={(e) => setNewCustomWord(e.target.value)}
                    placeholder="Neuen Namen/Begriff hinzufügen…"
                    className="flex-1 px-3 py-1.5 text-xs rounded-xl bg-[var(--bg-surface)] border border-[var(--border-color)] text-[var(--text-primary)]"
                  />
                  <button
                    type="submit"
                    className="touch-target px-3 py-1.5 rounded-xl bg-[var(--accent)] text-[var(--accent-contrast)] font-bold text-xs flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Hinzufügen</span>
                  </button>
                </form>

                <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto pt-1">
                  {customWords.map((word) => (
                    <span
                      key={word}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-color)] text-xs font-medium text-[var(--text-primary)]"
                    >
                      <span>{word}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveFromCustomDict(word)}
                        className="hover:text-red-400 p-0.5 text-[var(--text-muted)]"
                        title={`»${word}« entfernen`}
                        aria-label={`Entferne ${word} aus dem Wörterbuch`}
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Prüfergebnisse */}
            {hasCheckedSpelling && (
              <div className="space-y-3" aria-live="polite">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[var(--text-secondary)]">
                    Gefundene Hinweise ({spellErrors.length})
                  </span>
                  {spellErrors.length > 0 && (
                    <button
                      onClick={() =>
                        readAloud(
                          `Es wurden ${spellErrors.length} Hinweise gefunden. ${spellErrors
                            .map((e) => `${e.word}: ${e.message}`)
                            .join('. ')}`
                        )
                      }
                      className="touch-target p-1.5 rounded-lg bg-[var(--bg-canvas)] border border-[var(--border-color)] hover:border-[var(--accent)] text-[var(--text-secondary)] flex items-center gap-1 text-xs"
                      title="Alle Fehler laut vorlesen"
                      aria-label="Alle Rechtschreibfehler vorlesen"
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                      <span>Vorlesen</span>
                    </button>
                  )}
                </div>

                {spellErrors.length === 0 ? (
                  <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-center space-y-1">
                    <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
                    <p className="font-bold text-sm text-[var(--text-primary)]">
                      Alles einwandfrei!
                    </p>
                    <p className="text-xs text-[var(--text-muted)]">
                      Keine offensichtlichen Tippfehler oder Großschreibungsfehler im Text entdeckt.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {spellErrors.map((err) => {
                      const isApplied = appliedCorrections[err.id];
                      return (
                        <div
                          key={err.id}
                          className={`p-3 rounded-xl border text-sm transition-all ${
                            isApplied
                              ? 'bg-[var(--bg-canvas)] opacity-60 border-[var(--border-color)]'
                              : 'bg-[var(--bg-canvas)] border-amber-500/30'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <span className="font-bold text-[var(--text-primary)]">
                                »{err.word}«
                              </span>
                              <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-semibold">
                                {err.type === 'spelling'
                                  ? 'Tippfehler'
                                  : err.type === 'capitalization'
                                  ? 'Großschreibung'
                                  : 'Grammatik'}
                              </span>
                            </div>
                            <button
                              onClick={() => readAloud(`${err.word}: ${err.message}`)}
                              className="touch-target p-1 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                              title="Vorlesen"
                              aria-label={`Fehler für ${err.word} vorlesen`}
                            >
                              <Volume2 className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          <p className="text-xs text-[var(--text-secondary)] mt-1">
                            {err.message}
                          </p>

                          <div className="mt-2.5 flex flex-wrap items-center gap-2">
                            {err.suggestions.map((sug, i) => (
                              <button
                                key={i}
                                onClick={() => handleApplySpellCorrection(err, sug)}
                                disabled={isApplied}
                                className="touch-target px-3 py-1.5 rounded-lg bg-[var(--accent)] text-[var(--accent-contrast)] text-xs font-bold flex items-center gap-1.5 hover:opacity-90 disabled:opacity-50"
                              >
                                <Check className="w-3.5 h-3.5" />
                                <span>Ersetzen durch »{sug}«</span>
                              </button>
                            ))}

                            <button
                              onClick={() => handleAddToCustomDict(err.word, err.id)}
                              className="touch-target px-2.5 py-1.5 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-color)] hover:border-[var(--accent)] text-[var(--text-secondary)] text-xs font-medium"
                              title="Zu Autoren-Wörterbuch hinzufügen und ignorieren"
                            >
                              + Als Autoren-Wort merken
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </section>
        )}

        {/* ======================================================== */}
        {/* 3. EPOCHEN-CHECKER / ANACHRONISMUS-PRÜFER (KI: FLASH) */}
        {/* ======================================================== */}
        {activeSection === 'epoch' && (
          <section
            role="tabpanel"
            aria-labelledby="tab-epoch"
            className="space-y-4"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-[var(--text-primary)]">
                  Epochen- &amp; Anachronismus-Checker
                </h3>
                <p className="text-xs text-[var(--text-muted)]">
                  Historische Linguistik · OmniRoute Flash
                </p>
              </div>
              {renderBadge('llm', `KI (${epochModel})`)}
            </div>

            <div className="p-3.5 rounded-xl bg-[var(--bg-canvas)] border border-[var(--border-color)] space-y-2.5">
              <label
                htmlFor="epoch-select"
                className="block text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]"
              >
                Ziel-Epoche des Projekts
              </label>
              <select
                id="epoch-select"
                value={epoch}
                onChange={(e) => setEpoch(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-color)] text-[var(--text-primary)] text-sm font-semibold"
              >
                <option value="1928, Weimarer Republik / Schwarzwald">
                  1928, Weimarer Republik / Schwarzwald
                </option>
                <option value="1890, Viktorianisches Zeitalter / Kaiserreich">
                  1890, Kaiserreich / Spätes 19. Jahrhundert
                </option>
                <option value="1815, Biedermeier / Frühromantik">
                  1815, Biedermeier / Frühromantik
                </option>
                <option value="1750, Aufklärung & Spätbarock">
                  1750, Aufklärung &amp; Spätbarock
                </option>
                <option value="Mittelalter (ca. 1300)">
                  Mittelalter (ca. 1300)
                </option>
              </select>

              <button
                onClick={handleRunEpochCheck}
                disabled={isEpochLoading}
                className="touch-target w-full px-4 py-3 rounded-xl bg-[var(--accent)] text-[var(--accent-contrast)] font-bold text-sm sm:text-base flex items-center justify-center gap-2 hover:opacity-90 disabled:opacity-50 transition-opacity"
                aria-label="Auf historische Anachronismen prüfen"
              >
                {isEpochLoading ? (
                  <>
                    <Sparkles className="w-5 h-5 animate-spin" />
                    <span>Prüfe Epochen-Vokabular…</span>
                  </>
                ) : (
                  <>
                    <Clock className="w-5 h-5" />
                    <span>Auf Anachronismen prüfen</span>
                  </>
                )}
              </button>
            </div>

            {hasCheckedEpoch && (
              <div className="space-y-3" aria-live="polite">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[var(--text-secondary)]">
                    Gefundene Ausdrücke ({epochAnachronisms.length})
                  </span>
                  {epochAnachronisms.length > 0 && (
                    <button
                      onClick={() =>
                        readAloud(
                          epochAnachronisms
                            .map(
                              (a) =>
                                `Verdächtiges Wort: ${a.suspect}. Grund: ${a.eraNote}. Vorschlag: ${a.suggestion}`
                            )
                            .join('. ')
                        )
                      }
                      className="touch-target p-1.5 rounded-lg bg-[var(--bg-canvas)] border border-[var(--border-color)] hover:border-[var(--accent)] text-[var(--text-secondary)] flex items-center gap-1 text-xs"
                      title="Ergebnisse vorlesen"
                      aria-label="Epochen-Ergebnisse vorlesen"
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                      <span>Vorlesen</span>
                    </button>
                  )}
                </div>

                {epochAnachronisms.length === 0 ? (
                  <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-center space-y-1">
                    <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
                    <p className="font-bold text-sm text-[var(--text-primary)]">
                      Stilistisch authentisch!
                    </p>
                    <p className="text-xs text-[var(--text-muted)]">
                      Keine neuzeitlichen Fremdwörter oder Redewendungen entdeckt.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {epochAnachronisms.map((item, index) => (
                      <div
                        key={index}
                        className="p-3.5 rounded-xl bg-[var(--bg-canvas)] border border-purple-500/30 space-y-2"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <span className="font-bold text-[var(--text-primary)] text-sm">
                              Verdächtiges Wort: <mark className="bg-purple-500/20 text-purple-200 px-1 py-0.5 rounded font-bold">»{item.suspect}«</mark>
                            </span>
                            <div className="text-xs text-[var(--text-secondary)] mt-0.5">
                              {item.eraNote}
                            </div>
                          </div>
                          <button
                            onClick={() =>
                              readAloud(
                                `${item.suspect}: ${item.eraNote}. Zeitgemäßer Vorschlag: ${item.suggestion}`
                              )
                            }
                            className="touch-target p-1 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                            title="Vorlesen"
                            aria-label={`Ergebnis für ${item.suspect} vorlesen`}
                          >
                            <Volume2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {item.quote && (
                          <div className="p-2 rounded bg-[var(--bg-surface)] text-xs text-[var(--text-muted)] italic">
                            Kontext: &quot;{item.quote}&quot;
                          </div>
                        )}

                        <div className="pt-1 flex items-center justify-between gap-2">
                          <span className="text-xs font-semibold text-emerald-400">
                            Vorschlag: »{item.suggestion}«
                          </span>
                          <button
                            onClick={() =>
                              handleApplyEpochSuggestion(item.suspect, item.suggestion)
                            }
                            className="touch-target px-3 py-1.5 rounded-lg bg-[var(--accent)] text-[var(--accent-contrast)] text-xs font-bold flex items-center gap-1.5 hover:opacity-90"
                            title={`»${item.suspect}« durch »${item.suggestion}« ersetzen`}
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>Übernehmen</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </section>
        )}

        {/* ======================================================== */}
        {/* 4. FAKTEN- & KANON-CHECKER (KI: QWEN3.7-PLUS + RAG) */}
        {/* ======================================================== */}
        {activeSection === 'canon' && (
          <section
            role="tabpanel"
            aria-labelledby="tab-canon"
            className="space-y-4"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-[var(--text-primary)]">
                  Fakten- &amp; Kanon-Checker
                </h3>
                <p className="text-xs text-[var(--text-muted)]">
                  RAG-Abgleich mit Datenbank &amp; Charakteren
                </p>
              </div>
              {renderBadge('llm', `KI (${canonModel}) + RAG`)}
            </div>

            <div className="p-3.5 rounded-xl bg-[var(--bg-canvas)] border border-[var(--border-color)] space-y-2.5">
              <p className="text-xs text-[var(--text-secondary)]">
                Prüft das aktuelle Kapitel gegen die hinterlegten Figuren und Fakten (Augenfarbe, Handlungsorte, Beziehungen, Händigkeit).
              </p>

              <button
                onClick={handleRunCanonCheck}
                disabled={isCanonLoading}
                className="touch-target w-full px-4 py-3 rounded-xl bg-[var(--accent)] text-[var(--accent-contrast)] font-bold text-sm sm:text-base flex items-center justify-center gap-2 hover:opacity-90 disabled:opacity-50 transition-opacity"
                aria-label="Widersprüche gegen Kanon finden"
              >
                {isCanonLoading ? (
                  <>
                    <Sparkles className="w-5 h-5 animate-spin" />
                    <span>Lese Kanon-Fakten &amp; prüfe…</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-5 h-5" />
                    <span>Widersprüche finden</span>
                  </>
                )}
              </button>
            </div>

            {hasCheckedCanon && (
              <div className="space-y-3" aria-live="polite">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[var(--text-secondary)]">
                    Kanon-Befunde ({canonContradictions.length})
                  </span>
                  {canonContradictions.length > 0 && (
                    <button
                      onClick={() =>
                        readAloud(
                          canonContradictions
                            .map(
                              (c) =>
                                `Widerspruch bei ${c.entity}: Im Text steht ${c.quote}, laut Kanon jedoch ${c.fact}. ${c.suggestion}`
                            )
                            .join('. ')
                        )
                      }
                      className="touch-target p-1.5 rounded-lg bg-[var(--bg-canvas)] border border-[var(--border-color)] hover:border-[var(--accent)] text-[var(--text-secondary)] flex items-center gap-1 text-xs"
                      title="Widersprüche vorlesen"
                      aria-label="Kanon-Widersprüche vorlesen"
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                      <span>Vorlesen</span>
                    </button>
                  )}
                </div>

                {canonContradictions.length === 0 ? (
                  <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-center space-y-1">
                    <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
                    <p className="font-bold text-sm text-[var(--text-primary)]">
                      Kanonisch stimmig!
                    </p>
                    <p className="text-xs text-[var(--text-muted)]">
                      Keine Widersprüche zu bekannten Figuren-Eigenschaften oder Welt-Fakten gefunden.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {canonContradictions.map((item, index) => (
                      <div
                        key={index}
                        className="p-3.5 rounded-xl bg-[var(--bg-canvas)] border-2 border-red-500/40 space-y-2"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="font-bold text-sm text-[var(--text-primary)]">
                            Konflikt mit: <span className="text-[var(--accent)]">{item.entity}</span>
                          </div>
                          <button
                            onClick={() =>
                              readAloud(
                                `Im Text steht: ${item.quote}. Laut Kanon: ${item.fact}. Empfehlung: ${item.suggestion}`
                              )
                            }
                            className="touch-target p-1 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                            title="Vorlesen"
                            aria-label="Widerspruch vorlesen"
                          >
                            <Volume2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <div className="text-xs space-y-1">
                          <div>
                            Im Manuskript steht: <mark className="bg-amber-300 text-black px-1.5 py-0.5 rounded font-bold">»{item.quote}«</mark>
                          </div>
                          <div className="text-[var(--text-secondary)]">
                            Datenbank-Kanon: <strong>»{item.fact}«</strong>
                          </div>
                        </div>

                        <div className="pt-2 flex items-center justify-between gap-2">
                          <span className="text-xs font-semibold text-emerald-400">
                            {item.suggestion}
                          </span>
                          <button
                            onClick={() => handleApplyCanonCorrection(item)}
                            className="touch-target px-3 py-1.5 rounded-lg bg-[var(--accent)] text-[var(--accent-contrast)] text-xs font-bold flex items-center gap-1.5 hover:opacity-90 shrink-0"
                            title="Kanonische Fassung in das Manuskript einsetzen"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>Auf Kanon korrigieren</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </section>
        )}

        {/* ======================================================== */}
        {/* 5. SINNLICHER-CHECKER (SHOW, DON'T TELL) (KI: FLASH) */}
        {/* ======================================================== */}
        {activeSection === 'senses' && (
          <section
            role="tabpanel"
            aria-labelledby="tab-senses"
            className="space-y-4"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-[var(--text-primary)]">
                  Sinne prüfen (Show, don&apos;t tell)
                </h3>
                <p className="text-xs text-[var(--text-muted)]">
                  Sensorische Tiefe · OmniRoute Flash
                </p>
              </div>
              {renderBadge('llm', `KI (${sensesModel})`)}
            </div>

            <div className="p-3.5 rounded-xl bg-[var(--bg-canvas)] border border-[var(--border-color)] space-y-2.5">
              <p className="text-xs text-[var(--text-secondary)]">
                Prüft, welche der 5 Sinne (Sehen, Hören, Riechen, Fühlen, Schmecken) im aktuellen Kapitel vorkommen und schlägt eine atmosphärische Ergänzung vor.
              </p>

              <button
                onClick={handleRunSensesCheck}
                disabled={isSensesLoading}
                className="touch-target w-full px-4 py-3 rounded-xl bg-[var(--accent)] text-[var(--accent-contrast)] font-bold text-sm sm:text-base flex items-center justify-center gap-2 hover:opacity-90 disabled:opacity-50 transition-opacity"
                aria-label="Sinne im Text prüfen"
              >
                {isSensesLoading ? (
                  <>
                    <Sparkles className="w-5 h-5 animate-spin" />
                    <span>Analysiere Sinneseindrücke…</span>
                  </>
                ) : (
                  <>
                    <Eye className="w-5 h-5" />
                    <span>Sinne prüfen</span>
                  </>
                )}
              </button>
            </div>

            {hasCheckedSenses && sensesData && (
              <div className="space-y-3.5" aria-live="polite">
                {/* Die 5 Sinne Visualisierung */}
                <div className="p-3.5 rounded-xl bg-[var(--bg-canvas)] border border-[var(--border-color)] space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
                      Sensorische Verteilung
                    </span>
                    <button
                      onClick={() =>
                        readAloud(
                          `Sinne-Verteilung: Sehen ${sensesData.scores.sehen}, Hören ${sensesData.scores.hoeren}, Fühlen ${sensesData.scores.fuehlen}, Riechen ${sensesData.scores.riechen}, Schmecken ${sensesData.scores.schmecken}. Am wenigsten genutzt: ${sensesData.leastUsedSense}.`
                        )
                      }
                      className="touch-target p-1 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                      title="Ergebnisse vorlesen"
                      aria-label="Sinne-Ergebnisse vorlesen"
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="space-y-2 text-xs">
                    {[
                      { key: 'sehen', label: 'Sehen', icon: Eye, color: 'bg-blue-500' },
                      { key: 'hoeren', label: 'Hören', icon: Ear, color: 'bg-indigo-500' },
                      { key: 'fuehlen', label: 'Fühlen', icon: Hand, color: 'bg-amber-500' },
                      { key: 'riechen', label: 'Riechen', icon: Flame, color: 'bg-emerald-500' },
                      { key: 'schmecken', label: 'Schmecken', icon: Coffee, color: 'bg-rose-500' },
                    ].map((sense) => {
                      const count = sensesData.scores[sense.key] || 0;
                      const maxScore = Math.max(...Object.values(sensesData.scores), 5);
                      const pct = Math.min(100, Math.round((count / maxScore) * 100));
                      const isWeakest =
                        sense.label.toLowerCase() ===
                        sensesData.leastUsedSense.toLowerCase();

                      return (
                        <div key={sense.key} className="space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="flex items-center gap-1.5 font-medium text-[var(--text-primary)]">
                              <sense.icon className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                              <span>{sense.label}</span>
                              {isWeakest && (
                                <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 font-bold">
                                  Ausbaufähig
                                </span>
                              )}
                            </span>
                            <span className="text-[var(--text-muted)] font-mono">
                              {count} {count === 1 ? 'Eindruck' : 'Eindrücke'}
                            </span>
                          </div>
                          <div className="w-full h-2 rounded-full bg-[var(--bg-surface)] overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-500 ${
                                isWeakest ? 'bg-amber-500' : sense.color
                              }`}
                              style={{ width: `${Math.max(8, pct)}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Vorschlag für den schwächsten Sinn */}
                <div className="p-3.5 rounded-xl bg-purple-500/10 border border-purple-500/30 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-purple-300 flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-purple-400" />
                      <span>Ergänzung für Sinn »{sensesData.leastUsedSense}«</span>
                    </span>
                    <button
                      onClick={() =>
                        readAloud(
                          `Vorschlag für ${sensesData.leastUsedSense}: ${sensesData.suggestion}. Textbeispiel: ${sensesData.exampleSnippet}`
                        )
                      }
                      className="touch-target p-1 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                      title="Vorschlag vorlesen"
                      aria-label="Sensorischen Vorschlag vorlesen"
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <p className="text-xs text-[var(--text-secondary)]">
                    {sensesData.suggestion}
                  </p>

                  {sensesData.exampleSnippet && (
                    <div className="p-2.5 rounded-lg bg-[var(--bg-canvas)] border border-[var(--border-color)] text-xs text-[var(--text-primary)] italic">
                      &quot;{sensesData.exampleSnippet}&quot;
                    </div>
                  )}

                  {sensesData.exampleSnippet && (
                    <div className="pt-1 flex justify-end">
                      <button
                        onClick={() =>
                          handleInsertSenseSnippet(sensesData.exampleSnippet)
                        }
                        className="touch-target px-3 py-1.5 rounded-lg bg-[var(--accent)] text-[var(--accent-contrast)] text-xs font-bold flex items-center gap-1.5 hover:opacity-90"
                        title="Vorschlag am Kapitelende anfügen"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>In Text einfügen</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </section>
        )}
      </div>

      {/* Panel Footer: Status & A11y Info */}
      <div className="p-3 border-t border-[var(--border-color)] bg-[var(--bg-canvas)]/70 flex items-center justify-between text-[11px] text-[var(--text-muted)]">
        <span className="flex items-center gap-1.5">
          <Info className="w-3.5 h-3.5 text-[var(--accent)]" />
          <span>Keine Hintergrund-Token-Kosten · Ausführung nur auf Klick</span>
        </span>
        <button
          onClick={() => {
            const currentDesc = `Lektorats-Panel aktiv. Aktueller Tab: ${activeSection}. Kapitel: ${chapterTitle}.`;
            readAloud(currentDesc);
          }}
          className="hover:underline flex items-center gap-1 text-[var(--text-secondary)]"
          title="Panel-Zusammenfassung vorlesen"
        >
          <Volume2 className="w-3.5 h-3.5" />
          <span>Vorlesen</span>
        </button>
      </div>
    </aside>
  );
};
