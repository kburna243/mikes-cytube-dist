import { asc, desc } from "drizzle-orm";
import { db, pool } from "@/db";
import { gems, tourDates } from "@/db/schema";
import { FALLBACK_GIGS, GEMS, type Gem, type Gig } from "@/lib/data";

/**
 * Admin-maintained content (gems, tour dates). On first use per process the schema is created
 * idempotently and empty tables are seeded from data.ts, so servers need no manual migration.
 * Every reader falls back to the static lists when the DB is unreachable.
 */
const SCHEMA = `
CREATE TABLE IF NOT EXISTS tour_dates (
  id serial PRIMARY KEY, date varchar(10) NOT NULL, city varchar(120) NOT NULL, venue varchar(160) NOT NULL,
  country varchar(8) NOT NULL DEFAULT 'DE', status varchar(16) NOT NULL DEFAULT 'TICKETS',
  note varchar(200) NOT NULL DEFAULT '', created_at timestamptz NOT NULL DEFAULT now());
ALTER TABLE tour_dates ADD COLUMN IF NOT EXISTS note_en varchar(200) NOT NULL DEFAULT '';
CREATE TABLE IF NOT EXISTS gems (
  id serial PRIMARY KEY, position integer NOT NULL DEFAULT 0, title varchar(200) NOT NULL,
  artist varchar(200) NOT NULL DEFAULT '', label varchar(160) NOT NULL DEFAULT '', country varchar(60) NOT NULL DEFAULT '',
  img varchar(300) NOT NULL, video varchar(300) NOT NULL DEFAULT '', badge varchar(60) NOT NULL DEFAULT '',
  badge_en varchar(60) NOT NULL DEFAULT '', story text NOT NULL DEFAULT '', story_en text NOT NULL DEFAULT '',
  own boolean NOT NULL DEFAULT false, published boolean NOT NULL DEFAULT true, created_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE IF NOT EXISTS campaigns (
  id varchar(64) PRIMARY KEY, data jsonb NOT NULL, updated_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE IF NOT EXISTS content_check (
  field_id varchar(80) PRIMARY KEY, status varchar(8) NOT NULL, value text NOT NULL DEFAULT '',
  updated_at timestamptz NOT NULL DEFAULT now());
`;

let ready: Promise<void> | null = null;

export function ensureContent(): Promise<void> {
  ready ??= (async () => {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      await client.query("SELECT pg_advisory_xact_lock(7401)"); // several workers may boot at once
      await client.query(SCHEMA);
      const g = await client.query("SELECT 1 FROM gems LIMIT 1");
      if (g.rowCount === 0) {
        for (const [i, x] of GEMS.entries()) {
          await client.query(
            "INSERT INTO gems (position,title,artist,label,country,img,video,badge,badge_en,story,story_en,own) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)",
            [i, x.title, x.artist ?? "", x.label, x.country ?? "", x.img, x.video ?? "", x.badge, x.badgeEn, x.story, x.storyEn, !!x.own],
          );
        }
      }
      const t = await client.query("SELECT 1 FROM tour_dates LIMIT 1");
      if (t.rowCount === 0) {
        for (const x of FALLBACK_GIGS) {
          await client.query(
            "INSERT INTO tour_dates (date,city,venue,country,status,note,note_en) VALUES ($1,$2,$3,$4,$5,$6,$7)",
            [x.date, x.city, x.venue, x.country, x.status, x.note, x.noteEn ?? ""],
          );
        }
      }
      await client.query("COMMIT");
    } catch (err) {
      await client.query("ROLLBACK").catch(() => {});
      ready = null; // retry on the next request
      throw err;
    } finally {
      client.release();
    }
  })();
  return ready;
}

type GemRow = typeof gems.$inferSelect;

export const rowToGem = (r: GemRow): Gem => ({
  id: String(r.id),
  title: r.title,
  artist: r.artist || undefined,
  label: r.label,
  country: r.country || undefined,
  img: r.img,
  video: r.video || undefined,
  badge: r.badge,
  badgeEn: r.badgeEn,
  story: r.story,
  storyEn: r.storyEn,
  own: r.own,
});

export async function getGems(): Promise<Gem[]> {
  try {
    await ensureContent();
    const rows = await db.select().from(gems).orderBy(asc(gems.position), asc(gems.id));
    return rows.filter((r) => r.published).map(rowToGem);
  } catch {
    return GEMS;
  }
}

export async function getGigs(): Promise<Gig[]> {
  try {
    await ensureContent();
    const rows = await db.select().from(tourDates).orderBy(desc(tourDates.date));
    return rows.map((r) => ({
      id: r.id,
      date: r.date,
      city: r.city,
      venue: r.venue,
      country: r.country,
      status: r.status as Gig["status"],
      note: r.note,
      noteEn: r.noteEn || undefined,
    }));
  } catch {
    return FALLBACK_GIGS;
  }
}
