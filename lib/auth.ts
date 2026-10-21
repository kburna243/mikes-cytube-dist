import crypto from 'crypto';
import type { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import { getDb, schema } from './db.js';
import { eq, and } from 'drizzle-orm';

export interface AuthUser {
  id: string;
  username: string;
  displayName: string;
}

const COOKIE_NAME = 'federfuehrer_session';
const BCRYPT_ROUNDS = 12;
const MAX_FAILED_LOGINS = 5;
const LOCK_DURATION_MINUTES = 15;
const SESSION_DURATION_DAYS = 30;

function getSessionSecret(): string {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    throw new Error('SESSION_SECRET ist nicht gesetzt. Bitte in der .env-Datei konfigurieren.');
  }
  return secret;
}

/**
 * Hasht ein Passwort mit bcrypt
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_ROUNDS);
}

/**
 * Vergleicht ein Passwort mit einem Hash
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Erstellt ein zufälliges Session-Token
 */
function createRandomToken(): string {
  return crypto.randomBytes(32).toString('base64url');
}

/**
 * Hasht ein Token mit SHA-256 für die DB-Speicherung
 */
function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

/**
 * Erstellt eine neue Session in der Datenbank
 */
export async function createSession(userId: string, userAgent?: string): Promise<string> {
  const db = getDb();
  if (!db) {
    throw new Error('Datenbank nicht verfügbar');
  }

  const token = createRandomToken();
  const tokenHash = hashToken(token);
  const expiresAt = new Date(Date.now() + SESSION_DURATION_DAYS * 24 * 60 * 60 * 1000);

  await db.insert(schema.sessions).values({
    userId,
    tokenHash,
    userAgent: userAgent || null,
    expiresAt,
  });

  return token;
}

/**
 * Validiert ein Session-Token und gibt die User-ID zurück
 */
export async function validateSession(token: string): Promise<{ userId: string } | null> {
  const db = getDb();
  if (!db) {
    return null;
  }

  const tokenHash = hashToken(token);

  try {
    const [session] = await db
      .select()
      .from(schema.sessions)
      .where(and(
        eq(schema.sessions.tokenHash, tokenHash),
      ))
      .limit(1);

    if (!session) {
      return null;
    }

    // Session abgelaufen?
    if (new Date(session.expiresAt) < new Date()) {
      // Abgelaufene Session löschen
      await db.delete(schema.sessions).where(eq(schema.sessions.tokenHash, tokenHash));
      return null;
    }

    return { userId: session.userId };
  } catch {
    return null;
  }
}

/**
 * Löscht eine Session aus der Datenbank
 */
export async function deleteSession(token: string): Promise<void> {
  const db = getDb();
  if (!db) return;

  const tokenHash = hashToken(token);
  try {
    await db.delete(schema.sessions).where(eq(schema.sessions.tokenHash, tokenHash));
  } catch {
    // Ignorieren
  }
}

/**
 * Liest die aktuelle Benutzersitzung aus Request-Cookies oder Authorization-Header
 * Gibt null zurück wenn keine gültige Sitzung existiert
 */
export async function getSession(req: Request): Promise<AuthUser | null> {
  // 1. Token aus Cookie oder Authorization-Header lesen
  let token = req.cookies?.[COOKIE_NAME];

  if (!token && req.headers.authorization?.startsWith('Bearer ')) {
    token = req.headers.authorization.slice(7).trim();
  }

  if (!token) {
    return null;
  }

  // 2. Session in der Datenbank validieren
  const session = await validateSession(token);
  if (!session) {
    return null;
  }

  // 3. Benutzer aus der Datenbank laden
  const db = getDb();
  if (!db) {
    return null;
  }

  try {
    const [user] = await db
      .select()
      .from(schema.users)
      .where(eq(schema.users.id, session.userId))
      .limit(1);

    if (!user) {
      return null;
    }

    return {
      id: user.id,
      username: user.username,
      displayName: user.displayName,
    };
  } catch {
    return null;
  }
}

/**
 * Express Middleware zum Absichern von /api-Routen (401 bei fehlender Sitzung)
 */
export function requireUser(req: Request, res: Response, next: NextFunction): void {
  // getSession ist async, also müssen wir es als Middleware wrapper nutzen
  getSession(req).then(user => {
    if (!user) {
      res.status(401).json({
        type: 'https://tools.ietf.org/html/rfc9457',
        title: 'Nicht autorisiert',
        status: 401,
        detail: 'Für diese Aktion ist eine gültige Sitzung erforderlich.',
      });
      return;
    }

    // Benutzer an Request anhängen
    (req as any).user = user;
    next();
  }).catch(() => {
    res.status(500).json({
      type: 'https://tools.ietf.org/html/rfc9457',
      title: 'Serverfehler',
      status: 500,
      detail: 'Sitzung konnte nicht geprüft werden.',
    });
  });
}

