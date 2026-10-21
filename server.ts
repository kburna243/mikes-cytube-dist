import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import multer from 'multer';
import { repo } from './lib/repo.js';
import { getSession, requireUser, setSessionCookie, clearSessionCookie, authenticateUser, createSession, deleteSession, findUserByUsername, type AuthUser } from './lib/auth.js';
import aiRoutes from './lib/aiRoutes.js';
import { checkChapterContinuity } from './src/server/continuity.js';
import { lookupOpenThesaurus } from './lib/services/thesaurusServer.js';
import { transcribeAudio, ASRConfigError } from './lib/asr.js';
import { validateEnv, EnvValidationError, isOmniRouteConfigured, isASRConfigured } from './lib/env.js';
import type { Entity, Fact, Relation, ResearchSource } from './src/types/domain.js';

dotenv.config();

// Umgebungsvariablen validieren
try {
  const envConfig = validateEnv();
  console.log('[Federführer] Umgebungsvariablen geprüft ✓');
  if (!isOmniRouteConfigured()) {
    console.log('[Federführer] Hinweis: OmniRoute nicht konfiguriert – KI-Funktionen sind deaktiviert (fail-closed)');
  }
  if (!isASRConfigured()) {
    console.log('[Federführer] Hinweis: ASR nicht konfiguriert – Spracherkennung ist deaktiviert (fail-closed)');
  }
} catch (err) {
  if (err instanceof EnvValidationError) {
    console.error('\n❌ Start abgebrochen: Umgebungsvariablen fehlen oder sind ungültig.\n');
    console.error(err.message);
    console.error('\nBitte prüfe deine .env-Datei oder setze die Variablen in der Umgebung.');
    console.error('Siehe .env.example für alle verfügbaren Variablen.\n');
    process.exit(1);
  }
  throw err;
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '256kb' }));
app.use(cookieParser());

// Security & Content-Security-Policy Header
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; font-src 'self' data:; connect-src 'self'; img-src 'self' data: blob:;"
  );
  next();
});

// ==========================================
// 1. Öffentliche Endpunkte (TEIL D)
// ==========================================

// Healthcheck für Docker & Monitoring
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    app: 'Federführer',
    version: '1.0.0',
    commit: process.env.GIT_SHA || 'unknown',
    timestamp: new Date().toISOString(),
  });
});

// Auth Login
app.post('/api/auth/login', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({
      type: 'https://tools.ietf.org/html/rfc9457',
      title: 'Fehlende Daten',
      status: 400,
      detail: 'Bitte Benutzername und Passwort eingeben.',
    });
  }

  const result = await authenticateUser(username, password);

  if (!result.success) {
    return res.status(401).json({
      type: 'https://tools.ietf.org/html/rfc9457',
      title: 'Anmeldung fehlgeschlagen',
      status: 401,
      detail: result.error || 'Ungültiger Benutzername oder Passwort',
    });
  }

  // Session erstellen
  const userAgent = req.headers['user-agent'] || '';
  const token = await createSession(result.userId!, userAgent);
  setSessionCookie(res, token);

  const user = await findUserByUsername(username);
  res.json({
    success: true,
    user: user ? { id: user.id, username: user.username, displayName: user.displayName } : null,
    message: 'Erfolgreich angemeldet.',
  });
});

// Auth Logout
app.post('/api/auth/logout', async (req, res) => {
  // Token aus Cookie lesen und Session löschen
  const token = req.cookies?.['federfuehrer_session'];
  if (token) {
    await deleteSession(token);
  }
  clearSessionCookie(res);
  res.json({ success: true, message: 'Erfolgreich abgemeldet.' });
});

// Auth Me
app.get('/api/auth/me', async (req, res) => {
  const user = await getSession(req);
  if (!user) {
    return res.status(401).json({
      type: 'https://tools.ietf.org/html/rfc9457',
      title: 'Nicht autorisiert',
      status: 401,
      detail: 'Keine gültige Sitzung vorhanden.',
    });
  }
  res.json({ user });
});

// OpenThesaurus (Deutscher Thesaurus lokal in DB/Server - LGPL)
app.get('/api/thesaurus', async (req, res) => {
  const wort = (req.query.wort as string) || '';
  if (!wort.trim()) {
    return res.json({ word: '', synonyms: [], source: 'OpenThesaurus (LGPL)' });
  }
  const result = await lookupOpenThesaurus(wort);
  res.json(result);
});

