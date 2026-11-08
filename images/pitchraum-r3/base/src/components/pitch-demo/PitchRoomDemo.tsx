import { useEffect, useMemo, useState } from 'react';
import {
  PITCH_PRODUCT_NAME,
  type ComposerSectionId,
  type PipelineStage,
  type PitchDemoState,
  type PitchLinkRecord,
} from './types';
import type {
  PitchApi,
  PublicLinkPayload,
  WorkspaceSnapshot,
} from '../../api/pitchApi';
import type { MyPageSettings } from '../../shared/brand';
import { DemoControlBar } from './DemoControlBar';
import { ComposerHomeView } from './ComposerHomeView';
import { SendMusicWizard } from './SendMusicWizard';
import { MyMusicView } from './MyMusicView';
import { InquiriesView } from './InquiriesView';
import { RecipientPitchView } from './RecipientPitchView';
import { MyPageSection } from '../../app-shell/myPage/MyPageSection';

const NAV_ITEMS: { id: 'start' | 'meine_musik' | 'anfragen' | 'meine_seite'; label: string }[] = [
  { id: 'start', label: 'Start' },
  { id: 'meine_musik', label: 'Meine Musik' },
  { id: 'anfragen', label: 'Anfragen' },
  { id: 'meine_seite', label: 'Meine Seite' },
];

interface PitchRoomDemoProps {
  api: PitchApi;
  initialSnapshot: WorkspaceSnapshot;
}

