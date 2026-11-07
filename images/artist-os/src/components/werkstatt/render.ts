import { drawLogo, drawTexture, loadFonts, loadImage } from "./draw";
import { sanitizeData } from "./defaults";
import { assetUrl, TEXTURES } from "./library";
import { drawGig } from "./templates/gig";
import { drawGem } from "./templates/gem";
import { drawRelease } from "./templates/release";
import { drawMix } from "./templates/mix";
import { drawStatement } from "./templates/statement";
import { drawStudio } from "./templates/studio";
import type { DesignData, DrawAssets, FontFamilies, Format, RenderedArtwork, TemplateId, TemplateRenderer, Theme } from "./types";

const renderers: Record<TemplateId, TemplateRenderer> = {
  gig: drawGig, gem: drawGem, release: drawRelease, mix: drawMix, statement: drawStatement, studio: drawStudio,
};

export const DEFAULT_FONTS: FontFamilies = { display: "Archivo", mono: "Space Mono" };

export async function renderArtwork(data: DesignData, format: Format, theme: Theme, assetBase: string, fonts: FontFamilies = DEFAULT_FONTS): Promise<RenderedArtwork> {
  const cleanData = sanitizeData(data);
  const lightWordmark = theme.id === "night" || theme.id === "olive";
  const wordmarkColor = lightWordmark ? "paper" : "ink";
  const logoPath = data.logoVariant === "badge" ? "/assets/brandkit/logo-badge.png" : `/assets/brandkit/wordmark-${wordmarkColor}.png`;
  const texture = TEXTURES.find((item) => item.id === data.texture);
  const withSticker = data.logoPosition !== "off" && data.sticker !== "";
  const [, image, logo, sticker, stickerBase, tile] = await Promise.all([
    loadFonts(fonts),
    data.template !== "statement" ? loadImage(assetUrl(assetBase, data.image)) : Promise.resolve(undefined),
    data.logoPosition !== "off" ? loadImage(assetUrl(assetBase, logoPath)) : Promise.resolve(undefined),
    withSticker ? loadImage(assetUrl(assetBase, data.sticker)) : Promise.resolve(undefined),
    withSticker ? loadImage(assetUrl(assetBase, "/assets/brandkit/sticker-rund-papier.png")) : Promise.resolve(undefined),
    texture ? loadImage(assetUrl(assetBase, texture.path)) : Promise.resolve(undefined),
  ]);
  // The detached, full-resolution canvas is mounted unchanged as the preview and exported directly.
  const canvas = document.createElement("canvas");
  canvas.width = format.width;
  canvas.height = format.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Dein Browser stellt leider kein 2D-Canvas bereit.");
  const assets: DrawAssets = { image, logo, sticker, stickerBase, fonts };
  ctx.fillStyle = theme.background;
  ctx.fillRect(0, 0, format.width, format.height);
  renderers[data.template](ctx, cleanData, format, theme, assets);
  drawLogo(ctx, cleanData, format, assets);
  if (format.id === "flyer") {
    const x = Math.ceil(format.width * 0.03);
    const y = Math.ceil(format.height * 0.03);
    ctx.fillStyle = theme.background;
    ctx.fillRect(0, 0, format.width, y);
    ctx.fillRect(0, format.height - y, format.width, y);
    ctx.fillRect(0, 0, x, format.height);
    ctx.fillRect(format.width - x, 0, x, format.height);
  }
  if (texture && tile) drawTexture(ctx, tile, texture.alpha, format.width, format.height);
  return { canvas, photoRect: assets.photoRect, imageSize: image ? { width: image.naturalWidth, height: image.naturalHeight } : undefined };
}