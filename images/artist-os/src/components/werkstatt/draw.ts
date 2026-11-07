import { COLORS } from "./themes";
import type { Box, DesignData, DrawAssets, FontFamilies, Format, PhotoLook } from "./types";

const imageCache = new Map<string, Promise<HTMLImageElement>>();
const photoCache = new WeakMap<HTMLImageElement, Map<PhotoLook, HTMLCanvasElement>>();
const fontCache = new Map<string, Promise<void>>();

export function correctName(text: string): string {
  return text.replace(/neighbour/gi, (word) => {
    if (word === word.toUpperCase()) return "NEIGHBOR";
    if (word[0] === word[0].toUpperCase()) return "Neighbor";
    return "neighbor";
  });
}

export function loadImage(url: string): Promise<HTMLImageElement> {
  const existing = imageCache.get(url);
  if (existing) return existing;
  const promise = (async () => {
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.decoding = "async";
    image.src = url;
    await image.decode();
    return image;
  })();
  imageCache.set(url, promise);
  void promise.catch(() => imageCache.delete(url));
  return promise;
}

export function fontFamily(family: string): string {
  return family.includes(",") || family.includes('"') || family.includes("'")
    ? family
    : `"${family}"`;
}

export function loadFonts(fonts: FontFamilies): Promise<void> {
  const key = `${fonts.display}|${fonts.mono}`;
  const existing = fontCache.get(key);
  if (existing) return existing;
  const promise = Promise.all([
    document.fonts.load(`900 100px ${fontFamily(fonts.display)}`),
    document.fonts.load(`900 100px ${fontFamily(fonts.mono)}`),
    document.fonts.load(`700 100px ${fontFamily(fonts.mono)}`),
    document.fonts.load(`400 100px ${fontFamily(fonts.display)}`),
  ]).then(() => undefined);
  fontCache.set(key, promise);
  void promise.catch(() => fontCache.delete(key));
  return promise;
}

type TextOptions = {
  family: string;
  size: number;
  color: string;
  weight?: number;
  condensed?: boolean;
  maxLines?: number;
  lineHeight?: number;
  align?: "left" | "center" | "right";
  uppercase?: boolean;
  accentWord?: number;
  accentColor?: string;
};

function setFont(ctx: CanvasRenderingContext2D, size: number, options: TextOptions): number {
  ctx.font = `${options.weight ?? (options.condensed ? 900 : 400)} ${size}px ${fontFamily(options.family)}`;
  if ("fontStretch" in ctx) ctx.fontStretch = "normal";
  if (!options.condensed) return 1;
  const normalWidth = ctx.measureText("NOIZY NEIGHBOR").width;
  if ("fontStretch" in ctx) {
    ctx.fontStretch = "extra-condensed";
    if (ctx.measureText("NOIZY NEIGHBOR").width < normalWidth * 0.9) return 1;
  }
  // Firefox and fixed-width next/font faces need matching measurement and drawing scales.
  return 0.62;
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, width: number, scale: number): string[] {
  const lines: string[] = [];
  for (const paragraph of text.split("\n")) {
    let line = "";
    for (const word of paragraph.split(/\s+/).filter(Boolean)) {
      const candidate = line ? `${line} ${word}` : word;
      if (ctx.measureText(candidate).width * scale <= width) {
        line = candidate;
      } else {
        if (line) lines.push(line);
        line = word;
      }
    }
    if (line) lines.push(line);
  }
  return lines.length ? lines : [""];
}