export function PitchRoomDemo({ api, initialSnapshot }: PitchRoomDemoProps) {
  const [state, setState] = useState<PitchDemoState>(initialSnapshot.state);
  const [myPage, setMyPage] = useState<MyPageSettings | null>(initialSnapshot.myPage);
  const [mode, setMode] = useState<'composer' | 'recipient'>('composer');
  const [composerSection, setComposerSection] = useState<ComposerSectionId>('start');
  const [activePitchLinkId, setActivePitchLinkId] = useState<string>(
    initialSnapshot.state.pitchLinks[0]?.id || ''
  );
  const [recipientPayload, setRecipientPayload] = useState<PublicLinkPayload | null>(null);

  const [busy, setBusy] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const previousTitle = document.title;
    document.title = `${PITCH_PRODUCT_NAME} – Demo`;
    return () => {
      document.title = previousTitle;
    };
  }, []);

  const activePitchLink = useMemo(() => {
    return (
      state.pitchLinks.find((l) => l.id === activePitchLinkId) ||
      state.pitchLinks[0] ||
      null
    );
  }, [state.pitchLinks, activePitchLinkId]);

  const newInquiryCount = useMemo(() => {
    return state.inquiries.filter((inq) => inq.stage === 'neu_eingegangen').length;
  }, [state.inquiries]);

  function applySnapshot(snapshot: WorkspaceSnapshot) {
    setState(snapshot.state);
    setMyPage(snapshot.myPage);
  }

  /** Führt eine Server-Aktion aus; zeigt bei Fehlern eine ehrliche Meldung. */
  async function runMutation(action: () => Promise<WorkspaceSnapshot>): Promise<void> {
    setBusy(true);
    setErrorMessage(null);
    try {
      const snapshot = await action();
      applySnapshot(snapshot);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : 'Etwas ist schiefgelaufen. Bitte versuche es erneut.'
      );
      throw error;
    } finally {
      setBusy(false);
    }
  }

  async function refreshSnapshot(): Promise<void> {
    try {
      applySnapshot(await api.getSnapshot());
    } catch {
      /* Vorschau-Fehler werden an der Stelle gemeldet, wo sie ausgelöst wurden */
    }
  }

  /** Öffnet die Empfänger-Vorschau über den echten öffentlichen Link (zählt als „Geöffnet“). */
  async function openRecipientPreview(linkId: string) {
    const link = state.pitchLinks.find((l) => l.id === linkId);
    if (!link) return;
    setBusy(true);
    setErrorMessage(null);
    try {
      const payload = await api.getPublicLink(link.token);
      setRecipientPayload(payload);
      setActivePitchLinkId(linkId);
      setMode('recipient');
      await refreshSnapshot();
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : 'Der Link lässt sich gerade nicht öffnen.'
      );
    } finally {
      setBusy(false);
    }
  }

  async function handleResetDemo() {
    try {
      await runMutation(() => api.resetWorkspace());
      setRecipientPayload(null);
      setMode('composer');
      setComposerSection('start');
      setActivePitchLinkId(state.pitchLinks[0]?.id || '');
    } catch {
      /* Fehlermeldung steht bereits im Banner */
    }
  }

  async function handleCreateLinkInWizard(input: {
    recipientName: string;
    productionTitle: string;
    personalNote: string;
    trackIds: string[];
  }): Promise<PitchLinkRecord> {
    setBusy(true);
    setErrorMessage(null);
    try {
      const result = await api.createPitchLink(input);
      applySnapshot(result.snapshot);
      setActivePitchLinkId(result.link.id);
      return result.link;
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : 'Der Link konnte nicht erstellt werden.'
      );
      throw error;
    } finally {
      setBusy(false);
    }
  }

  // Empfänger-Vorschau innerhalb der App (über den echten /l/:token-Datensatz)
  const recipientSection =
    mode === 'recipient' && recipientPayload ? (
      <RecipientPitchView
        tracks={recipientPayload.tracks}
        link={recipientPayload.link}
        composerName={recipientPayload.composerName}
        studioLabel={recipientPayload.studioLabel}
        rights={recipientPayload.rightsFiles}
        audioAvailability={recipientPayload.audioAvailability}
        audioSrcFor={(trackId) => api.audioSrcFor(recipientPayload.link.token, trackId)}
        embedded
        onPlayTrack={async (_linkId, trackId) => {
          const payload = await api.markLinkListened(recipientPayload.link.token, trackId);
          setRecipientPayload(payload);
          await refreshSnapshot();
        }}
        onSubmitInquiry={async (input) => {
          await api.createPublicInquiry(recipientPayload.link.token, {
            trackId: input.trackId,
            recipientName: input.recipientName,
            productionTitle: input.productionTitle,
            usageScope: input.usageScope,
            message: input.message,
          });
          await refreshSnapshot();
        }}
      />
    ) : null;

  return (
    <div data-app className="min-h-screen overflow-x-hidden bg-[#f1ece3] text-stone-900">
      {/* Schmale Demo-Leiste ganz oben (klar nicht Teil des Produkts) */}
      <DemoControlBar
        mode={mode}
        onSwitchMode={(nextMode) => {
          if (nextMode === 'recipient') {
            if (activePitchLink) {
              void openRecipientPreview(activePitchLink.id);
            }
          } else {
            setMode('composer');
          }
        }}
        pitchLinks={state.pitchLinks}
        activePitchLinkId={activePitchLink?.id || ''}
        onSelectPitchLink={(linkId) => {
          void openRecipientPreview(linkId);
        }}
        onResetDemo={() => {
          void handleResetDemo();
        }}
      />

      {/* Komponisten-Kopfbereich mit einfacher 4-Punkte-Navigation (nur für den Komponisten sichtbar) */}
      {mode === 'composer' && (
        <header className="border-b-2 border-stone-900 bg-[#f7f3ea]">
          <div className="mx-auto flex max-w-6xl flex-col gap-3 px-3 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => setComposerSection('start')}
                className="min-h-[44px] text-left text-2xl tracking-tight text-stone-950 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stone-950"
                style={{ fontFamily: "'Anybody Variable', sans-serif", fontWeight: 800, letterSpacing: '-0.03em' }}
              >
                {PITCH_PRODUCT_NAME}
              </button>
              <span className="text-xs text-stone-600 sm:hidden">{state.composerName}</span>
            </div>

            <nav aria-label="Hauptnavigation">
              <ul className="grid grid-cols-2 gap-2 sm:flex sm:items-center">
                {NAV_ITEMS.map((item) => {
                  const isActive =
                    composerSection === item.id ||
                    (item.id === 'start' && composerSection === 'musik_verschicken');
                  return (
                    <li key={item.id}>
                      <button
                        type="button"
                        aria-current={isActive ? 'page' : undefined}
                        onClick={() => setComposerSection(item.id)}
                        className={`flex min-h-[44px] w-full items-center justify-center gap-1.5 rounded border-2 px-3 py-2 text-sm font-bold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stone-950 ${
                          isActive
                            ? 'border-stone-950 bg-stone-950 text-white'
                            : 'border-stone-300 bg-stone-50 text-stone-900 hover:bg-stone-200'
                        }`}
                      >
                        <span>{item.label}</span>
                        {item.id === 'anfragen' && newInquiryCount > 0 && (
                          <span
                            className={`rounded-full px-1.5 py-0.5 text-xs font-bold ${
                              isActive
                                ? 'bg-amber-300 text-stone-950'
                                : 'bg-amber-200 text-stone-950'
                            }`}
                          >
                            {newInquiryCount}
                          </span>
                        )}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </nav>
          </div>
        </header>
      )}

      {/* Echte Fehlermeldung, falls eine Server-Aktion scheitert — niemals Ersatz-Daten */}
      {errorMessage && mode === 'composer' && (
        <div className="mx-auto max-w-6xl px-3 pt-4 sm:px-6">
          <div
            role="alert"
            className="rounded border-2 border-red-700 bg-red-50 p-3 text-sm font-semibold text-red-900"
          >
            {errorMessage}
          </div>
        </div>
      )}

      {/* Hauptinhalt: eine klare Aufgabe pro Bildschirm */}
      <main className="mx-auto max-w-6xl px-3 py-6 sm:px-6">
        {mode === 'recipient' ? (
          recipientPayload ? (
            recipientSection
          ) : (
            <div
              role="status"
              className="rounded-lg border-2 border-stone-300 bg-white p-6 text-base text-stone-800"
            >
              Der Link wird geladen …
            </div>
          )
        ) : (
          <>
            {composerSection === 'start' && (
              <ComposerHomeView
                state={state}
                onStartSendMusic={() => setComposerSection('musik_verschicken')}
                onOpenInquiries={() => setComposerSection('anfragen')}
                onOpenMyMusic={() => setComposerSection('meine_musik')}
                onPreviewLinkAsRecipient={(linkId) => void openRecipientPreview(linkId)}
              />
            )}

            {composerSection === 'musik_verschicken' && (
              <SendMusicWizard
                tracks={state.tracks}
                busy={busy}
                onCancel={() => setComposerSection('start')}
                onCreateLink={handleCreateLinkInWizard}
                onOpenAsRecipient={(linkId) => void openRecipientPreview(linkId)}
              />
            )}

            {composerSection === 'meine_musik' && (
              <MyMusicView
                state={state}
                onUpdateRightsField={async (trackId, field, value) => {
                  await runMutation(() => api.updateTrackRights(trackId, { [field]: value }));
                }}
                onAddSplit={async (trackId, input) => {
                  await runMutation(() => api.addSplit(trackId, input));
                }}
                onAddContract={async (trackId, input) => {
                  await runMutation(() => api.addContract(trackId, input));
                }}
              />
            )}

            {composerSection === 'anfragen' && (
              <InquiriesView
                inquiries={state.inquiries}
                onChangeStage={async (inquiryId: string, nextStage: PipelineStage) => {
                  await runMutation(() => api.updateInquiryStage(inquiryId, nextStage));
                }}
              />
            )}

            {composerSection === 'meine_seite' && (
              <MyPageSection
                tracks={state.tracks}
                composerName={state.composerName}
                myPage={myPage}
                busy={busy}
                onSave={async (settings: MyPageSettings) => {
                  setBusy(true);
                  setErrorMessage(null);
                  try {
                    const saved = await api.saveMyPage(settings);
                    setMyPage(saved);
                  } catch (error) {
                    setErrorMessage(
                      error instanceof Error
                        ? error.message
                        : 'Deine Seite konnte nicht gespeichert werden.'
                    );
                    throw error;
                  } finally {
                    setBusy(false);
                  }
                }}
              />
            )}
          </>
        )}
      </main>
    </div>
  );
}

export default PitchRoomDemo;