// ==========================================
// 2. Geschützte KI-Endpunkte (TEIL A)
// ==========================================
app.use('/api/ai', requireUser, aiRoutes);

// ==========================================
// 3. Projekt Export & Import (TEIL B)
// ==========================================
app.get('/api/export', requireUser, async (req, res) => {
  const user = (req as any).user;
  const format = (req.query.format as string) === 'markdown' ? 'markdown' : 'json';
  const projectId = (req.query.projectId as string) || 'work-01';

  try {
    const data = await repo.exportProject(user.id, projectId, format);
    if (format === 'json') {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', 'attachment; filename="federfuehrer_backup.json"');
      return res.json(data);
    }

    res.setHeader('Content-Type', 'text/markdown; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="federfuehrer_manuskript.md"');
    res.send(data);
  } catch (err: any) {
    res.status(500).json({ detail: err.message });
  }
});

app.post('/api/import', requireUser, async (req, res) => {
  const user = (req as any).user;
  const payload = req.body;
  if (!payload || !payload.project) {
    return res.status(400).json({ detail: 'Ungültiges Import-Format. Projekt-Daten fehlen.' });
  }

  try {
    if (payload.chapters && Array.isArray(payload.chapters)) {
      for (const ch of payload.chapters) {
        await repo.saveChapter(user.id, {
          id: ch.id,
          title: ch.title,
          body: ch.content || ch.body || '',
          order: ch.position || ch.order,
          summary: ch.summary,
        });
      }
    }
    res.json({ success: true, message: 'Projekt erfolgreich importiert.' });
  } catch (err: any) {
    res.status(500).json({ detail: err.message });
  }
});

// ==========================================
// 4. REST API v1 (Kapitel, Weltenbuch, Fakten)
// ==========================================

// Work
app.get('/api/v1/works', requireUser, async (req, res) => {
  const user = (req as any).user;
  res.json(await repo.getWork(user.id));
});

app.patch('/api/v1/works/:id', requireUser, async (req, res) => {
  const user = (req as any).user;
  const updated = await repo.updateWork(user.id, req.body);
  res.json(updated);
});

// Chapters
app.get('/api/v1/chapters', requireUser, async (req, res) => {
  const user = (req as any).user;
  res.json(await repo.getChapters(user.id));
});

app.get('/api/v1/chapters/:id', requireUser, async (req, res) => {
  const user = (req as any).user;
  const chapter = await repo.getChapter(user.id, req.params.id);
  if (!chapter) {
    return res.status(404).json({
      type: 'https://tools.ietf.org/html/rfc9457',
      title: 'Not Found',
      status: 404,
      detail: `Kapitel mit ID ${req.params.id} wurde nicht gefunden.`,
    });
  }
  res.json(chapter);
});

app.post('/api/v1/chapters', requireUser, async (req, res) => {
  const user = (req as any).user;
  const chapter = await repo.saveChapter(user.id, req.body);
  res.status(201).json(chapter);
});

app.patch('/api/v1/chapters/:id', requireUser, async (req, res) => {
  const user = (req as any).user;
  const existing = await repo.getChapter(user.id, req.params.id);

  // Offline-Sync Konfliktschutz
  if (
    req.body.baseServerVersion !== undefined &&
    existing &&
    existing.revision > Number(req.body.baseServerVersion)
  ) {
    return res.status(409).json({
      conflict: true,
      chapterId: existing.id,
      title: existing.title,
      body: existing.body,
      serverVersion: existing.revision,
      message: 'Auf dem Tablet und auf dem Server gibt es zwei Fassungen. Welche möchtest du behalten?',
    });
  }

  const chapter = await repo.saveChapter(user.id, { ...req.body, id: req.params.id });
  res.json(chapter);
});

app.delete('/api/v1/chapters/:id', requireUser, async (req, res) => {
  const user = (req as any).user;
  await repo.deleteChapter(user.id, req.params.id);
  res.json({ success: true, message: 'In die Schreibtisch-Schublade gelegt.' });
});

// Entities & Facts
app.get('/api/v1/entities', requireUser, async (req, res) => {
  const user = (req as any).user;
  const type = req.query.type as string | undefined;
  res.json(await repo.getEntities(user.id, type));
});

app.get('/api/v1/entities/:id', requireUser, async (req, res) => {
  const user = (req as any).user;
  const entity = await repo.getEntity(user.id, req.params.id);
  if (!entity) return res.status(404).json({ detail: 'Entität nicht gefunden.' });
  res.json(entity);
});

