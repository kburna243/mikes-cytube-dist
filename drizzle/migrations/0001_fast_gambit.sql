CREATE TABLE "idea_notes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"owner_id" uuid NOT NULL,
	"project_id" text NOT NULL,
	"chapter_id" text,
	"audio_path" text NOT NULL,
	"audio_mime" text DEFAULT 'audio/webm;codecs=opus' NOT NULL,
	"duration_sec" integer DEFAULT 0 NOT NULL,
	"transcript" text,
	"transcript_status" text DEFAULT 'wartet' NOT NULL,
	"title" text,
	"pinned" boolean DEFAULT false NOT NULL,
	"retry_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
