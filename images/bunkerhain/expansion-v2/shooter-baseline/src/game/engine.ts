import {
  Assets, BG_SOURCES, CHAR_FRAMES, UI_FRAMES, VW, VH,
  CharFrame, UiFrame, FrameRect,
} from "./assets";
import { BunkerAudio } from "./audio";

/* ------------------------------------------------ Typen --- */

interface Mob {
  id: number; kind: "zombie" | "human";
  frame: CharFrame;
  x0: number; y0: number; s0: number;
  x1: number; y1: number; s1: number;
  t: number; speed: number;
  swayPh: number; swayAmp: number; zigzag: boolean;
  state: "walk" | "dying" | "leap" | "flee";
  dt: number; // state timer
  rect: { x: number; y: number; w: number; h: number };
}

interface Particle {
  x: number; y: number; vx: number; vy: number; g: number;
  t: number; dur: number; size: number; color: string;
  frame?: UiFrame; rot?: number; vr?: number;
}

interface Fx { frame: UiFrame | CharFrame | null; kind: "burst" | "splash" | "shock"; x: number; y: number; t: number; dur: number; size: number; tint?: string; }
interface Floater { text: string; x: number; y: number; t: number; dur: number; color: string; size: number; }
interface Decal { x: number; y: number; t: number; }
interface Star { x: number; y: number; vy: number; t: number; }
interface Bubble { text: string; t: number; dur: number; x: number; y: number; big?: boolean; }

export interface Stats { kills: number; shots: number; hits: number; maxCombo: number; score: number; timeMs: number; }

type Phase = "idle" | "play" | "over" | "win";

const ZFR: CharFrame[] = ["zombieA", "zombieB", "zombieC", "zombieD"];
const HFR: CharFrame[] = ["humanF", "humanM"];

interface WaveCfg {
  bg: number; name: string; quota: number;
  spawnMin: number; spawnMax: number; maxActive: number;
  speedMin: number; speedMax: number; humanP: number; zigzagP: number;
  spawnZones: { x: [number, number]; y: [number, number]; s: number }[];
  front: { x: [number, number]; y: [number, number]; s: number };
  intro: string; boss?: false;
}

const WAVES: WaveCfg[] = [
  {
    bg: 0, name: "WELLE 1 · DIE SCHLANGE", quota: 9,
    spawnMin: 1.3, spawnMax: 2.0, maxActive: 4, speedMin: 0.075, speedMax: 0.105,
    humanP: 0, zigzagP: 0,
    spawnZones: [{ x: [170, 430], y: [655, 715], s: 0.42 }],
    front: { x: [380, 1480], y: [878, 912], s: 1.05 },
    intro: "Sie klettern aus dem Kanal. Kein Stempel, kein Einlass — FEUER FREI!",
  },
  {
    bg: 1, name: "WELLE 2 · DIE TÜR", quota: 13,
    spawnMin: 1.0, spawnMax: 1.6, maxActive: 5, speedMin: 0.09, speedMax: 0.125,
    humanP: 0.16, zigzagP: 0.1,
    spawnZones: [{ x: [750, 940], y: [495, 560], s: 0.3 }],
    front: { x: [260, 1440], y: [878, 910], s: 1.1 },
    intro: "Zombie-Stau im Flur! Aber Achtung: echte Gäste dazwischen — NIEMALS auf Menschen schießen!",
  },
  {
    bg: 2, name: "WELLE 3 · DIE GARDEROBE", quota: 17,
    spawnMin: 0.85, spawnMax: 1.4, maxActive: 6, speedMin: 0.1, speedMax: 0.14,
    humanP: 0.18, zigzagP: 0.35,
    spawnZones: [
      { x: [70, 300], y: [465, 535], s: 0.5 },
      { x: [1370, 1610], y: [465, 535], s: 0.5 },
    ],
    front: { x: [320, 1380], y: [852, 906], s: 1.05 },
    intro: "Garderobe: Jacken abgeben, Hirne behalten. Hinter den Ständern schleichen sie sich an!",
  },
  {
    bg: 3, name: "WELLE 4 · DER FLOOR", quota: 22,
    spawnMin: 0.65, spawnMax: 1.1, maxActive: 8, speedMin: 0.11, speedMax: 0.16,
    humanP: 0.15, zigzagP: 0.4,
    spawnZones: [
      { x: [60, 260], y: [330, 430], s: 0.55 },
      { x: [1410, 1610], y: [330, 430], s: 0.55 },
    ],
    front: { x: [300, 1400], y: [770, 880], s: 1.16 },
    intro: "Der Floor gehört uns. Drops, Laser, Zombies — gib ihnen den letzten Tanz!",
  },
];

const BOSS_TAUNTS = [
  "DU HAST KEINEN STIL!", "DRAUSSEN BLEIBEN, BRATZKOPF!",
  "MEIN BUNKER — MEINE REGELN!", "STAMPFEN, BIS DIE BETONTÜR FÄLLT!",
];
const HUMAN_HINT_ONCE = "MENSCH IM NEBEL! Nicht schießen — die wollen nur tanzen.";

/* ------------------------------------------------ Engine --- */

export class Engine {
  private cv: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private a: Assets;
  private audio: BunkerAudio;
  private onPhase: (p: Phase, s?: Stats) => void;

  private raf = 0;
  private last = 0;
  private running = false;
  private phase: Phase = "idle";

