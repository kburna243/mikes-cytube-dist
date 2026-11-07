import { captionFor, captionForEn, hashtagsFor } from "./captions";
import type { Campaign, Placement, PlatformId, Post, RenderRequest, Slot, SlotType } from "./types";

type BlueprintPost = [PlatformId, Placement, RenderRequest["template"]?, RenderRequest["format"]?];
type Blueprint = { day: number; type: SlotType; title: string; posts: BlueprintPost[] };

const blueprint: Blueprint[] = [
  { day: -21, type: "announce", title: "Ankündigung", posts: [["instagram", "feed", "statement", "portrait"], ["instagram", "story", "statement", "story"], ["facebook", "feed", "statement", "post"]] },
  { day: -14, type: "reveal", title: "Cover-Reveal", posts: [["instagram", "feed", "release", "post"], ["instagram", "story", "release", "story"], ["facebook", "feed", "release", "post"], ["tiktok", "reel", "release", "story"]] },
  { day: -14, type: "pitch", title: "Spotify-Pitch", posts: [["spotify", "task"]] },
  { day: -10, type: "presave", title: "Pre-Save", posts: [["instagram", "story", "release", "story"], ["newsletter", "mail", "release", "event"]] },
  { day: -7, type: "behind", title: "Hinter den Kulissen", posts: [["instagram", "feed", "studio", "portrait"], ["youtube", "community", "studio", "post"]] },
  { day: -3, type: "countdown", title: "Countdown", posts: [["instagram", "story", "statement", "story"]] },
  { day: -1, type: "tomorrow", title: "Morgen", posts: [["instagram", "story", "statement", "story"], ["facebook", "feed", "statement", "post"]] },
  { day: 0, type: "release", title: "Release", posts: [["instagram", "feed", "release", "post"], ["instagram", "story", "release", "story"], ["facebook", "feed", "release", "event"], ["youtube", "community", "release", "post"], ["newsletter", "mail", "release", "event"], ["mixcloud", "feed", "mix", "post"], ["tiktok", "reel", "release", "story"]] },
  { day: 1, type: "thanks", title: "Danke", posts: [["instagram", "story", "statement", "story"]] },
  { day: 3, type: "studio", title: "Studio-Moment", posts: [["instagram", "feed", "studio", "portrait"]] },
  { day: 7, type: "crate", title: "Crate-Story", posts: [["instagram", "feed", "gem", "post"]] },
  { day: 14, type: "recap", title: "Rückblick", posts: [["instagram", "feed", "release", "portrait"], ["facebook", "feed", "release", "post"]] },
];

