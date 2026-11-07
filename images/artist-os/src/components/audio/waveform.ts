"use client";

import { getAudioContext } from "./bus";

const cache = new Map<string, Promise<Float32Array>>();

/** Decode a track and reduce it to normalized peak buckets for the scrubber. */
export function getPeaks(url: string, buckets = 420): Promise<Float32Array> {
  let p = cache.get(url);
  if (!p) {
    p = compute(url, buckets).catch(() => Promise.resolve(synthetic(url, buckets)));
    cache.set(url, p);
  }
  return p;
}

async function compute(url: string, buckets: number): Promise<Float32Array> {
  const res = await fetch(url);
  if (!res.ok) throw new Error("fetch failed");
  const raw = await res.arrayBuffer();
  const actx = getAudioContext();
  const audio = await actx.decodeAudioData(raw.slice(0));
  const ch = audio.getChannelData(0);
  const block = Math.max(1, Math.floor(ch.length / buckets));
  const peaks = new Float32Array(buckets);
  for (let i = 0; i < buckets; i++) {
    let max = 0;
    const start = i * block;
    for (let j = 0; j < block; j += 16) {
      const v = Math.abs(ch[start + j] ?? 0);
      if (v > max) max = v;
    }
    peaks[i] = max;
  }
  // normalize
  let top = 0;
  for (const v of peaks) if (v > top) top = v;
  if (top > 0) for (let i = 0; i < buckets; i++) peaks[i] = Math.min(1, (peaks[i] / top) * 1.15);
  return peaks;
}

/** Deterministic stand-in drawn while the real waveform decodes. */
function synthetic(url: string, buckets: number): Float32Array {
  let seed = 7;
  for (const c of url) seed = (seed * 31 + c.charCodeAt(0)) >>> 0;
  const rnd = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  const peaks = new Float32Array(buckets);
  let v = 0.5;
  for (let i = 0; i < buckets; i++) {
    v = Math.min(1, Math.max(0.12, v + (rnd() - 0.5) * 0.34));
    peaks[i] = v;
  }
  return peaks;
}

export function formatTime(sec: number): string {
  if (!Number.isFinite(sec) || sec < 0) sec = 0;
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}
