/**
 * Reine Spiellogik-Funktionen für Handtaschen-Projektile und Geschosse.
 */

export interface HandbagProjectile {
  id: number;
  startX: number;
  startY: number;
  targetX: number;
  targetY: number;
  t: number;          // Fortschritt 0..1
  durationSec: number;
  currentX: number;
  currentY: number;
  scale: number;      // Wächst mit Tiefe
  rotation: number;   // Taumelrotation
  frameIndex: number; // 0..3 aus handbag-projectile-spin.png
  isDestroyed: boolean;
  dealtDamage: boolean;
}

export function createHandbagProjectile(
  id: number,
  startX: number,
  startY: number,
  targetX: number,
  targetY: number,
  durationSec = 1.6,
): HandbagProjectile {
  return {
    id,
    startX,
    startY,
    targetX,
    targetY,
    t: 0,
    durationSec,
    currentX: startX,
    currentY: startY,
    scale: 0.35,
    rotation: 0,
    frameIndex: 0,
    isDestroyed: false,
    dealtDamage: false,
  };
}

/**
 * Aktualisiert das fliegende Handtaschen-Projektil um deltaTime (in Sekunden).
 * Berechnet parabelförmigen Flugbogen, Rotation, Tiefenskalierung und Spin-Frame.
 */
export function updateHandbagProjectile(
  proj: HandbagProjectile,
  dt: number,
): { proj: HandbagProjectile; reachedTarget: boolean } {
  if (proj.isDestroyed || proj.dealtDamage) {
    return { proj, reachedTarget: false };
  }

  const newT = Math.min(1.0, proj.t + dt / proj.durationSec);
  // Parabel-Bogen für Flugbahn: hebt sich in der Mitte nach oben
  const arcHeight = Math.sin(newT * Math.PI) * 160;

  const currentX = proj.startX + (proj.targetX - proj.startX) * newT;
  const currentY = proj.startY + (proj.targetY - proj.startY) * newT - arcHeight;

  // Wächst mit Tiefe von 0.35 auf 1.15
  const scale = 0.35 + newT * 0.8;

  // Taumelrotation + 4 Spin-Phasen
  const rotation = newT * Math.PI * 4;
  const frameIndex = Math.floor(newT * 12) % 4;

  const reachedTarget = newT >= 1.0;

  const updated: HandbagProjectile = {
    ...proj,
    t: newT,
    currentX,
    currentY,
    scale,
    rotation,
    frameIndex,
    dealtDamage: reachedTarget ? true : proj.dealtDamage,
  };

  return { proj: updated, reachedTarget };
}

/**
 * Prüft ob ein Trefferpunkt (Schuss) die Handtasche trifft.
 * Hitbox basiert auf sichtbarer Position und aktueller Tiefenskalierung.
 */
export function isHandbagHit(
  proj: HandbagProjectile,
  clickX: number,
  clickY: number,
  baseHitRadius = 75,
): boolean {
  if (proj.isDestroyed || proj.dealtDamage) return false;
  const hitRadius = baseHitRadius * proj.scale;
  const dist = Math.hypot(clickX - proj.currentX, clickY - proj.currentY);
  return dist <= hitRadius;
}

/**
 * Zerstört das Handtaschen-Projektil (z. B. durch Spielerschuss oder Basskanone).
 * Gibt true zurück, wenn es vorher noch aktiv war.
 */
export function destroyHandbag(proj: HandbagProjectile): { proj: HandbagProjectile; destroyed: boolean } {
  if (proj.isDestroyed || proj.dealtDamage) {
    return { proj, destroyed: false };
  }
  return {
    proj: { ...proj, isDestroyed: true },
    destroyed: true,
  };
}
