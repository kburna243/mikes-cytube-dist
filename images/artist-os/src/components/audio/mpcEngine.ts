"use client";

import { ensureAudio, clamp } from "./bus";
import { TRACKS, SAMPLE_LOOPS } from "@/lib/data";

export type Bank = "A" | "B" | "C";

export const BANK_LABELS: Record<Bank, string> = {
  A: "FUNK & DRUM KIT",
  B: "NOIZY TRACK STEMS",
  C: "VINYL SCRATCH & FX",
};

export const PAD_NAMES: Record<Bank, string[]> = {
  A: [
    "KICK", "SNARE", "HAT CLSD", "HAT OPEN",
    "TOM HI", "TOM LOW", "CLAP", "SHAKER",
    "BASS STB 1", "BASS STB 2", "RHODES", "WAH LICK",
    "SCR DOWN", "SCR UP", "YEAH!", "BRXLN HORN",
  ],
  B: [
    "BFG LOOP 1", "BFG LOOP 2", "BFG BASS", "BFG HORNS",
    "KNS DRUMS", "KNS ARP", "KNS VOCAL", "KNS DUB",
    "NLF BREAK", "NLF PIANO", "NLF VINYL", "NLF SUB",
    "LOOP ON", "LOOP TS", "LOOP VE", "FULL BREAK",
  ],
  C: [
    "CHIRP", "FLARE", "TEAR", "TRANSFORM",
    "CRACKLE", "TAPE STOP", "REWIND", "AIR HORN",
    "DUB SIREN", "ECHO FEED", "UH!", "YEAH! 2",
    "LASER", "SUB DROP", "VINYL STOP", "NEEDLE SKIP",
  ],
};

type LoopHandle = { src: AudioBufferSourceNode; gain: GainNode };

/**
 * MPC 3000 engine. Signal chain:
 * pads → bus gain → BiquadFilter (cutoff knob) → master gain → analyser → out
 */
class MpcEngine {
  private ctx: AudioContext | null = null;
  private bus!: GainNode;
  private filter!: BiquadFilterNode;
  private master!: GainNode;
  private analyser!: AnalyserNode;
  private buffers = new Map<string, Promise<AudioBuffer>>();
  private loops = new Map<string, LoopHandle>();
  private noiseBuf: AudioBuffer | null = null;
  cutoff = 18000;
  bpm = 94;
  onTrigger: ((bank: Bank, pad: number, name: string) => void) | null = null;
  onLoopState: ((key: string, playing: boolean) => void) | null = null;

  async ready(): Promise<AudioContext> {
    if (this.ctx) {
      await ensureAudio();
      return this.ctx;
    }
    const ctx = await ensureAudio();
    this.ctx = ctx;
    this.bus = ctx.createGain();
    this.bus.gain.value = 1;
    this.filter = ctx.createBiquadFilter();
    this.filter.type = "lowpass";
    this.filter.frequency.value = this.cutoff;
    this.filter.Q.value = 0.9;
    this.master = ctx.createGain();
    this.master.gain.value = 0.9;
    this.analyser = ctx.createAnalyser();
    this.analyser.fftSize = 128;
    this.bus.connect(this.filter);
    this.filter.connect(this.master);
    this.master.connect(this.analyser);
    this.analyser.connect(ctx.destination);
    const len = ctx.sampleRate * 1.2;
    this.noiseBuf = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = this.noiseBuf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    // preload real audio in the background
    void this.load(TRACKS[0].src);
    void this.load(TRACKS[1].src);
    void this.load(TRACKS[2].src);
    void this.load(SAMPLE_LOOPS.on);
    void this.load(SAMPLE_LOOPS.ts);
    void this.load(SAMPLE_LOOPS.ve);
    return ctx;
  }

  setCutoff(hz: number) {
    this.cutoff = clamp(hz, 40, 19000);
    if (this.filter && this.ctx) {
      const t = this.ctx.currentTime;
      this.filter.frequency.cancelScheduledValues(t);
      this.filter.frequency.setTargetAtTime(this.cutoff, t, 0.015);
    }
  }

  setVolume(v: number) {
    if (this.master) this.master.gain.value = clamp(v, 0, 1);
  }

  getAnalyser(): AnalyserNode | null {
    return this.ctx ? this.analyser : null;
  }