app.post('/api/v1/entities', requireUser, async (req, res) => {
  const user = (req as any).user;
  const entity = await repo.saveEntity(user.id, req.body);
  res.status(201).json(entity);
});

app.patch('/api/v1/entities/:id', requireUser, async (req, res) => {
  const user = (req as any).user;
  const entity = await repo.saveEntity(user.id, { ...req.body, id: req.params.id });
  res.json(entity);
});

app.delete('/api/v1/entities/:id', requireUser, async (req, res) => {
  const user = (req as any).user;
  await repo.deleteEntity(user.id, req.params.id);
  res.json({ success: true });
});

app.get('/api/v1/entities/:id/facts', requireUser, async (req, res) => {
  const user = (req as any).user;
  res.json(await repo.getFacts(user.id, req.params.id));
});

app.post('/api/v1/entities/:id/facts', requireUser, async (req, res) => {
  const user = (req as any).user;
  const fact = await repo.addFact(user.id, { ...req.body, entity_id: req.params.id });
  res.status(201).json(fact);
});

app.delete('/api/v1/facts/:id', requireUser, async (req, res) => {
  const user = (req as any).user;
  await repo.deleteFact(user.id, req.params.id);
  res.json({ success: true });
});

// Graph (Nodes & Edges)
app.get('/api/v1/graph', requireUser, async (req, res) => {
  const user = (req as any).user;
  const entities = await repo.getEntities(user.id);
  const relations = await repo.getRelations(user.id);
  const facts = await repo.getFacts(user.id);

  const nodes = entities.map((e: Entity) => ({
    id: e.id,
    label: e.name,
    type: e.type,
    aliases: e.aliases,
    factCount: facts.filter((f: Fact) => f.entity_id === e.id).length,
    position: (e as Entity & { position?: { x: number; y: number } }).position,
  }));

  const edges = relations.map((r: Relation) => ({
    id: r.id,
    source: r.source_id,
    target: r.target_id,
    label: r.label,
    type: r.type,
    isImportant: (r as Relation & { isImportant?: boolean }).isImportant,
  }));

  res.json({ nodes, edges });
});

app.post('/api/v1/graph/positions', requireUser, async (req, res) => {
  const user = (req as any).user;
  const { positions } = req.body;
  if (positions && typeof positions === 'object') {
    for (const [id, pos] of Object.entries(positions)) {
      const entity = await repo.getEntity(user.id, id);
      if (entity) {
        await repo.saveEntity(user.id, { ...entity, id, position: pos } as any);
      }
    }
  }
  res.json({ success: true });
});


// Relations
app.get('/api/v1/relations', requireUser, async (req, res) => {
  const user = (req as any).user;
  res.json(await repo.getRelations(user.id));
});

app.post('/api/v1/relations', requireUser, async (req, res) => {
  const user = (req as any).user;
  const rel = await repo.saveRelation(user.id, req.body);
  res.status(201).json(rel);
});

app.delete('/api/v1/relations/:id', requireUser, async (req, res) => {
  const user = (req as any).user;
  await repo.deleteRelation(user.id, req.params.id);
  res.json({ success: true });
});

// Plot Threads & Beats
app.get('/api/v1/plot/threads', requireUser, async (req, res) => {
  const user = (req as any).user;
  res.json(await repo.getThreads(user.id));
});

app.post('/api/v1/plot/threads', requireUser, async (req, res) => {
  const user = (req as any).user;
  const thread = await repo.saveThread(user.id, req.body);
  res.status(201).json(thread);
});

// Timeline Events
app.get('/api/v1/timeline/events', requireUser, async (req, res) => {
  const user = (req as any).user;
  res.json(await repo.getTimeline(user.id));
});

app.post('/api/v1/timeline/events', requireUser, async (req, res) => {
  const user = (req as any).user;
  const event = await repo.saveTimelineEvent(user.id, req.body);
  res.status(201).json(event);
});

// Research
app.get('/api/v1/research/sources', requireUser, async (req, res) => {
  const user = (req as any).user;
  res.json(await repo.getResearch(user.id));
});

app.post('/api/v1/research/sources', requireUser, async (req, res) => {
  const user = (req as any).user;
  const item = await repo.saveResearch(user.id, req.body);
  res.status(201).json(item);
});

