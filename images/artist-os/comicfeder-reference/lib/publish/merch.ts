import sharp from 'sharp';
import { validatePrintFile, type PrintValidationResult, type PrintSpec } from '../../modules/print-specs/index.js';
import type { Point2D } from '../comic/formats.js';

export type MerchProductType =
  | 'tshirt'
  | 'poster'
  | 'kunstdruck'
  | 'postkarte'
  | 'sticker'
  | 'tasse'
  | 'tasche'
  | 'notizbuch';

export interface MerchProductSpec {
  type: MerchProductType;
  label: string;
  printFormatName: string;
  printWidthMm: number;
  printHeightMm: number;
  minEffectiveDpi: number;
  recommendedDpi: number;
  recommendsTransparency: boolean;
  defaultPriceCents: number;
}

export const MERCH_PRODUCT_SPECS: Record<MerchProductType, MerchProductSpec> = {
  tshirt: {
    type: 'tshirt',
    label: 'T-Shirt',
    printFormatName: 'T-Shirt-Druckfläche',
    printWidthMm: 300,
    printHeightMm: 400,
    minEffectiveDpi: 150,
    recommendedDpi: 300,
    recommendsTransparency: true,
    defaultPriceCents: 2990,
  },
  poster: {
    type: 'poster',
    label: 'Poster in A2',
    printFormatName: 'Poster',
    printWidthMm: 420,
    printHeightMm: 594,
    minEffectiveDpi: 150,
    recommendedDpi: 300,
    recommendsTransparency: false,
    defaultPriceCents: 2490,
  },
  kunstdruck: {
    type: 'kunstdruck',
    label: 'Kunstdruck in A3',
    printFormatName: 'A3',
    printWidthMm: 297,
    printHeightMm: 420,
    minEffectiveDpi: 250,
    recommendedDpi: 300,
    recommendsTransparency: false,
    defaultPriceCents: 3990,
  },
  postkarte: {
    type: 'postkarte',
    label: 'Postkarte in A6',
    printFormatName: 'Postkarte',
    printWidthMm: 148,
    printHeightMm: 105,
    minEffectiveDpi: 250,
    recommendedDpi: 300,
    recommendsTransparency: false,
    defaultPriceCents: 390,
  },
  sticker: {
    type: 'sticker',
    label: 'Sticker (10×10 cm)',
    printFormatName: 'Sticker',
    printWidthMm: 100,
    printHeightMm: 100,
    minEffectiveDpi: 250,
    recommendedDpi: 300,
    recommendsTransparency: true,
    defaultPriceCents: 490,
  },
  tasse: {
    type: 'tasse',
    label: 'Keramik-Tasse',
    printFormatName: 'Postkarte',
    printWidthMm: 200,
    printHeightMm: 85,
    minEffectiveDpi: 200,
    recommendedDpi: 300,
    recommendsTransparency: true,
    defaultPriceCents: 1690,
  },
  tasche: {
    type: 'tasche',
    label: 'Stofftasche',
    printFormatName: 'T-Shirt-Druckfläche',
    printWidthMm: 280,
    printHeightMm: 320,
    minEffectiveDpi: 150,
    recommendedDpi: 300,
    recommendsTransparency: true,
    defaultPriceCents: 1990,
  },
  notizbuch: {
    type: 'notizbuch',
    label: 'Notizbuch A5',
    printFormatName: 'A5',
    printWidthMm: 148,
    printHeightMm: 210,
    minEffectiveDpi: 250,
    recommendedDpi: 300,
    recommendsTransparency: false,
    defaultPriceCents: 1890,
  },
};

export interface PrintQualityCheckResult {
  passed: boolean;
  productType: MerchProductType;
  productLabel: string;
  effectiveDpi: number;
  effectiveDpiX: number;
  effectiveDpiY: number;
  minRequiredDpi: number;
  colorSpace: string;
  hasAlpha: boolean;
  warnings: string[];
  printValidation: PrintValidationResult;
}

/**
 * Druckdatei-Prüfung je Produkt:
 * Prüft effektive Auflösung (DPI bei physischer Endgröße), Farbraum, Ränder und Transparenz.
 * Liefert klare deutsche Warnungen wie "Für ein Poster in A2 ist das Bild zu klein".
 */
