import crypto from 'crypto';
import sharp from 'sharp';

const CANONICAL_SIZE = 256; // 32 x 32 = 1024 Blöcke à 8x8
const BLOCK_SIZE = 8;
const BLOCKS_PER_SIDE = CANONICAL_SIZE / BLOCK_SIZE; // 32
const TOTAL_BLOCKS = BLOCKS_PER_SIDE * BLOCKS_PER_SIDE; // 1024
const PAYLOAD_BYTES = 22; // 2B Magic + 4B OwnerShortId + 4B AssetShortId + 4B Timestamp + 8B HMAC-SHA256
const PAYLOAD_BITS = PAYLOAD_BYTES * 8; // 176 Bits
const REDUNDANCY = 5; // Ungerade Anzahl (5 Kopien pro Bit = 880 genutzte 8x8-Blöcke) für Mehrheitsentscheid
const MAGIC_HEADER = 0xfe44;

export interface WatermarkPayloadInput {
  ownerId: string;
  assetId: string;
  timestampSec?: number;
  secret?: string;
}

export interface WatermarkVerificationResult {
  found: boolean;
  signatureValid: boolean;
  ownerShortId: string | null;
  assetShortId: string | null;
  timestampSec: number | null;
  timestampIso: string | null;
  bitAgreement: number;
}

export function getWatermarkSecret(explicitSecret?: string): string {
  const s = (explicitSecret || process.env.WATERMARK_SECRET || process.env.SESSION_SECRET || '').trim();
  if (!s) {
    return 'federfuehrer-default-dev-watermark-secret-key';
  }
  return s;
}

/**
 * Extrahiert eine 8-stellige Hex-Kurz-ID (4 Bytes) aus einer UUID oder beliebigen ID.
 */
export function toShortHexId(id: string): string {
  const hexOnly = id.replace(/[^0-9a-fA-F]/g, '').toLowerCase();
  if (hexOnly.length >= 8) {
    return hexOnly.slice(0, 8);
  }
  return crypto.createHash('sha256').update(id).digest('hex').slice(0, 8);
}

/**
 * Erzeugt das 22-Byte Wasserzeichen-Paket inkl. 64-Bit HMAC-SHA256 Signatur.
 */
export function buildSignedPayloadBytes(input: WatermarkPayloadInput): {
  bytes: Buffer;
  ownerShortId: string;
  assetShortId: string;
  timestampSec: number;
} {
  const secret = getWatermarkSecret(input.secret);
  const ownerShortId = toShortHexId(input.ownerId);
  const assetShortId = toShortHexId(input.assetId);
  const timestampSec = input.timestampSec ?? Math.floor(Date.now() / 1000);

  const buf = Buffer.alloc(PAYLOAD_BYTES);
  buf.writeUInt16BE(MAGIC_HEADER, 0);
  Buffer.from(ownerShortId, 'hex').copy(buf, 2);
  Buffer.from(assetShortId, 'hex').copy(buf, 6);
  buf.writeUInt32BE(timestampSec >>> 0, 10);

  const hmac = crypto.createHmac('sha256', secret).update(buf.subarray(0, 14)).digest();
  hmac.subarray(0, 8).copy(buf, 14);

  return { bytes: buf, ownerShortId, assetShortId, timestampSec };
}

/**
 * Deterministische Block-Permutation auf Basis des WATERMARK_SECRET,
 * damit die 5 Kopien jedes Bits gleichmäßig über das gesamte Bild verteilt sind.
 */
function getBlockPermutation(secret: string): number[] {
  const indices = Array.from({ length: TOTAL_BLOCKS }, (_, i) => i);
  let seedBuf = crypto.createHash('sha256').update(`perm:${secret}`).digest();
  let offset = 0;

  for (let i = TOTAL_BLOCKS - 1; i > 0; i--) {
    if (offset + 4 > seedBuf.length) {
      seedBuf = crypto.createHash('sha256').update(seedBuf).digest();
      offset = 0;
    }
    const rand = seedBuf.readUInt32BE(offset);
    offset += 4;
    const j = rand % (i + 1);
    const tmp = indices[i];
    indices[i] = indices[j];
    indices[j] = tmp;
  }

  return indices;
}

