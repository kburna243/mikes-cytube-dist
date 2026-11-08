import { useEffect, useRef } from 'react';
import type { ArtistLayoutId } from '../shared/limits';
import type { LayoutContent } from './types';
import { brandValuesToStyle } from './types';
import type { BrandPackageValues } from '../shared/brand';
import { PlakatLayout } from './layouts/PlakatLayout';
import { ArchivLayout } from './layouts/ArchivLayout';
import { AtelierLayout } from './layouts/AtelierLayout';
import { LeinwandLayout } from './layouts/LeinwandLayout';
import { RasterLayout } from './layouts/RasterLayout';
import { loadArtistFonts } from './fonts';
import { useAudio } from '../audio/AudioProvider';

/**
 * Verbindet die drei Ebenen einer Künstlerseite:
 * Markenpaket (Werte als CSS-Variablen) × Gestalt (Komposition) × Inhalt.
 */
export function renderArtistLayout(
  layoutId: ArtistLayoutId,
  content: LayoutContent
): React.ReactNode {
  switch (layoutId) {
    case 'plakat':
      return <PlakatLayout content={content} />;
    case 'archiv':
      return <ArchivLayout content={content} />;
    case 'atelier':
      return <AtelierLayout content={content} />;
    case 'leinwand':
      return <LeinwandLayout content={content} />;
    case 'raster':
      return <RasterLayout content={content} />;
  }
}

function AudioFallbackNotice() {
  const { unavailable } = useAudio();
  if (!unavailable) return null;
  return (
    <p className="artist-audio-fallback" role="status">
      Ton ist in diesem Browser nicht verfügbar. Die Seite bleibt vollständig lesbar und
      bedienbar; die Klangskizzen sind die einzige Funktion ohne Alternative.
    </p>
  );
}

interface ArtistSurfaceProps {
  brandValues: BrandPackageValues;
  layoutId: ArtistLayoutId;
  content: LayoutContent;
}

/**
 * Trägt die Markenwerte als CSS-Variablen auf eine Fläche auf und rendert die Gestalt.
 * Wird von der öffentlichen Künstlerseite und von der Vorschau in der App genutzt.
 */
export function ArtistSurface({ brandValues, layoutId, content }: ArtistSurfaceProps) {
  const surfaceRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const element = surfaceRef.current;
    if (!element) return undefined;
    if (!('IntersectionObserver' in window)) {
      void loadArtistFonts();
      return undefined;
    }
    const observer = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) {
        void loadArtistFonts();
        observer.disconnect();
      }
    }, { rootMargin: '240px' });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={surfaceRef}
      className="artist-surface"
      style={{
        ...brandValuesToStyle(brandValues),
        fontFamily: 'var(--font-family-body)',
        backgroundColor: 'var(--brand-background)',
        color: 'var(--brand-text)',
      }}
    >
      <AudioFallbackNotice />
      {renderArtistLayout(layoutId, { ...content, brandValues })}
    </div>
  );
}
