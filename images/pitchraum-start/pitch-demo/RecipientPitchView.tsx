import React, { useMemo, useState } from 'react';
import {
  RIGHTS_STATUS_LABEL,
  type PitchDemoState,
  type PitchLinkRecord,
  type PitchTrack,
} from './types';

interface RecipientPitchViewProps {
  state: PitchDemoState;
  activeLink: PitchLinkRecord | null;
  onPlayTrack: (linkId: string, trackId: string) => void;
  onSubmitInquiry: (input: {
    pitchLinkId: string;
    trackId: string;
    recipientName: string;
    productionTitle: string;
    usageScope: string;
    message: string;
  }) => void;
}

export function RecipientPitchView({
  state,
  activeLink,
  onPlayTrack,
  onSubmitInquiry,
}: RecipientPitchViewProps) {
  const [playingTrackId, setPlayingTrackId] = useState<string | null>(null);
  const [openInfoSheetTrackId, setOpenInfoSheetTrackId] = useState<string | null>(null);
  const [filtersManuallyOpen, setFiltersManuallyOpen] = useState(false);

  const [moodFilter, setMoodFilter] = useState<string>('ALLE');
  const [minBpmInput, setMinBpmInput] = useState<string>('');
  const [maxBpmInput, setMaxBpmInput] = useState<string>('');

  // Zustand für "Anfragen" (ein Bildschirm / kurzes Formular und danach Bestätigung)
  const [inquiringTrack, setInquiringTrack] = useState<PitchTrack | null>(null);
  const [recipientNameInput, setRecipientNameInput] = useState('');
  const [productionTitleInput, setProductionTitleInput] = useState('');
  const [usageScopeInput, setUsageScopeInput] = useState('');
  const [messageInput, setMessageInput] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [confirmedTrackTitle, setConfirmedTrackTitle] = useState<string | null>(null);

  const linkTracks = useMemo(() => {
    if (!activeLink) return [];
    return state.tracks.filter((t) => activeLink.trackIds.includes(t.id));
  }, [state.tracks, activeLink]);

  // Filter erscheinen nur ab 6 Tracks automatisch oder nach Klick auf "Filtern"
  const showFilters = linkTracks.length >= 6 || filtersManuallyOpen;

  const availableMoods = useMemo(() => {
    const set = new Set<string>();
    linkTracks.forEach((t) => set.add(t.mood));
    return Array.from(set);
  }, [linkTracks]);

  const filteredTracks = useMemo(() => {
    const minBpm = minBpmInput.trim() !== '' ? Number(minBpmInput) : null;
    const maxBpm = maxBpmInput.trim() !== '' ? Number(maxBpmInput) : null;

    return linkTracks.filter((track) => {
      if (moodFilter !== 'ALLE' && track.mood !== moodFilter) return false;
      if (minBpm !== null && !Number.isNaN(minBpm) && track.bpm < minBpm) return false;
      if (maxBpm !== null && !Number.isNaN(maxBpm) && track.bpm > maxBpm) return false;
      return true;
    });
  }, [linkTracks, moodFilter, minBpmInput, maxBpmInput]);

  const playingTrack = useMemo(() => {
    if (!playingTrackId) return null;
    return state.tracks.find((t) => t.id === playingTrackId) || null;
  }, [state.tracks, playingTrackId]);

  if (!activeLink) {
    return (
      <section className="mx-auto max-w-3xl rounded-lg border-2 border-stone-300 bg-white p-6 text-base text-stone-800">
        Es ist aktuell kein Link ausgewählt. Bitte wechseln Sie oben in die Komponisten-Sicht, um einen Link anzulegen.
      </section>
    );
  }

  function handleOpenInquiryForm(track: PitchTrack) {
    if (!activeLink) return;
    setConfirmedTrackTitle(null);
    setInquiringTrack(track);
    setRecipientNameInput(activeLink.recipientName);
    setProductionTitleInput(activeLink.productionTitle);
    setUsageScopeInput('');
    setMessageInput('');
    setFormError(null);
  }

  function handleSendInquiry(e: React.FormEvent) {
    e.preventDefault();
    if (!activeLink || !inquiringTrack) return;

    if (!recipientNameInput.trim() || !productionTitleInput.trim() || !usageScopeInput.trim()) {
      setFormError(
        'Bitte geben Sie Ihren Namen, das Projekt und die geplante Nutzung an.'
      );
      return;
    }

    onSubmitInquiry({
      pitchLinkId: activeLink.id,
      trackId: inquiringTrack.id,
      recipientName: recipientNameInput.trim(),
      productionTitle: productionTitleInput.trim(),
      usageScope: usageScopeInput.trim(),
      message: messageInput.trim(),
    });

    const title = inquiringTrack.title;
    setInquiringTrack(null);
    setFormError(null);
    setConfirmedTrackTitle(title);
  }

  // Klare Bestätigungsseite nach dem Absenden einer Anfrage
  if (confirmedTrackTitle) {
    return (
      <section
        aria-labelledby="recipient-confirm-heading"
        className="mx-auto max-w-2xl rounded-lg border-2 border-stone-900 bg-white p-6 space-y-5"
      >
        <h1
          id="recipient-confirm-heading"
          className="text-2xl font-bold text-stone-950"
        >
          Vielen Dank, Ihre Anfrage wurde gesendet
        </h1>
        <p className="text-base text-stone-700">
          {state.composerName} hat Ihre Anfrage zum Track „{confirmedTrackTitle}“ erhalten und meldet sich bei Ihnen.
        </p>

        <div>
          <button
            type="button"
            onClick={() => setConfirmedTrackTitle(null)}
            className="min-h-[48px] rounded border-2 border-stone-950 bg-stone-950 px-6 py-3 text-base font-bold text-white hover:bg-stone-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stone-950"
          >
            Zurück zur Trackliste
          </button>
        </div>
      </section>
    );
  }

  // Kurzes Formular nach Klick auf "Anfragen" (eine Aufgabe pro Bildschirm)
  if (inquiringTrack) {
    return (
      <section
        aria-labelledby="recipient-inquiry-heading"
        className="mx-auto max-w-2xl rounded-lg border-2 border-stone-900 bg-white p-5 sm:p-6 space-y-6"
      >
        <div>
          <button
            type="button"
            onClick={() => setInquiringTrack(null)}
            className="min-h-[44px] rounded border-2 border-stone-300 bg-white px-4 py-2 text-sm font-semibold text-stone-800 hover:bg-stone-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stone-950"
          >
            ← Zurück zur Trackliste
          </button>

          <h1
            id="recipient-inquiry-heading"
            className="mt-4 text-2xl font-bold text-stone-950"
          >
            Track „{inquiringTrack.title}“ anfragen
          </h1>
          <p className="mt-1 text-base text-stone-700">
            Senden Sie eine kurze unverbindliche Anfrage direkt an {state.composerName}.
          </p>
        </div>

        {formError && (
          <div
            role="alert"
            className="rounded border-2 border-red-700 bg-red-50 p-3 text-sm font-semibold text-red-900"
          >
            {formError}
          </div>
        )}

        <form onSubmit={handleSendInquiry} noValidate className="space-y-4">
          <div>
            <label
              htmlFor="rec-inq-name"
              className="block text-sm font-bold text-stone-900"
            >
              Ihr Name
            </label>
            <input
              id="rec-inq-name"
              type="text"
              value={recipientNameInput}
              onChange={(e) => setRecipientNameInput(e.target.value)}
              className="mt-1 w-full min-h-[44px] rounded border-2 border-stone-400 bg-white px-3 py-2 text-base text-stone-950 focus:border-stone-950 focus:outline-none"
            />
          </div>

          <div>
            <label
              htmlFor="rec-inq-project"
              className="block text-sm font-bold text-stone-900"
            >
              Projekt
            </label>
            <input
              id="rec-inq-project"
              type="text"
              value={productionTitleInput}
              onChange={(e) => setProductionTitleInput(e.target.value)}
              className="mt-1 w-full min-h-[44px] rounded border-2 border-stone-400 bg-white px-3 py-2 text-base text-stone-950 focus:border-stone-950 focus:outline-none"
            />
          </div>

          <div>
            <label
              htmlFor="rec-inq-usage"
              className="block text-sm font-bold text-stone-900"
            >
              Wofür möchten Sie den Track nutzen?
            </label>
            <input
              id="rec-inq-usage"
              type="text"
              value={usageScopeInput}
              onChange={(e) => setUsageScopeInput(e.target.value)}
              placeholder="z. B. Hintergrundmusik Folge 2, TV & Mediathek"
              className="mt-1 w-full min-h-[44px] rounded border-2 border-stone-400 bg-white px-3 py-2 text-base text-stone-950 focus:border-stone-950 focus:outline-none"
            />
          </div>

          <div>
            <label
              htmlFor="rec-inq-message"
              className="block text-sm font-bold text-stone-900"
            >
              Ihre Nachricht (freiwillig)
            </label>
            <textarea
              id="rec-inq-message"
              rows={3}
              value={messageInput}
              onChange={(e) => setMessageInput(e.target.value)}
              placeholder="Optionaler Hinweis zur Szene oder Rückfrage..."
              className="mt-1 w-full rounded border-2 border-stone-400 bg-white px-3 py-2 text-base text-stone-950 focus:border-stone-950 focus:outline-none"
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              className="w-full sm:w-auto min-h-[48px] rounded border-2 border-stone-950 bg-stone-950 px-6 py-3 text-base font-bold text-white hover:bg-stone-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stone-950"
            >
              Anfrage senden
            </button>
          </div>
        </form>
      </section>
    );
  }

  // Hauptansicht für den Empfänger
  return (
    <section aria-labelledby="recipient-room-heading" className="mx-auto max-w-3xl space-y-6">
      {/* Oben: Wer hat die Musik geschickt, für welches Projekt, und die persönliche Nachricht */}
      <div className="rounded-lg border-2 border-stone-900 bg-white p-5 sm:p-6 space-y-3">
        <p className="text-sm font-semibold text-stone-600">
          Musikauswahl von {state.composerName} ({state.studioLabel})
        </p>
        <h1
          id="recipient-room-heading"
          className="text-2xl font-bold text-stone-950 sm:text-3xl"
        >
          {activeLink.productionTitle}
        </h1>

        {activeLink.personalNote.trim() !== '' && (
          <p className="rounded border-l-4 border-stone-800 bg-stone-50 p-3 text-base text-stone-800">
            „{activeLink.personalNote}“
          </p>
        )}
      </div>

      {/* Player-Hinweis (erscheint bei Auswahl eines Tracks oder als ruhige Player-Zeile) */}
      {playingTrack && (
        <div
          role="region"
          aria-label="Wiedergabe"
          className="rounded-lg border-2 border-stone-900 bg-stone-900 p-4 text-white space-y-1"
        >
          <p className="text-base font-bold">
            Ausgewählt: {playingTrack.title} ({playingTrack.durationFormatted})
          </p>
          <p className="text-sm text-amber-300 font-semibold">
            Hörprobe in der Demo nicht verfügbar
          </p>
        </div>
      )}

      {/* Kopfbereich Trackliste + eingeklappte Filter */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-bold text-stone-950">
            Ausgewählte Tracks ({filteredTracks.length})
          </h2>

          {!showFilters ? (
            <button
              type="button"
              onClick={() => setFiltersManuallyOpen(true)}
              className="min-h-[44px] rounded border-2 border-stone-300 bg-white px-4 py-2 text-sm font-semibold text-stone-900 hover:bg-stone-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stone-950"
            >
              Filtern
            </button>
          ) : (
            linkTracks.length < 6 && (
              <button
                type="button"
                onClick={() => {
                  setFiltersManuallyOpen(false);
                  setMoodFilter('ALLE');
                  setMinBpmInput('');
                  setMaxBpmInput('');
                }}
                className="min-h-[44px] rounded border border-stone-300 bg-white px-3 py-1.5 text-sm font-semibold text-stone-700 hover:bg-stone-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stone-950"
              >
                Filter schließen
              </button>
            )
          )}
        </div>

        {showFilters && (
          <div className="rounded-lg border-2 border-stone-300 bg-white p-4 space-y-3">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div>
                <label
                  htmlFor="rec-mood-filter"
                  className="block text-sm font-bold text-stone-800"
                >
                  Stimmung
                </label>
                <select
                  id="rec-mood-filter"
                  value={moodFilter}
                  onChange={(e) => setMoodFilter(e.target.value)}
                  className="mt-1 w-full min-h-[44px] rounded border-2 border-stone-400 bg-white px-3 py-2 text-sm text-stone-900 focus:border-stone-950 focus:outline-none"
                >
                  <option value="ALLE">Alle Stimmungen</option>
                  {availableMoods.map((mood) => (
                    <option key={mood} value={mood}>
                      {mood}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="rec-min-bpm"
                  className="block text-sm font-bold text-stone-800"
                >
                  Tempo ab (BPM)
                </label>
                <input
                  id="rec-min-bpm"
                  type="number"
                  inputMode="numeric"
                  value={minBpmInput}
                  onChange={(e) => setMinBpmInput(e.target.value)}
                  placeholder="z. B. 80"
                  className="mt-1 w-full min-h-[44px] rounded border-2 border-stone-400 bg-white px-3 py-2 text-sm text-stone-900 focus:border-stone-950 focus:outline-none"
                />
              </div>

              <div>
                <label
                  htmlFor="rec-max-bpm"
                  className="block text-sm font-bold text-stone-800"
                >
                  Tempo bis (BPM)
                </label>
                <input
                  id="rec-max-bpm"
                  type="number"
                  inputMode="numeric"
                  value={maxBpmInput}
                  onChange={(e) => setMaxBpmInput(e.target.value)}
                  placeholder="z. B. 120"
                  className="mt-1 w-full min-h-[44px] rounded border-2 border-stone-400 bg-white px-3 py-2 text-sm text-stone-900 focus:border-stone-950 focus:outline-none"
                />
              </div>
            </div>
          </div>
        )}

        {/* Trackliste */}
        {filteredTracks.length === 0 ? (
          <div className="rounded-lg border-2 border-dashed border-stone-400 bg-white p-6 text-sm text-stone-700">
            Für diese Filterung wurde kein passender Track gefunden. Setzen Sie die Filter zurück, um wieder alle Stücke zu sehen.
          </div>
        ) : (
          <ul className="space-y-3" aria-label="Trackliste für Ihre Produktion">
            {filteredTracks.map((track) => {
              const isPlaying = playingTrackId === track.id;
              const isInfoOpen = openInfoSheetTrackId === track.id;
              const rights = state.rightsFiles[track.id];

              return (
                <li
                  key={track.id}
                  className="rounded-lg border-2 border-stone-300 bg-white p-4 space-y-3"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h3 className="text-lg font-bold text-stone-950">
                        {track.title}
                      </h3>
                      <p className="text-sm text-stone-700">
                        {track.durationFormatted} · Stimmung: {track.mood} · {track.bpm} BPM
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setPlayingTrackId(track.id);
                          onPlayTrack(activeLink.id, track.id);
                        }}
                        className={`min-h-[44px] rounded border-2 px-4 py-2 text-sm font-bold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stone-950 ${
                          isPlaying
                            ? 'border-amber-700 bg-amber-100 text-stone-950'
                            : 'border-stone-400 bg-stone-50 text-stone-900 hover:bg-stone-200'
                        }`}
                      >
                        Abspielen
                      </button>

                      <button
                        type="button"
                        aria-expanded={isInfoOpen}
                        onClick={() =>
                          setOpenInfoSheetTrackId(isInfoOpen ? null : track.id)
                        }
                        className="min-h-[44px] rounded border-2 border-stone-300 bg-white px-3 py-2 text-sm font-semibold text-stone-800 hover:bg-stone-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stone-950"
                      >
                        {isInfoOpen ? 'Infoblatt schließen' : 'Infoblatt'}
                      </button>

                      <button
                        type="button"
                        onClick={() => handleOpenInquiryForm(track)}
                        className="min-h-[44px] rounded border-2 border-stone-950 bg-stone-950 px-4 py-2 text-sm font-bold text-white hover:bg-stone-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stone-950"
                      >
                        Anfragen
                      </button>
                    </div>
                  </div>

                  {/* Eingeklapptes Infoblatt zum Track */}
                  {isInfoOpen && (
                    <div className="rounded border border-stone-300 bg-stone-50 p-4 text-sm text-stone-800 space-y-2">
                      <p>
                        <strong>Komposition:</strong> {track.composer}
                      </p>
                      <p>
                        <strong>Instrumente & Stil:</strong> {track.instrumentation} ({track.genre}, {track.musicalKey})
                      </p>
                      <p>{track.description}</p>
                      {rights && (
                        <div className="border-t border-stone-200 pt-2 text-xs text-stone-600 space-y-1">
                          <p>
                            Beteiligte (Anteile):{' '}
                            {rights.splits
                              .map((s) => `${s.personName} (${s.sharePercent} %)`)
                              .join(', ')}
                          </p>
                          <p>Rechtestatus: {RIGHTS_STATUS_LABEL}</p>
                        </div>
                      )}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </section>
  );
}
