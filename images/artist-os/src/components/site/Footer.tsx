"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { BRAND, CONTACTS, SOCIALS } from "@/lib/data";
import LogoMark from "@/components/site/LogoMark";
import ConsentSettingsLink from "@/components/site/ConsentSettingsLink";
import { withBase } from "@/lib/base";
import { localize } from "@/lib/i18n";
import { useLang } from "@/lib/useLang";

const COPY = {
  de: {
    bio: `Crate-Digger, DJ und Produzent aus Berlin-Friedrichshain. ${BRAND.genres.join(", ")}.`,
    pages: "Seiten",
    links: [
      { href: "/discography", label: "Musik & Beat Lab" },
      { href: "/spiel", label: "Spiel: Funk Schnüffler" },
      { href: "/bookings", label: "Dates & Booking" },
      { href: "/about", label: "Über Noizy" },
      { href: "/shop", label: "Merch & Vinyl" },
      { href: "/socials", label: "Kontakt & EPK" },
    ],
    contact: "Kontakt",
    press: "Presse",
    mail: "Post",
    follow: "Folgen",
    imprint: "Impressum",
    privacy: "Datenschutz",
    madeBy: "Website von",
    madeByAria: "Website von Answer 42",
    analog: "Analog-Look:",
    grain: "Körnung",
    on: "an",
    off: "aus",
  },
  en: {
    bio: `Crate digger, DJ and producer from Berlin-Friedrichshain. ${BRAND.genres.join(", ")}.`,
    pages: "Pages",
    links: [
      { href: "/discography", label: "Music & Beat Lab" },
      { href: "/spiel", label: "Game: Funk Schnüffler" },
      { href: "/bookings", label: "Dates & Booking" },
      { href: "/about", label: "About Noizy" },
      { href: "/shop", label: "Merch & Vinyl" },
      { href: "/socials", label: "Contact & EPK" },
    ],
    contact: "Contact",
    press: "Press",
    mail: "Mail",
    follow: "Follow",
    imprint: "Legal notice (German)",
    privacy: "Privacy policy (German)",
    madeBy: "Website by",
    madeByAria: "Website by Answer 42",
    analog: "Analog look:",
    grain: "Grain",
    on: "on",
    off: "off",
  },
};

export default function Footer() {
  const lang = useLang();
  const t = COPY[lang];
  const [grain, setGrain] = useState(false);
  const [scan, setScan] = useState(false);

  useEffect(() => {
    try {
      const g = localStorage.getItem("fx-grain") === "1";
      const s = localStorage.getItem("fx-scan") === "1";
      setGrain(g);
      setScan(s);
      document.documentElement.classList.toggle("fx-grain", g);
      document.documentElement.classList.toggle("fx-scan", s);
    } catch {}
  }, []);

  const toggle = (key: "fx-grain" | "fx-scan", value: boolean, set: (v: boolean) => void) => {
    set(value);
    document.documentElement.classList.toggle(key, value);
    try { localStorage.setItem(key, value ? "1" : "0"); } catch {}
  };

  return (
    <footer className="mt-24 border-t-2 border-fg pb-32">
      <div className="mx-auto max-w-[1400px] px-4 sm:px-8">
        {/* sign-off: the logo taken apart, lettering left, sunset skyline standing on the rule */}
        <div className="grid items-end gap-8 pt-14 md:grid-cols-[1.15fr_1fr]">
          <LogoMark kind="wordmark" className="w-full max-w-[620px] -rotate-2 text-fg" />
          <div className="relative mx-auto w-full max-w-[520px] md:mr-0">
            <div className="absolute bottom-0 left-[6%] aspect-[2/1] w-[84%] overflow-hidden" aria-hidden>
              <div className="aspect-square w-full rounded-full bg-vinyl" />
            </div>
            <LogoMark kind="skyline" decorative className="relative w-full text-fg" />
          </div>
        </div>

        <div className="grid gap-10 border-t-[3px] border-fg pt-8 md:grid-cols-[1.3fr_1fr_1fr_1fr]">
          <div>
            <p className="max-w-xs text-[15px] leading-relaxed text-fg-muted">{t.bio}</p>
          </div>

          <div>
            <p className="font-mono text-xs font-bold text-fg">{t.pages}</p>
            <ul className="mt-3 space-y-1.5">
              {t.links.map((l) => (
                <li key={l.href}>
                  <Link href={localize(l.href, lang)} className="text-[15px] text-fg-muted underline-offset-4 transition hover:text-fg hover:underline">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="font-mono text-xs font-bold text-fg">{t.contact}</p>
            <ul className="mt-3 space-y-1.5 text-[15px]">
              <li><a className="text-fg-muted hover:text-fg hover:underline" href={`mailto:${CONTACTS.booking}`}>Booking: {CONTACTS.booking}</a></li>
              <li><a className="text-fg-muted hover:text-fg hover:underline" href={`mailto:${CONTACTS.press}`}>{t.press}: {CONTACTS.press}</a></li>
              <li><a className="text-fg-muted hover:text-fg hover:underline" href={`mailto:${CONTACTS.fan}`}>{t.mail}: {CONTACTS.fan}</a></li>
            </ul>
          </div>

          <div>
            <p className="font-mono text-xs font-bold text-fg">{t.follow}</p>
            <ul className="mt-3 space-y-1.5 text-[15px]">
              {SOCIALS.map((s) => (
                <li key={s.id}>
                  <a href={s.url} target="_blank" rel="noreferrer" className="text-fg-muted hover:text-fg hover:underline">{s.label}</a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-4 whitespace-nowrap border-t border-fg/25 pt-5 text-sm text-fg-muted xl:flex-row xl:items-center xl:justify-between">
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
            <p>© 2026 DJ Noizy Neighbor, Berlin</p>
            {/* legal pages exist in German only and live in the German tree: full page load */}
            <a href={withBase("/impressum")} hrefLang="de" className="underline-offset-4 hover:text-fg hover:underline">{t.imprint}</a>
            <a href={withBase("/datenschutz")} hrefLang="de" className="underline-offset-4 hover:text-fg hover:underline">{t.privacy}</a>
            <ConsentSettingsLink className="underline-offset-4 hover:text-fg hover:underline" />
          </div>
          <a
            href="https://servermitte.tailecbf0f.ts.net/dubs"
            target="_blank"
            rel="noopener"
            className="group inline-flex items-center gap-2 text-fg-muted transition hover:text-fg"
            aria-label={t.madeByAria}
          >
            <span>{t.madeBy}</span>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={withBase("/assets/branding/answer42-symbol.svg")} alt="" width={30} height={24} className="h-6 w-auto transition-transform group-hover:-rotate-6" />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={withBase("/assets/branding/answer42-wordmark.svg")} alt="Answer 42" width={92} height={22} className="h-[18px] w-auto" />
          </a>
          <div className="flex items-center gap-4">
            <span>{t.analog}</span>
            <button onClick={() => toggle("fx-grain", !grain, setGrain)} aria-pressed={grain} className={`underline-offset-4 hover:underline ${grain ? "font-semibold text-fg" : ""}`}>
              {t.grain} {grain ? t.on : t.off}
            </button>
            <button onClick={() => toggle("fx-scan", !scan, setScan)} aria-pressed={scan} className={`underline-offset-4 hover:underline ${scan ? "font-semibold text-fg" : ""}`}>
              Scanlines {scan ? t.on : t.off}
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}
