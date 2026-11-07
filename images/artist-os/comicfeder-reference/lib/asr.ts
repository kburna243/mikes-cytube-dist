import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';

export interface TranscribeResult {
  text: string;
  dauerSek: number;
}

export interface ASRProvider {
  transcribe(audioPath: string): Promise<TranscribeResult>;
}

export class ASRConfigError extends Error {
  constructor(message: string = 'ASR-Dienst ist nicht konfiguriert (fail-closed).') {
    super(message);
    this.name = 'ASRConfigError';
  }
}

export interface ASRConfig {
  url: string;
  key: string;
  model: string;
}

/**
 * Liest die ASR-Konfiguration aus (fail-closed).
 */
export function getASRConfig(): ASRConfig | null {
  const url = process.env.ASR_URL?.trim();
  const key = process.env.ASR_KEY?.trim();
  const model = process.env.ASR_MODEL?.trim() || 'qwen-audio-3.0-asr-flash';

  if (!url || !key) {
    return null;
  }

  return {
    url: url.replace(/\/+$/, ''),
    key,
    model,
  };
}

/**
 * Wandelt die Audiodatei mit ffmpeg nach 16 kHz Mono (WAV) um.
 * Gibt den Pfad der umgewandelten temporären Datei zurück.
 */
export async function convertTo16kHzMono(inputPath: string): Promise<{ convertedPath: string; cleanup: () => void; durationSec: number }> {
  if (!fs.existsSync(inputPath)) {
    throw new Error(`Audiodatei existiert nicht: ${inputPath}`);
  }

  const outputPath = `${inputPath}_16k.wav`;

  return new Promise((resolve, reject) => {
    // ffmpeg -y -i <input> -ar 16000 -ac 1 <output>
    const proc = spawn('ffmpeg', ['-y', '-i', inputPath, '-ar', '16000', '-ac', '1', outputPath]);

    let stderr = '';
    proc.stderr.on('data', (d) => {
      stderr += d.toString();
    });

    proc.on('close', (code) => {
      if (code === 0 && fs.existsSync(outputPath)) {
        // Versuch Dauer aus stderr zu parsen (z.B. Duration: 00:00:15.32)
        let durationSec = 0;
        const durMatch = stderr.match(/Duration:\s*(\d+):(\d+):(\d+\.?\d*)/);
        if (durMatch) {
          const hours = parseFloat(durMatch[1]);
          const mins = parseFloat(durMatch[2]);
          const secs = parseFloat(durMatch[3]);
          durationSec = Math.round(hours * 3600 + mins * 60 + secs);
        }

        resolve({
          convertedPath: outputPath,
          durationSec,
          cleanup: () => {
            try {
              if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
            } catch {
              // ignore
            }
          },
        });
      } else {
        // Falls ffmpeg fehlschlägt, Originaldatei verwenden
        console.warn('[ASR] ffmpeg-Konvertierung nicht möglich, nutze Originaldatei:', stderr.slice(-150));
        resolve({
          convertedPath: inputPath,
          durationSec: 0,
          cleanup: () => {},
        });
      }
    });

    proc.on('error', (err) => {
      console.warn('[ASR] ffmpeg-Prozessfehler, nutze Originaldatei:', err.message);
      resolve({
        convertedPath: inputPath,
        durationSec: 0,
        cleanup: () => {},
      });
    });
  });
}

/**
 * Standard-Provider: OpenAI-kompatibler Endpunkt /audio/transcriptions
 */
export class OpenAIAudioProvider implements ASRProvider {
  constructor(private config: ASRConfig) {}

  async transcribe(audioPath: string): Promise<TranscribeResult> {
    const startTime = Date.now();
    const { convertedPath, cleanup, durationSec } = await convertTo16kHzMono(audioPath);

    try {
      const fileBuffer = fs.readFileSync(convertedPath);
      const filename = path.basename(convertedPath);

      // Erstelle multipart FormData
      const formData = new FormData();
      const blob = new Blob([fileBuffer], { type: 'audio/wav' });
      formData.append('file', blob, filename);
      formData.append('model', this.config.model);
      formData.append('language', 'de');
      formData.append('response_format', 'json');

      const endpoint = `${this.config.url}/audio/transcriptions`;

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60000);

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.config.key}`,
        },
        body: formData,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      const elapsedMs = Date.now() - startTime;

      if (!res.ok) {
        const errText = await res.text().catch(() => '');
        // Sanitized Log: niemals Audio oder Transkripte loggen
        console.warn(`[ASR] HTTP-Fehler ${res.status} von ASR-Endpunkt (${elapsedMs}ms): ${errText.slice(0, 100)}`);
        throw new Error(`ASR-Endpunkt meldet Status ${res.status}`);
      }

      const data = await res.json();
      const text = (data.text || data.transcript || '').trim();

      // Sanitized Logging: Nur Modell und Verarbeitungsdauer
      console.log(`[ASR] Verschriftung erfolgreich · Modell: ${this.config.model} · Verarbeitungszeit: ${elapsedMs}ms`);

      return {
        text,
        dauerSek: durationSec || Math.round(fileBuffer.length / (16000 * 2)) || 1,
      };
    } finally {
      cleanup();
    }
  }
}

/**
 * Fabrik-Funktion für den konfigurierten ASR-Provider
 */
export function getASRProvider(): ASRProvider {
  const config = getASRConfig();
  if (!config) {
    throw new ASRConfigError();
  }
  return new OpenAIAudioProvider(config);
}

/**
 * Führt die Transkription für eine Audiodatei aus.
 * fail-closed: Ist ASR nicht konfiguriert, wird geworfen.
 */
export async function transcribeAudio(audioPath: string): Promise<TranscribeResult> {
  const provider = getASRProvider();
  return provider.transcribe(audioPath);
}
