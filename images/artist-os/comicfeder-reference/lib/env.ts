/**
 * Umgebungsvariablen-Validierung
 * Prüft beim Start, ob alle erforderlichen Variablen gesetzt sind.
 * In Produktion ist DATABASE_URL und SESSION_SECRET zwingend.
 * In der Entwicklung ohne DATABASE_URL wird mit Warnung auf PGlite zurückgefallen.
 */

export interface EnvConfig {
  // Pflicht in Produktion; in Entwicklung optional mit PGlite-Fallback
  DATABASE_URL: string;
  SESSION_SECRET: string;

  // Optional (fail-closed)
  OMNIR_URL?: string;
  OMNIR_KEY?: string;
  OMNIR_MODELS?: string;
  ASR_URL?: string;
  ASR_KEY?: string;
  ASR_MODEL?: string;
  IDEAS_DIR?: string;
  ASSETS_DIR?: string;
  MAX_ASSET_BYTES?: string;
  WATERMARK_SECRET?: string;
  SCRAMBLER_WORKER_URL?: string;
  PORT?: string;
  NODE_ENV?: string;
}

export class EnvValidationError extends Error {
  constructor(public missing: string[], public invalid: string[]) {
    super(
      `Umgebungsvariablen-Fehler:\n` +
      (missing.length > 0 ? `  Fehlend: ${missing.join(', ')}\n` : '') +
      (invalid.length > 0 ? `  Ungültig: ${invalid.join(', ')}\n` : '')
    );
    this.name = 'EnvValidationError';
  }
}

/**
 * Validiert die Umgebungsvariablen und wirft bei Fehlern einen EnvValidationError.
 */
export function validateEnv(): EnvConfig {
  const missing: string[] = [];
  const invalid: string[] = [];
  const isProd = process.env.NODE_ENV === 'production';

  // DATABASE_URL: In Produktion Pflicht, in Entwicklung Fallback auf PGlite mit deutlicher Warnung
  let DATABASE_URL = process.env.DATABASE_URL?.trim() || '';
  if (!DATABASE_URL) {
    if (isProd) {
      missing.push('DATABASE_URL');
    } else {
      console.warn(
        '[Federführer] ⚠️ WARNUNG: DATABASE_URL ist nicht gesetzt – verwende PGlite als Entwicklungs-Fallback. In Produktion bleibt PostgreSQL Pflicht!'
      );
    }
  } else if (!DATABASE_URL.startsWith('postgres://') && !DATABASE_URL.startsWith('postgresql://')) {
    invalid.push('DATABASE_URL (muss mit postgres:// oder postgresql:// beginnen)');
  }

  let SESSION_SECRET = process.env.SESSION_SECRET?.trim() || '';
  if (!SESSION_SECRET) {
    if (isProd) {
      missing.push('SESSION_SECRET');
    } else {
      SESSION_SECRET = 'dev-fallback-session-secret-minimum-32-chars-warning';
      process.env.SESSION_SECRET = SESSION_SECRET;
      console.warn(
        '[Federführer] ⚠️ WARNUNG: SESSION_SECRET nicht gesetzt – verwende temporären Entwicklungs-Schlüssel.'
      );
    }
  } else if (SESSION_SECRET.length < 32) {
    invalid.push('SESSION_SECRET (muss mindestens 32 Zeichen lang sein)');
  }

  if (missing.length > 0 || invalid.length > 0) {
    throw new EnvValidationError(missing, invalid);
  }

  const config: EnvConfig = {
    DATABASE_URL,
    SESSION_SECRET,
  };

  if (process.env.OMNIR_URL?.trim()) config.OMNIR_URL = process.env.OMNIR_URL.trim();
  if (process.env.OMNIR_KEY?.trim()) config.OMNIR_KEY = process.env.OMNIR_KEY.trim();
  if (process.env.OMNIR_MODELS?.trim()) config.OMNIR_MODELS = process.env.OMNIR_MODELS.trim();

  if (process.env.ASR_URL?.trim()) config.ASR_URL = process.env.ASR_URL.trim();
  if (process.env.ASR_KEY?.trim()) config.ASR_KEY = process.env.ASR_KEY.trim();
  if (process.env.ASR_MODEL?.trim()) config.ASR_MODEL = process.env.ASR_MODEL.trim();

  if (process.env.IDEAS_DIR?.trim()) config.IDEAS_DIR = process.env.IDEAS_DIR.trim();
  if (process.env.ASSETS_DIR?.trim()) config.ASSETS_DIR = process.env.ASSETS_DIR.trim();
  if (process.env.MAX_ASSET_BYTES?.trim()) config.MAX_ASSET_BYTES = process.env.MAX_ASSET_BYTES.trim();
  if (process.env.WATERMARK_SECRET?.trim()) config.WATERMARK_SECRET = process.env.WATERMARK_SECRET.trim();
  if (process.env.SCRAMBLER_WORKER_URL?.trim()) config.SCRAMBLER_WORKER_URL = process.env.SCRAMBLER_WORKER_URL.trim();
  if (process.env.PORT?.trim()) config.PORT = process.env.PORT.trim();
  if (process.env.NODE_ENV?.trim()) config.NODE_ENV = process.env.NODE_ENV.trim();

  return config;
}

/**
 * Gibt zurück, ob OmniRoute konfiguriert ist.
 */
export function isOmniRouteConfigured(): boolean {
  return !!(process.env.OMNIR_URL?.trim() && process.env.OMNIR_KEY?.trim() && process.env.OMNIR_MODELS?.trim());
}

/**
 * Gibt zurück, ob ASR konfiguriert ist.
 */
export function isASRConfigured(): boolean {
  return !!(process.env.ASR_URL?.trim() && process.env.ASR_KEY?.trim());
}
