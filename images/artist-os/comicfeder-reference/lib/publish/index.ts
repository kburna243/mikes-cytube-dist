import fs from 'fs';
import sharp from 'sharp';
import { Router, Request, Response } from 'express';
import { eq, and, desc } from 'drizzle-orm';
import { getDb, schema } from '../db.js';
import { repo } from '../repo.js';
import type { AuthUser } from '../auth.js';
import { getAssetById, ingestAssetBuffer } from '../assets/index.js';
import { getComicPageFull, renderComicPageToPng } from '../comic/index.js';
import { applyExportProtectionPipeline, type VisibleWatermarkOptions } from '../protect/index.js';
import {
  encryptCredentials,
  decryptCredentials,
  signWebhookPayload,
  verifyWebhookSignature,
  sanitizeConnectorAccountForResponse,
} from './crypto.js';
import {
  ALL_PUBLISH_CONNECTORS,
  NOT_CONNECTED_MESSAGE,
  buildExportPackageZip,
  type PublishConnector,
  type ConnectorKind,
  type PublishableItem,
  type PublishableImage,
} from './connectors.js';
import {
  MERCH_PRODUCT_SPECS,
  checkMerchPrintQuality,
  extractCutoutMotifBuffer,
  renderMerchMockupSvg,
  buildShopifyCsvExport,
  type MerchProductType,
  type PrintQualityCheckResult,
} from './merch.js';
import { buildStaticPortfolioZip, type PortfolioWorkItem } from './portfolio.js';

export {
  encryptCredentials,
  decryptCredentials,
  signWebhookPayload,
  verifyWebhookSignature,
  sanitizeConnectorAccountForResponse,
  ALL_PUBLISH_CONNECTORS,
  NOT_CONNECTED_MESSAGE,
  buildExportPackageZip,
  MERCH_PRODUCT_SPECS,
  checkMerchPrintQuality,
  extractCutoutMotifBuffer,
  renderMerchMockupSvg,
  buildShopifyCsvExport,
  buildStaticPortfolioZip,
};
export type {
  PublishConnector,
  ConnectorKind,
  PublishableItem,
  PublishableImage,
  MerchProductType,
  PrintQualityCheckResult,
  PortfolioWorkItem,
};

