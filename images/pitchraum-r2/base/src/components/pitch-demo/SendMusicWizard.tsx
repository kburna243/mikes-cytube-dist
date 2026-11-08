import React, { useEffect, useRef, useState } from 'react';
import type { PitchLinkRecord, PitchTrack } from './types';

interface SendMusicWizardProps {
  tracks: PitchTrack[];
  busy: boolean;
  onCancel: () => void;
  onCreateLink: (input: {
    recipientName: string;
    productionTitle: string;
    personalNote: string;
    trackIds: string[];
  }) => Promise<PitchLinkRecord>;
  onOpenAsRecipient: (linkId: string) => void;
}

type WizardStep = 1 | 2 | 3 | 'success';

export function SendMusicWizard({
  tracks,
  busy,
  onCancel,
  onCreateLink,
  onOpenAsRecipient,
}: SendMusicWizardProps) {
  const [step, setStep] = useState<WizardStep>(1);
  const [selectedTrackIds, setSelectedTrackIds] = useState<string[]>([]);
  const [expandedTrackIds, setExpandedTrackIds] = useState<string[]>([]);

  const [recipientName, setRecipientName] = useState('');
  const [productionTitle, setProductionTitle] = useState('');
  const [personalNote, setPersonalNote] = useState('');

  const [stepError, setStepError] = useState<string | null>(null);
  const [createdLink, setCreatedLink] = useState<PitchLinkRecord | null>(null);
  const [copiedFeedback, setCopiedFeedback] = useState(false);
  const [creating, setCreating] = useState(false);

  const headingRef = useRef<HTMLHeadingElement | null>(null);

  useEffect(() => {
    headingRef.current?.focus();
  }, [step]);

  function toggleTrack(trackId: string) {
    setStepError(null);
    setSelectedTrackIds((prev) =>
      prev.includes(trackId) ? prev.filter((id) => id !== trackId) : [...prev, trackId]
    );
  }

  function toggleTrackDetails(trackId: string) {
    setExpandedTrackIds((prev) =>
      prev.includes(trackId) ? prev.filter((id) => id !== trackId) : [...prev, trackId]
    );
  }

  function handleNextFromStep1() {
    if (selectedTrackIds.length === 0) {
      setStepError('Bitte wähle mindestens einen Track aus, den du verschicken möchtest.');
      return;
    }
    setStepError(null);
    setStep(2);
  }

  function handleNextFromStep2(e: React.FormEvent) {
    e.preventDefault();
    const missing: string[] = [];
    if (!recipientName.trim()) {
      missing.push('den Namen der Person');
    }
    if (!productionTitle.trim()) {
      missing.push('das Projekt oder den Film');
    }
    if (missing.length > 0) {
      setStepError(`Bitte trag noch ${missing.join(' und ')} ein.`);
      return;
    }
    setStepError(null);
    setStep(3);
  }

  async function handleCreateFinalLink() {
    setCreating(true);
    setStepError(null);
    try {
      const newLink = await onCreateLink({
        recipientName: recipientName.trim(),
        productionTitle: productionTitle.trim(),
        personalNote: personalNote.trim(),
        trackIds: selectedTrackIds,
      });
      setCreatedLink(newLink);
      setCopiedFeedback(false);
      setStep('success');
    } catch (error) {
      setStepError(
        error instanceof Error
          ? error.message
          : 'Der Link konnte nicht erstellt werden. Bitte versuche es erneut.'
      );
    } finally {
      setCreating(false);
    }
  }

  /** Vollständige /l/:token-Adresse, die in einem anderen Browser ohne Cookie funktioniert. */
  function publicLinkUrl(link: PitchLinkRecord): string {
    return `${window.location.origin}/l/${link.token}`;
  }

  function handleCopyLink() {
    if (!createdLink) return;
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(publicLinkUrl(createdLink)).catch(() => {});
    }
    setCopiedFeedback(true);
  }

  const chosenTracks = tracks.filter((t) => selectedTrackIds.includes(t.id));

  // Erfolgsseite nach dem Erstellen
  if (step === 'success' && createdLink) {
    return (
      <section
        aria-labelledby="wizard-heading"
        className="mx-auto max-w-2xl rounded-lg border-2 border-stone-900 bg-white p-5 sm:p-6 space-y-6"
      >
        <div>
          <p className="text-sm font-semibold text-emerald-800">Fertig</p>
          <h1
            id="wizard-heading"
            ref={headingRef}
            tabIndex={-1}
            className="mt-1 text-2xl font-bold text-stone-950 focus:outline-none"
          >
            Dein Link für {createdLink.recipientName} ist bereit
          </h1>
          <p className="mt-1 text-base text-stone-700">
            Du kannst den Link jetzt kopieren und per E-Mail oder Nachricht verschicken.
          </p>
        </div>

        <div className="rounded border border-stone-300 bg-stone-50 p-4 text-sm text-stone-800 space-y-1">
          <p>
            <strong>Empfänger:</strong> {createdLink.recipientName}
          </p>
          <p>
            <strong>Projekt:</strong> {createdLink.productionTitle}
          </p>
          <p>
            <strong>Ausgewählte Musik:</strong> {chosenTracks.map((t) => t.title).join(', ')}
          </p>
        </div>

        <div>
          <label
            htmlFor="wizard-created-url"
            className="block text-sm font-bold text-stone-900"
          >
            Dein Link
          </label>
          <input
            id="wizard-created-url"
            type="text"
            readOnly
            value={publicLinkUrl(createdLink)}
            onFocus={(e) => e.target.select()}
            className="mt-1 w-full min-h-[44px] rounded border-2 border-stone-400 bg-white px-3 py-2 text-sm text-stone-950 focus:border-stone-950 focus:outline-none"
          />
          <p className="mt-1 text-xs text-stone-600">
            Der Link funktioniert ohne Anmeldung, auch in einem anderen Browser. In der Demo
            verliert er nach 24 Stunden seine Gültigkeit.
          </p>
        </div>

        {copiedFeedback && (
          <div
            role="status"
            className="rounded border-2 border-emerald-700 bg-emerald-50 p-3 text-sm font-semibold text-emerald-950"
          >
            Link wurde in die Zwischenablage kopiert.
          </div>
        )}

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <button
            type="button"
            onClick={handleCopyLink}
            className="min-h-[48px] rounded border-2 border-stone-950 bg-stone-950 px-6 py-3 text-base font-bold text-white hover:bg-stone-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stone-950"
          >
            {copiedFeedback ? 'Link erneut kopieren' : 'Link kopieren'}
          </button>

          <button
            type="button"
            onClick={() => onOpenAsRecipient(createdLink.id)}
            className="min-h-[48px] rounded border-2 border-stone-400 bg-white px-5 py-3 text-base font-semibold text-stone-900 hover:bg-stone-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stone-950"
          >
            So sieht es der Empfänger
          </button>
        </div>

        <div className="border-t border-stone-200 pt-4">
          <button
            type="button"
            onClick={onCancel}
            className="min-h-[44px] px-2 text-sm font-semibold text-stone-700 underline hover:text-stone-950 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stone-950"
          >
            Zurück zur Startseite
          </button>
        </div>
      </section>
    );
  }

  return (
    <section
      aria-labelledby="wizard-heading"
      className="mx-auto max-w-2xl rounded-lg border-2 border-stone-900 bg-white p-5 sm:p-6 space-y-6"
    >
      {/* Schritt-Anzeige */}
      <div className="flex items-center justify-between border-b border-stone-200 pb-3">
        <span className="text-sm font-bold text-stone-800">
          Schritt {step} von 3
        </span>
        <button
          type="button"
          onClick={onCancel}
          className="min-h-[44px] px-2 text-sm font-semibold text-stone-600 underline hover:text-stone-950 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stone-950"
        >
          Abbrechen
        </button>
      </div>

      {/* SCHRITT 1: WELCHE MUSIK? */}
      {step === 1 && (
        <div className="space-y-5">
          <div>
            <h1
              id="wizard-heading"
              ref={headingRef}
              tabIndex={-1}
              className="text-2xl font-bold text-stone-950 focus:outline-none"
            >
              Welche Musik möchtest du verschicken?
            </h1>
            <p className="mt-1 text-base text-stone-700">
              Wähle einen oder mehrere Tracks aus deiner Liste aus.
            </p>
          </div>

          {stepError && (
            <div
              role="alert"
              className="rounded border-2 border-red-700 bg-red-50 p-3 text-sm font-semibold text-red-900"
            >
              {stepError}
            </div>
          )}

          <ul className="space-y-3" aria-label="Deine Tracks">
            {tracks.map((track) => {
              const isSelected = selectedTrackIds.includes(track.id);
              const isExpanded = expandedTrackIds.includes(track.id);
              const checkboxId = `wiz-track-${track.id}`;

              return (
                <li
                  key={track.id}
                  className={`rounded-lg border-2 p-3.5 transition-colors ${
                    isSelected
                      ? 'border-stone-950 bg-stone-50'
                      : 'border-stone-300 bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <label
                      htmlFor={checkboxId}
                      className="flex min-h-[44px] flex-1 cursor-pointer items-center gap-3"
                    >
                      <input
                        id={checkboxId}
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleTrack(track.id)}
                        className="h-5 w-5 shrink-0 accent-stone-950 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stone-950"
                      />
                      <div>
                        <span className="block text-base font-bold text-stone-950">
                          {track.title}
                        </span>
                        <span className="block text-sm text-stone-700">
                          {track.durationFormatted} · Stimmung: {track.mood}
                        </span>
                      </div>
                    </label>

                    <button
                      type="button"
                      aria-expanded={isExpanded}
                      onClick={() => toggleTrackDetails(track.id)}
                      className="min-h-[44px] shrink-0 rounded border border-stone-300 bg-white px-3 py-1.5 text-xs font-semibold text-stone-800 hover:bg-stone-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stone-950"
                    >
                      {isExpanded ? 'Weniger' : 'Mehr Infos'}
                    </button>
                  </div>

                  {isExpanded && (
                    <div className="mt-3 border-t border-stone-200 pt-3 text-sm text-stone-700 space-y-1">
                      <p>
                        <strong>Tempo & Tonart:</strong> {track.bpm} BPM, {track.musicalKey}
                      </p>
                      <p>
                        <strong>Stil & Instrumente:</strong> {track.genre} ({track.instrumentation})
                      </p>
                      <p>{track.description}</p>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>

          <div className="flex flex-col-reverse gap-3 border-t border-stone-200 pt-4 sm:flex-row sm:items-center sm:justify-between">
            <button
              type="button"
              onClick={onCancel}
              className="min-h-[44px] rounded border-2 border-stone-300 bg-white px-4 py-2 text-sm font-semibold text-stone-800 hover:bg-stone-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stone-950"
            >
              Zurück zum Start
            </button>

            <button
              type="button"
              onClick={handleNextFromStep1}
              className="min-h-[48px] rounded border-2 border-stone-950 bg-stone-950 px-6 py-2.5 text-base font-bold text-white hover:bg-stone-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stone-950"
            >
              Weiter
            </button>
          </div>
        </div>
      )}

      {/* SCHRITT 2: AN WEN? */}
      {step === 2 && (
        <form onSubmit={handleNextFromStep2} noValidate className="space-y-5">
          <div>
            <h1
              id="wizard-heading"
              ref={headingRef}
              tabIndex={-1}
              className="text-2xl font-bold text-stone-950 focus:outline-none"
            >
              An wen schickst du die Musik?
            </h1>
            <p className="mt-1 text-base text-stone-700">
              Trag ein, für welche Person und welches Projekt der Link gedacht ist.
            </p>
          </div>

          {stepError && (
            <div
              role="alert"
              className="rounded border-2 border-red-700 bg-red-50 p-3 text-sm font-semibold text-red-900"
            >
              {stepError}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label
                htmlFor="wiz-recipient-name"
                className="block text-sm font-bold text-stone-900"
              >
                Name der Person
              </label>
              <input
                id="wiz-recipient-name"
                type="text"
                value={recipientName}
                onChange={(e) => {
                  setRecipientName(e.target.value);
                  if (stepError) setStepError(null);
                }}
                placeholder="z. B. Miriam Kähler (Fiktiv)"
                className="mt-1 w-full min-h-[44px] rounded border-2 border-stone-400 bg-white px-3 py-2 text-base text-stone-950 focus:border-stone-950 focus:outline-none"
              />
            </div>

            <div>
              <label
                htmlFor="wiz-production-title"
                className="block text-sm font-bold text-stone-900"
              >
                Projekt oder Film
              </label>
              <input
                id="wiz-production-title"
                type="text"
                value={productionTitle}
                onChange={(e) => {
                  setProductionTitle(e.target.value);
                  if (stepError) setStepError(null);
                }}
                placeholder="z. B. Fernsehfilm „Winterflut“"
                className="mt-1 w-full min-h-[44px] rounded border-2 border-stone-400 bg-white px-3 py-2 text-base text-stone-950 focus:border-stone-950 focus:outline-none"
              />
            </div>

            <div>
              <label
                htmlFor="wiz-personal-note"
                className="block text-sm font-bold text-stone-900"
              >
                Persönliche Nachricht (freiwillig)
              </label>
              <textarea
                id="wiz-personal-note"
                rows={3}
                value={personalNote}
                onChange={(e) => setPersonalNote(e.target.value)}
                placeholder="Kurzer Gruß oder Hinweis zu den ausgewählten Stücken..."
                className="mt-1 w-full rounded border-2 border-stone-400 bg-white px-3 py-2 text-base text-stone-950 focus:border-stone-950 focus:outline-none"
              />
            </div>
          </div>

          <div className="flex flex-col-reverse gap-3 border-t border-stone-200 pt-4 sm:flex-row sm:items-center sm:justify-between">
            <button
              type="button"
              onClick={() => {
                setStepError(null);
                setStep(1);
              }}
              className="min-h-[44px] rounded border-2 border-stone-300 bg-white px-4 py-2 text-sm font-semibold text-stone-800 hover:bg-stone-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stone-950"
            >
              Zurück
            </button>

            <button
              type="submit"
              className="min-h-[48px] rounded border-2 border-stone-950 bg-stone-950 px-6 py-2.5 text-base font-bold text-white hover:bg-stone-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stone-950"
            >
              Weiter
            </button>
          </div>
        </form>
      )}

      {/* SCHRITT 3: ALLES RICHTIG? */}
      {step === 3 && (
        <div className="space-y-5">
          <div>
            <h1
              id="wizard-heading"
              ref={headingRef}
              tabIndex={-1}
              className="text-2xl font-bold text-stone-950 focus:outline-none"
            >
              Alles richtig?
            </h1>
            <p className="mt-1 text-base text-stone-700">
              Prüfe kurz deine Angaben, bevor du den Link erstellst.
            </p>
          </div>

          {stepError && (
            <div
              role="alert"
              className="rounded border-2 border-red-700 bg-red-50 p-3 text-sm font-semibold text-red-900"
            >
              {stepError}
            </div>
          )}

          <div className="space-y-4">
            {/* Zusammenfassung Musik */}
            <div className="rounded-lg border-2 border-stone-300 bg-stone-50 p-4">
              <div className="flex items-center justify-between gap-2">
                <h2 className="text-base font-bold text-stone-950">
                  Ausgewählte Musik ({chosenTracks.length})
                </h2>
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="min-h-[44px] px-2 text-sm font-semibold text-stone-900 underline hover:text-stone-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stone-950"
                >
                  Ändern
                </button>
              </div>
              <ul className="mt-2 space-y-1 text-sm text-stone-800">
                {chosenTracks.map((t) => (
                  <li key={t.id}>
                    • <strong>{t.title}</strong> ({t.durationFormatted}, {t.mood})
                  </li>
                ))}
              </ul>
            </div>

            {/* Zusammenfassung Empfänger */}
            <div className="rounded-lg border-2 border-stone-300 bg-stone-50 p-4">
              <div className="flex items-center justify-between gap-2">
                <h2 className="text-base font-bold text-stone-950">Empfänger</h2>
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="min-h-[44px] px-2 text-sm font-semibold text-stone-900 underline hover:text-stone-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stone-950"
                >
                  Ändern
                </button>
              </div>
              <dl className="mt-2 space-y-1 text-sm text-stone-800">
                <div>
                  <dt className="inline font-semibold">Name: </dt>
                  <dd className="inline">{recipientName}</dd>
                </div>
                <div>
                  <dt className="inline font-semibold">Projekt: </dt>
                  <dd className="inline">{productionTitle}</dd>
                </div>
                {personalNote.trim() !== '' && (
                  <div>
                    <dt className="inline font-semibold">Nachricht: </dt>
                    <dd className="inline">„{personalNote.trim()}“</dd>
                  </div>
                )}
              </dl>
            </div>
          </div>

          <div className="flex flex-col-reverse gap-3 border-t border-stone-200 pt-4 sm:flex-row sm:items-center sm:justify-between">
            <button
              type="button"
              onClick={() => setStep(2)}
              className="min-h-[44px] rounded border-2 border-stone-300 bg-white px-4 py-2 text-sm font-semibold text-stone-800 hover:bg-stone-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stone-950"
            >
              Zurück
            </button>

            <button
              type="button"
              onClick={() => void handleCreateFinalLink()}
              disabled={creating || busy}
              className="min-h-[48px] rounded border-2 border-stone-950 bg-stone-950 px-6 py-2.5 text-base font-bold text-white hover:bg-stone-800 disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stone-950"
            >
              {creating ? 'Link wird erstellt …' : 'Link erstellen'}
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
