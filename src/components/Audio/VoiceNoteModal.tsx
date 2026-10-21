import React, { useState, useRef, useEffect } from 'react';
import {
  Mic,
  Square,
  Sparkles,
  Play,
  Pause,
  Copy,
  Plus,
  BookOpen,
  Search,
  Check,
  AlertCircle,
  X,
  Radio,
  FileText,
} from 'lucide-react';
import { api } from '../../services/api.js';

interface VoiceNoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  chapterId?: string;
  chapterTitle?: string;
  onAppendToChapter: (text: string) => void;
  onSaveAsResearch?: (title: string, content: string) => void;
}

export const VoiceNoteModal: React.FC<VoiceNoteModalProps> = ({
  isOpen,
  onClose,
  chapterId,
  chapterTitle,
  onAppendToChapter,
  onSaveAsResearch,
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordDuration, setRecordDuration] = useState(0);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [audioBase64, setAudioBase64] = useState<string | null>(null);
  const [mimeType, setMimeType] = useState<string>('audio/webm');
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [transcriptionModel, setTranscriptionModel] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (!isOpen) {
      handleReset();
    }
  }, [isOpen]);

  const handleReset = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
    if (timerRef.current) clearInterval(timerRef.current);
    setIsRecording(false);
    setRecordDuration(0);
    setAudioUrl(null);
    setAudioBase64(null);
    setTranscript('');
    setTranscriptionModel(null);
    setStatusMessage(null);
    setIsPlaying(false);
  };

  const startRecording = async () => {
    try {
      setStatusMessage(null);
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      audioChunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      recorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: recorder.mimeType || 'audio/webm' });
        setMimeType(audioBlob.type);
        const url = URL.createObjectURL(audioBlob);
        setAudioUrl(url);

        // Convert blob to base64
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64Data = (reader.result as string).split(',')[1];
          setAudioBase64(base64Data);
        };
        reader.readAsDataURL(audioBlob);

        // Stop stream tracks
        stream.getTracks().forEach((t) => t.stop());
      };

      recorder.start(200);
      setIsRecording(true);
      setRecordDuration(0);

      timerRef.current = setInterval(() => {
        setRecordDuration((prev) => prev + 1);
      }, 1000);
    } catch (err: any) {
      console.error('Mikrofon-Zugriff fehlgeschlagen:', err);
      setStatusMessage('Mikrofon-Zugriff nicht erlaubt oder nicht verfügbar.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  };

  const formatSeconds = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const remainder = sec % 60;
    return `${mins.toString().padStart(2, '0')}:${remainder.toString().padStart(2, '0')}`;
  };

  const handleTranscribe = async () => {
    if (!audioBase64) return;
    setIsTranscribing(true);
    setStatusMessage('Transkribiere mit qwen-audio-3.0-asr-flash…');

    try {
      const res = await api.transcribeAudio(audioBase64, mimeType);
      setTranscript(res.transcript);
      setTranscriptionModel(res.model);
      setStatusMessage('Erfolgreich transkribiert! Du kannst den Text jetzt anpassen.');
    } catch (err: any) {
      setStatusMessage(err.message || 'Transkription fehlgeschlagen.');
    } finally {
      setIsTranscribing(false);
    }
  };

  const handleAppendToCurrentChapter = () => {
    if (!transcript.trim()) return;
    onAppendToChapter(`\n\n${transcript.trim()}`);
    setStatusMessage('Text wurde an das Kapitel angehängt!');
    setTimeout(() => {
      onClose();
    }, 900);
  };

  const handleSaveToResearch = () => {
    if (!transcript.trim()) return;
    if (onSaveAsResearch) {
      const title = `Sprachnotiz (${new Date().toLocaleDateString('de-DE')} ${new Date().toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })})`;
      onSaveAsResearch(title, transcript.trim());
    }
    setStatusMessage('In die Recherche-Mappe gelegt!');
    setTimeout(() => {
      onClose();
    }, 900);
  };

  const handleCopyToClipboard = async () => {
    if (!transcript) return;
    await navigator.clipboard.writeText(transcript);
    setStatusMessage('In die Zwischenablage kopiert!');
  };

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="voice-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto"
    >
      <div className="w-full max-w-2xl rounded-3xl bg-[var(--bg-surface-elevated)] border-2 border-[var(--border-color)] p-6 sm:p-8 shadow-2xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[var(--border-color)]">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-[var(--accent)] text-[var(--accent-contrast)] flex items-center justify-center font-bold">
              <Mic className="w-7 h-7" />
            </div>
            <div>
              <h2 id="voice-modal-title" className="text-2xl font-black text-[var(--text-primary)]">
                Sprachnotiz aufnehmen
              </h2>
              <p className="text-sm text-[var(--text-muted)]">
                Schnelle Gedanken einsprechen & mit qwen-audio-3.0-asr-flash transkribieren
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-3 rounded-xl text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-canvas)] touch-target"
            aria-label="Dialog schließen"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Recording Section */}
        <div className="p-6 rounded-2xl bg-[var(--bg-canvas)] border-2 border-[var(--border-color)] text-center space-y-5">
          <div className="flex flex-col items-center justify-center gap-3">
            <div className="text-4xl font-mono font-bold text-[var(--text-primary)] tracking-wider">
              {formatSeconds(recordDuration)}
            </div>

            {isRecording ? (
              <div className="flex items-center gap-2 text-[var(--danger)] font-bold text-lg animate-pulse">
                <Radio className="w-6 h-6 animate-spin" />
                <span>Mikrofon nimmt auf… Bitte sprechen</span>
              </div>
            ) : audioUrl ? (
              <div className="text-sm text-[var(--success)] font-bold flex items-center gap-1.5">
                <Check className="w-5 h-5" /> Aufnahme bereit zur Transkription
              </div>
            ) : (
              <div className="text-sm text-[var(--text-muted)]">
                Klicke auf den roten Knopf, um deine Sprachnotiz zu starten.
              </div>
            )}
          </div>

          <div className="flex items-center justify-center gap-4">
            {!isRecording ? (
              <button
                type="button"
                onClick={startRecording}
                className="min-h-[56px] px-8 py-4 rounded-2xl bg-[var(--danger)] text-white font-bold text-lg flex items-center gap-3 shadow-lg hover:opacity-90 active:scale-95 transition-all"
                aria-label="Aufnahme starten"
              >
                <Mic className="w-6 h-6" />
                <span>{audioUrl ? 'Neue Aufnahme starten' : 'Aufnahme starten'}</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={stopRecording}
                className="min-h-[56px] px-8 py-4 rounded-2xl bg-[var(--accent)] text-[var(--accent-contrast)] font-bold text-lg flex items-center gap-3 shadow-xl hover:opacity-90 active:scale-95 transition-all animate-bounce"
                aria-label="Aufnahme stoppen"
              >
                <Square className="w-6 h-6 fill-current" />
                <span>Aufnahme beenden</span>
              </button>
            )}

            {audioUrl && !isRecording && (
              <button
                type="button"
                onClick={() => {
                  if (audioPlayerRef.current) {
                    if (isPlaying) {
                      audioPlayerRef.current.pause();
                      setIsPlaying(false);
                    } else {
                      audioPlayerRef.current.play();
                      setIsPlaying(true);
                    }
                  }
                }}
                className="min-h-[56px] px-5 py-3 rounded-2xl border-2 border-[var(--border-color)] bg-[var(--bg-surface)] hover:border-[var(--accent)] text-[var(--text-primary)] font-bold text-base flex items-center gap-2"
                aria-label={isPlaying ? 'Pause' : 'Anhören'}
              >
                {isPlaying ? <Pause className="w-5 h-5 text-amber-400" /> : <Play className="w-5 h-5 text-emerald-400" />}
                <span>{isPlaying ? 'Pause' : 'Anhören'}</span>
              </button>
            )}
          </div>

          {audioUrl && (
            <audio
              ref={audioPlayerRef}
              src={audioUrl}
              onEnded={() => setIsPlaying(false)}
              className="hidden"
            />
          )}

          {/* Transcribe Button */}
          {audioUrl && !isRecording && (
            <div className="pt-2">
              <button
                type="button"
                onClick={handleTranscribe}
                disabled={isTranscribing}
                className={`min-h-[56px] w-full py-4 px-6 rounded-2xl font-bold text-lg flex items-center justify-center gap-3 shadow-xl transition-all ${
                  isTranscribing
                    ? 'bg-[var(--accent)]/50 text-[var(--text-muted)] cursor-wait'
                    : 'bg-[var(--accent)] text-[var(--accent-contrast)] hover:opacity-95'
                }`}
              >
                <Sparkles className="w-6 h-6" />
                <span>
                  {isTranscribing
                    ? 'Transkribiere Sprache…'
                    : 'Mit Sprachmodell qwen-audio-3.0-asr-flash transkribieren'}
                </span>
              </button>
            </div>
          )}
        </div>

        {/* Transcript Result Area */}
        {transcript && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label htmlFor="transcript-area" className="block text-sm font-bold uppercase tracking-wider text-[var(--text-primary)]">
                Transkribierter Text (du kannst ihn direkt anpassen):
              </label>
              {transcriptionModel && (
                <span className="text-xs text-[var(--text-muted)] font-mono">
                  {transcriptionModel}
                </span>
              )}
            </div>

            <textarea
              id="transcript-area"
              rows={4}
              value={transcript}
              onChange={(e) => setTranscript(e.target.value)}
              className="w-full p-4 rounded-2xl bg-[var(--bg-canvas)] border-2 border-[var(--border-color)] text-[var(--text-primary)] text-lg leading-relaxed focus:border-[var(--accent)]"
            />

            {/* Destination Actions */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              {chapterId && (
                <button
                  type="button"
                  onClick={handleAppendToCurrentChapter}
                  className="min-h-[52px] px-5 py-3 rounded-xl bg-[var(--accent)] text-[var(--accent-contrast)] font-bold text-base flex items-center gap-2 shadow hover:opacity-90"
                >
                  <BookOpen className="w-5 h-5" />
                  <span>An Kapitel »{chapterTitle || 'Aktuell'}« anhängen</span>
                </button>
              )}

              {onSaveAsResearch && (
                <button
                  type="button"
                  onClick={handleSaveToResearch}
                  className="min-h-[52px] px-5 py-3 rounded-xl border-2 border-[var(--border-color)] bg-[var(--bg-surface)] hover:border-[var(--accent)] text-[var(--text-primary)] font-bold text-base flex items-center gap-2"
                >
                  <Search className="w-5 h-5 text-blue-400" />
                  <span>Als Recherche-Notiz speichern</span>
                </button>
              )}

              <button
                type="button"
                onClick={handleCopyToClipboard}
                className="min-h-[52px] px-4 py-3 rounded-xl border border-[var(--border-color)] bg-[var(--bg-canvas)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] font-bold text-sm flex items-center gap-2"
              >
                <Copy className="w-4 h-4" />
                <span>Kopieren</span>
              </button>
            </div>
          </div>
        )}

        {/* Status Message */}
        {statusMessage && (
          <div className="p-3 rounded-xl bg-blue-500/15 border border-blue-400/40 text-blue-300 text-sm flex items-center gap-2">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{statusMessage}</span>
          </div>
        )}

        {/* Close Button */}
        <div className="pt-2 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="min-h-[48px] px-6 py-2.5 rounded-xl border border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] font-bold text-sm"
          >
            Schließen
          </button>
        </div>
      </div>
    </div>
  );
};
