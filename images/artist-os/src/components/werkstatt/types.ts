export type WerkstattGig = {
  date: string;
  venue: string;
  city: string;
  status: "TICKETS" | "CONFIRMED" | "SOLD OUT";
  note?: string;
};

export type WerkstattGem = {
  title: string;
  artist?: string;
  label: string;
  country?: string;
  badge: string;
  story?: string;
  img: string;
};

export type WerkstattRelease = {
  title: string;
  year: string;
  label: string;
  cover: string;
};

export type WerkstattProps = {
  assetBase: string;
  gigs?: WerkstattGig[];
  gems?: WerkstattGem[];
  release?: WerkstattRelease;
  fonts?: { display: string; mono: string };
};

export type TemplateId = "gig" | "gem" | "release" | "mix" | "statement" | "studio";
export type FormatId = "post" | "portrait" | "story" | "youtube" | "event" | "flyer";
export type ThemeId = "paper" | "night" | "orange" | "olive";
export type PhotoLook = "duotone" | "bw" | "original";
export type LogoPosition = "top-left" | "top-right" | "bottom-left" | "bottom-right" | "off";
export type FontFamilies = { display: string; mono: string };
export type TextureId = "off" | "papier" | "riso" | "raster";

export type Format = {
  id: FormatId;
  name: string;
  shortName: string;
  width: number;
  height: number;
  ratio: string;
  note?: string;
};

export type Theme = {
  id: ThemeId;
  name: string;
  background: string;
  text: string;
  accent: string;
};

export type LibraryAsset = {
  path: string;
  role: string;
  width: number;
  height: number;
  name: string;
};

export type DesignData = {
  template: TemplateId;
  date: string;
  venue: string;
  city: string;
  status: WerkstattGig["status"];
  note: string;
  title: string;
  artist: string;
  label: string;
  country: string;
  badge: string;
  story: string;
  year: string;
  subtitle: string;
  platform: string;
  statement: string;
  accentWord: number;
  image: string;
  photoLook: PhotoLook;
  crop: { x: number; y: number; zoom: number };
  logoPosition: LogoPosition;
  logoVariant: "badge" | "wordmark";
  texture: TextureId;
  sticker: string;
};

export type Box = { x: number; y: number; width: number; height: number };
export type DrawAssets = {
  image?: HTMLImageElement;
  logo?: HTMLImageElement;
  sticker?: HTMLImageElement;
  stickerBase?: HTMLImageElement;
  fonts: FontFamilies;
  photoRect?: Box;
};

export type TemplateRenderer = (
  ctx: CanvasRenderingContext2D,
  data: DesignData,
  format: Format,
  theme: Theme,
  assets: DrawAssets,
) => void;

export type RenderedArtwork = {
  canvas: HTMLCanvasElement;
  photoRect?: Box;
  imageSize?: { width: number; height: number };
};