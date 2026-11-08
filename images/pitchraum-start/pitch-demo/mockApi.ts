import {
  RIGHTS_STATUS_LABEL,
  type ContractDocumentEntry,
  type LicenseInquiryRecord,
  type PipelineStage,
  type PitchDemoState,
  type PitchLinkRecord,
  type PitchTrack,
  type SplitEntry,
  type TrackRightsFile,
} from './types';

/**
 * Fest eingetragene Fantasiedaten für die Oberflächen-Demo.
 * Enthält ausschließlich erfundene Personen, Projekte und Werke.
 * Keine Zufallsfunktionen, keine automatisch generierten Kennnummern.
 */
function createInitialFictionalState(): PitchDemoState {
  return {
    composerName: 'Lukas Mertens',
    studioLabel: 'Tonatelier Nordbrücke (Fiktiv)',
    tracks: [
      {
        id: 'trk-101',
        title: 'Nebel über dem Kanal',
        composer: 'Lukas Mertens',
        durationFormatted: '02:48',
        bpm: 84,
        musicalKey: 'D-Moll',
        genre: 'Kammer-Elektronik / Filmmusik',
        mood: 'Ruhig',
        instrumentation: 'Präpariertes Klavier, Cello, Analoger Subbass',
        description:
          'Getragenes Instrumentalstück mit klarem Themenaufbau für ruhige Einstiegsszenen und Dialogpassagen.',
        rightsStatus: RIGHTS_STATUS_LABEL,
      },
      {
        id: 'trk-102',
        title: 'Kupferdraht & Puls',
        composer: 'Lukas Mertens',
        durationFormatted: '03:12',
        bpm: 118,
        musicalKey: 'A-Moll',
        genre: 'Modularer Synth-Puls / Spannung',
        mood: 'Treibend',
        instrumentation: 'Modular-Synthesizer, Schlagwerk, Bassklarinette',
        description:
          'Rhythmisch präzises Motiv mit stetiger Steigerung ab Minute 01:20 für Bewegungs- und Montagesequenzen.',
        rightsStatus: RIGHTS_STATUS_LABEL,
      },
      {
        id: 'trk-103',
        title: 'Stille nach dem Regen',
        composer: 'Lukas Mertens & Mara Sören',
        durationFormatted: '02:34',
        bpm: 72,
        musicalKey: 'F-Dur',
        genre: 'Akustische Miniatur',
        mood: 'Warm',
        instrumentation: 'Konzertgitarre, Vibraphon, Streichquartett',
        description:
          'Offene, unaufdringliche Klangfläche mit viel Raum für gesprochene Sprache.',
        rightsStatus: RIGHTS_STATUS_LABEL,
      },
      {
        id: 'trk-104',
        title: 'Glashaus-Mechanik',
        composer: 'Lukas Mertens',
        durationFormatted: '02:56',
        bpm: 102,
        musicalKey: 'C-Moll',
        genre: 'Perkussive Kammermusik',
        mood: 'Angespannt',
        instrumentation: 'Marimba, Pizzicato-Streicher, Standtom',
        description:
          'Trockenes, präzises Uhrwerk-Motiv für Recherche-, Technik- oder Architektursequenzen.',
        rightsStatus: RIGHTS_STATUS_LABEL,
      },
      {
        id: 'trk-105',
        title: 'Nachtzug Richtung Küste',
        composer: 'Lukas Mertens',
        durationFormatted: '03:28',
        bpm: 96,
        musicalKey: 'E-Moll',
        genre: 'Post-Rock / Instrumental',
        mood: 'Weitläufig',
        instrumentation: 'Baritongitarre, Fender Rhodes, Besen-Schlagzeug',
        description:
          'Gleichmäßig rollendes Instrumental für Reisebilder und Abspannsequenzen.',
        rightsStatus: RIGHTS_STATUS_LABEL,
      },
    ],
    rightsFiles: {
      'trk-101': {
        trackId: 'trk-101',
        rightsStatus: RIGHTS_STATUS_LABEL,
        isrcCode: '',
        workRegistrationCode: '',
        splits: [
          {
            id: 'spl-1',
            personName: 'Lukas Mertens (Fiktiv)',
            role: 'Komposition & Produktion',
            sharePercent: 100,
            optionalIdentifier: '',
          },
        ],
        contracts: [
          {
            id: 'doc-1',
            fileName: 'eigenangabe-studio-nordbruecke-2026.pdf',
            documentType: 'Urheber-Notiz (Entwurf)',
            uploadedDate: '2026-02-10',
            note: 'Solo-Einspielung im eigenen Studio ohne Fremdmusiker.',
          },
        ],
        notes: 'Alle Spuren selbst eingespielt. Kennnummern noch nicht beantragt.',
      },
      'trk-102': {
        trackId: 'trk-102',
        rightsStatus: RIGHTS_STATUS_LABEL,
        isrcCode: '',
        workRegistrationCode: '',
        splits: [
          {
            id: 'spl-2',
            personName: 'Lukas Mertens (Fiktiv)',
            role: 'Komposition & Synthesizer',
            sharePercent: 80,
            optionalIdentifier: '',
          },
        ],
        contracts: [
          {
            id: 'doc-2a',
            fileName: 'aufnahme-notiz-kupferdraht.pdf',
            documentType: 'Aufnahmeprotokoll',
            uploadedDate: '2026-02-18',
            note: 'Synthesizer-Hauptspur dokumentiert, 20 % Anteil für Bassklarinette noch einzutragen.',
          },
        ],
        notes: '20 % Anteil für Gast-Bassklarinette muss noch ergänzt werden.',
      },
      'trk-103': {
        trackId: 'trk-103',
        rightsStatus: RIGHTS_STATUS_LABEL,
        isrcCode: '',
        workRegistrationCode: '',
        splits: [
          {
            id: 'spl-3a',
            personName: 'Lukas Mertens (Fiktiv)',
            role: 'Komposition & Gitarre',
            sharePercent: 60,
            optionalIdentifier: '',
          },
          {
            id: 'spl-3b',
            personName: 'Mara Sören (Fiktiv)',
            role: 'Ko-Komposition & Streicher-Arrangement',
            sharePercent: 40,
            optionalIdentifier: '',
          },
        ],
        contracts: [
          {
            id: 'doc-2',
            fileName: 'vereinbarung-mertens-soeren-entwurf.pdf',
            documentType: 'Vereinbarung (Intern)',
            uploadedDate: '2026-03-04',
            note: 'Aufteilung 60 / 40 zwischen den beiden Beteiligten abgestimmt.',
          },
        ],
        notes: 'Gemeinschaftswerk zweier fiktiver Urheber.',
      },
      'trk-104': {
        trackId: 'trk-104',
        rightsStatus: RIGHTS_STATUS_LABEL,
        isrcCode: '',
        workRegistrationCode: '',
        splits: [
          {
            id: 'spl-4',
            personName: 'Lukas Mertens (Fiktiv)',
            role: 'Komposition & Perkussion',
            sharePercent: 100,
            optionalIdentifier: '',
          },
        ],
        contracts: [],
        notes: 'Keine externen Samples verwendet. Unterlage fehlt noch.',
      },
      'trk-105': {
        trackId: 'trk-105',
        rightsStatus: RIGHTS_STATUS_LABEL,
        isrcCode: '',
        workRegistrationCode: '',
        splits: [
          {
            id: 'spl-5',
            personName: 'Lukas Mertens (Fiktiv)',
            role: 'Komposition & Einspielung',
            sharePercent: 100,
            optionalIdentifier: '',
          },
        ],
        contracts: [
          {
            id: 'doc-3',
            fileName: 'studio-protokoll-nachtzug.pdf',
            documentType: 'Aufnahmeprotokoll',
            uploadedDate: '2026-03-19',
            note: 'Dokumentation der verwendeten Instrumente.',
          },
        ],
        notes: 'Instrumentale Originalaufnahme.',
      },
    },
    pitchLinks: [
      {
        id: 'link-001',
        slug: 'auswahl-nordlicht-serie',
        recipientName: 'Clara Lindqvist (Fiktiv)',
        productionTitle: 'Nordlicht Filmproduktion — Mehrteiler „Hafengrau“',
        personalNote:
          'Hallo Clara, hier sind vier ausgewählte Instrumentalstücke für die Rohschnitt-Sichtung von Folge 2.',
        trackIds: ['trk-101', 'trk-102', 'trk-103', 'trk-105'],
        createdDate: '2026-04-02',
        statusOpened: true,
        statusListened: true,
        lastListenedTrackId: 'trk-101',
      },
      {
        id: 'link-002',
        slug: 'auswahl-architektur-doku',
        recipientName: 'Henrik Vester (Fiktiv)',
        productionTitle: 'Studio Elbwerk — Dokumentarfilm „Glas & Stahl“',
        personalNote:
          'Hallo Henrik, wie besprochen die beiden perkussiven Motive sowie das ruhige Schlussthema.',
        trackIds: ['trk-102', 'trk-104', 'trk-105'],
        createdDate: '2026-04-08',
        statusOpened: true,
        statusListened: false,
        lastListenedTrackId: null,
      },
    ],
    inquiries: [
      {
        id: 'inq-002',
        pitchLinkId: 'link-001',
        trackId: 'trk-105',
        trackTitle: 'Nachtzug Richtung Küste',
        recipientName: 'Clara Lindqvist (Fiktiv)',
        productionTitle: 'Nordlicht Filmproduktion — Mehrteiler „Hafengrau“',
        usageScope: 'Abspannmusik Staffel 1 (Europa, 5 Jahre)',
        message:
          'Wir möchten dieses Stück für den Abspann vormerken. Bitte Konditionen für eine einfache Synchronisationslizenz zusenden.',
        createdDate: '2026-04-06',
        stage: 'neu_eingegangen',
      },
      {
        id: 'inq-001',
        pitchLinkId: 'link-001',
        trackId: 'trk-101',
        trackTitle: 'Nebel über dem Kanal',
        recipientName: 'Clara Lindqvist (Fiktiv)',
        productionTitle: 'Nordlicht Filmproduktion — Mehrteiler „Hafengrau“',
        usageScope: 'TV- & Mediathek-Nutzung (DACH, 3 Jahre, Hintergrundmusik Folge 2)',
        message:
          'Das Motiv passt gut unter die Eröffnungsszene am Kai. Wir bitten um Rückmeldung zur Verfügbarkeit der Einzelspuren.',
        createdDate: '2026-04-05',
        stage: 'in_abstimmung',
      },
    ],
  };
}

