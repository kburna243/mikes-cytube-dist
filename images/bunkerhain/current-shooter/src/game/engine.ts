import {
  Assets, BG_SOURCES_L1, BG_SOURCES_L2, CHAR_FRAMES, UI_FRAMES,
  EXPANSION_SHEETS, VW, VH, UiFrame, CharFrame, SheetMeta,
} from "./assets";
import { BunkerAudio } from "./audio";
import { getFrameIndexFromTime, getPingPongFrame } from "./pure/animation";
import {
  WeaponType, PickupType, MAX_HEARTS, INITIAL_HEARTS,
  applyDamage, applyHeal, applyShieldPickup, applyAmmoPickup,
  equipWeapon, consumeWeaponAmmo, WEAPON_CONFIGS,
} from "./pure/weapons";
import {
  HandbagProjectile, createHandbagProjectile,
  updateHandbagProjectile, isHandbagHit, destroyHandbag,
} from "./pure/projectile";

/* ------------------------------------------------ Typen --- */

export type MobArchetype =
  | "zombie-mesh"
  | "zombie-tracksuit"
  | "zombie-punk"
  | "zombie-dj"
  | "market-vendor"
  | "civilian-yellow"
  | "civilian-turquoise"
  | "techno-bat";

export interface Mob {
  id: number;
  kind: "zombie" | "civilian" | "bat";
  archetype: MobArchetype;
  sheetKey: string;
  x0: number; y0: number; s0: number;
  x1: number; y1: number; s1: number;
  t: number; speed: number;
  swayPh: number; swayAmp: number; zigzag: boolean;
  state: "walk" | "dying" | "leap" | "flee";
  dt: number;          // Zeit im aktuellen Zustand
  elapsedSec: number;  // Für Animations-Frames
  rect: { x: number; y: number; w: number; h: number };
  hitRect: { x: number; y: number; w: number; h: number };
  // Speziell für Fledermäuse:
  batAltitude?: number;
  batDiveT?: number;
  batTargetX?: number;
  batTargetY?: number;
}

export interface PickupItem {
  id: number;
  type: PickupType;
  frameIndex: number;
  x: number;
  y: number;
  vy: number;
  t: number;
  scale: number;
  radius: number;
}

interface Particle {
  x: number; y: number; vx: number; vy: number; g: number;
  t: number; dur: number; size: number; color: string;
  frame?: UiFrame; rot?: number; vr?: number;
}

interface Fx {
  frame: UiFrame | null;
  kind: "burst" | "splash" | "bass-wave";
  x: number; y: number; t: number; dur: number; size: number;
  tint?: string; radius?: number;
}

interface Floater {
  text: string; x: number; y: number; t: number; dur: number; color: string; size: number;
}

interface Decal { x: number; y: number; t: number; }
interface Star { x: number; y: number; vy: number; t: number; }
interface Bubble { text: string; t: number; dur: number; x: number; y: number; big?: boolean; }

export interface Stats {
  level: number;
  kills: number;
  shots: number;
  hits: number;
  maxCombo: number;
  score: number;
  timeMs: number;
}

export type Phase = "idle" | "play" | "over" | "win" | "level-clear";

export interface EngineSettings {
  stroboEnabled: boolean;
  reducedMotion: boolean;
}

const ZOMBIE_SHEETS_L1: MobArchetype[] = [
  "zombie-mesh",
  "zombie-tracksuit",
  "zombie-punk",
  "zombie-dj",
];

const ZOMBIE_SHEETS_L2: MobArchetype[] = [
  "market-vendor",
  "zombie-tracksuit",
  "zombie-punk",
  "zombie-mesh",
];

const CIVILIAN_SHEETS: MobArchetype[] = [
  "civilian-yellow",
  "civilian-turquoise",
];

const BOSS_TAUNTS_L1 = [
  "DU HAST KEINEN STIL!", "DRAUSSEN BLEIBEN, BRATZKOPF!",
  "MEIN BUNKER — MEINE REGELN!", "STAMPFEN, BIS DIE BETONTÜR FÄLLT!",
];

const BOSS_TAUNTS_L2 = [
  "FRÜHER WAR MEHR HIRN IM ANGEBOT!",
  "DIE TASCHE BLEIBT BEI MIR!",
  "KAUFST DU RÜBEN ODER WAT?!",
  "EEN SCHRITT NÄHER UND ET KNALLT!",
  "IKK HAB NOCH EENE TASCHE VOLL PFEFFER!",
];

/* ------------------------------------------------ Engine --- */

export class Engine {
  private cv: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private a: Assets;
  private audio: BunkerAudio;
  private onPhase: (p: Phase, s?: Stats) => void;
  private onWeaponChange?: (w: WeaponType, ammo: number, shield: boolean, hearts: number) => void;

  private raf = 0;
  private last = 0;
  private running = false;
  private paused = false;
  private phase: Phase = "idle";

  // View
  private scale = 1; private ox = 0; private oy = 0;
  private mx = VW / 2; private my = VH / 2;
  private pointerIn = false;

  // Settings
  public settings: EngineSettings = {
    stroboEnabled: false,
    reducedMotion: false,
  };

  // Kampagnen- & Level-Zustand
  public currentLevel: 1 | 2 = 1;
  private wave = 0;
  private bossMode = false;
  private kills = 0; private totalKills = 0; private spawned = 0;

  // Spielerzustand
  public hearts = INITIAL_HEARTS;
  public hasShield = false;
  public activeWeapon: WeaponType = "pistol";
  public ammo = 6;
  public reloading = 0;

  // Scoring
  private score = 0; private combo = 1; private comboT = 0;
  private shots = 0; private hits = 0; private maxCombo = 1;
  private startT = 0;

  // Entitäten
  private mobs: Mob[] = [];
  private projectiles: HandbagProjectile[] = [];
  private pickups: PickupItem[] = [];
  private parts: Particle[] = [];
  private fxs: Fx[] = [];
  private floaters: Floater[] = [];
  private decals: Decal[] = [];
  private stars: Star[] = [];
  private bubble: Bubble | null = null;

  // SMG Burst-Status
  private smgBurstRemaining = 0;
  private smgBurstTimer = 0;
  private smgTargetX = 0;
  private smgTargetY = 0;

  // Wellen & Inszenierung
  private spawnT = 1.2;
  private starT = 8;
  private waveIntro = 0;
  private waveClear = 0;
  private bgFade = 1;
  private prevBg = -1;
  private shake = 0;
  private hurtFlash = 0;
  private beatPulse = 0;
  private mobId = 1;
  private pickupId = 1;
  private projectileId = 1;

  // Boss L1: Betontroll
  private bossHpMax = 26;
  private bossHp = 26;
  private bossFrame: CharFrame = "bouncerIdle";
  private bossX = VW / 2; private bossY = 712;
  private bossSwayPh = 0;
  private bossAttackT = 6;
  private bossLungeT = 0;
  private bossHitNeed = 2; private bossHitGot = 0;
  private bossDeadT = 0;
  private bossFlash = 0;
  private tauntT = 4;

  // Boss L2: Handtaschen-Oma
  private grannyHpMax = 40;
  private grannyHp = 40;
  private grannyPose: "idle" | "windup" | "release" | "recovery" = "idle";
  private grannyX = VW / 2; private grannyY = 660;
  private grannyStateTimer = 0;
  private grannyAttackCooldown = 4.5;
  private grannyFlash = 0;
  private grannyDeadT = 0;

  constructor(
    cv: HTMLCanvasElement,
    a: Assets,
    audio: BunkerAudio,
    onPhase: (p: Phase, s?: Stats) => void,
    onWeaponChange?: (w: WeaponType, ammo: number, shield: boolean, hearts: number) => void,
  ) {
    this.cv = cv;
    const c = cv.getContext("2d");
    if (!c) throw new Error("no 2d context");
    this.ctx = c;
    this.a = a;
    this.audio = audio;
    this.onPhase = onPhase;
    this.onWeaponChange = onWeaponChange;

    audio.onBeat = () => { this.beatPulse = 1; };
    this.resize();
    if (typeof window !== "undefined") {
      window.addEventListener("resize", this.resize);
      window.addEventListener("keydown", this.onKey);
    }
    cv.addEventListener("pointermove", this.onMove);
    cv.addEventListener("pointerdown", this.onDown);
    cv.addEventListener("pointerenter", () => (this.pointerIn = true));
    cv.addEventListener("pointerleave", () => (this.pointerIn = false));
    cv.addEventListener("contextmenu", (e) => {
      e.preventDefault();
      this.tryReload();
    });
  }

  destroy() {
    if (typeof cancelAnimationFrame !== "undefined") {
      cancelAnimationFrame(this.raf);
    }
    if (typeof window !== "undefined") {
      window.removeEventListener("resize", this.resize);
      window.removeEventListener("keydown", this.onKey);
    }
    this.cv.removeEventListener("pointermove", this.onMove);
    this.cv.removeEventListener("pointerdown", this.onDown);
  }

  setPaused(p: boolean) {
    this.paused = p;
    if (p) {
      this.audio.stopMusic();
      this.smgBurstRemaining = 0;
    } else {
      this.audio.startMusic(this.currentLevel);
      this.last = performance.now();
    }
  }

  isPaused() {
    return this.paused;
  }

  begin(level: 1 | 2 = 1) {
    this.currentLevel = level;
    this.reset();
    this.phase = "play";
    this.startT = performance.now();
    if (!this.running) {
      this.running = true;
      this.last = performance.now();
      this.loop();
    }
    this.audio.startMusic(this.currentLevel);
    this.notifyHud();
  }

