-- Answers from the /admin content questionnaire. The app also creates this table itself on first use.
CREATE TABLE IF NOT EXISTS "content_check" (
	"field_id" varchar(80) PRIMARY KEY NOT NULL,
	"status" varchar(8) NOT NULL,
	"value" text DEFAULT '' NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

-- Promo campaigns of the Content-Schleuder. Also created by the app on first use.
CREATE TABLE IF NOT EXISTS "campaigns" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"data" jsonb NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
