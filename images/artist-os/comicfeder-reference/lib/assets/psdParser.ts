export interface PsdCompositeResult {
  width: number;
  height: number;
  channels: 4;
  rawRgba: Buffer;
  colorSpace: string;
}

/**
 * Dekodiert PackBits-RLE-komprimierte Daten aus dem PSD Image Data Abschnitt.
 */
function decodePackBits(src: Buffer, offset: number, expectedPixels: number): { data: Uint8Array; nextOffset: number } {
  const out = new Uint8Array(expectedPixels);
  let outPos = 0;
  let pos = offset;

  while (outPos < expectedPixels && pos < src.length) {
    const header = src.readInt8(pos++);
    if (header >= 0) {
      const count = header + 1;
      for (let i = 0; i < count && outPos < expectedPixels && pos < src.length; i++) {
        out[outPos++] = src[pos++];
      }
    } else if (header > -128) {
      const count = 1 - header;
      const val = pos < src.length ? src[pos++] : 0;
      for (let i = 0; i < count && outPos < expectedPixels; i++) {
        out[outPos++] = val;
      }
    }
    // header === -128 ist No-Op
  }

  return { data: out, nextOffset: pos };
}

/**
 * Extrahiert die eingebettete Composite-Vorschau aus einer PSD-Datei (8BPS).
 * Unterstützt unkomprimierte (Raw = 0) und RLE-komprimierte (PackBits = 1) Composite-Daten.
 */
export function extractPsdCompositeToRgba(buffer: Buffer): PsdCompositeResult {
  if (buffer.length < 26 || buffer.toString('ascii', 0, 4) !== '8BPS') {
    throw new Error('Ungültiger PSD-Header (8BPS fehlt).');
  }

  const version = buffer.readUInt16BE(4);
  if (version !== 1 && version !== 2) {
    throw new Error(`Nicht unterstützte PSD-Version: ${version}`);
  }

  const numChannels = buffer.readUInt16BE(12);
  const height = buffer.readUInt32BE(14);
  const width = buffer.readUInt32BE(18);
  const depth = buffer.readUInt16BE(22);
  const colorMode = buffer.readUInt16BE(24); // 1=Grayscale, 3=RGB, 4=CMYK

  if (width === 0 || height === 0 || width > 16384 || height > 16384) {
    throw new Error(`Ungültige PSD-Bildmaße: ${width}x${height}`);
  }

  let offset = 26;

  // 1. Color Mode Data Section überspringen
  const colorModeLen = buffer.readUInt32BE(offset);
  offset += 4 + colorModeLen;

  // 2. Image Resources Section überspringen
  const imageResourcesLen = buffer.readUInt32BE(offset);
  offset += 4 + imageResourcesLen;

  // 3. Layer and Mask Information Section überspringen
  const layerMaskLen = version === 2 ? Number(buffer.readBigUInt64BE(offset)) : buffer.readUInt32BE(offset);
  offset += (version === 2 ? 8 : 4) + layerMaskLen;

  if (offset + 2 > buffer.length) {
    throw new Error('PSD-Datei enthält keine eingebettete Composite-Vorschau.');
  }

  // 4. Image Data Section (Composite Preview)
  const compression = buffer.readUInt16BE(offset);
  offset += 2;

  const pixelCount = width * height;
  const channelsToRead = Math.min(numChannels, 4);
  const channelPlanes: Uint8Array[] = [];

  if (compression === 0) {
    // Raw uncompressed planar data
    const bytesPerSample = depth === 16 ? 2 : 1;
    for (let c = 0; c < channelsToRead; c++) {
      const plane = new Uint8Array(pixelCount);
      for (let i = 0; i < pixelCount; i++) {
        const samplePos = offset + (c * pixelCount + i) * bytesPerSample;
        plane[i] = samplePos < buffer.length ? buffer[samplePos] : 255;
      }
      channelPlanes.push(plane);
    }
  } else if (compression === 1) {
    // RLE PackBits: zuerst (height * numChannels) Scanline-Längen überspringen
    const countBytes = (version === 2 ? 4 : 2) * height * numChannels;
    offset += countBytes;
    for (let c = 0; c < channelsToRead; c++) {
      const decoded = decodePackBits(buffer, offset, pixelCount);
      channelPlanes.push(decoded.data);
      offset = decoded.nextOffset;
    }
  } else {
    throw new Error(`Nicht unterstützte PSD-Kompression: ${compression}`);
  }

  const rawRgba = Buffer.alloc(pixelCount * 4);
  for (let i = 0; i < pixelCount; i++) {
    const outIdx = i * 4;
    if (colorMode === 1 || channelPlanes.length === 1) {
      // Grayscale
      const g = channelPlanes[0]?.[i] ?? 128;
      rawRgba[outIdx] = g;
      rawRgba[outIdx + 1] = g;
      rawRgba[outIdx + 2] = g;
      rawRgba[outIdx + 3] = 255;
    } else {
      // RGB / RGBA
      rawRgba[outIdx] = channelPlanes[0]?.[i] ?? 0;
      rawRgba[outIdx + 1] = channelPlanes[1]?.[i] ?? 0;
      rawRgba[outIdx + 2] = channelPlanes[2]?.[i] ?? 0;
      rawRgba[outIdx + 3] = channelPlanes[3] ? channelPlanes[3][i] : 255;
    }
  }

  const colorSpace = colorMode === 1 ? 'b-w' : colorMode === 4 ? 'cmyk' : 'srgb';
  return {
    width,
    height,
    channels: 4,
    rawRgba,
    colorSpace,
  };
}

/**
 * Erzeugt einen validen unkomprimierten PSD-Buffer (8BPS) für Tests.
 */
export function createMinimalPsdBuffer(width = 16, height = 16, rgb: [number, number, number] = [40, 120, 200]): Buffer {
  const pixelCount = width * height;
  // Header (26) + ColorMode(4) + ImageRes(4) + LayerMask(4) + Compression(2) + 3 * pixelCount
  const buf = Buffer.alloc(26 + 4 + 4 + 4 + 2 + pixelCount * 3);
  buf.write('8BPS', 0, 'ascii');
  buf.writeUInt16BE(1, 4); // Version 1
  buf.writeUInt16BE(3, 12); // 3 Channels (RGB)
  buf.writeUInt32BE(height, 14);
  buf.writeUInt32BE(width, 18);
  buf.writeUInt16BE(8, 22); // 8-bit
  buf.writeUInt16BE(3, 24); // RGB mode

  // Color Mode (0), Image Resources (0), Layer Mask (0) sind bereits 0
  const dataOffset = 26 + 4 + 4 + 4;
  buf.writeUInt16BE(0, dataOffset); // Compression 0 = Raw

  const planesOffset = dataOffset + 2;
  buf.fill(rgb[0], planesOffset, planesOffset + pixelCount);
  buf.fill(rgb[1], planesOffset + pixelCount, planesOffset + pixelCount * 2);
  buf.fill(rgb[2], planesOffset + pixelCount * 2, planesOffset + pixelCount * 3);

  return buf;
}