  startLevel2() {
    this.begin(2);
  }

  stopLoop() {
    this.running = false;
    this.audio.stopMusic();
  }

  private notifyHud() {
    this.onWeaponChange?.(this.activeWeapon, this.ammo, this.hasShield, this.hearts);
  }

  private reset() {
    this.wave = 0;
    this.bossMode = false;
    this.kills = 0;
    this.totalKills = 0;
    this.spawned = 0;
    this.hearts = INITIAL_HEARTS;
    this.hasShield = false;
    this.activeWeapon = "pistol";
    this.ammo = 6;
    this.reloading = 0;
    this.score = 0;
    this.combo = 1;
    this.comboT = 0;
    this.shots = 0;
    this.hits = 0;
    this.maxCombo = 1;
    this.mobs = [];
    this.projectiles = [];
    this.pickups = [];
    this.parts = [];
    this.fxs = [];
    this.floaters = [];
    this.decals = [];
    this.stars = [];
    this.bubble = null;
    this.smgBurstRemaining = 0;
    this.spawnT = 2.4;
    this.starT = 8;
    this.waveIntro = 2.8;
    this.waveClear = 0;
    this.prevBg = -1;
    this.bgFade = 1;

    // Boss L1
    this.bossHp = this.bossHpMax;
    this.bossFrame = "bouncerIdle";
    this.bossAttackT = 6;
    this.bossLungeT = 0;
    this.bossDeadT = 0;

    // Boss L2
    this.grannyHp = this.grannyHpMax;
    this.grannyPose = "idle";
    this.grannyStateTimer = 0;
    this.grannyAttackCooldown = 4.5;
    this.grannyDeadT = 0;

    const intro = this.currentLevel === 1
      ? "LEVEL 1: BUNKERHAIN · Sie klettern aus dem Kanal. Kein Stempel, kein Einlass — FEUER FREI!"
      : "LEVEL 2: BOXHAGENER PLATZ · Kisten, Stände und Markt-Zombies im Morgennebel!";
    this.showBubble(intro, 4.4, VW / 2, 210, true);
  }

  /* ---------------- Input ---------------- */

  private resize = () => {
    const dpr = typeof window !== "undefined" ? Math.min(2, window.devicePixelRatio || 1) : 1;
    const w = this.cv.clientWidth, h = this.cv.clientHeight;
    this.cv.width = Math.round(w * dpr);
    this.cv.height = Math.round(h * dpr);
    const s = Math.max(this.cv.width / VW, this.cv.height / VH);
    this.scale = s;
    this.ox = (this.cv.width - VW * s) / 2;
    this.oy = (this.cv.height - VH * s) / 2;
  };

  private toWorld(clientX: number, clientY: number) {
    const r = this.cv.getBoundingClientRect();
    const dpr = this.cv.width / (this.cv.clientWidth || 1);
    let wx = (clientX - r.left) * dpr - this.ox;
    let wy = (clientY - r.top) * dpr - this.oy;
    wx /= this.scale;
    wy /= this.scale;
    return { x: wx, y: wy };
  }

  private onMove = (e: PointerEvent) => {
    const pt = this.toWorld(e.clientX, e.clientY);
    this.mx = pt.x;
    this.my = pt.y;
  };

  private onKey = (e: KeyboardEvent) => {
    if (e.code === "KeyR" && this.phase === "play" && !this.paused) {
      this.tryReload();
    }
    if (e.code === "Escape" && (this.phase === "play" || this.paused)) {
      this.setPaused(!this.paused);
    }
  };

  private onDown = (e: PointerEvent) => {
    if (e.button === 2) {
      this.tryReload();
      return;
    }
    if (e.button !== 0 && e.pointerType === "mouse") return;
    const pt = this.toWorld(e.clientX, e.clientY);
    this.mx = pt.x;
    this.my = pt.y;

    if (this.phase !== "play" || this.paused) return;

    // Randzonen-Klick für Offscreen-Reload (innerhalb von 45px der Spielfläche)
    const isBorderZone = pt.x < 45 || pt.x > VW - 45 || pt.y < 45 || pt.y > VH - 45;
    if (isBorderZone && this.activeWeapon === "pistol" && this.ammo < 6) {
      this.tryReload();
      return;
    }

    this.triggerWeapon(this.mx, this.my);
  };

  public tryReload() {
    if (this.activeWeapon !== "pistol") return;
    if (this.reloading > 0 || this.ammo === 6) return;
    this.reloading = 1.15;
    this.audio.reload();
    this.ejectShells(3);
    this.notifyHud();
  }

  /* ---------------- Waffen-Auslösung ---------------- */

  public shoot(x: number, y: number) {
    this.triggerWeapon(x, y);
  }

  private triggerWeapon(x: number, y: number) {
    if (this.reloading > 0) {
      this.audio.miss();
      return;
    }

    if (this.activeWeapon === "pistol") {
      if (this.ammo <= 0) {
        this.tryReload();
        return;
      }
      const res = consumeWeaponAmmo("pistol", this.ammo, 1);
      this.ammo = res.newAmmo;
      this.shots++;
      this.audio.shot();
      this.fireSingleShot(x, y);
      if (this.ammo === 0) this.tryReload();
    } else if (this.activeWeapon === "shotgun") {
      const res = consumeWeaponAmmo("shotgun", this.ammo, 1);
      this.ammo = res.newAmmo;
      this.activeWeapon = res.nextWeapon;
      this.shots++;
      this.audio.shotgun();
      this.fireShotgunBlast(x, y);
    } else if (this.activeWeapon === "smg") {
      // 3er-Burst starten
      this.smgBurstRemaining = 3;
      this.smgBurstTimer = 0;
      this.smgTargetX = x;
      this.smgTargetY = y;
    } else if (this.activeWeapon === "bass-cannon") {
      const res = consumeWeaponAmmo("bass-cannon", this.ammo, 1);
      this.ammo = res.newAmmo;
      this.activeWeapon = res.nextWeapon;
      this.shots++;
      this.audio.bassCannon();
      this.fireBassPulse(x, y);
    }

    this.notifyHud();
  }

  private fireSingleShot(x: number, y: number) {
    this.decals.push({ x, y, t: 0 });
    if (this.decals.length > 20) this.decals.shift();
    if (!this.settings.reducedMotion) {
      this.shake = Math.min(1, this.shake + 0.12);
    }
    this.ejectShells(1);

    // 1. Pickups sammeln (falls kein Zivilist direkt im Weg ist)
    if (this.checkPickupHit(x, y)) return;

    // 2. Sterne einsammeln
    if (this.checkStarHit(x, y)) return;

    // 3. Handtaschen-Projektil abfangen
    if (this.checkHandbagHit(x, y)) return;

    // 4. Boss L2 (Handtaschen-Oma)
    if (this.currentLevel === 2 && this.bossMode && this.checkGrannyHit(x, y)) return;

    // 5. Boss L1 (Betontroll)
    if (this.currentLevel === 1 && this.bossMode && this.bossDeadT <= 0 && this.bossAliveHit(x, y)) return;

    // 6. Mobs von vorn nach hinten prüfen
    const hitTarget = this.checkMobHit(x, y, false);
    if (!hitTarget) {
      this.combo = 1;
      this.audio.miss();
    }
  }

  private fireShotgunBlast(cx: number, cy: number) {
    if (!this.settings.reducedMotion) {
      this.shake = Math.min(1, this.shake + 0.35);
    }
    this.ejectShells(2);

    // Streukegel mit 5 Pellets um das Zentrum
    const pelletOffsets = [
      [0, 0],
      [-36, -28],
      [34, -22],
      [-24, 32],
      [28, 26],
    ];

    const targetsHitThisBlast = new Set<number>();

    pelletOffsets.forEach(([dx, dy]) => {
      const px = cx + dx, py = cy + dy;
      this.decals.push({ x: px, y: py, t: 0 });

      // Handtasche zerstören
      this.checkHandbagHit(px, py);
      // Pickups & Sterne
      this.checkPickupHit(px, py);
      this.checkStarHit(px, py);

      // Boss Treffer
      if (this.currentLevel === 2 && this.bossMode) this.checkGrannyHit(px, py);
      if (this.currentLevel === 1 && this.bossMode) this.bossAliveHit(px, py);

      // Mobs treffen (höchstens 1x pro Ziel gewertet)
      this.checkMobHit(px, py, false, targetsHitThisBlast);
    });

    this.burst(cx, cy, 380, "burst", "#ffd23f");
  }

