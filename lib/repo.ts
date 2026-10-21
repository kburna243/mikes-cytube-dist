import { eq, and, desc, isNull, isNotNull, sql } from 'drizzle-orm';
import { getDb, schema } from './db.js';

// Drizzle row helper types for callback parameter annotations (TS7006)
type ChapterContentIdRow = { id: string };
type WorldFactRow = { id: string; sourceChapterId: string | null; content: string; title: string; createdAt: Date | null };
type RelationshipRow = { id: string; fromCharacterId: string; toCharacterId: string; type: string; description: string | null };
type RelationResultItem = { id: string };
type ThreadResultItem = { id: string };
type PlotEventRow = { id: string; projectId: string; threadId: string | null; chapterId: string | null; position: number; title: string; description: string | null; storyTime: string | null };
type TimelineEventResultItem = { id: string };
type ResearchNoteRow = { id: string; title: string; content: string; tags: string[] | null; url: string | null; createdAt: Date | null };
type ResearchResultItem = { id: string };
type ChapterSnapshotRow = { id: string; chapterId: string; label: string; content: string; wordCount: number; createdAt: Date };
type CustomWordRow = { word: string };
type IdeaNoteRow = { id: string; ownerId: string; projectId: string; chapterId: string | null; audioPath: string; audioMime: string; durationSec: number; transcript: string | null; transcriptStatus: string; title: string | null; pinned: boolean; retryCount: number | null; createdAt: Date; updatedAt: Date; deletedAt: Date | null };
type IdeaNotePendingRow = { id: string; audioPath: string; retryCount: number | null };

/**
 * Repository Layer
 * Enforces session owner_id isolation for every database interaction.
 * Kein Fallback auf In-Memory-Storage – alles läuft über PostgreSQL.
 */
class Repository {
  // ==========================================
  // PROJECTS (Work)
  // ==========================================

  async getWork(ownerId: string) {
    const db = getDb();
    if (!db) throw new Error('Datenbank nicht verfügbar');

    const [project] = await db
      .select()
      .from(schema.projects)
      .where(eq(schema.projects.ownerId, ownerId))
      .limit(1);

    if (!project) {
      // Erstelle leeres Projekt wenn keines existiert
      const [created] = await db
        .insert(schema.projects)
        .values({
          ownerId,
          title: 'Mein Roman',
          status: 'in_arbeit',
        })
        .returning();
      return this.formatProject(created);
    }

    return this.formatProject(project);
  }

  async updateWork(ownerId: string, patch: any) {
    const db = getDb();
    if (!db) throw new Error('Datenbank nicht verfügbar');

    const updateData: any = { updatedAt: new Date() };
    if (patch.title) updateData.title = patch.title;
    if (patch.subtitle !== undefined) updateData.subtitle = patch.subtitle;
    if (patch.genre !== undefined) updateData.genre = patch.genre;
    if (patch.synopsis !== undefined) updateData.synopsis = patch.synopsis;
    if (patch.targetWords !== undefined) updateData.targetWords = patch.targetWords;
    if (patch.status) updateData.status = patch.status;
    if (patch.coverColor !== undefined) updateData.coverColor = patch.coverColor;

    await db
      .update(schema.projects)
      .set(updateData)
      .where(eq(schema.projects.ownerId, ownerId));

    return this.getWork(ownerId);
  }

  private formatProject(p: any) {
    return {
      id: p.id,
      title: p.title,
      author: '', // Wird aus Settings geladen
      synopsis: p.synopsis || '',
      genre: p.genre || '',
      created_at: p.createdAt?.getTime() || Date.now(),
      updated_at: p.updatedAt?.getTime() || Date.now(),
    };
  }

  // ==========================================
  // CHAPTERS
  // ==========================================

  async getChapters(ownerId: string) {
    const db = getDb();
    if (!db) throw new Error('Datenbank nicht verfügbar');

    const rows = await db
      .select()
      .from(schema.chapters)
      .where(and(
        eq(schema.chapters.ownerId, ownerId),
        isNull(schema.chapters.deletedAt)
      ))
      .orderBy(schema.chapters.position);

    const chapters = [];
    for (const ch of rows) {
      const [latestContent] = await db
        .select()
        .from(schema.chapterContents)
        .where(and(
          eq(schema.chapterContents.ownerId, ownerId),
          eq(schema.chapterContents.chapterId, ch.id)
        ))
        .orderBy(desc(schema.chapterContents.version))
        .limit(1);

      chapters.push({
        id: ch.id,
        work_id: ch.projectId,
        order: ch.position,
        title: ch.title,
        summary: ch.summary || '',
        body: latestContent?.content || '',
        status: ch.status === 'entwurf' ? 'draft' : ch.status === 'fertig' ? 'canonical' : 'in_review',
        revision: latestContent?.version || 1,
        updated_at: ch.updatedAt?.getTime() || Date.now(),
      });
    }

    return chapters;
  }

  async getChapter(ownerId: string, chapterId: string) {
    const db = getDb();
    if (!db) throw new Error('Datenbank nicht verfügbar');

    const [ch] = await db
      .select()
      .from(schema.chapters)
      .where(and(
        eq(schema.chapters.ownerId, ownerId),
        eq(schema.chapters.id, chapterId),
        isNull(schema.chapters.deletedAt)
      ))
      .limit(1);

    if (!ch) return null;

    const [latestContent] = await db
      .select()
      .from(schema.chapterContents)
      .where(and(
        eq(schema.chapterContents.ownerId, ownerId),
        eq(schema.chapterContents.chapterId, chapterId)
      ))
      .orderBy(desc(schema.chapterContents.version))
      .limit(1);

    return {
      id: ch.id,
      work_id: ch.projectId,
      order: ch.position,
      title: ch.title,
      summary: ch.summary || '',
      body: latestContent?.content || '',
      status: ch.status === 'entwurf' ? 'draft' : ch.status === 'fertig' ? 'canonical' : 'in_review',
      revision: latestContent?.version || 1,
      updated_at: ch.updatedAt?.getTime() || Date.now(),
    };
  }