// Vorberechnete Kosinus-Tabelle für schnelle und exakte 8x8 DCT / IDCT
const COS_TABLE: number[][] = Array.from({ length: 8 }, (_, u) =>
  Array.from({ length: 8 }, (_, x) => Math.cos(((2 * x + 1) * u * Math.PI) / 16))
);
const ALPHA = (u: number) => (u === 0 ? Math.SQRT1_2 : 1.0);

function dct8x8(block: Float64Array): Float64Array {
  const out = new Float64Array(64);
  for (let u = 0; u < 8; u++) {
    for (let v = 0; v < 8; v++) {
      let sum = 0;
      for (let x = 0; x < 8; x++) {
        const cosUX = COS_TABLE[u][x];
        const rowOff = x * 8;
        for (let y = 0; y < 8; y++) {
          sum += block[rowOff + y] * cosUX * COS_TABLE[v][y];
        }
      }
      out[u * 8 + v] = 0.25 * ALPHA(u) * ALPHA(v) * sum;
    }
  }
  return out;
}

function idct8x8(coeff: Float64Array): Float64Array {
  const out = new Float64Array(64);
  for (let x = 0; x < 8; x++) {
    for (let y = 0; y < 8; y++) {
      let sum = 0;
      for (let u = 0; u < 8; u++) {
        const aU = ALPHA(u) * COS_TABLE[u][x];
        const rowOff = u * 8;
        for (let v = 0; v < 8; v++) {
          sum += aU * ALPHA(v) * coeff[rowOff + v] * COS_TABLE[v][y];
        }
      }
      out[x * 8 + y] = 0.25 * sum;
    }
  }
  return out;
}

/**
 * Berechnet das kanonische 256x256 Luminanz-Raster (Y = 0.299 R + 0.587 G + 0.114 B)
 * durch flächenproportionales Mittel (Area Averaging), sodass Skalierungen (z.B. auf 75 %)
 * exakt dieselben 8x8-Blöcke abbilden.
 */
function computeCanonicalLuminance(rgba: Buffer, width: number, height: number): Float64Array {
  const grid = new Float64Array(CANONICAL_SIZE * CANONICAL_SIZE);

  for (let cy = 0; cy < CANONICAL_SIZE; cy++) {
    const y0 = Math.floor((cy * height) / CANONICAL_SIZE);
    const y1 = Math.max(y0 + 1, Math.floor(((cy + 1) * height) / CANONICAL_SIZE));
    for (let cx = 0; cx < CANONICAL_SIZE; cx++) {
      const x0 = Math.floor((cx * width) / CANONICAL_SIZE);
      const x1 = Math.max(x0 + 1, Math.floor(((cx + 1) * width) / CANONICAL_SIZE));

      let sumY = 0;
      let count = 0;
      for (let py = y0; py < y1 && py < height; py++) {
        for (let px = x0; px < x1 && px < width; px++) {
          const idx = (py * width + px) * 4;
          const r = rgba[idx];
          const g = rgba[idx + 1];
          const b = rgba[idx + 2];
          sumY += 0.299 * r + 0.587 * g + 0.114 * b;
          count++;
        }
      }
      grid[cy * CANONICAL_SIZE + cx] = count > 0 ? sumY / count : 128;
    }
  }

  return grid;
}

/**
 * Bettet das unsichtbare Wasserzeichen per 8x8-DCT in der Luminanz ein,
 * mit 5-facher räumlicher Redundanz und HMAC-SHA256 Signatur.
 */
