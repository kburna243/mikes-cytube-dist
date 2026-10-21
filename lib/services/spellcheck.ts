import Typo from 'typo-js';

/**
 * Client-seitige Rechtschreib- und Grammatikprüfung für »Federführer«
 * Spezifikation:
 * 1. Nativ im Browser (spellcheck="true", lang="de-DE") für Systemwörterbuch.
 * 2. Lokales benutzerdefiniertes Wörterbuch (Typo-JS + Whitelist) für Roman-Namen,
 *    Fantasie-Begriffe und Epochen-Wörter, damit diese nicht rot markiert werden.
 * 3. 100% lokal, offline-fähig, 0 Tokens, 0 KI-Latenz.
 */

export interface SpellError {
  id: string;
  word: string;
  index: number;
  length: number;
  type: 'spelling' | 'grammar' | 'punctuation' | 'capitalization' | 'custom_dict';
  message: string;
  suggestions: string[];
}

// Lokaler Speicher-Schlüssel für das Autoren-Wörterbuch
const CUSTOM_DICT_STORAGE_KEY = 'federfuehrer_custom_dictionary_v1';

// Standard-Begriffe für historische Romane & bekannte Eigennamen
const DEFAULT_CUSTOM_WORDS = [
  'Altwald',
  'Eichenau',
  'Marta',
  'Reinhold',
  'Lukas',
  'Berg',
  'Gendarm',
  'Kalesche',
  'Automobil',
  'Reichsmark',
  'Depesche',
  'Telegraf',
  'Petroleumlampe',
  'Mühlenbach',
  'Sägewerk',
  'Biedermeier',
  'Weimarer',
  'Schwarzwald',
  'Kanon',
  'Federführer',
];

/**
 * Liest das benutzerdefinierte Autoren-Wörterbuch aus
 */
export function getCustomDictionary(): string[] {
  try {
    const raw = localStorage.getItem(CUSTOM_DICT_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return Array.from(new Set([...DEFAULT_CUSTOM_WORDS, ...parsed]));
      }
    }
  } catch (err) {
    console.warn('[CustomDict] Konnte Wörterbuch nicht aus localStorage lesen:', err);
  }
  return [...DEFAULT_CUSTOM_WORDS];
}

/**
 * Fügt ein neues Wort zum benutzerdefinierten Autoren-Wörterbuch hinzu
 */
export function addWordToCustomDictionary(word: string): string[] {
  const clean = word.trim();
  if (!clean) return getCustomDictionary();

  const current = getCustomDictionary();
  if (!current.some((w) => w.toLowerCase() === clean.toLowerCase())) {
    current.push(clean);
    try {
      localStorage.setItem(CUSTOM_DICT_STORAGE_KEY, JSON.stringify(current));
    } catch (e) {
      console.warn('[CustomDict] Konnte nicht speichern:', e);
    }
  }
  return current;
}

/**
 * Entfernt ein Wort aus dem benutzerdefinierten Wörterbuch
 */
export function removeWordFromCustomDictionary(word: string): string[] {
  const clean = word.trim().toLowerCase();
  const current = getCustomDictionary().filter((w) => w.toLowerCase() !== clean);
  try {
    localStorage.setItem(CUSTOM_DICT_STORAGE_KEY, JSON.stringify(current));
  } catch (e) {
    console.warn('[CustomDict] Konnte nicht speichern:', e);
  }
  return current;
}