/**
 * Setzt den sicheren HttpOnly-Sitzungs-Cookie
 */
export function setSessionCookie(res: Response, token: string): void {
  const isProd = process.env.NODE_ENV === 'production';

  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    secure: isProd,
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_DURATION_DAYS * 24 * 60 * 60 * 1000,
  });
}

/**
 * Entfernt den Sitzungs-Cookie beim Logout
 */
export function clearSessionCookie(res: Response): void {
  res.clearCookie(COOKIE_NAME, {
    path: '/',
    sameSite: 'lax',
  });
}

/**
 * Prüft ob ein Nutzer gesperrt ist
 */
export async function isUserLocked(username: string): Promise<{ locked: boolean; remainingMinutes: number }> {
  const db = getDb();
  if (!db) return { locked: false, remainingMinutes: 0 };

  try {
    const [user] = await db
      .select()
      .from(schema.users)
      .where(eq(schema.users.username, username))
      .limit(1);

    if (!user || !user.lockedUntil) {
      return { locked: false, remainingMinutes: 0 };
    }

    const lockedUntil = new Date(user.lockedUntil);
    const now = new Date();

    if (lockedUntil > now) {
      const remainingMs = lockedUntil.getTime() - now.getTime();
      const remainingMinutes = Math.ceil(remainingMs / 60000);
      return { locked: true, remainingMinutes };
    }

    // Sperre abgelaufen
    await db.update(schema.users)
      .set({ lockedUntil: null, failedLogins: 0 })
      .where(eq(schema.users.id, user.id));

    return { locked: false, remainingMinutes: 0 };
  } catch {
    return { locked: false, remainingMinutes: 0 };
  }
}

/**
 * Registriert einen fehlgeschlagenen Login-Versuch
 */
export async function recordFailedLogin(username: string): Promise<void> {
  const db = getDb();
  if (!db) return;

  try {
    const [user] = await db
      .select()
      .from(schema.users)
      .where(eq(schema.users.username, username))
      .limit(1);

    if (!user) return;

    const newFailedCount = user.failedLogins + 1;
    const updateData: any = { failedLogins: newFailedCount };

    // Nach 5 Fehlversuchen sperren
    if (newFailedCount >= MAX_FAILED_LOGINS) {
      updateData.lockedUntil = new Date(Date.now() + LOCK_DURATION_MINUTES * 60 * 1000);
    }

    await db.update(schema.users)
      .set(updateData)
      .where(eq(schema.users.id, user.id));
  } catch {
    // Ignorieren
  }
}

/**
 * Setzt die fehlgeschlagenen Login-Versuche zurück
 */
export async function resetFailedLogins(userId: string): Promise<void> {
  const db = getDb();
  if (!db) return;

  try {
    await db.update(schema.users)
      .set({ failedLogins: 0, lockedUntil: null })
      .where(eq(schema.users.id, userId));
  } catch {
    // Ignorieren
  }
}

/**
 * Authentifiziert einen Nutzer mit Username und Passwort
 */
export async function authenticateUser(username: string, password: string): Promise<{ success: boolean; userId?: string; error?: string }> {
  const db = getDb();
  if (!db) {
    return { success: false, error: 'Datenbank nicht verfügbar' };
  }

  // 1. Prüfen ob Nutzer gesperrt ist
  const lockStatus = await isUserLocked(username);
  if (lockStatus.locked) {
    return { success: false, error: `Konto gesperrt. Versuche es in ${lockStatus.remainingMinutes} Minuten erneut.` };
  }

  // 2. Nutzer finden
  try {
    const [user] = await db
      .select()
      .from(schema.users)
      .where(eq(schema.users.username, username))
      .limit(1);

    if (!user) {
      // Generische Meldung aus Sicherheitsgründen
      return { success: false, error: 'Ungültiger Benutzername oder Passwort' };
    }

    // 3. Passwort prüfen
    const passwordValid = await verifyPassword(password, user.passwordHash);

    if (!passwordValid) {
      await recordFailedLogin(username);
      return { success: false, error: 'Ungültiger Benutzername oder Passwort' };
    }

    // 4. Erfolgreich - fehlgeschlagene Versuche zurücksetzen
    await resetFailedLogins(user.id);

    return { success: true, userId: user.id };
  } catch (err) {
    console.error('[Auth] Authentifizierungsfehler:', err);
    return { success: false, error: 'Anmeldung fehlgeschlagen' };
  }
}

/**
 * Findet einen Nutzer nach Username
 */
export async function findUserByUsername(username: string): Promise<{ id: string; username: string; displayName: string } | null> {
  const db = getDb();
  if (!db) return null;

  try {
    const [user] = await db
      .select()
      .from(schema.users)
      .where(eq(schema.users.username, username))
      .limit(1);

    if (!user) return null;

    return {
      id: user.id,
      username: user.username,
      displayName: user.displayName,
    };
  } catch {
    return null;
  }
}
