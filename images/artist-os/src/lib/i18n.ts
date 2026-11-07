/**
 * Two languages: German at the root, English under /en. Route slugs stay the same in both trees,
 * except the game page (/spiel <-> /en/game). Impressum and Datenschutz exist in German only.
 */
export type Lang = "de" | "en";

export const pick = <T,>(lang: Lang, v: { de: T; en: T }): T => v[lang];

const DE_ONLY = ["/impressum", "/datenschutz"];

/** German route -> route in `lang` (pass German hrefs, e.g. "/bookings", "/spiel", "/"). */
export function localize(href: string, lang: Lang): string {
  if (lang === "de" || DE_ONLY.some((p) => href.startsWith(p)) || /^(https?:|mailto:|#)/.test(href)) return href;
  if (href === "/") return "/en";
  if (href.startsWith("/spiel")) return "/en/game" + href.slice("/spiel".length);
  return "/en" + href;
}

/** Current pathname -> the same page in the other language. */
export function switchPath(pathname: string, to: Lang): string {
  const isEn = pathname === "/en" || pathname.startsWith("/en/");
  const dePath = isEn ? (pathname.replace(/^\/en/, "").replace(/^\/game/, "/spiel") || "/") : pathname;
  return localize(dePath, to);
}

export const langFromPath = (pathname: string): Lang => (pathname === "/en" || pathname.startsWith("/en/") ? "en" : "de");
