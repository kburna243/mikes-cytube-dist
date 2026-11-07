"use client";

import { useEffect, useState } from "react";

/**
 * Consent store. "necessary" is always on (consent choice, analog-look toggle).
 * "media" gates future third-party embeds (YouTube, SoundCloud, Spotify players):
 * wrap any embed in `useConsent().media ? <iframe…/> : <placeholder/>`.
 */
export type Consent = { media: boolean; decided: boolean };

const KEY = "noizy-consent-v1";
const EVENT = "noizy-consent";
export const OPEN_EVENT = "noizy-consent-open";

export function readConsent(): Consent {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return { ...(JSON.parse(raw) as { media: boolean }), decided: true };
  } catch {}
  return { media: false, decided: false };
}

export function saveConsent(media: boolean) {
  try { localStorage.setItem(KEY, JSON.stringify({ media, at: new Date().toISOString() })); } catch {}
  window.dispatchEvent(new Event(EVENT));
}

export function openConsentSettings() {
  window.dispatchEvent(new Event(OPEN_EVENT));
}

export function useConsent(): Consent {
  const [c, setC] = useState<Consent>({ media: false, decided: true });
  useEffect(() => {
    const sync = () => setC(readConsent());
    sync();
    window.addEventListener(EVENT, sync);
    return () => window.removeEventListener(EVENT, sync);
  }, []);
  return c;
}