let currentState: PitchDemoState = createInitialFictionalState();
let deterministicCounter = 10;

function nextDeterministicId(prefix: string): string {
  deterministicCounter += 1;
  return `${prefix}-${String(deterministicCounter).padStart(3, '0')}`;
}

function slugifyDeterministic(text: string): string {
  const cleaned = text
    .toLowerCase()
    .replace(/ä/g, 'ae')
    .replace(/ö/g, 'oe')
    .replace(/ü/g, 'ue')
    .replace(/ß/g, 'ss')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return cleaned || 'pitch-auswahl';
}

/**
 * Prüft verständlich, welche Angaben bei einem Track noch fehlen.
 * Freiwillige Felder (ISRC, Werknummer) zählen ausdrücklich nicht als fehlend.
 */
export function getTrackMissingReasons(
  track: PitchTrack,
  rightsFile?: TrackRightsFile
): string[] {
  const missing: string[] = [];
  if (!track.description.trim()) {
    missing.push('Kurzbeschreibung zum Track fehlt noch.');
  }
  if (!rightsFile || rightsFile.splits.length === 0) {
    missing.push('Es ist noch keine beteiligte Person bei den Anteilen eingetragen.');
  } else {
    const sum = rightsFile.splits.reduce((acc, item) => acc + item.sharePercent, 0);
    if (sum !== 100) {
      missing.push(`Die Summe der Anteile beträgt ${sum} % (sollte 100 % ergeben).`);
    }
  }
  if (!rightsFile || rightsFile.contracts.length === 0) {
    missing.push('Es ist noch keine Unterlage (z. B. Vereinbarung oder Protokoll) hinterlegt.');
  }
  return missing;
}

