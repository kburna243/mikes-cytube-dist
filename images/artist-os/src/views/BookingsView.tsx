import type { Metadata } from "next";
import { ArrowUpRight, FileDown } from "lucide-react";
import { getGigs } from "@/lib/content";
import { PHOTOS, fmtDate, gigNote, type Gig } from "@/lib/data";
import { withBase } from "@/lib/base";
import type { Lang } from "@/lib/i18n";
import Reveal from "@/components/site/Reveal";
import PageHead from "@/components/site/PageHead";
import BookingForm from "@/components/forms/BookingForm";


const COPY = {
  de: {
    metaTitle: "Dates & Booking",
    metaDesc: "Die nächsten Termine von DJ Noizy Neighbor, das Booking-Formular für Veranstalter sowie Technical und Hospitality Rider als PDF.",
    title: <>Dates &amp;<br />Booking</>,
    intro: "Clubnächte, Festivals, Vinyl-only Sessions. Für Veranstalter liegen Formular, Rider und Pressekit gleich hier.",
    photoAlt: "Vor dem Club in der Nacht",
    cta: "Booking anfragen",
    soldOut: "Ausverkauft",
    tickets: "Tickets",
    confirmed: "Bestätigt",
    recent: "Zuletzt",
    formTitle: "Anfrage",
    formIntro: "Antwort meist innerhalb von 48 Stunden, mit Verfügbarkeit, Gage und Reiseplanung.",
    tech: [
      { t: "DJ-Setup", d: "Ich spiele auf zwei Technics-Turntables und meinem Vestax PMC-06 Pro Battle-Mixer, Abnahme über Booth-XLR." },
      { t: "Monitoring", d: "2 Booth-Monitore auf Ohrhöhe, mindestens 200 W, Mono-Schalter." },
      { t: "Signalweg", d: "Mixer-Master in Club-Limiter in PA. Kein Digitalmixer nötig, Phono-Pegel beachten." },
      { t: "Booth", d: "Stabiler Tisch 120 x 60 cm, vibrationsarm, ohne direkten Kontakt zum Floor." },
    ],
    hosp: [
      { t: "Backstage", d: "Club-Mate, Wasser still und sprudelnd, gern ein paar Ingwer-Shots." },
      { t: "Hotel", d: "Bei Übernachtung: nah am Venue ist wichtiger als Sterne, Late Checkout." },
      { t: "Reise", d: "Bahn oder Economy+. Die Platten reisen immer im Handgepäck." },
    ],
  },
  en: {
    metaTitle: "Dates & Booking",
    metaDesc: "Upcoming dates for DJ Noizy Neighbor, the booking form for promoters, and the technical and hospitality riders as PDF.",
    title: <>Dates &amp;<br />Booking</>,
    intro: "Club nights, festivals, vinyl-only sessions. Promoters will find the form, riders and press kit right here.",
    photoAlt: "Outside the club at night",
    cta: "Booking request",
    soldOut: "Sold out",
    tickets: "Tickets",
    confirmed: "Confirmed",
    recent: "Recently",
    formTitle: "Request",
    formIntro: "We usually reply within 48 hours with availability, fee and travel plans.",
    tech: [
      { t: "DJ setup", d: "I play two Technics turntables and my Vestax PMC-06 Pro battle mixer, output via booth XLR." },
      { t: "Monitoring", d: "2 booth monitors at ear height, at least 200 W, mono switch." },
      { t: "Signal path", d: "Mixer master into club limiter into PA. No digital mixer needed, mind the phono level." },
      { t: "Booth", d: "Sturdy table 120 x 60 cm, low vibration, no direct contact with the floor." },
    ],
    hosp: [
      { t: "Backstage", d: "Club-Mate, still and sparkling water, a few ginger shots are welcome." },
      { t: "Hotel", d: "For overnight stays: close to the venue beats stars, late checkout." },
      { t: "Travel", d: "Train or economy plus. The records always travel as hand luggage." },
    ],
  },
};

export const bookingsMetadata = (lang: Lang): Metadata => ({ title: COPY[lang].metaTitle, description: COPY[lang].metaDesc });

