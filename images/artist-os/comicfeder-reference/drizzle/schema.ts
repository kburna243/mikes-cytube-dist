import { pgTable, text, timestamp, uuid, integer, real, boolean } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// 1. Users
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  username: text('username').notNull().unique(),
  displayName: text('display_name').notNull(),
  email: text('email'),
  passwordHash: text('password_hash').notNull(),
  failedLogins: integer('failed_logins').default(0).notNull(),
  lockedUntil: timestamp('locked_until', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// 1b. Sessions
export const sessions = pgTable('sessions', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  tokenHash: text('token_hash').notNull().unique(),
  userAgent: text('user_agent'),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// 2. Projects (Buchprojekte)
export const projects = pgTable('projects', {
  id: uuid('id').primaryKey().defaultRandom(),
  ownerId: uuid('owner_id').notNull(),
  title: text('title').notNull(),
  subtitle: text('subtitle'),
  genre: text('genre'),
  synopsis: text('synopsis'),
  targetWords: integer('target_words').default(50000),
  status: text('status').default('in_arbeit').notNull(), // 'in_arbeit' | 'abgeschlossen' | 'geplant'
  coverColor: text('cover_color').default('#fbbf24'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// 3. Chapters
export const chapters = pgTable('chapters', {
  id: uuid('id').primaryKey().defaultRandom(),
  ownerId: uuid('owner_id').notNull(),
  projectId: uuid('project_id').references(() => projects.id, { onDelete: 'cascade' }).notNull(),
  position: integer('position').notNull().default(1),
  title: text('title').notNull(),
  povCharacterId: uuid('pov_character_id'),
  status: text('status').notNull().default('entwurf'), // 'idee' | 'entwurf' | 'ueberarbeitung' | 'fertig'
  wordCount: integer('word_count').default(0).notNull(),
  summary: text('summary').default(''),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// 4. Chapter Contents (Versionierte Speicherung - behält die letzten 50 Versionen)
export const chapterContents = pgTable('chapter_contents', {
  id: uuid('id').primaryKey().defaultRandom(),
  ownerId: uuid('owner_id').notNull(),
  chapterId: uuid('chapter_id').references(() => chapters.id, { onDelete: 'cascade' }).notNull(),
  content: text('content').notNull().default(''),
  version: integer('version').notNull().default(1),
  savedAt: timestamp('saved_at', { withTimezone: true }).defaultNow().notNull(),
});

// 4b. Chapter Snapshots (Kapitel-Zeitmaschine alle 15 Minuten & vor Wiederherstellung)
export const chapterSnapshots = pgTable('chapter_snapshots', {
  id: uuid('id').primaryKey().defaultRandom(),
  ownerId: uuid('owner_id').notNull(),
  chapterId: uuid('chapter_id').references(() => chapters.id, { onDelete: 'cascade' }).notNull(),
  label: text('label').notNull(), // z.B. "Heute 14:30 Uhr", "Gestern Abend", "Montag Vormittag"
  content: text('content').notNull(),
  wordCount: integer('word_count').default(0).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// 5. Scenes (Optional für Szenenplanung)
export const scenes = pgTable('scenes', {
  id: uuid('id').primaryKey().defaultRandom(),
  ownerId: uuid('owner_id').notNull(),
  chapterId: uuid('chapter_id').references(() => chapters.id, { onDelete: 'cascade' }).notNull(),
  position: integer('position').notNull().default(1),
  title: text('title').notNull(),
  summary: text('summary'),
  locationId: uuid('location_id'),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// 6. Characters
export const characters = pgTable('characters', {
  id: uuid('id').primaryKey().defaultRandom(),
  ownerId: uuid('owner_id').notNull(),
  projectId: uuid('project_id').references(() => projects.id, { onDelete: 'cascade' }).notNull(),
  name: text('name').notNull(),
  role: text('role').default('hauptfigur'), // 'hauptfigur' | 'nebenfigur' | 'antagonist'
  description: text('description').default(''),
  appearance: text('appearance').default(''),
  motivation: text('motivation').default(''),
  notes: text('notes').default(''),
  color: text('color').default('#fbbf24'),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// 7. Locations
export const locations = pgTable('locations', {
  id: uuid('id').primaryKey().defaultRandom(),
  ownerId: uuid('owner_id').notNull(),
  projectId: uuid('project_id').references(() => projects.id, { onDelete: 'cascade' }).notNull(),
  name: text('name').notNull(),
  description: text('description').default(''),
  notes: text('notes').default(''),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// 8. World Facts (Kanonische Fakten für den Kontinuitäts-Checker)
export const worldFacts = pgTable('world_facts', {
  id: uuid('id').primaryKey().defaultRandom(),
  ownerId: uuid('owner_id').notNull(),
  projectId: uuid('project_id').references(() => projects.id, { onDelete: 'cascade' }).notNull(),
  category: text('category').notNull().default('sonstiges'), // 'person' | 'ort' | 'zeit' | 'gegenstand' | 'regel' | 'sonstiges'
  title: text('title').notNull(),
  content: text('content').notNull(),
  sourceChapterId: uuid('source_chapter_id'),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// 9. Relationships
export const relationships = pgTable('relationships', {
  id: uuid('id').primaryKey().defaultRandom(),
  ownerId: uuid('owner_id').notNull(),
  projectId: uuid('project_id').references(() => projects.id, { onDelete: 'cascade' }).notNull(),
  fromCharacterId: uuid('from_character_id').references(() => characters.id, { onDelete: 'cascade' }).notNull(),
  toCharacterId: uuid('to_character_id').references(() => characters.id, { onDelete: 'cascade' }).notNull(),
  type: text('type').notNull(), // 'familie' | 'verbuendet' | 'feindselig' | 'geheimnis'
  description: text('description').default(''),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// 10. Plot Threads
export const plotThreads = pgTable('plot_threads', {
  id: uuid('id').primaryKey().defaultRandom(),
  ownerId: uuid('owner_id').notNull(),
  projectId: uuid('project_id').references(() => projects.id, { onDelete: 'cascade' }).notNull(),
  title: text('title').notNull(),
  description: text('description').default(''),
  status: text('status').notNull().default('offen'), // 'offen' | 'aufgeloest'
  color: text('color').default('#3b82f6'),
  pattern: text('pattern').default('solid'), // 'solid' | 'dashed' | 'dotted' (WCAG A5)
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// 11. Plot Events
export const plotEvents = pgTable('plot_events', {
  id: uuid('id').primaryKey().defaultRandom(),
  ownerId: uuid('owner_id').notNull(),
  projectId: uuid('project_id').references(() => projects.id, { onDelete: 'cascade' }).notNull(),
  threadId: uuid('thread_id').references(() => plotThreads.id, { onDelete: 'cascade' }),
  chapterId: uuid('chapter_id').references(() => chapters.id, { onDelete: 'set null' }),
  position: integer('position').notNull().default(1),
  title: text('title').notNull(),
  description: text('description').default(''),
  storyTime: text('story_time'), // In-Universe Datum/Zeitangabe
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// 12. Research Notes
export const researchNotes = pgTable('research_notes', {
  id: uuid('id').primaryKey().defaultRandom(),
  ownerId: uuid('owner_id').notNull(),
  projectId: uuid('project_id').references(() => projects.id, { onDelete: 'cascade' }).notNull(),
  title: text('title').notNull(),
  content: text('content').notNull(),
  url: text('url'),
  tags: text('tags').array(),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// 13. Copilot Messages
export const copilotMessages = pgTable('copilot_messages', {
  id: uuid('id').primaryKey().defaultRandom(),
  ownerId: uuid('owner_id').notNull(),
  projectId: uuid('project_id').references(() => projects.id, { onDelete: 'cascade' }).notNull(),
  chapterId: uuid('chapter_id'),
  role: text('role').notNull(), // 'user' | 'assistant'
  content: text('content').notNull(),
  model: text('model').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// 14. Settings (Barrierefreiheit & Benutzer-Präferenzen)
export const settings = pgTable('settings', {
  id: uuid('id').primaryKey().defaultRandom(),
  ownerId: uuid('owner_id').notNull(),
  userId: uuid('user_id'),
  displayName: text('display_name').default('Marion').notNull(),
  dailyWordGoal: integer('daily_word_goal').default(200).notNull(),
  dictationPrivacyAccepted: boolean('dictation_privacy_accepted').default(false).notNull(),
  lastPosition: text('last_position'), // JSON: { chapterId, chapterTitle, paragraphIndex, scrollPosition, updatedAt }
  expertMode: boolean('expert_mode').default(false).notNull(),
  theme: text('theme').default('dark-high').notNull(),
  fontSize: integer('font_size').default(22).notNull(),
  lineHeight: real('line_height').default(1.7).notNull(),
  ttsRate: real('tts_rate').default(1.0).notNull(),
  ttsVoice: text('tts_voice').default('de-DE'),
  tourCompleted: boolean('tour_completed').default(false).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// 15. Autoren-Whitelist für Rechtschreibung (Wort pro Projekt)
export const customWords = pgTable('custom_words', {
  id: uuid('id').primaryKey().defaultRandom(),
  projectId: text('project_id').notNull(),
  word: text('word').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// 16. OpenThesaurus Einträge (Deutscher Thesaurus lokal in PostgreSQL)
export const thesaurusEntries = pgTable('thesaurus_entries', {
  id: uuid('id').primaryKey().defaultRandom(),
  word: text('word').notNull(),
  synsetGroup: text('synset_group').notNull(),
  synonyms: text('synonyms').array().notNull(),
});

// 17. Ideen-Kladde (Sprachnotizen mit Audio-Datei auf Volume & ASR)
export const ideaNotes = pgTable('idea_notes', {
  id: uuid('id').primaryKey().defaultRandom(),
  ownerId: uuid('owner_id').notNull(),
  projectId: text('project_id').notNull(),
  chapterId: text('chapter_id'),
  audioPath: text('audio_path').notNull(),
  audioMime: text('audio_mime').default('audio/webm;codecs=opus').notNull(),
  durationSec: integer('duration_sec').default(0).notNull(),
  transcript: text('transcript'),
  transcriptStatus: text('transcript_status').default('wartet').notNull(), // 'wartet' | 'läuft' | 'fertig' | 'fehler'
  title: text('title'),
  pinned: boolean('pinned').default(false).notNull(),
  retryCount: integer('retry_count').default(0).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
});

// 18. Proposals (Vorschläge für Human-in-the-Loop & Skript-Brücke)
export const proposals = pgTable('proposals', {
  id: uuid('id').primaryKey().defaultRandom(),
  ownerId: uuid('owner_id').notNull(),
  targetType: text('target_type').notNull(), // 'comic_script' | 'entity_fact' | 'chapter_body' | 'plot_beat' | 'timeline_event'
  targetId: text('target_id').notNull(),
  op: text('op').notNull(), // 'create_comic_breakdown' | 'append_fact' | 'update_fact' | 'append_beat' | 'insert_text' | 'create_entity'
  payload: text('payload').notNull(), // JSON
  rationale: text('rationale').notNull(),
  status: text('status').default('pending').notNull(), // 'pending' | 'accepted' | 'rejected'
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// 19. Assets (Bildbibliothek für Graphic Novels & Comics)
export const assets = pgTable('assets', {
  id: uuid('id').primaryKey().defaultRandom(),
  ownerId: uuid('owner_id').notNull(),
  projectId: uuid('project_id').references(() => projects.id, { onDelete: 'cascade' }).notNull(),
  title: text('title').notNull(),
  originalFilename: text('original_filename').notNull(),
  sha256: text('sha256').notNull(),
  mimeType: text('mime_type').notNull(),
  bytes: integer('bytes').notNull(),
  width: integer('width').notNull(),
  height: integer('height').notNull(),
  colorSpace: text('color_space').default('srgb').notNull(),
  originalPath: text('original_path').notNull(),
  thumbnailPath: text('thumbnail_path').notNull(),
  previewPath: text('preview_path').notNull(),
  printPath: text('print_path').notNull(),
  tags: text('tags').array().default([]).notNull(),
  characterId: uuid('character_id').references(() => characters.id, { onDelete: 'set null' }),
  locationId: uuid('location_id').references(() => locations.id, { onDelete: 'set null' }),
  sceneId: uuid('scene_id').references(() => scenes.id, { onDelete: 'set null' }),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// 20. Comic Pages (Comic-Seiten, gehören zu einem vorhandenen Kapitel)
export const comicPages = pgTable('comic_pages', {
  id: uuid('id').primaryKey().defaultRandom(),
  ownerId: uuid('owner_id').notNull(),
  chapterId: uuid('chapter_id').references(() => chapters.id, { onDelete: 'cascade' }).notNull(),
  pageNumber: integer('page_number').default(1).notNull(),
  format: text('format').default('A4').notNull(),
  formatId: uuid('format_id'),
  dpi: integer('dpi').default(300).notNull(),
  widthMm: real('width_mm').default(210).notNull(),
  heightMm: real('height_mm').default(297).notNull(),
  bleedMm: real('bleed_mm').default(3).notNull(),
  gutterMm: real('gutter_mm').default(4).notNull(),
  isSpread: boolean('is_spread').default(false).notNull(),
  spineSafetyMm: real('spine_safety_mm').default(10).notNull(),
  readingDirection: text('reading_direction').default('ltr').notNull(), // 'ltr' | 'rtl'
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// 21. Panels (Polygon als JSON, Rahmenstärke, z-Index, Alt-Text)
export const panels = pgTable('panels', {
  id: uuid('id').primaryKey().defaultRandom(),
  ownerId: uuid('owner_id').notNull(),
  pageId: uuid('page_id').references(() => comicPages.id, { onDelete: 'cascade' }).notNull(),
  polygon: text('polygon').notNull(), // JSON: Array<{ x: number; y: number }>
  borderWidth: real('border_width').default(2).notNull(),
  zIndex: integer('z_index').default(1).notNull(),
  altText: text('alt_text').default('').notNull(),
  readingOrder: integer('reading_order').default(1).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// 22. Panel Images (Asset, Transformation, Beschnitt)
export const panelImages = pgTable('panel_images', {
  id: uuid('id').primaryKey().defaultRandom(),
  ownerId: uuid('owner_id').notNull(),
  panelId: uuid('panel_id').references(() => panels.id, { onDelete: 'cascade' }).notNull(),
  assetId: uuid('asset_id').references(() => assets.id, { onDelete: 'cascade' }).notNull(),
  transform: text('transform').default('{"x":0,"y":0,"scale":1,"rotation":0}').notNull(),
  crop: text('crop').default('{"left":0,"top":0,"width":1,"height":1}').notNull(),
  opacity: real('opacity').default(1.0).notNull(),
  zIndex: integer('z_index').default(1).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// 23. Balloons (Sprechblasen: Sprechen, Denken, Schreien, Erzählkasten, Soundeffekt)
export const balloons = pgTable('balloons', {
  id: uuid('id').primaryKey().defaultRandom(),
  ownerId: uuid('owner_id').notNull(),
  pageId: uuid('page_id').references(() => comicPages.id, { onDelete: 'cascade' }).notNull(),
  panelId: uuid('panel_id').references(() => panels.id, { onDelete: 'set null' }),
  type: text('type').default('sprechen').notNull(), // 'sprechen' | 'denken' | 'schreien' | 'erzaehlkasten' | 'soundeffekt'
  text: text('text').notNull(),
  position: text('position').default('{"x":20,"y":20,"width":60,"height":30}').notNull(),
  tailPosition: text('tail_position').default('{"x":40,"y":60}').notNull(),
  readingOrder: integer('reading_order').default(1).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// 24. Export Fingerprints (pHash-Register je Export)
export const exportFingerprints = pgTable('export_fingerprints', {
  id: uuid('id').primaryKey().defaultRandom(),
  ownerId: uuid('owner_id').notNull(),
  assetId: uuid('asset_id').references(() => assets.id, { onDelete: 'set null' }),
  pageId: uuid('page_id').references(() => comicPages.id, { onDelete: 'set null' }),
  format: text('format').notNull(), // 'pdf' | 'cbz' | 'png'
  pHash: text('p_hash').notNull(),
  sha256: text('sha256').notNull(),
  watermarkPayload: text('watermark_payload').notNull(),
  metadataJson: text('metadata_json').default('{}').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// 25. Protection Jobs (KI-Schutzschicht / Scrambler Worker Queue)
export const protectionJobs = pgTable('protection_jobs', {
  id: uuid('id').primaryKey().defaultRandom(),
  ownerId: uuid('owner_id').notNull(),
  assetId: uuid('asset_id').references(() => assets.id, { onDelete: 'cascade' }).notNull(),
  strength: text('strength').default('mittel').notNull(), // 'leicht' | 'mittel' | 'stark'
  status: text('status').default('wartet').notNull(), // 'wartet' | 'läuft' | 'fertig' | 'fehler' | 'nicht_verfuegbar'
  workerUrl: text('worker_url'),
  outputPath: text('output_path'),
  ssim: real('ssim'),
  errorMessage: text('error_message'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// 26. Page Formats (Format-System & benutzerdefinierte Arbeitsflächen)
export const pageFormats = pgTable('page_formats', {
  id: uuid('id').primaryKey().defaultRandom(),
  ownerId: uuid('owner_id').notNull(),
  name: text('name').notNull(),
  category: text('category').default('custom').notNull(), // 'comic' | 'allgemein' | 'online' | 'pod' | 'custom'
  width: real('width').notNull(),
  height: real('height').notNull(),
  unit: text('unit').default('mm').notNull(), // 'mm' | 'in' | 'px'
  dpi: integer('dpi').default(300).notNull(),
  bleed: real('bleed').default(3).notNull(),
  safeMargin: real('safe_margin').default(5).notNull(),
  gutter: real('gutter').default(4).notNull(),
  orientation: text('orientation').default('portrait').notNull(), // 'portrait' | 'landscape' | 'square'
  isCustom: boolean('is_custom').default(true).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// 27. Page Elements (Frei platzierbare Grafiken auf der Seite, dürfen Panelränder & Anschnitt überschreiten)
export const pageElements = pgTable('page_elements', {
  id: uuid('id').primaryKey().defaultRandom(),
  ownerId: uuid('owner_id').notNull(),
  pageId: uuid('page_id').references(() => comicPages.id, { onDelete: 'cascade' }).notNull(),
  elementType: text('element_type').default('image').notNull(), // 'image' | 'text' | 'shape' | 'balloon' | 'soundeffekt'
  assetId: uuid('asset_id').references(() => assets.id, { onDelete: 'set null' }),
  text: text('text').default('').notNull(),
  x: real('x').default(10).notNull(),
  y: real('y').default(10).notNull(),
  width: real('width').default(50).notNull(),
  height: real('height').default(50).notNull(),
  rotation: real('rotation').default(0).notNull(),
  flipX: boolean('flip_x').default(false).notNull(),
  flipY: boolean('flip_y').default(false).notNull(),
  opacity: real('opacity').default(1.0).notNull(),
  zIndex: integer('z_index').default(10).notNull(),
  locked: boolean('locked').default(false).notNull(),
  visible: boolean('visible').default(true).notNull(),
  groupId: text('group_id'),
  maskJson: text('mask_json'),
  styleJson: text('style_json').default('{}').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// 28. Connector Accounts (AES-256-GCM verschlüsselte Zugangsdaten für Website, Blog, Shop, POD)
export const connectorAccounts = pgTable('connector_accounts', {
  id: uuid('id').primaryKey().defaultRandom(),
  ownerId: uuid('owner_id').notNull(),
  connectorId: text('connector_id').notNull(), // 'wordpress' | 'ghost' | 'shopify' | 'woocommerce' | 'printful' | 'printify' | 'webhook'
  kind: text('kind').notNull(), // 'website' | 'blog' | 'portfolio' | 'shop' | 'pod'
  accountLabel: text('account_label').default('').notNull(),
  encryptedCredentials: text('encrypted_credentials').notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// 29. Publications (Veröffentlichungen, Beiträge, Portfolio-Exporte)
export const publications = pgTable('publications', {
  id: uuid('id').primaryKey().defaultRandom(),
  ownerId: uuid('owner_id').notNull(),
  projectId: uuid('project_id').references(() => projects.id, { onDelete: 'cascade' }).notNull(),
  connectorId: text('connector_id').notNull(),
  kind: text('kind').notNull(), // 'website' | 'blog' | 'portfolio' | 'shop' | 'pod'
  sourceType: text('source_type').default('page').notNull(), // 'page' | 'panel' | 'asset' | 'portfolio' | 'merch' | 'shop'
  sourceId: text('source_id').notNull(),
  title: text('title').notNull(),
  bodyText: text('body_text').default('').notNull(),
  tags: text('tags').array().default([]).notNull(),
  assetIds: text('asset_ids').array().default([]).notNull(),
  status: text('status').default('entwurf').notNull(), // 'entwurf' | 'nicht_verbunden' | 'veroeffentlicht' | 'exportiert' | 'fehler'
  externalId: text('external_id'),
  payloadJson: text('payload_json').default('{}').notNull(),
  publishedAt: timestamp('published_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// 30. Merch Products (Merch & Print-on-Demand Produkte)
export const merchProducts = pgTable('merch_products', {
  id: uuid('id').primaryKey().defaultRandom(),
  ownerId: uuid('owner_id').notNull(),
  projectId: uuid('project_id').references(() => projects.id, { onDelete: 'cascade' }).notNull(),
  title: text('title').notNull(),
  description: text('description').default('').notNull(),
  productType: text('product_type').notNull(), // 'tshirt' | 'poster' | 'kunstdruck' | 'postkarte' | 'sticker' | 'tasse' | 'tasche' | 'notizbuch'
  sourceType: text('source_type').default('asset').notNull(), // 'asset' | 'page' | 'panel' | 'cutout_element'
  sourceId: text('source_id').notNull(),
  cutoutAssetId: uuid('cutout_asset_id').references(() => assets.id, { onDelete: 'set null' }),
  printFormatName: text('print_format_name').default('T-Shirt-Druckfläche').notNull(),
  placementJson: text('placement_json').default('{"x":0.5,"y":0.5,"scale":0.8,"rotation":0}').notNull(),
  colorVariants: text('color_variants').array().default(['schwarz', 'weiss']).notNull(),
  suggestedPriceCents: integer('suggested_price_cents').default(2490).notNull(),
  currency: text('currency').default('EUR').notNull(),
  printCheckJson: text('print_check_json').default('{}').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});



