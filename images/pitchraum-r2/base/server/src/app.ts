import express from 'express';
import type { Request, Response, NextFunction, Express } from 'express';
import fs from 'node:fs';
import path from 'node:path';
import {
  addCreatedLink,
  audioAvailabilityForTracks,
  createWorkspace,
  currentDateLabel,
  findAudioFileForTrack,
  findLinkByToken,
  findWorkspaceByLinkToken,
  getWorkspace,
  nextRecordId,
  randomToken,
  resetWorkspace,
  startSweeper,
} from './store';
import type { Workspace } from './store';
import {
  validateContractInput,
  validateMyPageSettings,
  validatePipelineStage,
  validatePitchLinkInput,
  validatePublicInquiry,
  validateRightsPatch,
  validateSplitInput,
} from './validation';
import { REQUEST_BODY_LIMIT } from '../../src/shared/limits';
import { RIGHTS_STATUS_LABEL } from '../../src/components/pitch-demo/types';
import type {
  ContractDocumentEntry,
  LicenseInquiryRecord,
  PitchDemoState,
  PitchLinkRecord,
  PitchTrack,
  SplitEntry,
  TrackRightsFile,
} from '../../src/components/pitch-demo/types';
import type { MyPageSettings } from '../../src/shared/brand';
import type { PublicLinkPayload, WorkspaceSnapshot } from '../../src/api/pitchApi';

export const WORKSPACE_COOKIE = 'pitchraum_ws';
const TOKEN_PATTERN = /^[0-9a-f]{32}$/;

/* ------------------------------------------------------------------ */
/* Grundlagen: Sicherheits-Header, Cookies, IP-Begrenzung             */
/* ------------------------------------------------------------------ */

function securityHeaders(_req: Request, res: Response, next: NextFunction): void {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'no-referrer');
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
  res.setHeader(
    'Content-Security-Policy',
    [
      "default-src 'self'",
      // Die Gebaute Demo-Seite ist eine einzelne Datei mit eingebettetem Skript und Stil.
      "script-src 'unsafe-inline'",
      "style-src 'unsafe-inline'",
      "img-src 'self' data:",
      "font-src 'self' data:",
      "media-src 'self'",
      "connect-src 'self'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'none'",
    ].join('; ')
  );
  next();
}

function readWorkspaceCookie(req: Request): string | undefined {
  const header = req.headers.cookie;
  if (!header) return undefined;
  for (const part of header.split(';')) {
    const [name, ...rest] = part.trim().split('=');
    if (name === WORKSPACE_COOKIE) {
      const value = rest.join('=');
      return /^[0-9a-f]{32}$/.test(value) ? value : undefined;
    }
  }
  return undefined;
}

