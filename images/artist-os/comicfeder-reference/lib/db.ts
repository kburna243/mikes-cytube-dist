import pg from 'pg';
import { drizzle, type NodePgDatabase } from 'drizzle-orm/node-postgres';
import { PGlite } from '@electric-sql/pglite';
import { drizzle as drizzlePglite } from 'drizzle-orm/pglite';
import * as schema from '../drizzle/schema.js';

const { Pool } = pg;

let pool: pg.Pool | null = null;
let dbInstance: NodePgDatabase<typeof schema> | any = null;
let devPglite: PGlite | null = null;
let devPgliteWarned = false;
let devSchemaInitialized = false;

// Für Tests: Erlaubt das Setzen einer eigenen DB-Instanz
let testDbInstance: any = null;

export function setTestDb(db: any) {
  testDbInstance = db;
  // Reset production DB instance to avoid conflicts
  dbInstance = null;
  pool = null;
}

export function clearTestDb() {
  testDbInstance = null;
}

export const FULL_SCHEMA_SQL = `
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
    reading_direction text DEFAULT 'ltr' NOT NULL,
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

  CREATE TABLE IF NOT EXISTS scenes (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id uuid NOT NULL,
    chapter_id uuid NOT NULL,
    position integer DEFAULT 1 NOT NULL,
    title text NOT NULL,
    summary text,
    location_id uuid,
    deleted_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
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

  CREATE TABLE IF NOT EXISTS copilot_messages (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id uuid NOT NULL,
    project_id uuid NOT NULL,
    chapter_id uuid,
    role text NOT NULL,
    content text NOT NULL,
    model text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
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

  CREATE TABLE IF NOT EXISTS thesaurus_entries (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    word text NOT NULL,
    synset_group text NOT NULL,
    synonyms text[] NOT NULL
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

  CREATE TABLE IF NOT EXISTS proposals (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id uuid NOT NULL,
    target_type text NOT NULL,
    target_id text NOT NULL,
    op text NOT NULL,
    payload text NOT NULL,
    rationale text NOT NULL,
    status text DEFAULT 'pending' NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
  );

  CREATE TABLE IF NOT EXISTS assets (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id uuid NOT NULL,
    project_id uuid NOT NULL,
    title text NOT NULL,
    original_filename text NOT NULL,
    sha256 text NOT NULL,
    mime_type text NOT NULL,
    bytes integer NOT NULL,
    width integer NOT NULL,
    height integer NOT NULL,
    color_space text DEFAULT 'srgb' NOT NULL,
    original_path text NOT NULL,
    thumbnail_path text NOT NULL,
    preview_path text NOT NULL,
    print_path text NOT NULL,
    tags text[] DEFAULT '{}' NOT NULL,
    character_id uuid,
    location_id uuid,
    scene_id uuid,
    deleted_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
  );

  CREATE TABLE IF NOT EXISTS comic_pages (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id uuid NOT NULL,
    chapter_id uuid NOT NULL,
    page_number integer DEFAULT 1 NOT NULL,
    format text DEFAULT 'A4' NOT NULL,
    format_id uuid,
    dpi integer DEFAULT 300 NOT NULL,
    width_mm real DEFAULT 210 NOT NULL,
    height_mm real DEFAULT 297 NOT NULL,
    bleed_mm real DEFAULT 3 NOT NULL,
    gutter_mm real DEFAULT 4 NOT NULL,
    is_spread boolean DEFAULT false NOT NULL,
    spine_safety_mm real DEFAULT 10 NOT NULL,
    reading_direction text DEFAULT 'ltr' NOT NULL,
    deleted_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
  );

  CREATE TABLE IF NOT EXISTS panels (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id uuid NOT NULL,
    page_id uuid NOT NULL,
    polygon text NOT NULL,
    border_width real DEFAULT 2 NOT NULL,
    z_index integer DEFAULT 1 NOT NULL,
    alt_text text DEFAULT '' NOT NULL,
    reading_order integer DEFAULT 1 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
  );

  CREATE TABLE IF NOT EXISTS panel_images (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id uuid NOT NULL,
    panel_id uuid NOT NULL,
    asset_id uuid NOT NULL,
    transform text DEFAULT '{"x":0,"y":0,"scale":1,"rotation":0}' NOT NULL,
    crop text DEFAULT '{"left":0,"top":0,"width":1,"height":1}' NOT NULL,
    opacity real DEFAULT 1.0 NOT NULL,
    z_index integer DEFAULT 1 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
  );

  CREATE TABLE IF NOT EXISTS balloons (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id uuid NOT NULL,
    page_id uuid NOT NULL,
    panel_id uuid,
    type text DEFAULT 'sprechen' NOT NULL,
    text text NOT NULL,
    position text DEFAULT '{"x":20,"y":20,"width":60,"height":30}' NOT NULL,
    tail_position text DEFAULT '{"x":40,"y":60}' NOT NULL,
    reading_order integer DEFAULT 1 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
  );

  CREATE TABLE IF NOT EXISTS export_fingerprints (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id uuid NOT NULL,
    asset_id uuid,
    page_id uuid,
    format text NOT NULL,
    p_hash text NOT NULL,
    sha256 text NOT NULL,
    watermark_payload text NOT NULL,
    metadata_json text DEFAULT '{}' NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
  );

  CREATE TABLE IF NOT EXISTS protection_jobs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id uuid NOT NULL,
    asset_id uuid NOT NULL,
    strength text DEFAULT 'mittel' NOT NULL,
    status text DEFAULT 'wartet' NOT NULL,
    worker_url text,
    output_path text,
    ssim real,
    error_message text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
  );

  CREATE TABLE IF NOT EXISTS page_formats (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id uuid NOT NULL,
    name text NOT NULL,
    category text DEFAULT 'custom' NOT NULL,
    width real NOT NULL,
    height real NOT NULL,
    unit text DEFAULT 'mm' NOT NULL,
    dpi integer DEFAULT 300 NOT NULL,
    bleed real DEFAULT 3 NOT NULL,
    safe_margin real DEFAULT 5 NOT NULL,
    gutter real DEFAULT 4 NOT NULL,
    orientation text DEFAULT 'portrait' NOT NULL,
    is_custom boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
  );

  CREATE TABLE IF NOT EXISTS page_elements (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id uuid NOT NULL,
    page_id uuid NOT NULL,
    element_type text DEFAULT 'image' NOT NULL,
    asset_id uuid,
    text text DEFAULT '' NOT NULL,
    x real DEFAULT 10 NOT NULL,
    y real DEFAULT 10 NOT NULL,
    width real DEFAULT 50 NOT NULL,
    height real DEFAULT 50 NOT NULL,
    rotation real DEFAULT 0 NOT NULL,
    flip_x boolean DEFAULT false NOT NULL,
    flip_y boolean DEFAULT false NOT NULL,
    opacity real DEFAULT 1.0 NOT NULL,
    z_index integer DEFAULT 10 NOT NULL,
    locked boolean DEFAULT false NOT NULL,
    visible boolean DEFAULT true NOT NULL,
    group_id text,
    mask_json text,
    style_json text DEFAULT '{}' NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
  );

  CREATE TABLE IF NOT EXISTS connector_accounts (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id uuid NOT NULL,
    connector_id text NOT NULL,
    kind text NOT NULL,
    account_label text DEFAULT '' NOT NULL,
    encrypted_credentials text NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
  );

  CREATE TABLE IF NOT EXISTS publications (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id uuid NOT NULL,
    project_id uuid NOT NULL,
    connector_id text NOT NULL,
    kind text NOT NULL,
    source_type text DEFAULT 'page' NOT NULL,
    source_id text NOT NULL,
    title text NOT NULL,
    body_text text DEFAULT '' NOT NULL,
    tags text[] DEFAULT '{}' NOT NULL,
    asset_ids text[] DEFAULT '{}' NOT NULL,
    status text DEFAULT 'entwurf' NOT NULL,
    external_id text,
    payload_json text DEFAULT '{}' NOT NULL,
    published_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
  );

  CREATE TABLE IF NOT EXISTS merch_products (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id uuid NOT NULL,
    project_id uuid NOT NULL,
    title text NOT NULL,
    description text DEFAULT '' NOT NULL,
    product_type text NOT NULL,
    source_type text DEFAULT 'asset' NOT NULL,
    source_id text NOT NULL,
    cutout_asset_id uuid,
    print_format_name text DEFAULT 'T-Shirt-Druckfläche' NOT NULL,
    placement_json text DEFAULT '{"x":0.5,"y":0.5,"scale":0.8,"rotation":0}' NOT NULL,
    color_variants text[] DEFAULT '{"schwarz","weiss"}' NOT NULL,
    suggested_price_cents integer DEFAULT 2490 NOT NULL,
    currency text DEFAULT 'EUR' NOT NULL,
    print_check_json text DEFAULT '{}' NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
  );
`;

