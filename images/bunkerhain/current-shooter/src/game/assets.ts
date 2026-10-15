import atlas from "./atlas-frames.json";
import expansionFrames from "./expansion-frames.json";

export interface FrameRect { x: number; y: number; w: number; h: number; }
export interface Point { x: number; y: number; }

export interface SheetFrameDef {
  index: number;
  pose: string;
  rect: FrameRect;
  bounds: FrameRect;
  pivot: Point;
}

export interface SheetMeta {
  file: string;
  width: number;
  height: number;
  referencePixels?: { width: number; height: number };
  frames: SheetFrameDef[];
  clips?: Record<string, { frames: number[]; fps?: number; durationMs?: number; loop?: boolean }>;
}

export type CharFrame = keyof typeof atlas.characters.frames;
export type UiFrame = keyof typeof atlas.ui.frames;

export const CHAR_FRAMES = atlas.characters.frames as Record<CharFrame, FrameRect>;
export const UI_FRAMES = atlas.ui.frames as Record<UiFrame, FrameRect>;
export const EXPANSION_SHEETS = expansionFrames as Record<string, SheetMeta>;

export const BG_SOURCES_L1 = [
  { key: "queue", src: "/assets/backgrounds/background-01-queue.png", label: "DIE SCHLANGE" },
  { key: "entrance", src: "/assets/backgrounds/background-02-entrance.png", label: "DIE TÜR" },
  { key: "cloakroom", src: "/assets/backgrounds/background-03-cloakroom.png", label: "DIE GARDEROBE" },
  { key: "dancefloor", src: "/assets/backgrounds/background-04-dancefloor.png", label: "DER FLOOR" },
  { key: "boss", src: "/assets/backgrounds/background-05-boss.png", label: "DER BETONTÜR-FINALE" },
] as const;

export const BG_SOURCES = BG_SOURCES_L1;

export const BG_SOURCES_L2 = [
  { key: "boxi-arrival", src: "/assets/expansion/backgrounds/level2-01-boxi-arrival.png", label: "BOXHAGENER PLATZ · ANKUNFT" },
  { key: "market-setup", src: "/assets/expansion/backgrounds/level2-02-market-setup.png", label: "WOCHENMARKT · STANDAUFBAU" },
  { key: "granny-square", src: "/assets/expansion/backgrounds/level2-03-granny-square.png", label: "DIE GRÜNFLÄCHE · OMAS REVIER" },
] as const;

export const TITLE_SRC = "/assets/screens/title-screen.png";
export const CHAR_SRC = atlas.characters.image;
export const UI_SRC = atlas.ui.image;

/** Logische Spielauflösung = native Auflösung der Hintergrund-Art (16:9). */
export const VW = 1672;
export const VH = 941;

export interface Assets {
  title: HTMLImageElement;
  bgs: HTMLImageElement[];
  bgsL2: HTMLImageElement[];
  chars: HTMLImageElement;
  ui: HTMLImageElement;
  sheets: Record<string, HTMLImageElement>;
}

export function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((res, rej) => {
    const img = new Image();
    const cleanup = () => {
      window.clearTimeout(timeout);
      img.onload = null;
      img.onerror = null;
    };
    const timeout = window.setTimeout(() => {
      cleanup();
      img.src = "";
      rej(new Error("Zeitüberschreitung beim Laden: " + src));
    }, 15000);
    img.onload = () => {
      cleanup();
      res(img);
    };
    img.onerror = () => {
      cleanup();
      rej(new Error("Grafikdatei fehlt oder ist fehlerhaft: " + src));
    };
    img.src = src;
  });
}

export async function loadAssets(onProgress: (p: number) => void): Promise<Assets> {
  const l1Bgs = BG_SOURCES_L1.map((b) => ({ key: `bg1-${b.key}`, src: b.src }));
  const l2Bgs = BG_SOURCES_L2.map((b) => ({ key: `bg2-${b.key}`, src: b.src }));

  const sheetEntries = Object.entries(EXPANSION_SHEETS).map(([id, meta]) => ({
    id,
    src: meta.file,
  }));

  const allToLoad = [
    { type: "title", src: TITLE_SRC },
    ...l1Bgs.map((b) => ({ type: "bg1", src: b.src })),
    ...l2Bgs.map((b) => ({ type: "bg2", src: b.src })),
    { type: "chars", src: CHAR_SRC },
    { type: "ui", src: UI_SRC },
    ...sheetEntries.map((s) => ({ type: "sheet", id: s.id, src: s.src })),
  ];

  let done = 0;
  const total = allToLoad.length;

  const results = await Promise.all(
    allToLoad.map(async (item) => {
      const img = await loadImage(item.src);
      done++;
      onProgress(done / total);
      return { item, img };
    }),
  );

  const sheets: Record<string, HTMLImageElement> = {};
  const bgs1: HTMLImageElement[] = [];
  const bgs2: HTMLImageElement[] = [];
  let titleImg!: HTMLImageElement;
  let charsImg!: HTMLImageElement;
  let uiImg!: HTMLImageElement;

  for (const r of results) {
    if (r.item.type === "title") titleImg = r.img;
    else if (r.item.type === "chars") charsImg = r.img;
    else if (r.item.type === "ui") uiImg = r.img;
    else if (r.item.type === "bg1") bgs1.push(r.img);
    else if (r.item.type === "bg2") bgs2.push(r.img);
    else if (r.item.type === "sheet" && "id" in r.item && r.item.id) {
      sheets[r.item.id] = r.img;
    }
  }

  return {
    title: titleImg,
    bgs: bgs1,
    bgsL2: bgs2,
    chars: charsImg,
    ui: uiImg,
    sheets,
  };
}
