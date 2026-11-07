import fs from 'fs';
import { extractKraImage } from '../../modules/kra/index.js';
import path from 'path';
import crypto from 'crypto';
import { Router, Request, Response } from 'express';
import multer from 'multer';
import sharp from 'sharp';
import { eq, and, desc, isNull } from 'drizzle-orm';
import { getDb, schema } from '../db.js';
import { repo } from '../repo.js';
import type { AuthUser } from '../auth.js';
import { detectFormatByMagicBytes, type SupportedAssetFormat, type DetectedAssetFormat } from './magicBytes.js';
import { sanitizeSvg } from './svgSanitizer.js';
import { extractPsdCompositeToRgba, createMinimalPsdBuffer } from './psdParser.js';

export { detectFormatByMagicBytes, sanitizeSvg, extractPsdCompositeToRgba, createMinimalPsdBuffer };
export type { SupportedAssetFormat, DetectedAssetFormat };

export function getAssetsDir(): string {
  const dir = process.env.ASSETS_DIR
    ? path.resolve(process.env.ASSETS_DIR)
    : path.resolve(process.cwd(), 'data', 'assets');
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  return dir;
}

export function getMaxAssetBytes(): number {
  const envVal = parseInt(process.env.MAX_ASSET_BYTES || '', 10);
  return Number.isFinite(envVal) && envVal > 0 ? envVal : 50 * 1024 * 1024; // Standard 50 MB
}

export interface IngestAssetInput {
  ownerId: string;
  buffer: Buffer;
  originalFilename?: string;
  title?: string;
  tags?: string[];
  characterId?: string | null;
  locationId?: string | null;
  sceneId?: string | null;
}

export interface AssetRecordDto {
  id: string;
  ownerId: string;
  projectId: string;
  title: string;
  originalFilename: string;
  sha256: string;
  mimeType: string;
  bytes: number;
  width: number;
  height: number;
  colorSpace: string;
  tags: string[];
  characterId: string | null;
  locationId: string | null;
  sceneId: string | null;
  isDuplicate?: boolean;
  duplicateOf?: string | null;
  variants: {
    original: string;
    thumbnail: string;
    preview: string;
    print: string;
  };
  createdAt: number;
  updatedAt: number;
}

function formatAssetDto(row: any, duplicateOf?: string | null): AssetRecordDto {
  return {
    id: row.id,
    ownerId: row.ownerId,
    projectId: row.projectId,
    title: row.title,
    originalFilename: row.originalFilename,
    sha256: row.sha256,
    mimeType: row.mimeType,
    bytes: row.bytes,
    width: row.width,
    height: row.height,
    colorSpace: row.colorSpace,
    tags: Array.isArray(row.tags) ? row.tags : [],
    characterId: row.characterId || null,
    locationId: row.locationId || null,
    sceneId: row.sceneId || null,
    isDuplicate: Boolean(duplicateOf),
    duplicateOf: duplicateOf || null,
    variants: {
      original: `/api/v1/assets/${row.id}/original`,
      thumbnail: `/api/v1/assets/${row.id}/thumbnail`,
      preview: `/api/v1/assets/${row.id}/preview`,
      print: `/api/v1/assets/${row.id}/print`,
    },
    createdAt: row.createdAt instanceof Date ? row.createdAt.getTime() : Date.now(),
    updatedAt: row.updatedAt instanceof Date ? row.updatedAt.getTime() : Date.now(),
  };
}

/**
 * Prüft Datei über Magic Bytes, speichert das Original unter ASSETS_DIR,
 * erzeugt Thumbnail, Arbeitsvorschau und Druckfassung (sRGB, ohne EXIF/GPS)
 * und legt den Metadaten-Datensatz mit owner_id-Isolation in der Datenbank an.
 */
