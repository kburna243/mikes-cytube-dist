import { useEffect } from 'react';
import { Link, useDocumentTitle } from '../router';
import { PRODUCT_NAME } from '../site/constants';
import { findArtistBySlug, ARTIST_PROFILES } from './artists';
import { ArtistSurface } from './ArtistPage';
import { ARTIST_LAYOUT_LABELS } from '../shared/limits';
import { loadArtistFonts } from './fonts';

/**
 * Öffentliche Künstlerseite unter /k/:slug.
 * Markenpaket (JSON) × Gestalt (eigene Komposition) × Inhalt (Profil).
 */
export function ArtistPublicPage({ slug }: { slug: string }) {
  const artist = findArtistBySlug(slug);
  useEffect(() => {
    void loadArtistFonts();
  }, []);
  useDocumentTitle(
    artist
      ? `${artist.name} — fiktive Beispielseite (${PRODUCT_NAME})`
      : `Künstlerseite nicht gefunden — ${PRODUCT_NAME}`
  );

  if (!artist) {
    return (
      <div className="artist-404">
        <div className="shell">
          <p className="mono">Fehler 404 · Künstlerseite</p>
          <h1 className="display">Diese Seite hängt<br />nicht im Katalog.</h1>
          <p className="lede">
            Es gibt fünf fiktive Beispielseiten. Sie sind auf der Startseite und in der Demo unter
            „Fünf Gesichter“ verlinkt.
          </p>
          <Link to="/" className="btn btn--accent" style={{ marginTop: '1.5rem' }}>
            Zur Startseite
          </Link>
        </div>
      </div>
    );
  }

  const others = ARTIST_PROFILES.filter((entry) => entry.slug !== artist.slug);

  return (
    <div className="artist-page">
      <div className="artist-demo-strip">
        <span>
          Fiktive Beispielseite · Gestalt {ARTIST_LAYOUT_LABELS[artist.layoutId]} · Markenpaket{' '}
          {artist.brand.name}
        </span>
        <span>
          Demo mit Fantasiedaten ·{' '}
          <Link to="/">Zurück zu {PRODUCT_NAME}</Link>
        </span>
      </div>

      <main>
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
      </main>

      <nav className="artist-other" aria-label="Weitere Beispielseiten">
        <p className="mono">Weitere Gesichter</p>
        <div>
          {others.map((entry) => (
            <Link key={entry.slug} to={`/k/${entry.slug}`}>
              <span>{entry.name}</span>
              <span className="mono">{ARTIST_LAYOUT_LABELS[entry.layoutId]}</span>
            </Link>
          ))}
        </div>
        <p className="artist-other__note mono">
          Klangskizzen im Browser erzeugt · Alle Namen und Werke erfunden
        </p>
      </nav>
    </div>
  );
}
