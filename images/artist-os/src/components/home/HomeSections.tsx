"use client";

import { withBase } from "@/lib/base";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowRight, ArrowUpRight, Disc3, Download, FileText, Pause, Play } from "lucide-react";
import { ALBUM, GAME, PHOTOS, PRODUCTS, TRACKS, fmtEUR, fmtDate, gigNote, type Gig } from "@/lib/data";
import { localize } from "@/lib/i18n";
import { useLang } from "@/lib/useLang";
import { usePlayer } from "@/components/audio/AudioProvider";
import NewsletterForm from "@/components/forms/NewsletterForm";
import Turntable from "@/components/three/Turntable";
import Reveal from "@/components/site/Reveal";
import LogoMark from "@/components/site/LogoMark";
import LogoBadge from "@/components/site/LogoBadge";

const COPY = {
  de: {
    kicker: "Berlin-Friedrichshain, DJ & Produzent",
    heroLine: "Rare Funk, Soul und staubige Beats. Platten, die sonst keiner mehr spielt.",
    booking: "Booking anfragen",
    portraitAlt: "DJ Noizy Neighbor backstage, Lederjacke, Brille",
    coverAlt: `Cover von ${ALBUM.title}`,
    album: "Album",
    blurb: ALBUM.blurb,
    moreTracks: (n: number) => `und ${n} weitere Tracks`,
    listen: "Album anhören",
    soldOut: "Ausverkauft",
    confirmed: "Bestätigt",
    allDates: "Alle Termine",
    promoters: "Für Veranstalter",
    promotersText: "Vinyl-only Sets, hybride MPC-Live-Sets und B2B. Pressefotos, Bio und Rider liegen bereit.",
    pressKit: "Pressekit (ZIP)",
    rider: "Technical Rider (PDF)",
    request: "Booking-Anfrage",
    essayTitle: "Aus der Plattenkiste auf den Floor.",
    liveAlt: "Noizy Neighbor legt im Club auf",
    liveCap: "Vinyl-only, die ganze Nacht.",
    crateAlt: "Crate-Digging im Plattenladen",
    crateCap: "Dienstags im Plattenladen, wie immer.",
    essayText: "Beats seit Anfang der 2000er, angefangen auf der MPC 2000XL. Gesampelt wird nur aus der eigenen Plattensammlung. Alles andere entscheidet der Floor.",
    story: "Die ganze Geschichte",
    scratchTitle: "Selbst mal scratchen",
    scratchText: "Zieh die Platte mit Maus oder Finger. Der Ton folgt deiner Hand, der Pitch-Fader schafft ±8 %.",
    deckLoading: "Plattenspieler lädt",
    gameAria: "Zum Spiel",
    gameAlt: "Spielszene aus Detektiv Funk Schnüffler: Gespräch im Plattenkeller",
    gameBadge: "NEU: 10-Track Original Soundtrack",
    gameClaim: GAME.claim,
    gameText: "Noizy als Plattendetektiv: diggen, Beats bauen, Berliner Clubs erobern – inklusive dem offiziellen 10-Track Original Soundtrack «Rare Groove Hustle». Direkt im Browser spielbar.",
    play: "Jetzt spielen",
    toGame: "Zum Spiel",
    toSoundtrack: "Soundtrack",
    toShop: "Zum Shop",
    nightAlt: "Mit Plattentasche nachts in Berlin unterwegs",
    clubText: "Einmal im Monat: Secret Gigs, unveröffentlichte Edits und Vorab-Tickets. Wie ein Tape im Briefkasten.",
  },
  en: {
    kicker: "Berlin-Friedrichshain, DJ & producer",
    heroLine: "Rare funk, soul and dusty beats. Records nobody else plays anymore.",
    booking: "Booking request",
    portraitAlt: "DJ Noizy Neighbor backstage, leather jacket, glasses",
    coverAlt: `Cover of ${ALBUM.title}`,
    album: "Album",
    blurb: ALBUM.blurbEn,
    moreTracks: (n: number) => `and ${n} more tracks`,
    listen: "Listen to the album",
    soldOut: "Sold out",
    confirmed: "Confirmed",
    allDates: "All dates",
    promoters: "For promoters",
    promotersText: "Vinyl-only sets, hybrid MPC live sets and B2B. Press photos, bio and riders are ready.",
    pressKit: "Press kit (ZIP)",
    rider: "Technical rider (PDF)",
    request: "Booking request",
    essayTitle: "From the record crate to the floor.",
    liveAlt: "Noizy Neighbor DJing in a club",
    liveCap: "Vinyl only, all night long.",
    crateAlt: "Crate digging in a record shop",
    crateCap: "Tuesdays at the record shop, as always.",
    essayText: "Making beats since the early 2000s, starting on the MPC 2000XL. Samples come only from his own record collection. The floor decides the rest.",
    story: "The whole story",
    scratchTitle: "Try scratching",
    scratchText: "Drag the record with your mouse or finger. The sound follows your hand, the pitch fader goes ±8%.",
    deckLoading: "Turntable loading",
    gameAria: "To the game",
    gameAlt: "Scene from Detektiv Funk Schnüffler: talking in the record basement",
    gameBadge: "NEW: 10-Track Original Soundtrack",
    gameClaim: GAME.claimEn,
    gameText: "Noizy as the record detective: dig, build beats, play out – including the official 10-track Original Soundtrack 'Rare Groove Hustle'. Runs right in your browser.",
    play: "Play now",
    toGame: "About the game",
    toSoundtrack: "Soundtrack",
    toShop: "Visit the shop",
    nightAlt: "Out at night in Berlin with the record bag",
    clubText: "Once a month: secret gigs, unreleased edits and early tickets. Like a tape in your mailbox.",
  },
};

