import type { Metadata } from "next";
import { ArrowUpRight, FileDown } from "lucide-react";
import { SOCIALS, CONTACTS, PHOTOS, BRAND } from "@/lib/data";
import { withBase } from "@/lib/base";
import type { Lang } from "@/lib/i18n";
import Reveal from "@/components/site/Reveal";
import PageHead from "@/components/site/PageHead";

const COPY = {
  de: {
    metaTitle: "Kontakt & Pressekit",
    metaDesc: "Kontakt zu DJ Noizy Neighbor für Booking, Presse und Post, alle Social-Media-Kanäle und das Pressekit (EPK) zum Download.",
    title: "Kontakt",
    intro: "Schreib einfach. Die Antwort kommt meist zwischen zwei Plattenkisten.",
    photoAlt: "Gespräch im Backstage",
    rows: [
      { label: "Booking & Management", note: "Clubs, Festivals, Markenformate" },
      { label: "Presse & Interviews", note: "Pressekit, Fotos, Interviewanfragen" },
      { label: "Post & Grüße", note: "Plattentipps immer willkommen" },
    ],
    mgmt: "Vertretung",
    epk: "Pressekit",
    epkText: "Ein ZIP mit allen neun Pressefotos in voller Auflösung, Logo, Brandboard und Fact-Sheet mit Bio und Kontakt.",
    epkCta: "Pressekit laden (ZIP)",
    logoOnly: "Nur das Logo",
    pressAlt: "Pressefoto",
    follow: "Folgen",
  },
  en: {
    metaTitle: "Contact & Press Kit",
    metaDesc: "Contact DJ Noizy Neighbor for booking, press and fan mail, find all social channels and download the press kit (EPK).",
    title: "Contact",
    intro: "Just drop a line. The reply usually comes between two crates of records.",
    photoAlt: "Talking backstage",
    rows: [
      { label: "Booking & management", note: "Clubs, festivals, brand formats" },
      { label: "Press & interviews", note: "Press kit, photos, interview requests" },
      { label: "Fan mail", note: "Record tips always welcome" },
    ],
    mgmt: "Represented by",
    epk: "Press kit",
    epkText: "One ZIP with all nine press photos in full resolution, the logo, the brand board and a fact sheet with bio and contacts.",
    epkCta: "Download press kit (ZIP)",
    logoOnly: "Logo only",
    pressAlt: "Press photo",
    follow: "Follow",
  },
};

const MAILS = [CONTACTS.booking, CONTACTS.press, CONTACTS.fan];
const PRESS = [PHOTOS.liveDj, PHOTOS.portrait, PHOTOS.crateDigging, PHOTOS.berlinNight];

export const contactMetadata = (lang: Lang): Metadata => ({ title: COPY[lang].metaTitle, description: COPY[lang].metaDesc });

export default function ContactView({ lang }: { lang: Lang }) {
  const t = COPY[lang];
  return (
    <>
      <PageHead title={t.title} intro={t.intro} photo={PHOTOS.greenroom} photoAlt={t.photoAlt} tone="is-olive" />

      <section className="mx-auto max-w-[1400px] px-4 sm:px-8">
        <ul className="border-t-[3px] border-fg">
          {t.rows.map((c, i) => (
            <Reveal key={MAILS[i]} delay={i * 70}>
              <li className="border-b border-fg/30">
                <a href={`mailto:${MAILS[i]}`} className="group grid gap-2 py-7 md:grid-cols-12 md:items-baseline md:gap-8">
                  <span className="md:col-span-4">
                    <span className="block text-xl font-bold">{c.label}</span>
                    <span className="block text-fg-muted">{c.note}</span>
                  </span>
                  <span className="break-all text-2xl font-bold tracking-tight underline-offset-8 group-hover:text-vinyl group-hover:underline sm:text-4xl md:col-span-8">
                    {MAILS[i]}
                  </span>
                </a>
              </li>
            </Reveal>
          ))}
        </ul>
        <p className="mt-5 text-fg-muted">{t.mgmt}: {CONTACTS.mgmt}</p>
      </section>

      <section className="mt-24 border-y-2 border-fg bg-sunburst text-ink">
        <div className="mx-auto grid max-w-[1400px] items-center gap-12 px-4 py-20 sm:px-8 lg:grid-cols-12">
          <Reveal className="lg:col-span-6">
            <h2 className="type-condensed text-[clamp(3.5rem,8vw,7rem)]">{t.epk}</h2>
            <p className="mt-4 max-w-lg text-lg leading-relaxed">{t.epkText}</p>
            <div className="mt-8 flex flex-wrap items-center gap-x-8 gap-y-4">
              <a href={withBase("/api/epk")} download className="inline-flex items-center gap-2 rounded-[4px] border-2 border-ink bg-ink px-6 py-3 font-bold text-paper shadow-[4px_4px_0_var(--color-ink)] transition hover:-translate-x-0.5 hover:-translate-y-0.5">
                <FileDown className="size-5" /> {t.epkCta}
              </a>
              <a href={BRAND.logo} download className="inline-flex items-center gap-2 border-b-2 border-ink pb-0.5 font-semibold">
                {t.logoOnly}
              </a>
            </div>
          </Reveal>
          <Reveal delay={100} className="lg:col-span-6">
            <div className="grid grid-cols-2 gap-4">
              {PRESS.map((src, i) => (
                <div key={src} className={`overflow-hidden border-2 border-ink ${i % 2 ? "translate-y-6" : ""}`}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={src} alt={t.pressAlt} loading="lazy" className="aspect-[3/4] w-full object-cover" />
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      <section className="mx-auto max-w-[1400px] px-4 py-24 sm:px-8">
        <Reveal>
          <h2 className="type-condensed mb-10 text-[clamp(3.5rem,8vw,6.5rem)]">{t.follow}</h2>
        </Reveal>
        <ul className="grid border-t-[3px] border-fg sm:grid-cols-2 sm:gap-x-10">
          {SOCIALS.map((s, i) => (
            <Reveal key={s.id} delay={(i % 2) * 70}>
              <li className="border-b border-fg/30">
                <a href={s.url} target="_blank" rel="noopener noreferrer" className="group flex items-center gap-4 py-6">
                  <span className="min-w-0 flex-1">
                    <span className="block text-2xl font-bold tracking-tight group-hover:text-vinyl">{s.label}</span>
                    <span className="block font-mono text-sm text-fg-muted">{s.handle}</span>
                    <span className="mt-1 block text-fg-muted">{lang === "en" ? s.blurbEn : s.blurb}</span>
                  </span>
                  <ArrowUpRight className="size-6 shrink-0 transition-transform group-hover:-translate-y-1 group-hover:translate-x-1" />
                </a>
              </li>
            </Reveal>
          ))}
        </ul>
      </section>
    </>
  );
}
