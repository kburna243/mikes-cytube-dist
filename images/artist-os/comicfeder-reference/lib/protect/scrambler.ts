import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import sharp from 'sharp';
import { eq, and, desc } from 'drizzle-orm';
import { getDb, schema } from '../db.js';
import { getAssetById } from '../assets/index.js';

export type ScramblerStrength = 'leicht' | 'mittel' | 'stark';

export class ScramblerUnavailableError extends Error {
  public statusCode = 503;
  constructor(message = 'Schutzschicht gerade nicht verfügbar') {
    super(message);
    this.name = 'ScramblerUnavailableError';
  }
}

export interface ProtectionJobResult {
  jobId: string;
  assetId: string;
  strength: ScramblerStrength;
  status: 'wartet' | 'läuft' | 'fertig' | 'fehler';
  ssim: number | null;
  outputPath: string | null;
}

/**
 * Prüft, ob ein externer Scrambler-Worker unter SCRAMBLER_WORKER_URL konfiguriert ist.
 */
export function isScramblerWorkerConfigured(): boolean {
  return Boolean(process.env.SCRAMBLER_WORKER_URL?.trim() && process.env.SCRAMBLER_HMAC_SECRET?.trim());
}

/**
 * KI-Schutzschicht (Scrambler):
 * Berechnet adversariale Störungen (PGD gegen CLIP/SigLIP mit SSIM-Grenze) ausschließlich
 * über den externen Worker unter SCRAMBLER_WORKER_URL.
 *
 * VERBOTEN: Zufalls- oder Sinusmuster als Schutz auszugeben oder geschätzte Wirksamkeitswerte zu liefern.
 * Ist kein Worker konfiguriert, wird fail-closed mit Status 503 "Schutzschicht gerade nicht verfügbar" geantwortet.
 */
export async function protect(
  assetId: string,
  strength: ScramblerStrength = 'mittel',
  ownerId?: string
): Promise<ProtectionJobResult> {
  const workerUrl = process.env.SCRAMBLER_WORKER_URL?.trim();
  const hmacSecret = process.env.SCRAMBLER_HMAC_SECRET?.trim();
  if (!workerUrl || !hmacSecret) {
    throw new ScramblerUnavailableError('Schutzschicht gerade nicht verfügbar');
  }

  const db = getDb();
  if (!db) {
    throw new Error('Datenbank nicht verfügbar');
  }

  if (!ownerId) {
    throw new Error('owner_id ist für die Schutzschicht erforderlich.');
  }

  const asset = await getAssetById(ownerId, assetId);
  if (!asset) {
    const err: any = new Error('Asset nicht gefunden.');
    err.statusCode = 404;
    throw err;
  }

  // Job in protection_jobs anlegen (mit owner_id)
  const [job] = await db
    .insert(schema.protectionJobs)
    .values({
      ownerId,
      assetId,
      strength,
      status: 'läuft',
      workerUrl,
    })
    .returning();

  try {
    const imageBytes = fs.readFileSync(asset.printPath);
    const endpoint = `${workerUrl.replace(/\/+$/, '')}/v1/scramble`;

    const body = JSON.stringify({
      jobId: job.id,
      assetId,
      strength,
      imageBase64: imageBytes.toString('base64'),
      mimeType: 'image/png',
      constraints: { algorithm: 'pgd', minSsim: 0.97 },
    });
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-Scrambler-Signature-256': `sha256=${crypto.createHmac('sha256', hmacSecret).update(body).digest('hex')}`,
    };
    const apiKey = process.env.SCRAMBLER_WORKER_API_KEY?.trim();
    if (apiKey) headers.Authorization = `Bearer ${apiKey}`;
    const response = await fetch(endpoint, {
      method: 'POST',
      headers,
      body,
      signal: AbortSignal.timeout(180_000),
    });

    if (!response.ok) {
      await db
        .update(schema.protectionJobs)
        .set({
          status: 'fehler',
          errorMessage: `Worker antwortete mit HTTP ${response.status}`,
          updatedAt: new Date(),
        })
        .where(and(eq(schema.protectionJobs.ownerId, ownerId), eq(schema.protectionJobs.id, job.id)));

      throw new ScramblerUnavailableError('Schutzschicht gerade nicht verfügbar');
    }

    const resultData = await response.json();
    const measuredSsim = resultData.metrics?.ssim;
    if (typeof resultData.imageBase64 !== 'string' || !resultData.imageBase64 ||
        typeof measuredSsim !== 'number' || !Number.isFinite(measuredSsim) || measuredSsim < 0.97 || measuredSsim > 1) {
      throw new Error('Worker lieferte kein gültiges Ergebnis mit SSIM ≥ 0,97.');
    }
    const output = Buffer.from(resultData.imageBase64, 'base64');
    const metadata = await sharp(output, { limitInputPixels: 100_000_000 }).metadata();
    const original = await sharp(imageBytes).metadata();
    if (metadata.format !== 'png' || metadata.width !== original.width || metadata.height !== original.height) {
      throw new Error('Worker lieferte kein PNG in Originalgröße.');
    }
    const outPath = path.join(path.dirname(asset.printPath), `protected_${strength}.png`);
    fs.writeFileSync(outPath, output);

    const [updated] = await db
      .update(schema.protectionJobs)
      .set({
        status: 'fertig',
        outputPath: outPath,
        ssim: measuredSsim,
        updatedAt: new Date(),
      })
      .where(and(eq(schema.protectionJobs.ownerId, ownerId), eq(schema.protectionJobs.id, job.id)))
      .returning();

    return {
      jobId: updated.id,
      assetId: updated.assetId,
      strength: updated.strength as ScramblerStrength,
      status: updated.status as any,
      ssim: updated.ssim,
      outputPath: updated.outputPath,
    };
  } catch (err: any) {
    if (err instanceof ScramblerUnavailableError) {
      throw err;
    }
    await db
      .update(schema.protectionJobs)
      .set({
        status: 'fehler',
        errorMessage: err.message || 'Worker nicht erreichbar',
        updatedAt: new Date(),
      })
      .where(and(eq(schema.protectionJobs.ownerId, ownerId), eq(schema.protectionJobs.id, job.id)));

    throw new ScramblerUnavailableError('Schutzschicht gerade nicht verfügbar');
  }
}

export async function listProtectionJobs(ownerId: string, assetId?: string) {
  const db = getDb();
  if (!db) throw new Error('Datenbank nicht verfügbar');

  const condition = assetId
    ? and(eq(schema.protectionJobs.ownerId, ownerId), eq(schema.protectionJobs.assetId, assetId))
    : eq(schema.protectionJobs.ownerId, ownerId);

  return db
    .select()
    .from(schema.protectionJobs)
    .where(condition)
    .orderBy(desc(schema.protectionJobs.createdAt));
}
