import { describe, it, expect } from "vitest";
import {
  getFrameIndexFromTime,
  getPingPongFrame,
} from "../src/game/pure/animation";
import {
  applyDamage,
  applyHeal,
  applyShieldPickup,
  applyAmmoPickup,
  equipWeapon,
  consumeWeaponAmmo,
  MAX_HEARTS,
  INITIAL_HEARTS,
  WEAPON_CONFIGS,
} from "../src/game/pure/weapons";
import {
  createHandbagProjectile,
  updateHandbagProjectile,
  isHandbagHit,
  destroyHandbag,
} from "../src/game/pure/projectile";

describe("1. Animationslogik (Pure Functions)", () => {
  it("unterschiedliche Frame-Deltas erzeugen bei gleicher Gesamtzeit dieselbe Animationsphase", () => {
    const clip = { frames: [0, 1, 2, 3], fps: 10, loop: true };
    // 0.25s bei 10 fps (0.1s pro Frame) -> Frame 2 (0..0.1:0, 0.1..0.2:1, 0.2..0.3:2)
    const frameAtOnce = getFrameIndexFromTime(0.25, clip);

    // Dasselbe mit mehreren Teilschritten
    let elapsed = 0;
    const steps = [0.05, 0.05, 0.08, 0.07]; // Summe = 0.25
    steps.forEach((dt) => { elapsed += dt; });
    const frameStepped = getFrameIndexFromTime(elapsed, clip);

    expect(frameAtOnce).toBe(2);
    expect(frameStepped).toBe(2);
  });

  it("Pause (dt = 0) friert die Animation exakt ein", () => {
    const clip = { frames: [0, 1, 2, 3], fps: 6, loop: true };
    const t = 0.35;
    const frameBefore = getFrameIndexFromTime(t, clip);
    const frameAfterPause = getFrameIndexFromTime(t + 0, clip);
    expect(frameBefore).toBe(frameAfterPause);
  });

  it("Nicht-loopender Clip hält beim letzten Frame an", () => {
    const clip = { frames: [0, 1], durationMs: 200, loop: false };
    expect(getFrameIndexFromTime(0.05, clip)).toBe(0);
    expect(getFrameIndexFromTime(0.15, clip)).toBe(1);
    expect(getFrameIndexFromTime(1.5, clip)).toBe(1); // Nach Ablauf am Ende gehalten
  });

  it("Ping-Pong-Animation für Zivilisten wechselt sanft zwischen Posen", () => {
    const frames = [0, 1]; // idle und warning
    expect(getPingPongFrame(0.0, frames, 2)).toBe(0);
    expect(getPingPongFrame(0.5, frames, 2)).toBe(1);
    expect(getPingPongFrame(1.0, frames, 2)).toBe(0);
  });
});

describe("2. Health, Schild & Heilungs-Regeln", () => {
  it("Startet mit INITIAL_HEARTS (3) und heilt maximal bis MAX_HEARTS (5)", () => {
    let hearts = INITIAL_HEARTS;
    expect(hearts).toBe(3);

    // Heilung +1
    let res = applyHeal(hearts, 1);
    expect(res.newHearts).toBe(4);
    expect(res.healed).toBe(true);
    hearts = res.newHearts;

    // Heilung +1
    res = applyHeal(hearts, 1);
    expect(res.newHearts).toBe(5);
    hearts = res.newHearts;

    // Am Cap (5) keine Überheilung
    res = applyHeal(hearts, 1);
    expect(res.newHearts).toBe(MAX_HEARTS);
    expect(res.healed).toBe(false);
  });

  it("Schild absorbiert genau 1 Schaden und zerbricht danach", () => {
    // Mit Schild
    const shieldPickup = applyShieldPickup(false);
    expect(shieldPickup.shieldActive).toBe(true);

    // Erster Treffer: Schild fängt Schaden ab, Herzen bleiben unverändert
    const hit1 = applyDamage(3, true, 1);
    expect(hit1.newHearts).toBe(3);
    expect(hit1.shieldActive).toBe(false);
    expect(hit1.absorbedByShield).toBe(true);

    // Zweiter Treffer (ohne Schild): Herz wird abgezogen
    const hit2 = applyDamage(hit1.newHearts, hit1.shieldActive, 1);
    expect(hit2.newHearts).toBe(2);
    expect(hit2.absorbedByShield).toBe(false);
  });

  it("Maximal 1 Schild gleichzeitig (kein Stapeln)", () => {
    const first = applyShieldPickup(false);
    expect(first.applied).toBe(true);
    const second = applyShieldPickup(true);
    expect(second.applied).toBe(false);
    expect(second.shieldActive).toBe(true);
  });
});

