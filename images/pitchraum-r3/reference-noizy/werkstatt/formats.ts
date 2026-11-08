import type { Format, FormatId } from "./types";

export const FORMATS: readonly Format[] = [
  { id: "post", name: "Instagram Post", shortName: "Post", width: 1080, height: 1080, ratio: "1:1" },
  { id: "portrait", name: "Instagram Hochformat", shortName: "Hochformat", width: 1080, height: 1350, ratio: "4:5" },
  { id: "story", name: "Story / Reel-Cover", shortName: "Story / Reel", width: 1080, height: 1920, ratio: "9:16", note: "Text bleibt oberhalb von 340 px und unterhalb von 250 px." },
  { id: "youtube", name: "YouTube-Thumbnail", shortName: "YouTube", width: 1280, height: 720, ratio: "16:9" },
  { id: "event", name: "Event-Header (Facebook, RA)", shortName: "Event-Header", width: 1920, height: 1005, ratio: "1.91:1" },
  { id: "flyer", name: "Flyer A5 hoch, Druck", shortName: "Flyer A5", width: 1748, height: 2480, ratio: "A5", note: "150 dpi. Mindestens 3 % Sicherheitsrand." },
];

export const getFormat = (id: FormatId): Format => FORMATS.find((format) => format.id === id)!;