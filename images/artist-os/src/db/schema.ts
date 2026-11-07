import { pgTable, serial, text, varchar, timestamp, integer, numeric, jsonb, boolean } from "drizzle-orm/pg-core";

export const newsletterSubscribers = pgTable("newsletter_subscribers", {
  id: serial("id").primaryKey(),
  email: varchar("email", { length: 320 }).notNull().unique(),
  source: varchar("source", { length: 64 }).notNull().default("crate-club"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const bookingRequests = pgTable("booking_requests", {
  id: serial("id").primaryKey(),
  promoter: varchar("promoter", { length: 200 }).notNull(),
  email: varchar("email", { length: 320 }).notNull(),
  eventDate: varchar("event_date", { length: 32 }).notNull(),
  city: varchar("city", { length: 160 }).notNull(),
  eventType: varchar("event_type", { length: 64 }).notNull(),
  budget: varchar("budget", { length: 64 }).notNull(),
  sound: varchar("sound", { length: 120 }).notNull().default("club"),
  message: text("message").notNull().default(""),
  status: varchar("status", { length: 24 }).notNull().default("NEW"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  orderNo: varchar("order_no", { length: 24 }).notNull().unique(),
  email: varchar("email", { length: 320 }).notNull(),
  items: jsonb("items").notNull(),
  subtotal: numeric("subtotal", { precision: 10, scale: 2 }).notNull(),
  discount: numeric("discount", { precision: 10, scale: 2 }).notNull().default("0"),
  total: numeric("total", { precision: 10, scale: 2 }).notNull(),
  coupon: varchar("coupon", { length: 32 }),
  paid: boolean("paid").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const tourDates = pgTable("tour_dates", {
  id: serial("id").primaryKey(),
  date: varchar("date", { length: 10 }).notNull(),
  city: varchar("city", { length: 120 }).notNull(),
  venue: varchar("venue", { length: 160 }).notNull(),
  country: varchar("country", { length: 8 }).notNull().default("DE"),
  status: varchar("status", { length: 16 }).notNull().default("TICKETS"),
  note: varchar("note", { length: 200 }).notNull().default(""),
  noteEn: varchar("note_en", { length: 200 }).notNull().default(""),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

/** Diggin' Gems, maintained in /admin. Lowest position = gem of the week. Paths are stored without basePath. */
export const gems = pgTable("gems", {
  id: serial("id").primaryKey(),
  position: integer("position").notNull().default(0),
  title: varchar("title", { length: 200 }).notNull(),
  artist: varchar("artist", { length: 200 }).notNull().default(""),
  label: varchar("label", { length: 160 }).notNull().default(""),
  country: varchar("country", { length: 60 }).notNull().default(""),
  img: varchar("img", { length: 300 }).notNull(),
  video: varchar("video", { length: 300 }).notNull().default(""),
  badge: varchar("badge", { length: 60 }).notNull().default(""),
  badgeEn: varchar("badge_en", { length: 60 }).notNull().default(""),
  story: text("story").notNull().default(""),
  storyEn: text("story_en").notNull().default(""),
  own: boolean("own").notNull().default(false),
  published: boolean("published").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

/** Answers from the /admin content questionnaire (see lib/contentCheck.ts), one row per field. */
export const contentCheck = pgTable("content_check", {
  fieldId: varchar("field_id", { length: 80 }).primaryKey(),
  status: varchar("status", { length: 8 }).notNull(),
  value: text("value").notNull().default(""),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

/** Promo campaigns of the Content-Schleuder (/admin/schleuder). The whole campaign lives in `data`. */
export const campaigns = pgTable("campaigns", {
  id: varchar("id", { length: 64 }).primaryKey(),
  data: jsonb("data").notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});
