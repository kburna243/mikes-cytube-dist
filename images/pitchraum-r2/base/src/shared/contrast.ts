/**
 * Kontrastprüfung nach WCAG ( relatives Leuchtdichten-Verhältnis ).
 * Schwelle für normalen Text (AA): 4,5 : 1.
 */

export interface RgbColor {
  r: number;
  g: number;
  b: number;
}

/** Wandelt #rgb, #rrggbb (mit oder ohne '#') in RGB um. Ungültig → null. */
export function hexToRgb(hex: string): RgbColor | null {
  const cleaned = hex.trim().replace(/^#/, '');
  if (!/^[0-9a-fA-F]{3}$|^[0-9a-fA-F]{6}$/.test(cleaned)) return null;
  const full =
    cleaned.length === 3
      ? cleaned
          .split('')
          .map((c) => c + c)
          .join('')
      : cleaned;
  return {
    r: parseInt(full.slice(0, 2), 16),
    g: parseInt(full.slice(2, 4), 16),
    b: parseInt(full.slice(4, 6), 16),
  };
}

export function rgbToHex({ r, g, b }: RgbColor): string {
  const toHex = (v: number) =>
    Math.max(0, Math.min(255, Math.round(v)))
      .toString(16)
      .padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function channelToLinear(channelValue: number): number {
  const c = channelValue / 255;
  return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}

export function relativeLuminance(color: RgbColor): number {
  return (
    0.2126 * channelToLinear(color.r) +
    0.7152 * channelToLinear(color.g) +
    0.0722 * channelToLinear(color.b)
  );
}

/** Kontrastverhältnis zweier Hexfarben, 1:1 bis 21:1. Ungültige Eingabe → 1. */
export function contrastRatio(hexA: string, hexB: string): number {
  const a = hexToRgb(hexA);
  const b = hexToRgb(hexB);
  if (!a || !b) return 1;
  const lumA = relativeLuminance(a);
  const lumB = relativeLuminance(b);
  const lighter = Math.max(lumA, lumB);
  const darker = Math.min(lumA, lumB);
  return (lighter + 0.05) / (darker + 0.05);
}

export const WCAG_AA_NORMAL_TEXT = 4.5;

/** Genügt das Paar Text/Hintergrund der Stufe WCAG AA für normalen Text? */
export function passesWcagAaText(textHex: string, backgroundHex: string): boolean {
  return contrastRatio(textHex, backgroundHex) >= WCAG_AA_NORMAL_TEXT;
}

const FALLBACK_DARK = '#121212';
const FALLBACK_LIGHT = '#FFFFFF';

function mixTowards(color: RgbColor, target: RgbColor, amount: number): RgbColor {
  return {
    r: color.r + (target.r - color.r) * amount,
    g: color.g + (target.g - color.g) * amount,
    b: color.b + (target.b - color.b) * amount,
  };
}

export interface ReadablePairSuggestion {
  textColor: string;
  backgroundColor: string;
  /** true, wenn der Hintergrund angepasst werden musste */
  backgroundAdjusted: boolean;
  ratio: number;
}

/**
 * Schlägt ein lesbares Paar (AA) vor, ohne die Grundstimmung unnötig zu verwerfen:
 * 1. Wenn das Paar schon passt, bleibt es unverändert.
 * 2. Sonst Text in sattem Dunkel bzw. reinem Weiß versuchen.
 * 3. Sonst Hintergrund schrittweise abdunkeln oder aufhellen, bis es passt.
 */
export function suggestReadablePair(
  backgroundHex: string,
  textHex: string
): ReadablePairSuggestion {
  const ratioNow = contrastRatio(textHex, backgroundHex);
  if (ratioNow >= WCAG_AA_NORMAL_TEXT) {
    return {
      textColor: textHex,
      backgroundColor: backgroundHex,
      backgroundAdjusted: false,
      ratio: ratioNow,
    };
  }

  const ratioDark = contrastRatio(FALLBACK_DARK, backgroundHex);
  const ratioLight = contrastRatio(FALLBACK_LIGHT, backgroundHex);
  const bestText = ratioDark >= ratioLight ? FALLBACK_DARK : FALLBACK_LIGHT;
  const bestRatio = Math.max(ratioDark, ratioLight);
  if (bestRatio >= WCAG_AA_NORMAL_TEXT) {
    return {
      textColor: bestText,
      backgroundColor: backgroundHex,
      backgroundAdjusted: false,
      ratio: bestRatio,
    };
  }

  const bgRgb = hexToRgb(backgroundHex);
  if (!bgRgb) {
    return {
      textColor: FALLBACK_DARK,
      backgroundColor: FALLBACK_LIGHT,
      backgroundAdjusted: true,
      ratio: contrastRatio(FALLBACK_DARK, FALLBACK_LIGHT),
    };
  }
  const target = ratioDark >= ratioLight ? hexToRgb(FALLBACK_LIGHT)! : hexToRgb(FALLBACK_DARK)!;
  const text = ratioDark >= ratioLight ? FALLBACK_DARK : FALLBACK_LIGHT;
  for (let step = 1; step <= 20; step += 1) {
    const adjusted = rgbToHex(mixTowards(bgRgb, target, step / 20));
    const ratio = contrastRatio(text, adjusted);
    if (ratio >= WCAG_AA_NORMAL_TEXT) {
      return { textColor: text, backgroundColor: adjusted, backgroundAdjusted: true, ratio };
    }
  }
  return {
    textColor: FALLBACK_LIGHT,
    backgroundColor: FALLBACK_DARK,
    backgroundAdjusted: true,
    ratio: contrastRatio(FALLBACK_LIGHT, FALLBACK_DARK),
  };
}

/** Verständliche deutsche Erläuterung für die Oberfläche. */
export function describeContrastIssue(ratio: number): string {
  const rounded = (Math.round(ratio * 10) / 10).toString().replace('.', ',');
  return `Der Kontrast zwischen Text und Hintergrund beträgt nur ${rounded} : 1. Empfohlen sind mindestens 4,5 : 1, damit deine Seite für alle gut lesbar ist.`;
}