export function checkMerchPrintQuality(input: {
  productType: MerchProductType;
  imageWidthPx: number;
  imageHeightPx: number;
  colorSpace?: string;
  hasAlpha?: boolean;
  placementScale?: number;
  marginSafetyOk?: boolean;
}): PrintQualityCheckResult {
  const spec = MERCH_PRODUCT_SPECS[input.productType] || MERCH_PRODUCT_SPECS.poster;
  const scale = input.placementScale && input.placementScale > 0 ? input.placementScale : 1;

  // Effektive Druckbreite/-höhe des platzierten Motivs in Zoll
  const targetWidthIn = Math.max(0.5, (spec.printWidthMm * scale) / 25.4);
  const targetHeightIn = Math.max(0.5, (spec.printHeightMm * scale) / 25.4);

  const effectiveDpiX = Math.round(input.imageWidthPx / targetWidthIn);
  const effectiveDpiY = Math.round(input.imageHeightPx / targetHeightIn);
  const effectiveDpi = Math.min(effectiveDpiX, effectiveDpiY);

  const warnings: string[] = [];

  if (effectiveDpi < spec.minEffectiveDpi) {
    warnings.push(
      `Für ein ${spec.label} ist das Bild zu klein (effektiv ${effectiveDpi} DPI bei Endgröße, empfohlen sind mindestens ${spec.minEffectiveDpi} DPI).`
    );
  } else if (effectiveDpi < spec.recommendedDpi) {
    warnings.push(
      `Für ein ${spec.label} reicht die Auflösung (${effectiveDpi} DPI) knapp aus, optimal für gestochen scharfen Druck wären ${spec.recommendedDpi} DPI.`
    );
  }

  const cs = (input.colorSpace || 'srgb').toLowerCase();
  if (cs !== 'srgb' && cs !== 'rgb') {
    warnings.push(
      `Der Farbraum ist »${input.colorSpace}«. Für Print-on-Demand wird sRGB empfohlen, damit die Farben nicht blass wirken.`
    );
  }

  if (spec.recommendsTransparency && input.hasAlpha === false) {
    warnings.push(
      `Für ${spec.label} hat das Motiv keinen transparenten Hintergrund – ein rechteckiger Kasten könnte mitgedruckt werden.`
    );
  }

  if (input.marginSafetyOk === false) {
    warnings.push(
      `Das Motiv liegt sehr nah am Rand der Druckfläche von ${spec.label} und könnte angeschnitten werden.`
    );
  }

  const productNames: Record<MerchProductType, PrintSpec['produktart']> = { tshirt: 'T-Shirt-Druckfläche', poster: 'Poster', kunstdruck: 'Kunstdruck', postkarte: 'Postkarte', sticker: 'Sticker', tasse: 'Tasse', tasche: 'Tasche', notizbuch: 'Notizbuch' };
  // Validate the actual configured placement, never substitute another provider's dimensions.
  const printValidation = validatePrintFile({
    id: `merch-${spec.type}`, produktart: productNames[spec.type], variante: spec.label,
    endformat: { breite: spec.printWidthMm * scale, hoehe: spec.printHeightMm * scale, einheit: 'mm' },
    anschnittMm: 0, sicherheitsrandMm: 0, mindestDpi: spec.minEffectiveDpi,
    farbraum: 'sRGB', quelle: 'Interne Arbeitsvorgabe – konkrete Anbieter-Vorlage erforderlich',
    geprueft: false, hinweise: 'Exakten Anschnitt und Sicherheitsrand bitte beim Anbieter prüfen.',
  }, { widthPx: input.imageWidthPx, heightPx: input.imageHeightPx, colorSpace: input.colorSpace, hasAlphaChannel: input.hasAlpha }, spec.recommendedDpi);
  warnings.push(...printValidation.warnungen.filter((warning) => warning.includes('geprueft: false')));

  return {
    printValidation,
    passed: printValidation.bestanden,
    productType: spec.type,
    productLabel: spec.label,
    effectiveDpi,
    effectiveDpiX,
    effectiveDpiY,
    minRequiredDpi: spec.minEffectiveDpi,
    colorSpace: input.colorSpace || 'srgb',
    hasAlpha: Boolean(input.hasAlpha),
    warnings,
  };
}

/**
 * Objekt freistellen (ohne Cloud-KI):
 * Übernimmt ein Element oder Bild anhand einer vorhandenen Polygon-Maske oder eines Alphakanals
 * (bzw. entfernt auf Wunsch einfarbigen hellen Papierhintergrund über Schwellenwert)
 * und gibt ein freigestelltes PNG mit echtem Alphakanal zurück.
 */
