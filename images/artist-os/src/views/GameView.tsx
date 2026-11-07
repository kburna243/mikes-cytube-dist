import type { Metadata } from "next";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { ALBUM, GAME } from "@/lib/data";
import type { Lang } from "@/lib/i18n";
import Reveal from "@/components/site/Reveal";
import GameSoundtrack from "@/components/game/GameSoundtrack";

const COPY = {
  de: {
    metaTitle: "Spiel: Detektiv Funk Schnüffler",
    metaDesc: "Detektiv Funk Schnüffler, das Point-and-Click-Adventure mit DJ Noizy Neighbor: Platten diggen, Beats bauen und sich durch Berliner Clubs spielen. Direkt im Browser.",
    claim: GAME.claim,
    intro: "Ein Point-and-Click-Adventure im Browser, mit Noizy als Plattendetektiv und seinen Beats als Soundtrack.",
    play: "Jetzt spielen",
    more: "Mehr zum Spiel",
    heroAlt: "Spielszene: Schnüfflers Mansarde mit Plattenregal und Beat-Küche",
    heroCap: "Schnüfflers Mansarde, der Startpunkt.",
    startAria: "Spiel starten",
    loopTitle: "Was du machst",
    loop: [
      { title: "Platten finden", text: "Durch Läden und Keller ziehen, Singles kaufen, prüfen, reinigen und ins Archiv stellen." },
      { title: "Leute kennenlernen", text: "Otto kennt jede Pressung, Arthur hilft beim Archiv, Mona weiß, was die Tanzfläche will." },
      { title: "Beats bauen", text: "In der Beat-Küche eigene Beats und Dubplates basteln, aus dem, was der Koffer hergibt." },
      { title: "Auflegen", text: "Rhythmus-Auftritte und Vinyl-Mix, von der Eckkneipe bis zur eigenen Nacht. Fünf Clubs, eine Karriere." },
    ],
    stills: [
      { alt: "Spielszene: Gespräch mit Onkel Otto im Kellerarchiv", caption: "Onkel Otto „Die Lupe“ in seinem Staubkeller." },
      { alt: "Spielszene: der erste Auftritt in der Kneipe Kalte Fritte", caption: "Erster Auftritt in der Kalten Fritte." },
    ],
    coverAlt: `Cover von ${ALBUM.title}`,
    soundtrack: "Soundtrack",
    soundtrackText: `Im Plattenkoffer stecken echte Tracks von ${ALBUM.artist}, unter anderem aus „${ALBUM.title}“.`,
    facts: [
      ["Läuft", "direkt im Browser, Desktop und Handy"],
      ["Spielstand", "bleibt lokal in deinem Browser, kein Konto nötig"],
      ["Umfang", "fünf Kieze, elf Orte, zehn Figuren, fünf Clubs"],
      ["Stand", "spielbare Fassung, wird weiter ausgebaut"],
    ],
    note: "",
  },
  en: {
    metaTitle: "Game: Detektiv Funk Schnüffler",
    metaDesc: "Detektiv Funk Schnüffler, the point-and-click adventure starring DJ Noizy Neighbor: dig for records, build beats and play your way through Berlin's clubs. Right in your browser.",
    claim: GAME.claimEn,
    intro: "A point-and-click adventure in your browser, with Noizy as the record detective and his beats as the soundtrack.",
    play: "Play now",
    more: "More about the game",
    heroAlt: "Game scene: Schnüffler's attic with record shelf and beat kitchen",
    heroCap: "Schnüffler's attic, where it all starts.",
    startAria: "Start the game",
    loopTitle: "What you do",
    loop: [
      { title: "Find records", text: "Roam shops and basements, buy singles, check them, clean them and file them in your archive." },
      { title: "Meet people", text: "Otto knows every pressing, Arthur helps with the archive, Mona knows what the dance floor wants." },
      { title: "Build beats", text: "Cook up your own beats and dubplates in the beat kitchen, from whatever is in the bag." },
      { title: "Play out", text: "Rhythm gigs and vinyl mixing, from the corner bar to your own night. Five clubs, one career." },
    ],
    stills: [
      { alt: "Game scene: talking to Uncle Otto in his basement archive", caption: "Uncle Otto \"The Magnifier\" in his dusty basement." },
      { alt: "Game scene: the first gig at the Kalte Fritte bar", caption: "First gig at the Kalte Fritte." },
    ],
    coverAlt: `Cover of ${ALBUM.title}`,
    soundtrack: "Soundtrack",
    soundtrackText: `The record bag is full of real tracks by ${ALBUM.artist}, including songs from "${ALBUM.title}".`,
    facts: [
      ["Runs", "right in your browser, desktop and mobile"],
      ["Saves", "stay local in your browser, no account needed"],
      ["Scope", "five districts, eleven places, ten characters, five clubs"],
      ["Status", "playable build, still growing"],
    ],
    note: "The game itself is in German.",
  },
};

export const gameMetadata = (lang: Lang): Metadata => ({ title: COPY[lang].metaTitle, description: COPY[lang].metaDesc });

