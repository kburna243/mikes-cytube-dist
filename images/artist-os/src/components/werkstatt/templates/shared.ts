import { fitText } from "../draw";
import type { Box, DrawAssets } from "../types";

export function headline(ctx: CanvasRenderingContext2D, text: string, box: Box, assets: DrawAssets, color: string, size: number, maxLines = 3): Box {
  return fitText(ctx, text, box, { family: assets.fonts.display, condensed: true, color, size, maxLines });
}

export function mono(ctx: CanvasRenderingContext2D, text: string, box: Box, assets: DrawAssets, color: string, size: number, maxLines = 2): Box {
  return fitText(ctx, text, box, { family: assets.fonts.mono, color, size, maxLines, weight: 400 });
}

export function body(ctx: CanvasRenderingContext2D, text: string, box: Box, assets: DrawAssets, color: string, size: number, maxLines = 2): Box {
  return fitText(ctx, text, box, { family: assets.fonts.display, color, size, maxLines, uppercase: false, lineHeight: 1.25 });
}