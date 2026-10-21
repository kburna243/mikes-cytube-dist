import React, { useState, useRef } from 'react';
import {
  Upload,
  FileText,
  ClipboardPaste,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  X,
  Tag,
  ArrowRight,
  BookOpen,
  Volume2,
  Layers,
  Plus,
  Trash2,
} from 'lucide-react';
import { ResearchSource, AccessibilitySettings } from '../../types/domain.js';
import { speechService } from '../../services/speech.js';

export interface ExtractedResearchItem {
  id: string;
  title: string;
  content: string;
  source: string;
  tags: string[];
}

export interface ResearchImportProps {
  onImportComplete: (items: ResearchSource[]) => Promise<void> | void;
  onClose?: () => void;
  accessibility?: AccessibilitySettings;
}

export const ResearchImport: React.FC<ResearchImportProps> = ({
  onImportComplete,
  onClose,
  accessibility,
}) => {
  const [activeTab, setActiveTab] = useState<'upload' | 'smartpaste'>('upload');

  // File Upload State
  const [isDragging, setIsDragging] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);
  const [parsedFileItem, setParsedFileItem] = useState<ExtractedResearchItem | null>(null);
  const [fileName, setFileName] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Smart Paste State
  const [pasteContent, setPasteContent] = useState('');
  const [defaultSource, setDefaultSource] = useState('NotebookLM / Deep Research');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [pasteError, setPasteError] = useState<string | null>(null);
  const [pasteSuccess, setPasteSuccess] = useState<string | null>(null);
  const [extractedItems, setExtractedItems] = useState<ExtractedResearchItem[]>([]);
  const [manualTagInput, setManualTagInput] = useState('');

  // Live announcer state for Screenreaders
  const [announcement, setAnnouncement] = useState<string>('');

  const announce = (msg: string) => {
    setAnnouncement(msg);
  };

  /**
   * Helper: Extracts hashtags from text
   */
  const extractHashtags = (text: string): string[] => {
    const matches = text.match(/#([\w\u00C0-\u017F-]+)/g);
    if (!matches) return [];
    return Array.from(new Set(matches.map((m) => m.slice(1).trim().toLowerCase()))).filter(
      Boolean
    );
  };

  /**
   * 1. PARSE MARKDOWN / TXT FILE
   */
  const handleFileProcess = async (file: File) => {
    setUploadError(null);
    setUploadSuccess(null);
    setParsedFileItem(null);

    // Validate size (max 5 MB)
    const MAX_SIZE = 5 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      const err = `Die Datei "${file.name}" ist zu groß (${(file.size / (1024 * 1024)).toFixed(1)} MB). Erlaubt sind maximal 5 MB.`;
      setUploadError(err);
      announce(err);
      return;
    }

    // Validate extension / MIME
    const isMd = file.name.toLowerCase().endsWith('.md');
    const isTxt = file.name.toLowerCase().endsWith('.txt');
    if (!isMd && !isTxt && !file.type.startsWith('text/')) {
      const err = `Ungültiges Dateiformat für "${file.name}". Bitte laden Sie ausschließlich .md (Markdown) oder .txt (Text) Dateien hoch.`;
      setUploadError(err);
      announce(err);
      return;
    }

    try {
      const rawText = await file.text();
      if (!rawText.trim()) {
        const err = `Die Datei "${file.name}" ist leer.`;
        setUploadError(err);
        announce(err);
        return;
      }

      setFileName(file.name);

      // Parse H1 as title, rest as content, filename as source
      const lines = rawText.split(/\r?\n/);
      let title = '';
      let contentStartIndex = 0;

      // Find first non-empty line
      let firstNonEmptyIndex = -1;
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].trim().length > 0) {
          firstNonEmptyIndex = i;
          break;
        }
      }

      if (firstNonEmptyIndex !== -1) {
        const firstLine = lines[firstNonEmptyIndex].trim();
        if (firstLine.startsWith('# ')) {
          title = firstLine.replace(/^#\s+/, '').trim();
          contentStartIndex = firstNonEmptyIndex + 1;
        } else if (firstLine.startsWith('#')) {
          title = firstLine.replace(/^#+\s*/, '').trim();
          contentStartIndex = firstNonEmptyIndex + 1;
        } else {
          // Fallback: Use first non-empty line as title if short, otherwise use filename
          if (firstLine.length <= 100) {
            title = firstLine;
            contentStartIndex = firstNonEmptyIndex + 1;
          } else {
            title = file.name.replace(/\.[^/.]+$/, '');
            contentStartIndex = firstNonEmptyIndex;
          }
        }
      }

      if (!title) {
        title = file.name.replace(/\.[^/.]+$/, '');
      }

      const content = lines.slice(contentStartIndex).join('\n').trim() || lines.join('\n').trim();
      const extractedTags = extractHashtags(rawText);

      const parsed: ExtractedResearchItem = {
        id: `res-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`,
        title,
        content,
        source: file.name,
        tags: extractedTags,
      };

      setParsedFileItem(parsed);
      const successMsg = `Datei "${file.name}" erfolgreich verarbeitet: "${title}" erkannt mit ${extractedTags.length} Schlagwörtern.`;
      setUploadSuccess(successMsg);
      announce(successMsg);
    } catch (err: any) {
      const errorMsg = `Fehler beim Einlesen der Datei: ${err.message || 'Unbekannter Fehler'}`;
      setUploadError(errorMsg);
      announce(errorMsg);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileProcess(e.dataTransfer.files[0]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFileProcess(e.target.files[0]);
    }
  };

  /**
   * 2. SMART PASTE & INTELLIGENT DEEP RESEARCH / NOTEBOOKLM PARSER
   */
  const handleIntelligentAnalysis = () => {
    setPasteError(null);
    setPasteSuccess(null);
    setExtractedItems([]);

    const text = pasteContent.trim();
    if (!text) {
      const err = 'Bitte fügen Sie zuerst Text in das Recherche-Feld ein.';
      setPasteError(err);
      announce(err);
      return;
    }

    setIsAnalyzing(true);
    announce('Recherchetext wird analysiert und in Abschnitte zerlegt...');

    try {
      // Split logic tailored for NotebookLM, Deep Research, and Markdown exports:
      // 1. Check if text has sections separated by ## or ### headings
      const headingRegex = /(?:^|\n)(#{1,3}\s+[^\n]+)/g;
      const headingMatches = Array.from(text.matchAll(headingRegex));

      const items: ExtractedResearchItem[] = [];

      if (headingMatches.length >= 2) {
        // Multi-section document with Markdown headings
        for (let i = 0; i < headingMatches.length; i++) {
          const match = headingMatches[i];
          const rawHeading = match[1].trim();
          const title = rawHeading.replace(/^#+\s*/, '').trim();

          const startIndex = (match.index ?? 0) + match[0].length;
          const nextMatch = headingMatches[i + 1];
          const endIndex = nextMatch ? (nextMatch.index ?? text.length) : text.length;

          let sectionText = text.substring(startIndex, endIndex).trim();

          // Extract inline sources or footnotes
          let sectionSource = defaultSource;
          const sourceMatch = sectionText.match(/(?:Quelle|Fundstelle|Source|Citation):\s*([^\n]+)/i);
          if (sourceMatch) {
            sectionSource = sourceMatch[1].trim();
          }

          const tags = Array.from(new Set([...extractHashtags(sectionText), ...extractHashtags(title)]));

          if (sectionText.length > 10) {
            items.push({
              id: `res-${Date.now().toString(36)}-${i}-${Math.random().toString(36).substring(2, 6)}`,
              title,
              content: sectionText,
              source: sectionSource,
              tags,
            });
          }
        }
      } else {
        // Fallback: Split by dividers (---) or double newlines with bold headings
        const blocks = text.split(/\n\s*---\s*\n|\n{2,}(?=\*\*[^*]+\*\*|\d+\.\s+)/);

        if (blocks.length > 1) {
          blocks.forEach((block, idx) => {
            const b = block.trim();
            if (!b) return;

            const bLines = b.split('\n');
            let bTitle = '';
            let bContent = '';

            const firstLine = bLines[0].trim();
            if (firstLine.startsWith('#')) {
              bTitle = firstLine.replace(/^#+\s*/, '').trim();
              bContent = bLines.slice(1).join('\n').trim();
            } else if (firstLine.startsWith('**') && firstLine.endsWith('**')) {
              bTitle = firstLine.replace(/\*\*/g, '').trim();
              bContent = bLines.slice(1).join('\n').trim();
            } else if (/^\d+\.\s+/.test(firstLine)) {
              bTitle = firstLine.replace(/^\d+\.\s+/, '').trim();
              bContent = bLines.slice(1).join('\n').trim();
            } else {
              bTitle = firstLine.slice(0, 60);
              bContent = b;
            }

            let bSource = defaultSource;
            const srcMatch = b.match(/(?:Quelle|Fundstelle|Source|Citation):\s*([^\n]+)/i);
            if (srcMatch) {
              bSource = srcMatch[1].trim();
            }

            const tags = extractHashtags(b);

            items.push({
              id: `res-${Date.now().toString(36)}-${idx}-${Math.random().toString(36).substring(2, 6)}`,
              title: bTitle || `Recherche-Auszug ${idx + 1}`,
              content: bContent || b,
              source: bSource,
              tags,
            });
          });
        } else {
          // Single comprehensive note
          const lines = text.split('\n');
          let singleTitle = 'NotebookLM Recherche';
          let body = text;

          if (lines[0].trim().startsWith('#')) {
            singleTitle = lines[0].trim().replace(/^#+\s*/, '');
            body = lines.slice(1).join('\n').trim();
          } else if (lines[0].trim().length < 80) {
            singleTitle = lines[0].trim();
            body = lines.slice(1).join('\n').trim();
          }

          items.push({
            id: `res-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`,
            title: singleTitle,
            content: body || text,
            source: defaultSource,
            tags: extractHashtags(text),
          });
        }
      }

      setExtractedItems(items);
      const msg = `Analyse abgeschlossen: ${items.length} ${
        items.length === 1 ? 'Abschnitt' : 'Abschnitte'
      } erfolgreich erkannt und vorstrukturiert.`;
      setPasteSuccess(msg);
      announce(msg);
    } catch (err: any) {
      const errorMsg = `Fehler bei der Analyse: ${err.message || 'Unbekannter Fehler'}`;
      setPasteError(errorMsg);
      announce(errorMsg);
    } finally {
      setIsAnalyzing(false);
    }
  };

  /**
   * Save parsed file note to database
   */
  const handleSaveParsedFile = async () => {
    if (!parsedFileItem) return;

    const manualTags = manualTagInput
      .split(',')
      .map((t) => t.trim().replace(/^#/, ''))
      .filter(Boolean);

    const mergedTags = Array.from(new Set([...parsedFileItem.tags, ...manualTags]));

    const sourceItem: ResearchSource = {
      id: parsedFileItem.id,
      title: parsedFileItem.title,
      type: 'note',
      content: parsedFileItem.content,
      tags: mergedTags,
      citation: parsedFileItem.source,
      created_at: Date.now(),
    };

    try {
      await onImportComplete([sourceItem]);
      const successMsg = `»${sourceItem.title}« erfolgreich in die Recherche-Datenbank importiert!`;
      setUploadSuccess(successMsg);
      announce(successMsg);
      setParsedFileItem(null);
      setFileName('');
      setManualTagInput('');
    } catch (err: any) {
      setUploadError(`Fehler beim Speichern in der Datenbank: ${err.message}`);
    }
  };

  /**
   * Save all smart paste extracted items to database
   */
  const handleSaveAllExtracted = async () => {
    if (extractedItems.length === 0) return;

    const manualTags = manualTagInput
      .split(',')
      .map((t) => t.trim().replace(/^#/, ''))
      .filter(Boolean);

    const sourceItems: ResearchSource[] = extractedItems.map((item) => ({
      id: item.id,
      title: item.title,
      type: 'note',
      content: item.content,
      tags: Array.from(new Set([...item.tags, ...manualTags])),
      citation: item.source,
      created_at: Date.now(),
    }));

    try {
      await onImportComplete(sourceItems);
      const successMsg = `${sourceItems.length} Recherche-Notizen erfolgreich in die Datenbank importiert!`;
      setPasteSuccess(successMsg);
      announce(successMsg);
      setExtractedItems([]);
      setPasteContent('');
      setManualTagInput('');
    } catch (err: any) {
      setPasteError(`Fehler beim Speichern in der Datenbank: ${err.message}`);
    }
  };

  /**
   * Remove single item from extracted preview
   */
  const handleRemoveExtractedItem = (id: string) => {
    setExtractedItems((prev) => prev.filter((item) => item.id !== id));
    announce('Abschnitt entfernt.');
  };

  return (
    <section
      aria-labelledby="research-import-heading"
      className="rounded-2xl border-2 border-[var(--border-color)] bg-[var(--bg-surface-elevated)] p-5 sm:p-7 shadow-xl space-y-6"
    >
      {/* Invisible Screenreader Live Announcer */}
      <div
        className="sr-only"
        role="status"
        aria-live="polite"
        aria-atomic="true"
      >
        {announcement}
      </div>

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[var(--border-color)] pb-4">
        <div>
          <h2
            id="research-import-heading"
            className="text-xl sm:text-2xl font-bold text-[var(--text-primary)] flex items-center gap-2.5"
          >
            <Upload className="w-6 h-6 text-[var(--accent)]" aria-hidden="true" />
            Recherche-Import & Analyse
          </h2>
          <p className="text-sm sm:text-base text-[var(--text-secondary)] mt-1">
            Lade Markdown-/Text-Dateien hoch oder füge Recherchen aus NotebookLM & Deep Research ein.
          </p>
        </div>

        {onClose && (
          <button
            onClick={onClose}
            className="min-h-[48px] min-w-[48px] p-2.5 rounded-xl border border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-canvas)] transition-colors focus-visible:ring-4 focus-visible:ring-[var(--accent)] flex items-center justify-center"
            aria-label="Import-Bereich schließen"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        )}
      </div>

      {/* Mode Switch: File Upload vs. Smart Paste */}
      <div
        role="tablist"
        aria-label="Import-Methode auswählen"
        className="grid grid-cols-2 gap-2 p-1.5 rounded-xl bg-[var(--bg-canvas)] border border-[var(--border-color)]"
      >
        <button
          role="tab"
          aria-selected={activeTab === 'upload'}
          aria-controls="upload-panel"
          id="upload-tab"
          onClick={() => setActiveTab('upload')}
          className={`min-h-[48px] px-4 py-2.5 rounded-lg text-sm sm:text-base font-bold transition-all flex items-center justify-center gap-2.5 focus-visible:ring-4 focus-visible:ring-[var(--accent)] ${
            activeTab === 'upload'
              ? 'bg-[var(--bg-surface-elevated)] text-[var(--accent)] shadow-md border border-[var(--accent)]'
              : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
          }`}
        >
          <FileText className="w-5 h-5" aria-hidden="true" />
          <span>Markdown-Datei (.md / .txt)</span>
        </button>

        <button
          role="tab"
          aria-selected={activeTab === 'smartpaste'}
          aria-controls="smartpaste-panel"
          id="smartpaste-tab"
          onClick={() => setActiveTab('smartpaste')}
          className={`min-h-[48px] px-4 py-2.5 rounded-lg text-sm sm:text-base font-bold transition-all flex items-center justify-center gap-2.5 focus-visible:ring-4 focus-visible:ring-[var(--accent)] ${
            activeTab === 'smartpaste'
              ? 'bg-[var(--bg-surface-elevated)] text-[var(--accent)] shadow-md border border-[var(--accent)]'
              : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
          }`}
        >
          <ClipboardPaste className="w-5 h-5" aria-hidden="true" />
          <span>Smart Paste (NotebookLM)</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* METHOD 1: MARKDOWN & TXT FILE UPLOAD                                      */}
      {/* ========================================================================= */}
      {activeTab === 'upload' && (
        <div
          role="tabpanel"
          id="upload-panel"
          aria-labelledby="upload-tab"
          className="space-y-5"
        >
          {/* Dropzone */}
          <div
            role="region"
            aria-dropzone="copy"
            tabIndex={0}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                fileInputRef.current?.click();
              }
            }}
            className={`cursor-pointer rounded-2xl border-3 border-dashed p-8 sm:p-12 text-center transition-all focus-visible:ring-4 focus-visible:ring-[var(--accent)] outline-none flex flex-col items-center justify-center gap-3 ${
              isDragging
                ? 'border-[var(--accent)] bg-[var(--accent)]/10 scale-[1.01]'
                : 'border-[var(--border-color)] bg-[var(--bg-canvas)] hover:border-[var(--accent)] hover:bg-[var(--bg-surface-elevated)]'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".md,.txt,text/markdown,text/plain"
              onChange={handleFileInputChange}
              className="sr-only"
              aria-label="Markdown- oder Textdatei auswählen"
            />

            <div className="w-16 h-16 rounded-2xl bg-[var(--accent)]/10 border border-[var(--accent)]/30 flex items-center justify-center text-[var(--accent)]">
              <Upload className="w-8 h-8" aria-hidden="true" />
            </div>

            <div>
              <p className="text-lg sm:text-xl font-bold text-[var(--text-primary)]">
                Datei hierhin ziehen oder klicken zum Auswählen
              </p>
              <p className="text-sm text-[var(--text-muted)] mt-1">
                Unterstützte Formate: <strong>.md</strong> (Markdown) und <strong>.txt</strong> (maximal 5 MB)
              </p>
            </div>

            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--bg-surface-elevated)] border border-[var(--border-color)] text-xs font-semibold text-[var(--text-secondary)]">
              Erste Zeile (# Titel) wird automatisch zur Notiz-Überschrift
            </span>
          </div>

          {/* Upload Error Banner */}
          {uploadError && (
            <div
              role="alert"
              aria-live="assertive"
              className="p-4 rounded-xl bg-red-950/40 border-2 border-red-500/80 text-red-200 text-sm sm:text-base flex items-start gap-3"
            >
              <AlertTriangle className="w-6 h-6 text-red-400 shrink-0 mt-0.5" aria-hidden="true" />
              <div>
                <strong className="block font-bold">Fehler beim Datei-Upload:</strong>
                <span>{uploadError}</span>
              </div>
            </div>
          )}

          {/* Upload Success Banner */}
          {uploadSuccess && !parsedFileItem && (
            <div
              role="status"
              aria-live="polite"
              className="p-4 rounded-xl bg-emerald-950/40 border-2 border-emerald-500/80 text-emerald-200 text-sm sm:text-base flex items-center gap-3"
            >
              <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0" aria-hidden="true" />
              <span>{uploadSuccess}</span>
            </div>
          )}

          {/* Parsed File Preview & Confirmation */}
          {parsedFileItem && (
            <div className="rounded-xl border-2 border-[var(--accent)] bg-[var(--bg-canvas)] p-5 space-y-4">
              <div className="flex items-center justify-between gap-2 border-b border-[var(--border-color)] pb-3">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-[var(--accent)]" aria-hidden="true" />
                  <span className="text-sm font-bold uppercase tracking-wider text-[var(--accent)]">
                    Erkannte Recherche-Notiz ({fileName})
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    speechService.speak(
                      `Titel: ${parsedFileItem.title}. Inhalt: ${parsedFileItem.content.slice(0, 300)}`
                    )
                  }
                  className="min-h-[40px] px-3 py-1.5 rounded-lg border border-[var(--border-color)] text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] flex items-center gap-1.5"
                  aria-label="Erkannte Notiz vorlesen"
                >
                  <Volume2 className="w-4 h-4" aria-hidden="true" />
                  <span>Vorlesen</span>
                </button>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] mb-1">
                  Titel (automatisch aus H1)
                </label>
                <input
                  type="text"
                  value={parsedFileItem.title}
                  onChange={(e) =>
                    setParsedFileItem({ ...parsedFileItem, title: e.target.value })
                  }
                  className="w-full px-4 py-2.5 rounded-xl bg-[var(--bg-surface-elevated)] text-[var(--text-primary)] border border-[var(--border-color)] font-bold text-base focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] mb-1">
                  Inhalt (Text/Markdown)
                </label>
                <textarea
                  rows={6}
                  value={parsedFileItem.content}
                  onChange={(e) =>
                    setParsedFileItem({ ...parsedFileItem, content: e.target.value })
                  }
                  className="w-full px-4 py-3 rounded-xl bg-[var(--bg-surface-elevated)] text-[var(--text-primary)] border border-[var(--border-color)] font-mono text-sm leading-relaxed focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] mb-1">
                    Quelle (Dateiname)
                  </label>
                  <input
                    type="text"
                    value={parsedFileItem.source}
                    onChange={(e) =>
                      setParsedFileItem({ ...parsedFileItem, source: e.target.value })
                    }
                    className="w-full px-4 py-2.5 rounded-xl bg-[var(--bg-surface-elevated)] text-[var(--text-primary)] border border-[var(--border-color)] text-sm focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] mb-1">
                    Zusätzliche Tags (z.B. kriminalistik, 1928)
                  </label>
                  <input
                    type="text"
                    value={manualTagInput}
                    onChange={(e) => setManualTagInput(e.target.value)}
                    placeholder="kommagetrennt..."
                    className="w-full px-4 py-2.5 rounded-xl bg-[var(--bg-surface-elevated)] text-[var(--text-primary)] border border-[var(--border-color)] text-sm focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
                  />
                </div>
              </div>

              {parsedFileItem.tags.length > 0 && (
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  <span className="text-xs text-[var(--text-muted)] font-semibold">
                    Aus Hashtags extrahiert:
                  </span>
                  {parsedFileItem.tags.map((t) => (
                    <span
                      key={t}
                      className="px-2 py-0.5 rounded bg-[var(--bg-surface-elevated)] border border-[var(--border-color)] text-xs text-[var(--accent)] font-medium"
                    >
                      #{t}
                    </span>
                  ))}
                </div>
              )}

              <div className="pt-2 flex flex-wrap items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setParsedFileItem(null)}
                  className="min-h-[48px] px-5 py-2.5 rounded-xl border border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] text-sm font-bold"
                >
                  Verwerfen
                </button>

                <button
                  type="button"
                  onClick={handleSaveParsedFile}
                  className="min-h-[48px] px-6 py-2.5 rounded-xl bg-[var(--accent)] text-[var(--bg-canvas)] font-bold text-base hover:brightness-110 focus-visible:ring-4 focus-visible:ring-[var(--accent)] flex items-center gap-2"
                >
                  <CheckCircle2 className="w-5 h-5" aria-hidden="true" />
                  <span>In Datenbank speichern</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* METHOD 2: SMART PASTE FOR NOTEBOOKLM / DEEP RESEARCH                      */}
      {/* ========================================================================= */}
      {activeTab === 'smartpaste' && (
        <div
          role="tabpanel"
          id="smartpaste-panel"
          aria-labelledby="smartpaste-tab"
          className="space-y-5"
        >
          <div>
            <label
              htmlFor="smart-paste-textarea"
              className="block text-base sm:text-lg font-bold text-[var(--text-primary)] mb-1.5"
            >
              Recherche hier einfügen (z.B. aus NotebookLM)
            </label>
            <p className="text-xs sm:text-sm text-[var(--text-muted)] mb-2.5">
              Füge den kopierten Text ein. Der intelligente Parser zerlegt Abschnitte, erkennt Quellen und zieht Hashtags automatisch heraus.
            </p>
            <textarea
              id="smart-paste-textarea"
              rows={9}
              value={pasteContent}
              onChange={(e) => setPasteContent(e.target.value)}
              placeholder={`Beispiel aus NotebookLM:\n## Giftmord-Ermittlungsmethoden in Preußen (1928)\nDie Toxikologie stützte sich maßgeblich auf die Marshsche Arsenprobe.\nQuelle: Archiv der Charité Berlin, Akte 419\n#forensik #1920er\n\n## Zeugenaussagen im Strafprozess\nProtokolliert wurden Aussagen noch überwiegend handschriftlich.\nQuelle: Reichsjustizblatt 1928, S. 44`}
              className="w-full px-4 py-3.5 rounded-xl bg-[var(--bg-canvas)] text-[var(--text-primary)] border-2 border-[var(--border-color)] font-mono text-sm leading-relaxed focus-visible:ring-4 focus-visible:ring-[var(--accent)] outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="default-source-input"
                className="block text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] mb-1"
              >
                Standard-Quellenangabe
              </label>
              <input
                id="default-source-input"
                type="text"
                value={defaultSource}
                onChange={(e) => setDefaultSource(e.target.value)}
                placeholder="z. B. NotebookLM / Deep Research"
                className="w-full px-4 py-2.5 rounded-xl bg-[var(--bg-canvas)] text-[var(--text-primary)] border border-[var(--border-color)] text-sm focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
              />
            </div>

            <div>
              <label
                htmlFor="manual-tags-input"
                className="block text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] mb-1"
              >
                Gemeinsame Tags (optional)
              </label>
              <input
                id="manual-tags-input"
                type="text"
                value={manualTagInput}
                onChange={(e) => setManualTagInput(e.target.value)}
                placeholder="z. B. recherchen, kapitel3"
                className="w-full px-4 py-2.5 rounded-xl bg-[var(--bg-canvas)] text-[var(--text-primary)] border border-[var(--border-color)] text-sm focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <span className="text-xs text-[var(--text-muted)]">
              {pasteContent.length > 0
                ? `${pasteContent.length} Zeichen erfasst`
                : 'Feld ist leer'}
            </span>

            <button
              type="button"
              disabled={isAnalyzing || !pasteContent.trim()}
              onClick={handleIntelligentAnalysis}
              aria-busy={isAnalyzing}
              className="min-h-[48px] px-6 py-3 rounded-xl bg-[var(--accent)] text-[var(--bg-canvas)] font-bold text-base hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed focus-visible:ring-4 focus-visible:ring-[var(--accent)] flex items-center gap-2.5 shadow-md"
            >
              <Sparkles className="w-5 h-5 shrink-0" aria-hidden="true" />
              <span>{isAnalyzing ? 'Analysiere...' : 'Intelligent analysieren'}</span>
            </button>
          </div>

          {/* Paste Error Banner */}
          {pasteError && (
            <div
              role="alert"
              aria-live="assertive"
              className="p-4 rounded-xl bg-red-950/40 border-2 border-red-500/80 text-red-200 text-sm sm:text-base flex items-start gap-3"
            >
              <AlertTriangle className="w-6 h-6 text-red-400 shrink-0 mt-0.5" aria-hidden="true" />
              <div>
                <strong className="block font-bold">Fehler beim Einfügen / Analysieren:</strong>
                <span>{pasteError}</span>
              </div>
            </div>
          )}

          {/* Paste Success Banner */}
          {pasteSuccess && extractedItems.length === 0 && (
            <div
              role="status"
              aria-live="polite"
              className="p-4 rounded-xl bg-emerald-950/40 border-2 border-emerald-500/80 text-emerald-200 text-sm sm:text-base flex items-center gap-3"
            >
              <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0" aria-hidden="true" />
              <span>{pasteSuccess}</span>
            </div>
          )}

          {/* Extracted Sections Preview */}
          {extractedItems.length > 0 && (
            <div className="space-y-4 pt-3 border-t border-[var(--border-color)]">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Layers className="w-5 h-5 text-[var(--accent)]" aria-hidden="true" />
                  <h3 className="text-lg font-bold text-[var(--text-primary)]">
                    Erkannte Abschnitte ({extractedItems.length})
                  </h3>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setExtractedItems([])}
                    className="min-h-[44px] px-3.5 py-1.5 rounded-lg border border-[var(--border-color)] text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                  >
                    Verwerfen
                  </button>

                  <button
                    type="button"
                    onClick={handleSaveAllExtracted}
                    className="min-h-[48px] px-5 py-2.5 rounded-xl bg-[var(--accent)] text-[var(--bg-canvas)] font-bold text-sm sm:text-base hover:brightness-110 focus-visible:ring-4 focus-visible:ring-[var(--accent)] flex items-center gap-2 shadow-md"
                  >
                    <CheckCircle2 className="w-5 h-5" aria-hidden="true" />
                    <span>Alle {extractedItems.length} Notizen importieren</span>
                  </button>
                </div>
              </div>

              <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                {extractedItems.map((item, idx) => (
                  <div
                    key={item.id}
                    className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-canvas)] p-4 space-y-2.5"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <span className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider block mb-0.5">
                          Abschnitt {idx + 1}
                        </span>
                        <input
                          type="text"
                          value={item.title}
                          onChange={(e) => {
                            const newTitle = e.target.value;
                            setExtractedItems((prev) =>
                              prev.map((it) => (it.id === item.id ? { ...it, title: newTitle } : it))
                            );
                          }}
                          className="w-full px-3 py-1.5 rounded-lg bg-[var(--bg-surface-elevated)] text-[var(--text-primary)] border border-[var(--border-color)] font-bold text-base focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
                        />
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRemoveExtractedItem(item.id)}
                        className="min-h-[40px] min-w-[40px] p-2 rounded-lg text-red-400 hover:bg-red-950/30 transition-colors flex items-center justify-center"
                        aria-label={`Abschnitt ${item.title} entfernen`}
                      >
                        <Trash2 className="w-4 h-4" aria-hidden="true" />
                      </button>
                    </div>

                    <p className="text-sm text-[var(--text-secondary)] line-clamp-3 leading-relaxed">
                      {item.content}
                    </p>

                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs pt-1 border-t border-[var(--border-color)]/50">
                      <span className="text-[var(--text-muted)]">
                        Quelle: <strong className="text-[var(--text-secondary)]">{item.source}</strong>
                      </span>

                      {item.tags.length > 0 && (
                        <div className="flex items-center gap-1">
                          {item.tags.map((t) => (
                            <span
                              key={t}
                              className="px-1.5 py-0.5 rounded bg-[var(--bg-surface-elevated)] border border-[var(--border-color)] text-xs text-[var(--accent)]"
                            >
                              #{t}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  );
};