export function fitText(ctx: CanvasRenderingContext2D, input: string, box: Box, options: TextOptions): Box {
  const clean = correctName(input).trim();
  const normalized = clean.split("\n").length > (options.maxLines ?? 3) ? clean.replace(/\s+/g, " ") : clean;
  const text = options.uppercase === false ? normalized : normalized.toUpperCase();
  if (!text || box.width <= 0 || box.height <= 0) return { ...box, width: 0, height: 0 };
  ctx.save();
  const lineHeight = options.lineHeight ?? (options.condensed ? 0.86 : 1.24);
  let low = 0.5;
  let high = options.size;
  let size = low;
  let lines: string[] = [];
  let scale = 1;
  let ascent = 0;
  let descent = 0;
  for (let step = 0; step < 18; step++) {
    const candidate = (low + high) / 2;
    const factor = setFont(ctx, candidate, options);
    const candidateLines = wrapText(ctx, text, box.width, factor);
    const metrics = candidateLines.map((line) => ctx.measureText(line));
    const a = Math.max(...metrics.map((metric) => metric.actualBoundingBoxAscent || candidate * 0.76));
    const d = Math.max(0, ...metrics.map((metric) => metric.actualBoundingBoxDescent || 0));
    const fits = candidateLines.length <= (options.maxLines ?? 3)
      && metrics.every((metric) => Math.max(metric.width, metric.actualBoundingBoxLeft + metric.actualBoundingBoxRight) * factor <= box.width)
      && a + d + (candidateLines.length - 1) * candidate * lineHeight <= box.height;
    if (fits) {
      size = candidate;
      low = candidate;
    } else high = candidate;
  }
  scale = setFont(ctx, size, options);
  lines = wrapText(ctx, text, box.width, scale);
  const metrics = lines.map((line) => ctx.measureText(line));
  ascent = Math.max(...metrics.map((metric) => metric.actualBoundingBoxAscent || size * 0.76));
  descent = Math.max(0, ...metrics.map((metric) => metric.actualBoundingBoxDescent || 0));
  const height = ascent + descent + (lines.length - 1) * size * lineHeight;
  let wordIndex = 0;
  ctx.textBaseline = "alphabetic";
  ctx.textAlign = "left";
  ctx.fillStyle = options.color;
  lines.forEach((line, index) => {
    const width = ctx.measureText(line).width * scale;
    const x = box.x + (options.align === "center" ? (box.width - width) / 2 : options.align === "right" ? box.width - width : 0);
    const y = box.y + ascent + index * size * lineHeight;
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, 1);
    if (options.accentWord !== undefined) {
      let cursor = 0;
      line.split(/\s+/).forEach((word, wordInLine) => {
        const prefix = wordInLine ? " " : "";
        cursor += ctx.measureText(prefix).width;
        ctx.fillStyle = wordIndex === options.accentWord ? (options.accentColor ?? options.color) : options.color;
        ctx.fillText(word, cursor, 0);
        cursor += ctx.measureText(word).width;
        wordIndex++;
      });
    } else ctx.fillText(line, 0, 0);
    ctx.restore();
  });
  ctx.restore();
  return { ...box, width: Math.max(...metrics.map((metric) => metric.width * scale)), height };
}

function processedPhoto(image: HTMLImageElement, look: PhotoLook): HTMLImageElement | HTMLCanvasElement {
  if (look === "original") return image;
  let versions = photoCache.get(image);
  if (!versions) {
    versions = new Map();
    photoCache.set(image, versions);
  }
  const cached = versions.get(look);
  if (cached) return cached;
  const canvas = document.createElement("canvas");
  canvas.width = image.naturalWidth;
  canvas.height = image.naturalHeight;
  const context = canvas.getContext("2d", { willReadFrequently: true })!;
  context.drawImage(image, 0, 0);
  const pixels = context.getImageData(0, 0, canvas.width, canvas.height);
  for (let i = 0; i < pixels.data.length; i += 4) {
    const gray = Math.min(255, Math.max(0, ((pixels.data[i] * 0.2126 + pixels.data[i + 1] * 0.7152 + pixels.data[i + 2] * 0.0722 - 128) * 1.18 + 128) * 1.04));
    pixels.data[i] = look === "duotone" ? gray * (232 / 255) : gray;
    pixels.data[i + 1] = look === "duotone" ? gray * (92 / 255) : gray;
    pixels.data[i + 2] = look === "duotone" ? gray * (13 / 255) : gray;
  }
  context.putImageData(pixels, 0, 0);
  versions.set(look, canvas);
  return canvas;
}

export function drawDuotone(
  ctx: CanvasRenderingContext2D,
  image: HTMLImageElement,
  box: Box,
  crop: DesignData["crop"],
  look: PhotoLook = "duotone",
): void {
  const source = processedPhoto(image, look);
  const scale = Math.max(box.width / image.naturalWidth, box.height / image.naturalHeight) * crop.zoom;
  const width = image.naturalWidth * scale;
  const height = image.naturalHeight * scale;
  const x = box.x - (width - box.width) * (Math.max(-1, Math.min(1, crop.x)) + 1) / 2;
  const y = box.y - (height - box.height) * (Math.max(-1, Math.min(1, crop.y)) + 1) / 2;
  ctx.save();
  ctx.beginPath();
  ctx.rect(box.x, box.y, box.width, box.height);
  ctx.clip();
  if (look === "duotone") {
    ctx.fillStyle = COLORS.vinyl;
    ctx.fillRect(box.x, box.y, box.width, box.height);
  }
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(source, x, y, width, height);
  ctx.restore();
}

// Brand-kit tiles are seamless, so they repeat as they are.
export function drawTexture(ctx: CanvasRenderingContext2D, tile: HTMLImageElement, alpha: number, width: number, height: number): void {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.globalCompositeOperation = "multiply";
  const pattern = ctx.createPattern(tile, "repeat");
  if (pattern) {
    ctx.fillStyle = pattern;
    ctx.fillRect(0, 0, width, height);
  }
  ctx.restore();
}

export function drawHardShadow(ctx: CanvasRenderingContext2D, box: Box, offset = 12, color = COLORS.ink): void {
  ctx.save();
  ctx.fillStyle = color;
  ctx.fillRect(box.x + offset, box.y + offset, box.width, box.height);
  ctx.restore();
}