  isLooping(key: string) {
    return this.loops.has(key);
  }

  private load(url: string): Promise<AudioBuffer> {
    let p = this.buffers.get(url);
    if (!p) {
      p = (async () => {
        const ctx = await this.ready();
        const res = await fetch(url);
        const raw = await res.arrayBuffer();
        return await ctx.decodeAudioData(raw.slice(0));
      })();
      this.buffers.set(url, p);
    }
    return p;
  }

  /** fire a pad; loops toggle. */
  async trigger(bank: Bank, pad: number) {
    const ctx = await this.ready();
    const name = PAD_NAMES[bank][pad];
    this.onTrigger?.(bank, pad, name);

    // toggle-loop pads
    const loopKey = this.loopKeyFor(bank, pad);
    if (loopKey) {
      if (this.loops.has(loopKey)) {
        this.stopLoop(loopKey);
        return;
      }
      const buf =
        loopKey === "crackle"
          ? await this.crackleBuffer()
          : await this.load(
              loopKey.startsWith("sample") ? SAMPLE_LOOPS[loopKey.slice(7) as keyof typeof SAMPLE_LOOPS] : TRACKS[2].src
            );
      if (this.loops.has(loopKey)) return;
      const src = ctx.createBufferSource();
      src.buffer = buf;
      src.loop = true;
      if (loopKey === "fullbreak") {
        src.loopStart = 0;
        src.loopEnd = Math.min(5.45, buf.duration);
      }
      const g = ctx.createGain();
      g.gain.value = 0.9;
      src.connect(g);
      g.connect(this.bus);
      src.start();
      this.loops.set(loopKey, { src, gain: g });
      this.onLoopState?.(loopKey, true);
      return;
    }

    if (bank === "A") this.synthKit(pad);
    else if (bank === "B") void this.playChop(pad);
    else this.vinylFx(pad);
  }

  private loopKeyFor(bank: Bank, pad: number): string | null {
    if (bank === "B" && pad >= 12 && pad <= 14) return ["sample-on", "sample-ts", "sample-ve"][pad - 12];
    if (bank === "B" && pad === 15) return "fullbreak";
    if (bank === "C" && pad === 4) return "crackle";
    return null;
  }

  stopLoop(key: string) {
    const h = this.loops.get(key);
    if (!h) return;
    try {
      h.gain.gain.setTargetAtTime(0, this.ctx!.currentTime, 0.05);
      h.src.stop(this.ctx!.currentTime + 0.2);
    } catch { /* already stopped */ }
    this.loops.delete(key);
    this.onLoopState?.(key, false);
  }

  stopAllLoops() {
    for (const key of [...this.loops.keys()]) this.stopLoop(key);
  }

  /* ---------------- Bank B: real chops from the three tracks ---------------- */
  private chopMap(): { url: string; start: number; dur: number }[] {
    const [t1, t2, t3] = TRACKS.map((t) => t.src);
    const b94 = 60 / 94; // berlin funk groove beat
    const b105 = 60 / 105;
    const b88 = 60 / 88;
    return [
      { url: t1, start: 0.02, dur: b94 * 4 },
      { url: t1, start: b94 * 12, dur: b94 * 4 },
      { url: t1, start: b94 * 32, dur: b94 * 8 },
      { url: t1, start: b94 * 64, dur: b94 * 2 },
      { url: t2, start: 0.02, dur: b105 * 4 },
      { url: t2, start: b105 * 10, dur: b105 * 4 },
      { url: t2, start: b105 * 36, dur: b105 * 4 },
      { url: t2, start: b105 * 80, dur: b105 * 2 },
      { url: t3, start: 0.02, dur: b88 * 4 },
      { url: t3, start: b88 * 8, dur: b88 * 4 },
      { url: t3, start: b88 * 20, dur: b88 * 4 },
      { url: t3, start: b88 * 48, dur: b88 * 4 },
    ];
  }

  private async playChop(pad: number) {
    const ctx = await this.ready();
    const chop = this.chopMap()[pad];
    if (!chop) return;
    const buf = await this.load(chop.url);
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const g = ctx.createGain();
    g.gain.value = 1;
    src.connect(g);
    g.connect(this.bus);
    src.start(0, Math.min(chop.start, Math.max(0, buf.duration - 0.5)), Math.min(chop.dur, buf.duration));
  }

