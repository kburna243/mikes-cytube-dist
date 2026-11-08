import { useCallback, useEffect, useState } from 'react';
import type { PitchApi, PublicLinkPayload } from '../api/pitchApi';
import { PitchApiError } from '../api/pitchApi';
import { PITCH_PRODUCT_NAME, type PitchDemoState } from '../components/pitch-demo/types';
import { RecipientPitchView } from '../components/pitch-demo/RecipientPitchView';
import { Link } from '../router';

type PageState =
  | { kind: 'loading' }
  | { kind: 'ready'; payload: PublicLinkPayload }
  | { kind: 'not-found'; message: string }
  | { kind: 'error'; message: string };

/**
 * Öffentliche Empfängerseite unter /l/:token.
 * Funktioniert ohne Cookie und ohne Anmeldung — sie zeigt nur die Tracks
 * des einen Links. Bei ungültigem Token gibt es eine verständliche 404-Seite.
 */
export function RecipientLinkPage({ api, token }: { api: PitchApi; token: string }) {
  const [page, setPage] = useState<PageState>({ kind: 'loading' });

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
          message:
            error instanceof Error
              ? error.message
              : 'Die Seite konnte nicht geladen werden.',
        });
      }
    }
  }, [api, token]);

  useEffect(() => {
    void load();
  }, [load]);

  if (page.kind === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-stone-100 px-4">
        <p role="status" className="rounded-lg border-2 border-stone-300 bg-white p-6 text-base font-semibold text-stone-800">
          Die Musikauswahl wird geladen …
        </p>
      </div>
    );
  }

  if (page.kind === 'not-found') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-stone-100 px-4 py-10">
        <div className="max-w-md space-y-4 rounded-lg border-2 border-stone-900 bg-white p-6">
          <p className="text-sm font-bold uppercase tracking-wider text-stone-600">
            Fehler 404
          </p>
          <h1 className="text-2xl font-bold text-stone-950">Diesen Link gibt es nicht mehr</h1>
          <p className="text-base text-stone-700">{page.message}</p>
          <p className="text-sm text-stone-600">
            Sie sehen hier absichtlich keine Beispielinhalte: Es werden nur die Tracks eines
            gültigen Links gezeigt, niemals etwas anderes.
          </p>
        </div>
      </div>
    );
  }

  if (page.kind === 'error') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-stone-100 px-4">
        <div className="max-w-md space-y-4 rounded-lg border-2 border-red-700 bg-white p-6">
          <h1 className="text-xl font-bold text-stone-950">Die Seite lässt sich nicht laden</h1>
          <p role="alert" className="text-sm font-semibold text-red-900">
            {page.message}
          </p>
          <button
            type="button"
            onClick={() => void load()}
            className="min-h-[48px] rounded border-2 border-stone-950 bg-stone-950 px-6 py-2.5 text-base font-bold text-white hover:bg-stone-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stone-950"
          >
            Erneut versuchen
          </button>
        </div>
      </div>
    );
  }

  const payload = page.payload;
  const viewState: PitchDemoState = {
    composerName: payload.composerName,
    studioLabel: payload.studioLabel,
    tracks: payload.tracks,
    rightsFiles: payload.rightsFiles,
    pitchLinks: [payload.link],
    inquiries: [],
  };

  return (
    <div className="min-h-screen overflow-x-hidden bg-stone-100 text-stone-900 font-sans">
      {/* Schmale Kopfzeile, klar als Demo gekennzeichnet */}
      <div className="border-b border-stone-300 bg-white px-3 py-2 sm:px-6">
        <p className="mx-auto max-w-3xl text-xs text-stone-600">
          Eine Musikauswahl über {PITCH_PRODUCT_NAME} · Demo mit Fantasiedaten
        </p>
      </div>

      <main className="mx-auto max-w-4xl px-3 py-6 sm:px-6">
        <RecipientPitchView
          state={viewState}
          activeLink={payload.link}
          audioAvailability={payload.audioAvailability}
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
      </main>

      <footer className="border-t border-stone-300 bg-white px-3 py-4 sm:px-6">
        <p className="mx-auto max-w-3xl text-xs text-stone-600">
          Demo mit Fantasiedaten — alle Angaben zu den Stücken sind Eigenangaben, ungeprüft.{' '}
          <Link to="/" className="font-semibold underline hover:text-stone-950">
            Mehr über {PITCH_PRODUCT_NAME}
          </Link>
        </p>
      </footer>
    </div>
  );
}