  async saveChapter(ownerId: string, chapter: any) {
    const db = getDb();
    if (!db) throw new Error('Datenbank nicht verfügbar');

    // Projekt holen oder erstellen
    let project = await this.getWork(ownerId);

    const existing = await this.getChapter(ownerId, chapter.id);

    if (existing) {
      // Update
      const updateData: any = { updatedAt: new Date() };
      if (chapter.title) updateData.title = chapter.title;
      if (chapter.summary !== undefined) updateData.summary = chapter.summary;
      if (chapter.order !== undefined) updateData.position = chapter.order;
      if (chapter.status) {
        updateData.status = chapter.status === 'draft' ? 'entwurf' : chapter.status === 'canonical' ? 'fertig' : 'ueberarbeitung';
      }

      await db
        .update(schema.chapters)
        .set(updateData)
        .where(and(
          eq(schema.chapters.ownerId, ownerId),
          eq(schema.chapters.id, chapter.id)
        ));

      // Content speichern wenn vorhanden
      if (chapter.body !== undefined) {
        await this.saveChapterContent(ownerId, chapter.id, chapter.body, chapter.title);
      }

      return this.getChapter(ownerId, chapter.id);
    } else {
      // Create
      const position = chapter.order || 1;
      const status = chapter.status === 'draft' ? 'entwurf' : chapter.status === 'canonical' ? 'fertig' : 'ueberarbeitung';

      const [created] = await db
        .insert(schema.chapters)
        .values({
          id: chapter.id,
          ownerId,
          projectId: project.id,
          position,
          title: chapter.title || 'Neues Kapitel',
          summary: chapter.summary || '',
          status,
        })
        .returning();

      // Content speichern wenn vorhanden
      if (chapter.body !== undefined) {
        await this.saveChapterContent(ownerId, created.id, chapter.body, chapter.title);
      }

      return this.getChapter(ownerId, created.id);
    }
  }

  async saveChapterContent(ownerId: string, chapterId: string, content: string, title?: string) {
    const db = getDb();
    if (!db) throw new Error('Datenbank nicht verfügbar');

    // Höchste Version holen
    const [latest] = await db
      .select()
      .from(schema.chapterContents)
      .where(and(
        eq(schema.chapterContents.ownerId, ownerId),
        eq(schema.chapterContents.chapterId, chapterId)
      ))
      .orderBy(desc(schema.chapterContents.version))
      .limit(1);

    const nextVersion = (latest?.version || 0) + 1;

    // Neue Version speichern
    await db
      .insert(schema.chapterContents)
      .values({
        ownerId,
        chapterId,
        content,
        version: nextVersion,
      });

    // Word count updaten
    const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0;
    const updateData: any = { wordCount, updatedAt: new Date() };
    if (title) updateData.title = title;

    await db
      .update(schema.chapters)
      .set(updateData)
      .where(and(
        eq(schema.chapters.ownerId, ownerId),
        eq(schema.chapters.id, chapterId)
      ));

    // Nur letzte 50 Versionen behalten
    const allVersions = await db
      .select({ id: schema.chapterContents.id })
      .from(schema.chapterContents)
      .where(and(
        eq(schema.chapterContents.ownerId, ownerId),
        eq(schema.chapterContents.chapterId, chapterId)
      ))
      .orderBy(desc(schema.chapterContents.version));

    if (allVersions.length > 50) {
      const oldIds = allVersions.slice(50).map((v: ChapterContentIdRow) => v.id);
      for (const oldId of oldIds) {
        await db
          .delete(schema.chapterContents)
          .where(eq(schema.chapterContents.id, oldId));
      }
    }

    return { version: nextVersion, wordCount };
  }

  async deleteChapter(ownerId: string, chapterId: string) {
    const db = getDb();
    if (!db) throw new Error('Datenbank nicht verfügbar');

    await db
      .update(schema.chapters)
      .set({ deletedAt: new Date() })
      .where(and(
        eq(schema.chapters.ownerId, ownerId),
        eq(schema.chapters.id, chapterId)
      ));

    return true;
  }

  // ==========================================
  // ENTITIES (Characters, Locations)
  // ==========================================

  async getEntities(ownerId: string, type?: string) {
    const db = getDb();
    if (!db) throw new Error('Datenbank nicht verfügbar');

    const entities: any[] = [];

    // Characters
    if (!type || type === 'character') {
      const chars = await db
        .select()
        .from(schema.characters)
        .where(and(
          eq(schema.characters.ownerId, ownerId),
          isNull(schema.characters.deletedAt)
        ));

      for (const c of chars) {
        entities.push({
          id: c.id,
          type: 'character',
          name: c.name,
          aliases: [],
          threads: [],
          path: `figuren/${c.name.toLowerCase().replace(/\s+/g, '-')}.md`,
          markdown_body: `---\nid: ${c.id}\ntype: character\nname: ${c.name}\n---\n## Beschreibung\n${c.description || ''}\n\n## Erscheinung\n${c.appearance || ''}\n\n## Motivation\n${c.motivation || ''}\n\n## Notizen\n${c.notes || ''}`,
          updated_at: c.updatedAt?.getTime() || Date.now(),
          revision: 1,
        });
      }
    }

    // Locations
    if (!type || type === 'location') {
      const locs = await db
        .select()
        .from(schema.locations)
        .where(and(
          eq(schema.locations.ownerId, ownerId),
          isNull(schema.locations.deletedAt)
        ));

      for (const l of locs) {
        entities.push({
          id: l.id,
          type: 'location',
          name: l.name,
          aliases: [],
          threads: [],
          path: `orte/${l.name.toLowerCase().replace(/\s+/g, '-')}.md`,
          markdown_body: `---\nid: ${l.id}\ntype: location\nname: ${l.name}\n---\n## Beschreibung\n${l.description || ''}\n\n## Notizen\n${l.notes || ''}`,
          updated_at: l.updatedAt?.getTime() || Date.now(),
          revision: 1,
        });
      }
    }

    return entities;
  }

