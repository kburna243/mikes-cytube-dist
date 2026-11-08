/**
 * Render-Smoke-Tests (ReactDOMServer, keine Mocks der Serverlogik).
 * Sie stellen sicher, dass Website, alle fünf Künstlerseiten und der
 * Vorführraum ohne Client-Effekte fehlerfrei aufgebaut werden können.
 */
import { describe, expect, it } from 'vitest';
import { renderToString } from 'react-dom/server';
import { AudioProvider } from '../src/audio/AudioProvider';
import { HomePage } from '../src/site/HomePage';
import { HowItWorksPage } from '../src/site/HowItWorksPage';
import { ArtistPublicPage } from '../src/artist/ArtistPublicPage';
import { ARTIST_PROFILES } from '../src/artist/artists';
import { RecipientPitchView } from '../src/components/pitch-demo/RecipientPitchView';
import type { PitchApi, PublicLinkPayload } from '../src/api/pitchApi';
import { createInitialFictionalState } from '../src/shared/fictionalData';

const fakeApi = {
  createWorkspace: async () => {
    throw new Error('nicht Teil dieses Tests');
  },
} as unknown as PitchApi;

function render(ui: React.ReactNode): string {
  return renderToString(<AudioProvider>{ui}</AudioProvider>);
}

describe('Render-Smoke', () => {
  it('Startseite enthält die Montage und ehrliche Demo-Hinweise', () => {
    const html = render(<HomePage api={fakeApi} />);
    expect(html).toContain('Dasselbe');
    expect(html).toContain('Filme');
    expect(html).toContain('Klangskizze, im Browser erzeugt');
    expect(html).toContain('Eigenangabe, ungeprüft');
    expect(html).toContain('Demo ausprobieren');
    expect(html).toContain('Noch in Entwicklung');
    const ablauf = render(<HowItWorksPage api={fakeApi} />);
    expect(ablauf).toContain('Was es nicht tut');
  });

  it('alle fünf Künstlerseiten rendern ihre jeweilige Gestalt', () => {
    for (const artist of ARTIST_PROFILES) {
      const html = render(<ArtistPublicPage slug={artist.slug} />);
      expect(html).toContain(artist.name);
      expect(html).toContain('Fiktive Beispielseite');
      expect(html).toContain('Klangskizze');
    }
    expect(ARTIST_PROFILES.length).toBe(5);
    expect(new Set(ARTIST_PROFILES.map((artist) => artist.layoutId)).size).toBe(5);
  });

  it('Vorführraum zeigt Infoblatt, aber keine internen Aktenfelder', () => {
    const state = createInitialFictionalState();
    const link = state.pitchLinks[0];
    const payload: PublicLinkPayload = {
      composerName: state.composerName,
      studioLabel: state.studioLabel,
      link,
      tracks: state.tracks.filter((track) => link.trackIds.includes(track.id)),
      rightsFiles: {
        'trk-101': {
          rightsStatus: 'Eigenangabe, ungeprüft',
          splits: [{ personName: 'Lukas Mertens (Fiktiv)', role: 'Komposition', sharePercent: 100 }],
        },
      },
      audioAvailability: {},
    };
    const html = render(
      <RecipientPitchView
        tracks={payload.tracks}
        link={payload.link}
        composerName={payload.composerName}
        studioLabel={payload.studioLabel}
        rights={payload.rightsFiles}
        onPlayTrack={async () => undefined}
        onSubmitInquiry={async () => undefined}
      />
    );
    expect(html).toContain('Klangskizze, im Browser erzeugt');
    expect(html).toContain('Infoblatt');
    expect(html).toContain('Eigenangabe, ungeprüft');
    expect(html).not.toContain('eigenangabe-studio-nordbruecke-2026.pdf');
    expect(html).not.toContain('intern');
  });
});
