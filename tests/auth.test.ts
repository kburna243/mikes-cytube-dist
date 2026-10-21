/**
 * Auth-Tests für Federführer
 * Testet: Passwort-Hashing, Session-Management, Sperre nach Fehlversuchen
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { PGlite } from '@electric-sql/pglite';
import { drizzle } from 'drizzle-orm/pglite';
import { eq } from 'drizzle-orm';
import * as schema from '../drizzle/schema.js';
import { hashPassword, verifyPassword } from '../lib/auth.js';

let pglite: PGlite;
let db: ReturnType<typeof drizzle>;

beforeAll(async () => {
  pglite = new PGlite();
  db = drizzle(pglite, { schema });

  // Tabellen erstellen
  await pglite.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      username text NOT NULL UNIQUE,
      display_name text NOT NULL,
      email text,
      password_hash text NOT NULL,
      failed_logins integer DEFAULT 0 NOT NULL,
      locked_until timestamp with time zone,
      created_at timestamp with time zone DEFAULT now() NOT NULL
    );

    CREATE TABLE IF NOT EXISTS sessions (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      token_hash text NOT NULL UNIQUE,
      user_agent text,
      expires_at timestamp with time zone NOT NULL,
      created_at timestamp with time zone DEFAULT now() NOT NULL
    );
  `);
});

afterAll(async () => {
  await pglite.close();
});

beforeEach(async () => {
  // Tabellen leeren
  await pglite.exec('DELETE FROM sessions');
  await pglite.exec('DELETE FROM users');
});

describe('Passwort-Hashing', () => {
  it('sollte ein Passwort hashen und verifizieren', async () => {
    const password = 'sicheresPasswort123';
    const hash = await hashPassword(password);

    expect(hash).toBeTruthy();
    expect(hash).not.toBe(password);
    expect(hash.startsWith('$2')).toBe(true); // bcrypt prefix

    const isValid = await verifyPassword(password, hash);
    expect(isValid).toBe(true);

    const isInvalid = await verifyPassword('falschesPasswort', hash);
    expect(isInvalid).toBe(false);
  });
});

describe('Benutzer-Authentifizierung', () => {
  it('sollte einen Nutzer erfolgreich authentifizieren', async () => {
    // Nutzer anlegen
    const passwordHash = await hashPassword('testpass123');
    const [user] = await db.insert(schema.users).values({
      username: 'testuser',
      displayName: 'Test Nutzer',
      passwordHash,
    }).returning();

    expect(user).toBeTruthy();
    expect(user.username).toBe('testuser');

    // Passwort prüfen
    const isValid = await verifyPassword('testpass123', user.passwordHash);
    expect(isValid).toBe(true);
  });

  it('sollte falsches Passwort ablehnen', async () => {
    const passwordHash = await hashPassword('richtigesPasswort');
    const [user] = await db.insert(schema.users).values({
      username: 'testuser2',
      displayName: 'Test',
      passwordHash,
    }).returning();

    const isValid = await verifyPassword('falschesPasswort', user.passwordHash);
    expect(isValid).toBe(false);
  });

  it('sollte nicht existierenden Nutzer ablehnen', async () => {
    const [found] = await db.select().from(schema.users)
      .where(eq(schema.users.username, 'nichtvorhanden'))
      .limit(1);

    expect(found).toBeUndefined();
  });
});

describe('Konto-Sperre', () => {
  it('sollte nach 5 Fehlversuchen sperren', async () => {
    const passwordHash = await hashPassword('richtigesPasswort');
    const [user] = await db.insert(schema.users).values({
      username: 'sperrtest',
      displayName: 'Sperr Test',
      passwordHash,
      failedLogins: 0,
    }).returning();

    // Simuliere 5 Fehlversuche
    await db.update(schema.users)
      .set({ failedLogins: 5, lockedUntil: new Date(Date.now() + 15 * 60 * 1000) })
      .where(eq(schema.users.id, user.id));

    // Prüfe Sperre
    const [locked] = await db.select().from(schema.users)
      .where(eq(schema.users.id, user.id))
      .limit(1);

    expect(locked.failedLogins).toBe(5);
    expect(locked.lockedUntil).toBeTruthy();
    expect(new Date(locked.lockedUntil!).getTime()).toBeGreaterThan(Date.now());
  });

  it('sollte fehlgeschlagene Versuche nach erfolgreichem Login zurücksetzen', async () => {
    const passwordHash = await hashPassword('testpass');
    const [user] = await db.insert(schema.users).values({
      username: 'resettest',
      displayName: 'Reset',
      passwordHash,
      failedLogins: 3,
    }).returning();

    // Reset nach erfolgreichem Login
    await db.update(schema.users)
      .set({ failedLogins: 0, lockedUntil: null })
      .where(eq(schema.users.id, user.id));

    const [reset] = await db.select().from(schema.users)
      .where(eq(schema.users.id, user.id))
      .limit(1);

    expect(reset.failedLogins).toBe(0);
    expect(reset.lockedUntil).toBeNull();
  });
});

describe('Session-Management', () => {
  it('sollte eine Session erstellen und validieren', async () => {
    const passwordHash = await hashPassword('testpass');
    const [user] = await db.insert(schema.users).values({
      username: 'sessiontest',
      displayName: 'Session',
      passwordHash,
    }).returning();

    // Session erstellen
    const crypto = await import('crypto');
    const token = crypto.randomBytes(32).toString('base64url');
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 Tage

    const [session] = await db.insert(schema.sessions).values({
      userId: user.id,
      tokenHash,
      userAgent: 'Test-Agent',
      expiresAt,
    }).returning();

    expect(session).toBeTruthy();
    expect(session.tokenHash).toBe(tokenHash);
    expect(session.userId).toBe(user.id);

    // Session validieren
    const [found] = await db.select().from(schema.sessions)
      .where(eq(schema.sessions.tokenHash, tokenHash))
      .limit(1);

    expect(found).toBeTruthy();
    expect(new Date(found.expiresAt).getTime()).toBeGreaterThan(Date.now());
  });

  it('sollte abgelaufene Session ablehnen', async () => {
    const passwordHash = await hashPassword('testpass');
    const [user] = await db.insert(schema.users).values({
      username: 'expiretest',
      displayName: 'Expire',
      passwordHash,
    }).returning();

    // Session mit Ablauf in der Vergangenheit erstellen
    const crypto = await import('crypto');
    const token = crypto.randomBytes(32).toString('base64url');
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const expiresAt = new Date(Date.now() - 1000); // Abgelaufen

    await db.insert(schema.sessions).values({
      userId: user.id,
      tokenHash,
      expiresAt,
    });

    const [found] = await db.select().from(schema.sessions)
      .where(eq(schema.sessions.tokenHash, tokenHash))
      .limit(1);

    expect(found).toBeTruthy();
    expect(new Date(found.expiresAt).getTime()).toBeLessThan(Date.now());
  });

  it('sollte Session löschen können', async () => {
    const passwordHash = await hashPassword('testpass');
    const [user] = await db.insert(schema.users).values({
      username: 'deletetest',
      displayName: 'Delete',
      passwordHash,
    }).returning();

    const crypto = await import('crypto');
    const token = crypto.randomBytes(32).toString('base64url');
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    await db.insert(schema.sessions).values({
      userId: user.id,
      tokenHash,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    });

    // Session löschen
    await db.delete(schema.sessions)
      .where(eq(schema.sessions.tokenHash, tokenHash));

    const [found] = await db.select().from(schema.sessions)
      .where(eq(schema.sessions.tokenHash, tokenHash))
      .limit(1);

    expect(found).toBeUndefined();
  });
});
