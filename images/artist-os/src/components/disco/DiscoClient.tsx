"use client";

import { useEffect, useRef, useState } from "react";
import { ALBUM } from "@/lib/data";
import { saveConsent, useConsent } from "@/components/site/consent";
import { Disc3, Music2, Pause, Play, Clapperboard, AudioLines, Apple, ArrowUpRight, Tv } from "lucide-react";
import { TRACKS, UI_ASSETS } from "@/lib/data";
import { usePlayer } from "@/components/audio/AudioProvider";
import { useNearViewport } from "@/components/site/useNearViewport";
import Reveal from "@/components/site/Reveal";
import MPC3D from "@/components/three/MPC3D";
import { useLang } from "@/lib/useLang";

const COPY = {
  de: {
    play: "abspielen", pause: "pausieren", mpcLoading: "MPC startet",
    noSignal: "NO SIGNAL, DRÜCK PLAY IM PLAYER", ready: "KANAL BEREIT", lines: "UHF · 625 ZEILEN",
    ytTitle: `${ALBUM.title}, Playlist auf YouTube`, coverAlt: `Cover von ${ALBUM.title}`,
    gateTitle: "Ganzes Album auf YouTube",
    gateText: "Der Player kommt von YouTube. Beim Laden gehen Daten wie deine IP-Adresse an Google.",
    load: "Player laden", always: "Immer erlauben", blurb: ALBUM.blurb,
  },
  en: {
    play: "play", pause: "pause", mpcLoading: "MPC booting",
    noSignal: "NO SIGNAL, PRESS PLAY IN THE PLAYER", ready: "CHANNEL READY", lines: "UHF · 625 LINES",
    ytTitle: `${ALBUM.title}, playlist on YouTube`, coverAlt: `Cover of ${ALBUM.title}`,
    gateTitle: "The full album on YouTube",
    gateText: "The player comes from YouTube. Loading it sends data such as your IP address to Google.",
    load: "Load player", always: "Always allow", blurb: ALBUM.blurbEn,
  },
};

/* ---------------- track list ---------------- */
const SIDES = ["A1", "A2", "B1"];

export function TrackList() {
  const c = COPY[useLang()];
  const p = usePlayer();
  return (
    <ol className="border-t-[3px] border-fg">
      {TRACKS.map((t, i) => {
        const active = p.index === i && p.started;
        const playing = active && p.playing;
        return (
          <Reveal key={t.id} delay={i * 80}>
            <li className={`border-b border-fg/30 transition-colors ${active ? "bg-surface" : ""}`}>
              <button
                onClick={() => (active ? p.toggle() : p.play(i))}
                aria-label={`${t.title} ${playing ? c.pause : c.play}`}
                className="group grid w-full grid-cols-[3.5rem_1fr_auto] items-center gap-4 py-6 text-left sm:grid-cols-[4.5rem_1fr_auto_auto] sm:gap-8 sm:px-2"
              >
                <span className={`grid size-14 place-items-center rounded-full transition ${playing ? "bg-vinyl text-ink" : "bg-fg text-page group-hover:bg-vinyl group-hover:text-ink"}`}>
                  {playing ? <Pause className="size-5" /> : <Play className="ml-0.5 size-5" />}
                </span>
                <span className="min-w-0">
                  <span className="font-mono text-sm text-fg-muted">{SIDES[i]}</span>
                  <span className="block truncate text-2xl font-bold tracking-tight group-hover:text-vinyl sm:text-4xl">{t.title}</span>
                  <span className="block text-fg-muted">{[t.mix, t.genre].filter(Boolean).join(", ")}</span>
                </span>
                <span className="hidden font-mono text-sm text-fg-muted sm:block">{t.bpm} BPM, {t.key}</span>
                <span className="flex items-center gap-3 font-mono">
                  <span className="hidden h-6 items-end gap-0.5 sm:flex" aria-hidden>
                    {[0.9, 0.5, 1.1, 0.7].map((d, j) => (
                      <span
                        key={j}
                        className={`w-1 ${playing ? "eq-bar bg-vinyl" : "bg-fg/25"}`}
                        style={{ height: `${[60, 90, 45, 100][j]}%`, animationDelay: `${d * 0.2}s`, animationDuration: `${d}s` }}
                      />
                    ))}
                  </span>
                  {t.duration}
                </span>
              </button>
            </li>
          </Reveal>
        );
      })}
    </ol>
  );
}