  private fireBassPulse(cx: number, cy: number) {
    if (!this.settings.reducedMotion) {
      this.shake = Math.min(1, this.shake + 0.4);
    }
    const pulseRadius = 320;
    this.fxs.push({
      frame: null,
      kind: "bass-wave",
      x: cx,
      y: cy,
      t: 0,
      dur: 0.55,
      size: pulseRadius * 2,
      radius: pulseRadius,
    });

    // 1. Zerstört alle Handtaschen-Projektile im Zielbereich
    this.projectiles.forEach((p) => {
      if (Math.hypot(p.currentX - cx, p.currentY - cy) <= pulseRadius) {
        const { proj, destroyed } = destroyHandbag(p);
        Object.assign(p, proj);
        if (destroyed) {
          this.burst(p.currentX, p.currentY, 260, "splash", "#7dff5a");
          this.audio.splat();
          this.earn(150, p.currentX, p.currentY, "#7dff5a", "TASCHE ZERLEGT!");
        }
      }
    });

    // 2. Schadet Boss L2
    if (this.currentLevel === 2 && this.bossMode) {
      if (Math.hypot(this.grannyX - cx, this.grannyY - 260 - cy) <= pulseRadius) {
        this.damageGranny(4);
      }
    }
    // 3. Schadet Boss L1
    if (this.currentLevel === 1 && this.bossMode) {
      if (Math.hypot(this.bossX - cx, this.bossY - 260 - cy) <= pulseRadius) {
        this.bossHp = Math.max(0, this.bossHp - 3);
        this.bossFlash = 1;
        this.hits++;
      }
    }

    // 4. Trifft alle Zombies im Radius, aber VERSCHONT Zivilisten ausdrücklich!
    this.mobs.forEach((m) => {
      if (m.state !== "walk") return;
      if (m.kind === "civilian") return; // Zivilisten bleiben unversehrt!
      const mx = m.rect.x + m.rect.w / 2, my = m.rect.y + m.rect.h / 2;
      if (Math.hypot(mx - cx, my - cy) <= pulseRadius) {
        this.killMob(m, true);
      }
    });

    this.notifyHud();
  }

  /* ---------------- Treffer-Prüfungen ---------------- */

  private checkPickupHit(x: number, y: number): boolean {
    for (let i = this.pickups.length - 1; i >= 0; i--) {
      const p = this.pickups[i];
      if (Math.hypot(p.x - x, p.y - y) <= p.radius) {
        this.pickups.splice(i, 1);
        this.collectPickup(p);
        this.hits++;
        return true;
      }
    }
    return false;
  }

  private collectPickup(p: PickupItem) {
    this.audio.powerupPickup();
    this.burst(p.x, p.y, 280, "burst", "#ffd23f");

    if (p.type === "health") {
      const res = applyHeal(this.hearts, 1);
      this.hearts = res.newHearts;
      this.earn(100, p.x, p.y, "#7dff5a", res.healed ? "+1 HERZ!" : "HERZEN VOLL");
    } else if (p.type === "shield") {
      const res = applyShieldPickup(this.hasShield);
      this.hasShield = res.shieldActive;
      this.earn(150, p.x, p.y, "#ff2d78", res.applied ? "+SCHILD AKTIV!" : "SCHILD BEREITS AKTIV");
    } else if (p.type === "ammo") {
      const res = applyAmmoPickup(this.activeWeapon, this.ammo);
      this.ammo = res.newAmmo;
      this.earn(100, p.x, p.y, "#ffd23f", "MUNITION VOLL!");
    } else if (p.type === "shotgun" || p.type === "smg" || p.type === "bass-cannon") {
      const res = equipWeapon(p.type);
      this.activeWeapon = res.activeWeapon;
      this.ammo = res.ammo;
      this.earn(250, p.x, p.y, "#ffd23f", `${WEAPON_CONFIGS[p.type].name.toUpperCase()}!`);
    }

    this.notifyHud();
  }

  private checkStarHit(x: number, y: number): boolean {
    for (let i = this.stars.length - 1; i >= 0; i--) {
      const st = this.stars[i];
      if (Math.hypot(st.x - x, st.y - y) < 88) {
        this.stars.splice(i, 1);
        this.earn(250, st.x, st.y, "#ffd23f", "+250 BONUS");
        this.audio.starPing();
        this.burst(st.x, st.y, 340, "splash", "#ffd23f");
        this.hits++;
        return true;
      }
    }
    return false;
  }

  private checkHandbagHit(x: number, y: number): boolean {
    for (const p of this.projectiles) {
      if (isHandbagHit(p, x, y)) {
        const { proj, destroyed } = destroyHandbag(p);
        Object.assign(p, proj);
        if (destroyed) {
          this.burst(p.currentX, p.currentY, 260, "splash", "#ff2d78");
          this.audio.splat();
          this.earn(150, p.currentX, p.currentY, "#ffd23f", "+150 TASCHE ABGEWEHRT!");
          this.hits++;
          return true;
        }
      }
    }
    return false;
  }

  private checkMobHit(
    x: number,
    y: number,
    isBassPulse = false,
    targetsHitSet?: Set<number>,
  ): boolean {
    const sorted = [...this.mobs].sort((p, q) => q.t - p.t);
    for (const m of sorted) {
      if (m.state !== "walk") continue;
      if (targetsHitSet && targetsHitSet.has(m.id)) continue;

      const r = m.hitRect || m.rect;
      if (x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h) {
        if (targetsHitSet) targetsHitSet.add(m.id);

        if (m.kind === "civilian") {
          if (!isBassPulse) {
            this.hitCivilian(m);
          }
          return true;
        } else {
          this.killMob(m, true);
          return true;
        }
      }
    }
    return false;
  }

  private checkGrannyHit(x: number, y: number): boolean {
    const sheet = EXPANSION_SHEETS["granny-handbag-attack"];
    const f = sheet.frames[0];
    const wScale = 1.35;
    const dw = f.rect.w * wScale;
    const dh = f.rect.h * wScale;
    const bx = this.grannyX - f.pivot.x * wScale;
    const by = this.grannyY - f.pivot.y * wScale;

    if (x >= bx && x <= bx + dw && y >= by && y <= by + dh) {
      // Während des Ausholens oder der Recovery besonders verwundbar!
      const bonus = this.grannyPose === "recovery" ? 2 : 1;
      this.damageGranny(bonus);
      return true;
    }
    return false;
  }

  private damageGranny(dmg = 1) {
    if (this.grannyDeadT > 0) return;
    this.hits++;
    this.grannyHp = Math.max(0, this.grannyHp - dmg);
    this.grannyFlash = 1;
    this.audio.splat();
    this.burst(this.grannyX, this.grannyY - 280, 260, "splash", "#7dff5a");
    this.earn(60 * dmg, this.grannyX, this.grannyY - 340, "#c8ff6b", `+${60 * dmg}`);

    if (this.grannyHp <= 0) {
      this.grannyDeadT = 2.4;
      this.audio.roar();
      window.setTimeout(() => this.audio.win(), 900);
      for (let i = 0; i < 7; i++) {
        window.setTimeout(() => {
          this.burst(
            this.grannyX + (Math.random() - 0.5) * 480,
            this.grannyY - 240 - Math.random() * 260,
            420,
            "burst",
          );
        }, i * 160);
      }
      this.earn(3000, this.grannyX, this.grannyY - 400, "#ffd23f", "+3000 OMA BESIEGT!");
      this.shake = 1;
    }
  }

  private bossAliveHit(x: number, y: number): boolean {
    const f = CHAR_FRAMES[this.bossFrame];
    const h = (this.bossFrame === "bouncerIdle" ? 560 : 520) * 1.28;
    const sc = (h / f.h) * (this.bossLungeT > 0 ? 1.22 : 1);
    const w = f.w * sc;
    const bx = this.bossX - w / 2, by = this.bossY - f.h * sc - (this.bossLungeT > 0 ? -30 : 0);
    if (x < bx || x > bx + w || y < by || y > by + f.h * sc) return false;
    this.hits++;
    this.bossHp--;
    this.bossFlash = 1;
    this.bossHitGot++;
    this.audio.splat();
    this.burst(x, y, 300, "splash", "#9bff57");
    this.burst(x, y, 240, "burst");
    this.earn(60, x, y, "#c8ff6b", "+60");
    if (this.bossHp <= 0) {
      this.bossDeadT = 2.4;
      this.audio.roar();
      window.setTimeout(() => this.audio.win(), 900);
      for (let i = 0; i < 7; i++) {
        window.setTimeout(() => {
          this.burst(
            this.bossX + (Math.random() - 0.5) * 520,
            this.bossY - 260 - Math.random() * 320,
            460,
            "burst",
          );
        }, i * 160);
      }
      this.earn(2000, this.bossX, this.bossY - 420, "#ffd23f", "+2000 BETONTROLL ERLEDIGT");
      this.shake = 1;
    }
    return true;
  }

  private killMob(m: Mob, shot: boolean) {
    m.state = "dying";
    m.dt = 0;
    this.kills++;
    this.totalKills++;
    this.hits++;
    const pts = 100 * this.combo;
    this.earn(pts, m.rect.x + m.rect.w / 2, m.rect.y, "#ff2d78", `+${pts}`);
    this.combo = Math.min(8, this.combo + 1);
    this.comboT = 4;
    this.maxCombo = Math.max(this.maxCombo, this.combo);
    this.audio.splat();
    this.burst(
      m.rect.x + m.rect.w / 2,
      m.rect.y + m.rect.h * 0.45,
      280 * (m.rect.h / 480) + 120,
      "splash",
      "#ff2d78",
    );
    if (shot) this.dust(m.rect.x + m.rect.w / 2, m.rect.y + m.rect.h);
  }

  private hitCivilian(m: Mob) {
    m.state = "flee";
    m.dt = 0;
    this.audio.scream();
    this.hurt(1);
    this.earn(-150, m.rect.x + m.rect.w / 2, m.rect.y, "#ff3b3b", "GAST GETROFFEN!");
    this.burst(m.rect.x + m.rect.w / 2, m.rect.y + m.rect.h * 0.4, 260, "splash", "#ff3b3b");
    this.combo = 1;
  }

