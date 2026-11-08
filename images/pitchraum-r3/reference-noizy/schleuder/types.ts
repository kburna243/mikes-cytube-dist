export type PlatformId = "instagram" | "facebook" | "youtube" | "tiktok" | "mixcloud" | "newsletter" | "spotify";
export type Placement = "feed" | "story" | "reel" | "community" | "description" | "event" | "mail" | "task";
export type PostStatus = "draft" | "ready" | "posted" | "skipped";
export type SlotType = "announce" | "reveal" | "pitch" | "presave" | "behind" | "countdown" | "tomorrow" | "release" | "thanks" | "studio" | "crate" | "recap" | "custom";

export type RenderRequest = {
  template: "gig" | "gem" | "release" | "mix" | "statement" | "studio";
  format: "post" | "portrait" | "story" | "youtube" | "event" | "flyer";
  theme: "paper" | "night" | "orange" | "olive";
  fields: { title?: string; year?: string; label?: string; statement?: string; subtitle?: string; platform?: string; story?: string; badge?: string };
  image?: string;
};

export type Post = {
  id: string;
  platform: PlatformId;
  placement: Placement;
  render?: RenderRequest;
  attachment?: { name: string; type: string; url: string };
  text: string;
  textEn?: string;
  hashtags: string[];
  status: PostStatus;
  postedAt?: string;
  postUrl?: string;
  headline?: string;
  variant?: number;
};

export type Slot = { id: string; day: number; time: string; type: SlotType; title: string; posts: Post[] };

export type Campaign = {
  id: string;
  kind: "single" | "ep" | "album" | "mix";
  title: string;
  releaseDate: string;
  label?: string;
  cover: string;
  tracks?: string[];
  message: string;
  messageEn?: string;
  links: Partial<Record<"presave" | "smartlink" | "spotify" | "applemusic" | "youtube" | "bandcamp" | "mixcloud", string>>;
  hashtags: string[];
  platforms: PlatformId[];
  slots: Slot[];
  createdAt: string;
  updatedAt: string;
};

export type SchleuderStore = {
  list(): Promise<Campaign[]>;
  save(campaign: Campaign): Promise<Campaign>;
  remove(id: string): Promise<void>;
};

export type ContentSchleuderProps = {
  assetBase: string;
  store: SchleuderStore;
  renderImage?: (request: RenderRequest) => Promise<Blob>;
  onOpenWerkstatt?: (request: RenderRequest) => void;
  uploadFile?: (file: File) => Promise<string>;
  library?: { path: string; name: string; role: string }[];
  socials?: { id: string; handle: string; url: string }[];
  fonts?: { display: string; mono: string };
};