function safeJsonParse<T>(raw: string | null | undefined, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

// ==========================================
// 1. Connector-Konten (AES-256-GCM verschlüsselt)
// ==========================================

export async function saveConnectorAccount(
  ownerId: string,
  input: {
    connectorId: string;
    accountLabel?: string;
    credentials: Record<string, any>;
    isActive?: boolean;
  }
) {
  const db = getDb();
  if (!db) throw new Error('Datenbank nicht verfügbar');

  const connector = ALL_PUBLISH_CONNECTORS[input.connectorId];
  if (!connector) {
    const err: any = new Error(`Unbekannter Connector »${input.connectorId}«.`);
    err.statusCode = 400;
    throw err;
  }

  const encrypted = encryptCredentials(input.credentials || {});

  const [existing] = await db
    .select()
    .from(schema.connectorAccounts)
    .where(
      and(
        eq(schema.connectorAccounts.ownerId, ownerId),
        eq(schema.connectorAccounts.connectorId, connector.id)
      )
    )
    .limit(1);

  if (existing) {
    const [updated] = await db
      .update(schema.connectorAccounts)
      .set({
        accountLabel: input.accountLabel ?? existing.accountLabel,
        encryptedCredentials: encrypted,
        isActive: input.isActive !== undefined ? Boolean(input.isActive) : existing.isActive,
        updatedAt: new Date(),
      })
      .where(
        and(eq(schema.connectorAccounts.ownerId, ownerId), eq(schema.connectorAccounts.id, existing.id))
      )
      .returning();

    return sanitizeConnectorAccountForResponse(updated);
  }

  const [created] = await db
    .insert(schema.connectorAccounts)
    .values({
      ownerId,
      connectorId: connector.id,
      kind: connector.kind,
      accountLabel: input.accountLabel || connector.name,
      encryptedCredentials: encrypted,
      isActive: input.isActive !== undefined ? Boolean(input.isActive) : true,
    })
    .returning();

  return sanitizeConnectorAccountForResponse(created);
}

export async function listConnectorAccounts(ownerId: string) {
  const db = getDb();
  if (!db) throw new Error('Datenbank nicht verfügbar');

  const rows = await db
    .select()
    .from(schema.connectorAccounts)
    .where(eq(schema.connectorAccounts.ownerId, ownerId));

  const accountByConnector = new Map<string, any>();
  for (const r of rows) {
    accountByConnector.set(r.connectorId, sanitizeConnectorAccountForResponse(r));
  }

  return Object.values(ALL_PUBLISH_CONNECTORS).map((c) => {
    const acc = accountByConnector.get(c.id) || null;
    return {
      id: c.id,
      name: c.name,
      kind: c.kind,
      description: c.description,
      requiredFields: c.requiredFields,
      configured: Boolean(acc && acc.isActive),
      account: acc,
      statusHint:
        acc && acc.isActive
          ? 'Verbunden und bereit'
          : NOT_CONNECTED_MESSAGE,
    };
  });
}

export async function deleteConnectorAccount(ownerId: string, connectorId: string): Promise<boolean> {
  const db = getDb();
  if (!db) throw new Error('Datenbank nicht verfügbar');

  const deleted = await db
    .delete(schema.connectorAccounts)
    .where(
      and(
        eq(schema.connectorAccounts.ownerId, ownerId),
        eq(schema.connectorAccounts.connectorId, connectorId)
      )
    )
    .returning();

  return deleted.length > 0;
}

export async function getDecryptedCredentialsForOwner(
  ownerId: string,
  connectorId: string
): Promise<Record<string, any> | null> {
  const db = getDb();
  if (!db) throw new Error('Datenbank nicht verfügbar');

  const [row] = await db
    .select()
    .from(schema.connectorAccounts)
    .where(
      and(
        eq(schema.connectorAccounts.ownerId, ownerId),
        eq(schema.connectorAccounts.connectorId, connectorId)
      )
    )
    .limit(1);

  if (!row || !row.isActive) return null;
  try {
    return decryptCredentials(row.encryptedCredentials);
  } catch {
    return null;
  }
}

// ==========================================
// 2. Geschützte Bildaufbereitung für Veröffentlichung
// ==========================================

/**
 * Bereitet ein Bild aus einem Asset oder einer Comic-Seite für die Veröffentlichung auf:
 * - Originale werden NIEMALS veröffentlicht!
 * - Skaliert auf Web-Auflösung (max. 1200 px Kantenlänge) bzw. POD-Auflösung
 * - Durchläuft zwingend die Schutz-Kette: Schutzschicht -> unsichtbares DCT-Wasserzeichen ->
 *   optional sichtbares Wasserzeichen -> IPTC/XMP "Data Mining: Prohibited".
 */
export async function prepareProtectedImageForPublish(
  ownerId: string,
  source: { assetId?: string; pageId?: string },
  options?: {
    webResolution?: boolean;
    creatorName?: string;
    copyrightNotice?: string;
    visibleWatermark?: VisibleWatermarkOptions | null;
  }
): Promise<PublishableImage> {
  const settings = await repo.getSettings(ownerId);
  const creatorName = options?.creatorName || settings.displayName || 'Illustratorin';

  let rawPngBuffer: Buffer;
  let refId = ownerId;
  let filename = 'werk.png';

  if (source.assetId) {
    const asset = await getAssetById(ownerId, source.assetId);
    if (!asset) {
      const err: any = new Error('Asset für die Veröffentlichung nicht gefunden.');
      err.statusCode = 404;
      throw err;
    }
    refId = asset.id;
    filename = `geschuetzt_${asset.originalFilename.replace(/\.[^.]+$/, '')}.png`;
    // Wichtig: Niemals originalPath nehmen, sondern die sRGB-Vorschau/Druckfassung ohne EXIF!
    const variantPath = options?.webResolution !== false ? asset.previewPath : asset.printPath;
    const baseBuf = fs.readFileSync(variantPath);

    if (options?.webResolution !== false) {
      rawPngBuffer = await sharp(baseBuf)
        .resize(1200, 1200, { fit: 'inside', withoutEnlargement: true })
        .png()
        .toBuffer();
    } else {
      rawPngBuffer = await sharp(baseBuf).png().toBuffer();
    }
  } else if (source.pageId) {
    const page = await getComicPageFull(ownerId, source.pageId);
    if (!page) {
      const err: any = new Error('Comic-Seite für die Veröffentlichung nicht gefunden.');
      err.statusCode = 404;
      throw err;
    }
    refId = page.id;
    filename = `seite_${String(page.pageNumber).padStart(2, '0')}_geschuetzt.png`;
    const rendered = await renderComicPageToPng(ownerId, page, {
      bleedMm: 0,
      renderScaleDpi: options?.webResolution !== false ? 120 : 300,
    });
    rawPngBuffer = rendered.pngBuffer;
  } else {
    throw new Error('Weder assetId noch pageId für die Bildaufbereitung angegeben.');
  }

  const protectedOut = await applyExportProtectionPipeline({
    ownerId,
    imageBuffer: rawPngBuffer,
    assetId: source.assetId || refId,
    pageId: source.pageId || null,
    format: 'png',
    creatorName,
    copyrightNotice: options?.copyrightNotice,
    visibleWatermark: options?.visibleWatermark || null,
  });

  const meta = await sharp(protectedOut.protectedPngBuffer).metadata();

  return {
    filename,
    mimeType: 'image/png',
    buffer: protectedOut.protectedPngBuffer,
    pHash: protectedOut.pHash,
    sha256: protectedOut.sha256,
    width: meta.width || 512,
    height: meta.height || 512,
  };
}

// ==========================================
// 3. Beiträge & Veröffentlichungen (publications)
// ==========================================

export async function createPublicationAndPublish(
  ownerId: string,
  input: {
    connectorId: string;
    sourceType?: 'page' | 'panel' | 'asset' | 'portfolio' | 'merch' | 'shop';
    sourceId: string;
    title: string;
    bodyText?: string;
    tags?: string[];
    assetIds?: string[];
    priceCents?: number;
    currency?: string;
    productType?: string;
    colorVariants?: string[];
    visibleWatermark?: VisibleWatermarkOptions | null;
    fetchImpl?: typeof fetch;
  }
) {
  const db = getDb();
  if (!db) throw new Error('Datenbank nicht verfügbar');

  const connector = ALL_PUBLISH_CONNECTORS[input.connectorId];
  if (!connector) {
    const err: any = new Error(`Unbekannter Connector »${input.connectorId}«.`);
    err.statusCode = 400;
    throw err;
  }

  const project = await repo.getWork(ownerId);
  const settings = await repo.getSettings(ownerId);
  const creatorName = settings.displayName || 'Illustratorin';

  // Alle Bilder durchlaufen zwingend die Schutz-Kette (Web-Auflösung + unsichtbares Wasserzeichen + Data Mining: Prohibited)
  const protectedImages: PublishableImage[] = [];
  const targetAssetIds: string[] = Array.isArray(input.assetIds) ? [...input.assetIds] : [];
  if (input.sourceType === 'asset' && input.sourceId && !targetAssetIds.includes(input.sourceId)) {
    targetAssetIds.unshift(input.sourceId);
  }

  for (const aid of targetAssetIds) {
    const img = await prepareProtectedImageForPublish(
      ownerId,
      { assetId: aid },
      {
        webResolution: connector.kind !== 'pod',
        creatorName,
        visibleWatermark: input.visibleWatermark || null,
      }
    );
    protectedImages.push(img);
  }

  if (protectedImages.length === 0 && input.sourceType === 'page' && input.sourceId) {
    const pageImg = await prepareProtectedImageForPublish(
      ownerId,
      { pageId: input.sourceId },
      {
        webResolution: connector.kind !== 'pod',
        creatorName,
        visibleWatermark: input.visibleWatermark || null,
      }
    );
    protectedImages.push(pageImg);
  }

  const publishableItem: PublishableItem = {
    title: String(input.title || 'Neuer Beitrag').trim(),
    bodyText: String(input.bodyText || '').trim(),
    tags: Array.isArray(input.tags) ? input.tags.map(String) : [],
    projectTitle: project.title,
    creatorName,
    sourceType: input.sourceType || 'asset',
    sourceId: input.sourceId,
    priceCents: input.priceCents,
    currency: input.currency || 'EUR',
    productType: input.productType,
    colorVariants: input.colorVariants,
    images: protectedImages,
  };

  const creds = await getDecryptedCredentialsForOwner(ownerId, connector.id);
  const publishResult = await connector.publish(publishableItem, creds, input.fetchImpl);

  const [saved] = await db
    .insert(schema.publications)
    .values({
      ownerId,
      projectId: project.id,
      connectorId: connector.id,
      kind: connector.kind,
      sourceType: publishableItem.sourceType,
      sourceId: publishableItem.sourceId,
      title: publishableItem.title,
      bodyText: publishableItem.bodyText,
      tags: publishableItem.tags,
      assetIds: targetAssetIds,
      status: publishResult.status,
      externalId: publishResult.externalId,
      payloadJson: JSON.stringify({
        message: publishResult.message,
        externalUrl: publishResult.externalUrl || null,
        imageHashes: protectedImages.map((i) => ({ filename: i.filename, pHash: i.pHash, sha256: i.sha256 })),
      }),
      publishedAt: publishResult.status === 'veroeffentlicht' ? new Date() : null,
    })
    .returning();

  return {
    publication: {
      id: saved.id,
      ownerId: saved.ownerId,
      projectId: saved.projectId,
      connectorId: saved.connectorId,
      kind: saved.kind,
      sourceType: saved.sourceType,
      sourceId: saved.sourceId,
      title: saved.title,
      bodyText: saved.bodyText,
      tags: saved.tags,
      assetIds: saved.assetIds,
      status: saved.status,
      externalId: saved.externalId,
      publishedAt: saved.publishedAt ? saved.publishedAt.getTime() : null,
      createdAt: saved.createdAt.getTime(),
    },
    connectorResult: publishResult,
    protectedImages,
    item: publishableItem,
  };
}

export async function listPublications(ownerId: string) {
  const db = getDb();
  if (!db) throw new Error('Datenbank nicht verfügbar');

  const rows = await db
    .select()
    .from(schema.publications)
    .where(eq(schema.publications.ownerId, ownerId))
    .orderBy(desc(schema.publications.createdAt));

  return rows.map((r: any) => ({
    id: r.id,
    ownerId: r.ownerId,
    projectId: r.projectId,
    connectorId: r.connectorId,
    kind: r.kind,
    sourceType: r.sourceType,
    sourceId: r.sourceId,
    title: r.title,
    bodyText: r.bodyText,
    tags: Array.isArray(r.tags) ? r.tags : [],
    assetIds: Array.isArray(r.assetIds) ? r.assetIds : [],
    status: r.status,
    externalId: r.externalId,
    details: safeJsonParse(r.payloadJson, {}),
    publishedAt: r.publishedAt instanceof Date ? r.publishedAt.getTime() : null,
    createdAt: r.createdAt instanceof Date ? r.createdAt.getTime() : Date.now(),
  }));
}

/**
 * Erstellt einen Text-Entwurf für einen Beitrag als Vorschlag im vorhandenen Vorschlags-System
 * (/api/v1/assistant/proposals). Die KI bzw. der Vorschlags-Generator erhält ausschließlich Text,
 * NIEMALS Bilddaten!
 */
export async function createPostTextProposal(
  ownerId: string,
  input: {
    sourceType: 'page' | 'panel' | 'asset';
    sourceId: string;
    titleHint?: string;
    notes?: string;
  }
) {
  const db = getDb();
  if (!db) throw new Error('Datenbank nicht verfügbar');

  const project = await repo.getWork(ownerId);
  let title = input.titleHint || `Einblick in »${project.title}«`;
  let contextDescription = input.notes || '';

  if (input.sourceType === 'asset') {
    const asset = await getAssetById(ownerId, input.sourceId);
    if (!asset) {
      const err: any = new Error('Asset nicht gefunden.');
      err.statusCode = 404;
      throw err;
    }
    title = input.titleHint || asset.title;
    contextDescription = `Werk »${asset.title}« (Schlagworte: ${(asset.tags || []).join(', ') || 'Illustration'}) aus dem Projekt »${project.title}«`;
  } else if (input.sourceType === 'page') {
    const page = await getComicPageFull(ownerId, input.sourceId);
    if (!page) {
      const err: any = new Error('Comic-Seite nicht gefunden.');
      err.statusCode = 404;
      throw err;
    }
    title = input.titleHint || `Seite ${page.pageNumber} aus »${project.title}«`;
    const panelTexts = page.panels.map((p) => p.altText).filter(Boolean).join(' · ');
    contextDescription = `Comic-Seite ${page.pageNumber} (${page.format}): ${panelTexts || 'Neue Seite aus dem Atelier'}`;
  }

  const draftText = `Hinter den Kulissen von »${project.title}«: ${contextDescription}.\n\nAlle gezeigten Arbeitsproben sind urheberrechtlich geschützt (Data Mining: Prohibited).`;

  const payloadObj = {
    sourceType: input.sourceType,
    sourceId: input.sourceId,
    proposedTitle: title,
    proposedBodyText: draftText,
    proposedTags: ['GraphicNovel', 'Illustration', 'Federführer'],
  };

  const [saved] = await db
    .insert(schema.proposals)
    .values({
      ownerId,
      targetType: 'publication_post',
      targetId: input.sourceId,
      op: 'draft_post_text',
      payload: JSON.stringify(payloadObj),
      rationale: `Beitragstext-Vorschlag für ${title} (ausschließlich aus Textmetadaten erzeugt, ohne Bildweitergabe)`,
      status: 'pending',
    })
    .returning();

  return {
    id: saved.id,
    target_type: saved.targetType,
    target_id: saved.targetId,
    op: saved.op,
    payload: payloadObj,
    rationale: saved.rationale,
    status: saved.status,
    created_at: saved.createdAt.getTime(),
  };
}

// ==========================================
// 4. Merch & Print-on-Demand (merch_products)
// ==========================================

export async function createCutoutMotifForOwner(
  ownerId: string,
  input: {
    sourceAssetId?: string;
    pageElementId?: string;
    title?: string;
    cropBox?: { left: number; top: number; width: number; height: number };
    polygonMask?: Array<{ x: number; y: number }>;
    removeWhitePaperBackground?: boolean;
  }
) {
  const db = getDb();
  if (!db) throw new Error('Datenbank nicht verfügbar');

  let assetId = input.sourceAssetId || null;
  let maskPoints = input.polygonMask;
  let title = input.title || 'Freigestelltes Motiv';

  if (input.pageElementId) {
    const [el] = await db
      .select()
      .from(schema.pageElements)
      .where(
        and(
          eq(schema.pageElements.ownerId, ownerId),
          eq(schema.pageElements.id, input.pageElementId)
        )
      )
      .limit(1);

    if (!el) {
      const err: any = new Error('Seiten-Element nicht gefunden.');
      err.statusCode = 404;
      throw err;
    }
    assetId = el.assetId || assetId;
    if (!maskPoints && el.maskJson) {
      const parsedMask = safeJsonParse<any>(el.maskJson, null);
      if (parsedMask?.points) maskPoints = parsedMask.points;
    }
    if (!input.title && el.text) title = `Freisteller: ${el.text}`;
  }

  if (!assetId) {
    const err: any = new Error('Ein Quell-Asset (sourceAssetId) ist zum Freistellen erforderlich.');
    err.statusCode = 400;
    throw err;
  }

  const sourceAsset = await getAssetById(ownerId, assetId);
  if (!sourceAsset) {
    const err: any = new Error('Quell-Asset nicht gefunden oder kein Zugriff.');
    err.statusCode = 404;
    throw err;
  }

  const rawBuf = fs.readFileSync(sourceAsset.printPath || sourceAsset.previewPath);
  const cutout = await extractCutoutMotifBuffer(rawBuf, {
    cropBox: input.cropBox,
    polygonMask: maskPoints,
    removeWhitePaperBackground: input.removeWhitePaperBackground ?? true,
  });

  const newAsset = await ingestAssetBuffer({
    ownerId,
    buffer: cutout.pngBuffer,
    originalFilename: `cutout_${sourceAsset.originalFilename.replace(/\.[^.]+$/, '')}.png`,
    title,
    tags: ['freigestellt', 'merch-motiv', ...(sourceAsset.tags || [])],
    characterId: sourceAsset.characterId,
    locationId: sourceAsset.locationId,
    sceneId: sourceAsset.sceneId,
  });

  return newAsset;
}

export async function createMerchProduct(
  ownerId: string,
  input: {
    title: string;
    description?: string;
    productType: MerchProductType;
    sourceType?: 'asset' | 'page' | 'panel' | 'cutout_element';
    sourceId: string;
    cutoutAssetId?: string | null;
    placement?: { x?: number; y?: number; scale?: number; rotation?: number };
    colorVariants?: string[];
    suggestedPriceCents?: number;
    currency?: string;
  }
) {
  const db = getDb();
  if (!db) throw new Error('Datenbank nicht verfügbar');

  const spec = MERCH_PRODUCT_SPECS[input.productType] || MERCH_PRODUCT_SPECS.tshirt;
  const project = await repo.getWork(ownerId);

  // Bestimme Bildmaße für die automatische Druckdatei-Prüfung
  let imgW = 1200;
  let imgH = 1200;
  let colorSpace = 'srgb';
  let hasAlpha = true;

  const targetAssetId = input.cutoutAssetId || (input.sourceType !== 'page' ? input.sourceId : null);
  if (targetAssetId) {
    const asset = await getAssetById(ownerId, targetAssetId);
    if (!asset) {
      const err: any = new Error('Quell-Asset für das Merch-Produkt nicht gefunden.');
      err.statusCode = 404;
      throw err;
    }
    imgW = asset.width;
    imgH = asset.height;
    colorSpace = asset.colorSpace || 'srgb';
    try {
      const meta = await sharp(asset.printPath || asset.previewPath).metadata();
      hasAlpha = Boolean(meta.hasAlpha);
    } catch {
      hasAlpha = asset.mimeType === 'image/png';
    }
  } else if (input.sourceType === 'page') {
    const page = await getComicPageFull(ownerId, input.sourceId);
    if (!page) {
      const err: any = new Error('Quell-Seite für das Merch-Produkt nicht gefunden.');
      err.statusCode = 404;
      throw err;
    }
    imgW = (page as any).trimWidthPx || 2480;
    imgH = (page as any).trimHeightPx || 3508;
    hasAlpha = false;
  }

  const placement = {
    x: input.placement?.x ?? 0.5,
    y: input.placement?.y ?? 0.5,
    scale: input.placement?.scale ?? 0.85,
    rotation: input.placement?.rotation ?? 0,
  };

  const printCheck = checkMerchPrintQuality({
    productType: spec.type,
    imageWidthPx: imgW,
    imageHeightPx: imgH,
    colorSpace,
    hasAlpha,
    placementScale: placement.scale,
  });

  const [created] = await db
    .insert(schema.merchProducts)
    .values({
      ownerId,
      projectId: project.id,
      title: String(input.title || `${spec.label} – ${project.title}`).trim(),
      description: String(input.description || '').trim(),
      productType: spec.type,
      sourceType: input.sourceType || 'asset',
      sourceId: input.sourceId,
      cutoutAssetId: input.cutoutAssetId || null,
      printFormatName: spec.printFormatName,
      placementJson: JSON.stringify(placement),
      colorVariants:
        Array.isArray(input.colorVariants) && input.colorVariants.length > 0
          ? input.colorVariants.map(String)
          : ['schwarz', 'weiss'],
      suggestedPriceCents:
        input.suggestedPriceCents !== undefined ? Number(input.suggestedPriceCents) : spec.defaultPriceCents,
      currency: input.currency || 'EUR',
      printCheckJson: JSON.stringify(printCheck),
    })
    .returning();

  return formatMerchProductDto(created);
}

function formatMerchProductDto(row: any) {
  const placement = safeJsonParse(row.placementJson, { x: 0.5, y: 0.5, scale: 0.85, rotation: 0 });
  const printCheck = safeJsonParse<PrintQualityCheckResult | Record<string, any>>(row.printCheckJson, {});
  const targetAssetId = row.cutoutAssetId || (row.sourceType !== 'page' ? row.sourceId : null);
  const imageUrl = targetAssetId ? `/api/v1/assets/${targetAssetId}/preview` : '';
  const colorVariants = Array.isArray(row.colorVariants) ? row.colorVariants : ['schwarz', 'weiss'];

  const mockupSvg = renderMerchMockupSvg({
    productType: row.productType as MerchProductType,
    title: row.title,
    colorVariant: colorVariants[0] || 'schwarz',
    imageUrl,
    placement,
  });

  return {
    id: row.id,
    ownerId: row.ownerId,
    projectId: row.projectId,
    title: row.title,
    description: row.description,
    productType: row.productType as MerchProductType,
    sourceType: row.sourceType,
    sourceId: row.sourceId,
    cutoutAssetId: row.cutoutAssetId || null,
    printFormatName: row.printFormatName,
    placement,
    colorVariants,
    suggestedPriceCents: row.suggestedPriceCents,
    currency: row.currency,
    printCheck,
    imageUrl,
    mockupSvg,
    createdAt: row.createdAt instanceof Date ? row.createdAt.getTime() : Date.now(),
    updatedAt: row.updatedAt instanceof Date ? row.updatedAt.getTime() : Date.now(),
  };
}

export async function listMerchProducts(ownerId: string) {
  const db = getDb();
  if (!db) throw new Error('Datenbank nicht verfügbar');

  const rows = await db
    .select()
    .from(schema.merchProducts)
    .where(eq(schema.merchProducts.ownerId, ownerId))
    .orderBy(desc(schema.merchProducts.createdAt));

  return rows.map(formatMerchProductDto);
}

export async function deleteMerchProduct(ownerId: string, productId: string): Promise<boolean> {
  const db = getDb();
  if (!db) throw new Error('Datenbank nicht verfügbar');

  const deleted = await db
    .delete(schema.merchProducts)
    .where(and(eq(schema.merchProducts.ownerId, ownerId), eq(schema.merchProducts.id, productId)))
    .returning();

  return deleted.length > 0;
}

// ==========================================
// Express Router für /api/v1/publish
// ==========================================

export function createPublishRouter(): Router {
  const router = Router();

  // GET /api/v1/publish/connectors
  router.get('/connectors', async (req: Request, res: Response) => {
    try {
      const user = (req as any).user as AuthUser;
      const connectors = await listConnectorAccounts(user.id);
      res.json({ connectors });
    } catch (err: any) {
      res.status(500).json({ detail: err.message || 'Fehler beim Laden der Connectoren.' });
    }
  });

  // POST /api/v1/publish/connectors/:connectorId/account (Verschlüsselt Zugangsdaten per AES-256-GCM)
  router.post('/connectors/:connectorId/account', async (req: Request, res: Response) => {
    try {
      const user = (req as any).user as AuthUser;
      const saved = await saveConnectorAccount(user.id, {
        connectorId: req.params.connectorId,
        accountLabel: req.body.accountLabel,
        credentials: req.body.credentials || {},
        isActive: req.body.isActive,
      });
      res.status(201).json({
        account: saved,
        message: 'Zugangsdaten verschlüsselt gespeichert.',
      });
    } catch (err: any) {
      res.status(err.statusCode || 400).json({ detail: err.message });
    }
  });

  // DELETE /api/v1/publish/connectors/:connectorId/account
  router.delete('/connectors/:connectorId/account', async (req: Request, res: Response) => {
    try {
      const user = (req as any).user as AuthUser;
      const ok = await deleteConnectorAccount(user.id, req.params.connectorId);
      res.json({ success: ok });
    } catch (err: any) {
      res.status(500).json({ detail: err.message });
    }
  });

  // POST /api/v1/publish/preview (Vorschau für einen Connector ohne Veröffentlichen)
  router.post('/preview', async (req: Request, res: Response) => {
    try {
      const user = (req as any).user as AuthUser;
      const { connectorId = 'wordpress', title = 'Vorschau-Beitrag', bodyText = '', tags = [], priceCents = 2490 } =
        req.body || {};
      const connector = ALL_PUBLISH_CONNECTORS[connectorId];
      if (!connector) {
        res.status(400).json({ detail: `Unbekannter Connector »${connectorId}«.` });
        return;
      }

      const settings = await repo.getSettings(user.id);
      const dummyItem: PublishableItem = {
        title,
        bodyText,
        tags: Array.isArray(tags) ? tags : [],
        creatorName: settings.displayName || 'Illustratorin',
        sourceType: 'asset',
        sourceId: 'preview',
        priceCents,
        images: [],
      };

      const validation = await connector.validate(dummyItem);
      const preview = await connector.preview(dummyItem);
      const creds = await getDecryptedCredentialsForOwner(user.id, connector.id);

      res.json({
        configured: connector.isConfigured(creds),
        statusHint: connector.isConfigured(creds) ? 'Bereit zum Senden' : NOT_CONNECTED_MESSAGE,
        validation,
        preview,
      });
    } catch (err: any) {
      res.status(500).json({ detail: err.message });
    }
  });

  // POST /api/v1/publish/posts/propose-text (KI/Skript-Vorschlag, bekommt NUR Text, nie Bilder)
  router.post('/posts/propose-text', async (req: Request, res: Response) => {
    try {
      const user = (req as any).user as AuthUser;
      const { sourceType = 'asset', sourceId, titleHint, notes } = req.body || {};
      if (!sourceId) {
        res.status(400).json({ detail: 'sourceId ist erforderlich.' });
        return;
      }
      const proposal = await createPostTextProposal(user.id, {
        sourceType,
        sourceId,
        titleHint,
        notes,
      });
      res.status(201).json({
        proposal,
        message: 'Textvorschlag in /api/v1/assistant/proposals angelegt (nie automatisch übernommen).',
      });
    } catch (err: any) {
      res.status(err.statusCode || 400).json({ detail: err.message });
    }
  });

  // GET /api/v1/publish/publications
  router.get('/publications', async (req: Request, res: Response) => {
    try {
      const user = (req as any).user as AuthUser;
      const list = await listPublications(user.id);
      res.json({ publications: list });
    } catch (err: any) {
      res.status(500).json({ detail: err.message });
    }
  });

  // POST /api/v1/publish/publications (Veröffentlichen über Connector; gibt ohne Zugangsdaten "nicht_verbunden" zurück)
  router.post('/publications', async (req: Request, res: Response) => {
    try {
      const user = (req as any).user as AuthUser;
      const {
        connectorId = 'wordpress',
        sourceType = 'asset',
        sourceId,
        title,
        bodyText,
        tags,
        assetIds,
        priceCents,
        productType,
        colorVariants,
        visibleWatermark,
      } = req.body || {};

      if (!sourceId || !title) {
        res.status(400).json({ detail: 'sourceId und title sind erforderlich.' });
        return;
      }

      const out = await createPublicationAndPublish(user.id, {
        connectorId,
        sourceType,
        sourceId,
        title,
        bodyText,
        tags,
        assetIds,
        priceCents,
        productType,
        colorVariants,
        visibleWatermark,
      });

      res.status(201).json({
        publication: out.publication,
        connectorResult: out.connectorResult,
      });
    } catch (err: any) {
      res.status(err.statusCode || 400).json({ detail: err.message });
    }
  });

  // POST /api/v1/publish/package (Immer verfügbares Export-Paket als ZIP mit geschützten Bildern & product.json)
  router.post('/package', async (req: Request, res: Response) => {
    try {
      const user = (req as any).user as AuthUser;
      const {
        title = 'Mein Werk-Paket',
        bodyText = '',
        tags = [],
        sourceType = 'asset',
        sourceId,
        assetIds = [],
        priceCents,
        productType,
        colorVariants,
        visibleWatermark,
      } = req.body || {};

      const project = await repo.getWork(user.id);
      const settings = await repo.getSettings(user.id);
      const creatorName = settings.displayName || 'Illustratorin';

      const targetAssets: string[] = Array.isArray(assetIds) ? [...assetIds] : [];
      if (sourceType === 'asset' && sourceId && !targetAssets.includes(sourceId)) {
        targetAssets.unshift(sourceId);
      }

      const images: PublishableImage[] = [];
      for (const aid of targetAssets) {
        const img = await prepareProtectedImageForPublish(
          user.id,
          { assetId: aid },
          {
            webResolution: productType ? false : true,
            creatorName,
            visibleWatermark: visibleWatermark || null,
          }
        );
        images.push(img);
      }

      if (images.length === 0 && sourceType === 'page' && sourceId) {
        const pageImg = await prepareProtectedImageForPublish(
          user.id,
          { pageId: sourceId },
          {
            webResolution: false,
            creatorName,
            visibleWatermark: visibleWatermark || null,
          }
        );
        images.push(pageImg);
      }

      const zipBuf = await buildExportPackageZip({
        title,
        bodyText,
        tags: Array.isArray(tags) ? tags.map(String) : [],
        projectTitle: project.title,
        creatorName,
        sourceType,
        sourceId: sourceId || 'manual',
        priceCents,
        productType,
        colorVariants,
        images,
      });

      res.setHeader('Content-Type', 'application/zip');
      res.setHeader('Content-Disposition', 'attachment; filename="federfuehrer_export_paket.zip"');
      res.send(zipBuf);
    } catch (err: any) {
      res.status(err.statusCode || 400).json({ detail: err.message });
    }
  });

  // POST /api/v1/publish/portfolio/export (Statische Portfolio-Seite ohne CDNs als ZIP)
  router.post('/portfolio/export', async (req: Request, res: Response) => {
    try {
      const user = (req as any).user as AuthUser;
      const {
        portfolioTitle,
        bioText,
        items = [], // Array<{ assetId?: string; pageId?: string; title?: string; description?: string; tags?: string[] }>
        visibleWatermark,
      } = req.body || {};

      const project = await repo.getWork(user.id);
      const settings = await repo.getSettings(user.id);
      const creatorName = settings.displayName || 'Illustratorin';

      const works: PortfolioWorkItem[] = [];
      for (let i = 0; i < items.length; i++) {
        const it = items[i];
        const protectedImg = await prepareProtectedImageForPublish(
          user.id,
          { assetId: it.assetId, pageId: it.pageId },
          {
            webResolution: true,
            creatorName,
            visibleWatermark: visibleWatermark || null,
          }
        );

        works.push({
          id: it.assetId || it.pageId || `work-${i + 1}`,
          title: it.title || `Werk ${i + 1}`,
          description: it.description || '',
          tags: Array.isArray(it.tags) ? it.tags : [],
          image: protectedImg,
        });
      }

      const { zipBuffer } = await buildStaticPortfolioZip({
        portfolioTitle: portfolioTitle || `Portfolio – ${project.title}`,
        creatorName,
        bioText,
        works,
      });

      res.setHeader('Content-Type', 'application/zip');
      res.setHeader('Content-Disposition', 'attachment; filename="federfuehrer_portfolio_website.zip"');
      res.send(zipBuffer);
    } catch (err: any) {
      res.status(err.statusCode || 400).json({ detail: err.message });
    }
  });

  // ==========================================
  // Merch & Print-on-Demand Routen
  // ==========================================

  // GET /api/v1/publish/merch/specs
  router.get('/merch/specs', (_req: Request, res: Response) => {
    res.json({ specs: Object.values(MERCH_PRODUCT_SPECS) });
  });

  // POST /api/v1/publish/merch/check-print (Druckdatei-Prüfung je Produkt)
  router.post('/merch/check-print', (req: Request, res: Response) => {
    const {
      productType = 'poster',
      imageWidthPx = 800,
      imageHeightPx = 800,
      colorSpace = 'srgb',
      hasAlpha = true,
      placementScale = 1,
    } = req.body || {};

    const result = checkMerchPrintQuality({
      productType: productType as MerchProductType,
      imageWidthPx: Number(imageWidthPx),
      imageHeightPx: Number(imageHeightPx),
      colorSpace: String(colorSpace),
      hasAlpha: Boolean(hasAlpha),
      placementScale: Number(placementScale),
    });

    res.json(result);
  });

  // POST /api/v1/publish/merch/cutout (Objekt freistellen ohne Cloud-KI)
  router.post('/merch/cutout', async (req: Request, res: Response) => {
    try {
      const user = (req as any).user as AuthUser;
      const createdAsset = await createCutoutMotifForOwner(user.id, req.body || {});
      res.status(201).json({
        asset: createdAsset,
        message: 'Motiv mit transparentem Hintergrund freigestellt und in der Bildbibliothek gespeichert.',
      });
    } catch (err: any) {
      res.status(err.statusCode || 400).json({ detail: err.message });
    }
  });

  // GET /api/v1/publish/merch
  router.get('/merch', async (req: Request, res: Response) => {
    try {
      const user = (req as any).user as AuthUser;
      const products = await listMerchProducts(user.id);
      res.json({ products });
    } catch (err: any) {
      res.status(500).json({ detail: err.message });
    }
  });

  // POST /api/v1/publish/merch
  router.post('/merch', async (req: Request, res: Response) => {
    try {
      const user = (req as any).user as AuthUser;
      const created = await createMerchProduct(user.id, req.body || {});
      res.status(201).json(created);
    } catch (err: any) {
      res.status(err.statusCode || 400).json({ detail: err.message });
    }
  });

  // DELETE /api/v1/publish/merch/:id
  router.delete('/merch/:id', async (req: Request, res: Response) => {
    try {
      const user = (req as any).user as AuthUser;
      const ok = await deleteMerchProduct(user.id, req.params.id);
      if (!ok) {
        res.status(404).json({ detail: 'Merch-Produkt nicht gefunden.' });
        return;
      }
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ detail: err.message });
    }
  });

  // ==========================================
  // Shop-Katalog & Export (Shopify-CSV + JSON)
  // ==========================================

  // GET /api/v1/publish/shop/export.csv
  router.get('/shop/export.csv', async (req: Request, res: Response) => {
    try {
      const user = (req as any).user as AuthUser;
      const products = await listMerchProducts(user.id);
      const settings = await repo.getSettings(user.id);
      const creatorName = settings.displayName || 'Illustratorin';

      const csv = buildShopifyCsvExport(
        products.map((p: any) => ({
          id: p.id,
          title: p.title,
          description: p.description,
          creatorName,
          productType: p.productType,
          colorVariants: p.colorVariants,
          suggestedPriceCents: p.suggestedPriceCents,
          imageUrl: p.imageUrl,
        }))
      );

      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', 'attachment; filename="federfuehrer_shopify_import.csv"');
      res.send(csv);
    } catch (err: any) {
      res.status(500).json({ detail: err.message });
    }
  });

  // GET /api/v1/publish/shop/export.json
  router.get('/shop/export.json', async (req: Request, res: Response) => {
    try {
      const user = (req as any).user as AuthUser;
      const products = await listMerchProducts(user.id);
      const settings = await repo.getSettings(user.id);
      res.json({
        creator: settings.displayName || 'Illustratorin',
        exportedAt: new Date().toISOString(),
        dataMining: 'Prohibited',
        products,
      });
    } catch (err: any) {
      res.status(500).json({ detail: err.message });
    }
  });

  return router;
}
