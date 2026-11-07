import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, ArrowUpRight, Disc3 } from "lucide-react";
import type { Lang } from "@/lib/i18n";
import { localize } from "@/lib/i18n";
import { GAME } from "@/lib/data";
import Reveal from "@/components/site/Reveal";
import PageHead from "@/components/site/PageHead";
import { AlbumSection, TrackList, BeatLab, StreamingHub } from "@/components/disco/DiscoClient";
import { GemsCrate } from "@/components/disco/GemsCrate";
import { getGems } from "@/lib/content";

const COPY = {
  de: {
    metaTitle: "Musik, Beat Lab & Streams",
    metaDesc: "Die Tracks von DJ Noizy Neighbor zum Anhören, das MPC Beat Lab mit echten Stems und Loops, dazu YouTube, Spotify, Apple Music und Deezer.",
    title: "Musik",
    intro: "Oldschool-Beats aus Berlin, gebaut auf 16 Pads. Das Album läuft überall, wo es Musik gibt.",
    onSite: "Hier auf der Seite",
    onSiteIntro: "Drei Tracks für den Player unten. Der läuft weiter, egal wohin du klickst.",
    ostKicker: "Neu · Original Soundtrack",
    ostTitle: "Rare Groove Hustle",
    ostArtist: "Detektiv Funk Schnüffler und seine Tornados",
    ostText: "10 Instrumental-Tracks, 45 Minuten handgemachter Raw Funk und Soul ohne Samples. Das offizielle Album zum Point-and-Click-Adventure von und mit DJ Noizy Neighbor.",
    ostToGame: "Soundtrack & Trackliste ansehen",
    ostLanding: "Offizielle Soundtrack-Seite",
    gemsIntro: "Rare Japan-Pressungen, Kung-Fu-Soundtracks, Breaks, die im Netz nicht existieren. Aus diesen Kisten kommen die Samples, bevor sie auf den Pads landen.",
    lab: "Beat Lab",
    labIntro: "16 Pads, drei Bänke: Drums, echte Stems und Loops aus den Tracks, Vinyl-Effekte. Tasten 1-4, Q-R, A-F und Z-V spielen mit, der Cutoff-Regler zieht einen echten Lowpass.",
    streams: "Streams",
  },
  en: {
    metaTitle: "Music, Beat Lab & Streams",
    metaDesc: "Listen to DJ Noizy Neighbor's tracks, play the MPC Beat Lab with real stems and loops, and find him on YouTube, Spotify, Apple Music and Deezer.",
    title: "Music",
    intro: "Old-school beats from Berlin, built on 16 pads. The album plays wherever there is music.",
    onSite: "Right here",
    onSiteIntro: "Three tracks for the player below. It keeps playing wherever you click.",
    ostKicker: "New · Original Soundtrack",
    ostTitle: "Rare Groove Hustle",
    ostArtist: "Detektiv Funk Schnüffler und seine Tornados",
    ostText: "10 instrumental tracks, 45 minutes of handmade raw funk and soul without samples. The official soundtrack album to the point-and-click adventure starring DJ Noizy Neighbor.",
    ostToGame: "View Soundtrack & Tracklist",
    ostLanding: "Official Soundtrack Page",
    gemsIntro: "Rare Japanese pressings, kung fu soundtracks, breaks that don't exist online. This is where the samples come from before they hit the pads.",
    lab: "Beat Lab",
    labIntro: "16 pads, three banks: drums, real stems and loops from the tracks, vinyl effects. Keys 1-4, Q-R, A-F and Z-V play along, and the cutoff knob drives a real low-pass filter.",
    streams: "Streams",
  },
};

export const musicMetadata = (lang: Lang): Metadata => ({ title: COPY[lang].metaTitle, description: COPY[lang].metaDesc });

