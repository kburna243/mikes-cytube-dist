-- Admin content (04.11.2026). The app also runs this idempotently on first use (src/lib/content.ts),
-- so existing servers need no manual migration.
ALTER TABLE "tour_dates" ADD COLUMN IF NOT EXISTS "note_en" varchar(200) DEFAULT '' NOT NULL;
CREATE TABLE IF NOT EXISTS "gems" (
	"id" serial PRIMARY KEY NOT NULL,
	"position" integer DEFAULT 0 NOT NULL,
	"title" varchar(200) NOT NULL,
	"artist" varchar(200) DEFAULT '' NOT NULL,
	"label" varchar(160) DEFAULT '' NOT NULL,
	"country" varchar(60) DEFAULT '' NOT NULL,
	"img" varchar(300) NOT NULL,
	"video" varchar(300) DEFAULT '' NOT NULL,
	"badge" varchar(60) DEFAULT '' NOT NULL,
	"badge_en" varchar(60) DEFAULT '' NOT NULL,
	"story" text DEFAULT '' NOT NULL,
	"story_en" text DEFAULT '' NOT NULL,
	"own" boolean DEFAULT false NOT NULL,
	"published" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