  public hurt(amount = 1) {
    const res = applyDamage(this.hearts, this.hasShield, amount);
    this.hearts = res.newHearts;
    this.hasShield = res.shieldActive;

    if (res.absorbedByShield) {
      this.audio.shieldBreak();
      this.burst(VW / 2, VH / 2, 420, "burst", "#ff2d78");
      this.earn(0, VW / 2, VH / 2, "#ff2d78", "SCHILD ABGEFANGEN!");
    } else {
      this.hurtFlash = 1;
      if (!this.settings.reducedMotion) {
        this.shake = Math.min(1, this.shake + 0.55);
      }
      this.audio.heartLoss();
      this.combo = 1;
      if (this.hearts <= 0) this.gameOver();
    }
    this.notifyHud();
  }

  private earn(pts: number, x: number, y: number, color: string, label?: string) {
    this.score = Math.max(0, this.score + pts);
    const f: Floater = {
      text: label ?? (pts > 0 ? `+${pts}` : `${pts}`),
      x,
      y,
      t: 0,
      dur: 1.1,
      color,
      size: Math.abs(pts) >= 500 ? 44 : 30,
    };
    this.floaters.push(f);
  }

  private gameOver() {
    this.phase = "over";
    this.audio.stopMusic();
    this.stopLoop();
    const s = this.stats();
    try {
      const hs = Number(localStorage.getItem("bunkerhain_hs") || 0);
      if (s.score > hs) localStorage.setItem("bunkerhain_hs", String(s.score));
    } catch { /* noop */ }
    this.onPhase("over", s);
  }

  private winGame() {
    this.phase = "win";
    this.audio.stopMusic();
    this.stopLoop();
    const s = this.stats();
    try {
      const hs = Number(localStorage.getItem("bunkerhain_hs") || 0);
      if (s.score > hs) localStorage.setItem("bunkerhain_hs", String(s.score));
    } catch { /* noop */ }
    this.onPhase("win", s);
  }

  private completeLevel1() {
    this.phase = "level-clear";
    this.audio.stopMusic();
    const s = this.stats();
    try {
      const hs = Number(localStorage.getItem("bunkerhain_hs") || 0);
      if (s.score > hs) localStorage.setItem("bunkerhain_hs", String(s.score));
    } catch { /* noop */ }
    this.onPhase("level-clear", s);
  }

  public stats(): Stats {
    return {
      level: this.currentLevel,
      kills: this.totalKills,
      shots: this.shots,
      hits: this.hits,
      maxCombo: this.maxCombo,
      score: this.score,
      timeMs: performance.now() - this.startT,
    };
  }

  public killsTotal() {
    return this.totalKills;
  }

  /* ---------------- FX Helfer ---------------- */

  private burst(x: number, y: number, size: number, kind: "burst" | "splash", tint?: string) {
    this.fxs.push({
      frame: kind === "burst" ? "starburst" : "splash",
      kind,
      x,
      y,
      t: 0,
      dur: 0.48,
      size,
      tint,
    });
  }

  private dust(x: number, y: number) {
    for (let i = 0; i < 6; i++) {
      this.parts.push({
        x: x + (Math.random() - 0.5) * 40,
        y,
        vx: (Math.random() - 0.5) * 160,
        vy: -60 - Math.random() * 120,
        g: 320,
        t: 0,
        dur: 0.6,
        size: 6,
        color: "rgba(190,190,190,0.5)",
      });
    }
  }

  private ejectShells(n: number) {
    for (let i = 0; i < n; i++) {
      this.parts.push({
        x: VW / 2 + (Math.random() - 0.5) * 60,
        y: VH - 40,
        vx: 240 + Math.random() * 260,
        vy: -420 - Math.random() * 260,
        g: 1500,
        t: 0,
        dur: 1.1,
        size: 30,
        color: "#d9b24a",
        frame: "shell",
        rot: Math.random() * Math.PI,
        vr: 8 + Math.random() * 10,
      });
    }
  }

  private showBubble(text: string, dur: number, x: number, y: number, big = false) {
    this.bubble = { text, t: 0, dur, x, y, big };
  }

  /* ---------------- Spawning & Wellen ---------------- */

  private getQuota(): number {
    if (this.currentLevel === 1) {
      return [9, 13, 17, 22][this.wave] || 15;
    } else {
      return [12, 18, 0][this.wave] || 15;
    }
  }

  private trySpawn(dt: number) {
    if (this.waveIntro > 0 || this.waveClear > 0) return;

    // Boss Phase
    if (this.bossMode) {
      if (this.currentLevel === 1) {
        if (this.bossDeadT > 0) return;
        this.spawnT -= dt;
        if (this.spawnT <= 0) {
          this.spawnT = 2.0;
          if (this.countWalkers() < 4) this.spawnMob(false);
        }
      } else {
        // Level 2 Boss: Handtaschen-Oma
        if (this.grannyDeadT > 0) return;
        this.spawnT -= dt;
        if (this.spawnT <= 0) {
          this.spawnT = 2.2;
          if (this.countWalkers() < 5) this.spawnMob(Math.random() < 0.25);
        }
      }
      return;
    }

    const quota = this.getQuota();
    if (this.kills >= quota) return;

    if (this.countWalkers() === 0) this.spawnT = Math.min(this.spawnT, 0.4);
    this.spawnT -= dt;
    if (this.spawnT <= 0) {
      this.spawnT = 1.0 + Math.random() * 0.9;
      if (this.countWalkers() < 6) {
        const isBat = (this.currentLevel === 1 && this.wave >= 2 && Math.random() < 0.22) ||
                      (this.currentLevel === 2 && Math.random() < 0.35);
        this.spawnMob(isBat);
        this.spawned++;
      }
    }
  }

  private countWalkers() {
    return this.mobs.filter((m) => m.state === "walk" && m.kind === "zombie").length;
  }

  private spawnMob(isBat: boolean) {
    if (isBat) {
      this.spawnTechnoBat();
      return;
    }

    const isCivilian = Math.random() < 0.18 && (this.wave >= 1 || this.currentLevel === 2);
    let arch: MobArchetype;
    let kind: "zombie" | "civilian" = "zombie";

    if (isCivilian) {
      kind = "civilian";
      arch = CIVILIAN_SHEETS[Math.floor(Math.random() * CIVILIAN_SHEETS.length)];
    } else {
      kind = "zombie";
      const pool = this.currentLevel === 1 ? ZOMBIE_SHEETS_L1 : ZOMBIE_SHEETS_L2;
      arch = pool[Math.floor(Math.random() * pool.length)];
    }

    const sheetKey = arch + "-gestures";
    const x0 = 240 + Math.random() * (VW - 480);
    const y0 = 420 + Math.random() * 100;
    const x1 = isCivilian
      ? (Math.random() < 0.5 ? 180 + Math.random() * 200 : VW - 380 + Math.random() * 200)
      : 220 + Math.random() * (VW - 440);
    const y1 = 860 + Math.random() * 50;

    const m: Mob = {
      id: this.mobId++,
      kind,
      archetype: arch,
      sheetKey,
      x0, y0, s0: 0.38,
      x1, y1, s1: 1.05,
      t: 0,
      speed: (0.09 + Math.random() * 0.05) * (isCivilian ? 1.3 : 1),
      swayPh: Math.random() * Math.PI * 2,
      swayAmp: 6 + Math.random() * 8,
      zigzag: !isCivilian && Math.random() < 0.3,
      state: "walk",
      dt: 0,
      elapsedSec: Math.random(),
      rect: { x: 0, y: 0, w: 0, h: 0 },
      hitRect: { x: 0, y: 0, w: 0, h: 0 },
    };
    this.mobs.push(m);
  }

  private spawnTechnoBat() {
    this.audio.batFlap();
    const fromLeft = Math.random() < 0.5;
    const x0 = fromLeft ? -100 : VW + 100;
    const y0 = 120 + Math.random() * 200;
    const x1 = fromLeft ? VW + 100 : -100;
    const y1 = 200 + Math.random() * 220;

    const m: Mob = {
      id: this.mobId++,
      kind: "bat",
      archetype: "techno-bat",
      sheetKey: "techno-bat-flight",
      x0, y0, s0: 0.5,
      x1, y1, s1: 0.9,
      t: 0,
      speed: 0.14 + Math.random() * 0.05,
      swayPh: Math.random() * Math.PI * 2,
      swayAmp: 25,
      zigzag: true,
      state: "walk",
      dt: 0,
      elapsedSec: 0,
      rect: { x: 0, y: 0, w: 0, h: 0 },
      hitRect: { x: 0, y: 0, w: 0, h: 0 },
      batAltitude: y0,
      batDiveT: 0,
    };
    this.mobs.push(m);
  }

  /* ---------------- Update-Schleife ---------------- */