  async getEntity(ownerId: string, entityId: string) {
    const db = getDb();
    if (!db) throw new Error('Datenbank nicht verfügbar');

    // Character prüfen
    const [char] = await db
      .select()
      .from(schema.characters)
      .where(and(
        eq(schema.characters.ownerId, ownerId),
        eq(schema.characters.id, entityId),
        isNull(schema.characters.deletedAt)
      ))
      .limit(1);

    if (char) {
      return {
        id: char.id,
        type: 'character' as const,
        name: char.name,
        aliases: [],
        threads: [],
        path: `figuren/${char.name.toLowerCase().replace(/\s+/g, '-')}.md`,
        markdown_body: `---\nid: ${char.id}\ntype: character\nname: ${char.name}\n---\n## Beschreibung\n${char.description || ''}\n\n## Erscheinung\n${char.appearance || ''}\n\n## Motivation\n${char.motivation || ''}\n\n## Notizen\n${char.notes || ''}`,
        updated_at: char.updatedAt?.getTime() || Date.now(),
        revision: 1,
      };
    }

    // Location prüfen
    const [loc] = await db
      .select()
      .from(schema.locations)
      .where(and(
        eq(schema.locations.ownerId, ownerId),
        eq(schema.locations.id, entityId),
        isNull(schema.locations.deletedAt)
      ))
      .limit(1);

    if (loc) {
      return {
        id: loc.id,
        type: 'location' as const,
        name: loc.name,
        aliases: [],
        threads: [],
        path: `orte/${loc.name.toLowerCase().replace(/\s+/g, '-')}.md`,
        markdown_body: `---\nid: ${loc.id}\ntype: location\nname: ${loc.name}\n---\n## Beschreibung\n${loc.description || ''}\n\n## Notizen\n${loc.notes || ''}`,
        updated_at: loc.updatedAt?.getTime() || Date.now(),
        revision: 1,
      };
    }

    return null;
  }

  async saveEntity(ownerId: string, entity: any) {
    const db = getDb();
    if (!db) throw new Error('Datenbank nicht verfügbar');

    // Projekt holen
    const project = await this.getWork(ownerId);

    if (entity.type === 'location') {
      const [existing] = await db
        .select()
        .from(schema.locations)
        .where(and(
          eq(schema.locations.ownerId, ownerId),
          eq(schema.locations.id, entity.id)
        ))
        .limit(1);

      if (existing) {
        await db
          .update(schema.locations)
          .set({
            name: entity.name || existing.name,
            description: entity.markdown_body || existing.description,
            updatedAt: new Date(),
          })
          .where(eq(schema.locations.id, entity.id));
      } else {
        await db
          .insert(schema.locations)
          .values({
            id: entity.id,
            ownerId,
            projectId: project.id,
            name: entity.name || 'Neuer Ort',
            description: entity.markdown_body || '',
          });
      }
    } else {
      // Character (default)
      const [existing] = await db
        .select()
        .from(schema.characters)
        .where(and(
          eq(schema.characters.ownerId, ownerId),
          eq(schema.characters.id, entity.id)
        ))
        .limit(1);

      if (existing) {
        await db
          .update(schema.characters)
          .set({
            name: entity.name || existing.name,
            description: entity.markdown_body || existing.description,
            updatedAt: new Date(),
          })
          .where(eq(schema.characters.id, entity.id));
      } else {
        await db
          .insert(schema.characters)
          .values({
            id: entity.id,
            ownerId,
            projectId: project.id,
            name: entity.name || 'Neue Figur',
            description: entity.markdown_body || '',
          });
      }
    }

    return this.getEntity(ownerId, entity.id);
  }

  async deleteEntity(ownerId: string, entityId: string) {
    const db = getDb();
    if (!db) throw new Error('Datenbank nicht verfügbar');

    // Character soft-delete
    await db
      .update(schema.characters)
      .set({ deletedAt: new Date() })
      .where(and(
        eq(schema.characters.ownerId, ownerId),
        eq(schema.characters.id, entityId)
      ));

    // Location soft-delete
    await db
      .update(schema.locations)
      .set({ deletedAt: new Date() })
      .where(and(
        eq(schema.locations.ownerId, ownerId),
        eq(schema.locations.id, entityId)
      ));

    return true;
  }

  // ==========================================
  // FACTS
  // ==========================================

  async getFacts(ownerId: string, entityId?: string) {
    const db = getDb();
    if (!db) throw new Error('Datenbank nicht verfügbar');

    const condition = entityId
      ? and(
          eq(schema.worldFacts.ownerId, ownerId),
          eq(schema.worldFacts.sourceChapterId, entityId),
          isNull(schema.worldFacts.deletedAt)
        )
      : and(
          eq(schema.worldFacts.ownerId, ownerId),
          isNull(schema.worldFacts.deletedAt)
        );

    const rows = await db
      .select()
      .from(schema.worldFacts)
      .where(condition);

    return rows.map((f: WorldFactRow) => ({
      id: f.id,
      entity_id: f.sourceChapterId || '',
      statement: f.content,
      source: f.title,
      certainty: 'canonical' as const,
      created_at: f.createdAt?.getTime() || Date.now(),
    }));
  }

