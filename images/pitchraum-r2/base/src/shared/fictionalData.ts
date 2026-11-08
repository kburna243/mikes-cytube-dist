import {
  RIGHTS_STATUS_LABEL,
  type PitchDemoState,
} from '../components/pitch-demo/types';

/**
 * Fest eingetragene Fantasiedaten für die Demo.
 * Enthält ausschließlich erfundene Personen, Projekte und Werke.
 * Keine Zufallsfunktionen, keine automatisch generierten Kennnummern.
 *
 * Wird vom Demo-Server beim Anlegen eines Arbeitsbereichs verwendet und
 * auf der öffentlichen Website für statische Ausschnitte der Oberfläche.
 * Die Tokens der Empfängerlinks vergibt der Server je Arbeitsbereich neu.
 */
export function createInitialFictionalState(): PitchDemoState {
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
        token: '',
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
        token: '',
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
