import { chordFrequencies, type SketchMeta } from './sketchData';

export interface SignalFrame {
  level: number;
  bass: number;
  mid: number;
  high: number;
}

const SILENT: SignalFrame = { level: 0, bass: 0, mid: 0, high: 0 };

interface Voice {
  gain: GainNode;
  stops: (() => void)[];
}

/**
 * Live-Synthesizer für Klangskizzen. Ein AudioContext, ein AnalyserNode.
 * Der Analyser speist Szene und Headline; gestartet wird ausschließlich
 * nach einer Nutzergeste.
 */
export class SketchEngine {
  private ctx: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private master: GainNode | null = null;
  private voice: Voice | null = null;
  private timer: number | null = null;
  private nextNote = 0;
  private step = 0;
  private meta: SketchMeta | null = null;
  private freqData: Uint8Array<ArrayBuffer> | null = null;
  private mediaSource: MediaElementAudioSourceNode | null = null;
  private mediaElement: HTMLAudioElement | null = null;
  private lastFrame: SignalFrame = SILENT;
  private noiseBuffer: AudioBuffer | null = null;

  get available(): boolean {
    return typeof window !== 'undefined' && !!(window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext);
  }

  get context(): AudioContext | null {
    return this.ctx;
  }

  get currentMeta(): SketchMeta | null {
    return this.meta;
  }

  get isRunning(): boolean {
    return this.voice !== null || (this.mediaElement !== null && !this.mediaElement.paused);
  }

  async ensureContext(): Promise<AudioContext> {
    if (!this.available) throw new Error('Dieser Browser unterstützt Web Audio nicht.');
    if (!this.ctx) {
      const Ctor = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new Ctor();
      this.master = this.ctx.createGain();
      this.master.gain.value = 0.7;
      this.analyser = this.ctx.createAnalyser();
      this.analyser.fftSize = 1024;
      this.analyser.smoothingTimeConstant = 0.82;
      this.master.connect(this.analyser);
      this.analyser.connect(this.ctx.destination);
      this.freqData = new Uint8Array(new ArrayBuffer(this.analyser.frequencyBinCount));
    }
    if (this.ctx.state === 'suspended') await this.ctx.resume();
    return this.ctx;
  }

  private noise(ctx: AudioContext): AudioBuffer {
    if (this.noiseBuffer) return this.noiseBuffer;
    const length = Math.floor(ctx.sampleRate * 2);
    const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    let last = 0;
    for (let i = 0; i < length; i += 1) {
      const white = Math.random() * 2 - 1;
      last = last * 0.94 + white * 0.06;
      data[i] = last * 3.2;
    }
    this.noiseBuffer = buffer;
    return buffer;
  }

