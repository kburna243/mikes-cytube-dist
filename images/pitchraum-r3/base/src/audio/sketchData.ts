/**
 * Drei Klangskizzen und die Ableitung einer eigenen Skizze für jeden Track.
 * Alles wird live im Browser mit Oszillatoren, Filtern und Rauschen erzeugt.
 * Keine Audiodateien, keine externen Quellen.
 */

export type SketchCharacter = 'ruhig' | 'treibend' | 'bedrohlich';

export interface SketchMeta {
  id: string;
  title: string;
  bpm: number;
  character: SketchCharacter;
  /** Grundton in Hertz, aus der Tonart abgeleitet */
  rootHz: number;
  accent: string;
  /** 0 ruhig, 1 treibend, 2 bedrohlich — steuert die Szene */
  mode: number;
}

/** Kinoschwarz, warmes Weiß. Die Akzentfarbe kommt immer vom Track. */
export const CINEMA = {
  black: '#08090A',
  nearBlack: '#0E1011',
  white: '#F2ECE1',
  dim: '#9B968C',
  line: 'rgba(242,236,225,0.18)',
} as const;

const HERO_META: SketchMeta[] = [
  {
    id: 'sketch-nebel',
    title: 'Nebel über dem Kanal',
    bpm: 84,
    character: 'ruhig',
    rootHz: 73.42, // D2
    accent: '#C3D3B6',
    mode: 0,
  },
  {
    id: 'sketch-kupfer',
    title: 'Kupferdraht & Puls',
    bpm: 118,
    character: 'treibend',
    rootHz: 55, // A1
    accent: '#E0864C',
    mode: 1,
  },
  {
    id: 'sketch-glashaus',
    title: 'Glashaus-Mechanik',
    bpm: 102,
    character: 'bedrohlich',
    rootHz: 65.41, // C2
    accent: '#D94B3D',
    mode: 2,
  },
];

export const HERO_SKETCHES = HERO_META;

const KEY_ROOTS: Record<string, number> = {
  c: 65.41,
  'c#': 69.3,
  db: 69.3,
  d: 73.42,
  'd#': 77.78,
  eb: 77.78,
  e: 82.41,
  f: 87.31,
  'f#': 92.5,
  gb: 92.5,
  g: 98,
  'g#': 103.83,
  ab: 103.83,
  a: 110,
  'a#': 116.54,
  bb: 116.54,
  b: 123.47,
  h: 123.47,
};

const ACCENTS: Record<SketchCharacter, string[]> = {
  ruhig: ['#C3D3B6', '#D6CDB4', '#B9CBBF'],
  treibend: ['#E0864C', '#D9A441', '#C97A3E'],
  bedrohlich: ['#D94B3D', '#C9603F', '#B8443C'],
};

export function characterFromMood(mood: string, title: string): SketchCharacter {
  const value = `${mood} ${title}`.toLowerCase();
  if (/bedroh|dunkel|angespannt|spannung|nacht|kalt|kühl|kuehl|isolation|druck/.test(value)) {
    return 'bedrohlich';
  }
  if (/treibend|dräng|draeng|puls|mechanik|beweg|schnell|energie|rhythm|fahrt/.test(value)) {
    return 'treibend';
  }
  return 'ruhig';
}

function rootFromKey(key?: string): number {
  if (!key) return 73.42;
  const cleaned = key.toLowerCase().replace(/-moll|-dur|moll|dur|\s/g, '').replace('♯', '#').trim();
  return KEY_ROOTS[cleaned] || 73.42;
}

function hash(text: string): number {
  let value = 2166136261;
  for (let index = 0; index < text.length; index += 1) {
    value ^= text.charCodeAt(index);
    value = Math.imul(value, 16777619);
  }
  return Math.abs(value);
}

/**
 * Jeder Track bekommt seine eigene Skizze aus Tempo, Stimmung und Tonart.
 * Der Akzent kommt aus einer kuratierten, kinotauglichen Familie — nie aus Violett.
 */
export function deriveSketchMeta(track: {
  id: string;
  title: string;
  bpm: number;
  mood: string;
  musicalKey?: string;
}): SketchMeta {
  const character = characterFromMood(track.mood, track.title);
  const palette = ACCENTS[character];
  const accent = palette[hash(track.id + track.title) % palette.length];
  return {
    id: track.id,
    title: track.title,
    bpm: Math.max(50, Math.min(160, track.bpm)),
    character,
    rootHz: rootFromKey(track.musicalKey),
    accent,
    mode: character === 'ruhig' ? 0 : character === 'treibend' ? 1 : 2,
  };
}

/** Nachbar-Grundtöne für Akkorde (kleine bzw. große Terz, Quinte). */
export function chordFrequencies(root: number, character: SketchCharacter): number[] {
  if (character === 'bedrohlich') return [root, root * 1.0595, root * 1.4142];
  if (character === 'treibend') return [root, root * 1.2, root * 1.5];
  return [root, root * 1.25, root * 1.5];
}