  async addFact(ownerId: string, fact: any) {
    const db = getDb();
    if (!db) throw new Error('Datenbank nicht verfügbar');

    const project = await this.getWork(ownerId);

    const [created] = await db
      .insert(schema.worldFacts)
      .values({
        id: fact.id || undefined,
        ownerId,
        projectId: project.id,
        category: 'sonstiges',
        title: fact.source || 'Fakt',
        content: fact.statement || '',
        sourceChapterId: fact.entity_id || null,
      })
      .returning();

    return {
      id: created.id,
      entity_id: created.sourceChapterId || '',
      statement: created.content,
      source: created.title,
      certainty: 'canonical' as const,
      created_at: created.createdAt?.getTime() || Date.now(),
    };
  }

  async deleteFact(ownerId: string, factId: string) {
    const db = getDb();
    if (!db) throw new Error('Datenbank nicht verfügbar');

    await db
      .update(schema.worldFacts)
      .set({ deletedAt: new Date() })
      .where(and(
        eq(schema.worldFacts.ownerId, ownerId),
        eq(schema.worldFacts.id, factId)
      ));

    return true;
  }

  // ==========================================
  // RELATIONS
  // ==========================================

  async getRelations(ownerId: string) {
    const db = getDb();
    if (!db) throw new Error('Datenbank nicht verfügbar');

    const rows = await db
      .select()
      .from(schema.relationships)
      .where(eq(schema.relationships.ownerId, ownerId));

    return rows.map((r: RelationshipRow) => ({
      id: r.id,
      source_id: r.fromCharacterId,
      target_id: r.toCharacterId,
      type: r.type as any,
      label: r.description || r.type,
      notes: r.description,
    }));
  }

  async saveRelation(ownerId: string, rel: any) {
    const db = getDb();
    if (!db) throw new Error('Datenbank nicht verfügbar');

    const project = await this.getWork(ownerId);

    const [existing] = await db
      .select()
      .from(schema.relationships)
      .where(and(
        eq(schema.relationships.ownerId, ownerId),
        eq(schema.relationships.id, rel.id)
      ))
      .limit(1);

    if (existing) {
      await db
        .update(schema.relationships)
        .set({
          type: rel.type || existing.type,
          description: rel.label || rel.notes || existing.description,
          updatedAt: new Date(),
        })
        .where(eq(schema.relationships.id, rel.id));

      return this.getRelations(ownerId).then(rels => rels.find((r: RelationResultItem) => r.id === rel.id));
    } else {
      const [created] = await db
        .insert(schema.relationships)
        .values({
          id: rel.id,
          ownerId,
          projectId: project.id,
          fromCharacterId: rel.source_id,
          toCharacterId: rel.target_id,
          type: rel.type || 'verbuendet_mit',
          description: rel.label || rel.notes || '',
        })
        .returning();

      return {
        id: created.id,
        source_id: created.fromCharacterId,
        target_id: created.toCharacterId,
        type: created.type as any,
        label: created.description || created.type,
        notes: created.description,
      };
    }
  }

  async deleteRelation(ownerId: string, relId: string) {
    const db = getDb();
    if (!db) throw new Error('Datenbank nicht verfügbar');

    await db
      .delete(schema.relationships)
      .where(and(
        eq(schema.relationships.ownerId, ownerId),
        eq(schema.relationships.id, relId)
      ));

    return true;
  }

  // ==========================================
  // PLOT THREADS
  // ==========================================

  async getThreads(ownerId: string) {
    const db = getDb();
    if (!db) throw new Error('Datenbank nicht verfügbar');

    const threads = await db
      .select()
      .from(schema.plotThreads)
      .where(eq(schema.plotThreads.ownerId, ownerId));

    const result = [];
    for (const t of threads) {
      const events = await db
        .select()
        .from(schema.plotEvents)
        .where(eq(schema.plotEvents.threadId, t.id))
        .orderBy(schema.plotEvents.position);

      result.push({
        id: t.id,
        work_id: t.projectId,
        title: t.title,
        description: t.description || '',
        color: t.color || '#3b82f6',
        pattern: t.pattern || 'solid',
        beats: events.map((e: PlotEventRow) => ({
          id: e.id,
          thread_id: e.threadId || '',
          chapter_id: e.chapterId || undefined,
          order: e.position,
          title: e.title,
          description: e.description || '',
          status: 'planned' as const,
        })),
      });
    }

    return result;
  }

  async saveThread(ownerId: string, thread: any) {
    const db = getDb();
    if (!db) throw new Error('Datenbank nicht verfügbar');

    const project = await this.getWork(ownerId);

    const [existing] = await db
      .select()
      .from(schema.plotThreads)
      .where(and(
        eq(schema.plotThreads.ownerId, ownerId),
        eq(schema.plotThreads.id, thread.id)
      ))
      .limit(1);

    if (existing) {
      await db
        .update(schema.plotThreads)
        .set({
          title: thread.title || existing.title,
          description: thread.description || existing.description,
          color: thread.color || existing.color,
          pattern: thread.pattern || existing.pattern,
          updatedAt: new Date(),
        })
        .where(eq(schema.plotThreads.id, thread.id));
    } else {
      await db
        .insert(schema.plotThreads)
        .values({
          id: thread.id,
          ownerId,
          projectId: project.id,
          title: thread.title || 'Neuer Plot-Strang',
          description: thread.description || '',
          color: thread.color || '#3b82f6',
          pattern: thread.pattern || 'solid',
        });
    }

    return this.getThreads(ownerId).then(threads => threads.find((t: ThreadResultItem) => t.id === thread.id));
  }

  // ==========================================
  // TIMELINE
  // ==========================================

