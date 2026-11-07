"use client";

import { useState, useRef, useEffect } from "react";
import { ArrowUpRight, Play, Pause, Disc3, RotateCw, Volume2, Sparkles, ExternalLink } from "lucide-react";
import { GAME, ALBUM } from "@/lib/data";
import type { Lang } from "@/lib/i18n";
import Reveal from "@/components/site/Reveal";

const COPY = {
  de: {
    kicker: "Offizieller Original Soundtrack · 2023 / 2026",
    title: GAME.soundtrack.title,
    artist: GAME.soundtrack.artist,
    lead: "10 Instrumental-Tracks, 45 Minuten handgemachter Raw Funk und Soul ohne Samples. Jeder Kiez und Schauplatz in Berlin hat im Spiel sein eigenes Thema.",
    lineup: GAME.soundtrack.lineup,
    flipFront: "Vorderseite zeigen",
    flipBack: "Rückseite & Trackliste",
    playTheme: "Titelthema anspielen",
    pauseTheme: "Titelthema anhalten",
    themePlaying: "Spielt: Thema für den Funk Schnüffler",
    themeStandby: "Audio-Ausschnitt: Thema für den Funk Schnüffler (Kreuzberg)",
    sideA: "Seite A · Friedrichshain & Mitte",
    sideB: "Seite B · Kreuzberg, Neukölln & Wedding",
    playGame: "Spiel im Browser starten",
    landingLink: "Offizielle Game & Soundtrack Landingpage",
    connectionTitle: "Die Verbindung zu DJ Noizy Neighbor",
    connectionText: "Detektiv Funk Schnüffler ist Noizys detektivisches Alter Ego: Mit Trenchcoat, Kopfhörern und kleinem Plattenkoffer zieht er durch Berliner Clubs und staubige Keller. Im Spiel stecken neben dem neuen 10-Track-Soundtrack auch Stücke aus Noizys Album «Back on 16 pads».",
    tracksHeading: "Die 10 Original-Titel",
    scene: "Schauplatz",
  },
  en: {
    kicker: "Official Original Soundtrack · 2023 / 2026",
    title: GAME.soundtrack.title,
    artist: GAME.soundtrack.artist,
    lead: "10 instrumental tracks, 45 minutes of handmade raw funk and soul without samples. Every district and venue in Berlin has its dedicated theme in the game.",
    lineup: GAME.soundtrack.lineupEn,
    flipFront: "Show Front Cover",
    flipBack: "Flip to Back Cover",
    playTheme: "Play Title Theme",
    pauseTheme: "Pause Title Theme",
    themePlaying: "Playing: Thema für den Funk Schnüffler",
    themeStandby: "Audio Preview: Thema für den Funk Schnüffler (Kreuzberg)",
    sideA: "Side A · Friedrichshain & Mitte",
    sideB: "Side B · Kreuzberg, Neukölln & Wedding",
    playGame: "Launch Game in Browser",
    landingLink: "Official Game & Soundtrack Landing Page",
    connectionTitle: "The DJ Noizy Neighbor Connection",
    connectionText: "Detektiv Funk Schnüffler is Noizy's detective alter ego: with a trenchcoat, headphones and a small record bag, he digs through Berlin's clubs and dusty basements. Alongside this new 10-track soundtrack, Noizy's record bag in the game also carries tracks from «Back on 16 pads».",
    tracksHeading: "The 10 Original Tracks",
    scene: "Scene",
  },
};

