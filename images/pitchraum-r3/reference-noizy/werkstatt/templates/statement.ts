import { avoidLogo, contentBox, drawRule, fitText } from "../draw";
import { accentText } from "../themes";
import type { TemplateRenderer } from "../types";
import { mono } from "./shared";

export const drawStatement: TemplateRenderer = (ctx, data, format, theme, assets) => {
  const s = Math.min(format.width, format.height);
  const safe = contentBox(format);
  const c = avoidLogo(safe, data, format, assets);
  mono(ctx, "DJ NOIZY NEIGHBOR / BERLIN", { ...c, height: c.height * 0.06 }, assets, theme.text, s * 0.023, 1);
  drawRule(ctx, c.x, c.y + c.height * 0.13, c.width, theme.text, s * 0.003);
  fitText(ctx, data.statement, { x: c.x - s * 0.004, y: c.y + c.height * 0.23, width: c.width, height: c.height * 0.64 }, {
    family: assets.fonts.display, size: s * 0.24, color: theme.text, condensed: true,
    accentWord: data.accentWord, accentColor: accentText(theme), maxLines: 3,
  });
  mono(ctx, "RARE RECORDS. REAL BEATS.", { x: c.x, y: c.y + c.height * 0.96, width: c.width, height: c.height * 0.04 }, assets, theme.text, s * 0.019, 1);
};