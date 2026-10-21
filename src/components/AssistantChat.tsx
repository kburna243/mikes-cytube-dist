import React, { useState } from 'react';
import {
  Sparkles,
  Send,
  CheckCircle,
  XCircle,
  HelpCircle,
  Volume2,
  Clock,
  ArrowRight,
  Lightbulb,
  ShieldCheck,
  FileCheck,
} from 'lucide-react';
import { Proposal, AccessibilitySettings, Chapter, Entity } from '../types/domain.js';
import { speechService } from '../services/speech.js';
import { api } from '../services/api.js';

interface AssistantChatProps {
  proposals: Proposal[];
  onAcceptProposal: (id: string) => Promise<void>;
  onRejectProposal: (id: string) => Promise<void>;
  chapters: Chapter[];
  entities: Entity[];
  currentChapterId?: string;
  accessibility: AccessibilitySettings;
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  proposals?: Proposal[];
  usedContext?: string[];
  timestamp: number;
}

export const AssistantChat: React.FC<AssistantChatProps> = ({
  proposals,
  onAcceptProposal,
  onRejectProposal,
  chapters,
  entities,
  currentChapterId,
  accessibility,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'msg-initial',
      sender: 'assistant',
      text: `Guten Tag! Ich bin dein Co-Pilot »Federführer«. Ich habe alle Figuren, Fakten und Kapitel deines Romans im Blick.

Ich unterstütze dich beim Entwickeln von Motiven, Szenen und der lückenlosen Überwachung deines Fakten-Kanons. Wenn ich Vorschläge habe, wandern sie als Entwurf in deine Prüf-Warteschlange – du entscheidest immer selbst, was ins Buch einfließt.`,
      timestamp: Date.now(),
    },
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [activeChapterFilter, setActiveChapterFilter] = useState<string>(currentChapterId || '');

  // 3 Guided Default Actions (§8.3 Kognitive Entlastung: "Was möchtest du tun?")
  const guidedActions = [
    {
      id: 'motive',
      label: 'Motiv für Szene suchen',
      prompt: 'Mir fehlt ein Motiv, warum Detektiv Lukas in Martas Backstube bleibt.',
      icon: Lightbulb,
    },
    {
      id: 'continuity',
      label: 'Kanon auf Widersprüche prüfen',
      prompt: 'Prüfe bitte Kapitel 12 gegen meine Fakten-Datenbank auf Unstimmigkeiten.',
      icon: ShieldCheck,
    },
    {
      id: 'beat',
      label: 'Neuen Handlungs-Beat spinnen',
      prompt: 'Schlage mir einen überraschenden Plot-Beat für den Hauptstrang am Mühlenbach vor.',
      icon: FileCheck,
    },
  ];

  const handleSendMessage = async (textToSend: string) => {
    const text = textToSend.trim();
    if (!text || isLoading) return;

    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}-user`,
      sender: 'user',
      text,
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const res = await api.chat(text, activeChapterFilter || undefined);
      const assistantMsg: ChatMessage = {
        id: `msg-${Date.now()}-assistant`,
        sender: 'assistant',
        text: res.answer,
        usedContext: res.used_context,
        proposals: res.proposals,
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, assistantMsg]);

      // If autoReadResponses setting is active
      if (accessibility.autoReadResponses) {
        speechService.speak(res.answer);
      }
    } catch (err: any) {
      const errorMsg: ChatMessage = {
        id: `msg-${Date.now()}-err`,
        sender: 'assistant',
        text: `Entschuldigung, es gab einen Fehler: ${err?.message || 'Verbindung fehlgeschlagen.'}`,
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const pendingProposals = proposals.filter((p) => p.status === 'pending');

  return (
    <div data-tour="copilot-container" className="mx-auto max-w-5xl px-4 py-6 pb-24 space-y-8">
      {/* SECTION 1: PROPOSAL REVIEW QUEUE (P4 Human-in-the-Loop) */}
      <div data-tour="copilot-queue" className="rounded-2xl bg-[var(--bg-surface)] border-2 border-[var(--border-color)] p-5 sm:p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-[var(--border-color)]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[var(--accent)] text-[var(--accent-contrast)] flex items-center justify-center font-bold">
              {pendingProposals.length}
            </div>
            <div>
              <h2 className="text-xl font-bold text-[var(--text-primary)]">
                Review-Warteschlange für Kanon-Vorschläge
              </h2>
              <p className="text-xs text-[var(--text-muted)]">
                Das LLM schreibt nie direkt in dein Werk. Erst deine Freigabe macht Vorschläge kanonisch.
              </p>
            </div>
          </div>
        </div>

        {pendingProposals.length === 0 ? (
          <div className="py-8 text-center text-[var(--text-muted)] text-base">
            <CheckCircle className="w-8 h-8 mx-auto mb-2 text-[var(--success)] opacity-70" />
            Keine offenen Vorschläge. Deine Datenbank ist aktuell und von dir freigegeben.
          </div>
        ) : (
          <div className="mt-4 space-y-4">
            {pendingProposals.map((prop) => (
              <div
                key={prop.id}
                className="p-4 sm:p-5 rounded-xl bg-[var(--bg-canvas)] border-2 border-[var(--accent)]/50 shadow-md flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 text-xs text-[var(--text-muted)] mb-2 font-mono">
                    <span>VORSCHLAG {prop.id.toUpperCase()}</span>
                    <span>Operation: {prop.op}</span>
                  </div>

                  <h3 className="text-lg font-bold text-[var(--text-primary)] mb-1">
                    {prop.op === 'append_fact'
                      ? `Neuer Fakt: »${prop.payload?.statement}«`
                      : prop.op === 'append_beat'
                      ? `Neuer Beat: »${prop.payload?.title}«`
                      : `Textänderung für ${prop.target_id}`}
                  </h3>

                  <p className="text-sm text-[var(--text-secondary)] mt-2 leading-relaxed bg-[var(--bg-surface)] p-3 rounded-lg border border-[var(--border-color)]">
                    <strong className="text-[var(--text-primary)]">Begründung des Co-Piloten:</strong> {prop.rationale}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-[var(--border-color)] flex flex-wrap items-center justify-between gap-3">
                  <button
                    onClick={() => speechService.speak(`Vorschlag ${prop.id}. ${prop.rationale}`)}
                    className="touch-target px-3 py-1.5 rounded-lg text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] flex items-center gap-1.5"
                    title="Diesen Vorschlag vorlesen"
                  >
                    <Volume2 className="w-4 h-4 text-[var(--accent)]" />
                    <span>Vorlesen</span>
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onRejectProposal(prop.id)}
                      className="touch-target px-4 py-2 rounded-xl border border-[var(--danger)] text-[var(--danger)] hover:bg-[var(--danger)]/10 font-bold text-sm flex items-center gap-1.5"
                    >
                      <XCircle className="w-4 h-4" /> Verwerfen
                    </button>
                    <button
                      onClick={() => onAcceptProposal(prop.id)}
                      className="touch-target px-5 py-2 rounded-xl bg-[var(--accent)] text-[var(--accent-contrast)] font-bold text-sm flex items-center gap-1.5 shadow"
                    >
                      <CheckCircle className="w-4 h-4" /> In Kanon übernehmen
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* SECTION 2: CO-PILOT DIALOG (P6: Ein Ziel pro Bildschirm & geführte Aktionen) */}
      <div className="rounded-2xl bg-[var(--bg-surface)] border-2 border-[var(--border-color)] p-5 sm:p-6 shadow-sm">
        <h2 className="text-xl font-bold text-[var(--text-primary)] mb-3 flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-[var(--accent)]" />
          Co-Pilot Dialog & Schreibassistenz
        </h2>

        {/* Guided 3 Actions for Aunt (Spec P6 & §8.3) */}
        <div className="mb-6" data-tour="copilot-actions">
          <div className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] mb-2">
            Schnell-Aktionen: Was möchtest du tun?
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {guidedActions.map((action) => {
              const Icon = action.icon;
              return (
                <button
                  key={action.id}
                  onClick={() => handleSendMessage(action.prompt)}
                  disabled={isLoading}
                  className="touch-target p-3.5 rounded-xl bg-[var(--bg-canvas)] border-2 border-[var(--border-color)] hover:border-[var(--accent)] text-left flex items-start gap-3 transition-colors group"
                >
                  <Icon className="w-5 h-5 text-[var(--accent)] shrink-0 mt-0.5" />
                  <div>
                    <div className="font-bold text-sm text-[var(--text-primary)] group-hover:text-[var(--accent)]">
                      {action.label}
                    </div>
                    <div className="text-xs text-[var(--text-muted)] mt-0.5 line-clamp-2">
                      »{action.prompt}«
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Message History */}
        <div className="space-y-4 max-h-[460px] overflow-y-auto p-2 pr-3" role="log" aria-live="polite">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`p-4 rounded-2xl ${
                msg.sender === 'user'
                  ? 'bg-[var(--accent)] text-[var(--accent-contrast)] ml-8 sm:ml-16 font-medium'
                  : 'bg-[var(--bg-canvas)] text-[var(--text-primary)] mr-8 sm:mr-16 border border-[var(--border-color)]'
              }`}
            >
              <div className="flex items-center justify-between text-xs opacity-75 mb-1.5">
                <span className="font-bold">{msg.sender === 'user' ? 'Du (Autorin)' : 'Co-Pilot Federführer'}</span>
                {msg.sender === 'assistant' && (
                  <button
                    onClick={() => speechService.speak(msg.text)}
                    className="p-1 rounded hover:opacity-100 touch-target flex items-center gap-1 font-semibold"
                    aria-label="Antwort vorlesen"
                  >
                    <Volume2 className="w-4 h-4" /> Vorlesen
                  </button>
                )}
              </div>
              <div className="text-base sm:text-lg whitespace-pre-wrap leading-relaxed">
                {msg.text}
              </div>

              {msg.usedContext && msg.usedContext.length > 0 && (
                <div className="mt-3 pt-2 border-t border-[var(--border-color)] text-xs text-[var(--text-muted)]">
                  Einbezogener Kontext: {msg.usedContext.join(' · ')}
                </div>
              )}
            </div>
          ))}

          {isLoading && (
            <div className="p-4 rounded-2xl bg-[var(--bg-canvas)] border border-[var(--border-color)] mr-16 flex items-center gap-3 text-[var(--accent)] font-bold text-base animate-pulse">
              <Sparkles className="w-5 h-5 animate-spin" />
              <span>Analysiere Romankontext und Fakten…</span>
            </div>
          )}
        </div>

        {/* Input Bar */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage(inputMessage);
          }}
          className="mt-4 flex items-center gap-2"
        >
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder="Frage den Co-Piloten etwas oder diktiere deine Frage…"
            disabled={isLoading}
            className="flex-1 px-4 py-3 rounded-2xl bg-[var(--bg-canvas)] text-[var(--text-primary)] border-2 border-[var(--border-color)] focus:border-[var(--accent)] text-base"
          />
          <button
            type="submit"
            disabled={!inputMessage.trim() || isLoading}
            className="touch-target px-5 py-3 rounded-2xl bg-[var(--accent)] text-[var(--accent-contrast)] font-bold text-base flex items-center gap-2 disabled:opacity-50 shadow"
            aria-label="Nachricht an Co-Pilot absenden"
          >
            <Send className="w-5 h-5" />
            <span className="hidden sm:inline">Senden</span>
          </button>
        </form>
      </div>
    </div>
  );
};
