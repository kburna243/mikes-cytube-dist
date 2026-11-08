import { useCallback, useEffect, useState } from 'react';
import type { PitchApi, WorkspaceSnapshot } from '../api/pitchApi';
import { PitchApiError } from '../api/pitchApi';
import { PITCH_PRODUCT_NAME } from '../components/pitch-demo/types';
import { PitchRoomDemo } from '../components/pitch-demo/PitchRoomDemo';
import { Link } from '../router';

type BootState =
  | { kind: 'loading' }
  | { kind: 'ready'; snapshot: WorkspaceSnapshot }
  | { kind: 'no-workspace' }
  | { kind: 'error'; message: string };

/**
 * Hülle der verdrahteten App: holt den Arbeitsbereich über das Cookie.
 * Gibt es keinen, gibt es den ehrlichen Startbildschirm — keine Fantasiedaten ohne Server.
 */
export function DemoApp({ api }: { api: PitchApi }) {
  const [boot, setBoot] = useState<BootState>({ kind: 'loading' });
  const [starting, setStarting] = useState(false);
  const [startError, setStartError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setBoot({ kind: 'loading' });
    try {
      const snapshot = await api.getSnapshot();
      setBoot({ kind: 'ready', snapshot });
    } catch (error) {
      if (error instanceof PitchApiError && error.status === 401) {
        setBoot({ kind: 'no-workspace' });
      } else {
        setBoot({
          kind: 'error',
          message:
            error instanceof Error
              ? error.message
              : 'Die Demo konnte nicht geladen werden.',
        });
      }
    }
  }, [api]);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleStartDemo() {
    setStarting(true);
    setStartError(null);
    try {
      const snapshot = await api.createWorkspace();
      setBoot({ kind: 'ready', snapshot });
    } catch (error) {
      setStartError(
        error instanceof Error
          ? error.message
          : 'Die Demo konnte nicht gestartet werden. Bitte versuche es erneut.'
      );
    } finally {
      setStarting(false);
    }
  }

  if (boot.kind === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-stone-100 px-4">
        <p role="status" className="rounded-lg border-2 border-stone-300 bg-white p-6 text-base font-semibold text-stone-800">
          Die Demo wird geladen …
        </p>
      </div>
    );
  }

  if (boot.kind === 'error') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-stone-100 px-4">
        <div className="max-w-md space-y-4 rounded-lg border-2 border-red-700 bg-white p-6">
          <h1 className="text-xl font-bold text-stone-950">Die Demo lässt sich nicht laden</h1>
          <p role="alert" className="text-sm font-semibold text-red-900">
            {boot.message}
          </p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={() => void load()}
              className="min-h-[48px] rounded border-2 border-stone-950 bg-stone-950 px-6 py-2.5 text-base font-bold text-white hover:bg-stone-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stone-950"
            >
              Erneut versuchen
            </button>
            <Link
              to="/"
              className="flex min-h-[48px] items-center justify-center rounded border-2 border-stone-400 bg-white px-5 py-2.5 text-base font-semibold text-stone-900 hover:bg-stone-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stone-950"
            >
              Zurück zur Startseite
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (boot.kind === 'no-workspace') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-stone-100 px-4">
        <div className="max-w-md space-y-4 rounded-lg border-2 border-stone-900 bg-white p-6">
          <p className="inline-block rounded bg-amber-300 px-2 py-0.5 text-xs font-semibold text-slate-950">
            Demo mit Fantasiedaten
          </p>
          <h1 className="text-2xl font-bold text-stone-950">{PITCH_PRODUCT_NAME}-Demo starten</h1>
          <p className="text-base text-stone-700">
            In diesem Browser gibt es noch keinen Demo-Arbeitsbereich — oder deiner wurde nach
            24 Stunden gelöscht. Starte neu, ohne Anmeldung und ohne Angabe deiner Daten.
          </p>
          {startError && (
            <p role="alert" className="rounded border-2 border-red-700 bg-red-50 p-3 text-sm font-semibold text-red-900">
              {startError}
            </p>
          )}
          <button
            type="button"
            onClick={() => void handleStartDemo()}
            disabled={starting}
            className="min-h-[48px] w-full rounded border-2 border-stone-950 bg-stone-950 px-6 py-3 text-base font-bold text-white hover:bg-stone-800 disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stone-950"
          >
            {starting ? 'Demo wird gestartet …' : 'Demo starten'}
          </button>
          <p className="text-xs text-stone-600">
            Deine Eingaben werden nach 24 Stunden gelöscht.
          </p>
        </div>
      </div>
    );
  }

  return <PitchRoomDemo api={api} initialSnapshot={boot.snapshot} />;
}
