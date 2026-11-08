import { Link, useDocumentTitle } from '../router';
import { PRODUCT_NAME } from '../site/constants';
import { findArtistBySlug } from './artists';
import { ArtistSurface } from './ArtistPage';
import { ARTIST_LAYOUT_LABELS } from '../shared/limits';

/**
 * Öffentliche Künstlerseite unter /k/:slug.
 * Markenpaket (JSON-Werte) × Gestalt (Komposition) × Inhalt (Profil).
 */
export function ArtistPublicPage({ slug }: { slug: string }) {
  const artist = findArtistBySlug(slug);
  useDocumentTitle(artist ? `${artist.name} — Beispielseite (${PRODUCT_NAME})` : `Künstlerseite nicht gefunden — ${PRODUCT_NAME}`);

  if (!artist) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0C0E14] px-4 text-[#EEF0F6]">
        <div className="max-w-md space-y-4 rounded-xl border border-white/12 bg-[#12151E] p-6">
          <p className="text-sm font-bold uppercase tracking-widest text-[#9AA3B2]">Fehler 404</p>
          <h1 className="text-2xl font-bold">Diese Künstlerseite gibt es nicht</h1>
          <p className="text-base text-[#B8BFD0]">
            Es gibt drei fiktive Beispielseiten — verlinkt auf der Startseite.
          </p>
          <Link
            to="/"
            className="inline-flex min-h-[48px] items-center rounded-md border border-[#7C8CFF] bg-[#7C8CFF] px-6 py-2.5 text-base font-bold text-[#0C0E14] hover:bg-[#98A4FF] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#57E8C6]"
          >
            Zur Startseite
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Schmale Demo-Kennzeichnung oberhalb der Künstlerseite */}
      <div className="sticky top-0 z-50 border-b border-dashed border-slate-600 bg-slate-900 px-3 py-2 text-slate-100">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2 text-xs">
          <p>
            Fiktive Beispielseite ({ARTIST_LAYOUT_LABELS[artist.layoutId]}) — Demo von {PRODUCT_NAME}
          </p>
          <Link
            to="/"
            className="inline-flex min-h-[36px] items-center rounded border border-slate-600 bg-slate-800 px-3 py-1 font-semibold text-slate-100 hover:bg-slate-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-300"
          >
            Zur Übersicht
          </Link>
        </div>
      </div>

      <ArtistSurface
        brandValues={artist.brand.values}
        layoutId={artist.layoutId}
        content={{
          name: artist.name,
          tagline: artist.tagline,
          intro: artist.intro,
          roleLine: artist.roleLine,
          tracks: artist.tracks,
          featuredTrackId: artist.tracks[0]?.id ?? null,
        }}
      />
    </div>
  );
}
