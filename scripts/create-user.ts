#!/usr/bin/env node
/**
 * Legt einen neuen Nutzer für Federführer an.
 * Nutzung: npx tsx scripts/create-user.ts
 * Fragt interaktiv nach Benutzername und Passwort.
 */

import readline from 'readline';
import dotenv from 'dotenv';
import { hashPassword } from '../lib/auth.js';
import { getDb, schema } from '../lib/db.js';

dotenv.config();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function ask(question: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer.trim());
    });
  });
}

async function main() {
  console.log('\n=== Federführer: Nutzer anlegen ===\n');

  const username = await ask('Benutzername: ');
  if (!username) {
    console.error('Fehler: Benutzername darf nicht leer sein.');
    process.exit(1);
  }

  const displayName = await ask('Anzeigename (z.B. Marion): ') || username;

  const password = await ask('Passwort (mindestens 8 Zeichen): ');
  if (!password || password.length < 8) {
    console.error('Fehler: Passwort muss mindestens 8 Zeichen lang sein.');
    process.exit(1);
  }

  const passwordConfirm = await ask('Passwort bestätigen: ');
  if (password !== passwordConfirm) {
    console.error('Fehler: Passwörter stimmen nicht überein.');
    process.exit(1);
  }

  rl.close();

  // Datenbank verbinden
  const db = getDb();
  if (!db) {
    console.error('Fehler: Datenbank nicht verfügbar. Bitte DATABASE_URL in .env setzen.');
    process.exit(1);
  }

  try {
    // Prüfen ob Nutzer schon existiert
    const existing = await db.select().from(schema.users).where(
      // @ts-ignore - eq funktioniert mit text columns
      (await import('drizzle-orm')).eq(schema.users.username, username)
    ).limit(1);

    if (existing.length > 0) {
      console.error(`Fehler: Nutzer "${username}" existiert bereits.`);
      process.exit(1);
    }

    // Passwort hashen
    const passwordHash = await hashPassword(password);

    // Nutzer anlegen
    const [newUser] = await db.insert(schema.users).values({
      username,
      displayName,
      passwordHash,
    }).returning();

    console.log(`\n✓ Nutzer "${newUser.username}" erfolgreich angelegt (ID: ${newUser.id})`);
    console.log('Du kannst dich jetzt unter /api/auth/login anmelden.\n');
  } catch (err: any) {
    console.error('Fehler beim Anlegen des Nutzers:', err.message);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('Unerwarteter Fehler:', err);
  process.exit(1);
});
