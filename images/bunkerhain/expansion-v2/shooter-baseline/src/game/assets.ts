import atlas from "./atlas-frames.json";

export interface FrameRect { x: number; y: number; w: number; h: number; }
export type CharFrame = keyof typeof atlas.characters.frames;
export type UiFrame = keyof typeof atlas.ui.frames;

export const CHAR_FRAMES = atlas.characters.frames as Record<CharFrame, FrameRect>;
export const UI_FRAMES = atlas.ui.frames as Record<UiFrame, FrameRect>;

export const BG_SOURCES = [
  { key: "queue", src: "/assets/backgrounds/background-01-queue.png", label: "DIE SCHLANGE" },
  { key: "entrance", src: "/assets/backgrounds/background-02-entrance.png", label: "DIE TÜR" },
  { key: "cloakroom", src: "/assets/backgrounds/background-03-cloakroom.png", label: "DIE GARDEROBE" },
  { key: "dancefloor", src: "/assets/backgrounds/background-04-dancefloor.png", label: "DER FLOOR" },
  { key: "boss", src: "/assets/backgrounds/background-05-boss.png", label: "DER BETONTÜR-FINALE" },
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
  chars: HTMLImageElement;
  ui: HTMLImageElement;
}

function loadImage(src: string): Promise<HTMLImageElement> {
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
    img.onload = () => { cleanup(); res(img); };
    img.onerror = () => { cleanup(); rej(new Error("Grafik fehlt oder ist nicht lesbar: " + src)); };
    img.src = src;
  });
}

export async function loadAssets(onProgress: (p: number) => void): Promise<Assets> {
  const urls = [TITLE_SRC, ...BG_SOURCES.map((b) => b.src), CHAR_SRC, UI_SRC];
  let done = 0;
  const imgs = await Promise.all(
    urls.map((u) =>
      loadImage(u).then((i) => {
        done++;
        onProgress(done / urls.length);
        return i;
      }),
    ),
  );
  return {
    title: imgs[0],
    bgs: imgs.slice(1, 6),
    chars: imgs[6],
    ui: imgs[7],
  };
}
