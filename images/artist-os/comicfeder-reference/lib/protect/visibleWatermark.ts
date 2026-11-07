import sharp from 'sharp';

export interface VisibleWatermarkOptions {
  text?: string;
  logoBuffer?: Buffer;
  opacity?: number; // 0.05 .. 1.0 (Standard 0.35)
  tiled?: boolean;
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Wendet ein sichtbares Wasserzeichen (Text oder Logo, Deckkraft, Kachelung) auf einen Bild-Buffer an.
 * Wird ausschließlich beim Export angewendet, niemals auf dem Original in ASSETS_DIR.
 */
export async function applyVisibleWatermark(
  imageBuffer: Buffer,
  options: VisibleWatermarkOptions
): Promise<Buffer> {
  const opacity = Math.max(0.05, Math.min(1.0, options.opacity ?? 0.35));
  const tiled = Boolean(options.tiled);
  const text = (options.text || '© Federführer · Alle Rechte vorbehalten').trim();

  const base = sharp(imageBuffer);
  const meta = await base.metadata();
  const width = meta.width || 800;
  const height = meta.height || 800;

  if (options.logoBuffer && options.logoBuffer.length > 0) {
    const logoWidth = Math.max(48, Math.round(width * 0.18));
    const resizedLogo = await sharp(options.logoBuffer)
      .resize(logoWidth, logoWidth, { fit: 'inside' })
      .ensureAlpha(opacity)
      .png()
      .toBuffer();

    return base
      .composite([
        {
          input: resizedLogo,
          tile: tiled,
          gravity: tiled ? 'center' : 'southeast',
        },
      ])
      .png()
      .toBuffer();
  }

  const safeText = escapeXml(text);
  const fontSize = Math.max(14, Math.min(48, Math.round(Math.min(width, height) * 0.04)));

  if (tiled) {
    const tileW = Math.max(220, Math.round(width * 0.45));
    const tileH = Math.max(140, Math.round(height * 0.25));
    const svgTile = `<svg xmlns="http://www.w3.org/2000/svg" width="${tileW}" height="${tileH}">
      <g transform="translate(${tileW / 2}, ${tileH / 2}) rotate(-28)" opacity="${opacity}">
        <text x="0" y="0" text-anchor="middle" dominant-baseline="middle" font-family="sans-serif" font-weight="bold" font-size="${fontSize}" fill="#ffffff" stroke="#000000" stroke-width="1">${safeText}</text>
      </g>
    </svg>`;

    return base
      .composite([
        {
          input: Buffer.from(svgTile, 'utf8'),
          tile: true,
        },
      ])
      .png()
      .toBuffer();
  } else {
    const overlaySvg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
      <g opacity="${opacity}">
        <rect x="${Math.max(8, width - Math.min(width - 16, safeText.length * fontSize * 0.62 + 32))}" y="${Math.max(8, height - fontSize * 2.2)}" width="${Math.min(width - 16, safeText.length * fontSize * 0.62 + 24)}" height="${fontSize * 1.7}" rx="6" fill="#000000" fill-opacity="0.55" />
        <text x="${width - 20}" y="${height - Math.round(fontSize * 0.85)}" text-anchor="end" font-family="sans-serif" font-weight="bold" font-size="${fontSize}" fill="#ffffff">${safeText}</text>
      </g>
    </svg>`;

    return base
      .composite([
        {
          input: Buffer.from(overlaySvg, 'utf8'),
          top: 0,
          left: 0,
        },
      ])
      .png()
      .toBuffer();
  }
}
