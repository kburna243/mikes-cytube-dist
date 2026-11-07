"use client";

/** One shared AudioContext for player, turntable and MPC engines. */
let ctx: AudioContext | null = null;

export function getAudioContext(): AudioContext {
  if (!ctx) {
    const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    ctx = new AC({ latencyHint: "interactive" });
  }
  return ctx;
}

export async function ensureAudio(): Promise<AudioContext> {
  const c = getAudioContext();
  if (c.state === "suspended") {
    try { await c.resume(); } catch { /* user gesture required */ }
  }
  return c;
}

export const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);