  async getTimeline(ownerId: string) {
    const db = getDb();
    if (!db) throw new Error('Datenbank nicht verfügbar');

    const events = await db
      .select()
      .from(schema.plotEvents)
      .where(eq(schema.plotEvents.ownerId, ownerId))
      .orderBy(schema.plotEvents.position);

    return events.map((e: PlotEventRow) => ({
      id: e.id,
      work_id: e.projectId,
      title: e.title,
      in_universe_date: e.storyTime || '',
      chapter_id: e.chapterId || undefined,
      entity_ids: [],
      thread_ids: e.threadId ? [e.threadId] : [],
      description: e.description || '',
      order: e.position,
    }));
  }

  async saveTimelineEvent(ownerId: string, event: any) {
    const db = getDb();
    if (!db) throw new Error('Datenbank nicht verfügbar');

    const project = await this.getWork(ownerId);

    const [existing] = await db
      .select()
      .from(schema.plotEvents)
      .where(and(
        eq(schema.plotEvents.ownerId, ownerId),
        eq(schema.plotEvents.id, event.id)
      ))
      .limit(1);

    if (existing) {
      await db
        .update(schema.plotEvents)
        .set({
          title: event.title || existing.title,
          description: event.description || existing.description,
          storyTime: event.in_universe_date || existing.storyTime,
          position: event.order || existing.position,
          updatedAt: new Date(),
        })
        .where(eq(schema.plotEvents.id, event.id));
    } else {
      await db
        .insert(schema.plotEvents)
        .values({
          id: event.id,
          ownerId,
          projectId: project.id,
          title: event.title || 'Neues Ereignis',
          description: event.description || '',
          storyTime: event.in_universe_date || '',
          position: event.order || 1,
        });
    }

    return this.getTimeline(ownerId).then(events => events.find((e: TimelineEventResultItem) => e.id === event.id));
  }

  // ==========================================
  // RESEARCH
  // ==========================================

  async getResearch(ownerId: string) {
    const db = getDb();
    if (!db) throw new Error('Datenbank nicht verfügbar');

    const rows = await db
      .select()
      .from(schema.researchNotes)
      .where(and(
        eq(schema.researchNotes.ownerId, ownerId),
        isNull(schema.researchNotes.deletedAt)
      ));

    return rows.map((r: ResearchNoteRow) => ({
      id: r.id,
      title: r.title,
      type: 'note' as const,
      content: r.content,
      tags: r.tags || [],
      citation: r.url || '',
      created_at: r.createdAt?.getTime() || Date.now(),
    }));
  }

  async saveResearch(ownerId: string, item: any) {
    const db = getDb();
    if (!db) throw new Error('Datenbank nicht verfügbar');

    const project = await this.getWork(ownerId);

    const [existing] = await db
      .select()
      .from(schema.researchNotes)
      .where(and(
        eq(schema.researchNotes.ownerId, ownerId),
        eq(schema.researchNotes.id, item.id)
      ))
      .limit(1);

    if (existing) {
      await db
        .update(schema.researchNotes)
        .set({
          title: item.title || existing.title,
          content: item.content || existing.content,
          url: item.citation || existing.url,
          tags: item.tags || existing.tags,
          updatedAt: new Date(),
        })
        .where(eq(schema.researchNotes.id, item.id));
    } else {
      await db
        .insert(schema.researchNotes)
        .values({
          id: item.id,
          ownerId,
          projectId: project.id,
          title: item.title || 'Neue Notiz',
          content: item.content || '',
          url: item.citation || null,
          tags: item.tags || [],
        });
    }

    return this.getResearch(ownerId).then(items => items.find((i: ResearchResultItem) => i.id === item.id));
  }

  // ==========================================
  // PROPOSALS (vereinfacht - nur in DB wenn nötig)
  // ==========================================

  async getProposals(ownerId: string) {
    // Proposals werden vorerst als leere Liste zurückgegeben
    // Können später bei Bedarf in DB gespeichert werden
    return [];
  }

  async acceptProposal(ownerId: string, proposalId: string) {
    return { success: false, proposal: null, message: 'Proposals werden derzeit nicht persistiert.' };
  }

  async rejectProposal(ownerId: string, proposalId: string) {
    return false;
  }

  // ==========================================
  // DRAWER (Soft-Delete)
  // ==========================================

  async getDrawerItems(ownerId: string) {
    const db = getDb();
    if (!db) throw new Error('Datenbank nicht verfügbar');

    const items: any[] = [];

    // Deleted chapters
    const deletedChapters = await db
      .select()
      .from(schema.chapters)
      .where(and(
        eq(schema.chapters.ownerId, ownerId),
        isNotNull(schema.chapters.deletedAt)
      ));

    for (const c of deletedChapters) {
      items.push({
        id: c.id,
        type: 'chapter',
        title: c.title,
        preview: c.summary || 'Kapitel',
        deletedAt: c.deletedAt?.getTime() || Date.now(),
      });
    }

    // Deleted characters
    const deletedChars = await db
      .select()
      .from(schema.characters)
      .where(and(
        eq(schema.characters.ownerId, ownerId),
        isNotNull(schema.characters.deletedAt)
      ));

    for (const c of deletedChars) {
      items.push({
        id: c.id,
        type: 'character',
        title: c.name,
        preview: c.description || '',
        deletedAt: c.deletedAt?.getTime() || Date.now(),
      });
    }

    // Deleted locations
    const deletedLocs = await db
      .select()
      .from(schema.locations)
      .where(and(
        eq(schema.locations.ownerId, ownerId),
        isNotNull(schema.locations.deletedAt)
      ));

    for (const l of deletedLocs) {
      items.push({
        id: l.id,
        type: 'location',
        title: l.name,
        preview: l.description || '',
        deletedAt: l.deletedAt?.getTime() || Date.now(),
      });
    }

    // Deleted facts
    const deletedFacts = await db
      .select()
      .from(schema.worldFacts)
      .where(and(
        eq(schema.worldFacts.ownerId, ownerId),
        isNotNull(schema.worldFacts.deletedAt)
      ));

    for (const f of deletedFacts) {
      items.push({
        id: f.id,
        type: 'fact',
        title: f.title,
        preview: f.content,
        deletedAt: f.deletedAt?.getTime() || Date.now(),
      });
    }

    // Deleted research
    const deletedNotes = await db
      .select()
      .from(schema.researchNotes)
      .where(and(
        eq(schema.researchNotes.ownerId, ownerId),
        isNotNull(schema.researchNotes.deletedAt)
      ));

    for (const n of deletedNotes) {
      items.push({
        id: n.id,
        type: 'research',
        title: n.title,
        preview: n.content.slice(0, 100),
        deletedAt: n.deletedAt?.getTime() || Date.now(),
      });
    }

    return items.sort((a, b) => b.deletedAt - a.deletedAt);
  }