  // View
  private scale = 1; private ox = 0; private oy = 0;
  private mx = VW / 2; private my = VH / 2;
  private pointerIn = false;

  // Weltzustand
  private wave = 0;
  private bossMode = false;
  private kills = 0; private spawned = 0;
  private hearts = 3;
  private ammo = 6; private reloading = 0;
  private score = 0; private combo = 1; private comboT = 0;
  private shots = 0; private hits = 0; private maxCombo = 1;
  private startT = 0;
  private humanHintShown = false;

  private mobs: Mob[] = [];
  private parts: Particle[] = [];
  private fxs: Fx[] = [];
  private floaters: Floater[] = [];
  private decals: Decal[] = [];
  private stars: Star[] = [];
  private bubble: Bubble | null = null;

  private spawnT = 1.2;
  private starT = 7;
  private waveIntro = 0;   // >0 solange Banner
  private waveClear = 0;   // Übergang
  private bgFade = 1;
  private prevBg = -1;
  private shake = 0;
  private hurtFlash = 0;
  private beatPulse = 0;
  private mobId = 1;

  // Boss
  private bossHpMax = 26;
  private bossHp = 26;
  private bossFrame: CharFrame = "bouncerIdle";
  private bossX = VW / 2; private bossY = 712;
  private bossSwayPh = 0;
  private bossAttackT = 6;   // Countdown bis Attacke
  private bossLungeT = 0;    // >0 während Ausfall
  private bossHitNeed = 2; private bossHitGot = 0;
  private bossDeadT = 0;
  private bossFlash = 0;
  private tauntT = 4;

  constructor(cv: HTMLCanvasElement, a: Assets, audio: BunkerAudio, onPhase: (p: Phase, s?: Stats) => void) {
    this.cv = cv;
    const c = cv.getContext("2d");
    if (!c) throw new Error("no 2d context");
    this.ctx = c;
    this.a = a;
    this.audio = audio;
    this.onPhase = onPhase;
    audio.onBeat = () => { this.beatPulse = 1; };
    this.resize();
    window.addEventListener("resize", this.resize);
    cv.addEventListener("pointermove", this.onMove);
    cv.addEventListener("pointerdown", this.onDown);
    cv.addEventListener("pointerenter", () => (this.pointerIn = true));
    cv.addEventListener("pointerleave", () => (this.pointerIn = false));
    window.addEventListener("keydown", this.onKey);
  }

  destroy() {
    cancelAnimationFrame(this.raf);
    window.removeEventListener("resize", this.resize);
    window.removeEventListener("keydown", this.onKey);
  }

  begin() {
    this.reset();
    this.phase = "play";
    this.startT = performance.now();
    if (!this.running) { this.running = true; this.last = performance.now(); this.loop(); }
    this.audio.startMusic();
  }

  stopLoop() {
    this.running = false;
    this.audio.stopMusic();
  }

  private reset() {
    this.wave = 0; this.bossMode = false;
    this.kills = 0; this.spawned = 0;
    this.hearts = 3; this.ammo = 6; this.reloading = 0;
    this.score = 0; this.combo = 1; this.comboT = 0;
    this.shots = 0; this.hits = 0; this.maxCombo = 1;
    this.mobs = []; this.parts = []; this.fxs = []; this.floaters = [];
    this.decals = []; this.stars = []; this.bubble = null;
    this.spawnT = 2.6; this.starT = 8;
    this.waveIntro = 2.6; this.waveClear = 0;
    this.prevBg = -1; this.bgFade = 1; this.humanHintShown = false;
    this.bossHp = this.bossHpMax; this.bossFrame = "bouncerIdle";
    this.bossAttackT = 6; this.bossLungeT = 0; this.bossDeadT = 0;
    this.showBubble(WAVES[0].intro, 4.4, VW / 2, 210, true);
  }

  /* ---------------- Input ---------------- */

  private resize = () => {
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const w = this.cv.clientWidth, h = this.cv.clientHeight;
    this.cv.width = Math.round(w * dpr);
    this.cv.height = Math.round(h * dpr);
    const s = Math.max(this.cv.width / VW, this.cv.height / VH);
    this.scale = s;
    this.ox = (this.cv.width - VW * s) / 2;
    this.oy = (this.cv.height - VH * s) / 2;
  };

  private toWorld(e: PointerEvent) {
    const r = this.cv.getBoundingClientRect();
    const dpr = this.cv.width / (this.cv.clientWidth || 1);
    this.mx = (e.clientX - r.left) * dpr - this.ox;
    this.my = (e.clientY - r.top) * dpr - this.oy;
    this.mx /= this.scale; this.my /= this.scale;
  }

  private onMove = (e: PointerEvent) => this.toWorld(e);

  private onKey = (e: KeyboardEvent) => {
    if (e.code === "KeyR" && this.phase === "play") this.tryReload();
  };

  private onDown = (e: PointerEvent) => {
    if (e.button !== 0 && e.pointerType === "mouse") return;
    this.toWorld(e);
    if (this.phase !== "play") return;
    this.shoot(this.mx, this.my);
  };

  /* ---------------- Kampf ---------------- */

  private tryReload() {
    if (this.reloading > 0 || this.ammo === 6) return;
    this.reloading = 1.15;
    this.audio.reload();
    this.ejectShells(3);
  }

