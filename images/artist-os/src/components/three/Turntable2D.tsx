"use client";

import { useEffect, useRef } from "react";
import { Play, Square, Box, Disc3, Sparkles } from "lucide-react";
import { clamp, lerp } from "@/components/audio/bus";
import { BRAND, TRACKS } from "@/lib/data";
import type { DeckAudio } from "./Turntable";
import { useLang } from "@/lib/useLang";

const T = {
  de: {
    view3d: "3D Iso-Glow Ansicht",
    dragAria: "Vinyl, ziehen zum Scratchen",
  },
  en: {
    view3d: "3D Iso-Glow view",
    dragAria: "Vinyl, drag to scratch",
  },
} as const;

const VEL33 = (33.33 * Math.PI * 2) / 60;

/**
 * Iso-Glow 2D Turntable (TT-33):
 * Dark chassis, 1px hairlines, corner screws, rotating vinyl with concentric grooves & real scratch physics.
 */
export default function Turntable2D({
  deck,
  spinning,
  toggleSpin,
  pitch,
  setPitch,
  rpm,
  setRpm,
  onBack,
}: {
  deck: DeckAudio | null;
  spinning: boolean;
  toggleSpin: () => void;
  pitch: number;
  setPitch: (v: number) => void;
  rpm: 33 | 45;
  setRpm: (r: 33 | 45) => void;
  onBack: () => void;
}) {
  const __t = T[useLang()];
  const discRef = useRef<HTMLDivElement>(null);
  const stateRef = useRef({ spinning, pitch, rpm });
  stateRef.current = { spinning, pitch, rpm };

  useEffect(() => {
    const disc = discRef.current;
    if (!disc) return;
    let angle = 0;
    let vel = 0;
    let scratchVel = 0;
    let dragging = false;
    let lastX = 0;
    let lastY = 0;
    let raf = 0;
    let lastT = performance.now();

    const onDown = (e: PointerEvent) => {
      disc.setPointerCapture(e.pointerId);
      dragging = true;
      lastX = e.clientX;
      lastY = e.clientY;
    };
    const onMove = (e: PointerEvent) => {
      if (!dragging) return;
      const dx = e.clientX - lastX;
      const dy = e.clientY - lastY;
      lastX = e.clientX;
      lastY = e.clientY;
      const delta = dx * 0.025 + dy * 0.008;
      angle += delta;
      scratchVel = scratchVel * 0.6 + delta * 60 * 0.4;
    };
    const onUp = () => {
      dragging = false;
    };

    disc.addEventListener("pointerdown", onDown);
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);

    const loop = (t: number) => {
      raf = requestAnimationFrame(loop);
      const dt = Math.min((t - lastT) / 1000, 0.05);
      lastT = t;
      const s = stateRef.current;
      const baseVel = (((s.rpm === 33 ? 33.33 : 45) * (Math.PI * 2)) / 60) * (1 + s.pitch / 100);
      if (dragging) {
        vel = scratchVel;
      } else {
        vel = lerp(vel, s.spinning ? baseVel : 0, 1 - Math.exp(-dt * 2.4));
        scratchVel = vel;
        angle += vel * dt;
      }
      disc.style.transform = `rotate(${angle}rad)`;
      deck?.setRate(clamp(vel / VEL33, -4, 4));
    };
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      disc.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      deck?.setRate(0);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="relative overflow-hidden rounded-2xl border-2 border-[#32363f] bg-[#141518] p-4 text-[#f6ead9] shadow-[0_16px_50px_rgba(0,0,0,0.7)] sm:p-6">
      {/* Corner screws (Iso-Glow ground plate) */}
      <div className="pointer-events-none absolute left-3 top-3 size-2.5 rounded-full border border-[#454a55] bg-[#1a1c20] shadow-inner" />
      <div className="pointer-events-none absolute right-3 top-3 size-2.5 rounded-full border border-[#454a55] bg-[#1a1c20] shadow-inner" />
      <div className="pointer-events-none absolute bottom-3 left-3 size-2.5 rounded-full border border-[#454a55] bg-[#1a1c20] shadow-inner" />
      <div className="pointer-events-none absolute bottom-3 right-3 size-2.5 rounded-full border border-[#454a55] bg-[#1a1c20] shadow-inner" />

      {/* Top Header Strip */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="relative overflow-hidden rounded-lg border border-vinyl/50 bg-[#160e05] px-4 py-2 font-mono text-xs shadow-[0_0_15px_rgba(232,92,13,0.2)]">
          <div className="pointer-events-none absolute inset-0 bg-[repeating-linear-gradient(0deg,transparent,transparent_2px,rgba(0,0,0,0.35)_2px,rgba(0,0,0,0.35)_4px)] opacity-60" />
          <div className="relative flex items-center gap-3">
            <span className="flex items-center gap-1.5 font-bold tracking-wider text-sunburst uppercase">
              <Sparkles className="size-3 text-vinyl" /> TT-33 DIRECT DRIVE
            </span>
            <span className="text-[11px] text-[#ffcf8f]">
              {rpm === 33 ? "33⅓" : "45"} RPM · PITCH {pitch >= 0 ? "+" : ""}{pitch.toFixed(1)}%
            </span>
          </div>
        </div>

        <button
          onClick={onBack}
          className="flex items-center gap-2 rounded-lg border border-[#343842] bg-[#1a1c22] px-3.5 py-1.5 font-mono text-xs font-bold text-vinyl transition hover:border-vinyl hover:bg-vinyl hover:text-ink"
          aria-label={__t.view3d}
          title={__t.view3d}
        >
          <Box className="size-3.5" /> 3D Iso-Glow Ansicht
        </button>
      </div>

      {/* Main Deck Face with Platter */}
      <div className="relative my-6 flex h-[340px] items-center justify-center sm:h-[400px]">
        {/* Platter Well & Cast Outer Rim */}
        <div className="relative grid size-64 place-items-center rounded-full border-2 border-[#2b2e35] bg-[#0c0d0f] shadow-[0_0_30px_rgba(0,0,0,0.9)] sm:size-80">
          {/* Strobe pattern ring */}
          <div className="pointer-events-none absolute inset-2 rounded-full border border-dashed border-[#444a56]/50" />

          {/* Rotating Vinyl Record */}
          <div
            ref={discRef}
            className="deck-disc relative grid size-56 cursor-grab touch-none place-items-center rounded-full border-2 border-[#1c1e22] bg-[#0d0e11] shadow-[0_0_20px_rgba(0,0,0,0.95)] active:cursor-grabbing sm:size-72"
            role="button"
            aria-label={__t.dragAria}
          >
            {/* Concentric groove rings */}
            <div className="pointer-events-none absolute inset-3 rounded-full border border-[#21242b]" />
            <div className="pointer-events-none absolute inset-6 rounded-full border border-[#1a1c22]" />
            <div className="pointer-events-none absolute inset-10 rounded-full border border-[#21242b]" />
            <div className="pointer-events-none absolute inset-14 rounded-full border border-[#1a1c22]" />

            {/* Iso-Glow Custom Record Label */}
            <div className="pointer-events-none flex size-20 flex-col items-center justify-center rounded-full border-2 border-vinyl bg-[#160e05] p-1 text-center font-mono shadow-[0_0_12px_rgba(232,92,13,0.4)] sm:size-24">
              <span className="text-[7px] font-bold tracking-widest text-sunburst uppercase">NOIZY</span>
              <span className="text-[6px] text-vinyl">RECORDS</span>
              <div className="my-0.5 size-2 rounded-full border border-vinyl/60 bg-[#0d0e11]" />
              <span className="text-[6px] text-[#ffcf8f]">{rpm === 33 ? "33⅓ RPM" : "45 RPM"}</span>
            </div>
          </div>

          {/* Tonearm */}
          <div
            className={`pointer-events-none absolute -right-6 -top-4 z-10 hidden h-48 w-2 origin-top rounded bg-gradient-to-b from-[#6d737f] via-[#3a3e47] to-[#1c1e22] transition-transform duration-700 sm:block ${
              spinning ? "rotate-[-32deg]" : "rotate-[6deg]"
            }`}
            aria-hidden
          >
            {/* Counterweight */}
            <div className="absolute -top-3 -left-2 h-6 w-6 rounded border border-[#444a56] bg-[#22252c]" />
            {/* Headshell & Cartridge with glowing stylus */}
            <div className="absolute -bottom-3 -left-2 h-7 w-6 rounded border border-vinyl/60 bg-[#16171b]">
              <div
                className={`absolute bottom-0 left-2.5 size-1.5 rounded-full ${
                  spinning ? "bg-vinyl shadow-[0_0_10px_#e85c0d]" : "bg-transparent"
                }`}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Control Strip */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#262930] pt-4">
        <div className="flex items-center gap-3">
          {/* Start/Stop Button */}
          <button
            onClick={toggleSpin}
            className={`flex items-center gap-2 rounded-lg border px-5 py-2.5 font-mono text-xs font-bold tracking-widest uppercase transition ${
              spinning
                ? "border-vinyl bg-vinyl text-ink shadow-[0_0_16px_#e85c0d]"
                : "border-[#343842] bg-[#1c1e24] text-fg hover:border-vinyl/60 hover:text-white"
            }`}
          >
            {spinning ? <Square className="size-4 fill-current" /> : <Play className="size-4 fill-current" />}
            <span>{spinning ? "Stop" : "Start · Cue"}</span>
          </button>

          {/* Speed Selectors */}
          <div className="flex items-center rounded-lg border border-[#343842] bg-[#16181d] p-1">
            {([33, 45] as const).map((r) => (
              <button
                key={r}
                onClick={() => setRpm(r)}
                className={`rounded px-3 py-1 font-mono text-xs font-bold transition ${
                  rpm === r
                    ? "bg-vinyl text-ink shadow-[0_0_8px_rgba(232,92,13,0.5)]"
                    : "text-[#8a8f9c] hover:text-white"
                }`}
              >
                {r === 33 ? "33⅓" : "45"}
              </button>
            ))}
          </div>
        </div>

        {/* Pitch Slider with Ticks */}
        <label className="flex min-w-44 flex-1 items-center gap-3 rounded-lg border border-[#343842] bg-[#17191d] px-4 py-2 sm:max-w-72">
          <span className="font-mono text-[10px] font-bold tracking-wider text-vinyl uppercase">PITCH</span>
          <input
            type="range"
            min={-8}
            max={8}
            step={0.1}
            value={pitch}
            onChange={(e) => setPitch(Number(e.target.value))}
            className="fader w-full"
            aria-label="Pitch"
          />
          <span className="w-14 text-right font-mono text-xs font-bold text-sunburst">
            {pitch >= 0 ? "+" : ""}{pitch.toFixed(1)}%
          </span>
        </label>
      </div>

      {/* Hint & Track Info */}
      <p className="mt-3 font-mono text-[9px] tracking-widest text-[#727785] uppercase">
        Drag Vinyl = Scratch · Spielt „{TRACKS[0].title}“ mit echter Nadel- & Drehzahl-Physik
      </p>
    </div>
  );
}
