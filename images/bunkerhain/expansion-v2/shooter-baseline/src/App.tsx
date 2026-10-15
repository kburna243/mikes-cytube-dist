import { useCallback, useEffect, useRef, useState } from "react";
import { Crosshair, Heart, RotateCcw, Skull, Star, Volume2, VolumeX, Zap, DoorOpen, Users, Timer } from "lucide-react";
import { loadAssets, UI_FRAMES, TITLE_SRC, UiFrame, Assets } from "./game/assets";
import { BunkerAudio } from "./game/audio";
import { Engine, Stats } from "./game/engine";

type Phase = "loading" | "title" | "play" | "over" | "win";

function DOMSprite({ frame, size, className = "", style }: { frame: UiFrame; size: number; className?: string; style?: React.CSSProperties }) {
  const f = UI_FRAMES[frame];
  return (
    <div
      className={className}
      style={{
        width: (f.w / f.h) * size,
        height: size,
        backgroundImage: "url(/assets/ui/ui-atlas.png)",
        backgroundSize: `${(1448 / f.h) * size}px ${(1086 / f.h) * size}px`,
        backgroundPosition: `-${(f.x / f.h) * size}px -${(f.y / f.h) * size}px`,
        backgroundRepeat: "no-repeat",
        ...style,
      }}
    />
  );
}