export function getPitchDemoState(): PitchDemoState {
  return structuredClone(currentState);
}

export function resetPitchDemoState(): PitchDemoState {
  deterministicCounter = 10;
  currentState = createInitialFictionalState();
  return getPitchDemoState();
}

export function createPitchLink(input: {
  recipientName: string;
  productionTitle: string;
  personalNote: string;
  trackIds: string[];
}): PitchDemoState {
  const id = nextDeterministicId('link');
  const slugBase = slugifyDeterministic(
    `${input.recipientName}-${input.productionTitle}`.slice(0, 36)
  );
  const newLink: PitchLinkRecord = {
    id,
    slug: `${slugBase}-${id}`,
    recipientName: input.recipientName.trim(),
    productionTitle: input.productionTitle.trim(),
    personalNote: input.personalNote.trim(),
    trackIds: [...input.trackIds],
    createdDate: '2026-04-12',
    statusOpened: false,
    statusListened: false,
    lastListenedTrackId: null,
  };
  currentState = {
    ...currentState,
    pitchLinks: [newLink, ...currentState.pitchLinks],
  };
  return getPitchDemoState();
}

export function markPitchLinkOpened(linkId: string): PitchDemoState {
  currentState = {
    ...currentState,
    pitchLinks: currentState.pitchLinks.map((link) =>
      link.id === linkId ? { ...link, statusOpened: true } : link
    ),
  };
  return getPitchDemoState();
}

