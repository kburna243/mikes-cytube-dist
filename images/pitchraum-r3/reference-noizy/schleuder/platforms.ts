import type { Campaign, Placement, PlatformId, Post, PostStatus, RenderRequest } from "./types";
import { fullPostText } from "./captions";
import { calendarDifference, todayISO } from "./plan";

export type PlatformRule = {
  name: string;
  short: string;
  placements: { id: Placement; name: string; formats: RenderRequest["format"][] }[];
  textLimit?: number;
  recommendedText?: number;
  hashtagLimit?: number;
  hashtagRecommended?: [number, number];
  note: string;
};

export const PLATFORMS: Record<PlatformId, PlatformRule> = {
  instagram: {
    name: "Instagram", short: "IG", textLimit: 2200, hashtagLimit: 30, hashtagRecommended: [3, 8],
    placements: [{ id: "feed", name: "Feed", formats: ["post", "portrait"] }, { id: "story", name: "Story", formats: ["story"] }, { id: "reel", name: "Reel-Cover", formats: ["story"] }],
    note: "Links im Text sind nicht klickbar. Link in Bio nutzen, in Stories den Link-Sticker setzen.",
  },
  facebook: {
    name: "Facebook", short: "FB", recommendedText: 500, hashtagRecommended: [0, 3],
    placements: [{ id: "feed", name: "Beitrag", formats: ["post", "event"] }, { id: "event", name: "Event-Titelbild", formats: ["event"] }],
    note: "Links sind im Beitrag klickbar. Text möglichst kurz halten.",
  },
  youtube: {
    name: "YouTube", short: "YT", textLimit: 5000, hashtagRecommended: [3, 5],
    placements: [{ id: "community", name: "Community", formats: ["post"] }, { id: "feed", name: "Thumbnail", formats: ["youtube"] }, { id: "description", name: "Videobeschreibung", formats: ["youtube"] }],
    note: "Die ersten drei Hashtags stehen über dem Videotitel. Links in der Beschreibung sind klickbar.",
  },
  tiktok: {
    name: "TikTok", short: "TT", textLimit: 2200, hashtagRecommended: [3, 5],
    placements: [{ id: "reel", name: "Video / Cover", formats: ["story"] }, { id: "story", name: "Story", formats: ["story"] }],
    note: "Links im Text sind nicht klickbar. Ein eigenes Video kannst du anhängen.",
  },
  mixcloud: {
    name: "Mixcloud", short: "MC", hashtagLimit: 5,
    placements: [{ id: "feed", name: "Mix", formats: ["post"] }],
    note: "Kurze Beschreibung, Trackliste separat. Links sind klickbar.",
  },
  newsletter: {
    name: "Crate-Club-Newsletter", short: "CC", hashtagLimit: 0,
    placements: [{ id: "mail", name: "Newsletter", formats: ["event"] }],
    note: "Ein kurzer Text mit einem klaren, klickbaren Link. Betreff möglichst unter 60 Zeichen.",
  },
  spotify: {
    name: "Spotify for Artists", short: "SFA", textLimit: 500, hashtagLimit: 0,
    placements: [{ id: "task", name: "Aufgabe", formats: [] }],
    note: "Unveröffentlichte Songs mindestens 7 Tage vor Release pitchen, damit sie für Release Radar infrage kommen.",
  },
};

export const STATUS_LABELS: Record<PostStatus, string> = {
  draft: "Entwurf", ready: "Bereit", posted: "Gepostet", skipped: "Ausgelassen",
};

export function placementName(post: Pick<Post, "platform" | "placement">): string {
  return PLATFORMS[post.platform].placements.find((item) => item.id === post.placement)?.name || post.placement;
}

export function postWarnings(post: Post, campaign: Campaign): string[] {
  const rule = PLATFORMS[post.platform];
  const warnings: string[] = [];
  const length = fullPostText(post).length;
  const tags = post.hashtags.length;
  if (rule.textLimit && length > rule.textLimit) warnings.push(`${length} von ${rule.textLimit} Zeichen: über dem Plattform-Limit.`);
  if (rule.recommendedText && length > rule.recommendedText) warnings.push(`Über ${rule.recommendedText} Zeichen: kürzer wird empfohlen.`);
  if (rule.hashtagLimit !== undefined && tags > rule.hashtagLimit) warnings.push(rule.hashtagLimit === 0 ? "Hier sind keine Hashtags vorgesehen." : `Mehr als ${rule.hashtagLimit} Hashtags bzw. Tags.`);
  if (rule.hashtagRecommended && (tags < rule.hashtagRecommended[0] || tags > rule.hashtagRecommended[1])) warnings.push(`${rule.hashtagRecommended[0]} bis ${rule.hashtagRecommended[1]} Hashtags werden empfohlen.`);
  const placement = rule.placements.find((item) => item.id === post.placement);
  if (post.render && placement && !placement.formats.includes(post.render.format)) warnings.push(`Das Format ${post.render.format} ist für diese Platzierung nicht empfohlen.`);
  if (post.platform === "instagram") {
    const first = post.text.split("\n")[0]?.trim() || "";
    if (!first || first.length > 125) warnings.push("Die erste Zeile sollte kurz sein und allein funktionieren.");
    if (/https?:\/\//i.test(post.text)) warnings.push("Instagram-Links sind nicht klickbar und werden durch Link in Bio ersetzt.");
  }
  if (post.platform === "youtube" && (post.headline || "").length > 100) warnings.push("Der YouTube-Titel darf höchstens 100 Zeichen haben.");
  if (post.platform === "newsletter" && (post.headline || "").length >= 60) warnings.push("Für den Betreff werden weniger als 60 Zeichen empfohlen.");
  if (post.platform === "spotify" && post.status !== "posted") {
    const remaining = calendarDifference(todayISO(), campaign.releaseDate);
    if (remaining < 0) warnings.push("Der Release ist vorbei: Der Pitch für Release Radar ist zu spät.");
    else if (remaining < 7) warnings.push("Weniger als 7 Tage bis zum Release: Für Release Radar kann der Pitch zu spät sein.");
  }
  return warnings;
}