export async function ingestAssetBuffer(input: IngestAssetInput): Promise<AssetRecordDto> {
  const { ownerId, buffer } = input;
  if (!ownerId) {
    throw new Error('owner_id ist erforderlich.');
  }

  const maxBytes = getMaxAssetBytes();
  if (!buffer || buffer.length === 0) {
    throw new Error('Leere Datei übergeben.');
  }
  if (buffer.length > maxBytes) {
    const err: any = new Error(`Die Datei überschreitet das Limit von ${maxBytes} Bytes (MAX_ASSET_BYTES).`);
    err.statusCode = 413;
    throw err;
  }

  // 1. Magic-Byte-Erkennung (niemals Dateiendung vertrauen!)
  const detected = detectFormatByMagicBytes(buffer);
  if (!detected) {
    const err: any = new Error(
      'Ungültiges oder nicht unterstütztes Dateiformat (Magic-Byte-Prüfung fehlgeschlagen). Erlaubt: PNG, JPEG, WebP, AVIF, TIFF, SVG, PSD, KRA.'
    );
    err.statusCode = 400;
    throw err;
  }

  // 2. Bei SVG serverseitig bereinigen
  let bufferToStore = buffer;
  if (detected.format === 'svg') {
    const cleanedSvg = sanitizeSvg(buffer);
    bufferToStore = Buffer.from(cleanedSvg, 'utf8');
  }

  // Keep the KRA original; only derivatives use the bounded composite extraction.
  let rasterBuffer = bufferToStore;
  if (detected.format === 'kra') {
    try { rasterBuffer = (await extractKraImage(buffer, { maxArchiveBytes: maxBytes })).buffer; }
    catch (error) { throw Object.assign(error instanceof Error ? error : new Error(String(error)), { statusCode: 400 }); }
  }

  // 3. SHA-256 berechnen
  const sha256 = crypto.createHash('sha256').update(bufferToStore).digest('hex');

  // 4. Dubletten-Prüfung über den Hash innerhalb desselben owner_id
  const db = getDb();
  if (!db) throw new Error('Datenbank nicht verfügbar');

  const existingSameHash = await db
    .select()
    .from(schema.assets)
    .where(
      and(
        eq(schema.assets.ownerId, ownerId),
        eq(schema.assets.sha256, sha256),
        isNull(schema.assets.deletedAt)
      )
    )
    .limit(1);

  const duplicateOf = existingSameHash.length > 0 ? existingSameHash[0].id : null;

  // 5. Bildmaße, Farbraum und Sharp-Instanz für Varianten bestimmen
  let width = 0;
  let height = 0;
  let colorSpace = 'srgb';
  let sharpBase: ReturnType<typeof sharp>;

  if (detected.format === 'psd') {
    const psd = extractPsdCompositeToRgba(bufferToStore);
    width = psd.width;
    height = psd.height;
    colorSpace = psd.colorSpace;
    sharpBase = sharp(psd.rawRgba, {
      raw: { width: psd.width, height: psd.height, channels: 4 },
    });
  } else {
    sharpBase = sharp(rasterBuffer, { failOn: 'none' });
    const meta = await sharpBase.metadata();
    width = meta.width || 512;
    height = meta.height || 512;
    colorSpace = meta.space || 'srgb';
  }

  // 6. Verzeichnis unter ASSETS_DIR anlegen und Original unverändert speichern
  const assetId = crypto.randomUUID();
  const assetsDir = getAssetsDir();
  const ownerDir = path.join(assetsDir, ownerId, assetId);
  fs.mkdirSync(ownerDir, { recursive: true });

  const originalPath = path.join(ownerDir, `original${detected.extension}`);
  const thumbnailPath = path.join(ownerDir, 'thumbnail.png');
  const previewPath = path.join(ownerDir, 'preview.png');
  const printPath = path.join(ownerDir, 'print.png');

  fs.writeFileSync(originalPath, bufferToStore);

  // 7. Varianten mit sharp erzeugen: jeweils sRGB und ohne EXIF/GPS (standardmäßig bei sharp ohne .withMetadata())
  const makeSharpInstance = () => {
    if (detected.format === 'psd') {
      const psd = extractPsdCompositeToRgba(bufferToStore);
      return sharp(psd.rawRgba, {
        raw: { width: psd.width, height: psd.height, channels: 4 },
      });
    }
    return sharp(rasterBuffer, { failOn: 'none' });
  };

  await makeSharpInstance()
    .rotate() // Auto-Orientierung anhand EXIF vor dem Strippen
    .toColorspace('srgb')
    .resize(256, 256, { fit: 'inside', withoutEnlargement: true })
    .png({ compressionLevel: 8 })
    .toFile(thumbnailPath);

  await makeSharpInstance()
    .rotate()
    .toColorspace('srgb')
    .resize(1400, 1400, { fit: 'inside', withoutEnlargement: true })
    .png({ compressionLevel: 7 })
    .toFile(previewPath);

  await makeSharpInstance()
    .rotate()
    .toColorspace('srgb')
    .png({ compressionLevel: 6 })
    .toFile(printPath);

  // 8. Verknüpfungen (characterId, locationId, sceneId) gegen owner_id validieren
  let validCharacterId: string | null = null;
  if (input.characterId) {
    const [ch] = await db
      .select({ id: schema.characters.id })
      .from(schema.characters)
      .where(and(eq(schema.characters.ownerId, ownerId), eq(schema.characters.id, input.characterId)))
      .limit(1);
    if (ch) validCharacterId = ch.id;
  }

  let validLocationId: string | null = null;
  if (input.locationId) {
    const [loc] = await db
      .select({ id: schema.locations.id })
      .from(schema.locations)
      .where(and(eq(schema.locations.ownerId, ownerId), eq(schema.locations.id, input.locationId)))
      .limit(1);
    if (loc) validLocationId = loc.id;
  }

  let validSceneId: string | null = null;
  if (input.sceneId) {
    const [sc] = await db
      .select({ id: schema.scenes.id })
      .from(schema.scenes)
      .where(and(eq(schema.scenes.ownerId, ownerId), eq(schema.scenes.id, input.sceneId)))
      .limit(1);
    if (sc) validSceneId = sc.id;
  }

  const project = await repo.getWork(ownerId);
  const cleanTags = Array.isArray(input.tags)
    ? input.tags.map((t) => String(t).trim()).filter(Boolean)
    : [];

  const [created] = await db
    .insert(schema.assets)
    .values({
      id: assetId,
      ownerId,
      projectId: project.id,
      title: (input.title || input.originalFilename || `Asset ${assetId.slice(0, 8)}`).trim(),
      originalFilename: input.originalFilename || `upload${detected.extension}`,
      sha256,
      mimeType: detected.mimeType,
      bytes: bufferToStore.length,
      width,
      height,
      colorSpace,
      originalPath,
      thumbnailPath,
      previewPath,
      printPath,
      tags: cleanTags,
      characterId: validCharacterId,
      locationId: validLocationId,
      sceneId: validSceneId,
    })
    .returning();

  return formatAssetDto(created, duplicateOf);
}

