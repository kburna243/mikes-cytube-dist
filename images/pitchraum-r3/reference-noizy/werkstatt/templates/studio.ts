import { avoidLogo, contentBox, drawPhoto } from "../draw";
import { COLORS } from "../themes";
import type { TemplateRenderer } from "../types";
import { headline, mono } from "./shared";

export const drawStudio: TemplateRenderer = (ctx, data, format, theme, assets) => {
  const { width: w, height: h } = format;
  const s = Math.min(w, h);
  const safe = contentBox(format);
  const stripHeight = Math.min(safe.height * 0.25, s * 0.25);
  const stripY = safe.y + safe.height - stripHeight;
  drawPhoto(ctx, data, assets, { x: 0, y: 0, width: w, height: stripY });
  ctx.fillStyle = theme.id === "paper" ? COLORS.paper : theme.background;
  ctx.fillRect(0, stripY, w, h - stripY);
  let c = { x: safe.x, y: stripY + s * 0.04, width: safe.width, height: stripHeight - s * 0.04 };
  if (data.logoPosition.startsWith("bottom")) {
    const left = data.logoPosition.endsWith("left");
    c = { ...c, x: left ? safe.x + s * 0.28 : safe.x, width: safe.width - s * 0.28 };
  } else c = avoidLogo(c, data, format, assets);
  headline(ctx, data.title, { ...c, height: c.height * 0.58 }, assets, theme.text, s * 0.088, 1);
  mono(ctx, data.label, { x: c.x, y: c.y + c.height * 0.75, width: c.width, height: c.height * 0.20 }, assets, theme.text, s * 0.02, 1);
};