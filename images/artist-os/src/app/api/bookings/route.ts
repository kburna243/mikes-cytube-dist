import { NextResponse } from "next/server";
import { db } from "@/db";
import { bookingRequests } from "@/db/schema";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const b = (await req.json()) as Record<string, string>;
    const promoter = (b.promoter ?? "").trim();
    const email = (b.email ?? "").trim().toLowerCase();
    const eventDate = (b.eventDate ?? "").trim();
    const city = (b.city ?? "").trim();
    const eventType = (b.eventType ?? "Club Night").slice(0, 64);
    const budget = (b.budget ?? "").slice(0, 64);
    const sound = (b.sound ?? "").slice(0, 120);
    const message = (b.message ?? "").slice(0, 4000);

    if (promoter.length < 2) return NextResponse.json({ ok: false, message: "Veranstalter fehlt." }, { status: 400 });
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return NextResponse.json({ ok: false, message: "Ungültige E-Mail." }, { status: 400 });
    if (!eventDate) return NextResponse.json({ ok: false, message: "Datum fehlt." }, { status: 400 });
    if (city.length < 2) return NextResponse.json({ ok: false, message: "Stadt fehlt." }, { status: 400 });

    const [row] = await db
      .insert(bookingRequests)
      .values({ promoter, email, eventDate, city, eventType, budget, sound, message })
      .returning({ id: bookingRequests.id });

    return NextResponse.json({ ok: true, ref: `BK-${String(row.id).padStart(5, "0")}` });
  } catch (err) {
    console.error("booking error", err);
    return NextResponse.json({ ok: false, message: "Speichern fehlgeschlagen, schreib uns direkt per Mail." }, { status: 500 });
  }
}