  /* ---------------- synth helpers ---------------- */
  private out(node: AudioNode) {
    node.connect(this.bus);
  }

  private noise(dur: number, filterType: BiquadFilterType, freq: number, q = 1): { src: AudioBufferSourceNode; filt: BiquadFilterNode; g: GainNode } {
    const ctx = this.ctx!;
    const src = ctx.createBufferSource();
    src.buffer = this.noiseBuf;
    src.playbackRate.value = 1;
    const filt = ctx.createBiquadFilter();
    filt.type = filterType;
    filt.frequency.value = freq;
    filt.Q.value = q;
    const g = ctx.createGain();
    g.gain.value = 0;
    src.connect(filt);
    filt.connect(g);
    this.out(g);
    src.start();
    src.stop(ctx.currentTime + dur + 0.3);
    return { src, filt, g };
  }

  private tone(type: OscillatorType, freq: number): { osc: OscillatorNode; g: GainNode } {
    const ctx = this.ctx!;
    const osc = ctx.createOscillator();
    osc.type = type;
    osc.frequency.value = freq;
    const g = ctx.createGain();
    g.gain.value = 0;
    osc.connect(g);
    this.out(g);
    osc.start();
    return { osc, g };
  }

  /* ---------------- Bank A: funk drum kit ---------------- */
  private synthKit(p: number) {
    const ctx = this.ctx!;
    const t = ctx.currentTime;
    const stop = (o: OscillatorNode, when: number) => { try { o.stop(when); } catch { /* noop */ } };
    switch (p) {
      case 0: { // KICK
        const { osc, g } = this.tone("sine", 150);
        osc.frequency.exponentialRampToValueAtTime(46, t + 0.11);
        g.gain.setValueAtTime(1.0, t);
        g.gain.exponentialRampToValueAtTime(0.001, t + 0.32);
        stop(osc, t + 0.35);
        break;
      }
      case 1: { // SNARE
        const n = this.noise(0.25, "bandpass", 1900, 0.8);
        n.g.gain.setValueAtTime(0.85, t);
        n.g.gain.exponentialRampToValueAtTime(0.001, t + 0.19);
        const { osc, g } = this.tone("triangle", 185);
        g.gain.setValueAtTime(0.5, t);
        g.gain.exponentialRampToValueAtTime(0.001, t + 0.11);
        stop(osc, t + 0.14);
        break;
      }
      case 2: { // HAT CLOSED
        const n = this.noise(0.08, "highpass", 7800);
        n.g.gain.setValueAtTime(0.5, t);
        n.g.gain.exponentialRampToValueAtTime(0.001, t + 0.055);
        break;
      }
      case 3: { // HAT OPEN
        const n = this.noise(0.4, "highpass", 7200);
        n.g.gain.setValueAtTime(0.45, t);
        n.g.gain.exponentialRampToValueAtTime(0.001, t + 0.38);
        break;
      }
      case 4: case 5: { // TOMS
        const f = p === 4 ? 196 : 128;
        const { osc, g } = this.tone("sine", f);
        osc.frequency.exponentialRampToValueAtTime(f * 0.6, t + 0.22);
        g.gain.setValueAtTime(0.8, t);
        g.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
        stop(osc, t + 0.33);
        break;
      }
      case 6: { // CLAP, triple noise burst
        for (let i = 0; i < 3; i++) {
          const tt = t + i * 0.024;
          const n = this.noise(0.25, "bandpass", 1150, 1.4);
          n.g.gain.setValueAtTime(0, t);
          n.g.gain.setValueAtTime(0.6, tt);
          n.g.gain.exponentialRampToValueAtTime(0.001, tt + (i === 2 ? 0.19 : 0.05));
        }
        break;
      }
      case 7: { // SHAKER
        const n = this.noise(0.14, "highpass", 5600);
        n.g.gain.linearRampToValueAtTime(0.42, t + 0.02);
        n.g.gain.exponentialRampToValueAtTime(0.001, t + 0.13);
        break;
      }
      case 8: case 9: { // BASS STABS
        const f = p === 8 ? 55 : 65.4;
        const { osc, g } = this.tone("square", f);
        const lp = ctx.createBiquadFilter();
        lp.type = "lowpass";
        lp.frequency.setValueAtTime(900, t);
        lp.frequency.exponentialRampToValueAtTime(180, t + 0.3);
        osc.disconnect();
        osc.connect(lp);
        lp.connect(g);
        g.gain.setValueAtTime(0.7, t);
        g.gain.exponentialRampToValueAtTime(0.001, t + 0.36);
        stop(osc, t + 0.4);
        const { osc: o2, g: g2 } = this.tone("sine", f / 2);
        g2.gain.setValueAtTime(0.5, t);
        g2.gain.exponentialRampToValueAtTime(0.001, t + 0.34);
        stop(o2, t + 0.38);
        break;
      }
      case 10: { // RHODES CHORD, Fmaj7
        const freqs = [174.61, 220, 261.63, 329.63];
        for (const f of freqs) {
          const { osc, g } = this.tone("sine", f);
          const { osc: o2, g: g2 } = this.tone("triangle", f * 2.001);
          g.gain.setValueAtTime(0, t);
          g.gain.linearRampToValueAtTime(0.24, t + 0.02);
          g.gain.exponentialRampToValueAtTime(0.001, t + 1.4);
          g2.gain.setValueAtTime(0, t);
          g2.gain.linearRampToValueAtTime(0.07, t + 0.02);
          g2.gain.exponentialRampToValueAtTime(0.001, t + 1.1);
          stop(osc, t + 1.5);
          stop(o2, t + 1.2);
        }
        break;
      }
      case 11: { // WAH LICK
        const { osc, g } = this.tone("sawtooth", 220);
        const bp = ctx.createBiquadFilter();
        bp.type = "bandpass";
        bp.Q.value = 6;
        bp.frequency.setValueAtTime(400, t);
        bp.frequency.exponentialRampToValueAtTime(2500, t + 0.16);
        bp.frequency.exponentialRampToValueAtTime(500, t + 0.4);
        osc.disconnect();
        osc.connect(bp);
        bp.connect(g);
        g.gain.setValueAtTime(0.5, t);
        g.gain.exponentialRampToValueAtTime(0.001, t + 0.45);
        stop(osc, t + 0.5);
        break;
      }
      case 12: case 13: { // SCRATCH DOWN / UP
        const n = this.noise(0.35, "bandpass", p === 12 ? 3200 : 480, 2.5);
        const dest = p === 12 ? 380 : 4600;
        n.filt.frequency.exponentialRampToValueAtTime(dest, t + 0.28);
        const lfo = ctx.createOscillator();
        lfo.frequency.value = p === 12 ? 14 : 18;
        const lg = ctx.createGain();
        lg.gain.value = 0.34;
        lfo.connect(lg);
        lg.connect(n.g.gain);
        lfo.start(t);
        lfo.stop(t + 0.35);
        n.g.gain.setValueAtTime(0.62, t);
        n.g.gain.exponentialRampToValueAtTime(0.001, t + 0.32);
        break;
      }
      case 14: { // YEAH, formant blip
        const { osc, g } = this.tone("sawtooth", 196);
        osc.frequency.linearRampToValueAtTime(233, t + 0.14);
        const f1 = ctx.createBiquadFilter();
        f1.type = "bandpass";
        f1.frequency.value = 850;
        f1.Q.value = 4;
        osc.disconnect();
        osc.connect(f1);
        f1.connect(g);
        g.gain.setValueAtTime(0.75, t);
        g.gain.exponentialRampToValueAtTime(0.001, t + 0.28);
        stop(osc, t + 0.32);
        break;
      }
      case 15: { // BERLIN HORN, Bb brass hit
        for (const f of [233.08, 293.66, 349.23]) {
          const { osc, g } = this.tone("sawtooth", f);
          const lp = ctx.createBiquadFilter();
          lp.type = "lowpass";
          lp.frequency.setValueAtTime(2600, t);
          lp.frequency.exponentialRampToValueAtTime(700, t + 0.4);
          osc.disconnect();
          osc.connect(lp);
          lp.connect(g);
          g.gain.setValueAtTime(0, t);
          g.gain.linearRampToValueAtTime(0.3, t + 0.02);
          g.gain.exponentialRampToValueAtTime(0.001, t + 0.5);
          stop(osc, t + 0.55);
        }
        break;
      }
    }
  }