export interface AssetQueryFilter {
  tag?: string;
  characterId?: string;
  locationId?: string;
  sceneId?: string;
  from?: string;
  to?: string;
  date?: string;
  sha256?: string;
  duplicatesOnly?: boolean;
}

export async function listAssets(ownerId: string, filter: AssetQueryFilter = {}): Promise<AssetRecordDto[]> {
  const db = getDb();
  if (!db) throw new Error('Datenbank nicht verfügbar');

  const rows = await db
    .select()
    .from(schema.assets)
    .where(and(eq(schema.assets.ownerId, ownerId), isNull(schema.assets.deletedAt)))
    .orderBy(desc(schema.assets.createdAt));

  // Dubletten-Map (SHA-256 -> ältestes Asset)
  const firstByHash = new Map<string, string>();
  const countByHash = new Map<string, number>();
  for (const r of [...rows].reverse()) {
    countByHash.set(r.sha256, (countByHash.get(r.sha256) || 0) + 1);
    if (!firstByHash.has(r.sha256)) {
      firstByHash.set(r.sha256, r.id);
    }
  }

  return rows
    .filter((r: any) => {
      if (filter.tag) {
        const wanted = filter.tag.toLowerCase().trim();
        const tags: string[] = Array.isArray(r.tags) ? r.tags : [];
        if (!tags.some((t) => t.toLowerCase() === wanted || t.toLowerCase().includes(wanted))) {
          return false;
        }
      }
      if (filter.characterId && r.characterId !== filter.characterId) return false;
      if (filter.locationId && r.locationId !== filter.locationId) return false;
      if (filter.sceneId && r.sceneId !== filter.sceneId) return false;
      if (filter.sha256 && r.sha256 !== filter.sha256) return false;

      if (filter.date) {
        const createdDay = r.createdAt instanceof Date ? r.createdAt.toISOString().slice(0, 10) : '';
        if (!createdDay.startsWith(filter.date.slice(0, 10))) return false;
      }
      if (filter.from) {
        const fromTime = new Date(filter.from).getTime();
        const rowTime = r.createdAt instanceof Date ? r.createdAt.getTime() : 0;
        if (Number.isFinite(fromTime) && rowTime < fromTime) return false;
      }
      if (filter.to) {
        const toTime = new Date(filter.to).getTime();
        const rowTime = r.createdAt instanceof Date ? r.createdAt.getTime() : 0;
        if (Number.isFinite(toTime) && rowTime > toTime) return false;
      }
      if (filter.duplicatesOnly) {
        if ((countByHash.get(r.sha256) || 0) < 2) return false;
      }
      return true;
    })
    .map((r: any) => {
      const firstId = firstByHash.get(r.sha256);
      const dupOf = firstId && firstId !== r.id ? firstId : null;
      return formatAssetDto(r, dupOf);
    });
}