function setWorkspaceCookie(req: Request, res: Response, workspaceId: string): void {
  const secure =
    process.env.NODE_ENV === 'production' ||
    req.secure ||
    req.headers['x-forwarded-proto'] === 'https';
  const parts = [
    `${WORKSPACE_COOKIE}=${workspaceId}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    `Max-Age=${24 * 60 * 60}`,
  ];
  if (secure) parts.push('Secure');
  res.setHeader('Set-Cookie', parts.join('; '));
}

/** Einfache Begrenzung je IP für Anlegen und Anfragen. */
const rateBuckets = new Map<string, { count: number; resetAt: number }>();

function rateLimit(group: string, limit: number, windowMs: number) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const ip = req.ip || req.socket.remoteAddress || 'unbekannt';
    const key = `${group}:${ip}`;
    const now = Date.now();
    let bucket = rateBuckets.get(key);
    if (!bucket || bucket.resetAt < now) {
      bucket = { count: 0, resetAt: now + windowMs };
      rateBuckets.set(key, bucket);
    }
    bucket.count += 1;
    if (rateBuckets.size > 10000) {
      for (const [k, b] of rateBuckets) if (b.resetAt < now) rateBuckets.delete(k);
    }
    if (bucket.count > limit) {
      res.status(429).json({
        error:
          'Von dieser Anschluss-Adresse kamen zuletzt sehr viele Anfragen. Bitte warte ein paar Minuten und versuche es dann erneut.',
      });
      return;
    }
    next();
  };
}

/* ------------------------------------------------------------------ */
/* Antwort-Bausteine                                                   */
/* ------------------------------------------------------------------ */

function buildSnapshot(workspace: Workspace): WorkspaceSnapshot {
  return {
    state: workspace.state,
    myPage: workspace.myPage,
    audioAvailability: audioAvailabilityForTracks(workspace.state.tracks.map((t) => t.id)),
  };
}

function buildPublicPayload(workspace: Workspace, link: PitchLinkRecord): PublicLinkPayload {
  const tracks = workspace.state.tracks.filter((t) => link.trackIds.includes(t.id));
  const rightsFiles: Record<string, TrackRightsFile> = {};
  for (const track of tracks) {
    const rights = workspace.state.rightsFiles[track.id];
    if (rights) rightsFiles[track.id] = rights;
  }
  return {
    composerName: workspace.state.composerName,
    studioLabel: workspace.state.studioLabel,
    link,
    tracks,
    rightsFiles,
    audioAvailability: audioAvailabilityForTracks(tracks.map((t) => t.id)),
  };
}

function requireWorkspace(req: Request, res: Response): Workspace | null {
  // Der Arbeitsbereich wird immer nur aus dem Cookie abgeleitet, nie aus Anfragedaten.
  const workspace = getWorkspace(readWorkspaceCookie(req));
  if (!workspace) {
    res.status(401).json({
      error:
        'Es gibt in diesem Browser noch keinen Demo-Arbeitsbereich — oder deiner wurde nach 24 Stunden gelöscht. Starte die Demo über „Demo ausprobieren“.',
    });
    return null;
  }
  return workspace;
}

function slugifyDeterministic(text: string): string {
  const cleaned = text
    .toLowerCase()
    .replace(/ä/g, 'ae')
    .replace(/ö/g, 'oe')
    .replace(/ü/g, 'ue')
    .replace(/ß/g, 'ss')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return cleaned || 'pitch-auswahl';
}

/* ------------------------------------------------------------------ */
/* App-Factory                                                         */
/* ------------------------------------------------------------------ */

export interface CreateAppOptions {
  /** dist/index.html für alle Nicht-API-GET-Routen ausliefern? */
  serveStatic?: boolean;
}

export function createApp(options: CreateAppOptions = {}): Express {
  const app = express();
  app.disable('x-powered-by');
  app.set('trust proxy', false);
  startSweeper();

  app.use(securityHeaders);
  app.use(express.json({ limit: REQUEST_BODY_LIMIT }));

  /* ----- Arbeitsbereich ----- */

  app.post(
    '/api/demo-workspaces',
    rateLimit('workspace', 30, 60 * 60 * 1000),
    (_req: Request, res: Response) => {
      const result = createWorkspace();
      if (!result.ok) {
        res.status(503).json({ error: result.message });
        return;
      }
      setWorkspaceCookie(_req, res, result.workspace.id);
      res.status(201).json(buildSnapshot(result.workspace));
    }
  );

  app.get('/api/state', (req: Request, res: Response) => {
    const workspace = requireWorkspace(req, res);
    if (!workspace) return;
    res.json(buildSnapshot(workspace));
  });

  app.post('/api/workspace/reset', (req: Request, res: Response) => {
    const workspace = requireWorkspace(req, res);
    if (!workspace) return;
    resetWorkspace(workspace);
    res.json(buildSnapshot(workspace));
  });

  /* ----- Komponisten-Aktionen ----- */

  app.post(
    '/api/pitch-links',
    rateLimit('link', 30, 10 * 60 * 1000),
    (req: Request, res: Response) => {
      const workspace = requireWorkspace(req, res);
      if (!workspace) return;
      const checked = validatePitchLinkInput(req.body, workspace.state);
      if (!checked.ok) {
        res.status(400).json({ error: checked.message });
        return;
      }
      const id = nextRecordId(workspace, 'link');
      const slugBase = slugifyDeterministic(
        `${checked.value.recipientName}-${checked.value.productionTitle}`.slice(0, 36)
      );
      const link: PitchLinkRecord = {
        id,
        slug: `${slugBase}-${id}`,
        token: randomToken(),
        recipientName: checked.value.recipientName,
        productionTitle: checked.value.productionTitle,
        personalNote: checked.value.personalNote,
        trackIds: checked.value.trackIds,
        createdDate: currentDateLabel(),
        statusOpened: false,
        statusListened: false,
        lastListenedTrackId: null,
      };
      addCreatedLink(workspace, link);
      res.status(201).json({ snapshot: buildSnapshot(workspace), link });
    }
  );

  app.post('/api/inquiries/:id/stage', (req: Request, res: Response) => {
    const workspace = requireWorkspace(req, res);
    if (!workspace) return;
    const checked = validatePipelineStage(req.body);
    if (!checked.ok) {
      res.status(400).json({ error: checked.message });
      return;
    }
    const inquiryId = req.params.id;
    if (!workspace.state.inquiries.some((inq) => inq.id === inquiryId)) {
      res.status(404).json({ error: 'Diese Anfrage existiert nicht (mehr).' });
      return;
    }
    const state: PitchDemoState = {
      ...workspace.state,
      inquiries: workspace.state.inquiries.map((inq) =>
        inq.id === inquiryId ? { ...inq, stage: checked.value } : inq
      ),
    };
    workspace.state = state;
    res.json(buildSnapshot(workspace));
  });

  app.patch('/api/tracks/:id/rights', (req: Request, res: Response) => {
    const workspace = requireWorkspace(req, res);
    if (!workspace) return;
    const trackId = req.params.id;
    const existing = workspace.state.rightsFiles[trackId];
    if (!existing) {
      res.status(404).json({ error: 'Diesen Track gibt es in deinem Katalog nicht.' });
      return;
    }
    const checked = validateRightsPatch(req.body);
    if (!checked.ok) {
      res.status(400).json({ error: checked.message });
      return;
    }
    workspace.state = {
      ...workspace.state,
      rightsFiles: {
        ...workspace.state.rightsFiles,
        [trackId]: {
          ...existing,
          isrcCode: checked.value.isrcCode !== undefined ? checked.value.isrcCode : existing.isrcCode,
          workRegistrationCode:
            checked.value.workRegistrationCode !== undefined
              ? checked.value.workRegistrationCode
              : existing.workRegistrationCode,
          notes: checked.value.notes !== undefined ? checked.value.notes : existing.notes,
        },
      },
    };
    res.json(buildSnapshot(workspace));
  });

  app.post('/api/tracks/:id/splits', (req: Request, res: Response) => {
    const workspace = requireWorkspace(req, res);
    if (!workspace) return;
    const trackId = req.params.id;
    const existing = workspace.state.rightsFiles[trackId];
    if (!existing) {
      res.status(404).json({ error: 'Diesen Track gibt es in deinem Katalog nicht.' });
      return;
    }
    const checked = validateSplitInput(req.body);
    if (!checked.ok) {
      res.status(400).json({ error: checked.message });
      return;
    }
    const newSplit: SplitEntry = {
      id: nextRecordId(workspace, 'spl'),
      personName: checked.value.personName,
      role: checked.value.role,
      sharePercent: checked.value.sharePercent,
      optionalIdentifier: checked.value.optionalIdentifier,
    };
    workspace.state = {
      ...workspace.state,
      rightsFiles: {
        ...workspace.state.rightsFiles,
        [trackId]: { ...existing, splits: [...existing.splits, newSplit] },
      },
    };
    res.json(buildSnapshot(workspace));
  });

  app.post('/api/tracks/:id/contracts', (req: Request, res: Response) => {
    const workspace = requireWorkspace(req, res);
    if (!workspace) return;
    const trackId = req.params.id;
    const existing = workspace.state.rightsFiles[trackId];
    if (!existing) {
      res.status(404).json({ error: 'Diesen Track gibt es in deinem Katalog nicht.' });
      return;
    }
    const checked = validateContractInput(req.body);
    if (!checked.ok) {
      res.status(400).json({ error: checked.message });
      return;
    }
    // Kein echter Datei-Upload: gespeichert wird nur der eingegebene Dateiname (klar als Demo gekennzeichnet).
    const newDoc: ContractDocumentEntry = {
      id: nextRecordId(workspace, 'doc'),
      fileName: checked.value.fileName,
      documentType: checked.value.documentType,
      uploadedDate: currentDateLabel(),
      note: checked.value.note,
    };
    workspace.state = {
      ...workspace.state,
      rightsFiles: {
        ...workspace.state.rightsFiles,
        [trackId]: { ...existing, contracts: [...existing.contracts, newDoc] },
      },
    };
    res.json(buildSnapshot(workspace));
  });

  /* ----- Meine Seite ----- */

  app.put('/api/meine-seite', (req: Request, res: Response) => {
    const workspace = requireWorkspace(req, res);
    if (!workspace) return;
    const checked = validateMyPageSettings(req.body, workspace.state);
    if (!checked.ok) {
      res.status(400).json({ error: checked.message });
      return;
    }
    const settings: MyPageSettings = {
      artistName: checked.value.artistName,
      tagline: checked.value.tagline,
      intro: checked.value.intro,
      layoutId: checked.value.layoutId,
      brand: checked.value.brand as MyPageSettings['brand'],
      featuredTrackId: checked.value.featuredTrackId,
    };
    workspace.myPage = settings;
    res.json(settings);
  });

  /* ----- Öffentlicher Empfängerlink ----- */

  function resolveLink(
    req: Request,
    res: Response
  ): { workspace: Workspace; link: PitchLinkRecord } | null {
    const token = req.params.token || '';
    if (!TOKEN_PATTERN.test(token)) {
      res.status(404).json({
        error:
          'Diesen Link gibt es nicht. Bitte prüfe, ob die Adresse vollständig ist, oder frage die Absenderin oder den Absender nach dem aktuellen Link.',
      });
      return null;
    }
    const workspace = findWorkspaceByLinkToken(token);
    const link = workspace ? findLinkByToken(workspace, token) : null;
    if (!workspace || !link) {
      res.status(404).json({
        error:
          'Diesen Link gibt es nicht (mehr). Demo-Links verlieren nach 24 Stunden ihre Gültigkeit. Bitte frage die Absenderin oder den Absender nach einem neuen Link.',
      });
      return null;
    }
    return { workspace, link };
  }

  app.get('/api/l/:token', (req: Request, res: Response) => {
    const resolved = resolveLink(req, res);
    if (!resolved) return;
    // Öffnen über den Empfängerlink wird wirklich erfasst.
    resolved.link.statusOpened = true;
    res.json(buildPublicPayload(resolved.workspace, resolved.link));
  });

  app.post('/api/l/:token/listened', (req: Request, res: Response) => {
    const resolved = resolveLink(req, res);
    if (!resolved) return;
    const trackId = (req.body as { trackId?: unknown })?.trackId;
    if (typeof trackId !== 'string' || !resolved.link.trackIds.includes(trackId)) {
      res.status(400).json({ error: 'Dieser Track gehört nicht zu dieser Auswahl.' });
      return;
    }
    // Abspielen über den Empfängerlink wird wirklich erfasst.
    resolved.link.statusOpened = true;
    resolved.link.statusListened = true;
    resolved.link.lastListenedTrackId = trackId;
    res.json(buildPublicPayload(resolved.workspace, resolved.link));
  });

  app.post(
    '/api/l/:token/inquiries',
    rateLimit('inquiry', 30, 10 * 60 * 1000),
    (req: Request, res: Response) => {
      const resolved = resolveLink(req, res);
      if (!resolved) return;
      const checked = validatePublicInquiry(req.body, resolved.link.trackIds);
      if (!checked.ok) {
        res.status(400).json({ error: checked.message });
        return;
      }
      const track: PitchTrack | undefined = resolved.workspace.state.tracks.find(
        (t) => t.id === checked.value.trackId
      );
      const inquiry: LicenseInquiryRecord = {
        id: nextRecordId(resolved.workspace, 'inq'),
        pitchLinkId: resolved.link.id,
        trackId: checked.value.trackId,
        trackTitle: track ? track.title : 'Unbekannter Titel',
        recipientName: checked.value.recipientName,
        productionTitle: checked.value.productionTitle,
        usageScope: checked.value.usageScope,
        message: checked.value.message,
        createdDate: currentDateLabel(),
        stage: 'neu_eingegangen',
      };
      resolved.workspace.state = {
        ...resolved.workspace.state,
        inquiries: [inquiry, ...resolved.workspace.state.inquiries],
      };
      res.status(201).json({ ok: true });
    }
  );

  /** Hörprobe: nur wenn zu dieser Track-ID eine Datei in demo-assets/audio liegt. */
  app.get('/api/l/:token/audio/:trackId', (req: Request, res: Response) => {
    const resolved = resolveLink(req, res);
    if (!resolved) return;
    const trackId = req.params.trackId;
    if (!resolved.link.trackIds.includes(trackId)) {
      res.status(404).json({ error: 'Dieser Track gehört nicht zu dieser Auswahl.' });
      return;
    }
    const filePath = findAudioFileForTrack(trackId);
    if (!filePath) {
      res.status(404).json({ error: 'Für diesen Track gibt es in der Demo keine Audiodatei.' });
      return;
    }
    res.setHeader('Cache-Control', 'no-store');
    res.sendFile(filePath);
  });

  /* ----- Unbekannte API-Routen ----- */
  app.all('/api/*', (_req: Request, res: Response) => {
    res.status(404).json({ error: 'Diese Adresse kennt der Demo-Server nicht.' });
  });

  /* ----- Fehlerbehandlung (u. a. Körpergröße über 100 kB) ----- */
  app.use((err: Error & { type?: string }, _req: Request, res: Response, next: NextFunction) => {
    if (res.headersSent) {
      next(err);
      return;
    }
    if (err.type === 'entity.too.large') {
      res.status(413).json({
        error: 'Die Eingabe ist zu umfangreich. Bitte kürze lange Texte und versuche es erneut.',
      });
      return;
    }
    if (err.type === 'entity.parse.failed') {
      res.status(400).json({ error: 'Die Anfrage war nicht lesbar. Bitte versuche es erneut.' });
      return;
    }
    res.status(500).json({
      error: 'Auf dem Demo-Server ist ein Fehler aufgetreten. Bitte versuche es erneut.',
    });
  });

  /* ----- Gebaute Website ausliefern ----- */
  if (options.serveStatic) {
    const distDir = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distDir, { index: 'index.html', maxAge: '1h' }));
    app.use((req: Request, res: Response, next: NextFunction) => {
      if (req.method !== 'GET') {
        next();
        return;
      }
      const indexFile = path.join(distDir, 'index.html');
      if (fs.existsSync(indexFile)) {
        res.sendFile(indexFile);
        return;
      }
      res
        .status(503)
        .send(
          'Die Demo-Website wurde noch nicht gebaut. Bitte zuerst „npm run build“ ausführen und den Server neu starten.'
        );
    });
  }

  return app;
}