export function makeId(): string {
  return globalThis.crypto?.randomUUID?.() || `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

function dateParts(value: string): [number, number, number] {
  const [year, month, day] = value.split("-").map(Number);
  return [year, month, day];
}

export function todayISO(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

export function addCalendarDays(value: string, days: number): string {
  const [year, month, day] = dateParts(value);
  const date = new Date(year, month - 1, day, 12);
  date.setDate(date.getDate() + days);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function ordinal(value: string): number {
  const [year, month, day] = dateParts(value);
  const previous = year - 1;
  const leap = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
  const monthDays = [31, leap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  return 365 * previous + Math.floor(previous / 4) - Math.floor(previous / 100) + Math.floor(previous / 400) + monthDays.slice(0, month - 1).reduce((sum, item) => sum + item, 0) + day;
}

export function calendarDifference(from: string, to: string): number {
  return ordinal(to) - ordinal(from);
}

export function shortDate(value: string): string {
  const [, month, day] = dateParts(value);
  return `${String(day).padStart(2, "0")}.${String(month).padStart(2, "0")}.`;
}

export function longDate(value: string, withYear = false): string {
  const [year, month, day] = dateParts(value);
  return new Intl.DateTimeFormat("de-DE", { day: "numeric", month: "long", ...(withYear ? { year: "numeric" } : {}) }).format(new Date(year, month - 1, day, 12));
}

export function weekday(value: string): string {
  const [year, month, day] = dateParts(value);
  return new Intl.DateTimeFormat("de-DE", { weekday: "long" }).format(new Date(year, month - 1, day, 12));
}

export function dayLabel(day: number): string {
  return day === 0 ? "T-0" : day > 0 ? `T+${day}` : `T${day}`;
}

// Headline for statement graphics per slot; without one the Werkstatt would show its sample text.
const STATEMENTS: Partial<Record<SlotType, (title: string) => string>> = {
  announce: (t) => `NEUES AUS DER KISTE. ${t} KOMMT.`,
  countdown: () => "NOCH 3 TAGE.",
  tomorrow: (t) => `MORGEN. ${t}.`,
  thanks: () => "DANKE FÜRS REINHÖREN.",
};

export function makePost(campaign: Campaign, type: SlotType, day: number, platform: PlatformId, placement: Placement, template?: RenderRequest["template"], format?: RenderRequest["format"]): Post {
  const request: RenderRequest | undefined = template && format ? {
    template,
    format,
    theme: type === "countdown" ? "orange" : template === "studio" ? "night" : "paper",
    fields: {
      title: campaign.title,
      label: campaign.label,
      statement: STATEMENTS[type]?.(campaign.title.toUpperCase()),
      subtitle: type === "release" ? "JETZT DRAUSSEN" : undefined,
      platform,
    },
    image: template === "studio" ? "/assets/photos/photo-02-studio-mpc-beatmaking.webp" : template === "gem" ? "/assets/gems/crate-to-pad.webp" : campaign.cover,
  } : undefined;
  return {
    id: makeId(), platform, placement, render: request,
    text: captionFor(campaign, type, platform, day), textEn: campaign.messageEn?.trim() ? captionForEn(campaign, type, platform, day) : undefined, hashtags: hashtagsFor(campaign, platform),
    headline: platform === "newsletter" || platform === "youtube" ? campaign.title : undefined,
    variant: 0, status: "draft",
  };
}

export function buildPlan(campaign: Campaign): Slot[] {
  return blueprint.flatMap((item) => {
    if (item.type === "presave" && !campaign.links.presave?.trim()) return [];
    if (item.type === "pitch" && campaign.kind === "mix") return [];
    const posts = item.posts.filter(([platform]) => campaign.platforms.includes(platform) && (platform !== "mixcloud" || campaign.kind === "mix"))
      .map(([platform, placement, template, format]) => makePost(campaign, item.type, item.day, platform, placement, template, format));
    return posts.length ? [{ id: makeId(), day: item.day, time: item.day === 0 ? "10:00" : "18:00", type: item.type, title: item.title, posts }] : [];
  });
}

function postKey(type: SlotType, post: Post): string {
  return `${type}:${post.platform}:${post.placement}`;
}

export function reconcileCampaign(previous: Campaign, next: Campaign): Campaign {
  const before = buildPlan(previous);
  const after = buildPlan(next);
  const beforeKeys = new Set(before.flatMap((slot) => slot.posts.map((post) => postKey(slot.type, post))));
  const afterKeys = new Set(after.flatMap((slot) => slot.posts.map((post) => postKey(slot.type, post))));
  const slots = previous.slots.map((slot) => ({
    ...slot,
    posts: slot.posts.filter((post) => {
      if (!next.platforms.includes(post.platform)) return false;
      if (post.platform === "mixcloud" && next.kind !== "mix") return false;
      if (post.platform === "spotify" && next.kind === "mix") return false;
      if (slot.type === "presave" && !next.links.presave?.trim()) return false;
      const key = postKey(slot.type, post);
      return !beforeKeys.has(key) || afterKeys.has(key);
    }).map((post) => {
      if (post.status === "posted") return post;
      const oldGenerated = captionFor(previous, slot.type, post.platform, slot.day, post.variant || 0);
      const oldGeneratedEn = previous.messageEn?.trim() ? captionForEn(previous, slot.type, post.platform, slot.day, post.variant || 0) : undefined;
      const render = post.render ? { ...post.render, image: post.render.image === previous.cover ? next.cover : post.render.image, fields: { ...post.render.fields, title: post.render.fields.title === previous.title ? next.title : post.render.fields.title, label: post.render.fields.label === previous.label ? next.label : post.render.fields.label } } : undefined;
      return { ...post, render, text: post.text === oldGenerated ? captionFor(next, slot.type, post.platform, slot.day, post.variant || 0) : post.text, textEn: post.textEn === oldGeneratedEn ? (next.messageEn?.trim() ? captionForEn(next, slot.type, post.platform, slot.day, post.variant || 0) : undefined) : post.textEn, headline: post.headline === previous.title ? next.title : post.headline };
    }),
  })).filter((slot) => slot.posts.length);
  for (const proposed of after) {
    const additions = proposed.posts.filter((post) => !beforeKeys.has(postKey(proposed.type, post)));
    if (!additions.length) continue;
    const target = slots.find((slot) => slot.type === proposed.type);
    if (target) target.posts.push(...additions);
    else slots.push({ ...proposed, posts: additions });
  }
  return { ...next, slots: slots.sort((a, b) => a.day - b.day || a.time.localeCompare(b.time)) };
}