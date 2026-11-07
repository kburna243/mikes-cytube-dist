"use client";

import { useCallback, useEffect, useState, type Dispatch, type SetStateAction } from "react";
import { SlidersVertical, Sparkles } from "lucide-react";
import { getMpcEngine, PAD_NAMES, BANK_LABELS, type Bank } from "@/components/audio/mpcEngine";
import { clamp } from "@/components/audio/bus";

const KEY_ROWS = ["1234", "qwer", "asdf", "zxcv"];

/**
 * Iso-Glow 2D Beat Station:
 * Dark technical chassis, hairline edges, illuminated amber LCD screen & glowing pads.
 */
export default function MPC2D({
  bank,
  setBank,
  firePad,
  looping,
  lastPad,
  cutoff,
}: {
  bank: Bank;
  setBank: Dispatch<SetStateAction<Bank>>;
  firePad: (pad: number) => void;
  looping: Set<string>;
  lastPad: string;
  cutoff: number;
}) {
  const [flash, setFlash] = useState<number | null>(null);

  const hit = useCallback(
    (pad: number) => {
      firePad(pad);
      setFlash(pad);
      window.setTimeout(() => setFlash((f) => (f === pad ? null : f)), 160);
    },
    [firePad]
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.repeat || e.metaKey || e.ctrlKey || e.altKey) return;
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA")) return;
      const k = e.key.toLowerCase();
      const row = KEY_ROWS.findIndex((r) => r.includes(k));
      if (row === -1) return;
      e.preventDefault();
      hit(row * 4 + KEY_ROWS[row].indexOf(k));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [hit]);

  return (
    <div className="relative overflow-hidden rounded-2xl border-2 border-[#32363f] bg-[#141518] p-4 text-[#f6ead9] shadow-[0_12px_40px_rgba(0,0,0,0.65)] sm:p-6">
      {/* Corner screws (Iso-Glow ground plate detail) */}
      <div className="pointer-events-none absolute left-3 top-3 size-2.5 rounded-full border border-[#454a55] bg-[#1a1c20] shadow-inner" />
      <div className="pointer-events-none absolute right-3 top-3 size-2.5 rounded-full border border-[#454a55] bg-[#1a1c20] shadow-inner" />
      <div className="pointer-events-none absolute bottom-3 left-3 size-2.5 rounded-full border border-[#454a55] bg-[#1a1c20] shadow-inner" />
      <div className="pointer-events-none absolute bottom-3 right-3 size-2.5 rounded-full border border-[#454a55] bg-[#1a1c20] shadow-inner" />

      {/* Header Strip with Glowing Screen */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="relative overflow-hidden rounded-lg border border-vinyl/50 bg-[#160e05] px-4 py-2.5 font-mono text-xs shadow-[0_0_20px_rgba(232,92,13,0.2)]">
          {/* Subtle scanline overlay */}
          <div className="pointer-events-none absolute inset-0 bg-[repeating-linear-gradient(0deg,transparent,transparent_2px,rgba(0,0,0,0.35)_2px,rgba(0,0,0,0.35)_4px)] opacity-60" />
          <div className="relative flex items-center gap-4">
            <div>
              <p className="font-bold tracking-wider text-sunburst uppercase">
                BANK {bank}: {BANK_LABELS[bank]}
              </p>
              <p className="mt-0.5 text-[11px] text-[#ffcf8f]">
                PAD {lastPad} · CUT {cutoff}Hz
              </p>
            </div>
            <div className="hidden size-2 animate-ping rounded-full bg-vinyl sm:block" />
          </div>
        </div>

        {/* Bank Select Buttons */}
        <div className="flex items-center gap-1.5">
          {(["A", "B", "C"] as Bank[]).map((b) => (
            <button
              key={b}
              onClick={() => setBank(b)}
              className={`rounded-lg border px-3.5 py-2 font-mono text-xs font-bold transition ${
                bank === b
                  ? "border-vinyl bg-vinyl text-ink shadow-[0_0_14px_rgba(232,92,13,0.5)]"
                  : "border-[#32363f] bg-[#1f2126] text-[#b3b7c2] hover:border-vinyl/60 hover:text-white"
              }`}
            >
              BANK {b}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-[1fr_120px]">
        {/* 16 Glowing Pads */}
        <div className="grid grid-cols-4 gap-2.5 sm:gap-3">
          {PAD_NAMES[bank].map((name, i) => {
            const loopKey =
              bank === "B" && i >= 12 && i <= 14
                ? ["sample-on", "sample-ts", "sample-ve"][i - 12]
                : bank === "B" && i === 15
                  ? "fullbreak"
                  : bank === "C" && i === 4
                    ? "crackle"
                    : null;
            const isLoopOn = loopKey ? looping.has(loopKey) : false;
            const isFlashing = flash === i;

            return (
              <button
                key={i}
                onPointerDown={() => hit(i)}
                className={`group relative flex aspect-square flex-col items-center justify-between rounded-xl border p-2 text-center font-mono transition-all duration-75 active:scale-95 ${
                  isLoopOn || isFlashing
                    ? "border-vinyl bg-[#e85c0d] text-ink shadow-[0_0_22px_#e85c0d]"
                    : "border-[#2c3038] bg-[#1a1c20] text-[#e3e0d8] hover:border-vinyl/60 hover:bg-[#22252b] hover:shadow-[0_0_12px_rgba(232,92,13,0.25)]"
                }`}
              >
                <div className="flex w-full items-center justify-between text-[10px]">
                  <span className={`font-bold ${isLoopOn || isFlashing ? "text-ink" : "text-vinyl"}`}>
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className={`text-[8px] opacity-60 ${isLoopOn || isFlashing ? "text-ink" : "text-[#8d929e]"}`}>
                    {KEY_ROWS.flat().join("")[i].toUpperCase()}
                  </span>
                </div>

                <span className="px-1 text-[8px] font-bold tracking-tight leading-tight sm:text-[10px]">
                  {name}
                </span>

                <div className="h-2 text-[7px] font-bold tracking-wider">
                  {loopKey && (
                    <span className={isLoopOn ? "text-ink underline" : "text-sunburst"}>
                      {isLoopOn ? "■ PLAY" : "LOOP"}
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Cutoff Fader Strip */}
        <div className="flex items-center gap-3 rounded-xl border border-[#32363f] bg-[#17191d] p-3.5 md:flex-col md:justify-between">
          <div className="flex items-center gap-1.5 font-mono text-[9px] font-bold text-vinyl">
            <SlidersVertical className="size-3.5" />
            <span>CUTOFF</span>
          </div>

          <input
            type="range"
            min={40}
            max={19000}
            step={10}
            value={cutoff}
            onChange={(e) => {
              const v = clamp(Number(e.target.value), 40, 19000);
              getMpcEngine().setCutoff(v);
            }}
            aria-label="Lowpass Cutoff"
            className="fader w-full md:h-44 md:w-24 md:[writing-mode:vertical-lr] md:[direction:rtl]"
          />

          <span className="font-mono text-[10px] font-bold text-sunburst">
            {Math.round(cutoff)} Hz
          </span>
        </div>
      </div>

      {/* Iso-Glow Style Readout & Legend */}
      <div className="mt-4 flex flex-wrap items-center justify-between border-t border-[#262930] pt-3 font-mono text-[9px] tracking-widest text-[#8a8f9c] uppercase">
        <span className="flex items-center gap-1.5 text-sunburst">
          <Sparkles className="size-3 text-vinyl" /> ISO-GLOW 2D · DR-16 EDITION
        </span>
        <span>PADS 1-4 · Q-R · A-F · Z-V</span>
      </div>
    </div>
  );
}
