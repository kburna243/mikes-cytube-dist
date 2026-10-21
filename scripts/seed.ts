#!/usr/bin/env tsx
/**
 * Seed-Skript für Federführer
 * Füllt die Datenbank mit Beispieldaten (nur wenn DB leer ist)
 *
 * Nutzung: npm run db:seed
 */

import { getDb, schema } from '../lib/db.js';
import { eq } from 'drizzle-orm';

async function seed() {
  const db = getDb();
  if (!db) {
    console.error('❌ Datenbank nicht verfügbar. Bitte DATABASE_URL setzen.');
    process.exit(1);
  }

  console.log('🌱 Starte Seed-Skript...');

  // Prüfen ob bereits Daten vorhanden sind
  const existingProjects = await db.select().from(schema.projects).limit(1);
  if (existingProjects.length > 0) {
    console.log('⚠️  Datenbank enthält bereits Daten. Seed abgebrochen.');
    console.log('   Um neu zu seeden, bitte Datenbank leeren.');
    process.exit(0);
  }

  // Default-User für Seed erstellen (falls nicht vorhanden)
  const existingUsers = await db.select().from(schema.users).limit(1);
  let ownerId: string;

  if (existingUsers.length === 0) {
    console.log('👤 Erstelle Default-User für Seed...');
    const bcrypt = await import('bcryptjs');
    const passwordHash = await bcrypt.hash('federfuehrer', 12);
    const [user] = await db.insert(schema.users).values({
      username: 'autorin',
      displayName: 'Marion',
      passwordHash,
    }).returning();
    ownerId = user.id;
    console.log(`   ✓ User erstellt: ${user.username} (ID: ${user.id})`);
  } else {
    ownerId = existingUsers[0].id;
    console.log(`✓ Verwende bestehenden User: ${existingUsers[0].username} (ID: ${ownerId})`);
  }

  // Projekt erstellen
  console.log('📚 Erstelle Projekt...');
  const [project] = await db.insert(schema.projects).values({
    ownerId,
    title: 'Schatten über Altwald',
    subtitle: 'Historischer Kriminalroman',
    genre: 'Historischer Kriminalroman',
    synopsis: 'Ein stiller Kriminalroman im nebligen Schwarzwald des Jahres 1928. Ein reisender Ermittler deckt ein Netz aus Schweigen, alten Versprechen und einer Bäckerswitwe auf, deren Fürsorge ein dunkles Geheimnis birgt.',
    targetWords: 80000,
    status: 'in_arbeit',
    coverColor: '#8B4513',
  }).returning();
  console.log(`   ✓ Projekt: ${project.title} (ID: ${project.id})`);

  // Kapitel erstellen
  console.log('📖 Erstelle Kapitel...');
  const chapters = [
    {
      id: 'ch-01',
      title: 'Der Geruch von Mehl und Asche',
      summary: 'Lukas trifft im Morgengrauen in Altwald ein und betritt die Dorfbäckerei von Marta Reinhold.',
      content: `Der frühe Nebel lag wie feuchtes Tuch zwischen den Tannen des Schwarzwaldes. Als Lukas den ersten Pflasterstein von Altwald betrat, war das einzige Licht im Dorf der Schein aus der Backstube.

Marta Reinhold stand hinter dem schweren Eichentisch, die Ärmel hochgekrempelt. Ihre Schürze war bestäubt mit Mehl, doch der Blick, den sie hob, war messerscharf. Ihre kühlen, auffallend grauen Augen musterten den fremden Mantel und die durchnässten Stiefel des Detektivs.

»Wir öffnen erst um sechs«, sagte sie, ohne die Knetbewegung zu unterbrechen. Ihre linke Hand führte den Teig mit bemerkenswerter Kraft.

Lukas nahm den nassen Hut ab. »Ich suche nicht nach Brot, Frau Reinhold. Ich suche nach meinem Bruder Heinrich.«

Für einen winzigen Lidschlag erstarrte Martas Hand im Teig, bevor der Rhythmus wie gewohnt weiterging.`,
      position: 1,
    },
    {
      id: 'ch-03',
      title: 'Das verlassene Sägewerk',
      summary: 'Lukas findet Spuren seines Bruders am Mühlenbach. Marta beobachtet ihn aus der Ferne.',
      content: `Der Mühlenbach rauschte mit eisigem Schmelzwasser. Lukas bückte sich über die morschen Dielen des alten Sägewerks. Eine abgerissene Pfeifentasche aus Leder lag zwischen den Sägespänen – eindeutig Heinrichs Besitz.

Als er sich aufrichtete, sah er eine Gestalt am Waldsaum. Marta Reinhold trug ein dunkles Wolltuch über dem Kopf. Mit der linken Hand hielt sie einen geflochtenen Weidenkorb. Sie kam nicht näher, sondern wandte sich stumm ab, sobald Lukas den Kopf hob.

Warum wusste die Bäckerin früher als die Gendarmerie, wo die alten Waldwege endeten?`,
      position: 2,
    },
    {
      id: 'ch-12',
      title: 'Die Konfrontation im Backhaus',
      summary: 'Lukas stellt Marta zur Rede über Heinrichs Verschwinden.',
      content: `Der Holzofen knisterte im hinteren Raum der Backstube. Lukas verschloss den schweren Riegel der Eingangstür hinter sich.

»Sie waren in jener Nacht am Sägewerk, Marta«, sagte Lukas mit ruhiger, aber unnachgiebiger Stimme. »Heinrichs Taschenuhr lag nicht zufällig in Ihrer Mehltruhe.«

Marta drehte sich langsam um. Das Licht der Glut spiegelte sich in ihren warmen braunen Augen, während ein leises, bitteres Lächeln über ihre Lippen glitt.

»Ihr Bruder war ein Narr, Herr von Berg«, erwiderte sie leise. »Er dachte, Gerechtigkeit ließe sich in Akten fassen.«`,
      position: 3,
    },
  ];

  for (const ch of chapters) {
    const [chapter] = await db.insert(schema.chapters).values({
      id: ch.id,
      ownerId,
      projectId: project.id,
      title: ch.title,
      summary: ch.summary,
      position: ch.position,
      status: 'entwurf',
    }).returning();

    await db.insert(schema.chapterContents).values({
      ownerId,
      chapterId: chapter.id,
      content: ch.content,
      version: 1,
    });

    console.log(`   ✓ Kapitel: ${ch.title}`);
  }

  // Charaktere erstellen
  console.log('👥 Erstelle Charaktere...');
  const characters = [
    {
      id: 'fig-marta-01',
      name: 'Marta Reinhold',
      description: 'Die Bäckerin von Altwald. Mitte Vierzig, willensstark, mit kühlen grauen Augen und einer ruhigen, berechnenden Art.',
      role: 'hauptfigur',
      color: '#8B4513',
    },
    {
      id: 'fig-detektiv',
      name: 'Lukas von Berg',
      description: 'Ein reisender Ermittler, der nach seinem verschwundenen Bruder Heinrich sucht. Beobachter mit scharfem Verstand und chronischer Schlaflosigkeit.',
      role: 'hauptfigur',
      color: '#4A90E2',
    },
    {
      id: 'fig-mueller',
      name: 'Detektiv Müller',
      description: 'Ermittelt unabhängig und sucht nach verlässlichen Fakten und Zeugenaussagen im Fall Heinrich.',
      role: 'nebenfigur',
      color: '#7B68EE',
    },
    {
      id: 'fig-emma',
      name: 'Emma Klein',
      description: 'Möchte das Geheimnis um die Geschehnisse am Sägewerk lüften und ihrer Familie helfen.',
      role: 'nebenfigur',
      color: '#FF6B9D',
    },
  ];

  for (const c of characters) {
    await db.insert(schema.characters).values({
      id: c.id,
      ownerId,
      projectId: project.id,
      name: c.name,
      description: c.description,
      role: c.role,
      color: c.color,
    });
    console.log(`   ✓ Charakter: ${c.name}`);
  }

  // Orte erstellen
  console.log('🗺️  Erstelle Orte...');
  const locations = [
    {
      id: 'ort-backhaus',
      name: 'Bäckerei Reinhold',
      description: 'Zentraler Treffpunkt des Dorfes. Riecht stets nach Sauerteig, Buchenholzrauch und alter Asche.',
    },
    {
      id: 'ort-dorf',
      name: 'Altwald',
      description: 'Abgeschiedenes Schwarzwalddorf, umgeben von dichten Tannenwäldern und schwerem Nebel.',
    },
  ];

  for (const l of locations) {
    await db.insert(schema.locations).values({
      id: l.id,
      ownerId,
      projectId: project.id,
      name: l.name,
      description: l.description,
    });
    console.log(`   ✓ Ort: ${l.name}`);
  }

  // Fakten erstellen
  console.log('📋 Erstelle Fakten...');
  const facts = [
    {
      id: 'fact-01',
      title: 'Augenfarbe',
      content: 'Marta hat auffallend graue Augen',
      category: 'person',
      sourceChapterId: 'ch-01',
    },
    {
      id: 'fact-02',
      title: 'Händigkeit',
      content: 'Marta ist Linkshänderin (führt Teig & Werkzeuge links)',
      category: 'person',
      sourceChapterId: 'ch-01',
    },
    {
      id: 'fact-03',
      title: 'Geheimnis',
      content: 'Marta kennt den Mörder von Heinrich',
      category: 'person',
      sourceChapterId: null,
    },
    {
      id: 'fact-04',
      title: 'Motivation',
      content: 'Lukas sucht seinen verschwundenen Bruder Heinrich',
      category: 'person',
      sourceChapterId: 'ch-01',
    },
    {
      id: 'fact-05',
      title: 'Geografie',
      content: 'Altwald ist über eine einzige alte Passstraße erreichbar',
      category: 'ort',
      sourceChapterId: null,
    },
  ];

  for (const f of facts) {
    await db.insert(schema.worldFacts).values({
      id: f.id,
      ownerId,
      projectId: project.id,
      title: f.title,
      content: f.content,
      category: f.category,
      sourceChapterId: f.sourceChapterId,
    });
    console.log(`   ✓ Fakt: ${f.title}`);
  }

  // Beziehungen erstellen
  console.log('🔗 Erstelle Beziehungen...');
  const relationships = [
    {
      id: 'rel-01',
      fromCharacterId: 'fig-detektiv',
      toCharacterId: 'fig-marta-01',
      type: 'verbuendet_mit',
      description: 'befragt / misstraut',
    },
    {
      id: 'rel-02',
      fromCharacterId: 'fig-marta-01',
      toCharacterId: 'ort-backhaus',
      type: 'aufhaelt_sich_in',
      description: 'lebt & arbeitet in',
    },
    {
      id: 'rel-03',
      fromCharacterId: 'fig-detektiv',
      toCharacterId: 'fig-mueller',
      type: 'verbuendet_mit',
      description: 'ermittelt gemeinsam mit',
    },
    {
      id: 'rel-04',
      fromCharacterId: 'fig-mueller',
      toCharacterId: 'fig-emma',
      type: 'ist_geschwister_von',
      description: 'kennt seit Schulzeit (Art: Jugendbekanntschaft)',
    },
  ];

  for (const r of relationships) {
    await db.insert(schema.relationships).values({
      id: r.id,
      ownerId,
      projectId: project.id,
      fromCharacterId: r.fromCharacterId,
      toCharacterId: r.toCharacterId,
      type: r.type,
      description: r.description,
    });
    console.log(`   ✓ Beziehung: ${r.description}`);
  }

  // Plot-Threads erstellen
  console.log('🧵 Erstelle Plot-Threads...');
  const threads = [
    {
      id: 'thread-haupt',
      title: 'Das Schicksal Heinrichs',
      description: 'Lukas untersucht das Verschwinden seines Bruders in Altwald.',
      color: '#fbbf24',
      pattern: 'solid',
    },
    {
      id: 'thread-vergangenheit',
      title: 'Martas Gelübde',
      description: 'Die Hintergründe des Todes ihres Mannes im Kriegswinter.',
      color: '#60a5fa',
      pattern: 'dashed',
    },
  ];

  for (const t of threads) {
    await db.insert(schema.plotThreads).values({
      id: t.id,
      ownerId,
      projectId: project.id,
      title: t.title,
      description: t.description,
      color: t.color,
      pattern: t.pattern,
    });
    console.log(`   ✓ Thread: ${t.title}`);
  }

  // Plot-Events erstellen
  console.log('📅 Erstelle Plot-Events...');
  const events = [
    {
      id: 'beat-01',
      threadId: 'thread-haupt',
      chapterId: 'ch-01',
      title: 'Ankunft in der Backstube',
      description: 'Lukas trifft ein und konfrontiert Marta.',
      position: 1,
    },
    {
      id: 'beat-02',
      threadId: 'thread-haupt',
      chapterId: 'ch-03',
      title: 'Fund am Sägewerk',
      description: 'Heinrichs Pfeifentasche wird gefunden.',
      position: 2,
    },
    {
      id: 'beat-03',
      threadId: 'thread-haupt',
      chapterId: 'ch-12',
      title: 'Offene Konfrontation',
      description: 'Marta deutet ihr Wissen an.',
      position: 3,
    },
  ];

  for (const e of events) {
    await db.insert(schema.plotEvents).values({
      id: e.id,
      ownerId,
      projectId: project.id,
      threadId: e.threadId,
      chapterId: e.chapterId,
      title: e.title,
      description: e.description,
      position: e.position,
    });
    console.log(`   ✓ Event: ${e.title}`);
  }

  // Research-Notizen erstellen
  console.log('📝 Erstelle Research-Notizen...');
  const research = [
    {
      id: 'res-01',
      title: 'Brotbacken im Schwarzwald um 1920',
      content: 'Historische Rezepturen nutzten Sauerteig mit mind. 18 Stunden Ruhezeit im Holztrog. Mehl wurde in Säcken zu 50 kg gelagert.',
      url: null,
      tags: ['Bäckerei', 'Alltag', 'Historie'],
    },
  ];

  for (const r of research) {
    await db.insert(schema.researchNotes).values({
      id: r.id,
      ownerId,
      projectId: project.id,
      title: r.title,
      content: r.content,
      url: r.url,
      tags: r.tags,
    });
    console.log(`   ✓ Research: ${r.title}`);
  }

  console.log('\n✅ Seed erfolgreich abgeschlossen!');
  console.log('   Datenbank wurde mit Beispieldaten gefüllt.');
}

seed().catch((err) => {
  console.error('❌ Seed fehlgeschlagen:', err);
  process.exit(1);
});