app.post('/api/v1/research/import', requireUser, async (req, res) => {
  const user = (req as any).user;
  const { notes } = req.body;
  if (!Array.isArray(notes)) {
    return res.status(400).json({ error: 'Array von Notizen erforderlich.' });
  }

  const savedItems: any[] = [];
  for (const n of notes) {
    const item = await repo.saveResearch(user.id, {
      id: n.id || `res-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 7)}`,
      title: n.title,
      type: n.type || 'note',
      content: n.content,
      tags: Array.isArray(n.tags) ? n.tags : [],
      citation: n.citation || n.source || undefined,
      created_at: Date.now(),
    });

    if (item) savedItems.push(item);
  }

  res.status(201).json({ success: true, count: savedItems.length, items: savedItems });
});

app.get('/api/v1/research/search', requireUser, async (req, res) => {
  const user = (req as any).user;
  const q = ((req.query.q as string) || '').toLowerCase();
  const all = await repo.getResearch(user.id);
  const results = all.filter(
    (r: ResearchSource) =>
      r.title.toLowerCase().includes(q) ||
      r.content.toLowerCase().includes(q) ||
      r.tags.some((t: string) => t.toLowerCase().includes(q))
  );
  res.json(results);
});

// Continuity Checker (Deterministisch)
app.post('/api/v1/continuity/check', requireUser, async (req, res) => {
  const user = (req as any).user;
  const chapterId = (req.query.chapter as string) || req.body.chapter_id;
  if (!chapterId) {
    return res.status(400).json({ detail: 'Parameter chapter_id erforderlich.' });
  }
  const conflicts = await checkChapterContinuity(user.id, chapterId);
  res.json({ chapter_id: chapterId, conflicts });
});

// Proposals (Human-in-the-Loop Review Queue)
app.get('/api/v1/assistant/proposals', requireUser, async (req, res) => {
  const user = (req as any).user;
  res.json(await repo.getProposals(user.id));
});

app.post('/api/v1/assistant/proposals/:id/accept', requireUser, async (req, res) => {
  const user = (req as any).user;
  const result = await repo.acceptProposal(user.id, req.params.id);
  if (!result.success) {
    return res.status(400).json({ detail: result.message });
  }
  res.json(result);
});

app.post('/api/v1/assistant/proposals/:id/reject', requireUser, async (req, res) => {
  const user = (req as any).user;
  const success = await repo.rejectProposal(user.id, req.params.id);
  res.json({ success, message: 'Vorschlag wurde verworfen.' });
});

// Accessibility Settings (Legacy & Full)
app.get('/api/v1/settings/accessibility', requireUser, async (req, res) => {
  const user = (req as any).user;
  const s = await repo.getSettings(user.id);
  res.json(s);
});

app.put('/api/v1/settings/accessibility', requireUser, async (req, res) => {
  const user = (req as any).user;
  const updated = await repo.updateSettings(user.id, req.body);
  res.json(updated);
});

// Full Settings API (Personalisierung, Tagesziel, Lesezeichen)
app.get('/api/v1/settings', requireUser, async (req, res) => {
  const user = (req as any).user;
  const s = await repo.getSettings(user.id);
  res.json(s);
});

app.patch('/api/v1/settings', requireUser, async (req, res) => {
  const user = (req as any).user;
  const updated = await repo.updateSettings(user.id, req.body);
  res.json(updated);
});

// Schreibtisch-Schublade (Soft-Delete)
app.get('/api/v1/drawer', requireUser, async (req, res) => {
  const user = (req as any).user;
  const items = await repo.getDrawerItems(user.id);
  res.json(items);
});

app.post('/api/v1/drawer/:id/restore', requireUser, async (req, res) => {
  const user = (req as any).user;
  await repo.restoreDrawerItem(user.id, req.params.id);
  res.json({ success: true, message: 'Erfolgreich zurückgelegt.' });
});

app.delete('/api/v1/drawer/:id/permanent', requireUser, async (req, res) => {
  const user = (req as any).user;
  await repo.permanentlyDeleteDrawerItem(user.id, req.params.id);
  res.json({ success: true, message: 'Endgültig gelöscht.' });
});

// Kapitel-Zeitmaschine: Schnappschüsse
app.get('/api/v1/chapters/:id/snapshots', requireUser, async (req, res) => {
  const user = (req as any).user;
  const snaps = await repo.getSnapshots(user.id, req.params.id);
  res.json(snaps);
});

app.post('/api/v1/chapters/:id/snapshots', requireUser, async (req, res) => {
  const user = (req as any).user;
  const { label, content } = req.body;
  const snap = await repo.createSnapshot(user.id, req.params.id, label || 'Schnappschuss', content || '');
  res.status(201).json(snap);
});

