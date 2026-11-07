"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, Disc3, Radio } from "lucide-react";
import { usePlayer } from "./AudioProvider";
import { getPeaks, formatTime } from "./waveform";
import { clamp } from "./bus";
import { useLang } from "@/lib/useLang";
import { localize } from "@/lib/i18n";

const T = {
  "de": {
    "prev": "Vorheriger Track",
    "next": "Nächster Track",
    "pos": "Track-Position",
    "mute": "Stumm",
    "vol": "Lautstärke"
  },
  "en": {
    "prev": "Previous track",
    "next": "Next track",
    "pos": "Track position",
    "mute": "Mute",
    "vol": "Volume"
  }
} as const;


/** Retro 80s HiFi receiver bar, the persistent player. */
export default function PlayerBar() {
  const __lang = useLang();
  const __t = T[__lang];
  const p = usePlayer();
  const vuRef = useRef<HTMLCanvasElement>(null);
  const waveRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const peaksRef = useRef<Float32Array | null>(null);
  const draggingRef = useRef(false);
  const [muted, setMuted] = useState(false);
  const lastVol = useRef(0.85);

  // load real peaks when track changes
  useEffect(() => {
    let alive = true;
    peaksRef.current = null;
    void getPeaks(p.track.src).then((peaks) => {
      if (alive) peaksRef.current = peaks;
    });
    return () => { alive = false; };
  }, [p.track.src]);

  // waveform renderer
  useEffect(() => {
    let raf = 0;
    const draw = () => {
      raf = requestAnimationFrame(draw);
      const cv = waveRef.current;
      const wrap = wrapRef.current;
      if (!cv || !wrap) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = wrap.clientWidth;
      const h = wrap.clientHeight;
      if (w === 0) return;
      if (cv.width !== w * dpr) { cv.width = w * dpr; cv.height = h * dpr; }
      const g = cv.getContext("2d");
      if (!g) return;
      g.setTransform(dpr, 0, 0, dpr, 0, 0);
      g.clearRect(0, 0, w, h);
      const peaks = peaksRef.current;
      const n = peaks ? peaks.length : 240;
      const bw = w / n;
      const prog = p.duration > 0 ? p.time / p.duration : 0;
      for (let i = 0; i < n; i++) {
        const v = peaks ? peaks[i] : 0.4 + 0.3 * Math.sin(i * 0.7) * Math.sin(i * 0.13);
        const bh = Math.max(2, v * (h - 6));
        const x = i * bw;
        const played = i / n <= prog;
        if (played) {
          const grad = g.createLinearGradient(0, h, 0, 0);
          grad.addColorStop(0, "#e85c0d");
          grad.addColorStop(1, "#f6b436");
          g.fillStyle = grad;
        } else {
          g.fillStyle = "rgba(246,234,217,0.22)";
        }
        g.fillRect(x, (h - bh) / 2, Math.max(1, bw - 0.8), bh);
      }
      // playhead
      g.fillStyle = "#f6ead9";
      g.shadowColor = "#f6b436";
      g.shadowBlur = 8;
      g.fillRect(prog * w - 1, 0, 2, h);
      g.shadowBlur = 0;
    };
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, [p.time, p.duration, p.track.src]);

  // VU meter renderer
  useEffect(() => {
    let raf = 0;
    let data: Uint8Array | null = null;
    const draw = () => {
      raf = requestAnimationFrame(draw);
      const cv = vuRef.current;
      if (!cv) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = cv.clientWidth;
      const h = cv.clientHeight;
      if (!w || !h) return;
      if (cv.width !== w * dpr) { cv.width = w * dpr; cv.height = h * dpr; }
      const g = cv.getContext("2d");
      if (!g) return;
      g.setTransform(dpr, 0, 0, dpr, 0, 0);
      g.clearRect(0, 0, w, h);
      const an = p.getAnalyser();
      const bars = 18;
      if (an) {
        if (!data || data.length !== an.frequencyBinCount) data = new Uint8Array(an.frequencyBinCount);
        an.getByteFrequencyData(data as Uint8Array<ArrayBuffer>);
      }
      for (let i = 0; i < bars; i++) {
        const v = an && data ? data[Math.floor((i / bars) * data.length * 0.8)] / 255 : 0;
        const segs = 8;
        const lit = Math.round(v * segs);
        const segH = h / segs;
        for (let s = 0; s < segs; s++) {
          const on = s < lit && p.playing;
          const t = s / segs;
          g.fillStyle = !on
            ? "rgba(246,234,217,0.08)"
            : t < 0.5
              ? "#4b5b3b"
              : t < 0.8
                ? "#f6b436"
                : "#e85c0d";
          g.fillRect(i * (w / bars) + 1, h - (s + 1) * segH + 1, w / bars - 2, segH - 2);
        }
      }
    };
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, [p, p.playing]);

  // scrub interaction
  const seekFromEvent = useCallback(
    (clientX: number) => {
      const wrap = wrapRef.current;
      if (!wrap || p.duration <= 0) return;
      const r = wrap.getBoundingClientRect();
      const ratio = clamp((clientX - r.left) / r.width, 0, 1);
      p.seek(ratio * p.duration);
    },
    [p]
  );

  useEffect(() => {
    const move = (e: PointerEvent) => { if (draggingRef.current) seekFromEvent(e.clientX); };
    const up = () => { draggingRef.current = false; };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
  }, [seekFromEvent]);

  const toggleMute = () => {
    if (muted) {
      p.setVolume(lastVol.current);
      setMuted(false);
    } else {
      lastVol.current = p.volume || 0.85;
      p.setVolume(0);
      setMuted(true);
    }
  };

  return (
    <div className="scope-dark fixed inset-x-0 bottom-0 z-[80]">
      <div className="border-t-[3px] border-fg bg-gradient-to-b from-[#1d1a16] to-[#0d0c0a] shadow-[0_-10px_40px_rgba(0,0,0,0.75)]">
        <div className="mx-auto flex max-w-7xl items-center gap-2 px-3 py-2 sm:gap-4 sm:px-5">
          {/* transport */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={p.prev}
              aria-label={__t.prev}
              className="grid size-9 place-items-center rounded-lg border-2 border-fg/80 bg-surface-2 text-fg shadow-[3px_3px_0_rgba(0,0,0,0.85)] transition active:translate-y-0.5 active:shadow-none hover:text-sunburst"
            >
              <SkipBack className="size-4" />
            </button>
            <button
              onClick={p.toggle}
              aria-label={p.playing ? "Pause" : "Play"}
              className="grid size-11 place-items-center rounded-lg border-2 border-fg bg-vinyl text-ink shadow-[3px_3px_0_rgba(0,0,0,0.85)] transition active:translate-y-0.5 active:shadow-none hover:bg-sunburst hover:text-ink"
            >
              {p.playing ? <Pause className="size-5" /> : <Play className="ml-0.5 size-5" />}
            </button>
            <button
              onClick={p.next}
              aria-label={__t.next}
              className="grid size-9 place-items-center rounded-lg border-2 border-fg/80 bg-surface-2 text-fg shadow-[3px_3px_0_rgba(0,0,0,0.85)] transition active:translate-y-0.5 active:shadow-none hover:text-sunburst"
            >
              <SkipForward className="size-4" />
            </button>
          </div>

          {/* LCD track readout */}
          <Link href={localize("/discography", __lang)} className="lcd group hidden min-w-0 flex-1 rounded-md px-3 py-1.5 sm:block sm:max-w-[290px]">
            <div className="overflow-hidden whitespace-nowrap">
              <div className="marquee-track fast font-mono text-[11px] tracking-wider">
                <span className="pr-8">
                  {p.track.no}, {p.track.title} {p.track.mix && `(${p.track.mix})`} · {p.track.bpm} BPM · {p.track.key.toUpperCase()} ·
                </span>
                <span className="pr-8" aria-hidden>
                  {p.track.no}, {p.track.title} {p.track.mix && `(${p.track.mix})`} · {p.track.bpm} BPM · {p.track.key.toUpperCase()} ·
                </span>
              </div>
            </div>
            <div className="flex items-center justify-between font-mono text-[10px] text-sunburst/90">
              <span>{formatTime(p.time)} / {formatTime(p.duration)}</span>
              <span className="flex items-center gap-1">
                <Disc3 className={`size-3 ${p.playing ? "anim-spin-slow" : ""}`} />
                {p.playing ? "SPINNING" : p.started ? "PAUSED" : "READY"}
              </span>
            </div>
          </Link>

          {/* waveform scrubber */}
          <div
            ref={wrapRef}
            className="relative h-10 min-w-20 flex-1 cursor-pointer rounded-md border-2 border-black bg-black/70 px-0 shadow-[inset_0_2px_8px_rgba(0,0,0,0.9)]"
            onPointerDown={(e) => { draggingRef.current = true; seekFromEvent(e.clientX); }}
            role="slider"
            aria-label={__t.pos}
            aria-valuemin={0}
            aria-valuemax={p.duration}
            aria-valuenow={p.time}
          >
            <canvas ref={waveRef} className="block h-full w-full" />
          </div>

          {/* VU meter */}
          <canvas ref={vuRef} className="hidden h-10 w-24 rounded-sm md:block" aria-hidden />

          {/* volume */}
          <div className="hidden items-center gap-2 sm:flex">
            <button onClick={toggleMute} aria-label={__t.mute} className="text-fg/80 hover:text-sunburst">
              {muted || p.volume === 0 ? <VolumeX className="size-4" /> : <Volume2 className="size-4" />}
            </button>
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={muted ? 0 : p.volume}
              onChange={(e) => { setMuted(false); p.setVolume(Number(e.target.value)); }}
              className="fader w-20"
              aria-label={__t.vol}
            />
          </div>

          {/* mobile track chip */}
          <button onClick={p.toggle} className="lcd flex min-w-0 items-center gap-1.5 rounded-md px-2 py-1.5 font-mono text-[10px] text-sunburst sm:hidden">
            <Radio className="size-3.5 shrink-0" />
            <span className="max-w-24 truncate">{p.track.title}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
