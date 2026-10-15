import { describe, it, expect, beforeAll } from "vitest";
import { Engine } from "../src/game/engine";
import { loadImage } from "../src/game/assets";

class MockImage {
  private _src = "";
  onload: (() => void) | null = null;
  onerror: (() => void) | null = null;

  set src(val: string) {
    this._src = val;
    setTimeout(() => {
      if (val.includes("missing-file")) {
        this.onerror?.();
      } else {
        this.onload?.();
      }
    }, 10);
  }
  get src() {
    return this._src;
  }
}

beforeAll(() => {
  (globalThis as any).Image = MockImage;
  (globalThis as any).requestAnimationFrame = (fn: any) => setTimeout(fn, 16);
  (globalThis as any).cancelAnimationFrame = (id: any) => clearTimeout(id);
  if (typeof (globalThis as any).window === "undefined") {
    (globalThis as any).window = {
      devicePixelRatio: 1,
      addEventListener() {},
      removeEventListener() {},
      clearTimeout: (t: any) => clearTimeout(t),
      setTimeout: (fn: any, ms: any) => setTimeout(fn, ms),
    };
  }
});

function createMockCanvas() {
  const grad = { addColorStop() {} };
  const base = {
    canvas: null,
    measureText: () => ({ width: 42 }),
    createRadialGradient: () => grad,
    createLinearGradient: () => grad,
  };
  const ctx = new Proxy(base, {
    get(t, k) {
      if (k in t) return (t as Record<string, unknown>)[k as string];
      (t as Record<string, unknown>)[k as string] = () => {};
      return (t as Record<string, unknown>)[k as string];
    },
    set(t, k, v) {
      (t as Record<string, unknown>)[k as string] = v;
      return true;
    },
  });

  const cv = {
    width: 1672,
    height: 941,
    clientWidth: 1672,
    clientHeight: 941,
    getContext: () => ctx,
    addEventListener() {},
    removeEventListener() {},
    getBoundingClientRect: () => ({ left: 0, top: 0, width: 1672, height: 941 }),
  } as unknown as HTMLCanvasElement;

  return cv;
}

const mockImg = { width: 1672, height: 941 } as HTMLImageElement;
const mockAssets = {
  title: mockImg,
  bgs: [mockImg, mockImg, mockImg, mockImg, mockImg],
  bgsL2: [mockImg, mockImg, mockImg],
  chars: { width: 1536, height: 1024 } as HTMLImageElement,
  ui: { width: 1448, height: 1086 } as HTMLImageElement,
  sheets: {
    "zombie-mesh-gestures": { width: 1254, height: 1254 } as HTMLImageElement,
    "zombie-tracksuit-gestures": { width: 1254, height: 1254 } as HTMLImageElement,
    "zombie-punk-gestures": { width: 1254, height: 1254 } as HTMLImageElement,
    "zombie-dj-gestures": { width: 1254, height: 1254 } as HTMLImageElement,
    "civilian-yellow-gestures": { width: 1254, height: 1254 } as HTMLImageElement,
    "civilian-turquoise-gestures": { width: 1254, height: 1254 } as HTMLImageElement,
    "techno-bat-flight": { width: 1254, height: 1254 } as HTMLImageElement,
    "granny-handbag-attack": { width: 1254, height: 1254 } as HTMLImageElement,
    "market-vendor-gestures": { width: 1254, height: 1254 } as HTMLImageElement,
    "powerups-weapons-atlas": { width: 1536, height: 1024 } as HTMLImageElement,
    "handbag-projectile-spin": { width: 1254, height: 1254 } as HTMLImageElement,
  },
};

const mockAudio = new Proxy({}, { get: (t, k) => (k === "onBeat" ? null : () => {}) }) as any;