app.post('/api/v1/chapters/:id/snapshots/:snapId/restore', requireUser, async (req, res) => {
  const user = (req as any).user;
  const content = await repo.restoreSnapshot(user.id, req.params.id, req.params.snapId);
  if (content !== null) {
    return res.json({ success: true, content, message: 'Fassung erfolgreich zurückgeholt.' });
  }
  res.status(404).json({ detail: 'Schnappschuss nicht gefunden.' });
});

// Autoren-Whitelist (Custom Words pro Projekt)
app.get('/api/v1/projects/:projectId/custom-words', requireUser, async (req, res) => {
  const words = await repo.getCustomWords(req.params.projectId);
  res.json(words);
});

app.post('/api/v1/projects/:projectId/custom-words', requireUser, async (req, res) => {
  const { word } = req.body;
  if (!word) return res.status(400).json({ error: 'Wort erforderlich' });
  const words = await repo.addCustomWord(req.params.projectId, word);
  res.json(words);
});

app.delete('/api/v1/projects/:projectId/custom-words/:word', requireUser, async (req, res) => {
  const words = await repo.removeCustomWord(req.params.projectId, decodeURIComponent(req.params.word));
  res.json(words);
});

// Legacy Export Endpoint
app.post('/api/v1/export', requireUser, async (req, res) => {
  const user = (req as any).user;
  const format = req.body.format || 'markdown';
  const data = await repo.exportProject(user.id, 'work-01', format === 'json' ? 'json' : 'markdown');

  if (format === 'json') {
    res.setHeader('Content-Disposition', 'attachment; filename="federfuehrer_backup.json"');
    res.setHeader('Content-Type', 'application/json');
    return res.json(data);
  }

  res.setHeader('Content-Disposition', 'attachment; filename="federfuehrer_manuskript.md"');
  res.setHeader('Content-Type', 'text/markdown; charset=utf-8');
  res.send(data);
});

// ==========================================
// 5. TEIL 1: IDEEN-KLADDE (Sprachnotizen & ASR)
// ==========================================

const IDEAS_DIR = process.env.IDEAS_DIR
  ? path.resolve(process.env.IDEAS_DIR)
  : path.resolve(__dirname, 'data', 'ideas');

if (!fs.existsSync(IDEAS_DIR)) {
  fs.mkdirSync(IDEAS_DIR, { recursive: true });
}

const ideaStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, IDEAS_DIR);
  },
  filename: (req, file, cb) => {
    const ext = file.mimetype.includes('webm')
      ? '.webm'
      : file.mimetype.includes('mp4')
      ? '.mp4'
      : file.mimetype.includes('wav')
      ? '.wav'
      : '.audio';
    const name = `idea_${Date.now()}_${Math.random().toString(36).substring(2, 8)}${ext}`;
    cb(null, name);
  },
});

const ideaUpload = multer({
  storage: ideaStorage,
  limits: {
    fileSize: 15 * 1024 * 1024, // max. 15 MB
  },
  fileFilter: (req, file, cb) => {
    if (!file.mimetype || !file.mimetype.startsWith('audio/')) {
      return cb(new Error('Ungültiges Dateiformat. Es sind nur Audio-MIME-Typen (audio/*) erlaubt.'));
    }
    cb(null, true);
  },
});

// Hintergrund-Job für ASR-Warteschlange (max. 3 Wiederholungen, fail-closed)
let isWorkerRunning = false;
async function triggerTranscriptionWorker() {
  if (isWorkerRunning) return;
  isWorkerRunning = true;

  try {
    const pending = await repo.getPendingIdeaNotes(3);
    for (const item of pending) {
      try {
        await repo.updateIdeaNote(item.id, { transcript_status: 'läuft' });
        const result = await transcribeAudio(item.audioPath);
        await repo.updateIdeaNote(item.id, {
          transcript: result.text,
          duration_sec: result.dauerSek,
          transcript_status: 'fertig',
        });
      } catch (err: any) {
        if (err instanceof ASRConfigError) {
          // fail-closed: Bleibt als Audio erhalten mit Status 'wartet'
          await repo.updateIdeaNote(item.id, { transcript_status: 'wartet' });
          break; // keine weiteren Versuche, wenn ASR nicht konfiguriert
        }
        const retries = (item.retryCount || 0) + 1;
        await repo.updateIdeaNote(item.id, {
          retry_count: retries,
          transcript_status: retries >= 3 ? 'fehler' : 'wartet',
        });
      }
    }
  } catch (err) {
    console.warn('[ASR-Worker] Warteschlangen-Fehler:', err);
  } finally {
    isWorkerRunning = false;
  }
}