  async restoreDrawerItem(ownerId: string, id: string) {
    const db = getDb();
    if (!db) throw new Error('Datenbank nicht verfügbar');

    // Try to restore from each table
    await db.update(schema.chapters).set({ deletedAt: null }).where(and(eq(schema.chapters.ownerId, ownerId), eq(schema.chapters.id, id)));
    await db.update(schema.characters).set({ deletedAt: null }).where(and(eq(schema.characters.ownerId, ownerId), eq(schema.characters.id, id)));
    await db.update(schema.locations).set({ deletedAt: null }).where(and(eq(schema.locations.ownerId, ownerId), eq(schema.locations.id, id)));
    await db.update(schema.worldFacts).set({ deletedAt: null }).where(and(eq(schema.worldFacts.ownerId, ownerId), eq(schema.worldFacts.id, id)));
    await db.update(schema.researchNotes).set({ deletedAt: null }).where(and(eq(schema.researchNotes.ownerId, ownerId), eq(schema.researchNotes.id, id)));

    return true;
  }

  async permanentlyDeleteDrawerItem(ownerId: string, id: string) {
    const db = getDb();
    if (!db) throw new Error('Datenbank nicht verfügbar');

    await db.delete(schema.chapters).where(and(eq(schema.chapters.ownerId, ownerId), eq(schema.chapters.id, id)));
    await db.delete(schema.characters).where(and(eq(schema.characters.ownerId, ownerId), eq(schema.characters.id, id)));
    await db.delete(schema.locations).where(and(eq(schema.locations.ownerId, ownerId), eq(schema.locations.id, id)));
    await db.delete(schema.worldFacts).where(and(eq(schema.worldFacts.ownerId, ownerId), eq(schema.worldFacts.id, id)));
    await db.delete(schema.researchNotes).where(and(eq(schema.researchNotes.ownerId, ownerId), eq(schema.researchNotes.id, id)));

    return true;
  }

  // ==========================================
  // SNAPSHOTS (Zeitmaschine)
  // ==========================================

  async createSnapshot(ownerId: string, chapterId: string, label: string, content: string) {
    const db = getDb();
    if (!db) throw new Error('Datenbank nicht verfügbar');

    const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0;

    const [snap] = await db
      .insert(schema.chapterSnapshots)
      .values({
        ownerId,
        chapterId,
        label,
        content,
        wordCount,
      })
      .returning();

    return {
      id: snap.id,
      chapterId: snap.chapterId,
      label: snap.label,
      content: snap.content,
      wordCount: snap.wordCount,
      createdAt: snap.createdAt.getTime(),
    };
  }

  async getSnapshots(ownerId: string, chapterId: string) {
    const db = getDb();
    if (!db) throw new Error('Datenbank nicht verfügbar');

    const snaps = await db
      .select()
      .from(schema.chapterSnapshots)
      .where(and(
        eq(schema.chapterSnapshots.ownerId, ownerId),
        eq(schema.chapterSnapshots.chapterId, chapterId)
      ))
      .orderBy(desc(schema.chapterSnapshots.createdAt));

    return snaps.map((s: ChapterSnapshotRow) => ({
      id: s.id,
      chapterId: s.chapterId,
      label: s.label,
      content: s.content,
      wordCount: s.wordCount,
      createdAt: s.createdAt.getTime(),
    }));
  }

  async restoreSnapshot(ownerId: string, chapterId: string, snapshotId: string) {
    const db = getDb();
    if (!db) throw new Error('Datenbank nicht verfügbar');

    const [snap] = await db
      .select()
      .from(schema.chapterSnapshots)
      .where(and(
        eq(schema.chapterSnapshots.ownerId, ownerId),
        eq(schema.chapterSnapshots.id, snapshotId)
      ))
      .limit(1);

    if (!snap) return null;

    // Vor dem Zurückholen aktuellen Stand sichern
    const current = await this.getChapter(ownerId, chapterId);
    if (current) {
      await this.createSnapshot(
        ownerId,
        chapterId,
        `Vor Zurückholen (${new Date().toLocaleTimeString('de-DE')})`,
        current.body
      );
    }

    // Snapshot als neue Version speichern
    await this.saveChapterContent(ownerId, chapterId, snap.content);

    return snap.content;
  }

  // ==========================================
  // SETTINGS
  // ==========================================

  async getSettings(ownerId: string) {
    const db = getDb();
    if (!db) throw new Error('Datenbank nicht verfügbar');

    const [s] = await db
      .select()
      .from(schema.settings)
      .where(eq(schema.settings.ownerId, ownerId))
      .limit(1);

    if (!s) {
      // Erstelle leere Settings
      const [created] = await db
        .insert(schema.settings)
        .values({ ownerId })
        .returning();
      return this.formatSettings(created);
    }

    return this.formatSettings(s);
  }

