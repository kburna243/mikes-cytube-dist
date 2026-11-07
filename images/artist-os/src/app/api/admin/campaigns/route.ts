import { NextResponse } from "next/server";
import { desc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { campaigns } from "@/db/schema";
import { isAdmin } from "@/lib/adminAuth";
import { ensureContent } from "@/lib/content";

export const runtime = "nodejs";

const deny = () => NextResponse.json({ ok: false, message: "Nicht angemeldet." }, { status: 401 });
const bad = (message: string) => NextResponse.json({ ok: false, message }, { status: 400 });
const ID = /^[\w-]{1,64}$/;
const MAX_BYTES = 1_000_000; // a campaign is a few dozen posts of text; uploads are stored as paths, not data

/** GET: all campaigns, newest change first. */
export async function GET() {
  if (!(await isAdmin())) return deny();
  await ensureContent();
  const rows = await db.select().from(campaigns).orderBy(desc(campaigns.updatedAt));
  return NextResponse.json({ ok: true, rows: rows.map((r) => r.data) });
}

/** PUT: save one campaign (the whole object, as the Schleuder holds it). */
export async function PUT(req: Request) {
  if (!(await isAdmin())) return deny();
  const raw = await req.text();
  if (raw.length > MAX_BYTES) return bad("Kampagne ist zu groß.");
  let c: { id?: unknown; title?: unknown; slots?: unknown };
  try {
    c = JSON.parse(raw);
  } catch {
    return bad("Ungültige Daten.");
  }
  if (typeof c.id !== "string" || !ID.test(c.id) || typeof c.title !== "string" || !Array.isArray(c.slots)) return bad("Ungültige Kampagne.");
  await ensureContent();
  await db
    .insert(campaigns)
    .values({ id: c.id, data: c })
    .onConflictDoUpdate({ target: campaigns.id, set: { data: c, updatedAt: sql`now()` } });
  return NextResponse.json({ ok: true, row: c });
}

/** DELETE ?id=…: remove one campaign. */
export async function DELETE(req: Request) {
  if (!(await isAdmin())) return deny();
  const id = new URL(req.url).searchParams.get("id") ?? "";
  if (!ID.test(id)) return bad("Ungültige Kampagne.");
  await ensureContent();
  await db.delete(campaigns).where(eq(campaigns.id, id));
  return NextResponse.json({ ok: true });
}
