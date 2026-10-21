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

