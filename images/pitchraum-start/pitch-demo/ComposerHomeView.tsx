import React from 'react';
import type { PitchDemoState, PitchLinkRecord } from './types';

interface ComposerHomeViewProps {
  state: PitchDemoState;
  onStartSendMusic: () => void;
  onOpenInquiries: () => void;
  onOpenMyMusic: () => void;
  onPreviewLinkAsRecipient: (linkId: string) => void;
}

function getLinkPlainStatus(link: PitchLinkRecord): {
  label: 'Noch nicht geöffnet' | 'Geöffnet' | 'Angehört';
  badgeClass: string;
} {
  if (link.statusListened) {
    return {
      label: 'Angehört',
      badgeClass: 'border-emerald-700 bg-emerald-50 text-emerald-950',
    };
  }
  if (link.statusOpened) {
    return {
      label: 'Geöffnet',
      badgeClass: 'border-amber-700 bg-amber-50 text-amber-950',
    };
  }
  return {
    label: 'Noch nicht geöffnet',
    badgeClass: 'border-stone-400 bg-stone-100 text-stone-700',
  };
}

export function ComposerHomeView({
  state,
  onStartSendMusic,
  onOpenInquiries,
  onOpenMyMusic,
  onPreviewLinkAsRecipient,
}: ComposerHomeViewProps) {
  const firstName = state.composerName.split(' ')[0] || state.composerName;

  // Höchstens drei kurze Hinweise auf dem Startbildschirm
  const hints: { id: string; text: string; actionLabel: string; onClick: () => void }[] = [];

  const newInquiriesCount = state.inquiries.filter(
    (inq) => inq.stage === 'neu_eingegangen'
  ).length;
  const totalOpenInquiries = state.inquiries.filter(
    (inq) => inq.stage !== 'abgeschlossen'
  ).length;

  if (newInquiriesCount > 0) {
    hints.push({
      id: 'hint-new-inquiries',
      text:
        newInquiriesCount === 1
          ? '1 neue Anfrage wartet auf deine Antwort'
          : `${newInquiriesCount} neue Anfragen warten auf deine Antwort`,
      actionLabel: 'Ansehen',
      onClick: onOpenInquiries,
    });
  } else if (totalOpenInquiries > 0) {
    hints.push({
      id: 'hint-open-inquiries',
      text: `${totalOpenInquiries} offene Anfragen im Gespräch`,
      actionLabel: 'Ansehen',
      onClick: onOpenInquiries,
    });
  }

  const latestOpenedOrListened = state.pitchLinks.find(
    (l) => l.statusListened || l.statusOpened
  );
  if (latestOpenedOrListened) {
    hints.push({
      id: 'hint-link-activity',
      text: latestOpenedOrListened.statusListened
        ? `${latestOpenedOrListened.recipientName} hat in deinen Link reingehört`
        : `${latestOpenedOrListened.recipientName} hat deinen Link geöffnet`,
      actionLabel: 'Vorschau',
      onClick: () => onPreviewLinkAsRecipient(latestOpenedOrListened.id),
    });
  }

  hints.push({
    id: 'hint-music',
    text: 'Prüfe bei Gelegenheit die offenen Angaben bei deiner Musik',
    actionLabel: 'Zu meiner Musik',
    onClick: onOpenMyMusic,
  });

  const visibleHints = hints.slice(0, 3);

  return (
    <section aria-labelledby="start-greeting-heading" className="space-y-8">
      {/* Begrüßung, ein Satz & Hauptknopf */}
      <div className="rounded-lg border-2 border-stone-900 bg-white p-5 sm:p-6">
        <h1
          id="start-greeting-heading"
          className="text-2xl font-bold text-stone-950 sm:text-3xl"
        >
          Hallo {firstName}
        </h1>
        <p className="mt-1 text-base text-stone-700">
          Hier kannst du deine Musik direkt an eine Person beim Film oder Fernsehen schicken.
        </p>

        {/* Höchstens drei kurze Hinweise */}
        {visibleHints.length > 0 && (
          <ul
            aria-label="Aktuelle Hinweise"
            className="mt-4 space-y-2 border-t border-stone-200 pt-4"
          >
            {visibleHints.map((hint) => (
              <li
                key={hint.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded border border-stone-300 bg-stone-50 px-3 py-2 text-sm text-stone-900"
              >
                <span>{hint.text}</span>
                <button
                  type="button"
                  onClick={hint.onClick}
                  className="min-h-[44px] px-2 text-sm font-semibold text-stone-900 underline hover:text-stone-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stone-950"
                >
                  {hint.actionLabel} →
                </button>
              </li>
            ))}
          </ul>
        )}

        {/* Klar erkennbarer Hauptknopf */}
        <div className="mt-6">
          <button
            type="button"
            onClick={onStartSendMusic}
            className="w-full sm:w-auto min-h-[48px] rounded border-2 border-stone-950 bg-stone-950 px-6 py-3 text-base font-bold text-white hover:bg-stone-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stone-950"
          >
            Musik verschicken
          </button>
        </div>
      </div>

      {/* Zuletzt verschickte Links */}
      <div className="space-y-3">
        <h2 className="text-lg font-bold text-stone-950">Zuletzt verschickte Links</h2>

        {state.pitchLinks.length === 0 ? (
          <div className="rounded-lg border-2 border-dashed border-stone-400 bg-white p-6 text-sm text-stone-700">
            Du hast noch keinen Link verschickt. Klicke oben auf „Musik verschicken“, um deine erste Auswahl zusammenzustellen.
          </div>
        ) : (
          <ul className="space-y-3" aria-label="Zuletzt verschickte Links">
            {state.pitchLinks.map((link) => {
              const statusInfo = getLinkPlainStatus(link);
              const trackCount = link.trackIds.length;
              return (
                <li
                  key={link.id}
                  className="flex flex-col gap-3 rounded-lg border-2 border-stone-300 bg-white p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-base font-bold text-stone-950">
                        {link.recipientName}
                      </span>
                      <span
                        className={`inline-block rounded border px-2.5 py-0.5 text-xs font-bold ${statusInfo.badgeClass}`}
                      >
                        {statusInfo.label}
                      </span>
                    </div>
                    <p className="text-sm text-stone-700">
                      {link.productionTitle} · {trackCount === 1 ? '1 Track' : `${trackCount} Tracks`}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => onPreviewLinkAsRecipient(link.id)}
                    className="min-h-[44px] shrink-0 rounded border-2 border-stone-400 bg-stone-50 px-4 py-2 text-sm font-semibold text-stone-900 hover:bg-stone-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stone-950"
                  >
                    So sieht es der Empfänger
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </section>
  );
}
