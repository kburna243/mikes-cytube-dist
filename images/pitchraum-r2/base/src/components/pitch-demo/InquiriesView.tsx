import { useState } from 'react';
import type { LicenseInquiryRecord, PipelineStage } from './types';

interface InquiriesViewProps {
  inquiries: LicenseInquiryRecord[];
  onChangeStage: (inquiryId: string, nextStage: PipelineStage) => Promise<void>;
}

const STAGE_LABELS: Record<PipelineStage, string> = {
  neu_eingegangen: 'Neu',
  in_abstimmung: 'Im Gespräch',
  vorvertrag_offen: 'Vertrag offen',
  abgeschlossen: 'Abgeschlossen',
};

const STAGE_BADGE_CLASSES: Record<PipelineStage, string> = {
  neu_eingegangen: 'border-amber-700 bg-amber-50 text-amber-950',
  in_abstimmung: 'border-sky-700 bg-sky-50 text-sky-950',
  vorvertrag_offen: 'border-purple-700 bg-purple-50 text-purple-950',
  abgeschlossen: 'border-emerald-700 bg-emerald-50 text-emerald-950',
};

function getNextLogicalStage(current: PipelineStage): {
  nextStage: PipelineStage;
  buttonLabel: string;
} | null {
  if (current === 'neu_eingegangen') {
    return {
      nextStage: 'in_abstimmung',
      buttonLabel: 'Auf „Im Gespräch“ setzen',
    };
  }
  if (current === 'in_abstimmung') {
    return {
      nextStage: 'vorvertrag_offen',
      buttonLabel: 'Auf „Vertrag offen“ setzen',
    };
  }
  if (current === 'vorvertrag_offen') {
    return {
      nextStage: 'abgeschlossen',
      buttonLabel: 'Als „Abgeschlossen“ markieren',
    };
  }
  return null;
}

