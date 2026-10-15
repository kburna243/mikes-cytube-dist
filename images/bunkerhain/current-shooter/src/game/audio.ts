/* Synthetisierter Bunker- & Boxi-Techno (WebAudio, keine Audio-Dateien) + SFX. */

export class BunkerAudio {
  ctx: AudioContext | null = null;
  master!: GainNode;
  musicBus!: GainNode;
  sfxBus!: GainNode;
  bpm = 126;
  level = 1;
  private step = 0;
  private nextT = 0;
  private timer: number | null = null;
  private noiseBuf!: AudioBuffer;
  onBeat: ((beat: number) => void) | null = null;
  muted = false;
  private lastBeat = -1;

  unlock() {
    if (this.ctx) {
      if (this.ctx.state === "suspended") void this.ctx.resume();
      return;
    }
    const AC =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    this.ctx = new AC();
    this.master = this.ctx.createGain();
    this.master.gain.value = 0.9;
    const comp = this.ctx.createDynamicsCompressor();
    comp.threshold.value = -14;
    comp.knee.value = 20;
    comp.ratio.value = 5;
    this.master.connect(comp);
    comp.connect(this.ctx.destination);
    this.musicBus = this.ctx.createGain();
    this.musicBus.gain.value = 0.72;
    this.musicBus.connect(this.master);
    this.sfxBus = this.ctx.createGain();
    this.sfxBus.gain.value = 0.9;
    this.sfxBus.connect(this.master);
    const len = this.ctx.sampleRate * 1.2;
    this.noiseBuf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const d = this.noiseBuf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
  }

  setMuted(m: boolean) {
    this.muted = m;
    if (this.master && this.ctx) {
      this.master.gain.setTargetAtTime(m ? 0 : 0.9, this.ctx.currentTime, 0.03);
    }
  }

  setLevel(lvl: 1 | 2) {
    this.level = lvl;
    this.bpm = lvl === 1 ? 126 : 118;
  }

  startMusic(lvl: 1 | 2 = 1) {
    this.setLevel(lvl);
    if (!this.ctx || this.timer !== null) return;
    this.step = 0;
    this.nextT = this.ctx.currentTime + 0.08;
    const tick = () => {
      if (!this.ctx) return;
      const spb = 60 / this.bpm / 4; // 16tel
      while (this.nextT < this.ctx.currentTime + 0.12) {
        if (this.level === 1) {
          this.scheduleLevel1(this.step, this.nextT, spb);
        } else {
          this.scheduleLevel2(this.step, this.nextT, spb);
        }
        this.step = (this.step + 1) % 64;
        this.nextT += spb;
      }
      this.timer = window.setTimeout(tick, 40);
    };
    tick();
  }

  stopMusic() {
    if (this.timer !== null) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  }

  /* --- Pattern Level 1 (Bunker Techno 126 BPM) --- */
  private scheduleLevel1(s: number, t: number, spb: number) {
    const beat = s % 16;
    if (s % 4 === 0) {
      this.kick(t, this.musicBus, s % 16 === 0 ? 1 : 0.88);
      if (this.ctx && this.onBeat && s % 4 === 0) {
        const b = s / 4;
        const dt = Math.max(0, (t - this.ctx.currentTime) * 1000);
        window.setTimeout(() => {
          if (this.lastBeat !== b) {
            this.lastBeat = b;
            this.onBeat?.(b);
          }
        }, dt);
      }
    }
    if (beat === 4 || beat === 12) this.clap(t, 0.5);
    if (s % 4 === 2) this.hat(t, 0.34, 6000);
    else if (s % 2 === 1) this.hat(t, 0.12, 9000);

    const bassSeq = [0, 0, 3, 0, 0, 5, 0, 3, 0, 0, 7, 5, 3, 0, 10, 3];
    if (s % 2 === 0) this.bass(t, bassSeq[s % 16], spb * 1.8, 0.16);
    if (s === 0) this.pad(t);
    if (s % 8 === 6) this.hat(t, 0.2, 3200, 0.18);
  }