export function getDb() {
  // Test-DB hat Vorrang
  if (testDbInstance) {
    return testDbInstance;
  }

  const connectionString = process.env.DATABASE_URL?.trim();

  if (!connectionString) {
    // In Produktion bleibt PostgreSQL Pflicht!
    if (process.env.NODE_ENV === 'production') {
      console.error('❌ [DB] DATABASE_URL fehlt in Produktion. PostgreSQL ist Pflicht!');
      return null;
    }

    // Entwicklungs-Fallback PGlite mit deutlicher Warnung im Log
    if (!devPglite) {
      if (!devPgliteWarned) {
        console.warn(
          '⚠️ [DB] WARNUNG: Keine DATABASE_URL gesetzt – nutze lokalen PGlite Entwicklungs-Fallback (In-Memory/Lokal). In Produktion ist PostgreSQL Pflicht!'
        );
        devPgliteWarned = true;
      }
      devPglite = new PGlite();
      dbInstance = drizzlePglite(devPglite, { schema });
    }
    return dbInstance;
  }

  if (!dbInstance) {
    try {
      pool = new Pool({
        connectionString,
        max: 10,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 5000,
      });

      dbInstance = drizzle(pool, { schema });
    } catch (err) {
      console.warn('[DB] PostgreSQL Verbindung konnte nicht aufgebaut werden:', err);
      return null;
    }
  }

  return dbInstance;
}