/* ---------------- beat lab (lazy 3D) ---------------- */
export function BeatLab() {
  const c = COPY[useLang()];
  const { ref, near } = useNearViewport<HTMLDivElement>();
  return (
    <div ref={ref}>
      {near ? (
        <MPC3D />
      ) : (
        <div className="stage-3d grid h-[440px] w-full place-items-center sm:h-[560px]">
          <div className="flex items-center gap-3 font-mono text-sm text-fg-muted">
            <Disc3 className="size-5 anim-spin-slow text-vinyl" /> {c.mpcLoading}
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------------- retro TV visualizer ---------------- */
function VisualizerTV() {
  const c = COPY[useLang()];
  const noSignal = c.noSignal;
  const p = usePlayer();
  const cvRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    let raf = 0;
    const draw = () => {
      raf = requestAnimationFrame(draw);
      const cv = cvRef.current;
      if (!cv) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = cv.clientWidth;
      const h = cv.clientHeight;
      if (!w || !h) return;
      if (cv.width !== w * dpr) { cv.width = w * dpr; cv.height = h * dpr; }
      const g = cv.getContext("2d");
      if (!g) return;
      g.setTransform(dpr, 0, 0, dpr, 0, 0);
      g.fillStyle = "#120b05";
      g.fillRect(0, 0, w, h);
      const an = p.getAnalyser();
      if (an && p.playing) {
        const data = new Uint8Array(an.fftSize);
        an.getByteTimeDomainData(data);
        g.strokeStyle = "#f6b436";
        g.lineWidth = 2.5;
        g.shadowColor = "#ff9a3c";
        g.shadowBlur = 14;
        g.beginPath();
        for (let i = 0; i < data.length; i++) {
          const x = (i / (data.length - 1)) * w;
          const y = h / 2 + ((data[i] - 128) / 128) * (h * 0.42);
          if (i === 0) g.moveTo(x, y);
          else g.lineTo(x, y);
        }
        g.stroke();
        g.shadowBlur = 0;
      } else {
        // standby static
        for (let i = 0; i < 260; i++) {
          g.fillStyle = `rgba(246,234,217,${Math.random() * 0.13})`;
          g.fillRect(Math.random() * w, Math.random() * h, 2, 2);
        }
        g.fillStyle = "#ffb35c";
        g.font = "700 13px 'Space Mono', monospace";
        g.textAlign = "center";
        g.fillText(noSignal, w / 2, h / 2 + 4);
      }
      // scanlines
      g.fillStyle = "rgba(0,0,0,0.28)";
      for (let y = 0; y < h; y += 4) g.fillRect(0, y, w, 1.5);
    };
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, [p, noSignal]);

  return (
    <div className="scope-dark overflow-hidden rounded-md border-2 border-ink bg-gradient-to-b from-[#3a2d20] to-[#241b12] p-3 shadow-[6px_6px_0_var(--color-ink)] sm:p-4">
      <div className="flex items-center justify-between px-1 pb-2">
        <span className="flex items-center gap-2 font-mono text-[10px] font-bold tracking-[0.25em] text-sunburst uppercase">
          <Tv className="size-4" /> Noizy TV · CH-01
        </span>
        <span className="flex items-center gap-1.5">
          <span className={`led-dot ${p.playing ? "on" : ""}`} />
          <span className="font-mono text-[9px] text-fg-muted">{p.playing ? "RECEIVING" : "STANDBY"}</span>
        </span>
      </div>
      <div className="overflow-hidden rounded-lg border-[3px] border-black shadow-[inset_0_0_40px_rgba(0,0,0,0.9)]">
        <canvas ref={cvRef} className="block aspect-video w-full" />
      </div>
      <div className="flex items-center justify-between px-1 pt-2.5 font-mono text-[9px] tracking-widest text-fg-muted/80">
        <span className="truncate">{p.started ? `NOW: ${p.track.title.toUpperCase()}` : c.ready}</span>
        <span className="shrink-0">{c.lines}</span>
      </div>
    </div>
  );
}

/* ---------------- platform links ---------------- */
const PLATFORMS = [
  { icon: Clapperboard, name: "YouTube", desc: "@officialdjnoizyneighbor", url: "https://www.youtube.com/@officialdjnoizyneighbor" },
  { icon: Music2, name: "Spotify", desc: "DJ Noizy Neighbor", url: "https://open.spotify.com/artist/4VdvOFJE7lz9Fs1JqdzeK4" },
  { icon: Apple, name: "Apple Music", desc: "DJ Noizy Neighbor", url: "https://music.apple.com/de/artist/dj-noizy-neighbor/1672448233" },
  { icon: AudioLines, name: "Deezer", desc: "DJ Noizy Neighbor", url: "https://www.deezer.com/artist/202136717" },
];

/* ---------------- the real album, with a consent-gated YouTube playlist ---------------- */
export function AlbumSection() {
  const c = COPY[useLang()];
  const consent = useConsent();
  const [loadOnce, setLoadOnce] = useState(false);
  const show = consent.media || loadOnce;

  return (
    <div className="grid gap-10 lg:grid-cols-12">
      <Reveal className="lg:col-span-7">
        <div className="relative aspect-video overflow-hidden border-2 border-fg bg-ink shadow-[8px_8px_0_var(--color-fg)]">
          {show ? (
            <iframe
              className="absolute inset-0 h-full w-full"
              src={`https://www.youtube-nocookie.com/embed/videoseries?list=${ALBUM.youtubePlaylist}&rel=0`}
              title={c.ytTitle}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              referrerPolicy="strict-origin-when-cross-origin"
              allowFullScreen
            />
          ) : (
            <div className="scope-dark absolute inset-0 grid grid-cols-[40%_1fr] items-center gap-6 p-6 sm:p-8">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={ALBUM.cover} alt={c.coverAlt} className="aspect-square w-full border border-fg/30 object-cover" loading="lazy" />
              <div>
                <p className="text-lg font-bold text-fg sm:text-xl">{c.gateTitle}</p>
                <p className="mt-2 text-sm leading-relaxed text-fg-muted">{c.gateText}</p>
                <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2">
                  <button onClick={() => setLoadOnce(true)} className="rounded-[3px] border-2 border-fg bg-fg px-4 py-2 font-bold text-page transition hover:bg-vinyl hover:text-ink">
                    {c.load}
                  </button>
                  <button onClick={() => saveConsent(true)} className="text-sm font-semibold text-fg underline underline-offset-4">
                    {c.always}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </Reveal>

      <Reveal delay={100} className="lg:col-span-5">
        <h3 className="type-condensed text-[clamp(3rem,6vw,5rem)]">{ALBUM.title}</h3>
        <p className="mt-2 font-mono text-sm text-fg-muted">
          Album, {ALBUM.released}, {ALBUM.label}
        </p>
        <p className="mt-4 text-lg leading-relaxed">{c.blurb}</p>
        <ol className="mt-6 columns-1 gap-8 border-t-2 border-fg pt-3 sm:columns-2">
          {ALBUM.tracks.map(([t, d], i) => (
            <li key={t} className="flex break-inside-avoid items-baseline justify-between gap-3 border-b border-fg/20 py-1.5 text-[15px]">
              <span className="min-w-0 truncate"><span className="mr-2 font-mono text-xs text-fg-muted">{String(i + 1).padStart(2, "0")}</span>{t}</span>
              <span className="shrink-0 font-mono text-xs text-fg-muted">{d}</span>
            </li>
          ))}
        </ol>
        <div className="mt-6 flex flex-wrap gap-x-6 gap-y-3">
          {ALBUM.links.map((l) => (
            <a key={l.name} href={l.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 border-b-2 border-fg pb-0.5 font-semibold hover:border-vinyl hover:text-vinyl">
              {l.name} <ArrowUpRight className="size-4" />
            </a>
          ))}
        </div>
      </Reveal>
    </div>
  );
}

export function StreamingHub() {
  return (
    <div className="grid items-start gap-10 lg:grid-cols-[1.15fr_1fr]">
      <Reveal>
        <VisualizerTV />
      </Reveal>
      <ul className="border-t-2 border-fg">
        {PLATFORMS.map((pl, i) => (
          <Reveal key={pl.name} delay={i * 70}>
            <li className="border-b border-fg/30">
              <a href={pl.url} target="_blank" rel="noopener noreferrer" className="group flex items-center gap-5 py-5">
                <pl.icon className="size-6 shrink-0" />
                <span className="min-w-0 flex-1">
                  <span className="block text-2xl font-bold tracking-tight group-hover:text-vinyl">{pl.name}</span>
                  <span className="block text-fg-muted">{pl.desc}</span>
                </span>
                <ArrowUpRight className="size-6 shrink-0 transition-transform group-hover:-translate-y-1 group-hover:translate-x-1" />
              </a>
            </li>
          </Reveal>
        ))}
      </ul>
    </div>
  );
}
