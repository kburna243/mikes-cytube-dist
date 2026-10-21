import { Chapter, ContinuityConflict, Entity, Fact } from '../types/domain.js';
import { repo } from '../../lib/repo.js';

interface CheckRule {
  category: string;
  pattern: RegExp;
  extractValue: (match: RegExpMatchArray) => string;
  conflictsWith: (extracted: string, factStatement: string) => boolean;
  createSuggestion: (entity: Entity, extracted: string, fact: Fact) => string;
}

const COMMON_RULES: CheckRule[] = [
  // Eye color conflict
  {
    category: 'Augenfarbe',
    pattern: /(?:(braun|grau|blau|grün|schwarz|dunkel|hell)[a-zäöüß]*\s+augen|(?:ihre|seine|die)\s+(?:[a-zäöüß]+\s+)?(braun|grau|blau|grün|schwarz|dunkel|hell)[a-zäöüß]*\s+augen)/i,
    extractValue: (m) => (m[1] || m[2] || '').toLowerCase(),
    conflictsWith: (extracted, fact) => {
      const factLower = fact.toLowerCase();
      if (!factLower.includes('auge')) return false;
      const eyeColors = ['grau', 'braun', 'blau', 'grün', 'schwarz', 'dunkel', 'hell'];
      const factColor = eyeColors.find((c) => factLower.includes(c));
      const extractedColor = eyeColors.find((c) => extracted.includes(c));
      return Boolean(factColor && extractedColor && factColor !== extractedColor);
    },
    createSuggestion: (entity, extracted, fact) =>
      `Im Manuskript steht »${extracted}e Augen«, doch der Kanon (Fakt aus ${fact.source}) legt fest: »${fact.statement}«. Ersetze die Stelle durch die kanonische Augenfarbe.`,
  },
  // Handedness conflict
  {
    category: 'Händigkeit',
    pattern: /(?:mit\s+der\s+)(rechten|linken)\s+hand/i,
    extractValue: (m) => m[1].toLowerCase(),
    conflictsWith: (extracted, fact) => {
      const factLower = fact.toLowerCase();
      if (!factLower.includes('händer') && !factLower.includes('hand')) return false;
      if (factLower.includes('linkshänder') && extracted.includes('recht')) return true;
      if (factLower.includes('rechtshänder') && extracted.includes('link')) return true;
      return false;
    },
    createSuggestion: (entity, extracted, fact) =>
      `Aktion wird mit der ${extracted}en Hand beschrieben. Der Kanon führt ${entity.name} jedoch als »${fact.statement}«.`,
  },
];

export async function checkChapterContinuity(ownerId: string, chapterId: string): Promise<ContinuityConflict[]> {
  const chapter = await repo.getChapter(ownerId, chapterId);
  if (!chapter) return [];

  const entities = await repo.getEntities(ownerId);
  const allFacts = await repo.getFacts(ownerId);
  const text = chapter.body || '';
  const conflicts: ContinuityConflict[] = [];

  // Check each entity mentioned in this chapter
  for (const entity of entities) {
    const nameParts = entity.name.split(/\s+/).filter((p: string) => p.length > 2);
    const aliasParts = (entity.aliases || []).flatMap((a: string) => a.split(/\s+/)).filter((p: string) => p.length > 2);
    const names = [entity.name, ...nameParts, ...(entity.aliases || []), ...aliasParts];
    const isMentioned = names.some((n) => text.toLowerCase().includes(n.toLowerCase()));
    if (!isMentioned) continue;

    const entityFacts = allFacts.filter((f: Fact) => f.entity_id === entity.id);

    // Paragraph by paragraph analysis
    const paragraphs = text.split(/\n+/);
    for (const paragraph of paragraphs) {
      for (const rule of COMMON_RULES) {
        const matches = paragraph.matchAll(new RegExp(rule.pattern.source, 'gi'));
        for (const match of matches) {
          const matchedString = match[0];
          const extractedValue = rule.extractValue(match);

          for (const fact of entityFacts) {
            if (rule.conflictsWith(extractedValue, fact.statement)) {
              conflicts.push({
                id: `conf-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`,
                chapter_id: chapter.id,
                chapter_title: chapter.title,
                entity_id: entity.id,
                entity_name: entity.name,
                quote_in_chapter: matchedString,
                canonical_fact: fact.statement,
                severity: 'critical',
                suggestion: rule.createSuggestion(entity, extractedValue, fact),
              });
            }
          }
        }
      }
    }
  }

  return conflicts;
}