export default async function MusicView({ lang }: { lang: Lang }) {
  const t = COPY[lang];
  const gems = await getGems();
  return (
    <>
      <PageHead title={t.title} intro={t.intro} />

      <section className="mx-auto max-w-[1400px] px-4 pb-24 sm:px-8">
        <AlbumSection />
      </section>

      {/* Detektiv Funk Schnüffler: Original Soundtrack Feature */}
      <section className="border-y-2 border-fg bg-surface py-16 sm:py-20">
        <div className="mx-auto max-w-[1400px] px-4 sm:px-8">
          <div className="grid items-center gap-8 md:grid-cols-12">
            <Reveal className="md:col-span-4 lg:col-span-3">
              <Link
                href={localize("/spiel#soundtrack", lang)}
                className="group block overflow-hidden border-2 border-fg shadow-[6px_6px_0_var(--color-fg)] transition-transform hover:-translate-y-1"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={GAME.soundtrack.cover}
                  alt={t.ostTitle}
                  width={400}
                  height={400}
                  loading="lazy"
                  className="aspect-square w-full object-cover"
                />
              </Link>
            </Reveal>

            <Reveal delay={80} className="md:col-span-8 lg:col-span-9">
              <div className="flex flex-wrap items-center gap-3">
                <span className="font-mono text-xs font-bold uppercase tracking-widest text-vinyl border border-vinyl/40 bg-vinyl/10 px-2.5 py-0.5 rounded-xs">
                  {t.ostKicker}
                </span>
                <span className="font-mono text-xs text-fg-muted">10 Tracks · 45 Min. · Vinyl OST</span>
              </div>
              <h3 className="type-condensed mt-2 text-[clamp(2.5rem,5vw,4.5rem)] leading-none text-fg">
                {t.ostTitle}
              </h3>
              <p className="mt-1 text-xl font-bold tracking-tight text-vinyl sm:text-2xl">
                {t.ostArtist}
              </p>
              <p className="mt-4 max-w-2xl text-lg text-fg-muted leading-relaxed">
                {t.ostText}
              </p>
              <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-3">
                <Link
                  href={localize("/spiel#soundtrack", lang)}
                  className="sticker sticker-hover inline-flex items-center gap-2 bg-vinyl px-6 py-2.5 font-bold text-ink"
                >
                  <Disc3 className="size-4" /> {t.ostToGame}
                </Link>
                <a
                  href={GAME.soundtrackLandingUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group inline-flex items-center gap-1.5 border-b-2 border-fg pb-0.5 font-semibold hover:text-vinyl"
                >
                  {t.ostLanding} <ArrowUpRight className="size-4 transition-transform group-hover:translate-x-0.5" />
                </a>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1400px] px-4 pb-24 sm:px-8">
        <Reveal>
          <h2 className="type-condensed mb-3 text-[clamp(3rem,6vw,5rem)]">{t.onSite}</h2>
          <p className="mb-8 max-w-xl text-lg text-fg-muted">{t.onSiteIntro}</p>
        </Reveal>
        <TrackList />
      </section>

      <section id="gems" className="mx-auto max-w-[1400px] scroll-mt-24 px-4 pb-24 sm:px-8">
        <Reveal>
          <h2 className="type-condensed mb-3 text-[clamp(3.5rem,8vw,6.5rem)]">Diggin&apos; Gems</h2>
          <p className="mb-10 max-w-2xl text-lg text-fg-muted">{t.gemsIntro}</p>
        </Reveal>
        <GemsCrate gems={gems} />
      </section>

      <section className="border-y-2 border-fg bg-surface">
        <div className="mx-auto max-w-[1400px] px-4 py-20 sm:px-8">
          <Reveal>
            <div className="mb-10 max-w-2xl">
              <h2 className="type-condensed text-[clamp(3.5rem,8vw,6.5rem)]">{t.lab}</h2>
              <p className="mt-3 text-lg text-fg-muted">{t.labIntro}</p>
            </div>
          </Reveal>
          <BeatLab />
        </div>
      </section>

      <section className="mx-auto max-w-[1400px] px-4 py-24 sm:px-8">
        <Reveal>
          <h2 className="type-condensed mb-10 text-[clamp(3.5rem,8vw,6.5rem)]">{t.streams}</h2>
        </Reveal>
        <StreamingHub />
      </section>
    </>
  );
}