export default function GameSoundtrack({ lang }: { lang: Lang }) {
  const t = COPY[lang];
  const [flipped, setFlipped] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const audio = new Audio(GAME.soundtrack.previewAudio);
    audioRef.current = audio;

    const onEnded = () => setIsPlaying(false);
    audio.addEventListener("ended", onEnded);

    return () => {
      audio.removeEventListener("ended", onEnded);
      audio.pause();
    };
  }, []);

  const toggleAudio = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().catch(() => {});
      setIsPlaying(true);
    }
  };

  const sideATracks = GAME.soundtrack.tracks.slice(0, 5);
  const sideBTracks = GAME.soundtrack.tracks.slice(5, 10);

  return (
    <section id="soundtrack" className="scroll-mt-24 border-t-2 border-fg bg-surface py-20 md:py-28">
      <div className="mx-auto max-w-[1400px] px-4 sm:px-8">
        {/* Header */}
        <Reveal>
          <div className="flex flex-wrap items-center justify-between gap-4 border-b-2 border-fg pb-6">
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.25em] text-fg-muted">{t.kicker}</p>
              <h2 className="type-condensed mt-2 text-[clamp(3.5rem,8vw,7rem)] leading-none text-fg">
                {t.title}
              </h2>
              <p className="mt-3 text-2xl font-bold tracking-tight text-vinyl sm:text-3xl">
                {t.artist}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <a
                href={GAME.soundtrackLandingUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="sticker sticker-hover inline-flex items-center gap-2 bg-vinyl px-5 py-2.5 font-bold text-ink"
              >
                {t.landingLink} <ArrowUpRight className="size-4" />
              </a>
            </div>
          </div>
          <p className="mt-6 max-w-3xl text-lg leading-relaxed text-fg-muted">{t.lead}</p>
        </Reveal>

        {/* Sleeve and Interactive Player */}
        <div className="mt-12 grid items-start gap-12 lg:grid-cols-12">
          {/* Vinyl Cover (Flip interactive) */}
          <Reveal className="lg:col-span-5">
            <div className="group relative">
              <div
                onClick={() => setFlipped(!flipped)}
                className="cursor-pointer overflow-hidden border-2 border-fg shadow-[10px_10px_0_var(--color-fg)] transition-transform duration-300 hover:-translate-y-1"
                title={flipped ? t.flipFront : t.flipBack}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={flipped ? GAME.soundtrack.backCover : GAME.soundtrack.cover}
                  alt={`${t.title} Cover`}
                  width={500}
                  height={500}
                  loading="lazy"
                  className="aspect-square w-full object-cover transition-opacity duration-300"
                />
              </div>

              {/* Cover Controls */}
              <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => setFlipped(!flipped)}
                  className="inline-flex items-center gap-2 border-b-2 border-fg pb-1 font-mono text-sm font-bold hover:text-vinyl"
                >
                  <RotateCw className="size-4" />
                  {flipped ? t.flipFront : t.flipBack}
                </button>
                <span className="font-mono text-xs text-fg-muted">
                  {flipped ? "Albumrückseite mit Trackliste" : "Original Artwork (12\" Vinyl-Format)"}
                </span>
              </div>

              {/* Audio Preview Widget */}
              <div className="mt-6 rounded-md border-2 border-fg bg-page p-4 shadow-[5px_5px_0_var(--color-fg)]">
                <div className="flex items-center justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <span className="flex items-center gap-2 font-mono text-xs uppercase text-fg-muted">
                      <Volume2 className="size-4 text-vinyl" />
                      {isPlaying ? t.themePlaying : t.themeStandby}
                    </span>
                    <span className="block truncate text-base font-bold text-fg">
                      Thema für den Funk Schnüffler (5:32)
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={toggleAudio}
                    aria-label={isPlaying ? t.pauseTheme : t.playTheme}
                    className="grid size-12 shrink-0 place-items-center rounded-full border-2 border-fg bg-vinyl text-ink shadow-[2px_2px_0_var(--color-fg)] transition hover:scale-105 active:scale-95"
                  >
                    {isPlaying ? <Pause className="size-5 fill-current" /> : <Play className="ml-0.5 size-5 fill-current" />}
                  </button>
                </div>
                {/* Animated EQ Bar when playing */}
                <div className="mt-3 flex h-3 items-end gap-1" aria-hidden>
                  {[0.7, 1.2, 0.5, 0.9, 1.4, 0.6, 1.1, 0.8, 1.3, 0.4, 1.0, 0.6].map((rate, i) => (
                    <span
                      key={i}
                      className={`flex-1 rounded-xs transition-all ${
                        isPlaying ? "bg-vinyl" : "bg-fg/20"
                      }`}
                      style={{
                        height: isPlaying ? `${Math.sin(i * 1.5) * 40 + 60}%` : "20%",
                        animation: isPlaying ? `pulse ${rate}s infinite alternate ease-in-out` : "none",
                      }}
                    />
                  ))}
                </div>
              </div>
            </div>
          </Reveal>

          {/* Tracklist & Details */}
          <Reveal delay={120} className="lg:col-span-7">
            <h3 className="type-condensed text-3xl sm:text-4xl">{t.tracksHeading}</h3>
            
            {/* Side A */}
            <div className="mt-4">
              <span className="font-mono text-xs font-bold tracking-widest uppercase text-vinyl">{t.sideA}</span>
              <ol className="mt-2 border-t-2 border-fg">
                {sideATracks.map((track) => (
                  <li
                    key={track.no}
                    className="flex items-baseline justify-between gap-3 border-b border-fg/25 py-2.5 text-base sm:text-lg"
                  >
                    <span className="min-w-0 truncate font-semibold">
                      <span className="mr-3 font-mono text-xs font-normal text-fg-muted">{track.side}</span>
                      {track.title}
                      <span className="ml-2 font-mono text-xs font-normal text-fg-muted">({track.scene})</span>
                    </span>
                    <span className="shrink-0 font-mono text-xs text-fg-muted sm:text-sm">{track.duration}</span>
                  </li>
                ))}
              </ol>
            </div>

            {/* Side B */}
            <div className="mt-6">
              <span className="font-mono text-xs font-bold tracking-widest uppercase text-vinyl">{t.sideB}</span>
              <ol className="mt-2 border-t-2 border-fg">
                {sideBTracks.map((track) => (
                  <li
                    key={track.no}
                    className="flex items-baseline justify-between gap-3 border-b border-fg/25 py-2.5 text-base sm:text-lg"
                  >
                    <span className="min-w-0 truncate font-semibold">
                      <span className="mr-3 font-mono text-xs font-normal text-fg-muted">{track.side}</span>
                      {track.title}
                      <span className="ml-2 font-mono text-xs font-normal text-fg-muted">({track.scene})</span>
                    </span>
                    <span className="shrink-0 font-mono text-xs text-fg-muted sm:text-sm">{track.duration}</span>
                  </li>
                ))}
              </ol>
            </div>

            {/* Credits & Lineup */}
            <div className="mt-8 rounded-sm border border-fg/30 bg-page/60 p-4">
              <p className="font-mono text-xs uppercase tracking-wider text-fg-muted">Credits & Besetzung</p>
              <p className="mt-1 text-sm font-semibold text-fg sm:text-base">{t.lineup}</p>
            </div>

            {/* Relationship to Noizy */}
            <div className="mt-6 border-l-4 border-vinyl pl-4">
              <p className="font-bold text-fg">{t.connectionTitle}</p>
              <p className="mt-1 text-sm leading-relaxed text-fg-muted">{t.connectionText}</p>
            </div>

            {/* CTAs */}
            <div className="mt-8 flex flex-wrap items-center gap-x-8 gap-y-4">
              <a
                href={GAME.playUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="sticker sticker-hover inline-flex items-center gap-2 bg-fg px-7 py-3 text-base font-bold text-page"
              >
                {t.playGame} <ArrowUpRight className="size-5" />
              </a>
              <a
                href={GAME.soundtrackLandingUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="group inline-flex items-center gap-2 border-b-2 border-fg pb-1 font-semibold hover:text-vinyl"
              >
                {t.landingLink} <ExternalLink className="size-4 transition-transform group-hover:translate-x-0.5" />
              </a>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
