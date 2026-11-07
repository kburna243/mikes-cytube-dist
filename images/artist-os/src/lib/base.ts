/**
 * The site can run under a sub-path (e.g. /noizy behind Caddy). next/link and the router get the
 * prefix from `basePath`; plain <img src>, CSS url(), <audio>, fetch() and <a href> to API routes
 * do not, so they go through withBase().
 */
export const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

export const withBase = (p: string) => (p.startsWith("/") && !p.startsWith("//") ? `${BASE_PATH}${p}` : p);
