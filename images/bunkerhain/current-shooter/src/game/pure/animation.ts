/**
 * Reine Animationsfunktionen für zeitbasierte Sprite-Frame-Berechnung.
 * Garantiert:
 * - Zeitbasierte Fortschreitung unabhängig von Render-Framerate.
 * - Pausieren (dt = 0) friert die Animation exakt ein.
 * - Loop- und Non-Loop-Verhalten (z. B. Hit-Pose hält beim letzten Frame an).
 */

export interface ClipDef {
  frames: number[];
  fps?: number;
  durationMs?: number;
  loop?: boolean;
}

/**
 * Berechnet den Frame-Index innerhalb des Clips anhand der abgelaufenen Zeit (in Sekunden).
 */
export function getFrameIndexFromTime(
  elapsedSec: number,
  clip: ClipDef,
): number {
  if (!clip.frames || clip.frames.length === 0) return 0;
  if (clip.frames.length === 1) return clip.frames[0];

  const totalFrames = clip.frames.length;
  let frameDuration = 0.16; // Default ~6 fps

  if (clip.durationMs && clip.durationMs > 0) {
    frameDuration = (clip.durationMs / 1000) / totalFrames;
  } else if (clip.fps && clip.fps > 0) {
    frameDuration = 1 / clip.fps;
  }

  const loop = clip.loop !== false; // Default true wenn nicht anders angegeben

  if (frameDuration <= 0) return clip.frames[0];

  if (loop) {
    const totalDuration = frameDuration * totalFrames;
    const modTime = ((elapsedSec % totalDuration) + totalDuration) % totalDuration;
    const step = Math.floor(modTime / frameDuration);
    return clip.frames[Math.min(step, totalFrames - 1)];
  } else {
    const step = Math.floor(elapsedSec / frameDuration);
    if (step >= totalFrames) {
      return clip.frames[totalFrames - 1]; // am letzten Frame halten
    }
    return clip.frames[Math.max(0, step)];
  }
}

/**
 * Pingpong-Frame-Berechnung (z. B. für idle <-> warning bei Zivilisten).
 */
export function getPingPongFrame(
  elapsedSec: number,
  frames: number[],
  fps = 4,
): number {
  if (frames.length <= 1) return frames[0] ?? 0;
  const cycleLen = (frames.length - 1) * 2;
  const totalDuration = cycleLen / fps;
  const modTime = ((elapsedSec % totalDuration) + totalDuration) % totalDuration;
  const step = Math.floor((modTime / totalDuration) * cycleLen);
  const index = step < frames.length ? step : cycleLen - step;
  return frames[Math.min(index, frames.length - 1)];
}