  private buildVoice(meta: SketchMeta): Voice {
    const ctx = this.ctx!;
    const master = this.master!;
    const gain = ctx.createGain();
    gain.gain.value = 0;
    gain.connect(master);
    const stops: (() => void)[] = [];

    const filter = ctx.createBiquadFilter();
    filter.type = meta.character === 'bedrohlich' ? 'lowpass' : 'lowpass';
    filter.frequency.value = meta.character === 'ruhig' ? 1400 : meta.character === 'treibend' ? 2200 : 700;
    filter.Q.value = meta.character === 'bedrohlich' ? 6 : 1.2;
    filter.connect(gain);

    const chord = chordFrequencies(meta.rootHz, meta.character);

    // Pad / Drone
    chord.forEach((freq, index) => {
      const osc = ctx.createOscillator();
      osc.type = meta.character === 'bedrohlich' ? 'sawtooth' : index === 0 ? 'sine' : 'triangle';
      osc.frequency.value = freq * (index === 2 ? 2 : 1);
      const oscGain = ctx.createGain();
      oscGain.gain.value = meta.character === 'bedrohlich' ? 0.055 : 0.035;
      osc.connect(oscGain);
      oscGain.connect(filter);
      // langsames Atmen
      const lfo = ctx.createOscillator();
      lfo.frequency.value = 0.06 + index * 0.021;
      const lfoGain = ctx.createGain();
      lfoGain.gain.value = freq * 0.004;
      lfo.connect(lfoGain);
      lfoGain.connect(osc.frequency);
      osc.start();
      lfo.start();
      stops.push(() => {
        try { osc.stop(); lfo.stop(); } catch { /* bereits gestoppt */ }
      });
    });

    // Rauschen: Regen auf Glas
    const noise = ctx.createBufferSource();
    noise.buffer = this.noise(ctx);
    noise.loop = true;
    const noiseFilter = ctx.createBiquadFilter();
    noiseFilter.type = 'bandpass';
    noiseFilter.frequency.value = meta.character === 'ruhig' ? 3200 : meta.character === 'treibend' ? 5200 : 900;
    noiseFilter.Q.value = 0.7;
    const noiseGain = ctx.createGain();
    noiseGain.gain.value = meta.character === 'ruhig' ? 0.09 : meta.character === 'treibend' ? 0.05 : 0.11;
    noise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(gain);
    noise.start();
    stops.push(() => { try { noise.stop(); } catch { /* bereits gestoppt */ } });

    // Puls / metallic shimmer
    if (meta.character === 'bedrohlich') {
      const shimmer = ctx.createOscillator();
      shimmer.type = 'square';
      shimmer.frequency.value = meta.rootHz * 6.02;
      const shimmerGain = ctx.createGain();
      shimmerGain.gain.value = 0.012;
      const shimmerFilter = ctx.createBiquadFilter();
      shimmerFilter.type = 'highpass';
      shimmerFilter.frequency.value = 2400;
      shimmer.connect(shimmerFilter);
      shimmerFilter.connect(shimmerGain);
      shimmerGain.connect(gain);
      const tremolo = ctx.createOscillator();
      tremolo.frequency.value = 0.19;
      const tremoloGain = ctx.createGain();
      tremoloGain.gain.value = 0.011;
      tremolo.connect(tremoloGain);
      tremoloGain.connect(shimmerGain.gain);
      shimmer.start();
      tremolo.start();
      stops.push(() => { try { shimmer.stop(); tremolo.stop(); } catch { /* bereits gestoppt */ } });
    }

    gain.gain.setValueAtTime(0.0001, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(meta.character === 'bedrohlich' ? 0.7 : 0.9, ctx.currentTime + 0.6);

    stops.push(() => {
      gain.gain.cancelScheduledValues(ctx.currentTime);
      gain.gain.setTargetAtTime(0, ctx.currentTime, 0.08);
      window.setTimeout(() => {
        try { gain.disconnect(); filter.disconnect(); } catch { /* Verbindungen schon gelöst */ }
      }, 600);
    });

    return { gain, stops };
  }

  private scheduleLoop = () => {
    if (!this.ctx || !this.voice || !this.meta) return;
    const ctx = this.ctx;
    const meta = this.meta;
    const sixteenth = 60 / meta.bpm / 4;
    while (this.nextNote < ctx.currentTime + 0.12) {
      this.scheduleStep(meta, this.step, this.nextNote, sixteenth);
      this.nextNote += sixteenth;
      this.step = (this.step + 1) % 16;
    }
  };

  private scheduleStep(meta: SketchMeta, step: number, time: number, sixteenth: number) {
    const ctx = this.ctx;
    if (!ctx || !this.voice) return;
    const out = this.voice.gain;

    const pluck = (freq: number, amp: number, decay: number, type: OscillatorType) => {
      const osc = ctx.createOscillator();
      osc.type = type;
      osc.frequency.value = freq;
      const env = ctx.createGain();
      env.gain.setValueAtTime(0.0001, time);
      env.gain.exponentialRampToValueAtTime(amp, time + 0.012);
      env.gain.exponentialRampToValueAtTime(0.0001, time + decay);
      osc.connect(env);
      env.connect(out);
      osc.start(time);
      osc.stop(time + decay + 0.05);
    };

    if (meta.character === 'ruhig') {
      if (step === 0 || step === 8) {
        pluck(meta.rootHz * 4, 0.09, 2.4, 'sine');
      }
      if (step === 6) pluck(meta.rootHz * 5, 0.05, 1.8, 'triangle');
      if (step === 11) pluck(meta.rootHz * 3, 0.045, 2.1, 'sine');
    } else if (meta.character === 'treibend') {
      if (step % 4 === 0) {
        const osc = ctx.createOscillator();
        const kickGain = ctx.createGain();
        osc.frequency.setValueAtTime(120, time);
        osc.frequency.exponentialRampToValueAtTime(42, time + 0.16);
        kickGain.gain.setValueAtTime(0.5, time);
        kickGain.gain.exponentialRampToValueAtTime(0.0001, time + 0.22);
        osc.connect(kickGain);
        kickGain.connect(out);
        osc.start(time);
        osc.stop(time + 0.26);
      }
      if ([2, 6, 10, 14].includes(step)) pluck(meta.rootHz * 4, 0.05, 0.5, 'sawtooth');
      const pattern = [0, 3, 7, 10, 12, 10, 7, 3];
      if (step % 2 === 0) {
        const semitone = pattern[(step / 2) % pattern.length];
        pluck(meta.rootHz * 2 * Math.pow(2, semitone / 12), 0.06, 0.35, 'triangle');
      }
      if (step % 4 === 2) {
        const hat = ctx.createBufferSource();
        hat.buffer = this.noise(ctx);
        hat.loop = true;
        const hatFilter = ctx.createBiquadFilter();
        hatFilter.type = 'highpass';
        hatFilter.frequency.value = 7200;
        const hatGain = ctx.createGain();
        hatGain.gain.setValueAtTime(0.11, time);
        hatGain.gain.exponentialRampToValueAtTime(0.0001, time + 0.09);
        hat.connect(hatFilter);
        hatFilter.connect(hatGain);
        hatGain.connect(out);
        hat.start(time);
        hat.stop(time + 0.1);
      }
    } else {
      // bedrohlich: tiefer Herzschlag, metallische Tropfen
      if (step === 0 || step === 6) {
        const osc = ctx.createOscillator();
        const env = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(72, time);
        osc.frequency.exponentialRampToValueAtTime(33, time + 0.4);
        env.gain.setValueAtTime(0.0001, time);
        env.gain.exponentialRampToValueAtTime(0.55, time + 0.02);
        env.gain.exponentialRampToValueAtTime(0.0001, time + 0.55);
        osc.connect(env);
        env.connect(out);
        osc.start(time);
        osc.stop(time + 0.6);
      }
      if (step === 3 || step === 11) {
        pluck(meta.rootHz * 7.5, 0.035, 0.8, 'square');
      }
    }
    // sixteenth remains for callers that want to derive visual steps
    void sixteenth;
  }

  async play(meta: SketchMeta): Promise<void> {
    const ctx = await this.ensureContext();
    this.stopMedia();
    this.stopScheduler();
    if (this.voice) {
      const old = this.voice;
      this.voice = null;
      old.stops.forEach((stop) => stop());
    }
    this.meta = meta;
    this.voice = this.buildVoice(meta);
    this.step = 0;
    this.nextNote = ctx.currentTime + 0.08;
    this.timer = window.setInterval(this.scheduleLoop, 30);
    this.scheduleLoop();
  }

  pause(): void {
    this.stopScheduler();
    const voice = this.voice;
    this.voice = null;
    this.meta = null;
    if (voice) {
      voice.stops.forEach((stop) => stop());
    }
    if (this.mediaElement) {
      this.mediaElement.pause();
    }
  }

  private stopScheduler(): void {
    if (this.timer !== null) {
      window.clearInterval(this.timer);
      this.timer = null;
    }
  }

  private stopMedia(): void {
    if (this.mediaElement) {
      try { this.mediaElement.pause(); } catch { /* egal */ }
    }
  }

  /**
   * Echte Datei, falls vorhanden. Der Analyser hängt auch hier dran,
   * damit die Szene auf den Klang reagiert.
   */
  async playMedia(element: HTMLAudioElement, meta: SketchMeta): Promise<void> {
    const ctx = await this.ensureContext();
    this.stopScheduler();
    if (this.voice) {
      this.voice.stops.forEach((stop) => stop());
      this.voice = null;
    }
    this.meta = meta;
    if (this.mediaElement !== element) {
      this.mediaElement = element;
      if (!this.mediaSource) {
        this.mediaSource = ctx.createMediaElementSource(element);
        this.mediaSource.connect(this.analyser!);
      }
    }
    await element.play();
  }

  /** Kurzer Klick für Bedienelemente — nur wenn Ton eingeschaltet ist. */
  tick(): void {
    if (!this.ctx || !this.master || this.ctx.state !== 'running') return;
    const ctx = this.ctx;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'square';
    osc.frequency.value = 1800;
    gain.gain.setValueAtTime(0.018, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.035);
    osc.connect(gain);
    gain.connect(this.master);
    osc.start();
    osc.stop(ctx.currentTime + 0.045);
  }

  getSignal(): SignalFrame {
    if (!this.analyser || !this.freqData) return this.lastFrame;
    const actuallyPlaying =
      this.voice !== null || (this.mediaElement !== null && !this.mediaElement.paused);
    if (!actuallyPlaying || this.ctx?.state !== 'running') {
      const previous = this.lastFrame;
      this.lastFrame = {
        level: previous.level * 0.9,
        bass: previous.bass * 0.9,
        mid: previous.mid * 0.9,
        high: previous.high * 0.9,
      };
      return this.lastFrame;
    }
    this.analyser.getByteFrequencyData(this.freqData);
    const bin = this.freqData.length;
    const average = (from: number, to: number) => {
      let sum = 0;
      const start = Math.floor(bin * from);
      const end = Math.max(start + 1, Math.floor(bin * to));
      for (let i = start; i < end; i += 1) sum += this.freqData![i];
      return sum / (end - start) / 255;
    };
    const bass = average(0, 0.08);
    const mid = average(0.08, 0.35);
    const high = average(0.35, 0.9);
    const raw = { level: bass * 0.5 + mid * 0.35 + high * 0.15, bass, mid, high };
    const previous = this.lastFrame;
    const smooth = (next: number, prev: number) => prev + (next - prev) * 0.22;
    this.lastFrame = {
      level: smooth(raw.level, previous.level),
      bass: smooth(raw.bass, previous.bass),
      mid: smooth(raw.mid, previous.mid),
      high: smooth(raw.high, previous.high),
    };
    return this.lastFrame;
  }
}

export const sketchEngine = new SketchEngine();