export default async function BookingsView({ lang }: { lang: Lang }) {
  const t = COPY[lang];
  const gigs = await getGigs();
  const upcoming = gigs.filter((g) => g.date >= "2026-01-01").sort((a, b) => a.date.localeCompare(b.date));
  const past = gigs.filter((g) => g.date < "2026-01-01").sort((a, b) => b.date.localeCompare(a.date));

  return (
    <>
      <PageHead title={t.title} intro={t.intro} photo={PHOTOS.clubEntrance} photoAlt={t.photoAlt}>
        <a href="#booking-form" className="sticker sticker-hover inline-flex items-center gap-2 bg-vinyl px-6 py-3 font-bold text-ink">
          {t.cta}
        </a>
      </PageHead>

      <section className="mx-auto max-w-[1400px] px-4 sm:px-8">
        <ul className="border-t-[3px] border-fg">
          {upcoming.map((g, i) => {
            const d = fmtDate(g.date, lang);
            const sold = g.status === "SOLD OUT";
            return (
              <Reveal key={g.id} delay={i * 50}>
                <li className="grid grid-cols-[4.5rem_1fr] items-center gap-x-6 gap-y-3 border-b border-fg/30 py-6 sm:grid-cols-[7rem_1fr_auto]">
                  <span className="row-span-2 flex flex-col sm:row-span-1">
                    <span className="type-condensed text-6xl sm:text-8xl">{d.day}</span>
                    <span className="font-mono text-sm font-bold">{d.month.slice(0, 3)} {d.year}</span>
                  </span>
                  <span className={sold ? "text-fg-muted" : ""}>
                    <span className={`block text-2xl font-bold tracking-tight sm:text-4xl ${sold ? "line-through decoration-2" : ""}`}>{g.venue}</span>
                    <span className="block text-lg text-fg-muted">{g.city}, {gigNote(g, lang)}</span>
                  </span>
                  <span className="col-start-2 sm:col-start-auto">
                    {sold ? (
                      <span className="font-mono">{t.soldOut}</span>
                    ) : g.status === "TICKETS" ? (
                      <a href="#booking-form" className="inline-flex items-center gap-1 border-b-2 border-vinyl pb-0.5 text-lg font-semibold hover:text-vinyl">
                        {t.tickets} <ArrowUpRight className="size-5" />
                      </a>
                    ) : (
                      <span className="font-mono text-fg-muted">{t.confirmed}</span>
                    )}
                  </span>
                </li>
              </Reveal>
            );
          })}
        </ul>

        {past.length > 0 && (
          <Reveal delay={80}>
            <div className="mt-10 grid gap-2 sm:grid-cols-[7rem_1fr] sm:gap-6">
              <p className="font-mono text-sm font-bold">{t.recent}</p>
              <ul className="space-y-1 text-fg-muted">
                {past.map((g) => (
                  <li key={g.id}>{fmtDate(g.date, lang).full}: {g.venue}, {g.city}</li>
                ))}
              </ul>
            </div>
          </Reveal>
        )}
      </section>

      <section id="booking-form" className="mt-24 scroll-mt-24 border-y-2 border-fg bg-surface">
        <div className="mx-auto grid max-w-[1400px] gap-10 px-4 py-20 sm:px-8 lg:grid-cols-12">
          <Reveal className="lg:col-span-4">
            <h2 className="type-condensed text-[clamp(3.5rem,7vw,6rem)]">{t.formTitle}</h2>
            <p className="mt-4 text-lg text-fg-muted">{t.formIntro}</p>
          </Reveal>
          <Reveal delay={100} className="lg:col-span-8">
            <BookingForm />
          </Reveal>
        </div>
      </section>

      <section className="mx-auto grid max-w-[1400px] gap-14 px-4 py-24 sm:px-8 lg:grid-cols-2">
        {[
          { title: "Technical Rider", rows: t.tech, href: "/api/rider?type=technical" },
          { title: "Hospitality Rider", rows: t.hosp, href: "/api/rider?type=hospitality" },
        ].map((r, i) => (
          <Reveal key={r.title} delay={i * 100}>
            <article>
              <div className="flex flex-wrap items-end justify-between gap-4 border-b-[3px] border-fg pb-4">
                <h3 className="type-condensed text-5xl sm:text-6xl">{r.title}</h3>
                <a href={withBase(r.href)} className="inline-flex items-center gap-2 border-b-2 border-fg pb-0.5 font-semibold hover:text-vinyl">
                  <FileDown className="size-5" /> PDF
                </a>
              </div>
              <dl>
                {r.rows.map((row) => (
                  <div key={row.t} className="grid gap-1 border-b border-fg/30 py-4 sm:grid-cols-[9rem_1fr] sm:gap-6">
                    <dt className="font-bold">{row.t}</dt>
                    <dd className="text-fg-muted">{row.d}</dd>
                  </div>
                ))}
              </dl>
            </article>
          </Reveal>
        ))}
      </section>
    </>
  );
}
