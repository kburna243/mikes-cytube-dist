import { avoidLogo, contentBox, drawLabel, drawPhoto, drawRule } from "../draw";
import { accentText } from "../themes";
import type { TemplateRenderer } from "../types";
import { body, headline, mono } from "./shared";

export const drawGig: TemplateRenderer = (ctx, data, format, theme, assets) => {
  const { width: w, height: h } = format;
  const s = Math.min(w, h);
  const safe = contentBox(format);
  const tall = w / h < 0.9;
  const divide = tall ? safe.y + safe.height * 0.59 : w * 0.545;
  const photo = tall
    ? { x: 0, y: divide, width: w, height: h - divide }
    : { x: divide, y: 0, width: w - divide, height: h };
  drawPhoto(ctx, data, assets, photo);
  const c = avoidLogo(tall
    ? { ...safe, height: divide - safe.y - s * 0.04 }
    : { ...safe, width: divide - safe.x - s * 0.04 }, data, format, assets);
  const dateParts = data.date.split("-");
  const date = dateParts.length === 3 ? `${dateParts[2]}.${dateParts[1]}.` : data.date;
  mono(ctx, "DJ NOIZY NEIGHBOR / LIVE", { x: c.x, y: c.y, width: c.width, height: c.height * 0.05 }, assets, theme.text, s * 0.019, 1);
  mono(ctx, date, { x: c.x - s * 0.003, y: c.y + c.height * 0.095, width: c.width, height: c.height * 0.15 }, assets, theme.text, s * 0.105, 1);
  drawRule(ctx, c.x, c.y + c.height * 0.278, c.width, theme.text, s * 0.003);
  headline(ctx, data.venue, { x: c.x - s * 0.005, y: c.y + c.height * 0.32, width: c.width, height: c.height * 0.335 }, assets, theme.text, s * (tall ? 0.26 : 0.29), tall ? 1 : 2);
  headline(ctx, data.city, { x: c.x, y: c.y + c.height * 0.695, width: c.width, height: c.height * 0.10 }, assets, accentText(theme), s * 0.105, 1);
  body(ctx, data.note, { x: c.x, y: c.y + c.height * 0.83, width: c.width, height: c.height * 0.07 }, assets, theme.text, s * 0.025, 2);
  drawLabel(ctx, data.status === "CONFIRMED" ? "BESTÄTIGT" : data.status, c.x, c.y + c.height * 0.935, {
    fonts: assets.fonts, size: Math.min(s * 0.021, c.height * 0.027), fill: theme.accent, maxWidth: c.width,
  });
};