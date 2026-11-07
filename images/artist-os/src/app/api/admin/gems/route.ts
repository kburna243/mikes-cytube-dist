import { NextResponse } from "next/server";
import { asc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { gems } from "@/db/schema";
import { isAdmin } from "@/lib/adminAuth";
import { ensureContent } from "@/lib/content";
import { removeUpload } from "@/lib/media";

export const runtime = "nodejs";

const deny = () => NextResponse.json({ ok: false, message: "Nicht angemeldet." }, { status: 401 });
const bad = (message: string) => NextResponse.json({ ok: false, message }, { status: 400 });
const str = (v: unknown, max: number) => String(v ?? "").trim().slice(0, max);
const SITE_PATH = /^\/(assets|api\/media)\/[\w./-]+$/;

/** Whitelisted, length-capped fields; img and video must be site paths (seed asset or upload). */
function fields(b: Record<string, unknown>) {
  const f = {
    title: str(b.title, 200), artist: str(b.artist, 200), label: str(b.label, 160), country: str(b.country, 60),
    img: str(b.img, 300), video: str(b.video, 300), badge: str(b.badge, 60), badgeEn: str(b.badgeEn, 60),
    story: str(b.story, 2000), storyEn: str(b.storyEn, 2000), own: !!b.own, published: b.published !== false,
  };
  if (!f.title) return "Titel fehlt.";
  if (!SITE_PATH.test(f.img)) return "Bild fehlt.";
  if (f.video && !SITE_PATH.test(f.video)) return "Ungültiges Video.";
  return f;
}

const list = () => db.select().from(gems).orderBy(asc(gems.position), asc(gems.id));

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
  // new gems go to the top: they become the gem of the week
  await db.transaction(async (tx) => {
    await tx.update(gems).set({ position: sql`${gems.position} + 1` });
    await tx.insert(gems).values({ ...f, position: 0 });
  });
  return NextResponse.json({ ok: true, rows: await list() });
}

export async function PUT(req: Request) {
  if (!(await isAdmin())) return deny();
  const b = (await req.json()) as Record<string, unknown>;
  const id = Number(b.id);
  if (!Number.isInteger(id)) return bad("ID fehlt.");
  if (b.move === -1 || b.move === 1) {
    // swap with the neighbour, then renumber 0..n
    const rows = await list();
    const i = rows.findIndex((r) => r.id === id);
    const j = i + b.move;
    if (i >= 0 && j >= 0 && j < rows.length) [rows[i], rows[j]] = [rows[j], rows[i]];
    await db.transaction(async (tx) => {
      for (const [pos, r] of rows.entries()) await tx.update(gems).set({ position: pos }).where(eq(gems.id, r.id));
    });
  } else {
    const f = fields(b);
    if (typeof f === "string") return bad(f);
    const [old] = await db.select().from(gems).where(eq(gems.id, id));
    if (!old) return bad("Gem nicht gefunden.");
    await db.update(gems).set(f).where(eq(gems.id, id));
    if (old.img !== f.img) await removeUpload(old.img);
    if (old.video && old.video !== f.video) await removeUpload(old.video);
  }
  return NextResponse.json({ ok: true, rows: await list() });
}

export async function DELETE(req: Request) {
  if (!(await isAdmin())) return deny();
  const id = Number(new URL(req.url).searchParams.get("id"));
  if (!Number.isInteger(id)) return bad("ID fehlt.");
  const [old] = await db.delete(gems).where(eq(gems.id, id)).returning();
  if (old) {
    await removeUpload(old.img);
    if (old.video) await removeUpload(old.video);
  }
  return NextResponse.json({ ok: true, rows: await list() });
}