  /* --- Pattern Level 2 (Boxi Morning Rave 118 BPM) --- */
  private scheduleLevel2(s: number, t: number, spb: number) {
    const beat = s % 16;
    if (s % 4 === 0) {
      this.kick(t, this.musicBus, 0.85);
      if (this.ctx && this.onBeat && s % 4 === 0) {
        const b = s / 4;
        const dt = Math.max(0, (t - this.ctx.currentTime) * 1000);
        window.setTimeout(() => {
          if (this.lastBeat !== b) {
            this.lastBeat = b;
            this.onBeat?.(b);
          }
        }, dt);
      }
    }
    // Shaker / Hi-Hat roll
    this.hat(t, s % 2 === 0 ? 0.22 : 0.1, 7500, 0.04);
    if (beat === 4 || beat === 12) this.clap(t, 0.4);

    // Funky Morning Bassline (F-Moll pentatonisch)
    const boxiBass = [0, 3, 0, 7, 0, 10, 7, 3, 0, 5, 7, 5, 3, 0, 2, 0];
    if (s % 2 === 0) this.bass(t, boxiBass[s % 16], spb * 1.5, 0.14);
    if (s % 16 === 8) this.boxiMelody(t);
  }

  private boxiMelody(t: number) {
    if (!this.ctx) return;
    const notes = [440, 523.25, 659.25];
    const n = notes[Math.floor(Math.random() * notes.length)];
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.type = "sine";
    o.frequency.setValueAtTime(n, t);
    g.gain.setValueAtTime(0.001, t);
    g.gain.linearRampToValueAtTime(0.08, t + 0.05);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.4);
    o.connect(g);
    g.connect(this.musicBus);
    o.start(t);
    o.stop(t + 0.45);
  }

  private kick(t: number, bus: GainNode, vel = 1) {
    if (!this.ctx) return;
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.type = "sine";
    o.frequency.setValueAtTime(155, t);
    o.frequency.exponentialRampToValueAtTime(44, t + 0.11);
    g.gain.setValueAtTime(0.9 * vel, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.24);
    o.connect(g);
    g.connect(bus);
    o.start(t);
    o.stop(t + 0.26);
    const c = this.ctx.createOscillator();
    const cg = this.ctx.createGain();
    c.type = "square";
    c.frequency.value = 900;
    cg.gain.setValueAtTime(0.12 * vel, t);
    cg.gain.exponentialRampToValueAtTime(0.001, t + 0.02);
    c.connect(cg);
    cg.connect(bus);
    c.start(t);
    c.stop(t + 0.03);
  }

  private clap(t: number, vel: number) {
    if (!this.ctx) return;
    for (let i = 0; i < 3; i++) {
      const src = this.ctx.createBufferSource();
      src.buffer = this.noiseBuf;
      const f = this.ctx.createBiquadFilter();
      f.type = "bandpass";
      f.frequency.value = 1700;
      f.Q.value = 1.4;
      const g = this.ctx.createGain();
      const tt = t + i * 0.012;
      g.gain.setValueAtTime(vel * (1 - i * 0.22), tt);
      g.gain.exponentialRampToValueAtTime(0.001, tt + 0.12);
      src.connect(f);
      f.connect(g);
      g.connect(this.musicBus);
      src.start(tt);
      src.stop(tt + 0.16);
    }
  }

  private hat(t: number, vel: number, freq: number, dur = 0.05) {
    if (!this.ctx) return;
    const src = this.ctx.createBufferSource();
    src.buffer = this.noiseBuf;
    src.playbackRate.value = 1.5;
    const f = this.ctx.createBiquadFilter();
    f.type = "highpass";
    f.frequency.value = freq;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(vel, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    src.connect(f);
    f.connect(g);
    g.connect(this.musicBus);
    src.start(t);
    src.stop(t + dur + 0.02);
  }

  private bass(t: number, semi: number, dur: number, vel: number) {
    if (!this.ctx) return;
    const o = this.ctx.createOscillator();
    o.type = "sawtooth";
    o.frequency.value = 55 * Math.pow(2, semi / 12);
    const f = this.ctx.createBiquadFilter();
    f.type = "lowpass";
    f.Q.value = 9;
    f.frequency.setValueAtTime(900, t);
    f.frequency.exponentialRampToValueAtTime(190, t + dur);
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(vel, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    o.connect(f);
    f.connect(g);
    g.connect(this.musicBus);
    o.start(t);
    o.stop(t + dur + 0.02);
  }

  private pad(t: number) {
    if (!this.ctx) return;
    for (const f0 of [110, 138.6, 164.8]) {
      const o = this.ctx.createOscillator();
      o.type = "triangle";
      o.frequency.value = f0;
      o.detune.value = (Math.random() - 0.5) * 14;
      const g = this.ctx.createGain();
      g.gain.setValueAtTime(0.0001, t);
      g.gain.linearRampToValueAtTime(0.05, t + 0.6);
      g.gain.linearRampToValueAtTime(0.0001, t + 3.6);
      o.connect(g);
      g.connect(this.musicBus);
      o.start(t);
      o.stop(t + 3.8);
    }
  }

  /* --- SFX --- */

  shot() {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    const src = this.ctx.createBufferSource();
    src.buffer = this.noiseBuf;
    const f = this.ctx.createBiquadFilter();
    f.type = "lowpass";
    f.frequency.setValueAtTime(5200, t);
    f.frequency.exponentialRampToValueAtTime(300, t + 0.14);
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0.5, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.16);
    src.connect(f);
    f.connect(g);
    g.connect(this.sfxBus);
    src.start(t);
    src.stop(t + 0.18);
    const o = this.ctx.createOscillator();
    const og = this.ctx.createGain();
    o.type = "square";
    o.frequency.setValueAtTime(220, t);
    o.frequency.exponentialRampToValueAtTime(60, t + 0.1);
    og.gain.setValueAtTime(0.25, t);
    og.gain.exponentialRampToValueAtTime(0.001, t + 0.11);
    o.connect(og);
    og.connect(this.sfxBus);
    o.start(t);
    o.stop(t + 0.12);
  }

  shotgun() {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    // Tiefes Wummern
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.type = "sawtooth";
    o.frequency.setValueAtTime(110, t);
    o.frequency.exponentialRampToValueAtTime(28, t + 0.28);
    g.gain.setValueAtTime(0.7, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
    o.connect(g);
    g.connect(this.sfxBus);
    o.start(t);
    o.stop(t + 0.32);

    // Druckwelle
    const src = this.ctx.createBufferSource();
    src.buffer = this.noiseBuf;
    const f = this.ctx.createBiquadFilter();
    f.type = "lowpass";
    f.frequency.setValueAtTime(2400, t);
    f.frequency.exponentialRampToValueAtTime(200, t + 0.24);
    const ng = this.ctx.createGain();
    ng.gain.setValueAtTime(0.8, t);
    ng.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
    src.connect(f);
    f.connect(ng);
    ng.connect(this.sfxBus);
    src.start(t);
    src.stop(t + 0.28);
  }

  smg() {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    const src = this.ctx.createBufferSource();
    src.buffer = this.noiseBuf;
    const f = this.ctx.createBiquadFilter();
    f.type = "bandpass";
    f.frequency.setValueAtTime(3200, t);
    f.Q.value = 3;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0.42, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.06);
    src.connect(f);
    f.connect(g);
    g.connect(this.sfxBus);
    src.start(t);
    src.stop(t + 0.07);
  }

  bassCannon() {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.type = "sine";
    o.frequency.setValueAtTime(80, t);
    o.frequency.exponentialRampToValueAtTime(24, t + 0.45);
    g.gain.setValueAtTime(0.9, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.48);
    o.connect(g);
    g.connect(this.sfxBus);
    o.start(t);
    o.stop(t + 0.5);

    const f = this.ctx.createBiquadFilter();
    f.type = "lowpass";
    f.frequency.setValueAtTime(400, t);
    f.frequency.exponentialRampToValueAtTime(80, t + 0.4);
    const n = this.ctx.createBufferSource();
    n.buffer = this.noiseBuf;
    const ng = this.ctx.createGain();
    ng.gain.setValueAtTime(0.4, t);
    ng.gain.exponentialRampToValueAtTime(0.001, t + 0.4);
    n.connect(f);
    f.connect(ng);
    ng.connect(this.sfxBus);
    n.start(t);
    n.stop(t + 0.42);
  }

  splat() {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    const src = this.ctx.createBufferSource();
    src.buffer = this.noiseBuf;
    src.playbackRate.value = 0.55;
    const f = this.ctx.createBiquadFilter();
    f.type = "bandpass";
    f.frequency.value = 480;
    f.Q.value = 0.7;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0.65, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
    src.connect(f);
    f.connect(g);
    g.connect(this.sfxBus);
    src.start(t);
    src.stop(t + 0.32);
    const o = this.ctx.createOscillator();
    const og = this.ctx.createGain();
    o.type = "sawtooth";
    o.frequency.setValueAtTime(140, t);
    o.frequency.exponentialRampToValueAtTime(45, t + 0.18);
    og.gain.setValueAtTime(0.3, t);
    og.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
    o.connect(og);
    og.connect(this.sfxBus);
    o.start(t);
    o.stop(t + 0.22);
  }

  reload() {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    for (const [dt, fq] of [[0, 1400], [0.09, 900], [0.2, 1900]] as const) {
      const src = this.ctx.createBufferSource();
      src.buffer = this.noiseBuf;
      const f = this.ctx.createBiquadFilter();
      f.type = "bandpass";
      f.frequency.value = fq;
      f.Q.value = 4;
      const g = this.ctx.createGain();
      g.gain.setValueAtTime(0.4, t + dt);
      g.gain.exponentialRampToValueAtTime(0.001, t + dt + 0.06);
      src.connect(f);
      f.connect(g);
      g.connect(this.sfxBus);
      src.start(t + dt);
      src.stop(t + dt + 0.08);
    }
  }

  miss() {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    const src = this.ctx.createBufferSource();
    src.buffer = this.noiseBuf;
    const f = this.ctx.createBiquadFilter();
    f.type = "highpass";
    f.frequency.value = 4500;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0.16, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.07);
    src.connect(f);
    f.connect(g);
    g.connect(this.sfxBus);
    src.start(t);
    src.stop(t + 0.09);
  }

  heartLoss() {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    for (const [dt, fr] of [[0, 392], [0.12, 311], [0.24, 233]] as const) {
      const o = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      o.type = "sawtooth";
      o.frequency.value = fr;
      g.gain.setValueAtTime(0.22, t + dt);
      g.gain.exponentialRampToValueAtTime(0.001, t + dt + 0.16);
      o.connect(g);
      g.connect(this.sfxBus);
      o.start(t + dt);
      o.stop(t + dt + 0.18);
    }
  }

  shieldBreak() {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    const src = this.ctx.createBufferSource();
    src.buffer = this.noiseBuf;
    const f = this.ctx.createBiquadFilter();
    f.type = "highpass";
    f.frequency.setValueAtTime(1200, t);
    f.frequency.exponentialRampToValueAtTime(6000, t + 0.2);
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0.5, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.22);
    src.connect(f);
    f.connect(g);
    g.connect(this.sfxBus);
    src.start(t);
    src.stop(t + 0.24);
  }

  powerupPickup() {
    if (!this.ctx) return;
    const ctx = this.ctx;
    const t = ctx.currentTime;
    [587, 880, 1174, 1760].forEach((fr, i) => {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = "triangle";
      o.frequency.value = fr;
      g.gain.setValueAtTime(0.001, t + i * 0.05);
      g.gain.linearRampToValueAtTime(0.18, t + i * 0.05 + 0.01);
      g.gain.exponentialRampToValueAtTime(0.001, t + i * 0.05 + 0.2);
      o.connect(g);
      g.connect(this.sfxBus);
      o.start(t + i * 0.05);
      o.stop(t + i * 0.05 + 0.22);
    });
  }

  batFlap() {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    const src = this.ctx.createBufferSource();
    src.buffer = this.noiseBuf;
    const f = this.ctx.createBiquadFilter();
    f.type = "bandpass";
    f.frequency.value = 650;
    f.Q.value = 2.5;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0.18, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
    src.connect(f);
    f.connect(g);
    g.connect(this.sfxBus);
    src.start(t);
    src.stop(t + 0.12);
  }

  batScreech() {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.type = "sawtooth";
    o.frequency.setValueAtTime(2400, t);
    o.frequency.linearRampToValueAtTime(3200, t + 0.08);
    o.frequency.exponentialRampToValueAtTime(900, t + 0.2);
    g.gain.setValueAtTime(0.2, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.22);
    o.connect(g);
    g.connect(this.sfxBus);
    o.start(t);
    o.stop(t + 0.24);
  }

  handbagThrow() {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    const src = this.ctx.createBufferSource();
    src.buffer = this.noiseBuf;
    const f = this.ctx.createBiquadFilter();
    f.type = "lowpass";
    f.frequency.setValueAtTime(800, t);
    f.frequency.exponentialRampToValueAtTime(220, t + 0.35);
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0.4, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.38);
    src.connect(f);
    f.connect(g);
    g.connect(this.sfxBus);
    src.start(t);
    src.stop(t + 0.4);
  }

  handbagImpact() {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.type = "sine";
    o.frequency.setValueAtTime(90, t);
    o.frequency.exponentialRampToValueAtTime(30, t + 0.2);
    g.gain.setValueAtTime(0.5, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.22);
    o.connect(g);
    g.connect(this.sfxBus);
    o.start(t);
    o.stop(t + 0.24);
  }

  starPing() {
    if (!this.ctx) return;
    const ctx = this.ctx;
    const t = ctx.currentTime;
    [1318, 1568, 2093, 2637].forEach((fr, i) => {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = "sine";
      o.frequency.value = fr;
      g.gain.setValueAtTime(0.0001, t + i * 0.05);
      g.gain.linearRampToValueAtTime(0.16, t + i * 0.05 + 0.01);
      g.gain.exponentialRampToValueAtTime(0.001, t + i * 0.05 + 0.3);
      o.connect(g);
      g.connect(this.sfxBus);
      o.start(t + i * 0.05);
      o.stop(t + i * 0.05 + 0.34);
    });
  }

  roar() {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.type = "sawtooth";
    o.frequency.setValueAtTime(82, t);
    o.frequency.exponentialRampToValueAtTime(38, t + 0.9);
    const fo = this.ctx.createOscillator();
    const fg = this.ctx.createGain();
    fo.type = "sine";
    fo.frequency.setValueAtTime(7, t);
    fo.frequency.linearRampToValueAtTime(22, t + 0.9);
    fg.gain.value = 0.5;
    fo.connect(fg);
    fg.connect(g.gain);
    const f = this.ctx.createBiquadFilter();
    f.type = "lowpass";
    f.frequency.value = 420;
    f.Q.value = 3;
    g.gain.setValueAtTime(0.7, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 1.0);
    o.connect(f);
    f.connect(g);
    g.connect(this.sfxBus);
    o.start(t);
    o.stop(t + 1.05);
    fo.start(t);
    fo.stop(t + 1.05);
  }

  scream() {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.type = "sawtooth";
    o.frequency.setValueAtTime(980, t);
    o.frequency.exponentialRampToValueAtTime(1400, t + 0.06);
    o.frequency.exponentialRampToValueAtTime(300, t + 0.28);
    g.gain.setValueAtTime(0.2, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
    const f = this.ctx.createBiquadFilter();
    f.type = "bandpass";
    f.frequency.value = 1200;
    f.Q.value = 1.2;
    o.connect(f);
    f.connect(g);
    g.connect(this.sfxBus);
    o.start(t);
    o.stop(t + 0.32);
  }

  win() {
    if (!this.ctx) return;
    const ctx = this.ctx;
    const t = ctx.currentTime;
    [523, 659, 784, 1047, 784, 1047, 1319, 1568].forEach((fr, i) => {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = "triangle";
      o.frequency.value = fr;
      const tt = t + i * 0.11;
      g.gain.setValueAtTime(0.0001, tt);
      g.gain.linearRampToValueAtTime(0.22, tt + 0.02);
      g.gain.exponentialRampToValueAtTime(0.001, tt + 0.5);
      o.connect(g);
      g.connect(this.sfxBus);
      o.start(tt);
      o.stop(tt + 0.55);
    });
  }

  uiClick() {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.type = "square";
    o.frequency.setValueAtTime(660, t);
    o.frequency.exponentialRampToValueAtTime(330, t + 0.06);
    g.gain.setValueAtTime(0.18, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.08);
    o.connect(g);
    g.connect(this.sfxBus);
    o.start(t);
    o.stop(t + 0.1);
  }
}