export default function App() {
  const [phase, setPhase] = useState<Phase>("loading");
  const [progress, setProgress] = useState(0);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loadAttempt, setLoadAttempt] = useState(0);
  const [stats, setStats] = useState<Stats | null>(null);
  const [muted, setMuted] = useState(false);
  const [hs, setHs] = useState(0);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<Engine | null>(null);
  const audioRef = useRef<BunkerAudio | null>(null);
  const assetsRef = useRef<Assets | null>(null);

  if (!audioRef.current) audioRef.current = new BunkerAudio();

  const onPhase = useCallback((p: "idle" | "play" | "over" | "win", s?: Stats) => {
    if (p === "over" || p === "win") {
      setStats(s ?? null);
      try {
        setHs(Number(localStorage.getItem("bunkerhain_hs") || 0));
      } catch { /* ignore */ }
      setPhase(p);
    }
  }, []);

  // Assets laden + Engine einmalig erstellen (Canvas ist immer gemountet)
  useEffect(() => {
    let alive = true;
    setProgress(0);
    setLoadError(null);
    loadAssets((value) => { if (alive) setProgress(value); })
      .then((a) => {
        if (!alive) return;
        assetsRef.current = a;
        if (canvasRef.current && audioRef.current) {
          engineRef.current = new Engine(canvasRef.current, a, audioRef.current, onPhase);
        }
        try {
          setHs(Number(localStorage.getItem("bunkerhain_hs") || 0));
        } catch { /* ignore */ }
        setPhase("title");
      })
      .catch((e: unknown) => {
        if (alive) setLoadError(e instanceof Error ? e.message : "Grafiken konnten nicht geladen werden.");
      });
    return () => { alive = false; };
  }, [onPhase, loadAttempt]);

  // Nur bei Unmount zerstören
  useEffect(() => {
    return () => {
      engineRef.current?.destroy();
      engineRef.current = null;
    };
  }, []);

  const start = () => {
    const au = audioRef.current!;
    au.unlock();
    au.uiClick();
    setStats(null);
    engineRef.current?.begin();
    setPhase("play");
  };

  const toggleMute = () => {
    const m = !muted;
    setMuted(m);
    audioRef.current?.unlock();
    audioRef.current?.setMuted(m);
  };

  const playing = phase === "play";
  const finished = phase === "over" || phase === "win";

  return (
    <div className="relative h-full w-full select-none overflow-hidden bg-[#07060a] crt">
      <div className="noise" />

      {/* Spielfläche */}
      <canvas
        ref={canvasRef}
        className={`game-canvas absolute inset-0 h-full w-full transition-[filter,opacity] duration-700 ${
          playing ? "opacity-100" : finished ? "opacity-40 blur-[2px] saturate-[0.7]" : "opacity-0"
        }`}
      />

      {/* Mute */}
      {phase !== "loading" && (
        <button
          onClick={toggleMute}
          className="btn-ghost absolute right-4 top-4 z-40 flex h-11 w-11 items-center justify-center rounded-lg"
          aria-label="Ton an/aus"
        >
          {muted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
        </button>
      )}

      {/* ---------- LOADING ---------- */}
      {phase === "loading" && (
        <div className="absolute inset-0 z-40 flex flex-col items-center justify-center gap-8 bg-[#07060a]">
          <div className="flex items-center gap-3">
            <div className="hint-dot" />
            <span className="kicker font-display text-xs">EINLASS WIRD VORBEREITET</span>
            <div className="hint-dot" />
          </div>
          <h1 className="font-display title-rave neon-flicker text-5xl sm:text-7xl">BUNKERHAIN</h1>
          <div className="w-72 sm:w-96">
            <div className="h-3 w-full overflow-hidden rounded-full border border-[#7dff5a]/40 bg-black/60">
              <div className="load-bar h-full rounded-full" style={{ width: `${Math.round(progress * 100)}%` }} />
            </div>
            <p className="mt-3 text-center text-xs tracking-[0.25em] text-white/50">
              BETON WIRD GEGOSSEN · {Math.round(progress * 100)}%
            </p>
            {loadError && (
              <div role="alert" className="mt-5 text-center">
                <p className="break-words text-sm text-[#ff2d78]">{loadError}</p>
                <button
                  onClick={() => setLoadAttempt((attempt) => attempt + 1)}
                  className="btn-rave mt-4 rounded-xl px-6 py-3"
                >
                  ERNEUT LADEN
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ---------- TITLE ---------- */}
      {phase === "title" && (
        <div className="absolute inset-0 z-40">
          <img
            src={TITLE_SRC}
            alt="BUNKERHAIN — Zombie Rave Apocalypse"
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#07060a] via-transparent to-[#07060a]/60" />
          <div className="absolute inset-x-0 bottom-0 flex flex-col items-center gap-5 pb-10 sm:pb-14">
            <p className="neon-flicker font-display text-sm tracking-[0.35em] text-[#7dff5a] drop-shadow-[0_2px_0_#000]">
              TÜRSTEHER-DIENST · NACHTSCHICHT
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3 px-4">
              <button onClick={start} className="btn-rave rounded-xl px-10 py-4 text-2xl sm:text-3xl">
                EINLASS STARTEN
              </button>
            </div>
            <div className="panel-spray mx-4 flex max-w-2xl flex-wrap items-center justify-center gap-x-6 gap-y-2 rounded-xl px-6 py-3 text-[13px] text-white/80">
              <span className="flex items-center gap-2"><Crosshair className="h-4 w-4 text-[#7dff5a]" /> Zielen &amp; klicken = schießen</span>
              <span className="flex items-center gap-2"><Zap className="h-4 w-4 text-[#ffd23f]" /> R = nachladen</span>
              <span className="flex items-center gap-2"><Heart className="h-4 w-4 text-[#ff2d78]" /> Menschen &amp; Durchbrecher kosten Herzen</span>
              <span className="flex items-center gap-2"><Star className="h-4 w-4 text-[#ffd23f]" /> Sterne einsammeln</span>
            </div>
            {hs > 0 && (
              <p className="font-display text-xs tracking-[0.3em] text-white/50">
                BESTLEISTUNG · <span className="text-[#ffd23f]">{hs.toLocaleString("de-DE")}</span>
              </p>
            )}
          </div>
        </div>
      )}

      {/* ---------- GAME OVER / WIN ---------- */}
      {finished && stats && (
        <div className="absolute inset-0 z-40 flex items-center justify-center p-4">
          <div className="panel-spray flex w-full max-w-xl flex-col items-center gap-6 rounded-2xl px-6 py-8 sm:px-10">
            {phase === "win" ? (
              <>
                <DOMSprite frame="star" size={92} className="drop-shadow-[0_0_24px_rgba(255,210,63,0.6)]" />
                <h2 className="font-display title-rave text-center text-4xl sm:text-5xl">SONNENAUFGANG</h2>
                <p className="-mt-3 text-center text-sm text-white/70">
                  Der Betontroll ist erledigt. Der Floor atmet. Du bist Legende der Nachtschicht.
                </p>
              </>
            ) : (
              <>
                <DOMSprite frame="skull" size={92} className="drop-shadow-[0_0_24px_rgba(255,45,120,0.6)]" />
                <h2
                  className="font-display text-center text-4xl sm:text-5xl"
                  style={{ color: "#ff2d78", textShadow: "0 3px 0 #000, 0 0 30px rgba(255,45,120,0.5)" }}
                >
                  PLATTGEMACHT
                </h2>
                <p className="-mt-3 text-center text-sm text-white/70">
                  Die Schlange hat gewonnen. Der Troll nickt: „Wiederkommen darfst du trotzdem.&quot;
                </p>
              </>
            )}

            <div className="grid w-full grid-cols-2 gap-3 sm:grid-cols-3">
              <div className="stat-chip rounded-lg px-4 py-3">
                <p className="flex items-center gap-1.5 text-[11px] tracking-widest text-white/50"><Skull className="h-3.5 w-3.5" /> SCORE</p>
                <p className="font-display text-xl text-[#7dff5a]">{stats.score.toLocaleString("de-DE")}</p>
              </div>
              <div className="stat-chip rounded-lg px-4 py-3">
                <p className="flex items-center gap-1.5 text-[11px] tracking-widest text-white/50"><Crosshair className="h-3.5 w-3.5" /> ERLEDIGT</p>
                <p className="font-display text-xl text-white">{stats.kills}</p>
              </div>
              <div className="stat-chip rounded-lg px-4 py-3">
                <p className="flex items-center gap-1.5 text-[11px] tracking-widest text-white/50"><Zap className="h-3.5 w-3.5" /> MAX COMBO</p>
                <p className="font-display text-xl text-[#ff2d78]">×{stats.maxCombo}</p>
              </div>
              <div className="stat-chip rounded-lg px-4 py-3">
                <p className="flex items-center gap-1.5 text-[11px] tracking-widest text-white/50"><DoorOpen className="h-3.5 w-3.5" /> TREFFQUOTE</p>
                <p className="font-display text-xl text-white">
                  {stats.shots > 0 ? Math.round((stats.hits / stats.shots) * 100) : 0}%
                </p>
              </div>
              <div className="stat-chip rounded-lg px-4 py-3">
                <p className="flex items-center gap-1.5 text-[11px] tracking-widest text-white/50"><Timer className="h-3.5 w-3.5" /> SCHICHT</p>
                <p className="font-display text-xl text-white">{Math.round(stats.timeMs / 1000)}s</p>
              </div>
              <div className="stat-chip rounded-lg px-4 py-3">
                <p className="flex items-center gap-1.5 text-[11px] tracking-widest text-white/50"><Users className="h-3.5 w-3.5" /> REKORD</p>
                <p className="font-display text-xl text-[#ffd23f]">{hs.toLocaleString("de-DE")}</p>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-4">
              <button onClick={start} className="btn-rave flex items-center gap-2 rounded-xl px-8 py-3.5 text-lg">
                <RotateCcw className="h-5 w-5" /> NOCH EINE SCHICHT
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
