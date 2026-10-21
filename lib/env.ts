/**
 * Umgebungsvariablen-Validierung
 * Prüft beim Start, ob alle erforderlichen Variablen gesetzt sind.
 * Fehlt eine Pflichtvariable, wird der Start mit einer klaren Meldung abgebrochen.
 */

export interface EnvConfig {
  // Pflicht
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

  // Pflichtvariablen
  const DATABASE_URL = process.env.DATABASE_URL?.trim();
  if (!DATABASE_URL) {
    missing.push('DATABASE_URL');
  } else if (!DATABASE_URL.startsWith('postgres://') && !DATABASE_URL.startsWith('postgresql://')) {
    invalid.push('DATABASE_URL (muss mit postgres:// oder postgresql:// beginnen)');
  }

  const SESSION_SECRET = process.env.SESSION_SECRET?.trim();
  if (!SESSION_SECRET) {
    missing.push('SESSION_SECRET');
  } else if (SESSION_SECRET.length < 32) {
    invalid.push('SESSION_SECRET (muss mindestens 32 Zeichen lang sein)');
  }

  // Fehler werfen wenn Pflichtvariablen fehlen
  if (missing.length > 0 || invalid.length > 0) {
    throw new EnvValidationError(missing, invalid);
  }

  // Optionale Variablen (fail-closed)
  const config: EnvConfig = {
    DATABASE_URL: DATABASE_URL!,
    SESSION_SECRET: SESSION_SECRET!,
  };

  // OmniRoute (optional)
  const OMNIR_URL = process.env.OMNIR_URL?.trim();
  const OMNIR_KEY = process.env.OMNIR_KEY?.trim();
  const OMNIR_MODELS = process.env.OMNIR_MODELS?.trim();

  if (OMNIR_URL) config.OMNIR_URL = OMNIR_URL;
  if (OMNIR_KEY) config.OMNIR_KEY = OMNIR_KEY;
  if (OMNIR_MODELS) config.OMNIR_MODELS = OMNIR_MODELS;

  // ASR (optional)
  const ASR_URL = process.env.ASR_URL?.trim();
  const ASR_KEY = process.env.ASR_KEY?.trim();
  const ASR_MODEL = process.env.ASR_MODEL?.trim();

  if (ASR_URL) config.ASR_URL = ASR_URL;
  if (ASR_KEY) config.ASR_KEY = ASR_KEY;
  if (ASR_MODEL) config.ASR_MODEL = ASR_MODEL;

  // Andere optionale
  const IDEAS_DIR = process.env.IDEAS_DIR?.trim();
  const PORT = process.env.PORT?.trim();
  const NODE_ENV = process.env.NODE_ENV?.trim();

  if (IDEAS_DIR) config.IDEAS_DIR = IDEAS_DIR;
  if (PORT) config.PORT = PORT;
  if (NODE_ENV) config.NODE_ENV = NODE_ENV;

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