export async function embedInvisibleWatermark(
  imageBuffer: Buffer,
  payloadInput: WatermarkPayloadInput
): Promise<{
  buffer: Buffer;
  ownerShortId: string;
  assetShortId: string;
  timestampSec: number;
  payloadHex: string;
}> {
  const secret = getWatermarkSecret(payloadInput.secret);
  const { bytes: payloadBytes, ownerShortId, assetShortId, timestampSec } = buildSignedPayloadBytes({
    ...payloadInput,
    secret,
  });

  const bits: number[] = [];
  for (let i = 0; i < payloadBytes.length; i++) {
    const byte = payloadBytes[i];
    for (let b = 7; b >= 0; b--) {
      bits.push((byte >> b) & 1);
    }
  }

  const { data: rawRgba, info } = await sharp(imageBuffer)
    .toColorspace('srgb')
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const width = info.width;
  const height = info.height;

  const origGrid = computeCanonicalLuminance(rawRgba, width, height);
  const modGrid = new Float64Array(origGrid);

  const perm = getBlockPermutation(secret);
  const delta = 52; // Robuste Differenz für DCT(1,0) vs DCT(0,1) und DCT(2,0) vs DCT(0,2)

  for (let bitIdx = 0; bitIdx < PAYLOAD_BITS; bitIdx++) {
    const bit = bits[bitIdx];
    for (let r = 0; r < REDUNDANCY; r++) {
      const slot = bitIdx * REDUNDANCY + r;
      const blockIndex = perm[slot];
      const bx = (blockIndex % BLOCKS_PER_SIDE) * BLOCK_SIZE;
      const by = Math.floor(blockIndex / BLOCKS_PER_SIDE) * BLOCK_SIZE;

      const block = new Float64Array(64);
      for (let y = 0; y < 8; y++) {
        for (let x = 0; x < 8; x++) {
          block[y * 8 + x] = origGrid[(by + y) * CANONICAL_SIZE + (bx + x)] - 128;
        }
      }

      const coeff = dct8x8(block);

      // DC-Koeffizient leicht vom Sättigungsrand (0 / 255) fernhalten, damit die Welle nicht clippt
      if (coeff[0] > 820) coeff[0] = 820;
      if (coeff[0] < -820) coeff[0] = -820;

      // Paar 1: (1,0) [Index 8] vs (0,1) [Index 1]
      const c10 = coeff[1 * 8 + 0];
      const c01 = coeff[0 * 8 + 1];
      const avg1 = (c10 + c01) * 0.5;

      // Paar 2: (2,0) [Index 16] vs (0,2) [Index 2]
      const c20 = coeff[2 * 8 + 0];
      const c02 = coeff[0 * 8 + 2];
      const avg2 = (c20 + c02) * 0.5;

      if (bit === 1) {
        if (c10 - c01 < delta) {
          coeff[1 * 8 + 0] = avg1 + delta * 0.5;
          coeff[0 * 8 + 1] = avg1 - delta * 0.5;
        }
        if (c20 - c02 < delta * 0.6) {
          coeff[2 * 8 + 0] = avg2 + delta * 0.3;
          coeff[0 * 8 + 2] = avg2 - delta * 0.3;
        }
      } else {
        if (c01 - c10 < delta) {
          coeff[1 * 8 + 0] = avg1 - delta * 0.5;
          coeff[0 * 8 + 1] = avg1 + delta * 0.5;
        }
        if (c02 - c20 < delta * 0.6) {
          coeff[2 * 8 + 0] = avg2 - delta * 0.3;
          coeff[0 * 8 + 2] = avg2 + delta * 0.3;
        }
      }

      const spatial = idct8x8(coeff);
      for (let y = 0; y < 8; y++) {
        for (let x = 0; x < 8; x++) {
          modGrid[(by + y) * CANONICAL_SIZE + (bx + x)] = spatial[y * 8 + x] + 128;
        }
      }
    }
  }

  // Luminanz-Differenz (dY) auf das volle Bild übertragen
  const outRgba = Buffer.from(rawRgba);
  for (let py = 0; py < height; py++) {
    const cy = Math.min(CANONICAL_SIZE - 1, Math.floor((py * CANONICAL_SIZE) / height));
    for (let px = 0; px < width; px++) {
      const cx = Math.min(CANONICAL_SIZE - 1, Math.floor((px * CANONICAL_SIZE) / width));
      const cIdx = cy * CANONICAL_SIZE + cx;
      const dY = modGrid[cIdx] - origGrid[cIdx];

      const idx = (py * width + px) * 4;
      const r = outRgba[idx];
      const g = outRgba[idx + 1];
      const b = outRgba[idx + 2];
      const curY = 0.299 * r + 0.587 * g + 0.114 * b;

      // Falls Pixel extrem gesättigt (0 oder 255), Basis-Luminanz sanft in den Arbeitsbereich rücken
      let shift = dY;
      if (curY + shift > 254) shift = 254 - curY;
      if (curY + shift < 1) shift = 1 - curY;

      outRgba[idx] = Math.max(0, Math.min(255, Math.round(r + shift)));
      outRgba[idx + 1] = Math.max(0, Math.min(255, Math.round(g + shift)));
      outRgba[idx + 2] = Math.max(0, Math.min(255, Math.round(b + shift)));
    }
  }

  const outPng = await sharp(outRgba, {
    raw: { width, height, channels: 4 },
  })
    .png({ compressionLevel: 6 })
    .toBuffer();

  return {
    buffer: outPng,
    ownerShortId,
    assetShortId,
    timestampSec,
    payloadHex: payloadBytes.toString('hex'),
  };
}