  private shoot(x: number, y: number) {
    if (this.reloading > 0) { this.audio.miss(); return; }
    if (this.ammo <= 0) { this.tryReload(); return; }
    this.ammo--;
    this.shots++;
    this.audio.shot();
    this.decals.push({ x, y, t: 0 });
    if (this.decals.length > 18) this.decals.shift();
    this.shake = Math.min(1, this.shake + 0.12);
    this.ejectShells(1);
    if (this.ammo === 0) this.tryReload();

    // Stern einsammeln
    for (let i = this.stars.length - 1; i >= 0; i--) {
      const st = this.stars[i];
      if (Math.hypot(st.x - x, st.y - y) < 88) {
        this.stars.splice(i, 1);
        this.earn(250, st.x, st.y, "#ffd23f", "+250 BONUS");
        this.audio.starPing();
        this.burst(st.x, st.y, 340, "splash", "#ffd23f");
        this.hits++;
        return;
      }
    }

    // Boss
    if (this.bossMode && this.bossDeadT <= 0 && this.bossAliveHit(x, y)) return;

    // Mobs von vorn nach hinten
    const sorted = [...this.mobs].sort((p, q) => q.t - p.t);
    for (const m of sorted) {
      if (m.state !== "walk") continue;
      const r = m.rect;
      const padX = r.w * 0.06, padY = r.h * 0.04;
      if (x >= r.x + padX && x <= r.x + r.w - padX && y >= r.y + padY && y <= r.y + r.h - padY) {
        if (m.kind === "human") this.hitHuman(m);
        else this.killMob(m, true);
        return;
      }
    }
    // Durchschuss
    this.combo = 1;
    this.audio.miss();
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
          this.burst(this.bossX + (Math.random() - 0.5) * 520, this.bossY - 260 - Math.random() * 320, 460 + Math.random() * 240, "burst");
          this.spray(this.bossX, this.bossY - 300, 22, ["#ff2d78", "#9bff57", "#ffd23f"]);
        }, i * 160);
      }
      this.earn(2000, this.bossX, this.bossY - 420, "#ffd23f", "+2000 BETONTROLL ERLEDIGT");
      this.shake = 1;
    }
    return true;
  }

  private killMob(m: Mob, shot: boolean) {
    m.state = "dying"; m.dt = 0;
    this.kills++;
    this.hits++;
    const pts = 100 * this.combo;
    this.earn(pts, m.rect.x + m.rect.w / 2, m.rect.y, "#ff2d78", `+${pts}`);
    this.combo = Math.min(8, this.combo + 1);
    this.comboT = 4;
    this.maxCombo = Math.max(this.maxCombo, this.combo);
    this.audio.splat();
    this.burst(m.rect.x + m.rect.w / 2, m.rect.y + m.rect.h * 0.45, 330 * m.rect.h / 480 + 140, "splash", "#ff2d78");
    this.spray(m.rect.x + m.rect.w / 2, m.rect.y + m.rect.h * 0.4, 14, ["#ff2d78", "#7dff5a", "#e8b3ff"]);
    this.burst(m.rect.x + m.rect.w / 2, m.rect.y + m.rect.h * 0.4, 170, "burst");
    if (shot) this.dust(m.rect.x + m.rect.w / 2, m.rect.y + m.rect.h);
  }

  private hitHuman(m: Mob) {
    m.state = "flee"; m.dt = 0;
    this.audio.scream();
    this.hurt(1);
    this.earn(-150, m.rect.x + m.rect.w / 2, m.rect.y, "#ff3b3b", "GAST GETROFFEN!");
    this.burst(m.rect.x + m.rect.w / 2, m.rect.y + m.rect.h * 0.4, 260, "splash", "#ff3b3b");
    this.combo = 1;
  }

  private hurt(n: number) {
    this.hearts = Math.max(0, this.hearts - n);
    this.hurtFlash = 1;
    this.shake = Math.min(1, this.shake + 0.55);
    this.audio.heartLoss();
    this.combo = 1;
    if (this.hearts <= 0) this.gameOver();
  }

  private earn(pts: number, x: number, y: number, color: string, label?: string) {
    this.score = Math.max(0, this.score + pts);
    const f: Floater = { text: label ?? (pts > 0 ? `+${pts}` : `${pts}`), x, y, t: 0, dur: 1.1, color, size: pts >= 500 ? 44 : 30 };
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

  private stats(): Stats {
    return {
      kills: this.killsTotal(), shots: this.shots, hits: this.hits,
      maxCombo: this.maxCombo, score: this.score, timeMs: performance.now() - this.startT,
    };
  }
  private totalKills = 0;
  private killsTotal() { return this.totalKills + this.kills; }

  /* ---------------- FX-Helfer ---------------- */

  private burst(x: number, y: number, size: number, kind: "burst" | "splash", tint?: string) {
    this.fxs.push({ frame: kind === "burst" ? "starburst" : "splash", kind, x, y, t: 0, dur: 0.5, size, tint });
  }

  private spray(x: number, y: number, n: number, colors: string[]) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2, v = 180 + Math.random() * 480;
      this.parts.push({
        x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 160, g: 900,
        t: 0, dur: 0.5 + Math.random() * 0.5, size: 3 + Math.random() * 7,
        color: colors[i % colors.length],
      });
    }
  }

  private dust(x: number, y: number) {
    for (let i = 0; i < 7; i++) {
      this.parts.push({
        x: x + (Math.random() - 0.5) * 40, y,
        vx: (Math.random() - 0.5) * 160, vy: -60 - Math.random() * 120, g: 320,
        t: 0, dur: 0.6 + Math.random() * 0.4, size: 5 + Math.random() * 8,
        color: "rgba(190,190,190,0.5)",
      });
    }
  }

  private ejectShells(n: number) {
    for (let i = 0; i < n; i++) {
      this.parts.push({
        x: VW / 2 + (Math.random() - 0.5) * 60, y: VH - 40,
        vx: 240 + Math.random() * 260, vy: -420 - Math.random() * 260, g: 1500,
        t: 0, dur: 1.1, size: 30, color: "#d9b24a", frame: "shell",
        rot: Math.random() * Math.PI, vr: 8 + Math.random() * 10,
      });
    }
  }

  private showBubble(text: string, dur: number, x: number, y: number, big = false) {
    this.bubble = { text, t: 0, dur, x, y, big };
  }

  /* ---------------- Spawning ---------------- */

  private cfg(): WaveCfg { return WAVES[Math.min(this.wave, WAVES.length - 1)]; }

  private trySpawn(dt: number) {
    if (this.waveIntro > 0 || this.waveClear > 0) return;
    if (this.bossMode) {
      if (this.bossDeadT > 0) return;
      this.spawnT -= dt;
      if (this.spawnT <= 0) {
        this.spawnT = 1.5 + Math.random() * 1.1;
        if (this.countWalkers() < 6) this.spawnMob({
          bg: 4, name: "BOSS", quota: 0, spawnMin: 0, spawnMax: 0, maxActive: 6,
          speedMin: 0.12, speedMax: 0.17, humanP: 0.12, zigzagP: 0.3,
          spawnZones: [
            { x: [120, 360], y: [380, 470], s: 0.5 },
            { x: [1310, 1550], y: [380, 470], s: 0.5 },
          ],
          front: { x: [300, 1400], y: [800, 895], s: 1.05 },
          intro: "",
        } as WaveCfg);
      }
      return;
    }
    const c = this.cfg();
    if (this.kills >= c.quota) return;
    // Druck halten: wenn niemand unterwegs ist, zügig nachlegen (aber kein Dauerfeuer)
    if (this.countWalkers() === 0) this.spawnT = Math.min(this.spawnT, 0.5);
    this.spawnT -= dt;
    if (this.spawnT <= 0) {
      this.spawnT = c.spawnMin + Math.random() * (c.spawnMax - c.spawnMin);
      if (this.countWalkers() < c.maxActive) {
        this.spawnMob(c);
        this.spawned++;
      } else this.spawnT = 0.35;
    }
  }

  private countWalkers() {
    return this.mobs.filter((m) => m.state === "walk" && m.kind === "zombie").length;
  }

  private spawnMob(c: WaveCfg) {
    const zone = c.spawnZones[Math.floor(Math.random() * c.spawnZones.length)];
    const rand = (r: [number, number]) => r[0] + Math.random() * (r[1] - r[0]);
    const isHuman = Math.random() < c.humanP;
    const m: Mob = {
      id: this.mobId++,
      kind: isHuman ? "human" : "zombie",
      frame: isHuman ? HFR[Math.floor(Math.random() * 2)] : ZFR[Math.floor(Math.random() * 4)],
      x0: rand(zone.x), y0: rand(zone.y), s0: zone.s,
      x1: rand(c.front.x), y1: rand(c.front.y), s1: c.front.s,
      t: 0,
      speed: (c.speedMin + Math.random() * (c.speedMax - c.speedMin)) * (isHuman ? 1.35 : 1),
      swayPh: Math.random() * Math.PI * 2,
      swayAmp: 4 + Math.random() * 8,
      zigzag: !isHuman && Math.random() < c.zigzagP,
      state: "walk", dt: 0,
      rect: { x: 0, y: 0, w: 0, h: 0 },
    };
    // Menschen laufen auf der Seite ihrer Herkunft in die Außenbahn durch,
    // damit sie die Mitte nur kurz kreuzen (Treffer = Kollateralschaden!)
    if (isHuman) {
      const zc = (zone.x[0] + zone.x[1]) / 2;
      const side: [number, number] = zc < VW * 0.45 ? [120, 430] : zc > VW * 0.55 ? [1240, 1550] : (Math.random() < 0.5 ? [120, 430] : [1240, 1550]);
      m.x1 = side[0] + Math.random() * (side[1] - side[0]);
    }
    this.mobs.push(m);
    if (isHuman && !this.humanHintShown && this.wave >= 1) {
      this.humanHintShown = true;
      this.showBubble(HUMAN_HINT_ONCE, 3.4, VW / 2, 150);
    }
  }

  /* ---------------- Update ---------------- */

  private update(dt: number) {
    this.beatPulse = Math.max(0, this.beatPulse - dt * 3.2);
    this.shake = Math.max(0, this.shake - dt * 2.4);
    this.hurtFlash = Math.max(0, this.hurtFlash - dt * 1.8);
    if (this.waveIntro > 0) this.waveIntro -= dt;
    if (this.bgFade < 1) this.bgFade = Math.min(1, this.bgFade + dt * 1.4);

    // Reload
    if (this.reloading > 0) {
      this.reloading -= dt;
      if (this.reloading <= 0) { this.reloading = 0; this.ammo = 6; }
    }
    if (this.comboT > 0) { this.comboT -= dt; if (this.comboT <= 0) this.combo = Math.max(1, this.combo); }

    // Bubble
    if (this.bubble) {
      this.bubble.t += dt;
      if (this.bubble.t > this.bubble.dur) this.bubble = null;
    }

    this.trySpawn(dt);

    // Mobs
    for (const m of this.mobs) {
      m.swayPh += dt * 6;
      if (m.state === "walk") {
        m.t += m.speed * dt;
        if (m.t >= 1) {
          m.t = 1;
          if (m.kind === "human") {
            m.state = "flee"; m.dt = 0;
            this.earn(50, m.rect.x + m.rect.w / 2, m.rect.y, "#7dff5a", "+50 DURCHGEWUNKEN");
          } else {
            m.state = "leap"; m.dt = 0;
            this.hurt(1);
            this.earn(0, m.rect.x + m.rect.w / 2, m.rect.y, "#ff3b3b", m.kind === "zombie" ? "DURCHGEBROCHEN!" : "");
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

    // Welle geschafft?
    if (!this.bossMode && this.kills >= this.cfg().quota && this.waveClear <= 0 && this.waveIntro <= 0 && this.countWalkers() === 0) {
      this.waveClear = 1.6;
      this.totalKills += this.kills;
      this.audio.starPing();
    }
    if (this.waveClear > 0) {
      this.waveClear -= dt;
      if (this.waveClear <= 0) this.nextWave();
    }

    // Sterne
    this.starT -= dt;
    if (this.starT <= 0) {
      this.starT = 8 + Math.random() * 6;
      this.stars.push({ x: 240 + Math.random() * (VW - 480), y: -60, vy: 52 + Math.random() * 30, t: 0 });
    }
    for (const s of this.stars) { s.y += s.vy * dt; s.t += dt; }
    this.stars = this.stars.filter((s) => s.y < VH + 80);

    // Boss
    if (this.bossMode) this.updateBoss(dt);

    // FX
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
  }

  private nextWave() {
    this.kills = 0; this.spawned = 0; this.spawnT = 2.2;
    this.prevBg = this.cfg().bg;
    if (this.wave + 1 >= WAVES.length) {
      // Bosswelle
      this.bossMode = true;
      this.prevBg = this.cfg().bg;
      this.bgFade = 0;
      this.waveIntro = 3;
      this.audio.roar();
      this.showBubble("BETONTROLL BRECHT AUS! Holt er aus — ZWEI Treffer in die Mitte, sonst platt!", 5, VW / 2, 200, true);
      return;
    }
    this.wave++;
    this.bgFade = 0;
    this.waveIntro = 2.6;
    const c = this.cfg();
    this.showBubble(c.intro, 4.4, VW / 2, 200, true);
  }

  private updateBoss(dt: number) {
    this.bossSwayPh += dt * 1.4;
    this.bossX = VW / 2 + Math.sin(this.bossSwayPh) * 90;
    if (this.bossDeadT > 0) {
      this.bossDeadT -= dt;
      if (this.bossDeadT <= 0) {
        this.showBubble("Sonnenaufgang über dem Bunker. Der Floor atmet. Du bist Legende der Nachtschicht.", 5, VW / 2, 210, true);
        window.setTimeout(() => this.winGame(), 1400);
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
      this.bossHitGot = 0;
      this.audio.roar();
      this.showBubble("ER HOLT AUS — 2× TREFFEN!", 1.4, VW / 2, 250);
    }
    this.tauntT -= dt;
    if (this.tauntT <= 0) {
      this.tauntT = 6.5 + Math.random() * 3;
      this.showBubble(BOSS_TAUNTS[Math.floor(Math.random() * BOSS_TAUNTS.length)], 2.4, this.bossX - 240, 170);
    }
  }

  /* ---------------- Render ---------------- */

  private loop = () => {
    if (!this.running) return;
    const now = performance.now();
    const dt = Math.min(0.05, (now - this.last) / 1000);
    this.last = now;
    this.update(dt);
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
    const idx = this.bossMode ? 4 : this.cfg().bg;
    const pulse = 1 + this.beatPulse * 0.012 + this.shake * 0.004;
    const sx = (Math.random() - 0.5) * this.shake * 26;
    const sy = (Math.random() - 0.5) * this.shake * 20;
    const img = this.a.bgs[idx];
    const w = img.width * pulse, h = img.height * pulse;
    c.drawImage(img, (VW - w) / 2 + sx, (VH - h) / 2 + sy, w, h);
    // Crossfade vom alten Hintergrund
    if (this.prevBg >= 0 && this.bgFade < 1) {
      c.globalAlpha = 1 - this.bgFade;
      c.drawImage(this.a.bgs[this.prevBg], sx, sy, VW, VH);
      c.globalAlpha = 1;
    }
    // Boss-Alarm-Rot
    if (this.bossMode && this.bossLungeT > 0) {
      c.fillStyle = `rgba(255,30,60,${0.16 + Math.sin(performance.now() / 60) * 0.08})`;
      c.fillRect(0, 0, VW, VH);
    }
  }

  private drawFrame(img: HTMLImageElement, f: FrameRect, cx: number, feetY: number, targetH: number, alpha = 1, flip = false) {
    const c = this.ctx;
    const sc = targetH / f.h;
    const w = f.w * sc, h = f.h * sc;
    c.save();
    c.globalAlpha = alpha;
    if (flip) {
      c.translate(cx, feetY);
      c.scale(-1, 1);
      c.drawImage(img, f.x, f.y, f.w, f.h, -w / 2, -h, w, h);
    } else {
      c.drawImage(img, f.x, f.y, f.w, f.h, cx - w / 2, feetY - h, w, h);
    }
    c.restore();
    return { x: cx - w / 2, y: feetY - h, w, h };
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

    // Mobs nach Tiefe sortiert (hinten zuerst)
    const drawList = [...this.mobs].sort((p, q) => p.t - q.t);
    for (const m of drawList) this.drawMob(m);

    // Boss
    if (this.bossMode) this.drawBoss();

    // Sterne
    for (const s of this.stars) {
      const puls = 1 + Math.sin(s.t * 6) * 0.12;
      this.drawUi("star", s.x, s.y, 82 * puls, 0.95, s.t * 0.8);
      this.drawUi("star", s.x, s.y, 120 * puls, 0.18 + 0.1 * Math.sin(s.t * 6), -s.t * 0.4);
    }

    // Decals (Einschlag-Markierungen)
    for (const d of this.decals) {
      const a = Math.max(0, 1 - d.t / 2.6) * 0.8;
      this.drawUi("crosshair", d.x, d.y, 56 + d.t * 26, a, d.t * 1.2);
    }

    // Bursts / Splashes
    for (const f of this.fxs) {
      const k = f.t / f.dur;
      const size = f.size * (0.6 + k * 0.9);
      const alpha = k < 0.15 ? k / 0.15 : 1 - (k - 0.15) / 0.85;
      if (f.frame) this.drawUi(f.frame as UiFrame, f.x, f.y, size, Math.max(0, alpha), f.kind === "splash" ? f.t * 2 : k * 1.5);
      if (f.kind === "burst") {
        c.save();
        c.globalAlpha = Math.max(0, alpha) * 0.5;
        const g = c.createRadialGradient(f.x, f.y, 0, f.x, f.y, size * 0.7);
        g.addColorStop(0, "rgba(255,240,180,0.9)");
        g.addColorStop(1, "rgba(255,45,120,0)");
        c.fillStyle = g;
        c.beginPath(); c.arc(f.x, f.y, size * 0.7, 0, Math.PI * 2); c.fill();
        c.restore();
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
    if (this.hurtFlash > 0) {
      const g = c.createRadialGradient(VW / 2, VH / 2, VH * 0.3, VW / 2, VH / 2, VH * 0.9);
      g.addColorStop(0, "rgba(255,0,60,0)");
      g.addColorStop(1, `rgba(255,0,60,${0.5 * this.hurtFlash})`);
      c.fillStyle = g;
      c.fillRect(0, 0, VW, VH);
    }
    if (this.hearts === 1 && this.phase === "play") {
      const g = c.createRadialGradient(VW / 2, VH / 2, VH * 0.42, VW / 2, VH / 2, VH * 0.95);
      g.addColorStop(0, "rgba(120,0,30,0)");
      g.addColorStop(1, "rgba(120,0,30,0.45)");
      c.fillStyle = g;
      c.fillRect(0, 0, VW, VH);
    }

    this.drawFloaters();
    this.drawHud();
    if (this.bubble) this.drawBubble(this.bubble);
    this.drawWaveBanner();
    this.drawCrosshair();
  }

  private drawMob(m: Mob) {
    const c = this.ctx;
    const f = CHAR_FRAMES[m.frame];
    let x = m.x0 + (m.x1 - m.x0) * m.t;
    const y = m.y0 + (m.y1 - m.y0) * m.t;
    let hFrac = (m.s0 + (m.s1 - m.s0) * m.t);
    const bob = Math.sin(m.swayPh) * m.swayAmp * hFrac;
    if (m.zigzag) x += Math.sin(m.t * Math.PI * 3 + m.swayPh) * 110;
    const beatHop = m.kind === "zombie" ? this.beatPulse * 7 * hFrac : 0;
    const h = 520 * hFrac;
    let alpha = 1;
    if (m.state === "dying") alpha = 1 - m.dt / 0.32;
    if (m.state === "leap") hFrac *= 1 + (m.dt / 0.5) * 0.45;
    if (m.state === "flee") { alpha = 1 - m.dt / 0.6; }
    const flip = m.x1 < m.x0;
    // Schatten
    c.save();
    c.globalAlpha = 0.32 * alpha;
    c.fillStyle = "#000";
    c.beginPath();
    c.ellipse(x, y + 2, (h * f.w / f.h) * 0.42, h * 0.045, 0, 0, Math.PI * 2);
    c.fill();
    c.restore();
    const rect = this.drawFrame(this.a.chars, f, x, y + bob + beatHop, h * (m.state === "leap" ? hFrac / (m.s0 + (m.s1 - m.s0) * m.t) : 1), alpha, flip);
    m.rect = rect;
    if (m.state === "flee" && m.kind === "human") {
      this.drawUi("speech", x, rect.y - 40, 150, Math.min(1, alpha + 0.2));
    }
  }

  private drawBoss() {
    if (this.bossMode && this.waveIntro <= 0) {
      const flash = this.bossFlash;
      const f = CHAR_FRAMES[this.bossFrame];
      const baseH = this.bossFrame === "bouncerIdle" ? 700 : 640;
      const h = baseH * (this.bossLungeT > 0 ? 1.16 : 1);
      const feetY = this.bossY + (this.bossLungeT > 0 ? 60 : 0) + Math.sin(this.bossSwayPh * 2) * 6;
      const c = this.ctx;
      // Schatten
      c.save();
      c.globalAlpha = 0.4;
      c.fillStyle = "#000";
      c.beginPath();
      c.ellipse(this.bossX, feetY + 6, (h * f.w / f.h) * 0.44, h * 0.05, 0, 0, Math.PI * 2);
      c.fill();
      c.restore();
      const a = this.bossDeadT > 0 && this.bossDeadT < 900 ? Math.max(0, 1 - this.bossDeadT / 2.4) : 1;
      this.drawFrame(this.a.chars, f, this.bossX, feetY, h, this.bossDeadT > 0 && this.bossDeadT < 900 ? 1 - a : 1);
      if (flash > 0) {
        c.save();
        c.globalCompositeOperation = "lighter";
        c.globalAlpha = flash * 0.55;
        this.drawFrame(this.a.chars, f, this.bossX, feetY, h, 1);
        c.restore();
      }
      // Lunge-Warnung
      if (this.bossLungeT > 0) {
        const need = this.bossHitNeed - this.bossHitGot;
        this.drawUi("crosshair", this.bossX, feetY - h * 0.55, 190 + this.beatPulse * 40, 0.95, performance.now() / 300);
        c.save();
        c.font = "900 52px 'Archivo Black', sans-serif";
        c.textAlign = "center";
        c.fillStyle = need > 0 ? "#ffd23f" : "#7dff5a";
        c.strokeStyle = "#000"; c.lineWidth = 8;
        const label = need > 0 ? `NOCH ${need}× !` : "REICHT!";
        c.strokeText(label, this.bossX, feetY - h - 30);
        c.fillText(label, this.bossX, feetY - h - 30);
        c.restore();
      }
    }
  }

  private drawFloaters() {
    const c = this.ctx;
    for (const f of this.floaters) {
      const k = f.t / f.dur;
      const a = k < 0.1 ? k / 0.1 : 1 - Math.max(0, (k - 0.55) / 0.45);
      c.save();
      c.globalAlpha = Math.max(0, a);
      c.font = `900 ${f.size}px 'Archivo Black', sans-serif`;
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
    // Herzen
    for (let i = 0; i < 3; i++) {
      const full = i < this.hearts;
      const pulseH = 58 + (full ? this.beatPulse * 7 : 0);
      this.drawUi(full ? "heartFull" : "heartEmpty", pad + 34 + i * 74, 46, pulseH, full ? 1 : 0.75);
    }
    // Score + Combo (Schädel)
    this.drawUi("skull", VW - 64, 58, 84 + this.beatPulse * 6);
    c.save();
    c.textAlign = "right";
    c.font = "900 46px 'Archivo Black', sans-serif";
    c.lineWidth = 8; c.strokeStyle = "rgba(0,0,0,0.9)";
    const sc = String(this.score).padStart(6, "0");
    c.strokeText(sc, VW - 116, 62);
    c.fillStyle = "#eaffea";
    c.fillText(sc, VW - 116, 62);
    if (this.combo > 1) {
      c.font = "900 30px 'Archivo Black', sans-serif";
      c.strokeText(`COMBO ×${this.combo}`, VW - 116, 102);
      c.fillStyle = this.combo >= 5 ? "#ffd23f" : "#ff2d78";
      c.fillText(`COMBO ×${this.combo}`, VW - 116, 102);
    }
    c.restore();
    // Munition
    for (let i = 0; i < 6; i++) {
      const full = i < this.ammo;
      const x = pad + 26 + i * 40, y = VH - 58;
      if (this.reloading > 0) {
        this.drawUi("bullet", x, y, 66, 0.25, (performance.now() / 240 + i) % (Math.PI * 2));
      } else {
        this.drawUi("bullet", x, y, 66, full ? 1 : 0.18, full ? 0 : 0.5);
      }
    }
    if (this.reloading > 0) {
      c.save();
      c.font = "900 26px 'Archivo Black', sans-serif";
      c.fillStyle = "#ffd23f";
      c.textAlign = "left";
      c.lineWidth = 6; c.strokeStyle = "rgba(0,0,0,0.9)";
      c.strokeText("LADE NACH…", pad + 20, VH - 96);
      c.fillText("LADE NACH…", pad + 20, VH - 96);
      c.restore();
    }
    // Fortschritts-Balken / Boss-HP
    if (this.bossMode) {
      const bw = 560, bh = 130;
      const f = UI_FRAMES.barFull;
      this.ctx.drawImage(this.a.ui, f.x, f.y, f.w, f.h, VW / 2 - bw / 2, 26, bw, bh);
      // Füllung
      const p = Math.max(0, this.bossHp / this.bossHpMax);
      c.save();
      c.fillStyle = p > 0.4 ? "#9bff57" : "#ff2d78";
      c.fillRect(VW / 2 - bw * 0.395, 26 + bh * 0.415, bw * 0.79 * p, bh * 0.22);
      c.restore();
      c.save();
      c.textAlign = "center";
      c.font = "900 24px 'Archivo Black', sans-serif";
      c.lineWidth = 6; c.strokeStyle = "rgba(0,0,0,0.9)";
      c.strokeText("BETONTROLL", VW / 2, 26 + bh + 22);
      c.fillStyle = "#ffb1cf";
      c.fillText("BETONTROLL", VW / 2, 26 + bh + 22);
      c.restore();
    } else {
      const bw = 420, bh = 96;
      const f = UI_FRAMES.barOk;
      this.ctx.drawImage(this.a.ui, f.x, f.y, f.w, f.h, VW / 2 - bw / 2, VH - 124, bw, bh);
      const p = Math.min(1, this.kills / this.cfg().quota);
      c.save();
      c.fillStyle = "rgba(155,255,87,0.9)";
      c.fillRect(VW / 2 - bw * 0.395, VH - 124 + bh * 0.415, bw * 0.79 * p, bh * 0.22);
      c.restore();
      c.save();
      c.textAlign = "center";
      c.font = "900 22px 'Archivo Black', sans-serif";
      c.lineWidth = 6; c.strokeStyle = "rgba(0,0,0,0.9)";
      const label = `${this.cfg().name}  ·  ${this.kills}/${this.cfg().quota}`;
      c.strokeText(label, VW / 2, VH - 16);
      c.fillStyle = "#c8ffb1";
      c.fillText(label, VW / 2, VH - 16);
      c.restore();
    }
    // Wellenzähler klein
    c.save();
    c.textAlign = "center";
    c.font = "700 20px 'Space Grotesk', sans-serif";
    c.fillStyle = "rgba(255,255,255,0.65)";
    c.fillText(this.bossMode ? "ENDGEGNER · WELLE 5/5" : `WELLE ${this.wave + 1}/5 · R NACHLADEN`, VW / 2, 34);
    c.restore();
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
    c.font = `700 ${b.big ? 25 : 22}px 'Space Grotesk', sans-serif`;
    c.textAlign = "center";
    c.fillStyle = "#141414";
    // Wrap
    const words = b.text.split(" ");
    const lines: string[] = [];
    let line = "";
    for (const wd of words) {
      const t2 = line ? line + " " + wd : wd;
      if (c.measureText(t2).width > w * 0.62) { lines.push(line); line = wd; }
      else line = t2;
    }
    if (line) lines.push(line);
    const lh = b.big ? 30 : 27;
    const y0 = -((lines.length - 1) * lh) / 2 - 8;
    lines.forEach((l, i) => c.fillText(l, 0, y0 + i * lh + 8));
    c.restore();
  }

  private drawWaveBanner() {
    if (this.waveIntro <= 0 && this.waveClear <= 0) return;
    const c = this.ctx;
    if (this.waveIntro > 0) {
      const t = 2.6 - this.waveIntro;
      const fade = this.waveIntro > 2.3 ? (2.6 - this.waveIntro) / 0.3 : Math.min(1, this.waveIntro / 0.5);
      c.save();
      c.globalAlpha = Math.min(1, fade) * 0.88;
      c.fillStyle = "#000";
      c.fillRect(0, 0, VW, VH);
      c.globalAlpha = Math.min(1, fade);
      const name = this.bossMode ? "ENDGEGNER · DER BETONTROLL" : WAVES[this.wave].name;
      c.textAlign = "center";
      const pop = 1 + Math.max(0, 0.5 - t) * 0.35;
      c.translate(VW / 2, VH / 2);
      c.scale(pop, pop);
      c.font = "900 92px 'Archivo Black', sans-serif";
      c.lineWidth = 16; c.strokeStyle = "#000";
      c.strokeText(name, 0, 0);
      const grad = c.createLinearGradient(0, -60, 0, 40);
      grad.addColorStop(0, "#d6ffb0");
      grad.addColorStop(0.55, "#7dff5a");
      grad.addColorStop(0.56, "#ff2d78");
      grad.addColorStop(1, "#ff7ab5");
      c.fillStyle = grad;
      c.fillText(name, 0, 0);
      c.font = "900 34px 'Archivo Black', sans-serif";
      c.fillStyle = "#ffffff";
      c.globalAlpha = Math.min(1, fade) * 0.85;
      c.fillText(this.bossMode ? "DIE LETZTE TÜR ÖFFNET SICH" : BG_SOURCES[WAVES[this.wave].bg].label, 0, 62);
      c.restore();
    }
    if (this.waveClear > 0) {
      const fade = Math.min(1, this.waveClear / 0.4);
      c.save();
      c.globalAlpha = fade;
      c.textAlign = "center";
      c.font = "900 108px 'Archivo Black', sans-serif";
      c.lineWidth = 18; c.strokeStyle = "#000";
      c.strokeText("SAUBER!", VW / 2, VH / 2 + 20);
      c.fillStyle = "#7dff5a";
      c.fillText("SAUBER!", VW / 2, VH / 2 + 20);
      c.restore();
    }
  }

  private drawCrosshair() {
    if (!this.pointerIn || this.phase !== "play") return;
    const puls = 1 + this.beatPulse * 0.18;
    const size = this.reloading > 0 ? 42 : 64;
    this.drawUi("crosshair", this.mx, this.my, size * puls, 0.96, 0);
    const c = this.ctx;
    c.save();
    c.fillStyle = "#ff2d78";
    c.beginPath(); c.arc(this.mx, this.my, 3.2, 0, Math.PI * 2); c.fill();
    c.restore();
  }
}