  private update(dt: number) {
    if (this.paused) return;

    this.beatPulse = Math.max(0, this.beatPulse - dt * 3.2);
    this.shake = Math.max(0, this.shake - dt * 2.4);
    this.hurtFlash = Math.max(0, this.hurtFlash - dt * 1.8);
    if (this.waveIntro > 0) this.waveIntro -= dt;
    if (this.bgFade < 1) this.bgFade = Math.min(1, this.bgFade + dt * 1.4);

    // Reload
    if (this.reloading > 0) {
      this.reloading -= dt;
      if (this.reloading <= 0) {
        this.reloading = 0;
        this.ammo = 6;
        this.notifyHud();
      }
    }

    // SMG Burst-Timer
    if (this.smgBurstRemaining > 0 && this.activeWeapon === "smg") {
      this.smgBurstTimer -= dt;
      if (this.smgBurstTimer <= 0) {
        this.smgBurstTimer = WEAPON_CONFIGS.smg.burstIntervalSec || 0.08;
        this.smgBurstRemaining--;
        const res = consumeWeaponAmmo("smg", this.ammo, 1);
        this.ammo = res.newAmmo;
        this.activeWeapon = res.nextWeapon;
        this.shots++;
        this.audio.smg();
        const spreadX = this.smgTargetX + (Math.random() - 0.5) * 24;
        const spreadY = this.smgTargetY + (Math.random() - 0.5) * 24;
        this.fireSingleShot(spreadX, spreadY);
        this.notifyHud();
      }
    }

    if (this.comboT > 0) {
      this.comboT -= dt;
      if (this.comboT <= 0) this.combo = 1;
    }

    // Bubble
    if (this.bubble) {
      this.bubble.t += dt;
      if (this.bubble.t > this.bubble.dur) this.bubble = null;
    }

    this.trySpawn(dt);

    // Mobs
    for (const m of this.mobs) {
      m.elapsedSec += dt;
      m.swayPh += dt * 5;

      if (m.state === "walk") {
        m.t += m.speed * dt;
        if (m.kind === "bat") {
          // Bogenflug & Sturzflug-Telegraph
          if (m.t > 0.6 && m.t < 0.85) {
            // Sturzflug nach vorn/unten
            m.y0 += dt * 120;
          }
        }
        if (m.t >= 1) {
          m.t = 1;
          if (m.kind === "civilian") {
            m.state = "flee";
            m.dt = 0;
            this.earn(50, m.rect.x + m.rect.w / 2, m.rect.y, "#7dff5a", "+50 GAST IN SICHERHEIT");
          } else {
            m.state = "leap";
            m.dt = 0;
            this.hurt(1);
            this.earn(0, m.rect.x + m.rect.w / 2, m.rect.y, "#ff3b3b", "DURCHGEBROCHEN!");
          }
        }
      } else {
        m.dt += dt;
      }
    }
    this.mobs = this.mobs.filter((m) => {
      if (m.state === "dying") return m.dt < 0.32;
      if (m.state === "leap") return m.dt < 0.5;
      if (m.state === "flee") return m.dt < 0.6;
      return true;
    });

    // Handtaschen-Projektile updaten
    for (const p of this.projectiles) {
      const { proj, reachedTarget } = updateHandbagProjectile(p, dt);
      Object.assign(p, proj);
      if (reachedTarget && !p.isDestroyed) {
        this.hurt(1);
        this.audio.handbagImpact();
        this.burst(p.currentX, p.currentY, 320, "splash", "#ff2d78");
        this.earn(0, p.currentX, p.currentY, "#ff3b3b", "OMA HAT GETROFFEN!");
      }
    }
    this.projectiles = this.projectiles.filter((p) => !p.dealtDamage && !p.isDestroyed);

    // Welle geschafft?
    if (!this.bossMode && this.waveClear <= 0 && this.waveIntro <= 0) {
      const quota = this.getQuota();
      if (this.kills >= quota && this.countWalkers() === 0) {
        this.waveClear = 1.6;
        this.audio.starPing();
      }
    }
    if (this.waveClear > 0) {
      this.waveClear -= dt;
      if (this.waveClear <= 0) this.nextWave();
    }

    // Pickups bewegen
    for (const p of this.pickups) {
      p.t += dt;
      p.y += p.vy * dt;
    }
    this.pickups = this.pickups.filter((p) => p.y < VH + 60);

    // Sterne
    this.starT -= dt;
    if (this.starT <= 0) {
      this.starT = 8 + Math.random() * 6;
      this.stars.push({
        x: 240 + Math.random() * (VW - 480),
        y: -60,
        vy: 52 + Math.random() * 30,
        t: 0,
      });
    }
    for (const s of this.stars) { s.y += s.vy * dt; s.t += dt; }
    this.stars = this.stars.filter((s) => s.y < VH + 80);

    // Boss Updates
    if (this.bossMode) {
      if (this.currentLevel === 1) this.updateBossL1(dt);
      else this.updateBossL2(dt);
    }

    // FX, Partikel, Floater
    for (const p of this.parts) {
      p.t += dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vy += p.g * dt;
      if (p.rot !== undefined && p.vr) p.rot += p.vr * dt;
    }
    this.parts = this.parts.filter((p) => p.t < p.dur && p.y < VH + 120);

    for (const f of this.fxs) f.t += dt;
    this.fxs = this.fxs.filter((f) => f.t < f.dur);

    for (const f of this.floaters) { f.t += dt; f.y -= 52 * dt; }
    this.floaters = this.floaters.filter((f) => f.t < f.dur);

    for (const d of this.decals) d.t += dt;
    this.decals = this.decals.filter((d) => d.t < 2.6);

    this.bossFlash = Math.max(0, this.bossFlash - dt * 5);
    this.grannyFlash = Math.max(0, this.grannyFlash - dt * 5);
  }

  private nextWave() {
    this.kills = 0;
    this.spawned = 0;
    this.spawnT = 2.0;

    const maxRegularWaves = this.currentLevel === 1 ? 4 : 2;
    if (this.wave + 1 >= maxRegularWaves) {
      // Boss-Welle startet!
      this.bossMode = true;
      this.prevBg = this.wave;
      this.bgFade = 0;
      this.waveIntro = 3.2;

      if (this.currentLevel === 1) {
        this.audio.roar();
        this.showBubble(
          "BETONTROLL BRICHT AUS! Holt er aus — ZWEI Treffer in die Mitte, sonst platt!",
          5,
          VW / 2,
          200,
          true,
        );
      } else {
        this.audio.roar();
        this.showBubble(
          "HANDTASCHEN-OMA GREIFT AN! Passt auf die fliegenden Taschen auf — abschießbar!",
          5,
          VW / 2,
          200,
          true,
        );
      }
      return;
    }

    this.wave++;
    this.prevBg = this.wave - 1;
    this.bgFade = 0;
    this.waveIntro = 2.6;

    // Garantiertes Powerup pro Welle
    this.spawnWavePickup();

    const intro = this.currentLevel === 1
      ? BG_SOURCES_L1[this.wave].label
      : BG_SOURCES_L2[this.wave].label;
    this.showBubble(intro, 3.8, VW / 2, 200, true);
  }

  private spawnWavePickup() {
    let type: PickupType = "health";
    if (this.currentLevel === 1) {
      if (this.wave === 1) type = "health";
      else if (this.wave === 2) type = "shotgun";
      else if (this.wave === 3) type = "smg";
    } else {
      if (this.wave === 1) type = "bass-cannon";
      else if (this.wave === 2) type = "shield";
    }

    const typeIndices: Record<PickupType, number> = {
      health: 0,
      ammo: 1,
      shotgun: 2,
      smg: 3,
      "bass-cannon": 4,
      shield: 5,
    };

    this.pickups.push({
      id: this.pickupId++,
      type,
      frameIndex: typeIndices[type],
      x: 320 + Math.random() * (VW - 640),
      y: -50,
      vy: 42 + Math.random() * 25,
      t: 0,
      scale: 0.28,
      radius: 55,
    });
  }

  private updateBossL1(dt: number) {
    this.bossSwayPh += dt * 1.4;
    this.bossX = VW / 2 + Math.sin(this.bossSwayPh) * 90;
    if (this.bossDeadT > 0) {
      this.bossDeadT -= dt;
      if (this.bossDeadT <= 0) {
        this.completeLevel1();
        this.bossDeadT = 999;
      }
      return;
    }
    if (this.bossLungeT > 0) {
      this.bossLungeT -= dt;
      if (this.bossLungeT <= 0) {
        if (this.bossHitGot < this.bossHitNeed) {
          this.hurt(1);
          this.showBubble("ER HAT DICH ERWISCHT! Ballern, wenn er ausholt!", 2.6, VW / 2, 230);
        } else {
          this.earn(120, this.bossX, this.bossY - 460, "#7dff5a", "ABGEWEHRT!");
        }
        this.bossFrame = "bouncerIdle";
        this.bossAttackT = 5 + Math.random() * 2.5;
        this.bossHitGot = 0;
      }
      return;
    }
    this.bossAttackT -= dt;
    if (this.bossAttackT <= 0) {
      this.bossLungeT = 1.5;
      this.bossHitGot = 0;
      this.bossHitNeed = 2;
      this.bossFrame = "bouncerAttack";
      this.audio.roar();
      this.showBubble("ER HOLT AUS — 2× TREFFEN!", 1.4, VW / 2, 250);
    }
    this.tauntT -= dt;
    if (this.tauntT <= 0) {
      this.tauntT = 6.5 + Math.random() * 3;
      this.showBubble(BOSS_TAUNTS_L1[Math.floor(Math.random() * BOSS_TAUNTS_L1.length)], 2.4, this.bossX - 240, 170);
    }
  }

