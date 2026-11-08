import { avoidLogo, contentBox, drawHardShadow, drawPhoto, drawRule } from "../draw";
import { accentText } from "../themes";
import type { TemplateRenderer } from "../types";
import { headline, mono } from "./shared";

export const drawRelease: TemplateRenderer = (ctx, data, format, theme, assets) => {
  const s = Math.min(format.width, format.height);
  const safe = contentBox(format);
  const wide = format.width / format.height > 1.2;
  if (wide) {
    const side = Math.min(safe.height * 0.85, safe.width * 0.39);
    const cover = { x: safe.x, y: safe.y + (safe.height - side) / 2, width: side, height: side };
    drawHardShadow(ctx, cover, s * 0.016);
    drawPhoto(ctx, data, assets, cover);
    const c = avoidLogo({ x: cover.x + side + s * 0.075, y: safe.y, width: safe.width - side - s * 0.075, height: safe.height }, data, format, assets);
    mono(ctx, `DJ NOIZY NEIGHBOR / ${data.year}`, { ...c, height: c.height * 0.08 }, assets, theme.text, s * 0.022, 1);
    headline(ctx, data.title, { x: c.x, y: c.y + c.height * 0.16, width: c.width, height: c.height * 0.49 }, assets, theme.text, s * 0.23);
    mono(ctx, "JETZT ÜBERALL", { x: c.x, y: c.y + c.height * 0.73, width: c.width, height: c.height * 0.08 }, assets, accentText(theme), s * 0.028, 1);
    mono(ctx, "SPOTIFY / APPLE MUSIC / YOUTUBE", { x: c.x, y: c.y + c.height * 0.88, width: c.width, height: c.height * 0.11 }, assets, theme.text, s * 0.018, 2);
    return;
  }
  const c = avoidLogo(safe, data, format, assets);
  mono(ctx, `DJ NOIZY NEIGHBOR / ${data.year}`, { ...c, height: c.height * 0.04 }, assets, theme.text, s * 0.022, 1);
  headline(ctx, data.title, { x: c.x, y: c.y + c.height * 0.1, width: c.width, height: c.height * 0.31 }, assets, theme.text, s * 0.21, 2);
  const side = Math.min(c.width * 0.52, c.height * 0.49);
  const cover = { x: c.x, y: c.y + c.height * 0.47, width: side, height: side };
  drawHardShadow(ctx, cover, s * 0.013);
  drawPhoto(ctx, data, assets, cover);
  const x = cover.x + side + s * 0.05;
  const width = c.x + c.width - x;
  headline(ctx, "JETZT\nÜBERALL", { x, y: cover.y + side * 0.04, width, height: side * 0.35 }, assets, accentText(theme), s * 0.075, 2);
  drawRule(ctx, x, cover.y + side * 0.46, width, theme.text, s * 0.002);
  mono(ctx, "SPOTIFY\nAPPLE MUSIC\nYOUTUBE", { x, y: cover.y + side * 0.55, width, height: side * 0.32 }, assets, theme.text, s * 0.022, 3);
  const footerX = data.logoPosition === "bottom-left" ? safe.x + s * 0.30 : safe.x;
  mono(ctx, data.label, { x: footerX, y: safe.y + safe.height - s * 0.035, width: safe.width * 0.61, height: s * 0.035 }, assets, theme.text, s * 0.018, 1);
};