// Periodischer Worker-Takt alle 15 Sekunden
setInterval(triggerTranscriptionWorker, 15000);

// Ideen auflisten (GET /api/ideen)
app.get('/api/ideen', requireUser, async (req, res) => {
  const user = (req as any).user;
  const notes = await repo.getIdeaNotes(user.id);
  res.json(notes);
});

// Neue Sprachnotiz hochladen (POST /api/ideen)
app.post(
  '/api/ideen',
  requireUser,
  (req, res, next) => {
    ideaUpload.single('audio')(req, res, (err: any) => {
      if (err) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(413).json({
            type: 'https://tools.ietf.org/html/rfc9457',
            title: 'Datei zu groß',
            status: 413,
            detail: 'Die Sprachaufnahme überschreitet das Limit von 15 MB.',
          });
        }
        return res.status(400).json({
          type: 'https://tools.ietf.org/html/rfc9457',
          title: 'Ungültige Datei',
          status: 400,
          detail: err.message || 'Fehler beim Datei-Upload.',
        });
      }
      next();
    });
  },
  async (req, res) => {
    const user = (req as any).user;
    if (!req.file) {
      return res.status(400).json({
        type: 'https://tools.ietf.org/html/rfc9457',
        title: 'Datei fehlt',
        status: 400,
        detail: 'Keine Audiodatei im Feld audio empfangen.',
      });
    }

    const durationSec = parseInt(req.body.duration_sec as string) || 0;
    const chapterId = (req.body.chapter_id as string) || null;
    const title = (req.body.title as string) || null;

    try {
      const note = await repo.createIdeaNote({
        ownerId: user.id,
        projectId: 'work-01',
        chapterId,
        audioPath: req.file.path,
        audioMime: req.file.mimetype,
        durationSec,
        transcriptStatus: 'wartet',
        title,
        pinned: false,
      });

      // Sofort im Hintergrund die Verschriftung anstoßen
      setTimeout(triggerTranscriptionWorker, 100);

      res.status(201).json(note);
    } catch (err: any) {
      res.status(500).json({ detail: err.message || 'Fehler beim Speichern der Sprachnotiz.' });
    }
  }
);

// Audiodatei abspielen / streamen (GET /api/ideen/:id/audio)
app.get('/api/ideen/:id/audio', requireUser, async (req, res) => {
  const user = (req as any).user;
  const note = await repo.getIdeaNoteById(user.id, req.params.id);

  if (!note || !fs.existsSync(note.audio_path)) {
    return res.status(404).json({ detail: 'Audiodatei nicht gefunden.' });
  }

  res.setHeader('Content-Type', note.audio_mime || 'audio/webm');
  res.sendFile(path.resolve(note.audio_path));
});

// Idee bearbeiten (PATCH /api/ideen/:id)
app.patch('/api/ideen/:id', requireUser, async (req, res) => {
  const user = (req as any).user;
  const note = await repo.getIdeaNoteById(user.id, req.params.id);
  if (!note) return res.status(404).json({ detail: 'Sprachnotiz nicht gefunden.' });

  const updated = await repo.updateIdeaNote(req.params.id, req.body);
  res.json(updated);
});

// Manuell erneut transkribieren (POST /api/ideen/:id/transcribe)
app.post('/api/ideen/:id/transcribe', requireUser, async (req, res) => {
  const user = (req as any).user;
  const note = await repo.getIdeaNoteById(user.id, req.params.id);
  if (!note) return res.status(404).json({ detail: 'Sprachnotiz nicht gefunden.' });

  await repo.updateIdeaNote(req.params.id, { transcript_status: 'wartet', retry_count: 0 });
  setTimeout(triggerTranscriptionWorker, 50);

  res.json({ success: true, message: 'Verschriftung im Hintergrund gestartet.' });
});

// Sprachnotiz in die Schreibtisch-Schublade legen (DELETE /api/ideen/:id)
app.delete('/api/ideen/:id', requireUser, async (req, res) => {
  const user = (req as any).user;
  await repo.deleteIdeaNote(user.id, req.params.id);
  res.json({ success: true, message: 'In die Schreibtisch-Schublade gelegt.' });
});

// ==========================================
// 5. Vite Middleware / Production Static
// ==========================================
async function startServer() {
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`[Federführer] Server running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
