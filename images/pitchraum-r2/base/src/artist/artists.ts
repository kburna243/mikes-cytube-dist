import type { ArtistProfile } from './types';

/**
 * Drei erfundene Beispielkünstlerinnen und -künstler.
 * Jeder mit eigenem Markenpaket (JSON), eigener Gestalt und eigenem Inhalt.
 * Alle beschriftet als fiktiv — keine echten Personen, Werke oder Firmen.
 */
export const ARTIST_PROFILES: ArtistProfile[] = [
  {
    slug: 'aya-dornbusch',
    name: 'Aya Dornbusch',
    roleLine: 'Komponistin · Kammer-Elektronik (Fiktiv)',
    tagline: 'Leise Systeme für laute Bilder — Musik für Serien und Dokumentation.',
    intro:
      'Ich baue Stücke aus wenigen, genau gesetzten Klängen: präpariertes Klavier, kurze Synthesizer-Figuren, viel Luft. Gesucht sind Plätze, an denen Musik tragen darf, ohne zu drängen — Eröffnungen, verhaltene Dialoge, lange Einstellungen. (Diese Seite ist ein fiktives Beispiel der Demo.)',
    layoutId: 'plakat',
    brand: {
      name: 'Nachtsignal',
      toneKeywords: ['kühl', 'präzise', 'nächtlich'],
      values: {
        '--brand-primary': '#9AF0E0',
        '--brand-secondary': '#161D3B',
        '--brand-background': '#0B1026',
        '--brand-accent': '#FF6B6B',
        '--brand-text': '#EDEFF8',
        '--font-family-display': "'Space Grotesk', 'Arial Narrow', sans-serif",
        '--font-family-body': "'Inter', 'Helvetica Neue', Arial, sans-serif",
        '--font-family-mono': "'IBM Plex Mono', 'Courier New', monospace",
      },
    },
    tracks: [
      {
        id: 'ad-1',
        catalogNo: 'AD-01',
        title: 'Sperrgut',
        durationFormatted: '03:04',
        bpm: 76,
        genre: 'Kammer-Elektronik',
        mood: 'Verhalten',
        instrumentation: 'Präpariertes Klavier, Glasharmonika-Fläche',
        description:
          'Einzelne Klaviertöne über einem kaum hörbaren Puls; trägt Eröffnungen und Übergänge.',
      },
      {
        id: 'ad-2',
        catalogNo: 'AD-02',
        title: 'Nordkanal Nachts',
        durationFormatted: '02:41',
        bpm: 88,
        genre: 'Filmmusik / Minimal',
        mood: 'Ruhig',
        instrumentation: 'Cello-Harmonien, analoger Subbass',
        description:
          'Breite, dunkle Fläche mit langsamem Cello-Licht — für nächtliche Außenaufnahmen gedacht.',
      },
      {
        id: 'ad-3',
        catalogNo: 'AD-03',
        title: 'Betonsalon',
        durationFormatted: '03:29',
        bpm: 104,
        genre: 'Perkussive Elektronik',
        mood: 'Sachlich',
        instrumentation: 'Kleines Schlagwerk, Präpariertes Klavier',
        description:
          'Trockenes Muster, das Recherche- und Werkstattbilder in Bewegung hält.',
      },
      {
        id: 'ad-4',
        catalogNo: 'AD-04',
        title: 'Funkstille Mai',
        durationFormatted: '02:12',
        bpm: 66,
        genre: 'Akustische Miniatur',
        mood: 'Offen',
        instrumentation: 'Konzertgitarre, Stimme ohne Worte',
        description:
          'Sehr reduziertes Stück für stille Momente nach einer Wendung.',
      },
    ],
  },
  {
    slug: 'bendix-halvar',
    name: 'Bendix Halvar',
    roleLine: 'Komponist & Producer · Filmmusik (Fiktiv)',
    tagline: 'Große Flächen, lange Schwünge — Musik, die Bilder breiter macht.',
    intro:
      'Ich schreibe für den Rohschnitt: Themen, die Fernfahrer-Geduld haben und in der letzten Minute kippen können. Orchestral aufgenommen, elektronisch nachgeschärft. (Diese Seite ist ein fiktives Beispiel der Demo.)',
    layoutId: 'leinwand',
    brand: {
      name: 'Kinoleitung',
      toneKeywords: ['bildstark', 'düster', 'weiträumig'],
      values: {
        '--brand-primary': '#DDE3EA',
        '--brand-secondary': '#17181D',
        '--brand-background': '#0A0A0C',
        '--brand-accent': '#E23A2E',
        '--brand-text': '#F6F7F9',
        '--font-family-display': "'Bebas Neue', 'Arial Narrow', Impact, sans-serif",
        '--font-family-body': "'Work Sans', Verdana, sans-serif",
        '--font-family-mono': "'IBM Plex Mono', 'Courier New', monospace",
      },
    },
    tracks: [
      {
        id: 'bh-1',
        catalogNo: 'BH-01',
        title: 'Landebahn Grau',
        durationFormatted: '03:52',
        bpm: 72,
        genre: 'Orchestral / Hybrid',
        mood: 'Weiträumig',
        instrumentation: 'Streicher-Cluster, Taiko, Synth-Sub',
        description:
          'Weitwinkel-Fläche mit drohendem Puls — für Drohnenflüge und Anreisen.',
      },
      {
        id: 'bh-2',
        catalogNo: 'BH-02',
        title: 'Funkfeuer',
        durationFormatted: '02:58',
        bpm: 122,
        genre: 'Spannung / Puls',
        mood: 'Drängend',
        instrumentation: 'Ostinato-Streicher, Metallpercussion',
        description:
          'Kurzes, hartes Ostinato; gemacht für Countdowns und Eingreiftruppen.',
      },
      {
        id: 'bh-3',
        catalogNo: 'BH-03',
        title: 'Kaltwasser',
        durationFormatted: '04:10',
        bpm: 60,
        genre: 'Dunkle Textur',
        mood: 'Kühl',
        instrumentation: 'Allein Cello, gesampelter Wind',
        description:
          'Ein einzelnes Cello gegen Windrauschen — Isolation in einem Bild.',
      },
      {
        id: 'bh-4',
        catalogNo: 'BH-04',
        title: 'Wiedereintritt',
        durationFormatted: '03:21',
        bpm: 96,
        genre: 'Hybridstruktur',
        mood: 'Treibend',
        instrumentation: 'Blechbläser-Stabs, Sequenzer',
        description:
          'Steigert sich in drei klaren Stufen — gut unter Montagen schneidbar.',
      },
      {
        id: 'bh-5',
        catalogNo: 'BH-05',
        title: 'Heimspur',
        durationFormatted: '02:47',
        bpm: 84,
        genre: 'Theme / Piano',
        mood: 'Warm',
        instrumentation: 'Filtriertes Klavier, Bratschen',
        description:
          'Schlichtes Rückkehr-Thema für Schlussbilder und nächste Folgen.',
      },
    ],
  },
  {
    slug: 'maroa-quell',
    name: 'Maroa Quell',
    roleLine: 'Sounddesignerin & Komponistin (Fiktiv)',
    tagline: 'Katalog feiner Texturen für Reportage, Podcast und Essayfilm.',
    intro:
      'Ich sammele Klänge wie Fundstücke: gedämpfte Posaune, Bandrauschen, kleine Motoren. Meine Stücke sind bewusst unauffällig gebaut, damit gesprochene Sprache daneben bestehen kann. (Diese Seite ist ein fiktives Beispiel der Demo.)',
    layoutId: 'archiv',
    brand: {
      name: 'Fundbüro',
      toneKeywords: ['sachlich', 'archivarisch', 'warm'],
      values: {
        '--brand-primary': '#37523F',
        '--brand-secondary': '#E7EBE0',
        '--brand-background': '#F7F8F4',
        '--brand-accent': '#B03A28',
        '--brand-text': '#1C231F',
        '--font-family-display': "'Fraunces', Georgia, serif",
        '--font-family-body': "'Inter', 'Helvetica Neue', Arial, sans-serif",
        '--font-family-mono': "'IBM Plex Mono', 'Courier New', monospace",
      },
    },
    tracks: [
      {
        id: 'mq-1',
        catalogNo: 'MQ-01',
        title: 'Regal 14',
        durationFormatted: '02:20',
        bpm: 70,
        genre: 'Textur / Ambient',
        mood: 'Neutral',
        instrumentation: 'Bandrauschen, Posaunen-Dauerton',
        description:
          'Ruhige Arbeitsfläche unter Recherche und Archivbild.',
      },
      {
        id: 'mq-2',
        catalogNo: 'MQ-02',
        title: 'Kleines Uhrwerk Süd',
        durationFormatted: '02:36',
        bpm: 94,
        genre: 'Akustischer Minimal',
        mood: 'Geschäftig',
        instrumentation: 'Kalimba, gedämpftes Schlagzeug',
        description:
          'Handwerklicher Puls für Bau-, Werkstatt- und Stadtszenen.',
      },
      {
        id: 'mq-3',
        catalogNo: 'MQ-03',
        title: 'Windpark-Studie',
        durationFormatted: '03:05',
        bpm: 78,
        genre: 'Field Recording / Fläche',
        mood: 'Offen',
        instrumentation: 'Aufgenommener Wind, E-Bow-Gitarre',
        description:
          'Wind trägt eine langsame Gitarrenlinie — Energie- und Landschaftsthemen.',
      },
      {
        id: 'mq-4',
        catalogNo: 'MQ-04',
        title: 'Telegrammstil',
        durationFormatted: '01:58',
        bpm: 112,
        genre: 'Kurze Elektronik',
        mood: 'Präzise',
        instrumentation: 'Sequenzer, gepolsterte Klicks',
        description:
          'Kurz und klar, für grafische Einblendungen und Karten.',
      },
      {
        id: 'mq-5',
        catalogNo: 'MQ-05',
        title: 'Abenddienstag',
        durationFormatted: '02:44',
        bpm: 68,
        genre: 'Warme Miniatur',
        mood: 'Warm',
        instrumentation: 'Konzertgitarre, Harmonium',
        description:
          'Leichtes Schlussstück für Porträts und Epiloge.',
      },
      {
        id: 'mq-6',
        catalogNo: 'MQ-06',
        title: 'Fundstück Nacht',
        durationFormatted: '03:18',
        bpm: 60,
        genre: 'Dunkle Textur',
        mood: 'Verhalten',
        instrumentation: 'Gedämpftes Piano, leises Bandrauschen',
        description:
          'Spärliche Textur für nächtliche Innenräume.',
      },
    ],
  },
];

export function findArtistBySlug(slug: string): ArtistProfile | null {
  return ARTIST_PROFILES.find((artist) => artist.slug === slug) || null;
}
