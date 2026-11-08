import React, { useEffect, useMemo, useState } from 'react';
import {
  PITCH_PRODUCT_NAME,
  type ComposerSectionId,
  type PipelineStage,
  type PitchDemoState,
  type PitchLinkRecord,
} from './types';
import {
  addContractToTrackRights,
  addSplitToTrackRights,
  createLicenseInquiry,
  createPitchLink,
  getPitchDemoState,
  markPitchLinkListened,
  markPitchLinkOpened,
  resetPitchDemoState,
  updateInquiryPipelineStage,
  updateTrackRightsMetadata,
} from './mockApi';
import { DemoControlBar } from './DemoControlBar';
import { ComposerHomeView } from './ComposerHomeView';
import { SendMusicWizard } from './SendMusicWizard';
import { MyMusicView } from './MyMusicView';
import { InquiriesView } from './InquiriesView';
import { RecipientPitchView } from './RecipientPitchView';

const NAV_ITEMS: { id: 'start' | 'meine_musik' | 'anfragen'; label: string }[] = [
  { id: 'start', label: 'Start' },
  { id: 'meine_musik', label: 'Meine Musik' },
  { id: 'anfragen', label: 'Anfragen' },
];

export function PitchRoomDemo() {
  const [state, setState] = useState<PitchDemoState>(() => getPitchDemoState());
  const [mode, setMode] = useState<'composer' | 'recipient'>('composer');
  const [composerSection, setComposerSection] = useState<ComposerSectionId>('start');
  const [activePitchLinkId, setActivePitchLinkId] = useState<string>(
    () => getPitchDemoState().pitchLinks[0]?.id || 'link-001'
  );

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

  function handleResetDemo() {
    const fresh = resetPitchDemoState();
    setState(fresh);
    setMode('composer');
    setComposerSection('start');
    setActivePitchLinkId(fresh.pitchLinks[0]?.id || 'link-001');
  }

  function handlePreviewLinkAsRecipient(linkId: string) {
    const updated = markPitchLinkOpened(linkId);
    setState(updated);
    setActivePitchLinkId(linkId);
    setMode('recipient');
  }

  function handleCreateLinkInWizard(input: {
    recipientName: string;
    productionTitle: string;
    personalNote: string;
    trackIds: string[];
  }): PitchLinkRecord {
    const updated = createPitchLink(input);
    setState(updated);
    const created = updated.pitchLinks[0];
    if (created) {
      setActivePitchLinkId(created.id);
    }
    return created;
  }

  function handlePlayTrackAsRecipient(linkId: string, trackId: string) {
    const updated = markPitchLinkListened(linkId, trackId);
    setState(updated);
  }

  function handleSubmitInquiryAsRecipient(input: {
    pitchLinkId: string;
    trackId: string;
    recipientName: string;
    productionTitle: string;
    usageScope: string;
    message: string;
  }) {
    const updated = createLicenseInquiry(input);
    setState(updated);
  }

  function handleChangeInquiryStage(inquiryId: string, nextStage: PipelineStage) {
    const updated = updateInquiryPipelineStage(inquiryId, nextStage);
    setState(updated);
  }

  function handleUpdateRightsField(
    trackId: string,
    field: 'isrcCode' | 'workRegistrationCode' | 'notes',
    value: string
  ) {
    const updated = updateTrackRightsMetadata(trackId, { [field]: value });
    setState(updated);
  }

  function handleAddSplit(
    trackId: string,
    input: {
      personName: string;
      role: string;
      sharePercent: number;
      optionalIdentifier?: string;
    }
  ) {
    const updated = addSplitToTrackRights(trackId, input);
    setState(updated);
  }

  function handleAddContract(
    trackId: string,
    input: {
      fileName: string;
      documentType: string;
      note: string;
    }
  ) {
    const updated = addContractToTrackRights(trackId, input);
    setState(updated);
  }

  return (
    <div className="min-h-screen overflow-x-hidden bg-stone-100 text-stone-900 font-sans">
      {/* Schmale Demo-Leiste ganz oben (klar nicht Teil des Produkts) */}
      <DemoControlBar
        mode={mode}
        onSwitchMode={(nextMode) => {
          if (nextMode === 'recipient' && activePitchLink) {
            const updated = markPitchLinkOpened(activePitchLink.id);
            setState(updated);
          }
          setMode(nextMode);
        }}
        pitchLinks={state.pitchLinks}
        activePitchLinkId={activePitchLink?.id || ''}
        onSelectPitchLink={(linkId) => {
          const updated = markPitchLinkOpened(linkId);
          setState(updated);
          setActivePitchLinkId(linkId);
        }}
        onResetDemo={handleResetDemo}
      />

      {/* Komponisten-Kopfbereich mit einfacher 3-Punkte-Navigation (nur für den Komponisten sichtbar) */}
      {mode === 'composer' && (
        <header className="border-b border-stone-300 bg-white">
          <div className="mx-auto flex max-w-4xl flex-col gap-3 px-3 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => setComposerSection('start')}
                className="min-h-[44px] text-left text-xl font-bold tracking-tight text-stone-950 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stone-950"
              >
                {PITCH_PRODUCT_NAME}
              </button>
              <span className="text-xs text-stone-600 sm:hidden">
                {state.composerName}
              </span>
            </div>

            <nav aria-label="Hauptnavigation">
              <ul className="grid grid-cols-3 gap-2 sm:flex sm:items-center">
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

      {/* Hauptinhalt: eine klare Aufgabe pro Bildschirm */}
      <main className="mx-auto max-w-4xl px-3 py-6 sm:px-6">
        {mode === 'recipient' ? (
          <RecipientPitchView
            state={state}
            activeLink={activePitchLink}
            onPlayTrack={handlePlayTrackAsRecipient}
            onSubmitInquiry={handleSubmitInquiryAsRecipient}
          />
        ) : (
          <>
            {composerSection === 'start' && (
              <ComposerHomeView
                state={state}
                onStartSendMusic={() => setComposerSection('musik_verschicken')}
                onOpenInquiries={() => setComposerSection('anfragen')}
                onOpenMyMusic={() => setComposerSection('meine_musik')}
                onPreviewLinkAsRecipient={handlePreviewLinkAsRecipient}
              />
            )}

            {composerSection === 'musik_verschicken' && (
              <SendMusicWizard
                tracks={state.tracks}
                onCancel={() => setComposerSection('start')}
                onCreateLink={handleCreateLinkInWizard}
                onOpenAsRecipient={handlePreviewLinkAsRecipient}
              />
            )}

            {composerSection === 'meine_musik' && (
              <MyMusicView
                state={state}
                onUpdateRightsField={handleUpdateRightsField}
                onAddSplit={handleAddSplit}
                onAddContract={handleAddContract}
              />
            )}

            {composerSection === 'anfragen' && (
              <InquiriesView
                inquiries={state.inquiries}
                onChangeStage={handleChangeInquiryStage}
              />
            )}
          </>
        )}
      </main>
    </div>
  );
}

export default PitchRoomDemo;