const useCopy = () => {
  const lang = useLang();
  return { lang, t: COPY[lang], href: (p: string) => localize(p, lang) };
};

/** mount heavy 3D only when near the viewport */
function useNearViewport<T extends HTMLElement>(margin = "320px") {
  const ref = useRef<T>(null);
  const [near, setNear] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) if (e.isIntersecting) { setNear(true); io.disconnect(); }
      },
      { rootMargin: margin }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [margin]);
  return { ref, near };
}

/* ------------------------------------------------------------------ */
export function Hero() {
  const { t, href } = useCopy();
  const player = usePlayer();
  const first = TRACKS[0];
  const onFirst = player.index === 0 && player.started;
  const spinning = player.playing;

  return (
    <section className="mx-auto grid min-h-[calc(100dvh-4rem)] max-w-[1400px] items-center overflow-x-clip gap-10 px-4 pb-16 pt-10 sm:px-8 lg:grid-cols-12 lg:gap-6 lg:pt-6">
      <div className="lg:col-span-7">
        <p className="anim-rise font-mono text-sm text-fg-muted">{t.kicker}</p>

        <h1 className="anim-rise type-condensed mt-4 text-[clamp(4.5rem,21vw,10rem)] text-fg lg:text-[clamp(6rem,10.5vw,11.5rem)]" style={{ animationDelay: "80ms" }}>
          Noizy
          <br />
          Neigh<span className="text-vinyl">bor</span>
        </h1>

        <p className="anim-rise mt-7 max-w-[34ch] text-xl leading-snug text-fg sm:text-2xl" style={{ animationDelay: "160ms" }}>
          {t.heroLine}
        </p>

        <div className="anim-rise mt-9 flex flex-wrap items-center gap-x-8 gap-y-5" style={{ animationDelay: "240ms" }}>
          <button onClick={() => (onFirst ? player.toggle() : player.play(0))} className="group flex items-center gap-4 text-left">
            <span className="grid size-16 place-items-center rounded-full bg-vinyl text-ink transition group-hover:scale-105 group-active:scale-95">
              {onFirst && player.playing ? <Pause className="size-6" /> : <Play className="ml-1 size-6" />}
            </span>
            <span>
              <span className="block text-lg font-bold leading-tight">{first.title}</span>
              <span className="block font-mono text-sm text-fg-muted">{first.bpm} BPM, {first.duration}</span>
            </span>
          </button>
          <Link href={href("/bookings")} className="group inline-flex items-center gap-2 border-b-2 border-fg pb-1 text-lg font-semibold">
            {t.booking}
            <ArrowRight className="size-5 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
      </div>

      {/* the sleeve: duotone portrait with the record sliding out */}
      <div className="anim-sleeve relative mx-auto w-full max-w-[520px] lg:col-span-5 lg:mr-0" style={{ animationDelay: "120ms" }}>
        <div
          className={`deck-disc absolute right-0 top-[6%] aspect-square w-[88%] transition-transform duration-[1200ms] ease-[cubic-bezier(0.16,1,0.3,1)] ${
            spinning ? "translate-x-[34%]" : "translate-x-[18%]"
          }`}
          aria-hidden
        >
          <div className={`absolute inset-[33%] grid place-items-center rounded-full bg-vinyl ${spinning ? "anim-spin-slow" : ""}`}>
            <span className="type-condensed text-[clamp(0.8rem,1.6vw,1.1rem)] text-ink">NN</span>
          </div>
        </div>
        <figure className="duotone duotone-reveal relative aspect-[4/5] w-[88%] border-2 border-fg shadow-[8px_8px_0_var(--color-fg)]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={PHOTOS.portrait} alt={t.portraitAlt} className="h-full w-full object-cover object-[50%_30%]" fetchPriority="high" />
        </figure>
        <LogoBadge className="absolute -bottom-8 -left-6 w-[38%] -rotate-6 sm:-left-10" />
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
export function FeaturedRelease() {
  const { t, href } = useCopy();
  return (
    <section className="relative border-y-2 border-fg bg-surface">
      {/* the logo's skyline standing on the horizon line */}
      <div className="pointer-events-none absolute inset-x-0 bottom-full mx-auto max-w-[1400px] px-4 sm:px-8" aria-hidden>
        <LogoMark kind="skyline" decorative className="ml-auto h-20 w-auto text-fg sm:h-28 lg:ml-0" />
      </div>
      <div className="mx-auto grid max-w-[1400px] gap-10 px-4 py-16 sm:px-8 md:grid-cols-12 md:py-24">
        <Reveal className="md:col-span-5">
          <div className="border-2 border-fg shadow-[8px_8px_0_var(--color-fg)]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={ALBUM.cover} alt={t.coverAlt} className="aspect-square w-full object-cover" loading="lazy" />
          </div>
        </Reveal>

        <Reveal delay={100} className="md:col-span-7 md:pl-6">
          <p className="font-mono text-sm text-fg-muted">{t.album}, {ALBUM.year}</p>
          <h2 className="type-condensed mt-2 text-[clamp(3.5rem,8vw,7rem)]">{ALBUM.title}</h2>
          <p className="mt-3 max-w-[46ch] text-lg text-fg-muted">{t.blurb}</p>

          <ol className="mt-8 grid border-t-2 border-fg sm:grid-cols-2 sm:gap-x-8">
            {ALBUM.tracks.slice(0, 8).map(([title, d], i) => (
              <li key={title} className="flex items-baseline justify-between gap-3 border-b border-fg/30 py-3">
                <span className="min-w-0 truncate text-lg font-bold tracking-tight">
                  <span className="mr-3 font-mono text-sm font-normal text-fg-muted">{String(i + 1).padStart(2, "0")}</span>
                  {title}
                </span>
                <span className="shrink-0 font-mono text-sm">{d}</span>
              </li>
            ))}
          </ol>
          <p className="mt-3 text-sm text-fg-muted">{t.moreTracks(ALBUM.tracks.length - 8)}</p>

          <div className="mt-8 flex flex-wrap items-center gap-x-8 gap-y-4">
            <Link href={href("/discography")} className="sticker sticker-hover inline-flex items-center gap-2 bg-vinyl px-6 py-3 text-base font-bold text-ink">
              {t.listen}
            </Link>
            {ALBUM.links.filter((l) => l.name !== "YouTube").map((l) => (
              <a key={l.name} href={l.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 border-b-2 border-fg pb-0.5 font-semibold hover:text-vinyl">
                {l.name} <ArrowUpRight className="size-4" />
              </a>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
export function Dates({ gigs }: { gigs: Gig[] }) {
  const { lang, t, href } = useCopy();
  const upcoming = gigs.filter((g) => g.date >= "2026-01-01").sort((a, b) => a.date.localeCompare(b.date)).slice(0, 5);
  return (
    <section className="mx-auto grid max-w-[1400px] gap-12 px-4 py-20 sm:px-8 md:py-28 lg:grid-cols-12">
      <div className="lg:col-span-8">
        <Reveal>
          <h2 className="type-condensed text-[clamp(4rem,10vw,8.5rem)]">Live</h2>
        </Reveal>
        <ul className="mt-6 border-t-2 border-fg">
          {upcoming.map((g, i) => {
            const d = fmtDate(g.date, lang);
            const sold = g.status === "SOLD OUT";
            return (
              <Reveal key={g.id} delay={i * 60}>
                <li className="grid grid-cols-[4.5rem_1fr] items-center gap-x-5 gap-y-2 border-b border-fg/30 py-5 sm:grid-cols-[6rem_1fr_auto]">
                  <span className="row-span-2 flex flex-col items-start sm:row-span-1">
                    <span className="type-condensed text-6xl sm:text-7xl">{d.day}</span>
                    <span className="font-mono text-sm font-bold">{d.month.slice(0, 3)} {d.year}</span>
                  </span>
                  <span className={sold ? "text-fg-muted" : ""}>
                    <span className={`block text-xl font-bold sm:text-2xl ${sold ? "line-through decoration-2" : ""}`}>{g.venue}</span>
                    <span className="block text-fg-muted">{g.city}, {gigNote(g, lang)}</span>
                  </span>
                  <span className="col-start-2 sm:col-start-auto">
                    {sold ? (
                      <span className="font-mono text-sm">{t.soldOut}</span>
                    ) : g.status === "TICKETS" ? (
                      <Link href={href("/bookings")} className="inline-flex items-center gap-1 border-b-2 border-vinyl pb-0.5 font-semibold hover:text-vinyl">
                        Tickets <ArrowUpRight className="size-4" />
                      </Link>
                    ) : (
                      <span className="font-mono text-sm text-fg-muted">{t.confirmed}</span>
                    )}
                  </span>
                </li>
              </Reveal>
            );
          })}
        </ul>
        <Link href={href("/bookings")} className="group mt-6 inline-flex items-center gap-2 font-semibold">
          {t.allDates} <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
        </Link>
      </div>

      <Reveal delay={120} className="lg:col-span-4 lg:pt-36">
        <aside className="sticker bg-sunburst p-6 text-ink sm:p-8">
          <h3 className="type-condensed text-5xl">{t.promoters}</h3>
          <p className="mt-3 text-[15px] leading-relaxed">{t.promotersText}</p>
          <ul className="mt-6 space-y-3 font-semibold">
            <li>
              <a href={withBase("/api/epk")} className="flex items-center justify-between gap-3 border-b-2 border-ink pb-2 hover:text-vinyl-deep">
                {t.pressKit} <Download className="size-5" />
              </a>
            </li>
            <li>
              <a href={withBase("/api/rider?type=technical")} className="flex items-center justify-between gap-3 border-b-2 border-ink pb-2 hover:text-vinyl-deep">
                {t.rider} <FileText className="size-5" />
              </a>
            </li>
            <li>
              <Link href={href("/bookings")} className="flex items-center justify-between gap-3 border-b-2 border-ink pb-2 hover:text-vinyl-deep">
                {t.request} <ArrowRight className="size-5" />
              </Link>
            </li>
          </ul>
        </aside>
      </Reveal>
    </section>
  );
}

/* ------------------------------------------------------------------ */
export function PhotoEssay() {
  const { t, href } = useCopy();
  return (
    <section className="mx-auto max-w-[1400px] px-4 py-10 sm:px-8">
      <Reveal>
        <h2 className="max-w-[16ch] text-4xl font-bold leading-[1.05] tracking-tight sm:text-6xl">{t.essayTitle}</h2>
      </Reveal>
      <div className="mt-12 grid gap-6 md:grid-cols-12 md:gap-8">
        <Reveal className="md:col-span-7 md:row-span-2">
          <figure>
            <div className="aspect-[4/5] overflow-hidden border-2 border-fg md:aspect-auto md:h-[760px]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={PHOTOS.liveDj} alt={t.liveAlt} className="h-full w-full object-cover transition-transform duration-[1400ms] hover:scale-[1.03]" loading="lazy" />
            </div>
            <figcaption className="mt-3 text-sm text-fg-muted">{t.liveCap}</figcaption>
          </figure>
        </Reveal>
        <Reveal delay={80} className="md:col-span-5">
          <figure>
            <div className="aspect-[4/3] overflow-hidden border-2 border-fg">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={PHOTOS.crateDigging} alt={t.crateAlt} className="h-full w-full object-cover transition-transform duration-[1400ms] hover:scale-[1.03]" loading="lazy" />
            </div>
            <figcaption className="mt-3 text-sm text-fg-muted">{t.crateCap}</figcaption>
          </figure>
        </Reveal>
        <Reveal delay={140} className="md:col-span-5">
          <div className="flex h-full flex-col justify-between gap-8 md:pt-4">
            <p className="text-xl leading-relaxed sm:text-2xl">{t.essayText}</p>
            <Link href={href("/about")} className="group inline-flex items-center gap-2 self-start border-b-2 border-fg pb-1 text-lg font-semibold">
              {t.story} <ArrowRight className="size-5 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
export function TurntableTeaser() {
  const { t } = useCopy();
  const { ref, near } = useNearViewport<HTMLDivElement>();
  return (
    <section className="mx-auto max-w-[1400px] px-4 py-24 sm:px-8">
      <Reveal>
        <div className="mb-8 max-w-2xl">
          <h2 className="type-condensed text-[clamp(3.5rem,8vw,6.5rem)]">{t.scratchTitle}</h2>
          <p className="mt-3 text-lg text-fg-muted">{t.scratchText}</p>
        </div>
      </Reveal>
      <Reveal delay={100}>
        <div ref={ref}>
          {near ? (
            <Turntable compact />
          ) : (
            <div className="stage-3d grid h-[380px] w-full place-items-center sm:h-[440px]">
              <div className="flex items-center gap-3 font-mono text-sm text-fg-muted">
                <Disc3 className="size-5 anim-spin-slow text-vinyl" /> {t.deckLoading}
              </div>
            </div>
          )}
        </div>
      </Reveal>
    </section>
  );
}

/* ------------------------------------------------------------------ */
export function GameTeaser() {
  const { t, href } = useCopy();
  return (
    <section className="border-y-2 border-fg bg-surface">
      <div className="mx-auto grid max-w-[1400px] items-center gap-10 px-4 py-16 sm:px-8 md:py-20 lg:grid-cols-12">
        <Reveal className="lg:col-span-7 lg:order-2">
          <Link href={href("/spiel")} className="group block overflow-hidden border-2 border-fg shadow-[8px_8px_0_var(--color-fg)]" aria-label={t.gameAria}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={GAME.stills.otto} alt={t.gameAlt} width={1440} height={1000} loading="lazy" className="w-full transition-transform duration-[1200ms] group-hover:scale-[1.02]" />
          </Link>
        </Reveal>
        <Reveal delay={100} className="lg:col-span-5">
          <div className="flex flex-wrap items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={GAME.logo} alt={GAME.title} width={480} height={320} loading="lazy" className="w-full max-w-[280px]" />
            <span className="font-mono text-xs font-bold uppercase tracking-wider text-vinyl border border-vinyl/40 bg-vinyl/10 px-2.5 py-1 rounded-xs">
              {t.gameBadge}
            </span>
          </div>
          <p className="mt-5 text-2xl font-bold leading-snug tracking-tight">{t.gameClaim}</p>
          <p className="mt-3 max-w-[40ch] text-lg text-fg-muted">{t.gameText}</p>
          <div className="mt-7 flex flex-wrap items-center gap-x-6 gap-y-4">
            <a href={GAME.playUrl} target="_blank" rel="noopener" className="sticker sticker-hover inline-flex items-center gap-2 bg-vinyl px-6 py-3 font-bold text-ink">
              {t.play} <ArrowUpRight className="size-5" />
            </a>
            <Link href={href("/spiel")} className="group inline-flex items-center gap-2 border-b-2 border-fg pb-1 font-semibold">
              {t.toGame} <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
            </Link>
            <Link href={href("/spiel#soundtrack")} className="group inline-flex items-center gap-1.5 font-mono text-sm font-bold text-fg-muted hover:text-vinyl">
              <Disc3 className="size-4 text-vinyl" /> {t.toSoundtrack}
            </Link>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
export function MerchPreview() {
  const { t, href } = useCopy();
  const lead = PRODUCTS.find((p) => p.id === "denim-jacket")!;
  const rest = PRODUCTS.filter((p) => p.id === "snapback" || p.id === "ringer-tee");
  return (
    <section className="mx-auto max-w-[1400px] px-4 py-16 sm:px-8">
      <Reveal>
        <div className="flex flex-wrap items-end justify-between gap-4 border-b-2 border-fg pb-4">
          <h2 className="type-condensed text-[clamp(3.5rem,8vw,6.5rem)]">Merch</h2>
          <Link href={href("/shop")} className="group inline-flex items-center gap-2 pb-2 font-semibold">
            {t.toShop} <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
      </Reveal>
      <div className="mt-8 grid gap-6 md:grid-cols-12">
        <Reveal className="md:col-span-7">
          <ProductTile p={lead} big />
        </Reveal>
        <div className="grid gap-6 md:col-span-5">
          {rest.map((p, i) => (
            <Reveal key={p.id} delay={80 + i * 80}>
              <ProductTile p={p} />
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function ProductTile({ p, big = false }: { p: (typeof PRODUCTS)[number]; big?: boolean }) {
  const { lang, href } = useCopy();
  return (
    <Link href={href("/shop")} className="group block">
      <div className={`relative grid place-items-center overflow-hidden border-2 border-fg bg-surface ${big ? "aspect-[5/4] md:aspect-auto md:h-[560px]" : "aspect-[16/9] md:h-[268px] md:aspect-auto"}`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={p.img} alt={p.name} className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-105" loading="lazy" />
        {p.compareAt && <span className="absolute left-4 top-4 rounded-full bg-vinyl px-3 py-1 text-sm font-bold text-ink">Sale</span>}
      </div>
      <div className="mt-3 flex items-baseline justify-between gap-4">
        <h3 className={`font-bold tracking-tight group-hover:text-vinyl ${big ? "text-2xl" : "text-lg"}`}>{p.name}</h3>
        <p className="shrink-0 font-mono">
          {p.compareAt && <span className="mr-2 text-sm text-fg-muted line-through">{fmtEUR(p.compareAt, lang)}</span>}
          {fmtEUR(p.price, lang)}
        </p>
      </div>
    </Link>
  );
}

/* ------------------------------------------------------------------ */
export function CrateClubSection() {
  const { t } = useCopy();
  return (
    <section className="mx-auto max-w-[1400px] px-4 py-20 sm:px-8">
      <div className="grid items-center gap-10 md:grid-cols-2">
        <Reveal>
          <div className="duotone is-sun aspect-[3/2] border-2 border-fg">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={PHOTOS.berlinNight} alt={t.nightAlt} className="h-full w-full object-cover" loading="lazy" />
          </div>
        </Reveal>
        <Reveal delay={100}>
          <h2 className="type-condensed text-[clamp(3.5rem,7vw,6rem)]">Crate Club</h2>
          <p className="mt-4 max-w-md text-lg leading-relaxed text-fg-muted">{t.clubText}</p>
          <div className="mt-8">
            <NewsletterForm />
          </div>
        </Reveal>
      </div>
    </section>
  );
}