export async function getAssetById(ownerId: string, assetId: string) {
  const db = getDb();
  if (!db) throw new Error('Datenbank nicht verfügbar');

  const [row] = await db
    .select()
    .from(schema.assets)
    .where(
      and(
        eq(schema.assets.ownerId, ownerId),
        eq(schema.assets.id, assetId),
        isNull(schema.assets.deletedAt)
      )
    )
    .limit(1);

  return row || null;
}

export async function updateAsset(
  ownerId: string,
  assetId: string,
  patch: {
    title?: string;
    tags?: string[];
    characterId?: string | null;
    locationId?: string | null;
    sceneId?: string | null;
  }
): Promise<AssetRecordDto | null> {
  const db = getDb();
  if (!db) throw new Error('Datenbank nicht verfügbar');

  const existing = await getAssetById(ownerId, assetId);
  if (!existing) return null;

  const updateData: any = { updatedAt: new Date() };
  if (patch.title !== undefined) updateData.title = String(patch.title).trim();
  if (patch.tags !== undefined && Array.isArray(patch.tags)) {
    updateData.tags = patch.tags.map((t) => String(t).trim()).filter(Boolean);
  }
  if (patch.characterId !== undefined) updateData.characterId = patch.characterId || null;
  if (patch.locationId !== undefined) updateData.locationId = patch.locationId || null;
  if (patch.sceneId !== undefined) updateData.sceneId = patch.sceneId || null;

  const [updated] = await db
    .update(schema.assets)
    .set(updateData)
    .where(and(eq(schema.assets.ownerId, ownerId), eq(schema.assets.id, assetId)))
    .returning();

  return updated ? formatAssetDto(updated) : null;
}

export async function softDeleteAsset(ownerId: string, assetId: string): Promise<boolean> {
  const db = getDb();
  if (!db) throw new Error('Datenbank nicht verfügbar');

  const existing = await getAssetById(ownerId, assetId);
  if (!existing) return false;

  await db
    .update(schema.assets)
    .set({ deletedAt: new Date(), updatedAt: new Date() })
    .where(and(eq(schema.assets.ownerId, ownerId), eq(schema.assets.id, assetId)));

  return true;
}

// ==========================================
// Express Router für /api/v1/assets
// ==========================================

