import { NextResponse } from "next/server";
import { adminEnabled, checkPassword, endSession, startSession } from "@/lib/adminAuth";

export const runtime = "nodejs";

export async function POST(req: Request) {
  if (!adminEnabled()) return NextResponse.json({ ok: false, message: "Admin ist nicht eingerichtet (ADMIN_PASSWORD fehlt)." }, { status: 503 });
  const { password } = (await req.json().catch(() => ({}))) as { password?: string };
  if (!checkPassword(String(password ?? ""))) {
    await new Promise((r) => setTimeout(r, 1500)); // slows down guessing
    return NextResponse.json({ ok: false, message: "Falsches Passwort." }, { status: 401 });
  }
  await startSession();
  return NextResponse.json({ ok: true });
}

export async function DELETE() {
  await endSession();
  return NextResponse.json({ ok: true });
}
