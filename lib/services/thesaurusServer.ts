import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { eq, ilike } from 'drizzle-orm';
import { getDb, schema } from '../db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface Synset {
  group: string;
  words: string[];
}

let cachedSynsets: Synset[] | null = null;

function loadLocalSynsets(): Synset[] {
  if (cachedSynsets) return cachedSynsets;
  try {
    const filePath = path.resolve(process.cwd(), 'data/openthesaurus_de.json');
    if (fs.existsSync(filePath)) {
      const raw = fs.readFileSync(filePath, 'utf-8');
      cachedSynsets = JSON.parse(raw);
      return cachedSynsets || [];
    }
  } catch (err) {
    console.warn('[OpenThesaurus] Fehler beim Laden der Datei:', err);
  }
  return [];
}

export async function lookupOpenThesaurus(term: string): Promise<{ word: string; synonyms: string[]; source: string }> {
  const query = term.trim().toLowerCase();
  const db = getDb();

  // 1. In PostgreSQL Drizzle Tabelle suchen
  if (db) {
    try {
      const rows = await db
        .select()
        .from(schema.thesaurusEntries)
        .where(eq(schema.thesaurusEntries.word, query));

      if (rows && rows.length > 0) {
        const synSet = new Set<string>();
        rows.forEach((r: typeof schema.thesaurusEntries.$inferSelect) => {
          r.synonyms?.forEach((s: string) => synSet.add(s));
        });
        if (synSet.size > 0) {
          return {
            word: term,
            synonyms: Array.from(synSet).filter((s) => s.toLowerCase() !== query),
            source: 'OpenThesaurus (PostgreSQL / LGPL)',
          };
        }
      }
    } catch (err) {
      console.warn('[OpenThesaurus] DB-Abfrage fehlgeschlagen, nutze Datei-Cache:', err);
    }
  }

  // 2. Im lokalen OpenThesaurus Datensatz suchen
  const synsets = loadLocalSynsets();
  const results = new Set<string>();

  for (const s of synsets) {
    const wordsLower = s.words.map((w) => w.toLowerCase());
    if (wordsLower.includes(query) || s.group.toLowerCase() === query) {
      s.words.forEach((w) => {
        if (w.toLowerCase() !== query) {
          results.add(w);
        }
      });
    }
  }

  // Falls kein direkter Treffer, suche nach Teilwort
  if (results.size === 0) {
    for (const s of synsets) {
      for (const w of s.words) {
        if (w.toLowerCase().startsWith(query) || query.startsWith(w.toLowerCase())) {
          s.words.forEach((other) => {
            if (other.toLowerCase() !== query) {
              results.add(other);
            }
          });
          break;
        }
      }
      if (results.size > 0) break;
    }
  }

  return {
    word: term,
    synonyms: Array.from(results).slice(0, 10),
    source: 'OpenThesaurus (Lokal / LGPL)',
  };
}
