import { NextResponse } from "next/server";
import { sql } from "drizzle-orm";
import { db } from "@/db";
import { contentCheck } from "@/db/schema";
import { isAdmin } from "@/lib/adminAuth";
import { ensureContent } from "@/lib/content";
import { FIELD_IDS, toMarkdown, type CheckAnswer } from "@/lib/contentCheck";

export const runtime = "nodejs";

const deny = () => NextResponse.json({ ok: false, message: "Nicht angemeldet." }, { status: 401 });
const STATUS = ["ok", "new", "later"];

async function answers(): Promise<Record<string, CheckAnswer>> {
  const rows = await db.select().from(contentCheck);
  return Object.fromEntries(rows.map((r) => [r.fieldId, { status: r.status as CheckAnswer["status"], value: r.value }]));
}

/** GET: all answers. GET ?format=md: summary as Markdown for applying the changes. */
export async function GET(req: Request) {
  if (!(await isAdmin())) return deny();
  await ensureContent();
  const all = await answers();
  if (new URL(req.url).searchParams.get("format") === "md") {
    return new NextResponse(toMarkdown(all), { headers: { "Content-Type": "text/markdown; charset=utf-8" } });
  }
  return NextResponse.json({ ok: true, answers: all });
}

/** PUT { id, status, value }: save one field and return all answers. */
export async function PUT(req: Request) {
  if (!(await isAdmin())) return deny();
  const b = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const id = String(b.id ?? "");
  const status = String(b.status ?? "");
  const value = String(b.value ?? "").slice(0, 4000);
  if (!FIELD_IDS.has(id) || !STATUS.includes(status)) return NextResponse.json({ ok: false, message: "Unbekanntes Feld." }, { status: 400 });
  await ensureContent();
  await db
    .insert(contentCheck)
    .values({ fieldId: id, status, value })
    .onConflictDoUpdate({ target: contentCheck.fieldId, set: { status, value, updatedAt: sql`now()` } });
  return NextResponse.json({ ok: true, answers: await answers() });
}