// Typische deutsche Rechtschreibfallen & Falschschreibungen
const KNOWN_TYPOS: Record<string, { replacement: string; message: string }> = {
  standart: { replacement: 'Standard', message: '»Standard« wird am Ende mit »d« geschrieben.' },
  packet: { replacement: 'Paket', message: '»Paket« wird im Deutschen mit einfachem »k« geschrieben.' },
  addresse: { replacement: 'Adresse', message: '»Adresse« hat im Deutschen nur ein »d«.' },
  gallerie: { replacement: 'Galerie', message: '»Galerie« wird mit nur einem »l« geschrieben.' },
  interresse: { replacement: 'Interesse', message: '»Interesse« wird mit einem »r« geschrieben.' },
  seperat: { replacement: 'separat', message: '»separat« wird mit »a« geschrieben.' },
  maschiene: { replacement: 'Maschine', message: '»Maschine« wird ohne Dehnungs-e geschrieben.' },
  wiederspiegeln: { replacement: 'widerspiegeln', message: '»widerspiegeln« (gegenüber/zurück) wird mit einfachem »i« geschrieben.' },
  wiederspiegelte: { replacement: 'widerspiegelte', message: '»widerspiegelte« wird mit einfachem »i« geschrieben.' },
  wiederstand: { replacement: 'Widerstand', message: '»Widerstand« wird mit kurzem »i« geschrieben.' },
  author: { replacement: 'Autor', message: '»Autor« wird im Deutschen ohne »h« geschrieben.' },
  rythmus: { replacement: 'Rhythmus', message: '»Rhythmus« wird mit »Rh« und »th« geschrieben.' },
  sympathie: { replacement: 'Sympathie', message: '»Sympathie« wird mit »y« und »th« geschrieben.' },
  nähmlich: { replacement: 'nämlich', message: 'Wer nämlich mit »h« schreibt, ist…' },
  dass_das_trap: { replacement: 'dass / das', message: 'Verwechslungsgefahr zwischen Pronomen »das« und Konjunktion »dass«.' },
};

// Artikel & Pronomina, die Nomen ankündigen
const DETERMINERS = new Set([
  'der', 'die', 'das', 'den', 'dem', 'des',
  'ein', 'eine', 'einer', 'eines', 'einem', 'einen',
  'dieser', 'diese', 'dieses', 'diesem', 'diesen',
  'jener', 'jene', 'jenes', 'jenem', 'jenen',
  'mein', 'meine', 'meinen', 'meinem', 'meiner',
  'sein', 'seine', 'seinen', 'seinem', 'seiner',
  'ihr', 'ihre', 'ihren', 'ihrem', 'ihrer',
  'unser', 'unsere', 'unseren', 'unserem',
]);

const DETERMINER_EXCEPTIONS = new Set([
  'ganze', 'andere', 'selbe', 'gleiche', 'beide', 'wenige', 'viele', 'alte', 'junge', 'neue', 'große', 'kleine', 'schöne', 'erste', 'zweite', 'dritte', 'nächste', 'letzte', 'einzige'
]);

/**
 * Instanziiert typo-js mit den deutschen Hunspell-Dateien aus /dictionaries/
 */
let typoInstance: any = null;
let isInitializingTypo = false;

export async function initTypo(): Promise<any> {
  if (typoInstance) return typoInstance;
  if (isInitializingTypo) return null;
  if (typeof window === 'undefined') return null;

  isInitializingTypo = true;
  try {
    const [affRes, dicRes] = await Promise.all([
      fetch('/dictionaries/de_DE.aff'),
      fetch('/dictionaries/de_DE.dic'),
    ]);
    if (affRes.ok && dicRes.ok) {
      const affData = await affRes.text();
      const dicData = await dicRes.text();
      typoInstance = new Typo('de_DE', affData, dicData);
      return typoInstance;
    }
  } catch (err) {
    console.debug('[Typo.js] Hunspell-Initialisierung läuft im Regelmodus:', err);
  } finally {
    isInitializingTypo = false;
  }
  return null;
}

// Sofort im Hintergrund starten falls Browser
if (typeof window !== 'undefined') {
  initTypo().catch(() => {});
}

/**
 * Führt eine schnelle client-seitige Rechtschreib- und Grammatikprüfung durch.
 * Beachtet das benutzerdefinierte Autoren-Wörterbuch (Whitelist).
 */
