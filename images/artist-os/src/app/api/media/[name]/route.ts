import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import path from "node:path";
import { Readable } from "node:stream";
import { MEDIA_NAME, UPLOAD_DIR } from "@/lib/media";

export const runtime = "nodejs";

/** Serves admin uploads from UPLOAD_DIR, with Range support so videos seek (and play on Safari). */
export async function GET(req: Request, { params }: { params: Promise<{ name: string }> }) {
  const { name } = await params;
  if (!MEDIA_NAME.test(name)) return new Response("Not found", { status: 404 });
  const file = path.join(UPLOAD_DIR, name);
  const size = await stat(file).then((s) => s.size, () => -1);
  if (size < 0) return new Response("Not found", { status: 404 });

  const headers: Record<string, string> = {
    "Content-Type": name.endsWith(".mp4") ? "video/mp4" : "image/webp",
    "Accept-Ranges": "bytes",
    "Cache-Control": "public, max-age=31536000, immutable", // names are random UUIDs, never reused
  };
  const stream = (opts?: { start: number; end: number }) => Readable.toWeb(createReadStream(file, opts)) as ReadableStream;

  const m = /^bytes=(\d*)-(\d*)$/.exec(req.headers.get("range") ?? "");
  if (m && (m[1] || m[2])) {
    const start = m[1] ? Number(m[1]) : Math.max(0, size - Number(m[2]));
    const end = m[1] && m[2] ? Math.min(Number(m[2]), size - 1) : size - 1;
    if (start > end) return new Response(null, { status: 416, headers: { "Content-Range": `bytes */${size}` } });
    return new Response(stream({ start, end }), {
      status: 206,
      headers: { ...headers, "Content-Range": `bytes ${start}-${end}/${size}`, "Content-Length": String(end - start + 1) },
    });
  }
  return new Response(stream(), { headers: { ...headers, "Content-Length": String(size) } });
}