export function markPitchLinkListened(linkId: string, trackId: string): PitchDemoState {
  currentState = {
    ...currentState,
    pitchLinks: currentState.pitchLinks.map((link) =>
      link.id === linkId
        ? {
            ...link,
            statusOpened: true,
            statusListened: true,
            lastListenedTrackId: trackId,
          }
        : link
    ),
  };
  return getPitchDemoState();
}

export function createLicenseInquiry(input: {
  pitchLinkId: string;
  trackId: string;
  recipientName: string;
  productionTitle: string;
  usageScope: string;
  message: string;
}): PitchDemoState {
  const track = currentState.tracks.find((t) => t.id === input.trackId);
  const newInquiry: LicenseInquiryRecord = {
    id: nextDeterministicId('inq'),
    pitchLinkId: input.pitchLinkId,
    trackId: input.trackId,
    trackTitle: track ? track.title : 'Unbekannter Titel',
    recipientName: input.recipientName.trim(),
    productionTitle: input.productionTitle.trim(),
    usageScope: input.usageScope.trim(),
    message: input.message.trim(),
    createdDate: '2026-04-12',
    stage: 'neu_eingegangen',
  };
  currentState = {
    ...currentState,
    inquiries: [newInquiry, ...currentState.inquiries],
  };
  return getPitchDemoState();
}

export function updateInquiryPipelineStage(
  inquiryId: string,
  nextStage: PipelineStage
): PitchDemoState {
  currentState = {
    ...currentState,
    inquiries: currentState.inquiries.map((inq) =>
      inq.id === inquiryId ? { ...inq, stage: nextStage } : inq
    ),
  };
  return getPitchDemoState();
}

export function updateTrackRightsMetadata(
  trackId: string,
  patch: {
    isrcCode?: string;
    workRegistrationCode?: string;
    notes?: string;
  }
): PitchDemoState {
  const existing = currentState.rightsFiles[trackId];
  if (!existing) return getPitchDemoState();

  currentState = {
    ...currentState,
    rightsFiles: {
      ...currentState.rightsFiles,
      [trackId]: {
        ...existing,
        isrcCode: patch.isrcCode !== undefined ? patch.isrcCode : existing.isrcCode,
        workRegistrationCode:
          patch.workRegistrationCode !== undefined
            ? patch.workRegistrationCode
            : existing.workRegistrationCode,
        notes: patch.notes !== undefined ? patch.notes : existing.notes,
      },
    },
  };
  return getPitchDemoState();
}

export function addSplitToTrackRights(
  trackId: string,
  input: {
    personName: string;
    role: string;
    sharePercent: number;
    optionalIdentifier?: string;
  }
): PitchDemoState {
  const existing = currentState.rightsFiles[trackId];
  if (!existing) return getPitchDemoState();

  const newSplit: SplitEntry = {
    id: nextDeterministicId('spl'),
    personName: input.personName.trim(),
    role: input.role.trim(),
    sharePercent: input.sharePercent,
    optionalIdentifier: input.optionalIdentifier ? input.optionalIdentifier.trim() : '',
  };

  currentState = {
    ...currentState,
    rightsFiles: {
      ...currentState.rightsFiles,
      [trackId]: {
        ...existing,
        splits: [...existing.splits, newSplit],
      },
    },
  };
  return getPitchDemoState();
}

export function addContractToTrackRights(
  trackId: string,
  input: {
    fileName: string;
    documentType: string;
    note: string;
  }
): PitchDemoState {
  const existing = currentState.rightsFiles[trackId];
  if (!existing) return getPitchDemoState();

  const newDoc: ContractDocumentEntry = {
    id: nextDeterministicId('doc'),
    fileName: input.fileName.trim(),
    documentType: input.documentType.trim(),
    uploadedDate: '2026-04-12',
    note: input.note.trim(),
  };

  currentState = {
    ...currentState,
    rightsFiles: {
      ...currentState.rightsFiles,
      [trackId]: {
        ...existing,
        contracts: [...existing.contracts, newDoc],
      },
    },
  };
  return getPitchDemoState();
}