  private updateBossL2(dt: number) {
    this.bossSwayPh += dt * 1.2;
    this.grannyX = VW / 2 + Math.sin(this.bossSwayPh) * 80;

    if (this.grannyDeadT > 0) {
      this.grannyDeadT -= dt;
      if (this.grannyDeadT <= 0) {
        this.winGame();
        this.grannyDeadT = 999;
      }
      return;
    }

    this.grannyStateTimer += dt;

    if (this.grannyPose === "idle") {
      this.grannyAttackCooldown -= dt;
      if (this.grannyAttackCooldown <= 0) {
        // Windup: ausholen für mindestens 0.7s
        this.grannyPose = "windup";
        this.grannyStateTimer = 0;
        this.audio.scream();
        this.showBubble("ICH ZEIG DIR MEINE TASCHE!", 1.5, this.grannyX - 220, 260);
      }
    } else if (this.grannyPose === "windup") {
      if (this.grannyStateTimer >= 0.85) {
        // Release: Hände sind nun leer, Projektil fliegt los!
        this.grannyPose = "release";
        this.grannyStateTimer = 0;
        this.audio.handbagThrow();
        // Handtaschen-Projektil abfeuern
        const targetX = 320 + Math.random() * (VW - 640);
        const targetY = VH - 80;
        const proj = createHandbagProjectile(
          this.projectileId++,
          this.grannyX,
          this.grannyY - 260,
          targetX,
          targetY,
          1.75,
        );
        this.projectiles.push(proj);
      }
    } else if (this.grannyPose === "release") {
      if (this.grannyStateTimer >= 0.3) {
        // Recovery: Verwundbarkeitsfenster
        this.grannyPose = "recovery";
        this.grannyStateTimer = 0;
      }
    } else if (this.grannyPose === "recovery") {
      if (this.grannyStateTimer >= 1.2) {
        this.grannyPose = "idle";
        this.grannyStateTimer = 0;
        this.grannyAttackCooldown = 4.0 + Math.random() * 2.0;
      }
    }

    this.tauntT -= dt;
    if (this.tauntT <= 0) {
      this.tauntT = 6 + Math.random() * 3;
      this.showBubble(BOSS_TAUNTS_L2[Math.floor(Math.random() * BOSS_TAUNTS_L2.length)], 2.5, this.grannyX - 240, 220);
    }
  }

  /* ---------------- Rendering ---------------- */

  private loop = () => {
    if (!this.running) return;
    const now = performance.now();
    const dt = Math.min(0.05, (now - this.last) / 1000);
    this.last = now;

    if (!this.paused) {
      this.update(dt);
    }
    this.render();
    this.raf = requestAnimationFrame(this.loop);
  };

  private begin2d() {
    const c = this.ctx;
    c.setTransform(1, 0, 0, 1, 0, 0);
    c.clearRect(0, 0, this.cv.width, this.cv.height);
    c.fillStyle = "#07060a";
    c.fillRect(0, 0, this.cv.width, this.cv.height);
    c.setTransform(this.scale, 0, 0, this.scale, this.ox, this.oy);
  }

  private drawBg() {
    const c = this.ctx;
    const bgs = this.currentLevel === 1 ? this.a.bgs : this.a.bgsL2;
    const maxIdx = bgs.length - 1;
    const idx = this.bossMode ? maxIdx : Math.min(this.wave, maxIdx);
    const pulse = 1 + (this.settings.reducedMotion ? 0 : this.beatPulse * 0.012 + this.shake * 0.004);
    const sx = this.settings.reducedMotion ? 0 : (Math.random() - 0.5) * this.shake * 26;
    const sy = this.settings.reducedMotion ? 0 : (Math.random() - 0.5) * this.shake * 20;

    const img = bgs[idx] || bgs[0];
    if (img) {
      const w = img.width * pulse, h = img.height * pulse;
      c.drawImage(img, (VW - w) / 2 + sx, (VH - h) / 2 + sy, w, h);
    }

    if (this.prevBg >= 0 && this.bgFade < 1 && bgs[this.prevBg]) {
      c.globalAlpha = 1 - this.bgFade;
      c.drawImage(bgs[this.prevBg], sx, sy, VW, VH);
      c.globalAlpha = 1;
    }

    // Strobo-Effekt nur wenn in den Einstellungen explizit aktiv
    if (this.settings.stroboEnabled && this.bossMode && this.bossLungeT > 0) {
      c.fillStyle = `rgba(255,30,60,${0.14 + Math.sin(performance.now() / 350) * 0.06})`;
      c.fillRect(0, 0, VW, VH);
    }
  }

  private drawAnimatedMob(m: Mob) {
    const c = this.ctx;
    const sheetMeta: SheetMeta | undefined = EXPANSION_SHEETS[m.sheetKey];
    const sheetImg = this.a.sheets[m.sheetKey];

    if (!sheetMeta || !sheetImg) return;

    // Berechne Frame-Index basierend auf Mob-Zustand & Typ
    let frameIdx = 0;
    if (m.kind === "bat") {
      // 4 Flügelschlagphasen bei ~9 fps
      frameIdx = Math.floor(m.elapsedSec * 9) % 4;
    } else if (m.kind === "civilian") {
      if (m.state === "walk") {
        frameIdx = getPingPongFrame(m.elapsedSec, [0, 1], 4);
      } else if (m.state === "flee") {
        frameIdx = 3; // escape
      }
    } else {
      // Zombie
      if (m.state === "walk") {
        frameIdx = getFrameIndexFromTime(m.elapsedSec, { frames: [0, 1], fps: 6, loop: true });
      } else if (m.state === "leap") {
        frameIdx = 2; // attack
      } else if (m.state === "dying") {
        frameIdx = 3; // hit
      }
    }

    const frameDef = sheetMeta.frames[frameIdx] || sheetMeta.frames[0];
    const baseRefH = sheetMeta.referencePixels?.height || 627;

    // Welt-Position
    let x = m.x0 + (m.x1 - m.x0) * m.t;
    const y = m.y0 + (m.y1 - m.y0) * m.t;
    let hFrac = m.s0 + (m.s1 - m.s0) * m.t;

    if (m.zigzag) x += Math.sin(m.t * Math.PI * 3 + m.swayPh) * 90;
    const beatHop = (!this.settings.reducedMotion && m.kind === "zombie") ? this.beatPulse * 6 * hFrac : 0;

    let targetWorldH = (m.kind === "bat" ? 220 : 520) * hFrac;
    if (m.state === "leap") targetWorldH *= 1.15;

    // Quellpixel-zu-Welt-Skalierungsfaktor ist IDENTISCH über alle Frames!
    const worldScale = targetWorldH / baseRefH;
    const dw = frameDef.rect.w * worldScale;
    const dh = frameDef.rect.h * worldScale;

    // Fußpunkt- / Pivot-Offset
    const screenX = x - frameDef.pivot.x * worldScale;
    const screenY = (y + beatHop) - frameDef.pivot.y * worldScale;

    let alpha = 1;
    if (m.state === "dying") alpha = Math.max(0, 1 - m.dt / 0.32);
    if (m.state === "flee") alpha = Math.max(0, 1 - m.dt / 0.6);

    c.save();
    c.globalAlpha = alpha;

    // Schatten am Boden (außer fliegende Fledermäuse)
    if (m.kind !== "bat") {
      c.save();
      c.globalAlpha = 0.32 * alpha;
      c.fillStyle = "#000";
      c.beginPath();
      c.ellipse(x, y + 2, dw * 0.38, dh * 0.045, 0, 0, Math.PI * 2);
      c.fill();
      c.restore();
    }

    // Zeichnen
    c.drawImage(
      sheetImg,
      frameDef.rect.x, frameDef.rect.y, frameDef.rect.w, frameDef.rect.h,
      screenX, screenY, dw, dh,
    );
    c.restore();

    m.rect = { x: screenX, y: screenY, w: dw, h: dh };
    // Hitbox verwendet dieselbe Transformation und die transparenten ContentBounds
    m.hitRect = {
      x: screenX + frameDef.bounds.x * worldScale,
      y: screenY + frameDef.bounds.y * worldScale,
      w: frameDef.bounds.w * worldScale,
      h: frameDef.bounds.h * worldScale,
    };
  }

  private drawBossL1() {
    if (!this.bossMode || this.waveIntro > 0) return;
    const flash = this.bossFlash;
    const f = CHAR_FRAMES[this.bossFrame];
    const baseH = this.bossFrame === "bouncerIdle" ? 700 : 640;
    const h = baseH * (this.bossLungeT > 0 ? 1.16 : 1);
    const feetY = this.bossY + (this.bossLungeT > 0 ? 60 : 0) + Math.sin(this.bossSwayPh * 2) * 6;
    const c = this.ctx;

    c.save();
    c.globalAlpha = 0.4;
    c.fillStyle = "#000";
    c.beginPath();
    c.ellipse(this.bossX, feetY + 6, (h * f.w / f.h) * 0.44, h * 0.05, 0, 0, Math.PI * 2);
    c.fill();
    c.restore();

    const sc = h / f.h;
    const dw = f.w * sc, dh = f.h * sc;
    const sx = this.bossX - dw / 2, sy = feetY - dh;

    c.drawImage(this.a.chars, f.x, f.y, f.w, f.h, sx, sy, dw, dh);

    if (flash > 0) {
      c.save();
      c.globalCompositeOperation = "lighter";
      c.globalAlpha = flash * 0.55;
      c.drawImage(this.a.chars, f.x, f.y, f.w, f.h, sx, sy, dw, dh);
      c.restore();
    }

    if (this.bossLungeT > 0) {
      const need = this.bossHitNeed - this.bossHitGot;
      this.drawUi("crosshair", this.bossX, feetY - h * 0.55, 190, 0.95, performance.now() / 300);
      c.save();
      c.font = "900 52px Impact, sans-serif";
      c.textAlign = "center";
      c.fillStyle = need > 0 ? "#ffd23f" : "#7dff5a";
      c.strokeStyle = "#000"; c.lineWidth = 8;
      const label = need > 0 ? `NOCH ${need}× !` : "REICHT!";
      c.strokeText(label, this.bossX, feetY - h - 30);
      c.fillText(label, this.bossX, feetY - h - 30);
      c.restore();
    }
  }