export function createAssetsRouter(): Router {
  const router = Router();

  const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
      fileSize: getMaxAssetBytes(),
    },
  });

  // GET /api/v1/assets
  router.get('/', async (req: Request, res: Response) => {
    try {
      const user = (req as any).user as AuthUser;
      const assets = await listAssets(user.id, {
        tag: req.query.tag as string | undefined,
        characterId: (req.query.characterId || req.query.figur) as string | undefined,
        locationId: (req.query.locationId || req.query.ort) as string | undefined,
        sceneId: (req.query.sceneId || req.query.szene) as string | undefined,
        date: (req.query.date || req.query.datum) as string | undefined,
        from: req.query.from as string | undefined,
        to: req.query.to as string | undefined,
        sha256: req.query.sha256 as string | undefined,
        duplicatesOnly: req.query.duplicates === 'true',
      });
      res.json(assets);
    } catch (err: any) {
      res.status(500).json({ detail: err.message || 'Fehler beim Laden der Bildbibliothek.' });
    }
  });

  // POST /api/v1/assets
  router.post(
    '/',
    (req: Request, res: Response, next: () => void) => {
      const dynamicUpload = multer({
        storage: multer.memoryStorage(),
        limits: { fileSize: getMaxAssetBytes() },
      }).single('file');

      dynamicUpload(req, res, (err: any) => {
        if (err) {
          if (err.code === 'LIMIT_FILE_SIZE') {
            res.status(413).json({
              type: 'https://tools.ietf.org/html/rfc9457',
              title: 'Datei zu groß',
              status: 413,
              detail: `Die Bilddatei überschreitet das Limit von ${getMaxAssetBytes()} Bytes (MAX_ASSET_BYTES).`,
            });
            return;
          }
          res.status(400).json({ detail: err.message || 'Fehler beim Upload.' });
          return;
        }
        next();
      });
    },
    async (req: Request, res: Response) => {
      try {
        const user = (req as any).user as AuthUser;
        if (!req.file || !req.file.buffer) {
          res.status(400).json({ detail: 'Keine Datei im Feld "file" empfangen.' });
          return;
        }

        const rawTags = req.body.tags;
        let tags: string[] = [];
        if (Array.isArray(rawTags)) {
          tags = rawTags.map(String);
        } else if (typeof rawTags === 'string' && rawTags.trim()) {
          try {
            const parsed = JSON.parse(rawTags);
            tags = Array.isArray(parsed) ? parsed.map(String) : rawTags.split(',').map((t) => t.trim());
          } catch {
            tags = rawTags.split(',').map((t) => t.trim());
          }
        }

        const asset = await ingestAssetBuffer({
          ownerId: user.id,
          buffer: req.file.buffer,
          originalFilename: req.file.originalname,
          title: req.body.title,
          tags,
          characterId: req.body.characterId || null,
          locationId: req.body.locationId || null,
          sceneId: req.body.sceneId || null,
        });

        res.status(201).json(asset);
      } catch (err: any) {
        const status = err.statusCode || 400;
        res.status(status).json({
          type: 'https://tools.ietf.org/html/rfc9457',
          title: status === 413 ? 'Datei zu groß' : 'Ungültige Bilddatei',
          status,
          detail: err.message || 'Fehler beim Verarbeiten der Bilddatei.',
        });
      }
    }
  );

  // GET /api/v1/assets/:id/:variante
  router.get('/:id/:variante', async (req: Request, res: Response) => {
    try {
      const user = (req as any).user as AuthUser;
      const row = await getAssetById(user.id, req.params.id);
      if (!row) {
        res.status(404).json({ detail: 'Asset nicht gefunden.' });
        return;
      }

      const variante = req.params.variante.toLowerCase();
      let filePath = row.previewPath;
      let contentType = 'image/png';

      if (variante === 'original') {
        filePath = row.originalPath;
        contentType = row.mimeType;
      } else if (variante === 'thumbnail' || variante === 'thumb') {
        filePath = row.thumbnailPath;
        contentType = 'image/png';
      } else if (variante === 'preview' || variante === 'arbeitsvorschau') {
        filePath = row.previewPath;
        contentType = 'image/png';
      } else if (variante === 'print' || variante === 'druckfassung') {
        filePath = row.printPath;
        contentType = 'image/png';
      } else {
        res.status(400).json({
          detail: `Unbekannte Variante "${req.params.variante}". Erlaubt: original, thumbnail, preview (arbeitsvorschau), print (druckfassung).`,
        });
        return;
      }

      if (!fs.existsSync(filePath)) {
        res.status(404).json({ detail: 'Datei für diese Variante nicht auf dem Volume gefunden.' });
        return;
      }

      res.setHeader('Content-Type', contentType);
      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.sendFile(path.resolve(filePath));
    } catch (err: any) {
      res.status(500).json({ detail: err.message || 'Fehler beim Ausliefern der Bildvariante.' });
    }
  });

  // PATCH /api/v1/assets/:id
  router.patch('/:id', async (req: Request, res: Response) => {
    try {
      const user = (req as any).user as AuthUser;
      const updated = await updateAsset(user.id, req.params.id, {
        title: req.body.title,
        tags: req.body.tags,
        characterId: req.body.characterId,
        locationId: req.body.locationId,
        sceneId: req.body.sceneId,
      });

      if (!updated) {
        res.status(404).json({ detail: 'Asset nicht gefunden.' });
        return;
      }

      res.json(updated);
    } catch (err: any) {
      res.status(500).json({ detail: err.message || 'Fehler beim Aktualisieren des Assets.' });
    }
  });

  // DELETE /api/v1/assets/:id (Soft-Delete wie bei Kapiteln)
  router.delete('/:id', async (req: Request, res: Response) => {
    try {
      const user = (req as any).user as AuthUser;
      const ok = await softDeleteAsset(user.id, req.params.id);
      if (!ok) {
        res.status(404).json({ detail: 'Asset nicht gefunden.' });
        return;
      }
      res.json({ success: true, message: 'Asset in die Schreibtisch-Schublade gelegt.' });
    } catch (err: any) {
      res.status(500).json({ detail: err.message || 'Fehler beim Löschen des Assets.' });
    }
  });

  return router;
}