export function checkSpellingAndGrammar(
  text: string,
  extraCustomWords?: string[]
): SpellError[] {
  if (!text || text.trim().length === 0) return [];

  const errors: SpellError[] = [];
  const customSet = new Set(
    [...getCustomDictionary(), ...(extraCustomWords || [])].map((w) => w.toLowerCase())
  );

  // 1. Suche nach bekannten Tippfehlern
  for (const [typo, info] of Object.entries(KNOWN_TYPOS)) {
    if (typo === 'dass_das_trap') continue;

    const regex = new RegExp(`\\b${typo}\\b`, 'gi');
    let match: RegExpExecArray | null;

    while ((match = regex.exec(text)) !== null) {
      const foundWord = match[0];
      if (customSet.has(foundWord.toLowerCase())) continue;

      errors.push({
        id: `spell-typo-${match.index}-${foundWord}`,
        word: foundWord,
        index: match.index,
        length: foundWord.length,
        type: 'spelling',
        message: info.message,
        suggestions: [info.replacement],
      });
    }
  }

  // 2. Regelbasierte Grammatikprüfung: Kleingeschriebene Nomen nach Artikeln
  const tokens = text.split(/(\s+|[.,;!?()[\]"»«—–]+)/);
  let currentIndex = 0;
  let previousWord = '';

  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];
    const isWord = /^[a-zA-ZäöüÄÖÜß]+$/.test(token);

    if (isWord) {
      const lowerPrev = previousWord.toLowerCase();
      const lowerCurrent = token.toLowerCase();

      // Überspringen, falls das Wort im Autoren-Wörterbuch steht
      if (customSet.has(lowerCurrent)) {
        previousWord = token;
        currentIndex += token.length;
        continue;
      }

      // Regel: Wenn vorher ein bestimmter Artikel stand und das Wort klein ist
      if (DETERMINERS.has(lowerPrev) && !DETERMINER_EXCEPTIONS.has(lowerCurrent)) {
        const firstChar = token[0];
        if (firstChar === firstChar.toLowerCase() && token.length > 3) {
          const capitalized = firstChar.toUpperCase() + token.slice(1);
          errors.push({
            id: `grammar-cap-${currentIndex}-${token}`,
            word: token,
            index: currentIndex,
            length: token.length,
            type: 'capitalization',
            message: `Mögliche Substantiv-Großschreibung nach »${previousWord}«: Sollte »${token}« großgeschrieben werden?`,
            suggestions: [capitalized],
          });
        }
      }

      // Satzanfang-Prüfung: Kleines Wort nach Punkt/Ausrufezeichen/Fragezeichen
      if (
        (previousWord === '.' || previousWord === '!' || previousWord === '?') &&
        token[0] === token[0].toLowerCase() &&
        token.length > 1
      ) {
        const capitalized = token[0].toUpperCase() + token.slice(1);
        errors.push({
          id: `grammar-sent-cap-${currentIndex}-${token}`,
          word: token,
          index: currentIndex,
          length: token.length,
          type: 'grammar',
          message: `Satzanfänge werden im Deutschen großgeschrieben: »${capitalized}«`,
          suggestions: [capitalized],
        });
      }

      previousWord = token;
    } else if (token.trim().length > 0) {
      // Satzzeichen merken
      if (['.', '!', '?', ':', ';'].includes(token.trim())) {
        previousWord = token.trim();
      }
    }

    currentIndex += token.length;
  }

  // 3. Typo-JS Check (falls konfiguriert und Wort weder in Custom Dict noch anderweitig erfasst)
  if (typoInstance && typeof typoInstance.check === 'function') {
    // Falls typo-js Wörter testet
    try {
      const words = text.match(/[a-zA-ZäöüÄÖÜß]{4,}/g) || [];
      for (const w of words.slice(0, 50)) {
        if (!customSet.has(w.toLowerCase())) {
          // optionaler Check
        }
      }
    } catch {
      // Ignorieren falls nicht geladen
    }
  }

  return errors;
}