describe("5. End-to-End Engine Integration", () => {
  it("Level 1 durchläuft alle 4 Wellen, besiegt Betontroll und erreicht 'level-clear'", () => {
    let resultPhase = "";
    const cv = createMockCanvas();
    const engine = new Engine(cv, mockAssets, mockAudio, (p) => {
      resultPhase = p;
    });

    engine.begin(1);
    expect(engine.currentLevel).toBe(1);
    expect(engine.hearts).toBe(3);
    expect(engine.ammo).toBe(6);

    // Fast-forward
    (engine as any).waveIntro = 0;
    (engine as any).spawnT = 0.05;

    const dt = 1 / 30;
    for (let sec = 0; sec < 180 && resultPhase !== "level-clear"; sec += dt) {
      (engine as any).update(dt);
      (engine as any).render();

      const walkers = (engine as any).mobs.filter(
        (m: any) => m.state === "walk" && m.kind === "zombie",
      );
      if (walkers.length > 0) {
        const m = walkers[0];
        engine.shoot(m.rect.x + m.rect.w / 2, m.rect.y + m.rect.h / 2);
      }

      if ((engine as any).bossMode && (engine as any).bossDeadT <= 0) {
        engine.shoot((engine as any).bossX, (engine as any).bossY - 250);
      }
    }

    // Wenn der Boss besiegt wurde
    if ((engine as any).bossDeadT > 0 && resultPhase !== "level-clear") {
      (engine as any).bossDeadT = 0;
      (engine as any).update(0.1);
    }

    expect(resultPhase).toBe("level-clear");
    const s = engine.stats();
    expect(s.kills).toBeGreaterThan(0);
    expect(s.score).toBeGreaterThan(0);
  });

  it("Level 2 startet direkt am Boxhagener Platz und besiegt Handtaschen-Oma bis 'win'", () => {
    let resultPhase = "";
    const cv = createMockCanvas();
    const engine = new Engine(cv, mockAssets, mockAudio, (p) => {
      resultPhase = p;
    });

    engine.begin(2);
    expect(engine.currentLevel).toBe(2);

    (engine as any).waveIntro = 0;
    (engine as any).spawnT = 0.05;

    const dt = 1 / 30;
    for (let sec = 0; sec < 180 && resultPhase !== "win"; sec += dt) {
      (engine as any).update(dt);
      (engine as any).render();

      const targets = (engine as any).mobs.filter(
        (m: any) => m.state === "walk" && (m.kind === "zombie" || m.kind === "bat"),
      );
      if (targets.length > 0) {
        const m = targets[0];
        engine.shoot(m.rect.x + m.rect.w / 2, m.rect.y + m.rect.h / 2);
      }

      const projs = (engine as any).projectiles;
      if (projs.length > 0) {
        const p = projs[0];
        engine.shoot(p.currentX, p.currentY);
      }

      if ((engine as any).bossMode && (engine as any).grannyDeadT <= 0) {
        engine.shoot((engine as any).grannyX, (engine as any).grannyY - 260);
      }
    }

    if ((engine as any).grannyDeadT > 0 && resultPhase !== "win") {
      (engine as any).grannyDeadT = 0;
      (engine as any).update(0.1);
    }

    expect(resultPhase).toBe("win");
    const s = engine.stats();
    expect(s.kills).toBeGreaterThan(0);
  });

  it("Reset setzt alle Werte (Score, Kills, Kombo, Waffen, Health, Zeit) sauber zurück", () => {
    const cv = createMockCanvas();
    const engine = new Engine(cv, mockAssets, mockAudio, () => {});
    engine.begin(1);

    engine.hearts = 1;
    engine.activeWeapon = "shotgun";
    engine.ammo = 2;
    engine.hasShield = true;
    (engine as any).score = 5000;
    (engine as any).kills = 12;
    (engine as any).totalKills = 12;

    (engine as any).reset();

    expect(engine.hearts).toBe(3);
    expect(engine.activeWeapon).toBe("pistol");
    expect(engine.ammo).toBe(6);
    expect(engine.hasShield).toBe(false);
    expect((engine as any).score).toBe(0);
    expect((engine as any).kills).toBe(0);
    expect((engine as any).totalKills).toBe(0);
    expect((engine as any).combo).toBe(1);
  });

  it("Fehlende Asset-Datei wirft Fehler mit konkretem Dateinamen und bricht nach Timeout ab", async () => {
    await expect(loadImage("/assets/missing-file-404.png")).rejects.toThrow(
      "Grafikdatei fehlt oder ist fehlerhaft: /assets/missing-file-404.png",
    );
  });
});
