import { execFile } from "node:child_process";
import { randomUUID } from "node:crypto";
import { mkdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { promisify } from "node:util";

/**
 * Admin uploads. Everything goes through ffmpeg, so a raw WhatsApp photo or video works:
 * images become a 1000 px WebP, videos a trimmed 720p MP4 plus a WebP poster frame.
 * Files live outside the build (UPLOAD_DIR, a Docker volume) and are served by /api/media/[name].
 */
const run = promisify(execFile);
const FFMPEG = process.env.FFMPEG_PATH || "ffmpeg";

export const UPLOAD_DIR = path.resolve(process.env.UPLOAD_DIR || "./data/uploads");
export const MEDIA_NAME = /^[0-9a-f-]{36}\.(webp|mp4)$/;
export const MAX_UPLOAD = 200 * 1024 * 1024;

const ff = (args: string[]) => run(FFMPEG, ["-v", "error", "-y", ...args], { timeout: 5 * 60_000 });
const url = (name: string) => `/api/media/${name}`;

export async function processUpload(file: File, start = 0, length = 30): Promise<{ img: string; video?: string }> {
  await mkdir(UPLOAD_DIR, { recursive: true });
  const tmp = path.join(tmpdir(), `noizy-${randomUUID()}`);
  await writeFile(tmp, Buffer.from(await file.arrayBuffer()));
  try {
    const id = randomUUID();
    if (file.type.startsWith("video/")) {
      const video = `${id}.mp4`;
      const poster = `${randomUUID()}.webp`;
      await ff([
        "-ss", String(Math.max(0, start)), "-t", String(Math.min(Math.max(length, 5), 120)), "-i", tmp,
        "-vf", "scale='min(720,iw)':-2", "-c:v", "libx264", "-crf", "28", "-preset", "veryfast", "-pix_fmt", "yuv420p",
        "-c:a", "aac", "-b:a", "96k", "-movflags", "+faststart", path.join(UPLOAD_DIR, video),
      ]);
      await ff(["-ss", "1", "-i", path.join(UPLOAD_DIR, video), "-frames:v", "1", "-c:v", "libwebp", "-quality", "78", path.join(UPLOAD_DIR, poster)]);
      return { img: url(poster), video: url(video) };
    }
    const img = `${id}.webp`;
    await ff(["-i", tmp, "-vf", "scale='min(1000,iw)':-2", "-frames:v", "1", "-c:v", "libwebp", "-quality", "80", path.join(UPLOAD_DIR, img)]);
    return { img: url(img) };
  } finally {
    await rm(tmp, { force: true });
  }
}

/** Removes a file this admin uploaded; seed assets under /assets are never touched. */
export async function removeUpload(p: string) {
  const name = p.startsWith("/api/media/") ? p.slice("/api/media/".length) : "";
  if (MEDIA_NAME.test(name)) await rm(path.join(UPLOAD_DIR, name), { force: true });
}
