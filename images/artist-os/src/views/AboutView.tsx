import type { Metadata } from "next";
import { PHOTOS, GEAR } from "@/lib/data";
import type { Lang } from "@/lib/i18n";
import Reveal from "@/components/site/Reveal";
import PageHead from "@/components/site/PageHead";
import SectionDivider from "@/components/site/SectionDivider";

const COPY = {
  de: {
    metaTitle: "Über Noizy",
    metaDesc: "Von den Plattenläden in Friedrichshain und Mitte in die Clubs: die Geschichte von DJ Noizy Neighbor, sein Crate-Digging und das analoge Studio-Rig.",
    title: <>Über<br />Noizy</>,
    intro: "Seine ersten Beats baute er Anfang der 2000er auf einer MPC 2000XL. Nach über 13 Jahren Pause ist er zurück an den 16 Pads, mit einer Plattensammlung aus mehr als 20 Jahren.",
    photoAlt: "Noizy Neighbor an der MPC im Studio",
    facts: [
      { value: "2000er", label: "erste Beats auf der MPC 2000XL" },
      { value: "20+", label: "Jahre Plattensammlung" },
      { value: "12+1", label: "Beats auf „Back on 16 pads“" },
    ],
    manifest: [
      { title: "Die Kiste ist die Quelle", text: "Gesampelt wird nur aus der eigenen Sammlung, über 20 Jahre zusammengetragen und mit Sorgfalt ausgewählt. Jeder Loop ist auch ein Dank an die Künstler hinter den oft vergessenen Platten." },
      { title: "Analog klingt nach Entscheidung", text: "Er mischt und mastert selbst, über analoge Hardware und eine alte Master-Bandmaschine. Das Knistern der Platten bleibt drin, gerade die Imperfektion macht den Charakter. Keep it raw and real." },
      { title: "Berlin spielt mit", text: "Nachts über die Warschauer Brücke, Späti-Neon, der Fernsehturm über allem. Die Stadt liefert die Breaks, ich setze sie nur zusammen." },
    ],
    archive: "Aus dem Archiv",
    reportage: [
      ["Kistenzeit im Plattenladen", "Donnerstag, Mitte"],
      ["MPC-Session", "Studio, Friedrichshain"],
      ["Hinter den Plattentellern", "Clubnacht, Friedrichshain"],
      ["Heimweg mit Plattentasche", "U-Bahnhof, 3:40 Uhr"],
      ["Backstage", "Kurz vor dem Set"],
      ["Kisten-Check", "Open Air, Nachmittag"],
      ["Vor dem Club", "Friedrichshain, nachts"],
      ["Die Auswahl für heute", "Flightcase, Backstage"],
    ],
    rig: "Das Rig",
    rigIntro: "Dasselbe Setup steht im Studio und im Club.",
  },
  en: {
    metaTitle: "About Noizy",
    metaDesc: "From record shops in Friedrichshain and Mitte into the clubs: the story of DJ Noizy Neighbor, his crate digging and the analog studio rig.",
    title: <>About<br />Noizy</>,
    intro: "He built his first beats in the early 2000s on an MPC 2000XL. After more than 13 years away he is back on the 16 pads, with a record collection built over more than 20 years.",
    photoAlt: "Noizy Neighbor at the MPC in the studio",
    facts: [
      { value: "2000s", label: "first beats on an MPC 2000XL" },
      { value: "20+", label: "years of record collecting" },
      { value: "12+1", label: "beats on “Back on 16 pads”" },
    ],
    manifest: [
      { title: "The crate is the source", text: "Samples come only from his own collection, built over 20 years and picked with care. Every loop is also a thank-you to the artists behind those often forgotten records." },
      { title: "Analog sounds like a decision", text: "He mixes and masters himself, through analog hardware and a vintage master tape machine. The vinyl crackle stays in, the imperfection is the character. Keep it raw and real." },
      { title: "Berlin plays along", text: "Crossing the Warschauer Brücke at night, late-shop neon, the TV tower above it all. The city delivers the breaks, I just put them together." },
    ],
    archive: "From the archive",
    reportage: [
      ["Crate time at the record shop", "Thursday, Mitte"],
      ["MPC session", "Studio, Friedrichshain"],
      ["Behind the turntables", "Club night, Friedrichshain"],
      ["Heading home with the record bag", "Subway station, 3:40 am"],
      ["Backstage", "Right before the set"],
      ["Crate check", "Open air, afternoon"],
      ["Outside the club", "Friedrichshain, at night"],
      ["Tonight's selection", "Flight case, backstage"],
    ],
    rig: "The rig",
    rigIntro: "The same setup in the studio and in the club.",
  },
};

