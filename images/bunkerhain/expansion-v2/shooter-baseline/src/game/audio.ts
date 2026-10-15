/* Synthetisierter Bunker-Techno (WebAudio, keine Audio-Dateien) + SFX. */

export class BunkerAudio {
  ctx: AudioContext | null = null;
  master!: GainNode;
  musicBus!: GainNode;
  sfxBus!: GainNode;
  bpm = 126;
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
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    this.ctx = new AC();
    this.master = this.ctx.createGain();
    this.master.gain.value = 0.9;
    const comp = this.ctx.createDynamicsCompressor();
    comp.threshold.value = -14; comp.knee.value = 20; comp.ratio.value = 5;
    this.master.connect(comp); comp.connect(this.ctx.destination);
    this.musicBus = this.ctx.createGain(); this.musicBus.gain.value = 0.72; this.musicBus.connect(this.master);
    this.sfxBus = this.ctx.createGain(); this.sfxBus.gain.value = 0.9; this.sfxBus.connect(this.master);
    const len = this.ctx.sampleRate * 1.2;
    this.noiseBuf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const d = this.noiseBuf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
  }

  setMuted(m: boolean) {
    this.muted = m;
    if (this.master && this.ctx) this.master.gain.setTargetAtTime(m ? 0 : 0.9, this.ctx.currentTime, 0.03);
  }

  startMusic() {
    if (!this.ctx || this.timer !== null) return;
    this.step = 0;
    this.nextT = this.ctx.currentTime + 0.08;
    const tick = () => {
      if (!this.ctx) return;
      const spb = 60 / this.bpm / 4; // 16tel
      while (this.nextT < this.ctx.currentTime + 0.12) {
        this.schedule(this.step, this.nextT, spb);
        this.step = (this.step + 1) % 64;
        this.nextT += spb;
      }
      this.timer = window.setTimeout(tick, 40);
    };
    tick();
  }

  stopMusic() {
    if (this.timer !== null) { clearTimeout(this.timer); this.timer = null; }
  }

  /* --- Pattern --- */
  private schedule(s: number, t: number, spb: number) {
    const beat = s % 16;
    // Kick: jede Viertel
    if (s % 4 === 0) {
      this.kick(t, this.musicBus, s % 16 === 0 ? 1 : 0.88);
      if (this.ctx && this.onBeat && s % 4 === 0) {
        const b = s / 4;
        const dt = Math.max(0, (t - this.ctx.currentTime) * 1000);
        window.setTimeout(() => { if (this.lastBeat !== b) { this.lastBeat = b; this.onBeat?.(b); } }, dt);
      }
    }
    // Clap auf 2 & 4
    if (beat === 4 || beat === 12) this.clap(t, 0.5);
    // Offbeat Hats
    if (s % 4 === 2) this.hat(t, 0.34, 6000);
    else if (s % 2 === 1) this.hat(t, 0.12, 9000);
    // Acid-Bass: rollende 16tel
    const bassSeq = [0, 0, 3, 0, 0, 5, 0, 3, 0, 0, 7, 5, 3, 0, 10, 3];
    if (s % 2 === 0) this.bass(t, bassSeq[s % 16], spb * 1.8, 0.16);
    // Pad-Stab alle 4 Bars
    if (s === 0) this.pad(t);
    // Perc-Ride
    if (s % 8 === 6) this.hat(t, 0.2, 3200, 0.18);
  }

  private kick(t: number, bus: GainNode, vel = 1) {
    if (!this.ctx) return;
    const o = this.ctx.createOscillator(), g = this.ctx.createGain();
    o.type = "sine";
    o.frequency.setValueAtTime(155, t);
    o.frequency.exponentialRampToValueAtTime(44, t + 0.11);
    g.gain.setValueAtTime(0.9 * vel, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.24);
    o.connect(g); g.connect(bus);
    o.start(t); o.stop(t + 0.26);
    const c = this.ctx.createOscillator(), cg = this.ctx.createGain();
    c.type = "square"; c.frequency.value = 900;
    cg.gain.setValueAtTime(0.12 * vel, t); cg.gain.exponentialRampToValueAtTime(0.001, t + 0.02);
    c.connect(cg); cg.connect(bus); c.start(t); c.stop(t + 0.03);
  }

  private clap(t: number, vel: number) {
    if (!this.ctx) return;
    for (let i = 0; i < 3; i++) {
      const src = this.ctx.createBufferSource(); src.buffer = this.noiseBuf;
      const f = this.ctx.createBiquadFilter(); f.type = "bandpass"; f.frequency.value = 1700; f.Q.value = 1.4;
      const g = this.ctx.createGain();
      const tt = t + i * 0.012;
      g.gain.setValueAtTime(vel * (1 - i * 0.22), tt);
      g.gain.exponentialRampToValueAtTime(0.001, tt + 0.12);
      src.connect(f); f.connect(g); g.connect(this.musicBus);
      src.start(tt); src.stop(tt + 0.16);
    }
  }

  private hat(t: number, vel: number, freq: number, dur = 0.05) {
    if (!this.ctx) return;
    const src = this.ctx.createBufferSource(); src.buffer = this.noiseBuf; src.playbackRate.value = 1.5;
    const f = this.ctx.createBiquadFilter(); f.type = "highpass"; f.frequency.value = freq;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(vel, t); g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    src.connect(f); f.connect(g); g.connect(this.musicBus);
    src.start(t); src.stop(t + dur + 0.02);
  }

  private bass(t: number, semi: number, dur: number, vel: number) {
    if (!this.ctx) return;
    const o = this.ctx.createOscillator(); o.type = "sawtooth";
    o.frequency.value = 55 * Math.pow(2, semi / 12);
    const f = this.ctx.createBiquadFilter(); f.type = "lowpass"; f.Q.value = 9;
    f.frequency.setValueAtTime(900, t);
    f.frequency.exponentialRampToValueAtTime(190, t + dur);
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(vel, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    o.connect(f); f.connect(g); g.connect(this.musicBus);
    o.start(t); o.stop(t + dur + 0.02);
  }

  private pad(t: number) {
    if (!this.ctx) return;
    for (const f0 of [110, 138.6, 164.8]) {
      const o = this.ctx.createOscillator(); o.type = "triangle"; o.frequency.value = f0;
      o.detune.value = (Math.random() - 0.5) * 14;
      const g = this.ctx.createGain();
      g.gain.setValueAtTime(0.0001, t);
      g.gain.linearRampToValueAtTime(0.05, t + 0.6);
      g.gain.linearRampToValueAtTime(0.0001, t + 3.6);
      o.connect(g); g.connect(this.musicBus);
      o.start(t); o.stop(t + 3.8);
    }
  }

  /* --- SFX --- */
  shot() {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    const src = this.ctx.createBufferSource(); src.buffer = this.noiseBuf;
    const f = this.ctx.createBiquadFilter(); f.type = "lowpass"; f.frequency.setValueAtTime(5200, t);
    f.frequency.exponentialRampToValueAtTime(300, t + 0.14);
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0.5, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.16);
    src.connect(f); f.connect(g); g.connect(this.sfxBus);
    src.start(t); src.stop(t + 0.18);
    const o = this.ctx.createOscillator(), og = this.ctx.createGain();
    o.type = "square"; o.frequency.setValueAtTime(220, t); o.frequency.exponentialRampToValueAtTime(60, t + 0.1);
    og.gain.setValueAtTime(0.25, t); og.gain.exponentialRampToValueAtTime(0.001, t + 0.11);
    o.connect(og); og.connect(this.sfxBus); o.start(t); o.stop(t + 0.12);
  }

  splat() {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    const src = this.ctx.createBufferSource(); src.buffer = this.noiseBuf; src.playbackRate.value = 0.55;
    const f = this.ctx.createBiquadFilter(); f.type = "bandpass"; f.frequency.value = 480; f.Q.value = 0.7;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0.65, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
    src.connect(f); f.connect(g); g.connect(this.sfxBus);
    src.start(t); src.stop(t + 0.32);
    const o = this.ctx.createOscillator(), og = this.ctx.createGain();
    o.type = "sawtooth";
    o.frequency.setValueAtTime(140, t); o.frequency.exponentialRampToValueAtTime(45, t + 0.18);
    og.gain.setValueAtTime(0.3, t); og.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
    o.connect(og); og.connect(this.sfxBus); o.start(t); o.stop(t + 0.22);
  }

  reload() {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    for (const [dt, fq] of [[0, 1400], [0.09, 900], [0.2, 1900]] as const) {
      const src = this.ctx.createBufferSource(); src.buffer = this.noiseBuf;
      const f = this.ctx.createBiquadFilter(); f.type = "bandpass"; f.frequency.value = fq; f.Q.value = 4;
      const g = this.ctx.createGain();
      g.gain.setValueAtTime(0.4, t + dt); g.gain.exponentialRampToValueAtTime(0.001, t + dt + 0.06);
      src.connect(f); f.connect(g); g.connect(this.sfxBus);
      src.start(t + dt); src.stop(t + dt + 0.08);
    }
  }

  miss() {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    const src = this.ctx.createBufferSource(); src.buffer = this.noiseBuf;
    const f = this.ctx.createBiquadFilter(); f.type = "highpass"; f.frequency.value = 4500;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0.16, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.07);
    src.connect(f); f.connect(g); g.connect(this.sfxBus);
    src.start(t); src.stop(t + 0.09);
  }

  heartLoss() {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    for (const [dt, fr] of [[0, 392], [0.12, 311], [0.24, 233]] as const) {
      const o = this.ctx.createOscillator(), g = this.ctx.createGain();
      o.type = "sawtooth"; o.frequency.value = fr;
      g.gain.setValueAtTime(0.22, t + dt); g.gain.exponentialRampToValueAtTime(0.001, t + dt + 0.16);
      o.connect(g); g.connect(this.sfxBus); o.start(t + dt); o.stop(t + dt + 0.18);
    }
  }

  starPing() {
    if (!this.ctx) return;
    const ctx = this.ctx;
    const t = ctx.currentTime;
    [1318, 1568, 2093, 2637].forEach((fr, i) => {
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.type = "sine"; o.frequency.value = fr;
      g.gain.setValueAtTime(0.0001, t + i * 0.05);
      g.gain.linearRampToValueAtTime(0.16, t + i * 0.05 + 0.01);
      g.gain.exponentialRampToValueAtTime(0.001, t + i * 0.05 + 0.3);
      o.connect(g); g.connect(this.sfxBus); o.start(t + i * 0.05); o.stop(t + i * 0.05 + 0.34);
    });
  }

  roar() {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    const o = this.ctx.createOscillator(), g = this.ctx.createGain();
    o.type = "sawtooth";
    o.frequency.setValueAtTime(82, t);
    o.frequency.exponentialRampToValueAtTime(38, t + 0.9);
    const fo = this.ctx.createOscillator(), fg = this.ctx.createGain();
    fo.type = "sine"; fo.frequency.setValueAtTime(7, t); fo.frequency.linearRampToValueAtTime(22, t + 0.9);
    fg.gain.value = 0.5; fo.connect(fg); fg.connect(g.gain);
    const f = this.ctx.createBiquadFilter(); f.type = "lowpass"; f.frequency.value = 420; f.Q.value = 3;
    g.gain.setValueAtTime(0.7, t); g.gain.exponentialRampToValueAtTime(0.001, t + 1.0);
    o.connect(f); f.connect(g); g.connect(this.sfxBus);
    o.start(t); o.stop(t + 1.05); fo.start(t); fo.stop(t + 1.05);
  }

  scream() {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    const o = this.ctx.createOscillator(), g = this.ctx.createGain();
    o.type = "sawtooth";
    o.frequency.setValueAtTime(980, t);
    o.frequency.exponentialRampToValueAtTime(1400, t + 0.06);
    o.frequency.exponentialRampToValueAtTime(300, t + 0.28);
    g.gain.setValueAtTime(0.2, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
    const f = this.ctx.createBiquadFilter(); f.type = "bandpass"; f.frequency.value = 1200; f.Q.value = 1.2;
    o.connect(f); f.connect(g); g.connect(this.sfxBus);
    o.start(t); o.stop(t + 0.32);
  }

  win() {
    if (!this.ctx) return;
    const ctx = this.ctx;
    const t = ctx.currentTime;
    [523, 659, 784, 1047, 784, 1047, 1319, 1568].forEach((fr, i) => {
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.type = "triangle"; o.frequency.value = fr;
      const tt = t + i * 0.11;
      g.gain.setValueAtTime(0.0001, tt);
      g.gain.linearRampToValueAtTime(0.22, tt + 0.02);
      g.gain.exponentialRampToValueAtTime(0.001, tt + 0.5);
      o.connect(g); g.connect(this.sfxBus); o.start(tt); o.stop(tt + 0.55);
    });
  }

  uiClick() {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    const o = this.ctx.createOscillator(), g = this.ctx.createGain();
    o.type = "square"; o.frequency.setValueAtTime(660, t); o.frequency.exponentialRampToValueAtTime(330, t + 0.06);
    g.gain.setValueAtTime(0.18, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.08);
    o.connect(g); g.connect(this.sfxBus); o.start(t); o.stop(t + 0.1);
  }
}
