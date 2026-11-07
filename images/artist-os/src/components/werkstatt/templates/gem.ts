import { avoidLogo, contentBox, drawHardShadow, drawLabel, drawPhoto } from "../draw";
import type { TemplateRenderer } from "../types";
import { body, headline, mono } from "./shared";

export const drawGem: TemplateRenderer = (ctx, data, format, theme, assets) => {
  const s = Math.min(format.width, format.height);
  const safe = contentBox(format);
  const wide = format.width / format.height > 1.2;
  if (wide) {
    const side = Math.min(safe.height - s * 0.10, safe.width * 0.43);
    const cover = { x: safe.x, y: safe.y + s * 0.08, width: side, height: side };
    drawHardShadow(ctx, cover, s * 0.014);
    drawPhoto(ctx, data, assets, cover);
    mono(ctx, "GEM DER WOCHE", { ...safe, height: s * 0.04 }, assets, theme.text, s * 0.026, 1);
    const c = avoidLogo({ x: cover.x + side + s * 0.075, y: safe.y, width: safe.width - side - s * 0.075, height: safe.height }, data, format, assets);
    headline(ctx, data.title, { ...c, height: c.height * 0.44 }, assets, theme.text, s * 0.15);
    mono(ctx, [data.artist, data.label, data.country].filter(Boolean).join(" / "), { x: c.x, y: c.y + c.height * 0.49, width: c.width, height: c.height * 0.13 }, assets, theme.text, s * 0.023);
    drawLabel(ctx, data.badge, c.x, c.y + c.height * 0.68, { fonts: assets.fonts, fill: theme.accent, size: s * 0.024, maxWidth: c.width });
    body(ctx, data.story, { x: c.x, y: c.y + c.height * 0.85, width: c.width, height: c.height * 0.13 }, assets, theme.text, s * 0.026);
    return;
  }
  const c = avoidLogo(safe, data, format, assets);
  mono(ctx, "GEM DER WOCHE", { x: c.x, y: c.y, width: c.width, height: c.height * 0.045 }, assets, theme.text, s * 0.027, 1);
  const side = Math.min(c.width * 0.76, c.height * 0.57);
  const cover = { x: c.x + (c.width - side) / 2, y: c.y + c.height * 0.09, width: side, height: side };
  drawHardShadow(ctx, cover, s * 0.014);
  drawPhoto(ctx, data, assets, cover);
  drawLabel(ctx, data.badge, cover.x - s * 0.035, cover.y + side - s * 0.055, { fonts: assets.fonts, fill: theme.accent, size: s * 0.022, maxWidth: c.width * 0.85 });
  const titleY = cover.y + side + s * 0.04;
  const remaining = c.y + c.height - titleY;
  headline(ctx, data.title, { x: c.x, y: titleY, width: c.width, height: remaining * 0.51 }, assets, theme.text, s * 0.095);
  mono(ctx, [data.artist, data.label, data.country].filter(Boolean).join(" / "), { x: c.x, y: titleY + remaining * 0.61, width: c.width, height: remaining * 0.12 }, assets, theme.text, s * 0.021);
  body(ctx, data.story, { x: c.x, y: titleY + remaining * 0.83, width: c.width, height: remaining * 0.17 }, assets, theme.text, s * 0.025);
};