/**
 * Prüft, ob der Entwicklungs-Login-Knopf erlaubt ist:
 * Nur wenn NODE_ENV !== 'production' UND ALLOW_DEV_LOGIN === 'true'.
 * In Produktion gibt es niemals einen fest eingebauten Benutzer.
 */
export function isDevLoginAllowed(): boolean {
  return process.env.NODE_ENV !== 'production' && process.env.ALLOW_DEV_LOGIN === 'true';
}

/**
 * Initialisiert bei aktivem PGlite-Entwicklungs-Fallback alle Tabellen.
 * Ein Entwicklungs-Nutzer wird nur dann angelegt, wenn NODE_ENV !== 'production'
 * UND ALLOW_DEV_LOGIN === 'true' gesetzt ist.
 */
export async function ensureDevFallbackInitialized(): Promise<void> {
  if (process.env.DATABASE_URL?.trim() || process.env.NODE_ENV === 'production' || testDbInstance) {
    return;
  }
  const db = getDb();
  if (!db || !devPglite || devSchemaInitialized) return;

  await devPglite.exec(FULL_SCHEMA_SQL);
  devSchemaInitialized = true;

  if (!isDevLoginAllowed()) {
    return;
  }

  const existingUsers = await db.select().from(schema.users).limit(1);
  if (existingUsers.length === 0) {
    const bcrypt = await import('bcryptjs');
    const passwordHash = await bcrypt.hash('federfuehrer', 12);
    const [user] = await db
      .insert(schema.users)
      .values({
        username: 'autorin',
        displayName: 'Marion (Illustratorin)',
        passwordHash,
      })
      .returning();

    const [project] = await db
      .insert(schema.projects)
      .values({
        ownerId: user.id,
        title: 'Schatten über Altwald',
        subtitle: 'Graphic Novel & Kriminalroman',
        genre: 'Graphic Novel / Historischer Krimi',
        synopsis: 'Ein nebliger Morgen im Schwarzwald 1928.',
        status: 'in_arbeit',
      })
      .returning();

    const [ch1] = await db
      .insert(schema.chapters)
      .values({
        ownerId: user.id,
        projectId: project.id,
        position: 1,
        title: 'Kapitel 1: Der Geruch von Mehl und Asche',
        summary: 'Lukas trifft im Morgengrauen in Altwald ein und betritt die Backstube von Marta Reinhold.',
        status: 'entwurf',
      })
      .returning();

    await db.insert(schema.chapterContents).values({
      ownerId: user.id,
      chapterId: ch1.id,
      content: `Der frühe Nebel lag wie feuchtes Tuch zwischen den Tannen des Schwarzwaldes. Als Lukas den ersten Pflasterstein von Altwald betrat, war das einzige Licht im Dorf der Schein aus der Backstube.\n\nMarta Reinhold stand hinter dem schweren Eichentisch. »Wir öffnen erst um sechs«, sagte sie ruhig.\n\n»Ich suche nicht nach Brot, Frau Reinhold. Ich suche nach meinem Bruder Heinrich!«, rief Lukas.\n\nKRACH! Die alte Holztür schlug im Wind ins Schloss.`,
      version: 1,
    });

    await db.insert(schema.characters).values([
      {
        ownerId: user.id,
        projectId: project.id,
        name: 'Marta Reinhold',
        role: 'hauptfigur',
        description: 'Bäckerin von Altwald mit kühlen grauen Augen.',
        color: '#fbbf24',
      },
      {
        ownerId: user.id,
        projectId: project.id,
        name: 'Lukas von Berg',
        role: 'hauptfigur',
        description: 'Reisender Ermittler auf der Suche nach seinem Bruder.',
        color: '#60a5fa',
      },
    ]);

    await db.insert(schema.locations).values({
      ownerId: user.id,
      projectId: project.id,
      name: 'Bäckerei Reinhold',
      description: 'Backstube im nebligen Altwald.',
    });

    await db.insert(schema.scenes).values({
      ownerId: user.id,
      chapterId: ch1.id,
      position: 1,
      title: 'Szene 1: Ankunft in der Backstube',
      summary: 'Erste Begegnung zwischen Lukas und Marta am Backtisch.',
    });

    console.warn(
      'ℹ️ [DB] PGlite Entwicklungs-Datenbank initialisiert (Login für Vorschau: Benutzername "autorin", Passwort "federfuehrer").'
    );
  }
}

export { schema };
