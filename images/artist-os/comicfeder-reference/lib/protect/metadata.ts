import sharp from 'sharp';

export interface ArtworkMetadataInput {
  creator: string;
  copyright: string;
  dataMining?: 'Prohibited';
  pHash?: string;
  assetId?: string;
}

/**
 * Berechnet einen 64-Bit DCT Perceptual Hash (pHash, 16 Hex-Zeichen) eines Bildes.
 */
export async function computePHash(imageBuffer: Buffer): Promise<string> {
  const size = 32;
  const { data } = await sharp(imageBuffer)
    .grayscale()
    .resize(size, size, { fit: 'fill' })
    .raw()
    .toBuffer({ resolveWithObject: true });

  // 2D-DCT der oberen linken 8x8 Niederfrequenz-Koeffizienten auf dem 32x32 Raster
  const coeffs: number[] = [];
  for (let u = 0; u < 8; u++) {
    for (let v = 0; v < 8; v++) {
      if (u === 0 && v === 0) continue; // DC überspringen
      let sum = 0;
      for (let x = 0; x < size; x++) {
        const cosU = Math.cos(((2 * x + 1) * u * Math.PI) / (2 * size));
        for (let y = 0; y < size; y++) {
          const cosV = Math.cos(((2 * y + 1) * v * Math.PI) / (2 * size));
          sum += data[x * size + y] * cosU * cosV;
        }
      }
      coeffs.push(sum);
    }
  }
  // 64. Element auffüllen (DC-Mittelwert als Referenzpunkt)
  while (coeffs.length < 64) {
    coeffs.push(0);
  }

  const sorted = [...coeffs].sort((a, b) => a - b);
  const median = sorted[32];

  let hex = '';
  for (let i = 0; i < 64; i += 4) {
    let nibble = 0;
    for (let b = 0; b < 4; b++) {
      if (coeffs[i + b] >= median) {
        nibble |= 1 << (3 - b);
      }
    }
    hex += nibble.toString(16);
  }

  return hex;
}

/**
 * Berechnet die Bit-Hamming-Distanz zwischen zwei 64-Bit-Hex-pHashes.
 */
export function hammingDistanceHex(hexA: string, hexB: string): number {
  const len = Math.min(hexA.length, hexB.length);
  let dist = Math.abs(hexA.length - hexB.length) * 4;
  for (let i = 0; i < len; i++) {
    const a = parseInt(hexA[i], 16) || 0;
    const b = parseInt(hexB[i], 16) || 0;
    let xor = a ^ b;
    while (xor > 0) {
      dist += xor & 1;
      xor >>= 1;
    }
  }
  return dist;
}

/**
 * Erzeugt ein standardkonformes IPTC/XMP-Paket mit Urheberin, Copyright und "Data Mining: Prohibited".
 */
export function buildXmpPacket(meta: ArtworkMetadataInput): string {
  const esc = (s: string) =>
    s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

  const creator = esc(meta.creator || 'Urheberin');
  const copyright = esc(meta.copyright || `© ${new Date().getFullYear()} ${meta.creator || 'Urheberin'}`);
  const pHash = esc(meta.pHash || '');

  return `<?xpacket begin="\uFEFF" id="W5M0MpCehiHzreSzNTczkc9d"?>
<x:xmpmeta xmlns:x="adobe:ns:meta/">
  <rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#"
           xmlns:dc="http://purl.org/dc/elements/1.1/"
           xmlns:xmpRights="http://ns.adobe.com/xap/1.0/rights/"
           xmlns:plus="http://ns.useplus.org/ldf/xmp/1.0/"
           xmlns:iptcExt="http://iptc.org/std/Iptc4xmpExt/2008-02-29/"
           xmlns:federfuehrer="https://federfuehrer.local/ns/1.0/">
    <rdf:Description rdf:about="">
      <dc:creator><rdf:Seq><rdf:li>${creator}</rdf:li></rdf:Seq></dc:creator>
      <dc:rights><rdf:Alt><rdf:li xml:lang="x-default">${copyright}</rdf:li></rdf:Alt></dc:rights>
      <xmpRights:Marked>True</xmpRights:Marked>
      <plus:DataMining>http://ns.useplus.org/ldf/vocab/DMI-PROHIBITED</plus:DataMining>
      <iptcExt:DataMining>Prohibited</iptcExt:DataMining>
      <federfuehrer:DataMining>Data Mining: Prohibited</federfuehrer:DataMining>
      <federfuehrer:pHash>${pHash}</federfuehrer:pHash>
    </rdf:Description>
  </rdf:RDF>
</x:xmpmeta>
<?xpacket end="w"?>`;
}