  /* ---------------- Bank C: vinyl scratches & FX ---------------- */
  private vinylFx(p: number) {
    const ctx = this.ctx!;
    const t = ctx.currentTime;
    const stop = (o: OscillatorNode, when: number) => { try { o.stop(when); } catch { /* noop */ } };
    const scratch = (f0: number, f1: number, dur: number, vol = 0.55) => {
      const n = this.noise(dur + 0.1, "bandpass", f0, 3);
      n.filt.frequency.exponentialRampToValueAtTime(f1, t + dur);
      n.g.gain.setValueAtTime(vol, t);
      n.g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    };
    switch (p) {
      case 0: scratch(600, 3800, 0.12); break; // CHIRP
      case 1: { // FLARE, two-way cut
        scratch(3200, 560, 0.13);
        setTimeout(() => this.ctx && scratch(500, 3400, 0.12), 130);
        break;
      }
      case 2: { // TEAR
        const n = this.noise(0.3, "bandpass", 1500, 2);
        const lfo = ctx.createOscillator();
        lfo.type = "square";
        lfo.frequency.value = 22;
        const lg = ctx.createGain();
        lg.gain.value = 0.4;
        lfo.connect(lg);
        lg.connect(n.g.gain);
        lfo.start(t);
        lfo.stop(t + 0.3);
        n.g.gain.setValueAtTime(0.42, t);
        n.g.gain.exponentialRampToValueAtTime(0.001, t + 0.28);
        break;
      }
      case 3: { // TRANSFORM
        for (let i = 0; i < 7; i++) {
          const tt = t + i * 0.045;
          const n = this.noise(0.05, "highpass", 2400);
          n.g.gain.setValueAtTime(0, t);
          n.g.gain.setValueAtTime(0.5, tt);
          n.g.gain.exponentialRampToValueAtTime(0.001, tt + 0.028);
        }
        break;
      }
      case 5: { // TAPE STOP, real chop pitching down
        void (async () => {
          const buf = await this.load(TRACKS[0].src);
          if (!this.ctx) return;
          const cc = this.ctx;
          const src = cc.createBufferSource();
          src.buffer = buf;
          const tt = cc.currentTime;
          src.playbackRate.setValueAtTime(1, tt);
          src.playbackRate.exponentialRampToValueAtTime(0.03, tt + 1.1);
          const g = cc.createGain();
          g.gain.setValueAtTime(0, tt);
          g.gain.linearRampToValueAtTime(0.9, tt + 0.05);
          g.gain.linearRampToValueAtTime(0, tt + 1.15);
          src.connect(g);
          g.connect(this.bus);
          src.start(tt, 12, 1.4);
          src.stop(tt + 1.3);
        })();
        break;
      }
      case 6: { // REWIND
        const { osc, g } = this.tone("sine", 300);
        osc.frequency.exponentialRampToValueAtTime(3400, t + 0.55);
        g.gain.setValueAtTime(0.22, t);
        g.gain.exponentialRampToValueAtTime(0.001, t + 0.6);
        stop(osc, t + 0.65);
        scratch(900, 4200, 0.5, 0.2);
        break;
      }
      case 7: { // AIR HORN
        for (const f of [415.3, 466.16, 554.37]) {
          const { osc, g } = this.tone("sawtooth", f);
          const lfo = ctx.createOscillator();
          lfo.frequency.value = 6.5;
          const lg = ctx.createGain();
          lg.gain.value = 9;
          lfo.connect(lg);
          lg.connect(osc.frequency);
          lfo.start(t);
          lfo.stop(t + 0.9);
          g.gain.setValueAtTime(0.22, t);
          g.gain.setValueAtTime(0.22, t + 0.7);
          g.gain.exponentialRampToValueAtTime(0.001, t + 0.95);
          stop(osc, t + 1);
        }
        break;
      }
      case 8: { // DUB SIREN
        const { osc, g } = this.tone("square", 215);
        const lfo = ctx.createOscillator();
        lfo.frequency.value = 3.6;
        const lg = ctx.createGain();
        lg.gain.value = 70;
        lfo.connect(lg);
        lg.connect(osc.frequency);
        lfo.start(t);
        lfo.stop(t + 1.1);
        g.gain.setValueAtTime(0.26, t);
        g.gain.exponentialRampToValueAtTime(0.001, t + 1.1);
        stop(osc, t + 1.15);
        break;
      }
      case 9: { // ECHO FEED, noise burst into feedback delay
        const dl = ctx.createDelay(1);
        dl.delayTime.value = 60 / 94 / 2;
        const fb = ctx.createGain();
        fb.gain.value = 0.62;
        const wet = ctx.createGain();
        wet.gain.value = 0.5;
        dl.connect(fb);
        fb.connect(dl);
        dl.connect(wet);
        this.out(wet);
        const n = this.noise(0.08, "bandpass", 1800, 2);
        n.g.disconnect();
        n.g.connect(dl);
        n.g.gain.setValueAtTime(0.7, t);
        n.g.gain.exponentialRampToValueAtTime(0.001, t + 0.06);
        setTimeout(() => { try { fb.gain.value = 0; dl.disconnect(); } catch { /* noop */ } }, 3200);
        break;
      }
      case 10: case 11: { // UH / YEAH shouts
        const f = p === 10 ? 150 : 210;
        const { osc, g } = this.tone("sawtooth", f);
        const bp = ctx.createBiquadFilter();
        bp.type = "bandpass";
        bp.frequency.value = p === 10 ? 640 : 900;
        bp.Q.value = 3.5;
        osc.disconnect();
        osc.connect(bp);
        bp.connect(g);
        g.gain.setValueAtTime(0.6, t);
        g.gain.exponentialRampToValueAtTime(0.001, t + (p === 10 ? 0.18 : 0.3));
        stop(osc, t + 0.35);
        break;
      }
      case 12: { // LASER
        const { osc, g } = this.tone("sine", 2600);
        osc.frequency.exponentialRampToValueAtTime(110, t + 0.17);
        g.gain.setValueAtTime(0.4, t);
        g.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
        stop(osc, t + 0.24);
        break;
      }
      case 13: { // SUB DROP
        const { osc, g } = this.tone("sine", 120);
        osc.frequency.exponentialRampToValueAtTime(34, t + 0.85);
        g.gain.setValueAtTime(0.85, t);
        g.gain.exponentialRampToValueAtTime(0.001, t + 0.95);
        stop(osc, t + 1);
        break;
      }
      case 14: { // VINYL STOP
        const n = this.noise(0.5, "lowpass", 900);
        n.g.gain.setValueAtTime(0.35, t);
        n.g.gain.exponentialRampToValueAtTime(0.001, t + 0.45);
        const { osc, g } = this.tone("sine", 220);
        osc.frequency.exponentialRampToValueAtTime(30, t + 0.4);
        g.gain.setValueAtTime(0.3, t);
        g.gain.exponentialRampToValueAtTime(0.001, t + 0.45);
        stop(osc, t + 0.5);
        break;
      }
      case 15: { // NEEDLE SKIP
        for (let i = 0; i < 4; i++) {
          const tt = t + i * 0.09;
          const n = this.noise(0.04, "bandpass", 2600, 5);
          n.g.gain.setValueAtTime(0, t);
          n.g.gain.setValueAtTime(0.8, tt);
          n.g.gain.exponentialRampToValueAtTime(0.001, tt + 0.035);
        }
        break;
      }
      default:
        break;
      // case 4 (CRACKLE loop) handled by loopKeyFor
    }
  }

  /** generated vinyl crackle loop for Bank C pad 5 */
  async crackleBuffer(): Promise<AudioBuffer> {
    const ctx = await this.ready();
    const len = ctx.sampleRate * 2;
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) {
      d[i] = (Math.random() * 2 - 1) * 0.012;
      if (Math.random() < 0.0009) {
        const amp = 0.25 + Math.random() * 0.5;
        for (let j = 0; j < 24 && i + j < len; j++) {
          d[i + j] += (Math.random() * 2 - 1) * amp * Math.exp(-j / 6);
        }
      }
    }
    return buf;
  }
}

let engine: MpcEngine | null = null;
export function getMpcEngine(): MpcEngine {
  if (!engine) engine = new MpcEngine();
  return engine;
}