describe("3. Waffen- & Munitionsregeln", () => {
  it("Standardpistole hat Magazinkapazität 6 und fällt nicht zurück", () => {
    const { activeWeapon, ammo } = equipWeapon("pistol");
    expect(activeWeapon).toBe("pistol");
    expect(ammo).toBe(6);

    const shot = consumeWeaponAmmo("pistol", 1, 1);
    expect(shot.ok).toBe(true);
    expect(shot.newAmmo).toBe(0);
    expect(shot.nextWeapon).toBe("pistol");
    expect(shot.switchedToPistol).toBe(false);
  });

  it("Shotgun hat 8 Schüsse und fällt bei 0 Vorrat auf Pistole zurück", () => {
    let { activeWeapon, ammo } = equipWeapon("shotgun");
    expect(ammo).toBe(8);

    // 7 Schüsse abgeben
    for (let i = 0; i < 7; i++) {
      const res = consumeWeaponAmmo(activeWeapon, ammo, 1);
      expect(res.ok).toBe(true);
      ammo = res.newAmmo;
      activeWeapon = res.nextWeapon;
    }
    expect(ammo).toBe(1);
    expect(activeWeapon).toBe("shotgun");

    // Letzter Schuss: fällt zurück auf geladene Pistole
    const lastShot = consumeWeaponAmmo(activeWeapon, ammo, 1);
    expect(lastShot.ok).toBe(true);
    expect(lastShot.nextWeapon).toBe("pistol");
    expect(lastShot.newAmmo).toBe(6);
    expect(lastShot.switchedToPistol).toBe(true);
  });

  it("SMG hat 36 Patronen und verbraucht 1 Munition pro realer Kugel", () => {
    const { ammo } = equipWeapon("smg");
    expect(ammo).toBe(36);

    // 3er-Burst Einzelschuss
    const k1 = consumeWeaponAmmo("smg", ammo, 1);
    const k2 = consumeWeaponAmmo("smg", k1.newAmmo, 1);
    const k3 = consumeWeaponAmmo("smg", k2.newAmmo, 1);
    expect(k3.newAmmo).toBe(33);
  });

  it("Basskanone hat 3 Schuss und verschont Zivilisten laut Konfiguration", () => {
    const cfg = WEAPON_CONFIGS["bass-cannon"];
    expect(cfg.maxAmmo).toBe(3);
    expect(cfg.sparesCivilians).toBe(true);
  });

  it("Ammo-Pickup füllt Vorrat bis zum Cap der aktiven Waffe auf", () => {
    // Shotgun bei 3 Schuss
    const res = applyAmmoPickup("shotgun", 3);
    expect(res.applied).toBe(true);
    expect(res.newAmmo).toBe(8);

    // Bereits voll
    const fullRes = applyAmmoPickup("shotgun", 8);
    expect(fullRes.applied).toBe(false);
    expect(fullRes.newAmmo).toBe(8);
  });

  it("Waffentausch ersetzt die bisherige temporäre Waffe vollständig", () => {
    const shotgun = equipWeapon("shotgun");
    expect(shotgun.activeWeapon).toBe("shotgun");

    const smg = equipWeapon("smg");
    expect(smg.activeWeapon).toBe("smg");
    expect(smg.ammo).toBe(36); // Frisches SMG-Kontingent
  });
});

describe("4. Handtaschen-Projektil-Lifecycle", () => {
  it("Handtasche fliegt in Parabelkurve, wächst mit der Tiefe und rotiert", () => {
    const proj = createHandbagProjectile(1, 800, 300, 800, 850, 1.0);
    expect(proj.scale).toBeCloseTo(0.35, 2);
    expect(proj.t).toBe(0);

    // Flug nach halber Zeit (0.5s)
    const { proj: mid } = updateHandbagProjectile(proj, 0.5);
    expect(mid.t).toBeCloseTo(0.5, 2);
    expect(mid.scale).toBeGreaterThan(0.35); // Gewachsen
    expect(mid.currentY).toBeLessThan(575); // Bogen hebt sich

    // Flug bis zum Ziel (1.0s)
    const { proj: end, reachedTarget } = updateHandbagProjectile(mid, 0.5);
    expect(reachedTarget).toBe(true);
    expect(end.t).toBe(1.0);
    expect(end.scale).toBeCloseTo(1.15, 2);
    expect(end.dealtDamage).toBe(true);
  });

  it("Ein Projektil verursacht höchstens einmal Schaden und nie wieder nach Erreichen", () => {
    const proj = createHandbagProjectile(2, 500, 200, 500, 800, 0.5);
    const step1 = updateHandbagProjectile(proj, 0.5);
    expect(step1.reachedTarget).toBe(true);
    expect(step1.proj.dealtDamage).toBe(true);

    // Weiterer Tick darf keinen weiteren Schaden verursachen
    const step2 = updateHandbagProjectile(step1.proj, 0.1);
    expect(step2.reachedTarget).toBe(false);
  });

  it("Abgeschossene Handtasche wird zerstört und verursacht keinen Schaden", () => {
    const proj = createHandbagProjectile(3, 400, 300, 400, 800, 1.0);
    const mid = updateHandbagProjectile(proj, 0.4).proj;

    // Treffertest
    const hit = isHandbagHit(mid, mid.currentX, mid.currentY);
    expect(hit).toBe(true);

    // Spieler schießt Handtasche ab
    const { proj: destroyed, destroyed: wasActive } = destroyHandbag(mid);
    expect(wasActive).toBe(true);
    expect(destroyed.isDestroyed).toBe(true);

    // Läuft weiter bis t=1: darf dennoch keinen Schaden verursachen
    const end = updateHandbagProjectile(destroyed, 0.8);
    expect(end.reachedTarget).toBe(false);
    expect(end.proj.dealtDamage).toBe(false);
  });
});
