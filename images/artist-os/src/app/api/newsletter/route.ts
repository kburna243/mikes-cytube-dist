import { NextResponse } from "next/server";
import { db } from "@/db";
import { newsletterSubscribers } from "@/db/schema";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { email?: string };
    const email = (body.email ?? "").trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
      return NextResponse.json({ ok: false, message: "Ungültige E-Mail-Adresse." }, { status: 400 });
    }
    await db.insert(newsletterSubscribers).values({ email, source: "crate-club" }).onConflictDoNothing();
    return NextResponse.json({ ok: true, message: "Willkommen im VIP Crate Club" });
  } catch (err) {
    console.error("newsletter error", err);
    return NextResponse.json({ ok: false, message: "Datenbank momentan nicht erreichbar, versuch es gleich nochmal." }, { status: 500 });
  }
}
