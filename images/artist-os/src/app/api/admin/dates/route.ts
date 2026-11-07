import { NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { tourDates } from "@/db/schema";
import { isAdmin } from "@/lib/adminAuth";
import { ensureContent } from "@/lib/content";

export const runtime = "nodejs";

const deny = () => NextResponse.json({ ok: false, message: "Nicht angemeldet." }, { status: 401 });
const bad = (message: string) => NextResponse.json({ ok: false, message }, { status: 400 });
const str = (v: unknown, max: number) => String(v ?? "").trim().slice(0, max);
const STATUS = ["TICKETS", "CONFIRMED", "SOLD OUT"];

function fields(b: Record<string, unknown>) {
  const f = {
    date: str(b.date, 10), city: str(b.city, 120), venue: str(b.venue, 160), country: str(b.country, 8).toUpperCase() || "DE",
    status: str(b.status, 16), note: str(b.note, 200), noteEn: str(b.noteEn, 200),
  };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(f.date)) return "Datum fehlt.";
  if (!f.city || !f.venue) return "Stadt und Location fehlen.";
  if (!STATUS.includes(f.status)) return "Ungültiger Status.";
  return f;
}

const list = () => db.select().from(tourDates).orderBy(desc(tourDates.date));

export async function GET() {
  if (!(await isAdmin())) return deny();
  await ensureContent();
  return NextResponse.json({ ok: true, rows: await list() });
}

export async function POST(req: Request) {
  if (!(await isAdmin())) return deny();
  await ensureContent();
  const f = fields(await req.json());
  if (typeof f === "string") return bad(f);
  await db.insert(tourDates).values(f);
  return NextResponse.json({ ok: true, rows: await list() });
}

export async function PUT(req: Request) {
  if (!(await isAdmin())) return deny();
  const b = (await req.json()) as Record<string, unknown>;
  const id = Number(b.id);
  if (!Number.isInteger(id)) return bad("ID fehlt.");
  const f = fields(b);
  if (typeof f === "string") return bad(f);
  await db.update(tourDates).set(f).where(eq(tourDates.id, id));
  return NextResponse.json({ ok: true, rows: await list() });
}

export async function DELETE(req: Request) {
  if (!(await isAdmin())) return deny();
  const id = Number(new URL(req.url).searchParams.get("id"));
  if (!Number.isInteger(id)) return bad("ID fehlt.");
  await db.delete(tourDates).where(eq(tourDates.id, id));
  return NextResponse.json({ ok: true, rows: await list() });
}
