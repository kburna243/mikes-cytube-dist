import fs from 'fs';
import crypto from 'crypto';
import { Router, Request, Response } from 'express';
import multer from 'multer';
import { eq, and, desc, isNull } from 'drizzle-orm';
import { getDb, schema } from '../db.js';
import type { AuthUser } from '../auth.js';
import {
  embedInvisibleWatermark,
  extractInvisibleWatermark,
  toShortHexId,
  type WatermarkPayloadInput,
  type WatermarkVerificationResult,
} from './invisibleWatermark.js';
import { applyVisibleWatermark, type VisibleWatermarkOptions } from './visibleWatermark.js';
import {
  computePHash,
  buildXmpPacket,
  embedPngProtectionMetadata,
  extractProtectionMetadataFromBuffer,
  type ArtworkMetadataInput,
} from './metadata.js';
import {
  protect,
  listProtectionJobs,
  isScramblerWorkerConfigured,
  ScramblerUnavailableError,
  type ScramblerStrength,
} from './scrambler.js';

export {
  embedInvisibleWatermark,
  extractInvisibleWatermark,
  toShortHexId,
  applyVisibleWatermark,
  computePHash,
  buildXmpPacket,
  embedPngProtectionMetadata,
  extractProtectionMetadataFromBuffer,
  protect,
  listProtectionJobs,
  isScramblerWorkerConfigured,
  ScramblerUnavailableError,
};
export type {
  WatermarkPayloadInput,
  WatermarkVerificationResult,
  VisibleWatermarkOptions,
  ArtworkMetadataInput,
  ScramblerStrength,
};

export interface ExportProtectionPipelineInput {
  ownerId: string;
  imageBuffer: Buffer;
  assetId?: string | null;
  pageId?: string | null;
  format: 'pdf' | 'cbz' | 'png' | 'epub';
  creatorName: string;
  copyrightNotice?: string;
  visibleWatermark?: VisibleWatermarkOptions | null;
}

export interface ExportProtectionPipelineOutput {
  protectedPngBuffer: Buffer;
  pHash: string;
  sha256: string;
  watermarkPayload: {
    ownerShortId: string;
    assetShortId: string;
    timestampSec: number;
    payloadHex: string;
  };
  xmpPacket: string;
  fingerprintId: string;
}

/**
 * Führt die Schutz-Kette in der verbindlichen Exportreihenfolge aus:
 * 1. Schutzschicht (falls vorhanden in protection_jobs)
 * 2. Unsichtbares Wasserzeichen (8x8 DCT in Luminanz + HMAC-SHA256)
 * 3. Sichtbares Wasserzeichen (falls gewünscht, nur im Export)
 * 4. Metadaten (IPTC/XMP mit Urheberin, Copyright, "Data Mining: Prohibited") + pHash in export_fingerprints
 */
export async function applyExportProtectionPipeline(
  input: ExportProtectionPipelineInput
): Promise<ExportProtectionPipelineOutput> {
  const db = getDb();
  if (!db) throw new Error('Datenbank nicht verfügbar');

  let currentBuffer = input.imageBuffer;

  // Schritt 1: Schutzschicht (falls für dieses Asset ein fertiger protection_job derselben owner_id vorliegt)
  if (input.assetId) {
    const [completedJob] = await db
      .select()
      .from(schema.protectionJobs)
      .where(
        and(
          eq(schema.protectionJobs.ownerId, input.ownerId),
          eq(schema.protectionJobs.assetId, input.assetId),
          eq(schema.protectionJobs.status, 'fertig')
        )
      )
      .orderBy(desc(schema.protectionJobs.updatedAt))
      .limit(1);

    if (completedJob?.outputPath && fs.existsSync(completedJob.outputPath)) {
      currentBuffer = fs.readFileSync(completedJob.outputPath);
    }
  }

  // Schritt 2: Unsichtbares Wasserzeichen (8x8 DCT in Luminanz, 5x Redundanz, HMAC-SHA256)
  const targetRefId = input.assetId || input.pageId || input.ownerId;
  const wmResult = await embedInvisibleWatermark(currentBuffer, {
    ownerId: input.ownerId,
    assetId: targetRefId,
  });
  currentBuffer = wmResult.buffer;

  // Schritt 3: Sichtbares Wasserzeichen (Text oder Logo, Deckkraft, Kachelung)
  if (input.visibleWatermark && (input.visibleWatermark.text || input.visibleWatermark.logoBuffer)) {
    currentBuffer = await applyVisibleWatermark(currentBuffer, input.visibleWatermark);
  }

  // Schritt 4: pHash berechnen + IPTC/XMP Metadaten ("Data Mining: Prohibited") einbetten + in export_fingerprints speichern
  const pHash = await computePHash(currentBuffer);
  const copyright =
    input.copyrightNotice || `© ${new Date().getFullYear()} ${input.creatorName} · Alle Rechte vorbehalten`;

  const metadataObj: ArtworkMetadataInput = {
    creator: input.creatorName,
    copyright,
    dataMining: 'Prohibited',
    pHash,
    assetId: targetRefId,
  };

  currentBuffer = embedPngProtectionMetadata(currentBuffer, metadataObj);
  const sha256 = crypto.createHash('sha256').update(currentBuffer).digest('hex');
  const xmpPacket = buildXmpPacket(metadataObj);

  const [fpRecord] = await db
    .insert(schema.exportFingerprints)
    .values({
      ownerId: input.ownerId,
      assetId: input.assetId || null,
      pageId: input.pageId || null,
      format: input.format,
      pHash,
      sha256,
      watermarkPayload: JSON.stringify({
        ownerShortId: wmResult.ownerShortId,
        assetShortId: wmResult.assetShortId,
        timestampSec: wmResult.timestampSec,
      }),
      metadataJson: JSON.stringify(metadataObj),
    })
    .returning();

  return {
    protectedPngBuffer: currentBuffer,
    pHash,
    sha256,
    watermarkPayload: {
      ownerShortId: wmResult.ownerShortId,
      assetShortId: wmResult.assetShortId,
      timestampSec: wmResult.timestampSec,
      payloadHex: wmResult.payloadHex,
    },
    xmpPacket,
    fingerprintId: fpRecord.id,
  };
}

