import { fullPostText } from "./captions";
import type { Campaign, Post, Slot } from "./types";

export function assetUrl(assetBase: string, path: string): string {
  if (!path || /^(blob:|data:|https?:)/i.test(path)) return path;
  return `${assetBase.replace(/\/$/, "")}${path.startsWith("/") ? path : `/${path}`}`;
}

export async function copyText(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // Fall through for browsers that expose the API but deny permission.
  }
  const field = document.createElement("textarea");
  field.value = text;
  field.setAttribute("readonly", "");
  field.style.position = "fixed";
  field.style.left = "-9999px";
  document.body.appendChild(field);
  field.select();
  try {
    return document.execCommand("copy");
  } catch {
    return false;
  } finally {
    field.remove();
  }
}

export function slug(value: string): string {
  return value.toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "release";
}

export function fileName(campaign: Campaign, slot: Slot, post: Post, extension = "png"): string {
  const day = slot.day === 0 ? "t-0" : slot.day > 0 ? `t+${slot.day}` : `t${slot.day}`;
  return `noizy_${slug(campaign.title)}_${day}_${post.platform}_${post.render?.format || "datei"}.${extension}`;
}

export function downloadBlob(blob: Blob, name: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export type ShareResult = { copied: boolean; outcome: "shared" | "downloaded" | "cancelled" | "no-file" };

export async function sharePrepared(post: Post, file?: File): Promise<ShareResult> {
  // Both privileged APIs are started synchronously in the click handler for iOS.
  const copying = copyText(fullPostText(post));
  if (!file) return { copied: await copying, outcome: "no-file" };
  let canShareFiles = false;
  try { canShareFiles = typeof navigator.share === "function" && Boolean(navigator.canShare?.({ files: [file] })); } catch { canShareFiles = false; }
  if (canShareFiles) {
    try {
      const sharing = navigator.share({ files: [file] });
      await sharing;
      return { copied: await copying, outcome: "shared" };
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") return { copied: await copying, outcome: "cancelled" };
    }
  }
  downloadBlob(file, file.name);
  return { copied: await copying, outcome: "downloaded" };
}