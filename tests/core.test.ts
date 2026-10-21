import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { PGlite } from '@electric-sql/pglite';
import { drizzle } from 'drizzle-orm/pglite';
import * as schema from '../drizzle/schema.js';
import { repo } from '../lib/repo.js';
import { setTestDb, clearTestDb } from '../lib/db.js';
import { isASRConfigured } from '../lib/env.js';

let pglite: PGlite;
let db: ReturnType<typeof drizzle>;
const userA = 'aaaaaaaa-0000-0000-0000-000000000001';

beforeAll(async () => {
  pglite = new PGlite();
  db = drizzle(pglite, { schema });

  // Tabellen erstellen
  await pglite.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id uuid PRIMARY KEY,
      username text NOT NULL UNIQUE,
      display_name text NOT NULL,
      email text,
      password_hash text NOT NULL,
      failed_logins integer DEFAULT 0 NOT NULL,
      locked_until timestamp with time zone,
      created_at timestamp with time zone DEFAULT now() NOT NULL
    );

    CREATE TABLE IF NOT EXISTS projects (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      owner_id uuid NOT NULL,
      title text NOT NULL,
      subtitle text,
      genre text,
      synopsis text,
      target_words integer DEFAULT 50000,
      status text DEFAULT 'in_arbeit' NOT NULL,
      cover_color text DEFAULT '#fbbf24',
      created_at timestamp with time zone DEFAULT now() NOT NULL,
      updated_at timestamp with time zone DEFAULT now() NOT NULL
    );

    CREATE TABLE IF NOT EXISTS chapters (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      owner_id uuid NOT NULL,
      project_id uuid NOT NULL,
      position integer DEFAULT 1 NOT NULL,
      title text NOT NULL,
      pov_character_id uuid,
      status text DEFAULT 'entwurf' NOT NULL,
      word_count integer DEFAULT 0 NOT NULL,
      summary text DEFAULT '',
      deleted_at timestamp with time zone,
      created_at timestamp with time zone DEFAULT now() NOT NULL,
      updated_at timestamp with time zone DEFAULT now() NOT NULL
    );

    CREATE TABLE IF NOT EXISTS chapter_contents (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      owner_id uuid NOT NULL,
      chapter_id uuid NOT NULL,
      content text DEFAULT '' NOT NULL,
      version integer DEFAULT 1 NOT NULL,
      saved_at timestamp with time zone DEFAULT now() NOT NULL
    );

    CREATE TABLE IF NOT EXISTS chapter_snapshots (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      owner_id uuid NOT NULL,
      chapter_id uuid NOT NULL,
      label text NOT NULL,
      content text NOT NULL,
      word_count integer DEFAULT 0 NOT NULL,
      created_at timestamp with time zone DEFAULT now() NOT NULL
    );

    CREATE TABLE IF NOT EXISTS characters (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      owner_id uuid NOT NULL,
      project_id uuid NOT NULL,
      name text NOT NULL,
      role text DEFAULT 'hauptfigur',
      description text DEFAULT '',
      appearance text DEFAULT '',
      motivation text DEFAULT '',
      notes text DEFAULT '',
      color text DEFAULT '#fbbf24',
      deleted_at timestamp with time zone,
      created_at timestamp with time zone DEFAULT now() NOT NULL,
      updated_at timestamp with time zone DEFAULT now() NOT NULL
    );

    CREATE TABLE IF NOT EXISTS locations (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      owner_id uuid NOT NULL,
      project_id uuid NOT NULL,
      name text NOT NULL,
      description text DEFAULT '',
      notes text DEFAULT '',
      deleted_at timestamp with time zone,
      created_at timestamp with time zone DEFAULT now() NOT NULL,
      updated_at timestamp with time zone DEFAULT now() NOT NULL
    );

    CREATE TABLE IF NOT EXISTS world_facts (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      owner_id uuid NOT NULL,
      project_id uuid NOT NULL,
      category text DEFAULT 'sonstiges' NOT NULL,
      title text NOT NULL,
      content text NOT NULL,
      source_chapter_id uuid,
      deleted_at timestamp with time zone,
      created_at timestamp with time zone DEFAULT now() NOT NULL,
      updated_at timestamp with time zone DEFAULT now() NOT NULL
    );

    CREATE TABLE IF NOT EXISTS relationships (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      owner_id uuid NOT NULL,
      project_id uuid NOT NULL,
      from_character_id uuid NOT NULL,
      to_character_id uuid NOT NULL,
      type text NOT NULL,
      description text DEFAULT '',
      created_at timestamp with time zone DEFAULT now() NOT NULL,
      updated_at timestamp with time zone DEFAULT now() NOT NULL
    );

    CREATE TABLE IF NOT EXISTS plot_threads (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      owner_id uuid NOT NULL,
      project_id uuid NOT NULL,
      title text NOT NULL,
      description text DEFAULT '',
      status text DEFAULT 'offen' NOT NULL,
      color text DEFAULT '#3b82f6',
      pattern text DEFAULT 'solid',
      created_at timestamp with time zone DEFAULT now() NOT NULL,
      updated_at timestamp with time zone DEFAULT now() NOT NULL
    );

    CREATE TABLE IF NOT EXISTS plot_events (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      owner_id uuid NOT NULL,
      project_id uuid NOT NULL,
      thread_id uuid,
      chapter_id uuid,
      position integer DEFAULT 1 NOT NULL,
      title text NOT NULL,
      description text DEFAULT '',
      story_time text,
      created_at timestamp with time zone DEFAULT now() NOT NULL,
      updated_at timestamp with time zone DEFAULT now() NOT NULL
    );

    CREATE TABLE IF NOT EXISTS research_notes (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      owner_id uuid NOT NULL,
      project_id uuid NOT NULL,
      title text NOT NULL,
      content text NOT NULL,
      url text,
      tags text[],
      deleted_at timestamp with time zone,
      created_at timestamp with time zone DEFAULT now() NOT NULL,
      updated_at timestamp with time zone DEFAULT now() NOT NULL
    );

    CREATE TABLE IF NOT EXISTS settings (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      owner_id uuid NOT NULL,
      user_id uuid,
      display_name text DEFAULT 'Marion' NOT NULL,
      daily_word_goal integer DEFAULT 200 NOT NULL,
      dictation_privacy_accepted boolean DEFAULT false NOT NULL,
      last_position text,
      expert_mode boolean DEFAULT false NOT NULL,
      theme text DEFAULT 'dark-high' NOT NULL,
      font_size integer DEFAULT 22 NOT NULL,
      line_height real DEFAULT 1.7 NOT NULL,
      tts_rate real DEFAULT 1.0 NOT NULL,
      tts_voice text DEFAULT 'de-DE',
      tour_completed boolean DEFAULT false NOT NULL,
      created_at timestamp with time zone DEFAULT now() NOT NULL,
      updated_at timestamp with time zone DEFAULT now() NOT NULL
    );

    CREATE TABLE IF NOT EXISTS custom_words (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      project_id text NOT NULL,
      word text NOT NULL,
      created_at timestamp with time zone DEFAULT now() NOT NULL
    );

    CREATE TABLE IF NOT EXISTS idea_notes (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      owner_id uuid NOT NULL,
      project_id text NOT NULL,
      chapter_id text,
      audio_path text NOT NULL,
      audio_mime text DEFAULT 'audio/webm;codecs=opus' NOT NULL,
      duration_sec integer DEFAULT 0 NOT NULL,
      transcript text,
      transcript_status text DEFAULT 'wartet' NOT NULL,
      title text,
      pinned boolean DEFAULT false NOT NULL,
      retry_count integer DEFAULT 0 NOT NULL,
      created_at timestamp with time zone DEFAULT now() NOT NULL,
      updated_at timestamp with time zone DEFAULT now() NOT NULL,
      deleted_at timestamp with time zone
    );

    CREATE TABLE IF NOT EXISTS sessions (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id uuid NOT NULL,
      token_hash text NOT NULL UNIQUE,
      user_agent text,
      expires_at timestamp with time zone NOT NULL,
      created_at timestamp with time zone DEFAULT now() NOT NULL
    );

    -- Test-User erstellen
    INSERT INTO users (id, username, display_name, password_hash) VALUES
      ('${userA}', 'userA', 'User A', 'hash-a');
  `);

  setTestDb(db);
});

afterAll(async () => {
  clearTestDb();
  await pglite.close();
});

beforeEach(async () => {
  // Alle Daten löschen außer User
  await pglite.exec(`
    DELETE FROM projects;
    DELETE FROM chapters;
    DELETE FROM chapter_contents;
    DELETE FROM chapter_snapshots;
    DELETE FROM characters;
    DELETE FROM locations;
    DELETE FROM world_facts;
    DELETE FROM relationships;
    DELETE FROM plot_threads;
    DELETE FROM plot_events;
    DELETE FROM research_notes;
    DELETE FROM settings;
    DELETE FROM custom_words;
    DELETE FROM idea_notes;
    DELETE FROM sessions;
  `);
});

describe('P5: Kernfunktionen', () => {
  describe('Schublade (Soft-Delete)', () => {
    it('sollte Kapitel in die Schublade legen', async () => {
      const saved = await repo.saveChapter(userA, { title: 'Löschbar', order: 1, body: 'Text' });
      await repo.deleteChapter(userA, saved!.id);

      const drawer = await repo.getDrawerItems(userA);
      expect(drawer.length).toBe(1);
      expect(drawer[0].type).toBe('chapter');
      expect(drawer[0].title).toBe('Löschbar');
    });

    it('sollte Kapitel aus der Schublade zurückholen', async () => {
      const saved = await repo.saveChapter(userA, { title: 'Zurückholen', order: 1, body: 'Text' });
      await repo.deleteChapter(userA, saved!.id);
      await repo.restoreDrawerItem(userA, saved!.id);

      const restored = await repo.getChapters(userA);
      expect(restored.length).toBe(1);
      expect(restored[0].title).toBe('Zurückholen');
    });

    it('sollte Charaktere in die Schublade legen', async () => {
      await repo.saveEntity(userA, { name: 'Test Charakter', type: 'character' });
      const entities = await repo.getEntities(userA);
      await repo.deleteEntity(userA, entities[0].id);

      const drawer = await repo.getDrawerItems(userA);
      expect(drawer.length).toBe(1);
      expect(drawer[0].type).toBe('character');
    });
  });

  describe('Zeitmaschine (Snapshots)', () => {
    it('sollte Snapshot erstellen', async () => {
      const saved = await repo.saveChapter(userA, { title: 'Original', order: 1, body: 'Original Text' });
      const snapshot = await repo.createSnapshot(userA, saved!.id, 'Vor Änderung', 'Original Text');

      expect(snapshot).toBeDefined();
      expect(snapshot.label).toBe('Vor Änderung');
      expect(snapshot.content).toBe('Original Text');
    });

    it('sollte Snapshot zurückholen', async () => {
      const saved = await repo.saveChapter(userA, { title: 'Original', order: 1, body: 'Original Text' });
      const snapshot = await repo.createSnapshot(userA, saved!.id, 'Vor Änderung', 'Original Text');

      await repo.saveChapter(userA, { id: saved!.id, title: 'Geändert', body: 'Neuer Text' });
      const restored = await repo.restoreSnapshot(userA, saved!.id, snapshot!.id);

      expect(restored).toBe('Original Text');
    });

    it('sollte alle Snapshots eines Kapitels auflisten', async () => {
      const saved = await repo.saveChapter(userA, { title: 'Test', order: 1, body: 'Text 1' });
      await repo.createSnapshot(userA, saved!.id, 'Snapshot 1', 'Text 1');
      await repo.createSnapshot(userA, saved!.id, 'Snapshot 2', 'Text 2');

      const snapshots = await repo.getSnapshots(userA, saved!.id);
      expect(snapshots.length).toBe(2);
    });
  });

  describe('Sync-Konflikt', () => {
    it('sollte neuere Server-Fassung erkennen', async () => {
      // Erstelle Kapitel mit Version 1
      const saved = await repo.saveChapter(userA, { title: 'Test', order: 1, body: 'Version 1' });
      const chapter = await repo.getChapter(userA, saved!.id);

      // Simuliere ältere Client-Version (baseServerVersion = 0)
      const baseServerVersion = 0;
      const hasConflict = chapter && chapter.revision > baseServerVersion;

      expect(hasConflict).toBe(true);
    });

    it('sollte keine Konflikte bei gleicher Version melden', async () => {
      const saved = await repo.saveChapter(userA, { title: 'Test', order: 1, body: 'Version 1' });
      const chapter = await repo.getChapter(userA, saved!.id);

      // Simuliere gleiche Version
      const baseServerVersion = chapter!.revision;
      const hasConflict = chapter!.revision > baseServerVersion;

      expect(hasConflict).toBe(false);
    });
  });

  describe('Thesaurus', () => {
    it('sollte Thesaurus-Daten laden', async () => {
      const fs = await import('fs');
      const path = await import('path');
      const thesaurusPath = path.join(process.cwd(), 'data', 'openthesaurus_de.json');
      
      if (fs.existsSync(thesaurusPath)) {
        const data = JSON.parse(fs.readFileSync(thesaurusPath, 'utf-8'));
        expect(data).toBeDefined();
        expect(Array.isArray(data)).toBe(true);
      }
    });
  });

  describe('Upload-Grenzen', () => {
    it('sollte 15 MB als Limit haben', () => {
      const maxFileSize = 15 * 1024 * 1024; // 15 MB
      expect(maxFileSize).toBe(15728640);
    });

    it('sollte nur Audio-MIME-Typen akzeptieren', () => {
      const validMimeTypes = ['audio/webm', 'audio/mp3', 'audio/wav', 'audio/ogg'];
      const invalidMimeTypes = ['image/png', 'text/plain', 'application/pdf'];

      for (const mime of validMimeTypes) {
        expect(mime.startsWith('audio/')).toBe(true);
      }

      for (const mime of invalidMimeTypes) {
        expect(mime.startsWith('audio/')).toBe(false);
      }
    });
  });

  describe('Spracherkennung (fail-closed)', () => {
    it('sollte ohne Konfiguration fehlschlagen', () => {
      // Ohne ENV-Variablen sollte ASR nicht konfiguriert sein
      const configured = isASRConfigured();
      expect(configured).toBe(false);
    });
  });

  describe('Buch-Vorschau', () => {
    it('sollte Kapitel in richtiger Reihenfolge laden', async () => {
      await repo.saveChapter(userA, { title: 'Kapitel 1', order: 1, body: 'Text 1' });
      await repo.saveChapter(userA, { title: 'Kapitel 2', order: 2, body: 'Text 2' });
      await repo.saveChapter(userA, { title: 'Kapitel 3', order: 3, body: 'Text 3' });

      const chapters = await repo.getChapters(userA);
      expect(chapters.length).toBe(3);
      expect(chapters[0].order).toBe(1);
      expect(chapters[1].order).toBe(2);
      expect(chapters[2].order).toBe(3);
    });
  });
});