/**
 * Prüft ein hochgeladenes Bild auf ein unsichtbares Wasserzeichen und ordnet es
 * einem Asset oder einer Seite der eingeloggten Nutzerin zu (owner_id-isoliert).
 */
export async function verifyWatermarkedImageForOwner(ownerId: string, imageBuffer: Buffer) {
  const wm = await extractInvisibleWatermark(imageBuffer);
  const pHash = await computePHash(imageBuffer);
  const meta = extractProtectionMetadataFromBuffer(imageBuffer);

  let matchedAsset: { id: string; title: string; originalFilename: string } | null = null;
  let matchedPageId: string | null = null;

  if (wm.found && wm.assetShortId) {
    const db = getDb();
    if (db) {
      const ownerAssets = await db
        .select()
        .from(schema.assets)
        .where(and(eq(schema.assets.ownerId, ownerId), isNull(schema.assets.deletedAt)));

      const foundAsset = ownerAssets.find((a: any) => toShortHexId(a.id) === wm.assetShortId);
      if (foundAsset) {
        matchedAsset = {
          id: foundAsset.id,
          title: foundAsset.title,
          originalFilename: foundAsset.originalFilename,
        };
      }

      const ownerPages = await db
        .select()
        .from(schema.comicPages)
        .where(and(eq(schema.comicPages.ownerId, ownerId), isNull(schema.comicPages.deletedAt)));

      const foundPage = ownerPages.find((p: any) => toShortHexId(p.id) === wm.assetShortId);
      if (foundPage) {
        matchedPageId = foundPage.id;
      }
    }
  }

  return {
    watermarkFound: wm.found,
    signatureValid: wm.signatureValid,
    ownerShortId: wm.ownerShortId,
    assetShortId: wm.assetShortId,
    timestampSec: wm.timestampSec,
    timestampIso: wm.timestampIso,
    bitAgreement: wm.bitAgreement,
    asset: matchedAsset,
    pageId: matchedPageId,
    pHash,
    metadata: meta,
  };
}

// ==========================================
// Express Router für /api/v1/protect
// ==========================================

export function createProtectRouter(): Router {
  const router = Router();
  const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 50 * 1024 * 1024 },
  });

  // POST /api/v1/protect/verify
  router.post('/verify', upload.single('file'), async (req: Request, res: Response) => {
    try {
      const user = (req as any).user as AuthUser;
      if (!req.file || !req.file.buffer) {
        res.status(400).json({ detail: 'Bitte eine Bilddatei im Feld "file" zur Überprüfung hochladen.' });
        return;
      }

      const result = await verifyWatermarkedImageForOwner(user.id, req.file.buffer);
      res.json(result);
    } catch (err: any) {
      res.status(400).json({
        detail: err.message || 'Wasserzeichen-Prüfung konnte für diese Datei nicht durchgeführt werden.',
      });
    }
  });

  // POST /api/v1/protect/scramble (KI-Schutzschicht / Scrambler)
  router.post('/scramble', async (req: Request, res: Response) => {
    try {
      const user = (req as any).user as AuthUser;
      const { assetId, strength } = req.body || {};
      if (!assetId) {
        res.status(400).json({ detail: 'Feld assetId ist erforderlich.' });
        return;
      }

      const validStrength: ScramblerStrength =
        strength === 'leicht' || strength === 'stark' ? strength : 'mittel';

      const jobResult = await protect(assetId, validStrength, user.id);
      res.status(201).json(jobResult);
    } catch (err: any) {
      if (err instanceof ScramblerUnavailableError || err.statusCode === 503) {
        res.status(503).json({
          type: 'https://tools.ietf.org/html/rfc9457',
          title: 'Schutzschicht gerade nicht verfügbar',
          status: 503,
          detail: 'Schutzschicht gerade nicht verfügbar',
        });
        return;
      }
      const status = err.statusCode || 500;
      res.status(status).json({ detail: err.message || 'Fehler bei der Schutzschicht.' });
    }
  });

  // GET /api/v1/protect/jobs
  router.get('/jobs', async (req: Request, res: Response) => {
    try {
      const user = (req as any).user as AuthUser;
      const assetId = req.query.assetId as string | undefined;
      const jobs = await listProtectionJobs(user.id, assetId);
      res.json({
        workerConfigured: isScramblerWorkerConfigured(),
        jobs,
      });
    } catch (err: any) {
      res.status(500).json({ detail: err.message || 'Fehler beim Laden der Schutz-Jobs.' });
    }
  });

  // GET /api/v1/protect/fingerprints
  router.get('/fingerprints', async (req: Request, res: Response) => {
    try {
      const user = (req as any).user as AuthUser;
      const db = getDb();
      if (!db) throw new Error('Datenbank nicht verfügbar');

      const rows = await db
        .select()
        .from(schema.exportFingerprints)
        .where(eq(schema.exportFingerprints.ownerId, user.id))
        .orderBy(desc(schema.exportFingerprints.createdAt));

      res.json(rows);
    } catch (err: any) {
      res.status(500).json({ detail: err.message || 'Fehler beim Laden der Export-Fingerprints.' });
    }
  });

  return router;
}
