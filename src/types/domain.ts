/**
 * Domain Types for Projekt »Federführer«
 * Specification Version: 0.1
 */

export type EntityType = 'character' | 'location' | 'faction' | 'item';

export type FactCertainty = 'canonical' | 'uncertain' | 'rumor';

export interface Fact {
  id: string;
  entity_id: string;
  statement: string;
  source: string;
  certainty: FactCertainty;
  valid_from_chapter_id?: string;
  valid_until_chapter_id?: string;
  deleted_at?: number;
  created_at: number;
}

export interface Entity {
  id: string;
  type: EntityType;
  name: string;
  aliases: string[];
  threads: string[];
  path: string;
  markdown_body: string;
  description?: string;
  notes?: string;
  deleted_at?: number;
  updated_at: number;
  revision: number;
}

export interface Chapter {
  id: string;
  work_id: string;
  order: number;
  title: string;
  summary: string;
  body: string; // Markdown text
  status: 'draft' | 'in_review' | 'canonical';
  revision: number;
  deleted_at?: number;
  updated_at: number;
}

export interface Relation {
  id: string;
  source_id: string;
  target_id: string;
  type: 'ist_geschwister_von' | 'hasst' | 'liebt' | 'verbuendet_mit' | 'aufhaelt_sich_in' | 'besitzt' | 'gehoert_zu' | 'sucht';
  label: string;
  notes?: string;
}

export interface PlotBeat {
  id: string;
  thread_id: string;
  chapter_id?: string;
  order: number;
  title: string;
  description: string;
  status: 'planned' | 'drafted' | 'completed';
}

export interface PlotThread {
  id: string;
  work_id: string;
  title: string;
  description: string;
  color: string;
  pattern: 'solid' | 'dashed' | 'dotted' | 'striped'; // A5: color + pattern for accessibility
  beats: PlotBeat[];
}

export interface TimelineEvent {
  id: string;
  work_id: string;
  title: string;
  in_universe_date: string;
  chapter_id?: string;
  entity_ids: string[];
  thread_ids: string[];
  description: string;
  order: number;
}

export interface ResearchSource {
  id: string;
  title: string;
  type: 'note' | 'article' | 'book_excerpt' | 'web_quote' | 'interview';
  content: string;
  tags: string[];
  citation?: string;
  deleted_at?: number;
  created_at: number;
}

export type ProposalStatus = 'pending' | 'accepted' | 'rejected';

export interface Proposal {
  id: string;
  target_type: 'entity_fact' | 'chapter_body' | 'plot_beat' | 'timeline_event';
  target_id: string;
  op: 'append_fact' | 'update_fact' | 'append_beat' | 'insert_text' | 'create_entity';
  payload: any;
  rationale: string;
  status: ProposalStatus;
  created_at: number;
}

export interface ContinuityConflict {
  id: string;
  chapter_id: string;
  chapter_title: string;
  entity_id: string;
  entity_name: string;
  quote_in_chapter: string;
  canonical_fact: string;
  severity: 'critical' | 'warning' | 'notice';
  suggestion: string;
}

export interface LastPosition {
  chapterId: string;
  chapterTitle: string;
  paragraphIndex: number;
  scrollPosition: number;
  updatedAt: number;
}

export interface ChapterSnapshot {
  id: string;
  chapterId: string;
  label: string;
  content: string;
  wordCount: number;
  createdAt: number;
}

export interface DrawerItem {
  id: string;
  type: 'chapter' | 'character' | 'location' | 'fact' | 'research' | 'idea_note';
  title: string;
  preview: string;
  deletedAt: number;
}

export type TranscriptStatus = 'wartet' | 'läuft' | 'fertig' | 'fehler';

export interface IdeaNote {
  id: string;
  owner_id?: string;
  project_id: string;
  chapter_id?: string | null;
  audio_path: string;
  audio_mime: string;
  duration_sec: number;
  transcript?: string | null;
  transcript_status: TranscriptStatus;
  title?: string | null;
  pinned: boolean;
  retry_count?: number;
  created_at: number;
  updated_at: number;
  deleted_at?: number | null;
}

export interface AccessibilitySettings {
  fontSizePx: number; // 18 - 36px (Default 20px)
  theme: 'dark-high' | 'yellow-black' | 'paper' | 'light-high';
  lineHeight: number; // 1.5 - 2.0 (Default 1.7)
  readingSpeed: number; // 0.7 - 1.5 (Default 1.0)
  autoReadResponses: boolean;
  reducedMotion: boolean;
  simplifiedView: boolean; // Kognitive Entlastung
  bigButtons: boolean;
  displayName?: string; // Marion / konfigurierbar
  dailyWordGoal?: number; // Standard 200
  dictationPrivacyAccepted?: boolean;
  ideaPrivacyAccepted?: boolean;
  lastPosition?: LastPosition | null;
  expertMode?: boolean; // Standard: false
}

export interface Work {
  id: string;
  title: string;
  author: string;
  synopsis: string;
  genre: string;
  created_at: number;
  updated_at: number;
}

export interface DatabaseState {
  work: Work;
  chapters: Chapter[];
  entities: Entity[];
  facts: Fact[];
  relations: Relation[];
  threads: PlotThread[];
  timeline: TimelineEvent[];
  research: ResearchSource[];
  proposals: Proposal[];
  accessibility: AccessibilitySettings;
  ideaNotes?: IdeaNote[];
}

