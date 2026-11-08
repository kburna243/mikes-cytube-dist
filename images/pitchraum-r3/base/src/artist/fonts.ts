/**
 * Schriften der Künstlerseiten werden erst geladen, wenn eine Gestalt
 * tatsächlich sichtbar wird. So startet die Website ohne fünf zusätzliche
 * Schriftfamilien. Alle Dateien liegen lokal (OFL-1.1).
 */
let loading: Promise<unknown> | null = null;

export function loadArtistFonts(): Promise<unknown> {
  if (!loading) {
    loading = Promise.all([
      import('@fontsource/fraunces/latin-400.css'),
      import('@fontsource/fraunces/latin-700.css'),
      import('@fontsource/playfair-display/latin-400.css'),
      import('@fontsource/playfair-display/latin-700.css'),
      import('@fontsource/dm-sans/latin-400.css'),
      import('@fontsource/dm-sans/latin-700.css'),
      import('@fontsource/work-sans/latin-400.css'),
      import('@fontsource/work-sans/latin-600.css'),
      import('@fontsource/bebas-neue/latin-400.css'),
      import('@fontsource/archivo/latin-400.css'),
      import('@fontsource/archivo/latin-800.css'),
    ]).catch(() => undefined);
  }
  return loading;
}