export function drawLabel(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  options: { fonts: FontFamilies; fill?: string; color?: string; size?: number; maxWidth?: number; shadow?: boolean },
): Box {
  const size = options.size ?? 24;
  ctx.save();
  ctx.font = `700 ${size}px ${fontFamily(options.fonts.mono)}`;
  const width = Math.min(options.maxWidth ?? 800, ctx.measureText(correctName(text).toUpperCase()).width + size * 1.2);
  const box = { x, y, width, height: size * 1.85 };
  if (options.shadow !== false) drawHardShadow(ctx, box, size * 0.19);
  ctx.fillStyle = options.fill ?? COLORS.vinyl;
  ctx.strokeStyle = COLORS.ink;
  ctx.lineWidth = Math.max(1.5, size * 0.065);
  ctx.beginPath();
  ctx.roundRect(x, y, width, box.height, size * 0.16);
  ctx.fill();
  ctx.stroke();
  fitText(ctx, text, { x: x + size * 0.6, y: y + size * 0.49, width: width - size * 1.2, height: size }, {
    family: options.fonts.mono, size, weight: 700, color: options.color ?? COLORS.ink, maxLines: 1,
  });
  ctx.restore();
  return box;
}

export function contentBox(format: Format): Box {
  const margin = Math.min(format.width, format.height) * 0.065;
  const top = format.id === "story" ? 270 : margin;
  const bottom = format.id === "story" ? 360 : margin;
  return { x: margin, y: top, width: format.width - margin * 2, height: format.height - top - bottom };
}

export function logoBox(data: DesignData, format: Format, image?: HTMLImageElement): Box | undefined {
  if (!image || data.logoPosition === "off") return undefined;
  const size = Math.min(format.width, format.height);
  const width = size * (data.logoVariant === "badge" ? 0.175 : 0.235);
  const height = width * image.naturalHeight / image.naturalWidth;
  const margin = format.width * 0.08;
  const top = format.id === "story" ? Math.max(270, margin) : margin;
  const bottom = format.id === "story" ? Math.max(360, margin) : margin;
  return {
    x: data.logoPosition.endsWith("left") ? margin : format.width - margin - width,
    y: data.logoPosition.startsWith("top") ? top : format.height - bottom - height,
    width,
    height,
  };
}

export function avoidLogo(box: Box, data: DesignData, format: Format, assets: DrawAssets): Box {
  const logo = logoBox(data, format, assets.logo);
  if (!logo) return box;
  const gap = Math.min(format.width, format.height) * 0.035;
  if (box.x + box.width <= logo.x - gap || box.x >= logo.x + logo.width + gap) return box;
  if (box.y + box.height <= logo.y - gap || box.y >= logo.y + logo.height + gap) return box;
  if (data.logoPosition.startsWith("top")) {
    const y = logo.y + logo.height + gap;
    return { ...box, y, height: Math.max(1, box.y + box.height - y) };
  }
  return { ...box, height: Math.max(1, logo.y - gap - box.y) };
}

export function drawLogo(ctx: CanvasRenderingContext2D, data: DesignData, format: Format, assets: DrawAssets): void {
  const box = logoBox(data, format, assets.logo);
  if (!box || !assets.logo) return;
  ctx.drawImage(assets.logo, box.x, box.y, box.width, box.height);
  // The sticker sits beside the logo, toward the centre: avoidLogo already keeps that row free.
  // The icon sits on the round paper sticker so it reads on photos and dark themes alike.
  if (!assets.sticker || !assets.stickerBase) return;
  const s = Math.min(format.width, format.height);
  const size = Math.min(box.height, s * 0.14);
  const gap = s * 0.025;
  const x = data.logoPosition.endsWith("left") ? box.x + box.width + gap : box.x - gap - size;
  const y = box.y + (box.height - size) / 2;
  ctx.drawImage(assets.stickerBase, x, y, size, size * assets.stickerBase.naturalHeight / assets.stickerBase.naturalWidth);
  // Face centre and diameter measured on sticker-rund-papier.png (shadow excluded).
  const icon = assets.sticker;
  const fit = size * 0.88 * 0.6 / Math.max(icon.naturalWidth, icon.naturalHeight);
  const cx = x + size * 0.478;
  const cy = y + size * 0.49;
  ctx.drawImage(icon, cx - icon.naturalWidth * fit / 2, cy - icon.naturalHeight * fit / 2, icon.naturalWidth * fit, icon.naturalHeight * fit);
}

export function drawPhoto(ctx: CanvasRenderingContext2D, data: DesignData, assets: DrawAssets, box: Box): void {
  if (!assets.image) return;
  drawDuotone(ctx, assets.image, box, data.crop, data.photoLook);
  assets.photoRect = box;
}

export function drawRule(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, color: string, thickness = 3): void {
  ctx.save();
  ctx.fillStyle = color;
  ctx.fillRect(x, y, width, thickness);
  ctx.restore();
}