  async updateSettings(ownerId: string, patch: any) {
    const db = getDb();
    if (!db) throw new Error('Datenbank nicht verfügbar');

    // Prüfe ob Settings existieren
    const [existing] = await db
      .select()
      .from(schema.settings)
      .where(eq(schema.settings.ownerId, ownerId))
      .limit(1);

    if (!existing) {
      // Erstelle neue Settings mit den Patch-Werten
      const insertData: any = { ownerId };
      if (patch.theme !== undefined) insertData.theme = patch.theme;
      if (patch.fontSize !== undefined) insertData.fontSize = patch.fontSize;
      if (patch.lineHeight !== undefined) insertData.lineHeight = patch.lineHeight;
      if (patch.ttsRate !== undefined) insertData.ttsRate = patch.ttsRate;
      if (patch.ttsVoice !== undefined) insertData.ttsVoice = patch.ttsVoice;
      if (patch.displayName !== undefined) insertData.displayName = patch.displayName;
      if (patch.dailyWordGoal !== undefined) insertData.dailyWordGoal = patch.dailyWordGoal;
      if (patch.dictationPrivacyAccepted !== undefined) insertData.dictationPrivacyAccepted = patch.dictationPrivacyAccepted;
      if (patch.lastPosition !== undefined) insertData.lastPosition = JSON.stringify(patch.lastPosition);
      if (patch.expertMode !== undefined) insertData.expertMode = patch.expertMode;
      if (patch.tourCompleted !== undefined) insertData.tourCompleted = patch.tourCompleted;

      const [created] = await db
        .insert(schema.settings)
        .values(insertData)
        .returning();
      return this.formatSettings(created);
    }

    // Update bestehende Settings
    const updateData: any = { updatedAt: new Date() };
    if (patch.theme !== undefined) updateData.theme = patch.theme;
    if (patch.fontSize !== undefined) updateData.fontSize = patch.fontSize;
    if (patch.lineHeight !== undefined) updateData.lineHeight = patch.lineHeight;
    if (patch.ttsRate !== undefined) updateData.ttsRate = patch.ttsRate;
    if (patch.ttsVoice !== undefined) updateData.ttsVoice = patch.ttsVoice;
    if (patch.displayName !== undefined) updateData.displayName = patch.displayName;
    if (patch.dailyWordGoal !== undefined) updateData.dailyWordGoal = patch.dailyWordGoal;
    if (patch.dictationPrivacyAccepted !== undefined) updateData.dictationPrivacyAccepted = patch.dictationPrivacyAccepted;
    if (patch.lastPosition !== undefined) updateData.lastPosition = JSON.stringify(patch.lastPosition);
    if (patch.expertMode !== undefined) updateData.expertMode = patch.expertMode;
    if (patch.tourCompleted !== undefined) updateData.tourCompleted = patch.tourCompleted;

    await db
      .update(schema.settings)
      .set(updateData)
      .where(eq(schema.settings.ownerId, ownerId));

    return this.getSettings(ownerId);
  }

  private formatSettings(s: any) {
    return {
      ownerId: s.ownerId,
      theme: s.theme || 'dark-high',
      fontSize: s.fontSize || 22,
      lineHeight: s.lineHeight || 1.7,
      ttsRate: s.ttsRate || 1.0,
      ttsVoice: s.ttsVoice || 'de-DE',
      tourCompleted: s.tourCompleted || false,
      displayName: s.displayName || 'Autor',
      dailyWordGoal: s.dailyWordGoal || 200,
      dictationPrivacyAccepted: s.dictationPrivacyAccepted || false,
      lastPosition: s.lastPosition ? JSON.parse(s.lastPosition) : null,
      expertMode: s.expertMode || false,
    };
  }

  // ==========================================
  // CUSTOM WORDS
  // ==========================================

  async getCustomWords(projectId: string = 'work-01') {
    const db = getDb();
    if (!db) return [];

    const rows = await db
      .select()
      .from(schema.customWords)
      .where(eq(schema.customWords.projectId, projectId));

    return rows.map((r: CustomWordRow) => r.word);
  }

  async addCustomWord(projectId: string = 'work-01', word: string) {
    const db = getDb();
    if (!db) return [];

    const clean = word.trim();
    if (!clean) return this.getCustomWords(projectId);

    await db
      .insert(schema.customWords)
      .values({ projectId, word: clean })
      .onConflictDoNothing();

    return this.getCustomWords(projectId);
  }

  async removeCustomWord(projectId: string = 'work-01', word: string) {
    const db = getDb();
    if (!db) return [];

    await db
      .delete(schema.customWords)
      .where(and(
        eq(schema.customWords.projectId, projectId),
        eq(schema.customWords.word, word.trim())
      ));

    return this.getCustomWords(projectId);
  }

  // ==========================================
  // IDEA NOTES (Sprachnotizen)
  // ==========================================

  async getIdeaNotes(ownerId: string) {
    const db = getDb();
    if (!db) throw new Error('Datenbank nicht verfügbar');

    const rows = await db
      .select()
      .from(schema.ideaNotes)
      .where(and(
        eq(schema.ideaNotes.ownerId, ownerId),
        isNull(schema.ideaNotes.deletedAt)
      ))
      .orderBy(desc(schema.ideaNotes.pinned), desc(schema.ideaNotes.createdAt));

    return rows.map((r: IdeaNoteRow) => ({
      id: r.id,
      owner_id: r.ownerId,
      project_id: r.projectId,
      chapter_id: r.chapterId,
      audio_path: r.audioPath,
      audio_mime: r.audioMime,
      duration_sec: r.durationSec,
      transcript: r.transcript,
      transcript_status: r.transcriptStatus,
      title: r.title,
      pinned: r.pinned,
      retry_count: r.retryCount,
      created_at: r.createdAt.getTime(),
      updated_at: r.updatedAt.getTime(),
      deleted_at: null,
    }));
  }