export async function extractCutoutMotifBuffer(
  sourceBuffer: Buffer,
  options?: {
    cropBox?: { left: number; top: number; width: number; height: number };
    polygonMask?: Point2D[]; // normiert 0..1 oder in Pixeln
    removeWhitePaperBackground?: boolean;
    whiteThreshold?: number;
  }
): Promise<{ pngBuffer: Buffer; width: number; height: number; hasAlpha: boolean }> {
  let img = sharp(sourceBuffer, { failOn: 'none' }).ensureAlpha().toColorspace('srgb');
  const meta = await img.metadata();
  let width = meta.width || 256;
  let height = meta.height || 256;

  if (options?.cropBox) {
    const cb = options.cropBox;
    const isNormalized = cb.width <= 1 && cb.height <= 1 && cb.left <= 1 && cb.top <= 1;
    const left = Math.max(0, Math.round(isNormalized ? cb.left * width : cb.left));
    const top = Math.max(0, Math.round(isNormalized ? cb.top * height : cb.top));
    const w = Math.max(8, Math.min(width - left, Math.round(isNormalized ? cb.width * width : cb.width)));
    const h = Math.max(8, Math.min(height - top, Math.round(isNormalized ? cb.height * height : cb.height)));
    img = img.extract({ left, top, width: w, height: h });
    width = w;
    height = h;
  }

  const { data, info } = await img.raw().toBuffer({ resolveWithObject: true });
  width = info.width;
  height = info.height;
  const rgba = Buffer.from(data);

  // Falls gewünscht, hellen Papierhintergrund per Luminanz-Schwelle transparent setzen (keine Cloud-KI)
  if (options?.removeWhitePaperBackground !== false) {
    const threshold = options?.whiteThreshold ?? 245;
    for (let i = 0; i < rgba.length; i += 4) {
      const r = rgba[i];
      const g = rgba[i + 1];
      const b = rgba[i + 2];
      if (r >= threshold && g >= threshold && b >= threshold) {
        rgba[i + 3] = 0;
      }
    }
  }

  let outSharp = sharp(rgba, { raw: { width, height, channels: 4 } });

  // Falls eine Polygon-Maske übergeben wurde, per dest-in anwenden
  if (options?.polygonMask && options.polygonMask.length >= 3) {
    const isNorm = options.polygonMask.every((p) => p.x <= 1.5 && p.y <= 1.5);
    const pts = options.polygonMask
      .map((p) => {
        const px = isNorm ? Math.round(p.x * width) : Math.round(p.x);
        const py = isNorm ? Math.round(p.y * height) : Math.round(p.y);
        return `${px},${py}`;
      })
      .join(' ');

    const maskSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
      <polygon points="${pts}" fill="#ffffff" />
    </svg>`;

    const maskedBuf = await outSharp
      .png()
      .toBuffer();

    const finalBuf = await sharp(maskedBuf)
      .composite([{ input: Buffer.from(maskSvg), blend: 'dest-in' }])
      .png()
      .toBuffer();

    return { pngBuffer: finalBuf, width, height, hasAlpha: true };
  }

  const finalBuf = await outSharp.png().toBuffer();
  return { pngBuffer: finalBuf, width, height, hasAlpha: true };
}

/**
 * Erzeugt lokal (ohne fremde Mockup-Dienste!) eine flache Produktsilhouette als SVG
 * mit dem eingesetzten Motiv in der gewählten Farbvariante.
 */
export function renderMerchMockupSvg(input: {
  productType: MerchProductType;
  title: string;
  colorVariant?: string;
  imageUrl: string;
  placement?: { x?: number; y?: number; scale?: number; rotation?: number };
}): string {
  const colorMap: Record<string, string> = {
    schwarz: '#1f2937',
    weiss: '#f9fafb',
    creme: '#fef3c7',
    marine: '#1e3a8a',
    waldgruen: '#065f46',
    bordeaux: '#7f1d1d',
  };
  const bgFill = colorMap[(input.colorVariant || 'schwarz').toLowerCase()] || '#1f2937';
  const strokeColor = bgFill === '#f9fafb' || bgFill === '#fef3c7' ? '#9ca3af' : '#374151';

  const scale = Math.max(0.2, Math.min(1.5, input.placement?.scale ?? 0.8));
  const rot = input.placement?.rotation ?? 0;

  let silhouetteSvg = '';
  let printArea = { x: 130, y: 120, w: 140, h: 180 };

  if (input.productType === 'tshirt') {
    silhouetteSvg = `<path d="M110,50 L155,50 C170,70 230,70 245,50 L290,50 L355,115 L315,155 L285,125 L285,350 L115,350 L115,125 L85,155 L45,115 Z" fill="${bgFill}" stroke="${strokeColor}" stroke-width="3" />`;
    printArea = { x: 140, y: 115, w: 120, h: 160 };
  } else if (input.productType === 'tasse') {
    silhouetteSvg = `
      <path d="M265,140 C325,140 325,260 265,260" fill="none" stroke="${bgFill}" stroke-width="22" stroke-linecap="round" />
      <rect x="95" y="105" width="175" height="195" rx="18" fill="${bgFill}" stroke="${strokeColor}" stroke-width="3" />
    `;
    printArea = { x: 115, y: 135, w: 135, h: 130 };
  } else if (input.productType === 'tasche') {
    silhouetteSvg = `
      <path d="M150,110 C150,35 250,35 250,110" fill="none" stroke="${bgFill}" stroke-width="14" />
      <rect x="100" y="105" width="200" height="245" rx="8" fill="${bgFill}" stroke="${strokeColor}" stroke-width="3" />
    `;
    printArea = { x: 130, y: 140, w: 140, h: 165 };
  } else if (input.productType === 'sticker') {
    silhouetteSvg = `<circle cx="200" cy="200" r="135" fill="#ffffff" stroke="#d1d5db" stroke-width="6" stroke-dasharray="10,5" />`;
    printArea = { x: 105, y: 105, w: 190, h: 190 };
  } else if (input.productType === 'postkarte') {
    silhouetteSvg = `<rect x="60" y="100" width="280" height="200" rx="6" fill="#fffbeb" stroke="#9ca3af" stroke-width="3" />`;
    printArea = { x: 75, y: 115, w: 250, h: 170 };
  } else if (input.productType === 'notizbuch') {
    silhouetteSvg = `
      <rect x="95" y="55" width="210" height="290" rx="12" fill="${bgFill}" stroke="${strokeColor}" stroke-width="3" />
      <line x1="115" y1="55" x2="115" y2="345" stroke="#d97706" stroke-width="4" />
    `;
    printArea = { x: 130, y: 95, w: 150, h: 210 };
  } else {
    // Poster / Kunstdruck im Rahmen
    silhouetteSvg = `
      <rect x="75" y="40" width="250" height="320" fill="#111827" rx="4" />
      <rect x="90" y="55" width="220" height="290" fill="#ffffff" />
    `;
    printArea = { x: 105, y: 70, w: 190, h: 260 };
  }

  const motifW = Math.round(printArea.w * scale);
  const motifH = Math.round(printArea.h * scale);
  const motifX = Math.round(printArea.x + (printArea.w - motifW) / 2);
  const motifY = Math.round(printArea.y + (printArea.h - motifH) / 2);
  const cx = motifX + motifW / 2;
  const cy = motifY + motifH / 2;

  const safeUrl = String(input.imageUrl || '').replace(/"/g, '&quot;');

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="400" height="400">
    <rect width="400" height="400" fill="#f3f4f6" rx="16" />
    ${silhouetteSvg}
    <rect x="${printArea.x}" y="${printArea.y}" width="${printArea.w}" height="${printArea.h}" fill="none" stroke="#f59e0b" stroke-width="1.5" stroke-dasharray="4,4" opacity="0.7" />
    <image href="${safeUrl}" x="${motifX}" y="${motifY}" width="${motifW}" height="${motifH}" preserveAspectRatio="xMidYMid meet" transform="rotate(${rot} ${cx} ${cy})" />
  </svg>`;
}

function escapeCsvCell(val: string | number | null | undefined): string {
  const s = String(val ?? '');
  if (s.includes(',') || s.includes('"') || s.includes('\n')) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

/**
 * Erzeugt eine CSV-Datei im offiziellen Shopify-Produkt-Importformat.
 */
export function buildShopifyCsvExport(
  products: Array<{
    id: string;
    title: string;
    description: string;
    creatorName: string;
    productType: string;
    tags?: string[];
    colorVariants: string[];
    suggestedPriceCents: number;
    imageUrl?: string;
  }>
): string {
  const headers = [
    'Handle',
    'Title',
    'Body (HTML)',
    'Vendor',
    'Type',
    'Tags',
    'Published',
    'Option1 Name',
    'Option1 Value',
    'Variant Price',
    'Image Src',
  ];

  const rows: string[] = [headers.join(',')];

  for (const p of products) {
    const handle =
      p.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '') || `prod-${p.id.slice(0, 8)}`;
    const price = ((p.suggestedPriceCents || 2490) / 100).toFixed(2);
    const variants = p.colorVariants && p.colorVariants.length > 0 ? p.colorVariants : ['Standard'];

    variants.forEach((variantVal, idx) => {
      const cells = [
        handle,
        idx === 0 ? p.title : '',
        idx === 0 ? `<p>${p.description || ''}</p>` : '',
        idx === 0 ? p.creatorName : '',
        idx === 0 ? p.productType : '',
        idx === 0 ? (p.tags || ['Graphic Novel', 'Merch']).join(', ') : '',
        idx === 0 ? 'TRUE' : '',
        'Farbe',
        variantVal,
        price,
        idx === 0 ? p.imageUrl || '' : '',
      ];
      rows.push(cells.map(escapeCsvCell).join(','));
    });
  }

  return rows.join('\n');
}
