import { avoidLogo, contentBox, drawLabel, drawPhoto, drawRule } from "../draw";
import { accentText } from "../themes";
import type { TemplateRenderer } from "../types";
import { body, headline, mono } from "./shared";

export const drawMix: TemplateRenderer = (ctx, data, format, theme, assets) => {
  const { width: w, height: h } = format;
  const s = Math.min(w, h);
  const safe = contentBox(format);
  const tall = w / h < 0.9;
  if (assets.image && data.image.includes("pattern-")) {
    const pattern = ctx.createPattern(assets.image, "repeat");
    if (pattern) {
      pattern.setTransform(new DOMMatrix().scale(s / 540));
      ctx.fillStyle = pattern;
      ctx.fillRect(0, 0, w, h);
    }
  } else drawPhoto(ctx, data, assets, { x: 0, y: 0, width: w, height: h });
  const panel = tall
    ? { x: 0, y: 0, width: w, height: safe.y + safe.height * 0.71 }
    : { x: 0, y: 0, width: w * 0.72, height: h };
  ctx.fillStyle = theme.background;
  ctx.fillRect(panel.x, panel.y, panel.width, panel.height);
  const c = avoidLogo({ x: safe.x, y: safe.y, width: panel.width - safe.x * 2, height: (tall ? panel.height - safe.y : safe.height + safe.y) - safe.y - s * 0.02 }, data, format, assets);
  mono(ctx, "SELECTED BY DJ NOIZY NEIGHBOR", { ...c, height: c.height * 0.06 }, assets, theme.text, s * 0.018, 1);
  drawLabel(ctx, "MIX / LIVE-SET", c.x, c.y + c.height * 0.12, { fonts: assets.fonts, fill: theme.accent, size: s * 0.023, maxWidth: c.width });
  headline(ctx, data.title, { x: c.x - s * 0.005, y: c.y + c.height * 0.27, width: c.width, height: c.height * 0.39 }, assets, theme.text, s * 0.26, 2);
  body(ctx, data.subtitle, { x: c.x, y: c.y + c.height * 0.71, width: c.width * 0.92, height: c.height * 0.13 }, assets, theme.text, s * 0.028, 3);
  drawRule(ctx, c.x, c.y + c.height * 0.89, c.width, theme.text, s * 0.002);
  mono(ctx, data.platform, { x: c.x, y: c.y + c.height * 0.94, width: c.width, height: c.height * 0.06 }, assets, accentText(theme), s * 0.025, 1);
};