  private drawBossL2() {
    if (!this.bossMode || this.waveIntro > 0) return;
    const sheetMeta = EXPANSION_SHEETS["granny-handbag-attack"];
    const sheetImg = this.a.sheets["granny-handbag-attack"];
    if (!sheetMeta || !sheetImg) return;

    const poseIndices = { idle: 0, windup: 1, release: 2, recovery: 3 };
    const frameDef = sheetMeta.frames[poseIndices[this.grannyPose]];

    const baseRefH = sheetMeta.referencePixels?.height || 627;
    const targetH = 680;
    const worldScale = targetH / baseRefH;
    const dw = frameDef.rect.w * worldScale;
    const dh = frameDef.rect.h * worldScale;

    const screenX = this.grannyX - frameDef.pivot.x * worldScale;
    const screenY = this.grannyY - frameDef.pivot.y * worldScale;

    const c = this.ctx;

    // Schatten
    c.save();
    c.globalAlpha = 0.4;
    c.fillStyle = "#000";
    c.beginPath();
    c.ellipse(this.grannyX, this.grannyY + 4, dw * 0.4, 30, 0, 0, Math.PI * 2);
    c.fill();
    c.restore();

    c.drawImage(
      sheetImg,
      frameDef.rect.x, frameDef.rect.y, frameDef.rect.w, frameDef.rect.h,
      screenX, screenY, dw, dh,
    );

    if (this.grannyFlash > 0) {
      c.save();
      c.globalCompositeOperation = "lighter";
      c.globalAlpha = this.grannyFlash * 0.6;
      c.drawImage(
        sheetImg,
        frameDef.rect.x, frameDef.rect.y, frameDef.rect.w, frameDef.rect.h,
        screenX, screenY, dw, dh,
      );
      c.restore();
    }

    if (this.grannyPose === "windup") {
      this.drawUi("crosshair", this.grannyX, this.grannyY - dh * 0.55, 170, 0.9, performance.now() / 250);
    }
  }

  private drawHandbags() {
    const sheetMeta = EXPANSION_SHEETS["handbag-projectile-spin"];
    const sheetImg = this.a.sheets["handbag-projectile-spin"];
    if (!sheetMeta || !sheetImg) return;

    const c = this.ctx;
    for (const p of this.projectiles) {
      if (p.isDestroyed || p.dealtDamage) continue;
      const frameDef = sheetMeta.frames[p.frameIndex] || sheetMeta.frames[0];
      const baseRefH = sheetMeta.referencePixels?.height || 620;
      const targetH = 180 * p.scale;
      const worldScale = targetH / baseRefH;
      const dw = frameDef.rect.w * worldScale;
      const dh = frameDef.rect.h * worldScale;

      c.save();
      c.translate(p.currentX, p.currentY);
      c.rotate(p.rotation);
      c.drawImage(
        sheetImg,
        frameDef.rect.x, frameDef.rect.y, frameDef.rect.w, frameDef.rect.h,
        -dw / 2, -dh / 2, dw, dh,
      );
      c.restore();
    }
  }

  private drawPickups() {
    const sheetMeta = EXPANSION_SHEETS["powerups-weapons-atlas"];
    const sheetImg = this.a.sheets["powerups-weapons-atlas"];
    if (!sheetMeta || !sheetImg) return;

    const c = this.ctx;
    for (const p of this.pickups) {
      const frameDef = sheetMeta.frames[p.frameIndex] || sheetMeta.frames[0];
      const bob = Math.sin(p.t * 4) * 6;
      const dw = frameDef.rect.w * p.scale;
      const dh = frameDef.rect.h * p.scale;

      // Schein
      c.save();
      c.globalAlpha = 0.4 + Math.sin(p.t * 5) * 0.2;
      const g = c.createRadialGradient(p.x, p.y + bob, 10, p.x, p.y + bob, p.radius * 1.3);
      g.addColorStop(0, "rgba(255,210,63,0.8)");
      g.addColorStop(1, "rgba(255,210,63,0)");
      c.fillStyle = g;
      c.beginPath();
      c.arc(p.x, p.y + bob, p.radius * 1.3, 0, Math.PI * 2);
      c.fill();
      c.restore();

      c.drawImage(
        sheetImg,
        frameDef.rect.x, frameDef.rect.y, frameDef.rect.w, frameDef.rect.h,
        p.x - dw / 2, p.y + bob - dh / 2, dw, dh,
      );
    }
  }

  private drawUi(frame: UiFrame, cx: number, cy: number, h: number, alpha = 1, rot = 0) {
    const c = this.ctx;
    const f = UI_FRAMES[frame];
    const sc = h / f.h;
    c.save();
    c.globalAlpha = alpha;
    c.translate(cx, cy);
    if (rot) c.rotate(rot);
    c.drawImage(this.a.ui, f.x, f.y, f.w, f.h, -(f.w * sc) / 2, -(f.h * sc) / 2, f.w * sc, f.h * sc);
    c.restore();
  }

  private render() {
    const c = this.ctx;
    this.begin2d();
    this.drawBg();

    // Mobs nach Tiefe sortiert
    const drawList = [...this.mobs].sort((p, q) => p.t - q.t);
    for (const m of drawList) this.drawAnimatedMob(m);

    // Boss
    if (this.bossMode) {
      if (this.currentLevel === 1) this.drawBossL1();
      else this.drawBossL2();
    }

    // Handtaschen
    this.drawHandbags();

    // Pickups
    this.drawPickups();

    // Sterne
    for (const s of this.stars) {
      const puls = 1 + Math.sin(s.t * 6) * 0.12;
      this.drawUi("star", s.x, s.y, 82 * puls, 0.95, s.t * 0.8);
    }

    // Decals
    for (const d of this.decals) {
      const a = Math.max(0, 1 - d.t / 2.6) * 0.8;
      this.drawUi("crosshair", d.x, d.y, 56 + d.t * 26, a, d.t * 1.2);
    }

    // Bursts / Splashes
    for (const f of this.fxs) {
      const k = f.t / f.dur;
      if (f.kind === "bass-wave") {
        // Schallwelle
        c.save();
        c.globalAlpha = Math.max(0, 1 - k) * 0.75;
        c.strokeStyle = "#7dff5a";
        c.lineWidth = 14 * (1 - k);
        c.beginPath();
        c.arc(f.x, f.y, (f.radius || 320) * k, 0, Math.PI * 2);
        c.stroke();
        c.restore();
      } else {
        const size = f.size * (0.6 + k * 0.9);
        const alpha = k < 0.15 ? k / 0.15 : 1 - (k - 0.15) / 0.85;
        if (f.frame) {
          this.drawUi(f.frame, f.x, f.y, size, Math.max(0, alpha), f.kind === "splash" ? f.t * 2 : k * 1.5);
        }
      }
    }

    // Partikel
    for (const p of this.parts) {
      const a = Math.max(0, 1 - p.t / p.dur);
      if (p.frame) {
        this.drawUi(p.frame, p.x, p.y, p.size, a, p.rot ?? 0);
      } else {
        c.save();
        c.globalAlpha = a;
        c.fillStyle = p.color;
        c.beginPath(); c.arc(p.x, p.y, p.size * (0.6 + 0.4 * a), 0, Math.PI * 2); c.fill();
        c.restore();
      }
    }

    // Schaden-Vignette
    if (this.hurtFlash > 0 && !this.settings.reducedMotion) {
      const g = c.createRadialGradient(VW / 2, VH / 2, VH * 0.3, VW / 2, VH / 2, VH * 0.9);
      g.addColorStop(0, "rgba(255,0,60,0)");
      g.addColorStop(1, `rgba(255,0,60,${0.5 * this.hurtFlash})`);
      c.fillStyle = g;
      c.fillRect(0, 0, VW, VH);
    }

    this.drawFloaters();
    this.drawHud();
    if (this.bubble) this.drawBubble(this.bubble);
    this.drawWaveBanner();
    this.drawCrosshair();
  }

  private drawFloaters() {
    const c = this.ctx;
    for (const f of this.floaters) {
      const k = f.t / f.dur;
      const a = k < 0.1 ? k / 0.1 : 1 - Math.max(0, (k - 0.55) / 0.45);
      c.save();
      c.globalAlpha = Math.max(0, a);
      c.font = `900 ${f.size}px Impact, sans-serif`;
      c.textAlign = "center";
      c.lineWidth = 7; c.strokeStyle = "rgba(0,0,0,0.85)";
      c.strokeText(f.text, f.x, f.y);
      c.fillStyle = f.color;
      c.fillText(f.text, f.x, f.y);
      c.restore();
    }
  }

