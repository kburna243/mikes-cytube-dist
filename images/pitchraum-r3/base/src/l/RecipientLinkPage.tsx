import { useCallback, useEffect, useState } from 'react';
import type { PitchApi, PublicLinkPayload } from '../api/pitchApi';
import { PitchApiError } from '../api/pitchApi';
import { PITCH_PRODUCT_NAME } from '../components/pitch-demo/types';
import { RecipientPitchView } from '../components/pitch-demo/RecipientPitchView';
import { Link } from '../router';
import { useAudio } from '../audio/AudioProvider';
import { sketchForTrack } from '../audio/AudioProvider';

type PageState =
  | { kind: 'loading' }
  | { kind: 'ready'; payload: PublicLinkPayload }
  | { kind: 'not-found'; message: string }
  | { kind: 'error'; message: string };

/**
 * Öffentlicher Vorführraum unter /l/:token.
 * Funktioniert ohne Cookie in jedem Browser und zeigt nur die Tracks
 * dieses einen Links. Ungültige Tokens sehen niemals Beispieldaten.
 */
export function RecipientLinkPage({ api, token }: { api: PitchApi; token: string }) {
  const [page, setPage] = useState<PageState>({ kind: 'loading' });
  const { meta } = useAudio();

  const load = useCallback(async () => {
    setPage({ kind: 'loading' });
    try {
      const payload = await api.getPublicLink(token);
      setPage({ kind: 'ready', payload });
    } catch (error) {
      if (error instanceof PitchApiError && error.status === 404) {
        setPage({ kind: 'not-found', message: error.message });
      } else {
        setPage({
          kind: 'error',
          message: error instanceof Error ? error.message : 'Der Vorführraum lässt sich nicht öffnen.',
        });
      }
    }
  }, [api, token]);

  useEffect(() => {
    void load();
  }, [load]);

  const accent =
    page.kind === 'ready' && page.payload.tracks[0]
      ? sketchForTrack(page.payload.tracks[0]).accent
      : meta.accent;

  return (
    <div className="vorfuehr-shell" style={{ ['--accent' as string]: accent }}>
      <div className="vorfuehr-shell__strip">
        <Link to="/" className="mono">
          {PITCH_PRODUCT_NAME} <span aria-hidden="true">↗</span>
        </Link>
        <span className="mono">Vorführraum · Demo mit Fantasiedaten</span>
        <span className="mono">Kein Konto nötig</span>
      </div>

      <main>
      {page.kind === 'loading' && (
        <div className="vorfuehr-state" role="status">
          <p className="mono">Vorführraum</p>
          <h1 className="display">Die Szene<br />wird geladen.</h1>
          <p className="vorfuehr-state__note">
            Einen Moment. Bild, Ton und Auswahl kommen gemeinsam.
          </p>
          <div className="vorfuehr-state__bar" aria-hidden="true"><span /></div>
        </div>
      )}

      {page.kind === 'not-found' && (
        <div className="vorfuehr-state">
          <p className="mono">Fehler 404 · Vorführraum</p>
          <h1 className="display">Diesen Link<br />gibt es nicht mehr.</h1>
          <p className="vorfuehr-state__note">{page.message}</p>
          <p className="vorfuehr-state__note">
            Hier werden absichtlich keine Beispieltracks gezeigt. Demo-Links verlieren nach 24
            Stunden ihre Gültigkeit.
          </p>
          <Link to="/" className="btn btn--accent">Zur Startseite</Link>
        </div>
      )}

      {page.kind === 'error' && (
        <div className="vorfuehr-state">
          <p className="mono">Störung</p>
          <h1 className="display">Der Vorführraum<br />steht still.</h1>
          <p role="alert" className="vorfuehr-state__note">{page.message}</p>
          <button type="button" className="btn btn--accent" onClick={() => void load()}>
            Erneut versuchen
          </button>
        </div>
      )}

      {page.kind === 'ready' && (
        <RecipientPitchView
          tracks={page.payload.tracks}
          link={page.payload.link}
          composerName={page.payload.composerName}
          studioLabel={page.payload.studioLabel}
          rights={page.payload.rightsFiles}
          audioAvailability={page.payload.audioAvailability}
          audioSrcFor={(trackId) => api.audioSrcFor(token, trackId)}
          onPlayTrack={async (_linkId, trackId) => {
            const updated = await api.markLinkListened(token, trackId);
            setPage({ kind: 'ready', payload: updated });
          }}
          onSubmitInquiry={async (input) => {
            await api.createPublicInquiry(token, {
              trackId: input.trackId,
              recipientName: input.recipientName,
              productionTitle: input.productionTitle,
              usageScope: input.usageScope,
              message: input.message,
            });
          }}
        />
      )}
      </main>
    </div>
  );
}
