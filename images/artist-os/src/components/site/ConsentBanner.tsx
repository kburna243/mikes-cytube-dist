"use client";

import { useEffect, useState } from "react";
import { withBase } from "@/lib/base";
import { useLang } from "@/lib/useLang";
import { OPEN_EVENT, readConsent, saveConsent } from "./consent";

const COPY = {
  de: {
    title: "Kurz zu Cookies",
    text: "Wir tracken nichts. Gespeichert wird nur das Nötigste, damit die Seite funktioniert. Eingebettete Player von YouTube, SoundCloud oder Spotify laden erst, wenn du sie erlaubst. Mehr dazu im",
    privacy: "Datenschutz",
    necessary: "Notwendig",
    necessaryText: ": deine Auswahl hier und der Analog-Look-Schalter. Immer aktiv.",
    media: "Externe Medien",
    mediaText: ": eingebettete Player, die Daten an den Anbieter senden.",
    all: "Alle erlauben",
    save: "Auswahl speichern",
    only: "Nur notwendige",
  },
  en: {
    title: "About cookies",
    text: "We don't track you. We only store what the site needs to work. Embedded players from YouTube, SoundCloud or Spotify only load once you allow them. Details in the",
    privacy: "privacy policy (German)",
    necessary: "Necessary",
    necessaryText: ": your choice here and the analog-look switch. Always on.",
    media: "External media",
    mediaText: ": embedded players that send data to their provider.",
    all: "Allow all",
    save: "Save selection",
    only: "Necessary only",
  },
};

/** Cookie notice: necessary storage is always on, external media is opt-in. Sits above the player bar. */
export default function ConsentBanner() {
  const t = COPY[useLang()];
  const [open, setOpen] = useState(false);
  const [media, setMedia] = useState(false);

  useEffect(() => {
    const c = readConsent();
    setMedia(c.media);
    if (!c.decided) setOpen(true);
    const reopen = () => { setMedia(readConsent().media); setOpen(true); };
    window.addEventListener(OPEN_EVENT, reopen);
    return () => window.removeEventListener(OPEN_EVENT, reopen);
  }, []);

  if (!open) return null;

  const decide = (m: boolean) => { saveConsent(m); setMedia(m); setOpen(false); };

  return (
    <div role="dialog" aria-modal="false" aria-labelledby="consent-title" className="fixed inset-x-3 bottom-[76px] z-[86] sm:inset-x-auto sm:left-6 sm:max-w-md">
      <div className="cassette bg-page p-5 sm:p-6">
        <p id="consent-title" className="text-lg font-bold">{t.title}</p>
        <p className="mt-2 text-[15px] leading-relaxed text-fg-muted">
          {t.text} <a href={withBase("/datenschutz")} hrefLang="de" className="underline underline-offset-4">{t.privacy}</a>.
        </p>

        <label className="mt-4 flex cursor-pointer items-start gap-3 text-[15px]">
          <input type="checkbox" checked disabled className="mt-1 size-4 accent-[var(--color-fg)]" />
          <span><span className="font-semibold">{t.necessary}</span>{t.necessaryText}</span>
        </label>
        <label className="mt-2 flex cursor-pointer items-start gap-3 text-[15px]">
          <input type="checkbox" checked={media} onChange={(e) => setMedia(e.target.checked)} className="mt-1 size-4 accent-[var(--color-vinyl)]" />
          <span><span className="font-semibold">{t.media}</span>{t.mediaText}</span>
        </label>

        <div className="mt-5 flex flex-wrap gap-3">
          <button onClick={() => decide(true)} className="sticker sticker-hover bg-fg px-5 py-2.5 font-bold text-page">{t.all}</button>
          <button onClick={() => decide(media)} className="sticker sticker-hover bg-page px-5 py-2.5 font-bold text-fg">{t.save}</button>
          <button onClick={() => decide(false)} className="px-2 py-2.5 font-semibold underline underline-offset-4">{t.only}</button>
        </div>
      </div>
    </div>
  );
}
