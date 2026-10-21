/**
 * High-accessibility Speech Synthesis (Vorlesen) and Speech Recognition (Diktat)
 * Spec §8.2: Piper / Web Speech TTS with German voice priority, adjustable speed, pause/resume.
 */

export interface SpeechState {
  isPlaying: boolean;
  isPaused: boolean;
  currentText: string;
  rate: number;
}

class SpeechService {
  private synth: SpeechSynthesis | null = null;
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private germanVoice: SpeechSynthesisVoice | null = null;
  private listeners: Array<(state: SpeechState) => void> = [];
  private rate: number = 1.0;

  constructor() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.synth = window.speechSynthesis;
      this.loadVoices();
      if (this.synth.onvoiceschanged !== undefined) {
        this.synth.onvoiceschanged = () => this.loadVoices();
      }
    }
  }

  private loadVoices() {
    if (!this.synth) return;
    const voices = this.synth.getVoices();
    // Prioritize natural German voices
    this.germanVoice =
      voices.find((v) => v.lang.startsWith('de') && (v.name.includes('Natural') || v.name.includes('Google') || v.name.includes('Neural'))) ||
      voices.find((v) => v.lang.startsWith('de')) ||
      voices[0] ||
      null;
  }

  public setRate(newRate: number) {
    this.rate = Math.max(0.6, Math.min(1.6, newRate));
    if (this.currentUtterance && this.synth?.speaking) {
      // Re-trigger from current text
      const text = this.currentUtterance.text;
      this.stop();
      this.speak(text);
    }
  }

  public getRate(): number {
    return this.rate;
  }

  public subscribe(listener: (state: SpeechState) => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private notify(isPlaying: boolean, isPaused: boolean, currentText: string = '') {
    const state: SpeechState = {
      isPlaying,
      isPaused,
      currentText,
      rate: this.rate,
    };
    this.listeners.forEach((l) => l(state));
  }

  public speak(text: string, onEnd?: () => void) {
    if (!this.synth) {
      console.warn('Speech synthesis not available');
      return;
    }

    this.stop();

    // Clean markdown symbols for natural German listening
    const cleanText = text
      .replace(/[#*`_~]/g, '')
      .replace(/\[(.*?)\]\(.*?\)/g, '$1')
      .replace(/>+/g, '')
      .trim();

    if (!cleanText) return;

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = 'de-DE';
    utterance.rate = this.rate;
    utterance.pitch = 1.0;

    if (this.germanVoice) {
      utterance.voice = this.germanVoice;
    }

    utterance.onstart = () => {
      this.notify(true, false, cleanText);
    };

    utterance.onpause = () => {
      this.notify(true, true, cleanText);
    };

    utterance.onresume = () => {
      this.notify(true, false, cleanText);
    };

    utterance.onend = () => {
      this.currentUtterance = null;
      this.notify(false, false, '');
      if (onEnd) onEnd();
    };

    utterance.onerror = (e) => {
      console.error('Speech synthesis error:', e);
      this.currentUtterance = null;
      this.notify(false, false, '');
    };

    this.currentUtterance = utterance;
    this.synth.speak(utterance);
  }

  public pause() {
    if (this.synth && this.synth.speaking && !this.synth.paused) {
      this.synth.pause();
      this.notify(true, true, this.currentUtterance?.text || '');
    }
  }

  public resume() {
    if (this.synth && this.synth.paused) {
      this.synth.resume();
      this.notify(true, false, this.currentUtterance?.text || '');
    }
  }

  public stop() {
    if (this.synth) {
      this.synth.cancel();
      this.currentUtterance = null;
      this.notify(false, false, '');
    }
  }

  public isSpeaking(): boolean {
    return Boolean(this.synth?.speaking);
  }
}

export const speechService = new SpeechService();

// Dictation (Speech-to-Text) wrapper with security and German language support
export function createDictationRecognition(
  onTranscript: (text: string, isFinal: boolean) => void,
  onError: (error: string) => void,
  onEnd: () => void
): { start: () => void; stop: () => void; isSupported: boolean } {
  const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

  if (!SpeechRecognition) {
    return {
      start: () => onError('Spracherkennung wird von diesem Browser nicht unterstützt.'),
      stop: () => {},
      isSupported: false,
    };
  }

  const recognition = new SpeechRecognition();
  recognition.lang = 'de-DE';
  recognition.continuous = true;
  recognition.interimResults = true;

  recognition.onresult = (event: any) => {
    let interim = '';
    let final = '';

    for (let i = event.resultIndex; i < event.results.length; ++i) {
      if (event.results[i].isFinal) {
        final += event.results[i][0].transcript;
      } else {
        interim += event.results[i][0].transcript;
      }
    }

    if (final) {
      onTranscript(final, true);
    } else if (interim) {
      onTranscript(interim, false);
    }
  };

  recognition.onerror = (event: any) => {
    onError(event.error || 'Diktierfehler');
  };

  recognition.onend = () => {
    onEnd();
  };

  return {
    start: () => {
      try {
        recognition.start();
      } catch (e: any) {
        console.warn('Recognition start warning:', e);
      }
    },
    stop: () => {
      try {
        recognition.stop();
      } catch (e) {
        // ignore
      }
    },
    isSupported: true,
  };
}