// CRC32-Berechnung für PNG-Chunks
const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[n] = c >>> 0;
  }
  return table;
})();

function crc32(buf: Buffer): number {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
}

function createPngChunk(type: string, data: Buffer): Buffer {
  const lenBuf = Buffer.alloc(4);
  lenBuf.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, 'ascii');
  const crcInput = Buffer.concat([typeBuf, data]);
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(crcInput), 0);
  return Buffer.concat([lenBuf, typeBuf, data, crcBuf]);
}

function createPngTextChunk(keyword: string, value: string): Buffer {
  const keyBuf = Buffer.from(keyword, 'latin1');
  const valBuf = Buffer.from(value, 'utf8');
  return createPngChunk('tEXt', Buffer.concat([keyBuf, Buffer.from([0]), valBuf]));
}

function createPngItxtChunk(keyword: string, value: string): Buffer {
  // iTXt: keyword + \0 + compressionFlag(0) + compressionMethod(0) + languageTag("") + \0 + translatedKeyword("") + \0 + UTF-8 text
  const header = Buffer.concat([
    Buffer.from(keyword, 'latin1'),
    Buffer.from([0, 0, 0, 0, 0]),
  ]);
  const textBuf = Buffer.from(value, 'utf8');
  return createPngChunk('iTXt', Buffer.concat([header, textBuf]));
}

/**
 * Bettet IPTC/XMP-Metadaten (Urheberin, Copyright, "Data Mining: Prohibited") direkt in einen PNG-Buffer ein.
 */
export function embedPngProtectionMetadata(pngBuffer: Buffer, meta: ArtworkMetadataInput): Buffer {
  // Prüfe PNG-Signatur
  if (pngBuffer.length < 16 || pngBuffer[0] !== 0x89 || pngBuffer[1] !== 0x50) {
    return pngBuffer;
  }

  const xmp = buildXmpPacket(meta);
  const chunksToInsert = [
    createPngItxtChunk('XML:com.adobe.xmp', xmp),
    createPngTextChunk('Author', meta.creator),
    createPngTextChunk('Copyright', meta.copyright),
    createPngTextChunk('Data-Mining', 'Data Mining: Prohibited'),
  ];

  // Finde IEND-Chunk am Ende der PNG-Datei (letzte 12 Bytes)
  const iendOffset = pngBuffer.lastIndexOf(Buffer.from('IEND', 'ascii'));
  if (iendOffset < 8) {
    return pngBuffer;
  }
  const splitPos = iendOffset - 4; // 4 Bytes vor 'IEND' steht die Länge (00 00 00 00)

  return Buffer.concat([
    pngBuffer.subarray(0, splitPos),
    ...chunksToInsert,
    pngBuffer.subarray(splitPos),
  ]);
}

/**
 * Liest eingebettete IPTC/XMP-Schutzmetadaten aus einem PNG/PDF-Buffer aus.
 */
export function extractProtectionMetadataFromBuffer(buffer: Buffer): {
  hasDataMiningProhibited: boolean;
  creator: string | null;
  copyright: string | null;
  rawXmp: string | null;
} {
  const str = buffer.toString('utf8');
  const xmpStart = str.indexOf('<x:xmpmeta');
  const xmpEnd = str.indexOf('</x:xmpmeta>');
  const rawXmp = xmpStart !== -1 && xmpEnd !== -1 ? str.slice(xmpStart, xmpEnd + 12) : null;

  const creatorMatch = str.match(/<dc:creator>[\s\S]*?<rdf:li>([^<]+)<\/rdf:li>/);
  const rightsMatch = str.match(/<dc:rights>[\s\S]*?<rdf:li[^>]*>([^<]+)<\/rdf:li>/);
  const hasDataMiningProhibited =
    str.includes('Data Mining: Prohibited') ||
    str.includes('DMI-PROHIBITED') ||
    str.includes('<iptcExt:DataMining>Prohibited</iptcExt:DataMining>');

  return {
    hasDataMiningProhibited,
    creator: creatorMatch ? creatorMatch[1] : null,
    copyright: rightsMatch ? rightsMatch[1] : null,
    rawXmp,
  };
}
