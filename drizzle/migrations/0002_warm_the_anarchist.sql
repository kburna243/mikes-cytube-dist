ALTER TABLE "users" ADD COLUMN "username" text NOT NULL;
ALTER TABLE "users" ADD COLUMN "password_hash" text NOT NULL;
ALTER TABLE "users" ADD COLUMN "failed_logins" integer DEFAULT 0 NOT NULL;
ALTER TABLE "users" ADD COLUMN "locked_until" timestamp with time zone;
ALTER TABLE "users" ADD CONSTRAINT "users_username_unique" UNIQUE("username");

CREATE TABLE "sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"token_hash" text NOT NULL,
	"user_agent" text,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breaker
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_token_hash_unique" UNIQUE("token_hash");
--> statement-breaker
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