export function InquiriesView({ inquiries, onChangeStage }: InquiriesViewProps) {
  const [selectedInquiryId, setSelectedInquiryId] = useState<string | null>(null);
  const [statusNotice, setStatusNotice] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [stageBusy, setStageBusy] = useState(false);

  const selectedInquiry =
    inquiries.find((inq) => inq.id === selectedInquiryId) || null;

  async function handleChangeStage(inquiryId: string, nextStage: PipelineStage) {
    setStageBusy(true);
    setActionError(null);
    try {
      await onChangeStage(inquiryId, nextStage);
      setStatusNotice(`Status wurde auf „${STAGE_LABELS[nextStage]}“ geändert.`);
    } catch (error) {
      setStatusNotice(null);
      setActionError(
        error instanceof Error
          ? error.message
          : 'Der Status konnte nicht geändert werden. Bitte versuche es erneut.'
      );
    } finally {
      setStageBusy(false);
    }
  }

  // Detailansicht einer einzelnen Anfrage
  if (selectedInquiry) {
    const nextAction = getNextLogicalStage(selectedInquiry.stage);

    return (
      <section aria-labelledby="inquiry-detail-heading" className="space-y-6">
        <div>
          <button
            type="button"
            onClick={() => {
              setSelectedInquiryId(null);
              setStatusNotice(null);
              setActionError(null);
            }}
            className="min-h-[44px] rounded border-2 border-stone-300 bg-white px-4 py-2 text-sm font-semibold text-stone-800 hover:bg-stone-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stone-950"
          >
            ← Zurück zu allen Anfragen
          </button>
        </div>

        <div className="rounded-lg border-2 border-stone-900 bg-white p-5 sm:p-6 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-stone-200 pb-4">
            <div>
              <h1 id="inquiry-detail-heading" className="text-2xl font-bold text-stone-950">
                Anfrage von {selectedInquiry.recipientName}
              </h1>
              <p className="mt-1 text-base text-stone-700">
                Zum Track „{selectedInquiry.trackTitle}“
              </p>
            </div>

            <span
              className={`rounded border px-3 py-1 text-sm font-bold ${
                STAGE_BADGE_CLASSES[selectedInquiry.stage]
              }`}
            >
              Status: {STAGE_LABELS[selectedInquiry.stage]}
            </span>
          </div>

          {statusNotice && (
            <div
              role="status"
              className="rounded border-2 border-emerald-700 bg-emerald-50 p-3 text-sm font-semibold text-emerald-950"
            >
              {statusNotice}
            </div>
          )}

          {actionError && (
            <div
              role="alert"
              className="rounded border-2 border-red-700 bg-red-50 p-3 text-sm font-semibold text-red-900"
            >
              {actionError}
            </div>
          )}

          <dl className="space-y-3 text-base text-stone-900">
            <div>
              <dt className="text-sm font-semibold text-stone-600">Projekt</dt>
              <dd className="font-bold">{selectedInquiry.productionTitle}</dd>
            </div>
            <div>
              <dt className="text-sm font-semibold text-stone-600">Geplante Nutzung</dt>
              <dd>{selectedInquiry.usageScope}</dd>
            </div>
            {selectedInquiry.message.trim() !== '' && (
              <div>
                <dt className="text-sm font-semibold text-stone-600">Nachricht</dt>
                <dd className="mt-1 rounded border border-stone-300 bg-stone-50 p-3 text-stone-800">
                  „{selectedInquiry.message}“
                </dd>
              </div>
            )}
          </dl>

          {/* Hauptknopf: immer nur der nächste sinnvolle Schritt */}
          <div className="border-t border-stone-200 pt-5 space-y-4">
            {nextAction ? (
              <button
                type="button"
                disabled={stageBusy}
                onClick={() => {
                  void handleChangeStage(selectedInquiry.id, nextAction.nextStage);
                }}
                className="w-full sm:w-auto min-h-[48px] rounded border-2 border-stone-950 bg-stone-950 px-6 py-3 text-base font-bold text-white hover:bg-stone-800 disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stone-950"
              >
                {stageBusy ? 'Wird gespeichert …' : nextAction.buttonLabel}
              </button>
            ) : (
              <p className="text-sm font-semibold text-emerald-900">
                Diese Anfrage ist abgeschlossen.
              </p>
            )}

            {/* Andere Status über eine Auswahl erreichbar */}
            <div className="pt-2">
              <label
                htmlFor="inquiry-other-stage-select"
                className="block text-sm font-semibold text-stone-700"
              >
                Anderen Status wählen
              </label>
              <select
                id="inquiry-other-stage-select"
                value={selectedInquiry.stage}
                disabled={stageBusy}
                onChange={(e) => {
                  const chosen = e.target.value as PipelineStage;
                  void handleChangeStage(selectedInquiry.id, chosen);
                }}
                className="mt-1 w-full sm:w-64 min-h-[44px] rounded border-2 border-stone-400 bg-white px-3 py-2 text-sm font-semibold text-stone-900 focus:border-stone-950 focus:outline-none"
              >
                <option value="neu_eingegangen">Neu</option>
                <option value="in_abstimmung">Im Gespräch</option>
                <option value="vorvertrag_offen">Vertrag offen</option>
                <option value="abgeschlossen">Abgeschlossen</option>
              </select>
            </div>
          </div>
        </div>
      </section>
    );
  }

  // Einfache Liste, neue Anfragen oben
  return (
    <section aria-labelledby="inquiries-list-heading" className="space-y-6">
      <div>
        <h1 id="inquiries-list-heading" className="text-2xl font-bold text-stone-950">
          Anfragen
        </h1>
        <p className="mt-1 text-base text-stone-700">
          Klicke auf eine Anfrage, um die Details zu lesen und den nächsten Schritt festzulegen.
        </p>
      </div>

      {inquiries.length === 0 ? (
        <div className="rounded-lg border-2 border-dashed border-stone-400 bg-white p-6 text-sm text-stone-700">
          Noch keine Anfragen eingegangen. Sobald jemand über deinen Link einen Track anfragt, erscheint die Anfrage hier ganz oben.
        </div>
      ) : (
        <ul className="space-y-3" aria-label="Liste der eingegangenen Anfragen">
          {inquiries.map((inq) => (
            <li key={inq.id}>
              <button
                type="button"
                onClick={() => {
                  setSelectedInquiryId(inq.id);
                  setStatusNotice(null);
                }}
                className="flex w-full min-h-[64px] flex-col gap-2 rounded-lg border-2 border-stone-300 bg-white p-4 text-left hover:border-stone-900 hover:bg-stone-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stone-950 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="space-y-0.5">
                  <span className="block text-base font-bold text-stone-950">
                    {inq.recipientName} · „{inq.trackTitle}“
                  </span>
                  <span className="block text-sm text-stone-700">
                    {inq.productionTitle}
                  </span>
                </div>

                <span
                  className={`inline-block self-start sm:self-center shrink-0 rounded border px-3 py-1 text-xs font-bold ${
                    STAGE_BADGE_CLASSES[inq.stage]
                  }`}
                >
                  {STAGE_LABELS[inq.stage]}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
