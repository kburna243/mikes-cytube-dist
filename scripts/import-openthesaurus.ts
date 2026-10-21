import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { getDb, schema } from '../lib/db.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface Synset {
  group: string;
  words: string[];
}

export async function importOpenThesaurus() {
  const jsonPath = path.resolve(__dirname, '../data/openthesaurus_de.json');
  if (!fs.existsSync(jsonPath)) {
    console.error('[OpenThesaurus Import] Quelldatei nicht gefunden:', jsonPath);
    process.exit(1);
  }

  const raw = fs.readFileSync(jsonPath, 'utf-8');
  const synsets: Synset[] = JSON.parse(raw);
  console.log(`[OpenThesaurus Import] Lese ${synsets.length} Synset-Gruppen...`);

  const db = getDb();
  if (!db) {
    console.log('[OpenThesaurus Import] Kein DATABASE_URL gefunden. Datensatz bleibt als lokale Datei data/openthesaurus_de.json für den Server verfügbar.');
    return;
  }

  try {
    let inserted = 0;
    for (const synset of synsets) {
      for (const word of synset.words) {
        // Collect all other words in group
        const synonyms = synset.words.filter((w) => w.toLowerCase() !== word.toLowerCase());
        await db.insert(schema.thesaurusEntries).values({
          word: word.toLowerCase(),
          synsetGroup: synset.group,
          synonyms,
        });
        inserted++;
      }
    }
    console.log(`[OpenThesaurus Import] Erfolgreich ${inserted} Wörter in PostgreSQL-Tabelle 'thesaurus_entries' importiert! (Lizenz: LGPL)`);
  } catch (err: any) {
    console.warn('[OpenThesaurus Import] Hinweis:', err.message);
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  importOpenThesaurus();
}
