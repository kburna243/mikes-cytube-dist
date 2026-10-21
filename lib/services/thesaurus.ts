/**
 * Deutscher OpenThesaurus Client-Dienst (LGPL)
 * Fragt die eigene Server-Route /api/thesaurus?wort=... ab.
 * Keine Live-Abfrage externer Dienste! 100% lokal & datenschutzfreundlich.
 */

export interface ThesaurusResponse {
  word: string;
  synonyms: string[];
  source: string;
  latencyMs: number;
  isInstant: boolean;
}

export async function fetchThesaurusSynonyms(
  word: string,
  context?: string
): Promise<ThesaurusResponse> {
  const startTime = Date.now();
  const cleanWord = word.trim();

  if (!cleanWord) {
    return {
      word: '',
      synonyms: [],
      source: 'OpenThesaurus (LGPL)',
      latencyMs: 0,
      isInstant: true,
    };
  }

  try {
    const res = await fetch(`/api/thesaurus?wort=${encodeURIComponent(cleanWord)}`, {
      headers: { Accept: 'application/json' },
    });

    if (res.ok) {
      const data = await res.json();
      return {
        word: cleanWord,
        synonyms: data.synonyms || [],
        source: data.source || 'OpenThesaurus (LGPL)',
        latencyMs: Date.now() - startTime,
        isInstant: true,
      };
    }
  } catch (err) {
    console.debug('[Thesaurus] Lokaler API-Aufruf fehlgeschlagen:', err);
  }

  return {
    word: cleanWord,
    synonyms: [],
    source: 'OpenThesaurus (LGPL)',
    latencyMs: Date.now() - startTime,
    isInstant: true,
  };
}
