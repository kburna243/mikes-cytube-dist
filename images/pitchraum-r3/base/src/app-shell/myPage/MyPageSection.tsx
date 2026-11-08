import { useMemo, useState } from 'react';
import type { PitchTrack } from '../../components/pitch-demo/types';
import type { MyPageSettings } from '../../shared/brand';
import { findMatchingCuratedPackage } from '../../shared/brand';
import { ARTIST_LAYOUT_LABELS } from '../../shared/limits';
import type { ShowcaseTrack } from '../../artist/types';
import { ArtistSurface } from '../../artist/ArtistPage';
import { MyPageWizard } from './MyPageWizard';

interface MyPageSectionProps {
  tracks: PitchTrack[];
  composerName: string;
  myPage: MyPageSettings | null;
  busy: boolean;
  onSave: (settings: MyPageSettings) => Promise<void>;
}

function tracksToShowcase(tracks: PitchTrack[]): ShowcaseTrack[] {
  return tracks.map((t, index) => ({
    id: t.id,
    catalogNo: `WK-${String(index + 1).padStart(2, '0')}`,
    title: t.title,
    durationFormatted: t.durationFormatted,
    bpm: t.bpm,
    genre: t.genre,
    mood: t.mood,
    instrumentation: t.instrumentation,
    description: t.description,
    musicalKey: t.musicalKey,
  }));
}

/**
 * Bereich „Meine Seite“ in der App: kurzer Wizard statt freiem Editor.
 * Nach dem Speichern kann die Seite im Vollbild angesehen werden („Seite zeigen“).
 */
export function MyPageSection({ tracks, composerName, myPage, busy, onSave }: MyPageSectionProps) {
  const [wizardOpen, setWizardOpen] = useState(false);
  const [fullViewOpen, setFullViewOpen] = useState(false);

  const showcaseTracks = useMemo(() => tracksToShowcase(tracks), [tracks]);

  const viewContent = myPage
    ? {
        name: myPage.artistName,
        tagline:
          myPage.tagline || 'Musik für Film und Fernsehen — direkt von mir.',
        intro:
          myPage.intro ||
          `Hallo, ich bin ${myPage.artistName}. Ich schreibe und produziere Musik für Bilder — von leisen Flächen bis zu treibenden Motiven.`,
        roleLine: 'Komposition & Produktion',
        tracks: showcaseTracks,
        featuredTrackId: myPage.featuredTrackId,
      }
    : null;

  if (wizardOpen) {
    return (
      <MyPageWizard
        tracks={tracks}
        composerName={composerName}
        initial={myPage}
        busy={busy}
        onCancel={() => setWizardOpen(false)}
        onSave={async (settings) => {
          await onSave(settings);
          setWizardOpen(false);
        }}
      />
    );
  }

  return (
    <section aria-labelledby="meine-seite-heading" className="space-y-6">
      <div>
        <h1 id="meine-seite-heading" className="text-2xl font-bold text-stone-950">
          Meine Seite
        </h1>
        <p className="mt-1 text-base text-stone-700">
          Stelle dir eine schlichte öffentliche Seite mit deiner Musik zusammen — ohne Editor,
          nur mit drei kurzen Entscheidungen.
        </p>
      </div>

      {!myPage ? (
        <div className="rounded-lg border-2 border-stone-900 bg-white p-5 sm:p-6 space-y-4">
          <p className="text-base text-stone-800">
            Du hast noch keine Seite angelegt. Wir fragen dich kurz, wie sie sich anfühlen soll,
            und machen dir einen Vorschlag, den du nachjustieren kannst.
          </p>
          <button
            type="button"
            onClick={() => setWizardOpen(true)}
            className="min-h-[48px] w-full rounded border-2 border-stone-950 bg-stone-950 px-6 py-3 text-base font-bold text-white hover:bg-stone-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stone-950 sm:w-auto"
          >
            Seite zusammenstellen
          </button>
        </div>
      ) : (
        <div className="rounded-lg border-2 border-stone-900 bg-white p-5 sm:p-6 space-y-5">
          <dl className="space-y-2 text-sm text-stone-800">
            <div>
              <dt className="inline font-semibold">Name auf der Seite: </dt>
              <dd className="inline">{myPage.artistName}</dd>
            </div>
            <div>
              <dt className="inline font-semibold">Gestalt: </dt>
              <dd className="inline">
                {ARTIST_LAYOUT_LABELS[myPage.layoutId]}
              </dd>
            </div>
            <div>
              <dt className="inline font-semibold">Farben & Schriften: </dt>
              <dd className="inline">
                {findMatchingCuratedPackage(myPage.brand) || 'Eigene Auswahl'}
              </dd>
            </div>
          </dl>

          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={() => setFullViewOpen(true)}
              className="min-h-[48px] rounded border-2 border-stone-950 bg-stone-950 px-6 py-3 text-base font-bold text-white hover:bg-stone-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stone-950"
            >
              Seite zeigen
            </button>
            <button
              type="button"
              onClick={() => setWizardOpen(true)}
              className="min-h-[48px] rounded border-2 border-stone-400 bg-white px-5 py-3 text-base font-semibold text-stone-900 hover:bg-stone-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stone-950"
            >
              Gestalt und Farben ändern
            </button>
          </div>

          <p className="text-xs text-stone-600">
            Hinweis: In dieser Demo ist deine Seite nur hier in der App sichtbar — es gibt noch
            keine öffentliche Adresse dafür.
          </p>
        </div>
      )}

      {/* Vollbild-Ansicht der eigenen Seite */}
      {fullViewOpen && myPage && viewContent && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Vollbild-Ansicht deiner Seite"
          className="fixed inset-0 z-[60] overflow-y-auto bg-stone-950"
        >
          <div className="sticky top-0 z-10 flex items-center justify-between gap-2 border-b border-stone-700 bg-stone-950 px-3 py-2 sm:px-6">
            <p className="text-sm font-semibold text-stone-200">
              So sieht deine Seite aus (Vorschau in der Demo)
            </p>
            <button
              type="button"
              onClick={() => setFullViewOpen(false)}
              className="min-h-[44px] rounded border-2 border-stone-400 bg-stone-900 px-4 py-2 text-sm font-bold text-white hover:bg-stone-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-300"
            >
              Schließen
            </button>
          </div>
          <ArtistSurface
            brandValues={myPage.brand}
            layoutId={myPage.layoutId}
            content={viewContent}
          />
        </div>
      )}
    </section>
  );
}
