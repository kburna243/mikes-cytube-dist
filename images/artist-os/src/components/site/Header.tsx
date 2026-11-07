"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, Play, Pause } from "lucide-react";
import { usePlayer } from "@/components/audio/AudioProvider";
import LogoMark from "@/components/site/LogoMark";
import { localize, switchPath } from "@/lib/i18n";
import { withBase } from "@/lib/base";
import { useLang } from "@/lib/useLang";

const NAV = {
  de: [
    { href: "/discography", label: "Musik" },
    { href: "/spiel", label: "Spiel" },
    { href: "/bookings", label: "Dates & Booking" },
    { href: "/about", label: "Über" },
    { href: "/shop", label: "Shop" },
    { href: "/socials", label: "Kontakt & EPK" },
  ],
  en: [
    { href: "/discography", label: "Music" },
    { href: "/spiel", label: "Game" },
    { href: "/bookings", label: "Dates & Booking" },
    { href: "/about", label: "About" },
    { href: "/shop", label: "Shop" },
    { href: "/socials", label: "Contact & EPK" },
  ],
};

const UI = {
  de: { home: "DJ Noizy Neighbor, Startseite", start: "Start", playing: "Läuft", listen: "Anhören", menu: "Menü", main: "Hauptnavigation", mobile: "Mobile Navigation", lang: "Sprache" },
  en: { home: "DJ Noizy Neighbor, home", start: "Home", playing: "Playing", listen: "Listen", menu: "Menu", main: "Main navigation", mobile: "Mobile navigation", lang: "Language" },
};

function LangSwitch({ className = "" }: { className?: string }) {
  const pathname = usePathname() ?? "/";
  const lang = useLang();
  return (
    <div className={`flex items-center font-mono text-sm font-bold ${className}`} role="group" aria-label={UI[lang].lang}>
      {(["de", "en"] as const).map((l, i) => (
        <span key={l} className="flex items-center">
          {i > 0 && <span className="px-1 text-fg-muted" aria-hidden>/</span>}
          {/* plain <a>: each language tree has its own root layout, so a full load is required */}
          <a
            href={withBase(switchPath(pathname, l))}
            hrefLang={l}
            aria-current={l === lang ? "true" : undefined}
            className={l === lang ? "text-fg underline decoration-vinyl decoration-2 underline-offset-4" : "text-fg-muted hover:text-fg"}
          >
            {l.toUpperCase()}
          </a>
        </span>
      ))}
    </div>
  );
}

export default function Header() {
  const pathname = usePathname() ?? "/";
  const lang = useLang();
  const ui = UI[lang];
  const nav = NAV[lang];
  const [open, setOpen] = useState(false);
  const player = usePlayer();

  useEffect(() => setOpen(false), [pathname]);

  const isActive = (href: string) => {
    const target = localize(href, lang);
    return target === "/" || target === "/en" ? pathname === target : pathname.startsWith(target);
  };

  return (
    <header className="fixed inset-x-0 top-0 z-[85] border-b-2 border-fg bg-page/95 backdrop-blur-sm">
      <div className="mx-auto flex h-16 max-w-[1400px] items-center justify-between gap-6 px-4 sm:px-8">
        <Link href={localize("/", lang)} className="group -rotate-2 text-fg transition-colors hover:text-vinyl" aria-label={ui.home}>
          <LogoMark kind="wordmark" decorative className="h-12 w-auto transition-transform duration-300 group-hover:-rotate-2 group-hover:scale-105" />
        </Link>

        <nav className="hidden items-center gap-6 lg:flex xl:gap-7" aria-label={ui.main}>
          {nav.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={localize(item.href, lang)}
                aria-current={active ? "page" : undefined}
                className={`relative py-1 text-[15px] font-semibold tracking-tight transition-colors ${active ? "text-fg" : "text-fg-muted hover:text-fg"}`}
              >
                {item.label}
                <span className={`absolute inset-x-0 -bottom-0.5 h-[2px] origin-left bg-vinyl transition-transform duration-300 ${active ? "scale-x-100" : "scale-x-0"}`} />
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-3">
          <LangSwitch className="hidden sm:flex" />
          <button
            onClick={() => (player.started ? player.toggle() : player.play(0))}
            className="flex items-center gap-2 rounded-full border-2 border-fg bg-fg py-1.5 pl-2 pr-4 text-sm font-semibold text-page transition hover:bg-vinyl hover:text-ink active:scale-[0.98]"
          >
            <span className="grid size-6 place-items-center rounded-full bg-page text-fg">
              {player.playing ? <Pause className="size-3" /> : <Play className="ml-px size-3" />}
            </span>
            <span className="hidden sm:inline">{player.playing ? ui.playing : ui.listen}</span>
          </button>
          <button
            onClick={() => setOpen((v) => !v)}
            aria-label={ui.menu}
            aria-expanded={open}
            className="grid size-10 place-items-center rounded-full border-2 border-fg text-fg transition hover:bg-surface lg:hidden"
          >
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </div>

      <div className={`overflow-hidden bg-page transition-[max-height] duration-300 lg:hidden ${open ? "max-h-[520px] border-t-2 border-fg" : "max-h-0"}`}>
        <nav className="flex flex-col px-4 py-2" aria-label={ui.mobile}>
          {[{ href: "/", label: ui.start }, ...nav].map((item) => (
            <Link
              key={item.href}
              href={localize(item.href, lang)}
              className={`type-condensed border-b border-fg/20 py-3 text-4xl last:border-0 ${isActive(item.href) ? "text-vinyl" : "text-fg"}`}
            >
              {item.label}
            </Link>
          ))}
          <LangSwitch className="py-4 text-base sm:hidden" />
        </nav>
      </div>
    </header>
  );
}
