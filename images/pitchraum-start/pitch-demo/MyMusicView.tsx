import React, { useState } from 'react';
import {
  RIGHTS_STATUS_LABEL,
  type PitchDemoState,
  type PitchTrack,
  type TrackRightsFile,
} from './types';
import { getTrackMissingReasons } from './mockApi';

interface MyMusicViewProps {
  state: PitchDemoState;
  onUpdateRightsField: (
    trackId: string,
    field: 'isrcCode' | 'workRegistrationCode' | 'notes',
    value: string
  ) => void;
  onAddSplit: (
    trackId: string,
    input: {
      personName: string;
      role: string;
      sharePercent: number;
      optionalIdentifier?: string;
    }
  ) => void;
  onAddContract: (
    trackId: string,
    input: {
      fileName: string;
      documentType: string;
      note: string;
    }
  ) => void;
}

function getSplitSum(rf?: TrackRightsFile): number {
  if (!rf) return 0;
  return rf.splits.reduce((acc, item) => acc + item.sharePercent, 0);
}

export function MyMusicView({
  state,
  onUpdateRightsField,
  onAddSplit,
  onAddContract,
}: MyMusicViewProps) {
  const [selectedTrackId, setSelectedTrackId] = useState<string | null>(null);

  // Drei einklappbare Abschnitte: nur der erste ("about") ist anfangs offen
  const [openSections, setOpenSections] = useState<{
    about: boolean;
    shares: boolean;
    documents: boolean;
  }>({
    about: true,
    shares: false,
    documents: false,
  });

  // Formularfelder für neuen Anteil
  const [personName, setPersonName] = useState('');
  const [role, setRole] = useState('');
  const [sharePercent, setSharePercent] = useState('');
  const [splitError, setSplitError] = useState<string | null>(null);
  const [splitSavedNotice, setSplitSavedNotice] = useState<string | null>(null);

  // Formularfelder für neue Unterlage
  const [fileName, setFileName] = useState('');
  const [documentType, setDocumentType] = useState('Vereinbarung (Entwurf)');
  const [documentNote, setDocumentNote] = useState('');
  const [docError, setDocError] = useState<string | null>(null);
  const [docSavedNotice, setDocSavedNotice] = useState<string | null>(null);

  function handleOpenTrack(track: PitchTrack) {
    setSelectedTrackId(track.id);
    // Gemäß Vorgabe: beim Öffnen der Track-Seite ist anfangs nur der erste Abschnitt offen
    setOpenSections({ about: true, shares: false, documents: false });
    setSplitError(null);
    setSplitSavedNotice(null);
    setDocError(null);
    setDocSavedNotice(null);
  }

  function toggleSection(section: 'about' | 'shares' | 'documents') {
    setOpenSections((prev) => ({ ...prev, [section]: !prev[section] }));
  }

  const selectedTrack = state.tracks.find((t) => t.id === selectedTrackId) || null;
  const selectedRights = selectedTrack ? state.rightsFiles[selectedTrack.id] : undefined;

  function handleSubmitNewSplit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedTrack) return;

    const parsed = Number(sharePercent);
    if (!personName.trim() || !role.trim() || !sharePercent.trim() || Number.isNaN(parsed) || parsed <= 0) {
      setSplitError('Bitte gib Name, Aufgabe und einen Prozentwert größer als 0 ein.');
      return;
    }

    setSplitError(null);
    onAddSplit(selectedTrack.id, {
      personName: personName.trim(),
      role: role.trim(),
      sharePercent: parsed,
    });
    setPersonName('');
    setRole('');
    setSharePercent('');
    setSplitSavedNotice('Anteil wurde gespeichert.');
  }

  function handleSubmitNewDocument(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedTrack) return;

    if (!fileName.trim()) {
      setDocError('Bitte wähle eine Datei aus oder trag einen Dateinamen ein.');
      return;
    }

    setDocError(null);
    onAddContract(selectedTrack.id, {
      fileName: fileName.trim(),
      documentType,
      note: documentNote.trim() || 'Hinterlegte Unterlage zum Track.',
    });
    setFileName('');
    setDocumentNote('');
    setDocSavedNotice('Unterlage wurde gespeichert.');
  }

  // Listenansicht: Alle Tracks
  if (!selectedTrack || !selectedRights) {
    return (
      <section aria-labelledby="my-music-heading" className="space-y-6">
        <div>
          <h1 id="my-music-heading" className="text-2xl font-bold text-stone-950">
            Meine Musik
          </h1>
          <p className="mt-1 text-base text-stone-700">
            Wähle einen Track aus, um deine Angaben, Mitwirkenden und Unterlagen anzusehen oder zu ergänzen.
          </p>
        </div>

        <ul className="space-y-3" aria-label="Liste deiner Tracks">
          {state.tracks.map((track) => {
            const rf = state.rightsFiles[track.id];
            const missingReasons = getTrackMissingReasons(track, rf);
            const missingCount = missingReasons.length;
            const splitSum = getSplitSum(rf);

            return (
              <li key={track.id}>
                <button
                  type="button"
                  onClick={() => handleOpenTrack(track)}
                  className="flex w-full min-h-[60px] flex-col gap-2 rounded-lg border-2 border-stone-300 bg-white p-4 text-left hover:border-stone-900 hover:bg-stone-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stone-950 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <span className="block text-base font-bold text-stone-950">
                      {track.title}
                    </span>
                    <span className="block text-sm text-stone-600">
                      {track.durationFormatted} · Stimmung: {track.mood}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {splitSum !== 100 && (
                      <span className="rounded border border-red-700 bg-red-50 px-2.5 py-1 text-xs font-bold text-red-900">
                        Summe {splitSum} %, sollte 100 % ergeben
                      </span>
                    )}

                    {missingCount === 0 ? (
                      <span className="rounded border border-emerald-700 bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-950">
                        Angaben vollständig
                      </span>
                    ) : (
                      <span className="rounded border border-amber-700 bg-amber-50 px-3 py-1 text-xs font-bold text-amber-950">
                        {missingCount === 1
                          ? 'Noch 1 Angabe fehlt'
                          : `Noch ${missingCount} Angaben fehlen`}
                      </span>
                    )}
                  </div>
                </button>
              </li>
            );
          })}
        </ul>
      </section>
    );
  }

  // Detailansicht eines Tracks mit 3 einklappbaren Abschnitten
  const missingReasons = getTrackMissingReasons(selectedTrack, selectedRights);
  const splitSum = getSplitSum(selectedRights);

  return (
    <section aria-labelledby="track-detail-heading" className="space-y-6">
      <div>
        <button
          type="button"
          onClick={() => setSelectedTrackId(null)}
          className="min-h-[44px] rounded border-2 border-stone-300 bg-white px-4 py-2 text-sm font-semibold text-stone-800 hover:bg-stone-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stone-950"
        >
          ← Zurück zu meiner Musik
        </button>

        <div className="mt-4 flex flex-wrap items-baseline justify-between gap-2">
          <h1 id="track-detail-heading" className="text-2xl font-bold text-stone-950">
            {selectedTrack.title}
          </h1>
          <span className="text-sm text-stone-600">
            Rechtestatus: {RIGHTS_STATUS_LABEL}
          </span>
        </div>

        <p className="mt-1 text-base text-stone-700">
          Hier verwaltest du alle Angaben zum Track an einem Ort.
        </p>

        {/* Sichtbarer Hinweis, was bei diesem Track noch fehlt */}
        {missingReasons.length > 0 ? (
          <div
            role="status"
            className="mt-4 rounded-lg border-2 border-amber-700 bg-amber-50 p-4 text-sm text-amber-950 space-y-1"
          >
            <p className="font-bold">
              {missingReasons.length === 1
                ? 'Noch 1 Angabe fehlt:'
                : `Noch ${missingReasons.length} Angaben fehlen:`}
            </p>
            <ul className="list-disc pl-5 space-y-0.5">
              {missingReasons.map((reason, idx) => (
                <li key={idx}>{reason}</li>
              ))}
            </ul>
          </div>
        ) : (
          <div
            role="status"
            className="mt-4 rounded-lg border border-emerald-700 bg-emerald-50 px-4 py-2.5 text-sm font-semibold text-emerald-950"
          >
            Angaben vollständig
          </div>
        )}
      </div>

      {/* ABSCHNITT 1: ÜBER DEN TRACK (anfangs offen) */}
      <div className="rounded-lg border-2 border-stone-300 bg-white">
        <button
          type="button"
          aria-expanded={openSections.about}
          onClick={() => toggleSection('about')}
          className="flex w-full min-h-[52px] items-center justify-between px-4 py-3 text-left text-base font-bold text-stone-950 hover:bg-stone-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stone-950"
        >
          <span>1. Über den Track</span>
          <span className="text-sm font-semibold text-stone-600">
            {openSections.about ? 'Einklappen' : 'Aufklappen'}
          </span>
        </button>

        {openSections.about && (
          <div className="border-t border-stone-200 p-4 sm:p-5 space-y-4">
            <dl className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
              <div>
                <dt className="font-semibold text-stone-600">Dauer & Stimmung</dt>
                <dd className="text-stone-950">
                  {selectedTrack.durationFormatted} · {selectedTrack.mood}
                </dd>
              </div>
              <div>
                <dt className="font-semibold text-stone-600">Tempo & Tonart</dt>
                <dd className="text-stone-950">
                  {selectedTrack.bpm} BPM · {selectedTrack.musicalKey}
                </dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="font-semibold text-stone-600">Instrumente & Beschreibung</dt>
                <dd className="text-stone-950">
                  {selectedTrack.instrumentation} — {selectedTrack.description}
                </dd>
              </div>
            </dl>

            <div className="border-t border-stone-200 pt-4 space-y-4">
              <div>
                <label
                  htmlFor="track-isrc-field"
                  className="block text-sm font-bold text-stone-900"
                >
                  ISRC-Nummer (freiwillig)
                </label>
                <p className="text-xs text-stone-600">
                  Diese Kennung brauchst du nur, wenn dein Track bereits veröffentlicht wurde.
                </p>
                <input
                  id="track-isrc-field"
                  type="text"
                  value={selectedRights.isrcCode}
                  onChange={(e) =>
                    onUpdateRightsField(selectedTrack.id, 'isrcCode', e.target.value)
                  }
                  placeholder="Leer lassen, falls noch nicht vorhanden"
                  className="mt-1 w-full min-h-[44px] rounded border-2 border-stone-400 bg-white px-3 py-2 text-sm text-stone-950 focus:border-stone-950 focus:outline-none"
                />
              </div>

              <div>
                <label
                  htmlFor="track-workcode-field"
                  className="block text-sm font-bold text-stone-900"
                >
                  Werknummer (freiwillig)
                </label>
                <p className="text-xs text-stone-600">
                  Trag sie nur ein, wenn das Werk schon bei einer Verwertungsgesellschaft gemeldet ist.
                </p>
                <input
                  id="track-workcode-field"
                  type="text"
                  value={selectedRights.workRegistrationCode}
                  onChange={(e) =>
                    onUpdateRightsField(
                      selectedTrack.id,
                      'workRegistrationCode',
                      e.target.value
                    )
                  }
                  placeholder="Leer lassen, falls noch nicht vorhanden"
                  className="mt-1 w-full min-h-[44px] rounded border-2 border-stone-400 bg-white px-3 py-2 text-sm text-stone-950 focus:border-stone-950 focus:outline-none"
                />
              </div>

              <div>
                <label
                  htmlFor="track-notes-field"
                  className="block text-sm font-bold text-stone-900"
                >
                  Eigene Notiz zum Track
                </label>
                <textarea
                  id="track-notes-field"
                  rows={2}
                  value={selectedRights.notes}
                  onChange={(e) =>
                    onUpdateRightsField(selectedTrack.id, 'notes', e.target.value)
                  }
                  className="mt-1 w-full rounded border-2 border-stone-400 bg-white px-3 py-2 text-sm text-stone-950 focus:border-stone-950 focus:outline-none"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ABSCHNITT 2: WER HAT MITGEWIRKT (ANTEILE) */}
      <div className="rounded-lg border-2 border-stone-300 bg-white">
        <button
          type="button"
          aria-expanded={openSections.shares}
          onClick={() => toggleSection('shares')}
          className="flex w-full min-h-[52px] flex-wrap items-center justify-between gap-2 px-4 py-3 text-left text-base font-bold text-stone-950 hover:bg-stone-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stone-950"
        >
          <span>2. Wer hat mitgewirkt (Anteile)</span>
          <div className="flex items-center gap-2">
            {splitSum !== 100 && (
              <span className="rounded border border-red-700 bg-red-50 px-2 py-0.5 text-xs font-bold text-red-900">
                Summe {splitSum} %, sollte 100 % ergeben
              </span>
            )}
            <span className="text-sm font-semibold text-stone-600">
              {openSections.shares ? 'Einklappen' : 'Aufklappen'}
            </span>
          </div>
        </button>

        {openSections.shares && (
          <div className="border-t border-stone-200 p-4 sm:p-5 space-y-5">
            {splitSum !== 100 && (
              <div
                role="status"
                className="rounded border-2 border-red-700 bg-red-50 p-3 text-sm font-bold text-red-900"
              >
                Summe {splitSum} %, sollte 100 % ergeben. Du kannst trotzdem jederzeit speichern.
              </div>
            )}

            <ul className="space-y-2" aria-label="Bisher eingetragene Anteile">
              {selectedRights.splits.map((s) => (
                <li
                  key={s.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded border border-stone-300 bg-stone-50 px-3 py-2.5 text-sm"
                >
                  <div>
                    <span className="font-bold text-stone-950">{s.personName}</span>
                    <span className="text-stone-700"> · {s.role}</span>
                  </div>
                  <span className="font-bold text-stone-950">{s.sharePercent} %</span>
                </li>
              ))}
            </ul>

            <form
              onSubmit={handleSubmitNewSplit}
              noValidate
              className="border-t border-stone-200 pt-4 space-y-4"
            >
              <h2 className="text-base font-bold text-stone-950">
                Weitere Person oder Anteil ergänzen
              </h2>

              {splitError && (
                <div
                  role="alert"
                  className="rounded border-2 border-red-700 bg-red-50 p-3 text-sm font-semibold text-red-900"
                >
                  {splitError}
                </div>
              )}

              {splitSavedNotice && (
                <div
                  role="status"
                  className="rounded border border-emerald-700 bg-emerald-50 p-3 text-sm font-semibold text-emerald-950"
                >
                  {splitSavedNotice}
                </div>
              )}

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div>
                  <label
                    htmlFor="share-person-input"
                    className="block text-sm font-bold text-stone-900"
                  >
                    Name der Person
                  </label>
                  <input
                    id="share-person-input"
                    type="text"
                    value={personName}
                    onChange={(e) => setPersonName(e.target.value)}
                    placeholder="z. B. Jonas Wieland (Fiktiv)"
                    className="mt-1 w-full min-h-[44px] rounded border-2 border-stone-400 bg-white px-3 py-2 text-sm text-stone-950 focus:border-stone-950 focus:outline-none"
                  />
                </div>

                <div>
                  <label
                    htmlFor="share-role-input"
                    className="block text-sm font-bold text-stone-900"
                  >
                    Aufgabe beim Track
                  </label>
                  <input
                    id="share-role-input"
                    type="text"
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    placeholder="z. B. Bassklarinette"
                    className="mt-1 w-full min-h-[44px] rounded border-2 border-stone-400 bg-white px-3 py-2 text-sm text-stone-950 focus:border-stone-950 focus:outline-none"
                  />
                </div>

                <div>
                  <label
                    htmlFor="share-percent-input"
                    className="block text-sm font-bold text-stone-900"
                  >
                    Anteil in Prozent
                  </label>
                  <input
                    id="share-percent-input"
                    type="number"
                    inputMode="decimal"
                    value={sharePercent}
                    onChange={(e) => setSharePercent(e.target.value)}
                    placeholder="z. B. 20"
                    className="mt-1 w-full min-h-[44px] rounded border-2 border-stone-400 bg-white px-3 py-2 text-sm text-stone-950 focus:border-stone-950 focus:outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="min-h-[48px] rounded border-2 border-stone-950 bg-stone-950 px-5 py-2.5 text-sm font-bold text-white hover:bg-stone-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stone-950"
              >
                Anteil speichern
              </button>
            </form>
          </div>
        )}
      </div>

      {/* ABSCHNITT 3: UNTERLAGEN */}
      <div className="rounded-lg border-2 border-stone-300 bg-white">
        <button
          type="button"
          aria-expanded={openSections.documents}
          onClick={() => toggleSection('documents')}
          className="flex w-full min-h-[52px] items-center justify-between px-4 py-3 text-left text-base font-bold text-stone-950 hover:bg-stone-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stone-950"
        >
          <span>3. Unterlagen ({selectedRights.contracts.length})</span>
          <span className="text-sm font-semibold text-stone-600">
            {openSections.documents ? 'Einklappen' : 'Aufklappen'}
          </span>
        </button>

        {openSections.documents && (
          <div className="border-t border-stone-200 p-4 sm:p-5 space-y-5">
            {selectedRights.contracts.length === 0 ? (
              <div className="rounded border border-dashed border-stone-400 bg-stone-50 p-4 text-sm text-stone-700">
                Noch keine Unterlage hinterlegt. Füge unten eine Vereinbarung oder ein Aufnahmeprotokoll hinzu.
              </div>
            ) : (
              <ul className="space-y-2" aria-label="Hinterlegte Unterlagen">
                {selectedRights.contracts.map((doc) => (
                  <li
                    key={doc.id}
                    className="rounded border border-stone-300 bg-stone-50 p-3 text-sm space-y-1"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="font-bold text-stone-950 break-all">
                        {doc.fileName}
                      </span>
                      <span className="text-xs text-stone-600">{doc.documentType}</span>
                    </div>
                    {doc.note && <p className="text-stone-700">{doc.note}</p>}
                  </li>
                ))}
              </ul>
            )}

            <form
              onSubmit={handleSubmitNewDocument}
              noValidate
              className="border-t border-stone-200 pt-4 space-y-4"
            >
              <h2 className="text-base font-bold text-stone-950">
                Unterlage hinzufügen
              </h2>

              {docError && (
                <div
                  role="alert"
                  className="rounded border-2 border-red-700 bg-red-50 p-3 text-sm font-semibold text-red-900"
                >
                  {docError}
                </div>
              )}

              {docSavedNotice && (
                <div
                  role="status"
                  className="rounded border border-emerald-700 bg-emerald-50 p-3 text-sm font-semibold text-emerald-950"
                >
                  {docSavedNotice}
                </div>
              )}

              <div>
                <label
                  htmlFor="doc-file-picker"
                  className="block text-sm font-bold text-stone-900"
                >
                  Datei auswählen
                </label>
                <input
                  id="doc-file-picker"
                  type="file"
                  accept=".pdf,.doc,.docx,.txt"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) {
                      setFileName(f.name);
                      setDocError(null);
                    }
                  }}
                  className="mt-1 block w-full text-sm text-stone-700 file:mr-3 file:min-h-[44px] file:rounded file:border file:border-stone-800 file:bg-stone-100 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-stone-900"
                />
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="doc-name-input"
                    className="block text-sm font-bold text-stone-900"
                  >
                    Dateiname
                  </label>
                  <input
                    id="doc-name-input"
                    type="text"
                    value={fileName}
                    onChange={(e) => {
                      setFileName(e.target.value);
                      if (docError) setDocError(null);
                    }}
                    placeholder="z. B. vereinbarung-musiker.pdf"
                    className="mt-1 w-full min-h-[44px] rounded border-2 border-stone-400 bg-white px-3 py-2 text-sm text-stone-950 focus:border-stone-950 focus:outline-none"
                  />
                </div>

                <div>
                  <label
                    htmlFor="doc-type-select"
                    className="block text-sm font-bold text-stone-900"
                  >
                    Art der Unterlage
                  </label>
                  <select
                    id="doc-type-select"
                    value={documentType}
                    onChange={(e) => setDocumentType(e.target.value)}
                    className="mt-1 w-full min-h-[44px] rounded border-2 border-stone-400 bg-white px-3 py-2 text-sm text-stone-950 focus:border-stone-950 focus:outline-none"
                  >
                    <option value="Vereinbarung (Entwurf)">Vereinbarung (Entwurf)</option>
                    <option value="Musiker-Freigabe">Musiker-Freigabe</option>
                    <option value="Aufnahmeprotokoll">Aufnahmeprotokoll</option>
                    <option value="Sonstige Unterlage">Sonstige Unterlage</option>
                  </select>
                </div>
              </div>

              <div>
                <label
                  htmlFor="doc-note-input"
                  className="block text-sm font-bold text-stone-900"
                >
                  Kurze Notiz (freiwillig)
                </label>
                <input
                  id="doc-note-input"
                  type="text"
                  value={documentNote}
                  onChange={(e) => setDocumentNote(e.target.value)}
                  placeholder="z. B. Mit allen Beteiligten abgestimmt"
                  className="mt-1 w-full min-h-[44px] rounded border-2 border-stone-400 bg-white px-3 py-2 text-sm text-stone-950 focus:border-stone-950 focus:outline-none"
                />
              </div>

              <button
                type="submit"
                className="min-h-[48px] rounded border-2 border-stone-950 bg-stone-950 px-5 py-2.5 text-sm font-bold text-white hover:bg-stone-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stone-950"
              >
                Unterlage speichern
              </button>
            </form>
          </div>
        )}
      </div>
    </section>
  );
}
