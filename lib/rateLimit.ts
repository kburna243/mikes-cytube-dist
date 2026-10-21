interface RateLimitRecord {
  timestamps: number[];
}

const rateLimitMap = new Map<string, RateLimitRecord>();

const WINDOW_MS = 60 * 1000; // 1 Minute
const MAX_REQUESTS = 30; // Max 30 Aufrufe pro Minute

/**
 * Überprüft das Rate-Limit für eine Sitzung/IP.
 * Gibt true zurück, wenn die Anfrage erlaubt ist, sonst false.
 */
export function checkRateLimit(identifier: string): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const record = rateLimitMap.get(identifier) || { timestamps: [] };

  // Alte Zeitstempel außerhalb des 1-Minuten-Fensters entfernen
  const validTimestamps = record.timestamps.filter((t) => now - t < WINDOW_MS);

  if (validTimestamps.length >= MAX_REQUESTS) {
    return { allowed: false, remaining: 0 };
  }

  validTimestamps.push(now);
  rateLimitMap.set(identifier, { timestamps: validTimestamps });

  return { allowed: true, remaining: MAX_REQUESTS - validTimestamps.length };
}