  private drawHud() {
    const c = this.ctx;
    const pad = 28;

    // 1. Bis zu 5 Herzen (MAX_HEARTS = 5)
    for (let i = 0; i < MAX_HEARTS; i++) {
      const full = i < this.hearts;
      const pulseH = 54 + (full ? this.beatPulse * 6 : 0);
      this.drawUi(full ? "heartFull" : "heartEmpty", pad + 30 + i * 62, 44, pulseH, full ? 1 : 0.45);
    }

    // Schild-Anzeige
    if (this.hasShield) {
      c.save();
      c.font = "900 20px Impact, sans-serif";
      c.fillStyle = "#ff2d78";
      c.strokeStyle = "#000"; c.lineWidth = 5;
      c.strokeText("SCHILD AKTIV", pad + 26, 88);
      c.fillText("SCHILD AKTIV", pad + 26, 88);
      c.restore();
    }

    // 2. Score + Combo
    this.drawUi("skull", VW - 64, 58, 80);
    c.save();
    c.textAlign = "right";
    c.font = "900 46px Impact, sans-serif";
    c.lineWidth = 8; c.strokeStyle = "rgba(0,0,0,0.9)";
    const sc = String(this.score).padStart(6, "0");
    c.strokeText(sc, VW - 116, 62);
    c.fillStyle = "#eaffea";
    c.fillText(sc, VW - 116, 62);
    if (this.combo > 1) {
      c.font = "900 28px Impact, sans-serif";
      c.strokeText(`COMBO ×${this.combo}`, VW - 116, 98);
      c.fillStyle = this.combo >= 5 ? "#ffd23f" : "#ff2d78";
      c.fillText(`COMBO ×${this.combo}`, VW - 116, 98);
    }
    c.restore();

    // 3. Waffe & Munition
    c.save();
    c.font = "900 24px Impact, sans-serif";
    c.fillStyle = "#ffd23f";
    c.lineWidth = 5; c.strokeStyle = "#000";
    const wName = WEAPON_CONFIGS[this.activeWeapon].name.toUpperCase();
    c.strokeText(wName, pad + 20, VH - 78);
    c.fillText(wName, pad + 20, VH - 78);

    if (this.activeWeapon === "bass-cannon") {
      c.font = "700 16px sans-serif";
      c.fillStyle = "#7dff5a";
      c.strokeText("SCHALLPULS: ZIVILISTEN BLEIBEN SICHER!", pad + 20, VH - 105);
      c.fillText("SCHALLPULS: ZIVILISTEN BLEIBEN SICHER!", pad + 20, VH - 105);
    }
    c.restore();

    // Munitionsanzeige
    if (this.activeWeapon === "pistol") {
      for (let i = 0; i < 6; i++) {
        const full = i < this.ammo;
        const x = pad + 26 + i * 36, y = VH - 44;
        this.drawUi("bullet", x, y, 58, full ? 1 : 0.2);
      }
      if (this.reloading > 0) {
        c.save();
        c.font = "900 22px Impact, sans-serif";
        c.fillStyle = "#ffd23f";
        c.lineWidth = 5; c.strokeStyle = "#000";
        c.strokeText("LADE NACH…", pad + 260, VH - 44);
        c.fillText("LADE NACH…", pad + 260, VH - 44);
        c.restore();
      }
    } else {
      c.save();
      c.font = "900 32px Impact, sans-serif";
      c.fillStyle = "#ffffff";
      c.lineWidth = 6; c.strokeStyle = "#000";
      const ammoStr = `VORRAT: ${this.ammo} / ${WEAPON_CONFIGS[this.activeWeapon].maxAmmo}`;
      c.strokeText(ammoStr, pad + 20, VH - 40);
      c.fillText(ammoStr, pad + 20, VH - 40);
      c.restore();
    }

    // 4. Boss-HP oder Wellen-Fortschritt
    if (this.bossMode) {
      const bw = 540, bh = 120;
      const f = UI_FRAMES.barFull;
      this.ctx.drawImage(this.a.ui, f.x, f.y, f.w, f.h, VW / 2 - bw / 2, 26, bw, bh);

      const hpRatio = this.currentLevel === 1
        ? Math.max(0, this.bossHp / this.bossHpMax)
        : Math.max(0, this.grannyHp / this.grannyHpMax);

      c.save();
      c.fillStyle = hpRatio > 0.4 ? "#9bff57" : "#ff2d78";
      c.fillRect(VW / 2 - bw * 0.395, 26 + bh * 0.415, bw * 0.79 * hpRatio, bh * 0.22);
      c.restore();

      c.save();
      c.textAlign = "center";
      c.font = "900 24px Impact, sans-serif";
      c.lineWidth = 6; c.strokeStyle = "rgba(0,0,0,0.9)";
      const bTitle = this.currentLevel === 1 ? "BETONTROLL" : "HANDTASCHEN-OMA";
      c.strokeText(bTitle, VW / 2, 26 + bh + 20);
      c.fillStyle = "#ffb1cf";
      c.fillText(bTitle, VW / 2, 26 + bh + 20);
      c.restore();
    } else {
      const bw = 400, bh = 90;
      const f = UI_FRAMES.barOk;
      this.ctx.drawImage(this.a.ui, f.x, f.y, f.w, f.h, VW / 2 - bw / 2, VH - 110, bw, bh);
      const quota = this.getQuota();
      const p = Math.min(1, this.kills / (quota || 1));
      c.save();
      c.fillStyle = "rgba(155,255,87,0.9)";
      c.fillRect(VW / 2 - bw * 0.395, VH - 110 + bh * 0.415, bw * 0.79 * p, bh * 0.22);
      c.restore();
      c.save();
      c.textAlign = "center";
      c.font = "900 20px Impact, sans-serif";
      c.lineWidth = 5; c.strokeStyle = "rgba(0,0,0,0.9)";
      const wLabel = this.currentLevel === 1
        ? `${BG_SOURCES_L1[this.wave]?.label || ""} · ${this.kills}/${quota}`
        : `${BG_SOURCES_L2[this.wave]?.label || ""} · ${this.kills}/${quota}`;
      c.strokeText(wLabel, VW / 2, VH - 14);
      c.fillStyle = "#c8ffb1";
      c.fillText(wLabel, VW / 2, VH - 14);
      c.restore();
    }
  }

  private drawBubble(b: Bubble) {
    const c = this.ctx;
    const inK = Math.min(1, b.t / 0.22);
    const outK = Math.min(1, Math.max(0, (b.dur - b.t) / 0.3));
    const k = Math.min(inK, outK);
    const w = b.big ? 560 : 460;
    const h = w * (UI_FRAMES.speech.h / UI_FRAMES.speech.w);
    c.save();
    c.globalAlpha = k;
    c.translate(b.x, b.y);
    c.scale(0.8 + 0.2 * k, 0.8 + 0.2 * k);
    this.drawUi("speech", 0, 0, h, 1);
    c.font = `700 ${b.big ? 24 : 20}px sans-serif`;
    c.textAlign = "center";
    c.fillStyle = "#141414";

    const words = b.text.split(" ");
    const lines: string[] = [];
    let line = "";
    for (const wd of words) {
      const t2 = line ? line + " " + wd : wd;
      if (c.measureText(t2).width > w * 0.62) { lines.push(line); line = wd; }
      else line = t2;
    }
    if (line) lines.push(line);
    const lh = b.big ? 30 : 26;
    const y0 = -((lines.length - 1) * lh) / 2 - 8;
    lines.forEach((l, i) => c.fillText(l, 0, y0 + i * lh + 8));
    c.restore();
  }

  private drawWaveBanner() {
    if (this.waveIntro <= 0 && this.waveClear <= 0) return;
    const c = this.ctx;
    if (this.waveIntro > 0) {
      const fade = this.waveIntro > 2.3 ? (2.8 - this.waveIntro) / 0.5 : Math.min(1, this.waveIntro / 0.5);
      c.save();
      c.globalAlpha = Math.min(1, fade) * 0.85;
      c.fillStyle = "#000";
      c.fillRect(0, 0, VW, VH);
      c.globalAlpha = Math.min(1, fade);
      const name = this.bossMode
        ? (this.currentLevel === 1 ? "ENDGEGNER · DER BETONTROLL" : "MINI-BOSS · DIE HANDTASCHEN-OMA")
        : (this.currentLevel === 1 ? BG_SOURCES_L1[this.wave]?.label : BG_SOURCES_L2[this.wave]?.label);
      c.textAlign = "center";
      c.translate(VW / 2, VH / 2);
      c.font = "900 84px Impact, sans-serif";
      c.lineWidth = 14; c.strokeStyle = "#000";
      c.strokeText(name || "", 0, 0);
      c.fillStyle = "#7dff5a";
      c.fillText(name || "", 0, 0);
      c.restore();
    }
    if (this.waveClear > 0) {
      const fade = Math.min(1, this.waveClear / 0.4);
      c.save();
      c.globalAlpha = fade;
      c.textAlign = "center";
      c.font = "900 108px Impact, sans-serif";
      c.lineWidth = 18; c.strokeStyle = "#000";
      c.strokeText("SAUBER!", VW / 2, VH / 2 + 20);
      c.fillStyle = "#7dff5a";
      c.fillText("SAUBER!", VW / 2, VH / 2 + 20);
      c.restore();
    }
  }

  private drawCrosshair() {
    if (!this.pointerIn || this.phase !== "play") return;
    const puls = 1 + (this.settings.reducedMotion ? 0 : this.beatPulse * 0.16);
    const size = this.reloading > 0 ? 44 : 64;
    this.drawUi("crosshair", this.mx, this.my, size * puls, 0.96, 0);
    const c = this.ctx;
    c.save();
    c.fillStyle = "#ff2d78";
    c.beginPath(); c.arc(this.mx, this.my, 3.2, 0, Math.PI * 2); c.fill();
    c.restore();
  }
}