/**
 * Liest das unsichtbare 8x8-DCT-Wasserzeichen per Mehrheitsentscheid aus einer Bilddatei aus
 * und prüft den Magic-Header sowie die HMAC-SHA256 Signatur.
 */
export async function extractInvisibleWatermark(
  imageBuffer: Buffer,
  explicitSecret?: string
): Promise<WatermarkVerificationResult> {
  const secret = getWatermarkSecret(explicitSecret);

  const { data: rawRgba, info } = await sharp(imageBuffer)
    .toColorspace('srgb')
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const grid = computeCanonicalLuminance(rawRgba, info.width, info.height);
  const perm = getBlockPermutation(secret);

  const recoveredBits: number[] = [];
  let unanimousOrStrongVotes = 0;

  for (let bitIdx = 0; bitIdx < PAYLOAD_BITS; bitIdx++) {
    let votesForOne = 0;
    let softScore = 0;

    for (let r = 0; r < REDUNDANCY; r++) {
      const slot = bitIdx * REDUNDANCY + r;
      const blockIndex = perm[slot];
      const bx = (blockIndex % BLOCKS_PER_SIDE) * BLOCK_SIZE;
      const by = Math.floor(blockIndex / BLOCKS_PER_SIDE) * BLOCK_SIZE;

      const block = new Float64Array(64);
      for (let y = 0; y < 8; y++) {
        for (let x = 0; x < 8; x++) {
          block[y * 8 + x] = grid[(by + y) * CANONICAL_SIZE + (bx + x)] - 128;
        }
      }

      const coeff = dct8x8(block);
      const diff1 = coeff[1 * 8 + 0] - coeff[0 * 8 + 1];
      const diff2 = coeff[2 * 8 + 0] - coeff[0 * 8 + 2];
      const combinedDiff = diff1 + 0.5 * diff2;

      softScore += combinedDiff;
      if (combinedDiff >= 0) {
        votesForOne++;
      }
    }

    // Mehrheitsentscheid über die 5 redundanten 8x8-Blöcke
    const bit = votesForOne >= 3 ? 1 : 0;
    recoveredBits.push(bit);

    const winningVotes = bit === 1 ? votesForOne : REDUNDANCY - votesForOne;
    unanimousOrStrongVotes += winningVotes / REDUNDANCY;
  }

  const outBytes = Buffer.alloc(PAYLOAD_BYTES);
  for (let i = 0; i < PAYLOAD_BYTES; i++) {
    let byte = 0;
    for (let b = 0; b < 8; b++) {
      byte = (byte << 1) | recoveredBits[i * 8 + b];
    }
    outBytes[i] = byte;
  }

  const magic = outBytes.readUInt16BE(0);
  if (magic !== MAGIC_HEADER) {
    return {
      found: false,
      signatureValid: false,
      ownerShortId: null,
      assetShortId: null,
      timestampSec: null,
      timestampIso: null,
      bitAgreement: Number((unanimousOrStrongVotes / PAYLOAD_BITS).toFixed(3)),
    };
  }

  const ownerShortId = outBytes.subarray(2, 6).toString('hex');
  const assetShortId = outBytes.subarray(6, 10).toString('hex');
  const timestampSec = outBytes.readUInt32BE(10);
  const extractedHmac = outBytes.subarray(14, 22);

  const expectedHmac = crypto
    .createHmac('sha256', secret)
    .update(outBytes.subarray(0, 14))
    .digest()
    .subarray(0, 8);

  const signatureValid = crypto.timingSafeEqual(extractedHmac, expectedHmac);

  return {
    found: true,
    signatureValid,
    ownerShortId,
    assetShortId,
    timestampSec,
    timestampIso: new Date(timestampSec * 1000).toISOString(),
    bitAgreement: Number((unanimousOrStrongVotes / PAYLOAD_BITS).toFixed(3)),
  };
}
