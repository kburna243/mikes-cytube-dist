export type SupportedAssetFormat = 'png' | 'jpeg' | 'webp' | 'avif' | 'tiff' | 'svg' | 'psd' | 'kra';

export interface DetectedAssetFormat {
  format: SupportedAssetFormat;
  mimeType: string;
  extension: string;
}

/**
 * Erkennt das Bildformat ausschließlich anhand der Magic Bytes im Buffer (niemals anhand der Dateiendung!).
 * Unterstützt: PNG, JPEG, WebP, AVIF, TIFF, SVG, PSD.
 * Gibt null zurück, wenn das Format unbekannt oder eine umbenannte Fremddatei ist.
 */
export function detectFormatByMagicBytes(buffer: Buffer): DetectedAssetFormat | null {
  if (!buffer || buffer.length < 4) {
    return null;
  }

  // Krita identifies itself via the first, uncompressed ZIP mimetype record.
  if (buffer.length >= 49 && buffer.readUInt32LE(0) === 0x04034b50 && buffer.readUInt16LE(8) === 0 && buffer.readUInt16LE(26) === 8) {
    const dataStart = 38 + buffer.readUInt16LE(28);
    if (buffer.subarray(30, 38).toString('ascii') === 'mimetype' && buffer.subarray(dataStart, dataStart + 19).toString('ascii') === 'application/x-krita') return { format: 'kra', mimeType: 'application/x-krita', extension: '.kra' };
  }

  // 1. PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    buffer.length >= 8 &&
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) {
    return { format: 'png', mimeType: 'image/png', extension: '.png' };
  }

  // 2. JPEG: FF D8 FF
  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return { format: 'jpeg', mimeType: 'image/jpeg', extension: '.jpg' };
  }

  // 3. WebP: "RIFF" (52 49 46 46) at 0..3 and "WEBP" (57 45 42 50) at 8..11
  if (
    buffer.length >= 12 &&
    buffer[0] === 0x52 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46 &&
    buffer[3] === 0x46 &&
    buffer[8] === 0x57 &&
    buffer[9] === 0x45 &&
    buffer[10] === 0x42 &&
    buffer[11] === 0x50
  ) {
    return { format: 'webp', mimeType: 'image/webp', extension: '.webp' };
  }

  // 4. AVIF: ISO Base Media File Format "ftyp" at 4..7 and brand "avif" or "avis" or "mif1" with avif
  if (
    buffer.length >= 16 &&
    buffer[4] === 0x66 && // 'f'
    buffer[5] === 0x74 && // 't'
    buffer[6] === 0x79 && // 'y'
    buffer[7] === 0x70    // 'p'
  ) {
    const ftypBoxLen = Math.min(buffer.length, Math.max(16, buffer.readUInt32BE(0) || 32));
    const ftypHeader = buffer.subarray(8, Math.min(buffer.length, Math.min(ftypBoxLen, 64))).toString('ascii');
    if (ftypHeader.includes('avif') || ftypHeader.includes('avis')) {
      return { format: 'avif', mimeType: 'image/avif', extension: '.avif' };
    }
  }

  // 5. TIFF: Little-endian "II*\0" (49 49 2A 00) or Big-endian "MM\0*" (4D 4D 00 2A)
  if (
    buffer.length >= 4 &&
    ((buffer[0] === 0x49 && buffer[1] === 0x49 && buffer[2] === 0x2a && buffer[3] === 0x00) ||
      (buffer[0] === 0x4d && buffer[1] === 0x4d && buffer[2] === 0x00 && buffer[3] === 0x2a))
  ) {
    return { format: 'tiff', mimeType: 'image/tiff', extension: '.tiff' };
  }

  // 6. PSD (Adobe Photoshop): "8BPS" (38 42 50 53) + Version 1 (00 01) or 2 (00 02)
  if (
    buffer.length >= 26 &&
    buffer[0] === 0x38 && // '8'
    buffer[1] === 0x42 && // 'B'
    buffer[2] === 0x50 && // 'P'
    buffer[3] === 0x53 && // 'S'
    buffer[4] === 0x00 &&
    (buffer[5] === 0x01 || buffer[5] === 0x02)
  ) {
    return { format: 'psd', mimeType: 'image/vnd.adobe.photoshop', extension: '.psd' };
  }

  // 7. SVG: Textbasiert (keine Null-Bytes im Kopfbereich, beginnt nach optionalem UTF-8 BOM / XML / Kommentaren mit <svg)
  const sampleLen = Math.min(buffer.length, 4096);
  const sample = buffer.subarray(0, sampleLen);
  if (!sample.includes(0x00)) {
    let text = sample.toString('utf8');
    // UTF-8 BOM entfernen
    if (text.charCodeAt(0) === 0xfeff) {
      text = text.slice(1);
    }
    const stripped = text
      .replace(/^\s+/, '')
      .replace(/^<\?xml[\s\S]*?\?>\s*/i, '')
      .replace(/<!--[\s\S]*?-->\s*/g, '')
      .replace(/^<!DOCTYPE\s+svg[\s\S]*?>\s*/i, '')
      .replace(/<!--[\s\S]*?-->\s*/g, '')
      .trimStart();

    if (/^<svg(\s|>)/i.test(stripped) && !/^<!DOCTYPE\s+html/i.test(text) && !/^<html/i.test(stripped)) {
      return { format: 'svg', mimeType: 'image/svg+xml', extension: '.svg' };
    }
  }

  return null;
}
