"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Play } from "lucide-react";
import { gemBadge, gemStory, type Gem } from "@/lib/data";
import { withBase } from "@/lib/base";
import { localize } from "@/lib/i18n";
import { useLang } from "@/lib/useLang";
import { usePlayer } from "@/components/audio/AudioProvider";
import Reveal from "@/components/site/Reveal";

const COPY = {
  de: { play: "Clip abspielen", own: "Aus dem Studio", gemOfWeek: "Gem der Woche", toGems: "Alle Gems", teaser: "Platten, die sonst keiner hat. Direkt aus Noizys Kiste." },
  en: { play: "Play clip", own: "From the studio", gemOfWeek: "Gem of the week", toGems: "All gems", teaser: "Records nobody else has. Straight out of Noizy's crate." },
};

function GemCard({ g }: { g: Gem }) {
  const lang = useLang();
  const c = COPY[lang];
  const p = usePlayer();
  const [playing, setPlaying] = useState(false);
  const start = () => {
    if (p.playing) p.toggle(); // one sound at a time: the site player yields to the clip
    setPlaying(true);
  };
  return (
    <article className="flex h-full flex-col border-2 border-fg bg-page shadow-[6px_6px_0_var(--color-fg)]">
      <div className="relative aspect-square overflow-hidden border-b-2 border-fg bg-ink">
        {playing && g.video ? (
          <video src={withBase(g.video)} poster={withBase(g.img)} controls autoPlay playsInline className="size-full object-cover" />
        ) : (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={withBase(g.img)} alt={g.title} loading="lazy" className="size-full object-cover" />
            {g.video && (
              <button onClick={start} aria-label={`${g.title}: ${c.play}`} className="group absolute inset-0 grid place-items-center bg-ink/20 transition hover:bg-ink/40">
                <span className="grid size-16 place-items-center rounded-full bg-vinyl text-ink transition group-hover:scale-110">
                  <Play className="ml-1 size-7" />
                </span>
              </button>
            )}
          </>
        )}
        <span className="sticker-sm absolute left-3 top-3 bg-vinyl px-2 py-1 font-mono text-xs font-bold uppercase text-ink">{gemBadge(g, lang)}</span>
      </div>
      <div className="flex flex-1 flex-col p-5">
        <p className="font-mono text-xs uppercase text-fg-muted">
          {g.own ? c.own : [g.label, g.country].filter(Boolean).join(" · ")}
        </p>
        <h3 className="mt-1 text-2xl font-bold leading-tight tracking-tight">{g.title}</h3>
        {g.artist && <p className="text-fg-muted">{g.artist}</p>}
        <p className="mt-3 text-fg-muted">{gemStory(g, lang)}</p>
      </div>
    </article>
  );
}

/** Full crate for the music page. Gems come from the DB and are maintained in /admin. */
export function GemsCrate({ gems }: { gems: Gem[] }) {
  return (
    <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
      {gems.map((g, i) => (
        <Reveal key={g.id} delay={(i % 3) * 80}>
          <GemCard g={g} />
        </Reveal>
      ))}
    </div>
  );
}

/** Home teaser: the first gem in admin order is the gem of the week. */
export function GemOfTheWeek({ gem: g }: { gem: Gem }) {
  const lang = useLang();
  const c = COPY[lang];
  return (
    <section className="mx-auto max-w-[1400px] px-4 py-16 sm:px-8">
      <div className="grid items-center gap-10 md:grid-cols-12">
        <Reveal className="md:col-span-5">
          <GemCard g={g} />
        </Reveal>
        <Reveal delay={100} className="md:col-span-7">
          <p className="font-mono text-sm uppercase text-vinyl">{c.gemOfWeek}</p>
          <h2 className="type-condensed mt-2 text-[clamp(3.5rem,8vw,6.5rem)]">Diggin&apos; Gems</h2>
          <p className="mt-3 max-w-[40ch] text-lg text-fg-muted">{c.teaser}</p>
          <Link href={`${localize("/discography", lang)}#gems`} className="group mt-7 inline-flex items-center gap-2 border-b-2 border-fg pb-1 font-semibold">
            {c.toGems} <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </Reveal>
      </div>
    </section>
  );
}