  async getIdeaNoteById(ownerId: string, id: string) {
    const db = getDb();
    if (!db) throw new Error('Datenbank nicht verfügbar');

    const [r] = await db
      .select()
      .from(schema.ideaNotes)
      .where(and(
        eq(schema.ideaNotes.ownerId, ownerId),
        eq(schema.ideaNotes.id, id)
      ))
      .limit(1);

    if (!r) return null;

    return {
      id: r.id,
      owner_id: r.ownerId,
      project_id: r.projectId,
      chapter_id: r.chapterId,
      audio_path: r.audioPath,
      audio_mime: r.audioMime,
      duration_sec: r.durationSec,
      transcript: r.transcript,
      transcript_status: r.transcriptStatus,
      title: r.title,
      pinned: r.pinned,
      retry_count: r.retryCount,
      created_at: r.createdAt.getTime(),
      updated_at: r.updatedAt.getTime(),
      deleted_at: r.deletedAt?.getTime() || null,
    };
  }

  async createIdeaNote(note: any) {
    const db = getDb();
    if (!db) throw new Error('Datenbank nicht verfügbar');

    const [created] = await db
      .insert(schema.ideaNotes)
      .values({
        ownerId: note.ownerId,
        projectId: note.projectId || 'work-01',
        chapterId: note.chapterId || null,
        audioPath: note.audioPath,
        audioMime: note.audioMime || 'audio/webm;codecs=opus',
        durationSec: note.durationSec || 0,
        transcriptStatus: note.transcriptStatus || 'wartet',
        title: note.title || null,
        pinned: note.pinned || false,
      })
      .returning();

    return {
      id: created.id,
      owner_id: created.ownerId,
      project_id: created.projectId,
      chapter_id: created.chapterId,
      audio_path: created.audioPath,
      audio_mime: created.audioMime,
      duration_sec: created.durationSec,
      transcript: created.transcript,
      transcript_status: created.transcriptStatus,
      title: created.title,
      pinned: created.pinned,
      retry_count: created.retryCount,
      created_at: created.createdAt.getTime(),
      updated_at: created.updatedAt.getTime(),
      deleted_at: null,
    };
  }

  async updateIdeaNote(id: string, patch: any) {
    const db = getDb();
    if (!db) throw new Error('Datenbank nicht verfügbar');

    const updateData: any = { updatedAt: new Date() };
    if (patch.transcript !== undefined) updateData.transcript = patch.transcript;
    if (patch.transcript_status !== undefined) updateData.transcriptStatus = patch.transcript_status;
    if (patch.title !== undefined) updateData.title = patch.title;
    if (patch.pinned !== undefined) updateData.pinned = patch.pinned;

    await db
      .update(schema.ideaNotes)
      .set(updateData)
      .where(eq(schema.ideaNotes.id, id));

    const [updated] = await db
      .select()
      .from(schema.ideaNotes)
      .where(eq(schema.ideaNotes.id, id))
      .limit(1);

    if (!updated) return null;

    return {
      id: updated.id,
      owner_id: updated.ownerId,
      project_id: updated.projectId,
      chapter_id: updated.chapterId,
      audio_path: updated.audioPath,
      audio_mime: updated.audioMime,
      duration_sec: updated.durationSec,
      transcript: updated.transcript,
      transcript_status: updated.transcriptStatus,
      title: updated.title,
      pinned: updated.pinned,
      retry_count: updated.retryCount,
      created_at: updated.createdAt.getTime(),
      updated_at: updated.updatedAt.getTime(),
      deleted_at: updated.deletedAt?.getTime() || null,
    };
  }

  async deleteIdeaNote(ownerId: string, id: string) {
    const db = getDb();
    if (!db) throw new Error('Datenbank nicht verfügbar');

    await db
      .update(schema.ideaNotes)
      .set({ deletedAt: new Date() })
      .where(and(
        eq(schema.ideaNotes.ownerId, ownerId),
        eq(schema.ideaNotes.id, id)
      ));

    return true;
  }

  async getPendingIdeaNotes(limit: number = 3) {
    const db = getDb();
    if (!db) return [];

    const rows = await db
      .select()
      .from(schema.ideaNotes)
      .where(and(
        eq(schema.ideaNotes.transcriptStatus, 'wartet'),
        isNull(schema.ideaNotes.deletedAt),
        sql`${schema.ideaNotes.retryCount} < 3`
      ))
      .limit(limit);

    return rows.map((r: IdeaNotePendingRow) => ({
      id: r.id,
      audioPath: r.audioPath,
      retryCount: r.retryCount,
    }));
  }

  // ==========================================
  // EXPORT
  // ==========================================

  async exportProject(ownerId: string, projectId: string, format: 'json' | 'markdown') {
    const project = await this.getWork(ownerId);
    const chapters = await this.getChapters(ownerId);
    const characters = await this.getEntities(ownerId, 'character');
    const facts = await this.getFacts(ownerId);
    const research = await this.getResearch(ownerId);

    if (format === 'json') {
      return {
        exportVersion: '1.0',
        exportedAt: new Date().toISOString(),
        project,
        chapters,
        characters,
        worldFacts: facts,
        researchNotes: research,
      };
    }

    // Markdown
    let md = `# ${project.title || 'Roman'}\n`;
    if (project.synopsis) md += `**Synopsis:** ${project.synopsis}\n\n---\n\n`;

    for (const ch of chapters) {
      md += `## ${ch.title}\n\n${ch.body || ''}\n\n---\n\n`;
    }

    md += `# ANHANG: FIGUREN & FAKTEN\n\n`;
    for (const c of characters) {
      md += `### ${c.name}\n${c.markdown_body || ''}\n\n`;
    }

    md += `### Kanonische Fakten:\n`;
    for (const f of facts) {
      md += `- [${f.source}] ${f.statement}\n`;
    }

    return md;
  }
}

export const repo = new Repository();