export default function GameView({ lang }: { lang: Lang }) {
  const t = COPY[lang];
  return (
    <>
      <section className="mx-auto grid max-w-[1400px] items-center gap-10 px-4 pb-14 pt-10 sm:px-8 md:pt-14 lg:grid-cols-12">
        <div className="lg:col-span-5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={GAME.logo} alt={`${GAME.title}: ${GAME.subtitle}`} width={480} height={320} className="anim-rise w-full max-w-[420px]" fetchPriority="high" />
          <p className="anim-rise mt-6 text-2xl font-bold leading-snug tracking-tight sm:text-3xl" style={{ animationDelay: "100ms" }}>{t.claim}</p>
          <p className="anim-rise mt-4 max-w-[40ch] text-lg text-fg-muted" style={{ animationDelay: "160ms" }}>
            {t.intro} {t.note && <span className="font-semibold text-fg">{t.note}</span>}
          </p>
          <div className="anim-rise mt-8 flex flex-wrap items-center gap-x-8 gap-y-4" style={{ animationDelay: "220ms" }}>
            <a href={GAME.playUrl} target="_blank" rel="noopener" className="sticker sticker-hover inline-flex items-center gap-2 bg-vinyl px-7 py-3.5 text-lg font-bold text-ink">
              {t.play} <ArrowUpRight className="size-5" />
            </a>
            <a href={GAME.landingUrl} target="_blank" rel="noopener" className="group inline-flex items-center gap-2 border-b-2 border-fg pb-1 font-semibold">
              {t.more} <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
            </a>
          </div>
        </div>
        <Reveal className="lg:col-span-7">
          <a href={GAME.playUrl} target="_blank" rel="noopener" className="group block overflow-hidden border-2 border-fg shadow-[8px_8px_0_var(--color-fg)]" aria-label={t.startAria}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={GAME.stills.home} alt={t.heroAlt} width={1440} height={1000} className="w-full transition-transform duration-[1200ms] group-hover:scale-[1.02]" />
          </a>
          <p className="mt-3 text-sm text-fg-muted">{t.heroCap}</p>
        </Reveal>
      </section>

      <section className="border-y-2 border-fg bg-surface">
        <div className="mx-auto max-w-[1400px] px-4 py-20 sm:px-8">
          <Reveal>
            <h2 className="type-condensed text-[clamp(3.5rem,8vw,6.5rem)]">{t.loopTitle}</h2>
          </Reveal>
          <div className="mt-10 grid gap-x-10 md:grid-cols-2">
            {t.loop.map((l, i) => (
              <Reveal key={l.title} delay={(i % 2) * 80}>
                <div className="border-t-2 border-fg py-6">
                  <h3 className="text-2xl font-bold tracking-tight">{l.title}</h3>
                  <p className="mt-2 max-w-[52ch] text-lg text-fg-muted">{l.text}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-[1400px] gap-8 px-4 py-20 sm:px-8 md:grid-cols-2">
        {[GAME.stills.otto, GAME.stills.fritte].map((src, i) => (
          <Reveal key={src} delay={i * 100}>
            <figure>
              <div className="overflow-hidden border-2 border-fg">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={src} alt={t.stills[i].alt} width={1440} height={1000} loading="lazy" className="w-full" />
              </div>
              <figcaption className="mt-3 text-sm text-fg-muted">{t.stills[i].caption}</figcaption>
            </figure>
          </Reveal>
        ))}
      </section>

      <GameSoundtrack lang={lang} />

      <section className="mx-auto grid max-w-[1400px] gap-12 px-4 py-20 sm:px-8 lg:grid-cols-12">
        <Reveal className="lg:col-span-7">
          <div className="flex items-start gap-6">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={ALBUM.cover} alt={t.coverAlt} width={160} height={160} loading="lazy" className="size-28 shrink-0 border-2 border-fg object-cover sm:size-40" />
            <div>
              <p className="font-mono text-xs font-bold uppercase tracking-widest text-fg-muted">Im Spiel integriert</p>
              <h2 className="type-condensed text-4xl sm:text-5xl">{ALBUM.title}</h2>
              <p className="mt-2 text-lg leading-relaxed text-fg-muted">{t.soundtrackText}</p>
              <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2">
                {ALBUM.links.map((l) => (
                  <a key={l.name} href={l.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 border-b-2 border-fg pb-0.5 font-semibold hover:text-vinyl">
                    {l.name} <ArrowUpRight className="size-4" />
                  </a>
                ))}
              </div>
            </div>
          </div>
        </Reveal>
        <Reveal delay={100} className="lg:col-span-5">
          <dl className="border-t-[3px] border-fg">
            {t.facts.map(([k, v]) => (
              <div key={k} className="grid grid-cols-[7.5rem_1fr] gap-4 border-b border-fg/30 py-3">
                <dt className="font-bold">{k}</dt>
                <dd className="text-fg-muted">{v}</dd>
              </div>
            ))}
          </dl>
          <a href={GAME.playUrl} target="_blank" rel="noopener" className="sticker sticker-hover mt-8 inline-flex items-center gap-2 bg-fg px-7 py-3.5 text-lg font-bold text-page">
            {t.play} <ArrowUpRight className="size-5" />
          </a>
        </Reveal>
      </section>
    </>
  );
}