const REPORTAGE_SRC = [
  PHOTOS.crateDigging, PHOTOS.studioMpc, PHOTOS.liveDj, PHOTOS.berlinNight,
  PHOTOS.greenroom, PHOTOS.outdoorCrate, PHOTOS.clubEntrance, PHOTOS.vinylSelection,
];

export const aboutMetadata = (lang: Lang): Metadata => ({ title: COPY[lang].metaTitle, description: COPY[lang].metaDesc });

export default function AboutView({ lang }: { lang: Lang }) {
  const t = COPY[lang];
  return (
    <>
      <PageHead title={t.title} intro={t.intro} photo={PHOTOS.studioMpc} photoAlt={t.photoAlt} />

      <section className="border-y-2 border-fg">
        <dl className="mx-auto grid max-w-[1400px] px-4 sm:grid-cols-3 sm:px-8">
          {t.facts.map((f, i) => (
            <Reveal key={f.value} delay={i * 80}>
              <div className={`py-8 sm:px-6 ${i > 0 ? "border-t border-fg/30 sm:border-l sm:border-t-0" : "sm:pl-0"}`}>
                <dt className="type-condensed text-7xl text-vinyl sm:text-8xl">{f.value}</dt>
                <dd className="mt-2 text-lg">{f.label}</dd>
              </div>
            </Reveal>
          ))}
        </dl>
      </section>

      <section className="mx-auto max-w-[1400px] px-4 py-20 sm:px-8 md:py-28">
        {t.manifest.map((m, i) => (
          <Reveal key={m.title} delay={i * 60}>
            <article className="grid gap-4 border-b border-fg/30 py-10 first:pt-0 md:grid-cols-12 md:gap-8">
              <h2 className="text-3xl font-bold leading-tight tracking-tight md:col-span-5 sm:text-4xl">{m.title}</h2>
              <p className="max-w-[60ch] text-lg leading-relaxed text-fg-muted md:col-span-7 md:pt-1">{m.text}</p>
            </article>
          </Reveal>
        ))}
      </section>

      <section className="mx-auto max-w-[1400px] px-4 sm:px-8">
        <Reveal>
          <h2 className="type-condensed text-[clamp(3.5rem,8vw,6.5rem)]">{t.archive}</h2>
        </Reveal>
        <div className="mt-10 columns-1 gap-6 sm:columns-2 lg:columns-3">
          {REPORTAGE_SRC.map((src, i) => (
            <Reveal key={src} delay={(i % 3) * 80} className="mb-8 break-inside-avoid">
              <figure className="group">
                <div className="overflow-hidden border-2 border-fg">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={src} alt={t.reportage[i][0]} loading="lazy" className="w-full object-cover transition-transform duration-[1200ms] group-hover:scale-[1.03]" />
                </div>
                <figcaption className="mt-3 flex items-baseline justify-between gap-4">
                  <span className="font-bold">{t.reportage[i][0]}</span>
                  <span className="shrink-0 text-sm text-fg-muted">{t.reportage[i][1]}</span>
                </figcaption>
              </figure>
            </Reveal>
          ))}
        </div>
      </section>

      <SectionDivider />

      <section className="mx-auto max-w-[1400px] px-4 pb-8 sm:px-8">
        <Reveal>
          <h2 className="type-condensed text-[clamp(3.5rem,8vw,6.5rem)]">{t.rig}</h2>
          <p className="mt-3 max-w-xl text-lg text-fg-muted">{t.rigIntro}</p>
        </Reveal>
        <div className="mt-10 grid gap-x-10 gap-y-0 md:grid-cols-2">
          {GEAR.map((g, i) => (
            <Reveal key={g.name} delay={(i % 2) * 80}>
              <div className="grid grid-cols-[3.5rem_1fr] gap-4 border-t-2 border-fg py-6">
                <span className="type-condensed text-5xl text-vinyl">{g.qty.replace("×", "x")}</span>
                <div>
                  <p className="text-xl font-bold leading-tight">{g.name}</p>
                  <p className="mt-1 font-mono text-sm text-fg-muted">{g.role}</p>
                  <p className="mt-2 text-fg-muted">{g.spec.replaceAll(" · ", ", ")}</p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </section>
    </>
  );
}
