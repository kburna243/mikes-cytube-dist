import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { PGlite } from '@electric-sql/pglite';
import { drizzle } from 'drizzle-orm/pglite';
import * as schema from '../drizzle/schema.js';
import { repo } from '../lib/repo.js';
import { setTestDb, clearTestDb } from '../lib/db.js';

let pglite: PGlite;
let db: ReturnType<typeof drizzle>;
const userA = 'aaaaaaaa-0000-0000-0000-000000000001';
const userB = 'bbbbbbbb-0000-0000-0000-000000000002';

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

    CREATE TABLE IF NOT EXISTS chapter_snapshots (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      owner_id uuid NOT NULL,
      chapter_id uuid NOT NULL,
      label text NOT NULL,
      content text NOT NULL,
      word_count integer DEFAULT 0 NOT NULL,
      created_at timestamp with time zone DEFAULT now() NOT NULL
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
      ('${userA}', 'userA', 'User A', 'hash-a'),
      ('${userB}', 'userB', 'User B', 'hash-b');
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
    DELETE FROM chapter_snapshots;
    DELETE FROM sessions;
  `);
});

describe('P2: PostgreSQL als einziger Speicher', () => {
  describe('Persistenz', () => {
    it('sollte ein Kapitel speichern und wieder laden', async () => {
      // Kapitel speichern - ID wird automatisch generiert
      const saved = await repo.saveChapter(userA, {
        title: 'Test Kapitel',
        body: 'Dies ist ein Testkapitel.',
        order: 1,
        summary: 'Test Summary',
      });

      expect(saved).toBeDefined();
      expect(saved?.title).toBe('Test Kapitel');

      // Kapitel laden (simuliert Server-Neustart)
      const loaded = await repo.getChapter(userA, saved!.id);
      expect(loaded).toBeDefined();
      expect(loaded?.title).toBe('Test Kapitel');
      expect(loaded?.body).toBe('Dies ist ein Testkapitel.');
    });

    it('sollte mehrere Kapitel in der richtigen Reihenfolge laden', async () => {
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

  describe('Owner-Isolation', () => {
    it('sollte Daten von Nutzer A für Nutzer B unsichtbar machen', async () => {
      // Nutzer A erstellt Daten
      await repo.saveChapter(userA, { title: 'A Kapitel', order: 1, body: 'A Text' });
      await repo.saveEntity(userA, { name: 'A Charakter', type: 'character' });
      await repo.addFact(userA, { statement: 'A Fakt', source: 'A Quelle' });

      // Nutzer B sollte keine Daten von A sehen
      const bChapters = await repo.getChapters(userB);
      expect(bChapters.length).toBe(0);

      const bEntities = await repo.getEntities(userB);
      expect(bEntities.length).toBe(0);

      const bFacts = await repo.getFacts(userB);
      expect(bFacts.length).toBe(0);

      // Nutzer A sollte seine eigenen Daten sehen
      const aChapters = await repo.getChapters(userA);
      expect(aChapters.length).toBe(1);
      expect(aChapters[0].title).toBe('A Kapitel');

      const aEntities = await repo.getEntities(userA);
      expect(aEntities.length).toBe(1);
      expect(aEntities[0].name).toBe('A Charakter');

      const aFacts = await repo.getFacts(userA);
      expect(aFacts.length).toBe(1);
      expect(aFacts[0].statement).toBe('A Fakt');
    });

    it('sollte verhindern, dass Nutzer B auf Kapitel von A zugreift', async () => {
      const saved = await repo.saveChapter(userA, { title: 'Geheim', order: 1, body: 'Geheim' });

      // Nutzer B versucht direkt zuzugreifen
      const result = await repo.getChapter(userB, saved!.id);
      expect(result).toBeNull();
    });
  });

  describe('Soft-Delete (Schublade)', () => {
    it('sollte Kapitel in die Schublade legen und zurückholen', async () => {
      const saved = await repo.saveChapter(userA, { title: 'Löschbar', order: 1, body: 'Text' });

      // In Schublade legen
      await repo.deleteChapter(userA, saved!.id);

      // Sollte nicht mehr in aktiven Kapiteln sein
      const active = await repo.getChapters(userA);
      expect(active.length).toBe(0);

      // Sollte in Schublade sein
      const drawer = await repo.getDrawerItems(userA);
      expect(drawer.length).toBe(1);
      expect(drawer[0].type).toBe('chapter');
      expect(drawer[0].title).toBe('Löschbar');

      // Zurückholen
      await repo.restoreDrawerItem(userA, saved!.id);

      // Sollte wieder aktiv sein
      const restored = await repo.getChapters(userA);
      expect(restored.length).toBe(1);
      expect(restored[0].title).toBe('Löschbar');
    });
  });

  describe('Zeitmaschine (Snapshots)', () => {
    it('sollte Snapshot erstellen und zurückholen', async () => {
      // Kapitel erstellen
      const saved = await repo.saveChapter(userA, { title: 'Original', order: 1, body: 'Original Text' });

      // Snapshot erstellen
      const snapshot = await repo.createSnapshot(userA, saved!.id, 'Vor Änderung', 'Original Text');
      expect(snapshot).toBeDefined();
      expect(snapshot.label).toBe('Vor Änderung');
      expect(snapshot.content).toBe('Original Text');

      // Kapitel ändern
      await repo.saveChapter(userA, { id: saved!.id, title: 'Geändert', body: 'Neuer Text' });

      // Snapshot zurückholen
      const restored = await repo.restoreSnapshot(userA, saved!.id, snapshot!.id);
      expect(restored).toBe('Original Text');

      // Kapitel sollte wieder Original-Inhalt haben
      const chapter = await repo.getChapter(userA, saved!.id);
      expect(chapter?.body).toBe('Original Text');
    });
  });

  describe('Settings', () => {
    it('sollte Settings speichern und laden', async () => {
      await repo.updateSettings(userA, {
        theme: 'light-high',
        fontSize: 18,
        displayName: 'Test User',
      });

      const settings = await repo.getSettings(userA);
      expect(settings.theme).toBe('light-high');
      expect(settings.fontSize).toBe(18);
      expect(settings.displayName).toBe('Test User');
    });

    it('sollte Settings für verschiedene User trennen', async () => {
      await repo.updateSettings(userA, { theme: 'dark-high', displayName: 'User A' });
      await repo.updateSettings(userB, { theme: 'light-high', displayName: 'User B' });

      const aSettings = await repo.getSettings(userA);
      const bSettings = await repo.getSettings(userB);

      expect(aSettings.theme).toBe('dark-high');
      expect(aSettings.displayName).toBe('User A');
      expect(bSettings.theme).toBe('light-high');
      expect(bSettings.displayName).toBe('User B');
    });
  });
});
