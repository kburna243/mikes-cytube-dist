CREATE TABLE "booking_requests" (
	"id" serial PRIMARY KEY NOT NULL,
	"promoter" varchar(200) NOT NULL,
	"email" varchar(320) NOT NULL,
	"event_date" varchar(32) NOT NULL,
	"city" varchar(160) NOT NULL,
	"event_type" varchar(64) NOT NULL,
	"budget" varchar(64) NOT NULL,
	"sound" varchar(120) DEFAULT 'club' NOT NULL,
	"message" text DEFAULT '' NOT NULL,
	"status" varchar(24) DEFAULT 'NEW' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "newsletter_subscribers" (
	"id" serial PRIMARY KEY NOT NULL,
	"email" varchar(320) NOT NULL,
	"source" varchar(64) DEFAULT 'crate-club' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "newsletter_subscribers_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "orders" (
	"id" serial PRIMARY KEY NOT NULL,
	"order_no" varchar(24) NOT NULL,
	"email" varchar(320) NOT NULL,
	"items" jsonb NOT NULL,
	"subtotal" numeric(10, 2) NOT NULL,
	"discount" numeric(10, 2) DEFAULT '0' NOT NULL,
	"total" numeric(10, 2) NOT NULL,
	"coupon" varchar(32),
	"paid" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "orders_order_no_unique" UNIQUE("order_no")
);
--> statement-breakpoint
CREATE TABLE "tour_dates" (
	"id" serial PRIMARY KEY NOT NULL,
	"date" varchar(10) NOT NULL,
	"city" varchar(120) NOT NULL,
	"venue" varchar(160) NOT NULL,
	"country" varchar(8) DEFAULT 'DE' NOT NULL,
	"status" varchar(16) DEFAULT 'TICKETS' NOT NULL,
	"note" varchar(200) DEFAULT '' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
