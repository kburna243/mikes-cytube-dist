import type { ArtistLayoutId } from '../shared/limits';
import type { LayoutContent } from './types';
import { brandValuesToStyle } from './types';
import type { BrandPackageValues } from '../shared/brand';
import { PlakatLayout } from './layouts/PlakatLayout';
import { ArchivLayout } from './layouts/ArchivLayout';
import { AtelierLayout } from './layouts/AtelierLayout';
import { LeinwandLayout } from './layouts/LeinwandLayout';
import { RasterLayout } from './layouts/RasterLayout';

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
  return (
    <div
      style={{
        ...brandValuesToStyle(brandValues),
        fontFamily: 'var(--font-family-body)',
        backgroundColor: 'var(--brand-background)',
        color: 'var(--brand-text)',
      }}
    >
      {renderArtistLayout(layoutId, content)}
    </div>
  );
}
