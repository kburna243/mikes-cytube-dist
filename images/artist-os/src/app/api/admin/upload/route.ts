import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/adminAuth";
import { MAX_UPLOAD, processUpload } from "@/lib/media";

export const runtime = "nodejs";

export async function POST(req: Request) {
  if (!(await isAdmin())) return NextResponse.json({ ok: false, message: "Nicht angemeldet." }, { status: 401 });
  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof File) || !/^(image|video)\//.test(file.type)) return NextResponse.json({ ok: false, message: "Bitte ein Foto oder Video wählen." }, { status: 400 });
  if (file.size > MAX_UPLOAD) return NextResponse.json({ ok: false, message: "Datei ist größer als 200 MB." }, { status: 400 });
  try {
    const out = await processUpload(file, Number(form.get("start")) || 0, Number(form.get("length")) || 30);
    return NextResponse.json({ ok: true, ...out });
  } catch (err) {
    console.error("upload error", err);
    return NextResponse.json({ ok: false, message: "Datei konnte nicht verarbeitet werden. Anderes Format probieren (JPG, PNG, MP4)." }, { status: 500 });
  }
}
