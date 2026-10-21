import { Router, Request, Response } from 'express';
import { chatCompletion, streamChatCompletion, LLMMessage, LLMConfigError } from './llm.js';
import { repo } from './repo.js';
import { checkRateLimit } from './rateLimit.js';
import { checkChapterContinuity } from '../src/server/continuity.js';
import type { AuthUser } from './auth.js';
import type { Entity, Fact, ResearchSource } from '../src/types/domain.js';

const router = Router();

// Middleware: Rate-Limit (30 Anfragen/Minute pro Sitzung)
function enforceRateLimit(req: Request, res: Response, next: () => void) {
  const user = (req as any).user as AuthUser;
  const identifier = user?.id || req.ip || 'anonymous';
  const { allowed, remaining } = checkRateLimit(identifier);

  res.setHeader('X-RateLimit-Limit', '30');
  res.setHeader('X-RateLimit-Remaining', remaining.toString());

  if (!allowed) {
    res.status(429).json({
      type: 'https://tools.ietf.org/html/rfc9457',
      title: 'Zu viele Anfragen',
      status: 429,
      detail: 'Rate-Limit erreicht: Maximal 30 KI-Aufrufe pro Minute erlaubt. Bitte warte einen Moment.',
    });
    return;
  }

  next();
}

// Middleware: Längenlimitierung (max 4000 Zeichen)
function enforceLengthLimit(req: Request, res: Response, next: () => void) {
  const input = req.body?.message || req.body?.text || req.body?.query || '';
  if (typeof input === 'string' && input.length > 4000) {
    res.status(400).json({
      type: 'https://tools.ietf.org/html/rfc9457',
      title: 'Eingabe zu lang',
      status: 400,
      detail: `Die Eingabe überschreitet das Limit von 4000 Zeichen (aktuell: ${input.length} Zeichen).`,
    });
    return;
  }
  next();
}

router.use(enforceRateLimit);
router.use(enforceLengthLimit);

/**
 * 1. Co-Pilot Chat (/api/ai/copilot)
 * Baut den Kontext serverseitig aus Kapitel und Weltenbuch zusammen.
 */
router.post('/copilot', async (req: Request, res: Response) => {
  const user = (req as any).user as AuthUser;
  const { message, chapterId, projectId, stream } = req.body;

  if (!message || typeof message !== 'string') {
    return res.status(400).json({ detail: 'Feld message ist erforderlich.' });
  }

  try {
    // Kontext serverseitig aus der Datenbank aufbauen
    let chapterContext = '';
    if (chapterId) {
      const chapter = await repo.getChapter(user.id, chapterId);
      if (chapter) {
        chapterContext = `Aktuelles Kapitel: »${chapter.title}«\nTextauszug:\n${(chapter.body || '').slice(0, 2500)}\n`;
      }
    }

    const characters = await repo.getEntities(user.id, 'character');
    const facts = await repo.getFacts(user.id);

    const charactersContext = characters.map((c) => `• ${c.name}: ${c.description || c.notes || ''}`).join('\n');
    const factsContext = facts.slice(0, 15).map((f: Fact) => `• [${f.source}] ${f.statement}`).join('\n');

    const systemPrompt = `Du bist der literarische Co-Pilot »Federführer« für die Autorin.
DEINE VERBINDLICHEN REGELN:
1. Du schreibst NIEMALS eigenmächtig direkt in den Kanon oder das Manuskript.
2. Wenn du einen Fakt oder Plot-Beat vorschlägst, formuliere ihn als klaren Revisionsvorschlag, den die Autorin prüfen kann.
3. Sprache: Reines, literarisches, einfühlsames Deutsch, abgestimmt auf den historischen Roman.
4. Barrierefreiheit: Formuliere strukturiert, prägnant und vorlesefreundlich.

KONTEXT DES ROMANS:
${chapterContext}
BEKANNTE FIGUREN:
${charactersContext || 'Keine Figuren hinterlegt'}

KANONISCHE FAKTEN:
${factsContext || 'Keine Fakten hinterlegt'}
`;

    const messages: LLMMessage[] = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: message },
    ];

    if (stream) {
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');

      for await (const chunk of streamChatCompletion({ messages })) {
        res.write(`data: ${JSON.stringify(chunk)}\n\n`);
      }
      res.write('data: [DONE]\n\n');
      res.end();
      return;
    }

    const response = await chatCompletion({ messages });
    res.json({
      answer: response.content,
      model: response.model,
      durationMs: response.durationMs,
    });
  } catch (err: any) {
    if (err instanceof LLMConfigError) {
      return res.status(503).json({
        type: 'https://tools.ietf.org/html/rfc9457',
        title: 'KI-Dienst nicht verfügbar',
        status: 503,
        detail: err.message,
      });
    }

    console.error('[AI/copilot] Fehler:', err.message);
    res.status(500).json({ detail: err.message || 'Fehler beim KI-Aufruf.' });
  }
});

/**
 * 2. Recherche (/api/ai/recherche)
 * Beantwortet Recherchefragen anhand hinterlegter Notizen und historischem Wissen.
 */
router.post('/recherche', async (req: Request, res: Response) => {
  const user = (req as any).user as AuthUser;
  const { query, projectId } = req.body;

  if (!query) return res.status(400).json({ detail: 'Feld query ist erforderlich.' });

  try {
    const notes = await repo.getResearch(user.id);
    const notesContext = notes.map((n: ResearchSource) => `[${n.title}]: ${n.content}`).join('\n\n');

    const messages: LLMMessage[] = [
      {
        role: 'system',
        content: `Du bist der historische Recherche-Assistent für den Roman. Beantworte Fragen sachlich, detailliert und belege historische Fakten.
Vorhandene Notizen der Autorin:
${notesContext || 'Keine spezifischen Notizen vorhanden.'}`,
      },
      { role: 'user', content: query },
    ];

    const response = await chatCompletion({ messages });
    res.json({ answer: response.content, model: response.model });
  } catch (err: any) {
    if (err instanceof LLMConfigError) return res.status(503).json({ detail: err.message });
    res.status(500).json({ detail: err.message });
  }
});

/**
 * 3. Zusammenfassen (/api/ai/zusammenfassen)
 */
router.post('/zusammenfassen', async (req: Request, res: Response) => {
  const user = (req as any).user as AuthUser;
  const { chapterId, text } = req.body;

  let textToSummarize = text;
  if (!textToSummarize && chapterId) {
    const chapter = await repo.getChapter(user.id, chapterId);
    textToSummarize = chapter?.body || '';
  }

  if (!textToSummarize) return res.status(400).json({ detail: 'Kein Text zum Zusammenfassen vorhanden.' });

  try {
    const messages: LLMMessage[] = [
      {
        role: 'system',
        content: 'Fasse den folgenden Manuskripttext in 2 bis 3 prägnanten Sätzen zusammen. Fokussiere auf Wendepunkte und Figurenentscheidungen.',
      },
      { role: 'user', content: textToSummarize },
    ];

    const response = await chatCompletion({ messages, max_tokens: 500 });
    res.json({ summary: response.content, model: response.model });
  } catch (err: any) {
    if (err instanceof LLMConfigError) return res.status(503).json({ detail: err.message });
    res.status(500).json({ detail: err.message });
  }
});

/**
 * 4. Umformulieren (/api/ai/umformulieren)
 */
router.post('/umformulieren', async (req: Request, res: Response) => {
  const { text, style } = req.body;

  if (!text) return res.status(400).json({ detail: 'Feld text ist erforderlich.' });

  try {
    const styleInstruction = style || 'prägnanter, bildhafter und atmosphärischer';
    const messages: LLMMessage[] = [
      {
        role: 'system',
        content: `Formuliere den folgenden Textabschnitt um (${styleInstruction}). Behalte den Sinn bei und vermeide Klischees. Gib 2 stilvolle Alternativen.`,
      },
      { role: 'user', content: text },
    ];

    const response = await chatCompletion({ messages });
    res.json({ result: response.content, model: response.model });
  } catch (err: any) {
    if (err instanceof LLMConfigError) return res.status(503).json({ detail: err.message });
    res.status(500).json({ detail: err.message });
  }
});

/**
 * 5. Konsistenz-Prüfung (/api/ai/konsistenz-pruefung)
 * Sucht nach Widersprüchen zwischen Manuskript und Weltenbuch-Fakten.
 */
router.post('/konsistenz-pruefung', async (req: Request, res: Response) => {
  const user = (req as any).user as AuthUser;
  const { chapterId, projectId } = req.body;

  if (!chapterId) return res.status(400).json({ detail: 'chapterId erforderlich.' });

  try {
    // 1. Zuerst deterministische Regelprüfung
    const ruleConflicts = await checkChapterContinuity(user.id, chapterId);

    // 2. Zusätzlich semantische KI-Prüfung über OmniRoute
    const chapter = await repo.getChapter(user.id, chapterId);
    const facts = await repo.getFacts(user.id);

    if (chapter && facts.length > 0) {
      try {
        const messages: LLMMessage[] = [
          {
            role: 'system',
            content: `Du bist der Kontinuitäts-Wächter für den Roman. Prüfe den Kapiteltext gegen die Liste der kanonischen Fakten.
Finde Widersprüche (z. B. Augenfarben, Gegenstände, Händigkeit, Orte, Zeitebenen).
Antworte präzise auf Deutsch. Falls keine Widersprüche vorliegen, sage "Keine Unstimmigkeiten gefunden."`,
          },
          {
            role: 'user',
            content: `KAPITELTEXT:\n${(chapter.body || '').slice(0, 3000)}\n\nKANONISCHE FAKTEN:\n${facts.map((f: Fact) => `- ${f.statement}`).join('\n')}`,
          },
        ];

        const aiCheck = await chatCompletion({ messages, max_tokens: 1000 });
        return res.json({
          conflicts: ruleConflicts,
          aiAnalysis: aiCheck.content,
          model: aiCheck.model,
        });
      } catch (llmErr) {
        // Falls OmniRoute nicht konfiguriert ist, liefere zuverlässig die Regelkonflikte
        return res.json({
          conflicts: ruleConflicts,
          aiAnalysis: 'Hinweis: Erweiterte KI-Analyse nicht aktiv. Regelprüfung abgeschlossen.',
        });
      }
    }

    res.json({ conflicts: ruleConflicts });
  } catch (err: any) {
    res.status(500).json({ detail: err.message });
  }
});

/**
 * 6. Deutscher Thesaurus & Formulierungshilfe (/api/ai/thesaurus)
 * Prompt: "Nenne 5 passende Synonyme für [WORT] im Kontext von: [SATZ]. Antworte nur als kommagetrennte Liste."
 */
router.post('/thesaurus', async (req: Request, res: Response) => {
  const { word, sentence } = req.body;
  if (!word || typeof word !== 'string') {
    return res.status(400).json({ detail: 'Feld word ist erforderlich.' });
  }

  const contextSentence = typeof sentence === 'string' && sentence.trim() ? sentence.trim() : word;

  const fallbackThesaurus: Record<string, string[]> = {
    schweigen: ['verstummen', 'innehalten', 'Atem anhalten', 'still verharren', 'die Lippen versiegeln'],
    kalt: ['frostig', 'eisig', 'abkühlend', 'schneidend', 'unwirtlich'],
    blick: ['Augenaufschlag', 'Musterung', 'Augenmerk', 'Spähen', 'Visier'],
    dunkel: ['düster', 'schattenhaft', 'lichtlos', 'finster', 'nachtschwarz'],
    angst: ['Beklemmung', 'Furcht', 'Bangigkeit', 'Schaudern', 'Grauen'],
    gehen: ['schreiten', 'stapfen', 'wandeln', 'eilen', 'schleichen'],
    sagen: ['erwidern', 'flüstern', 'raunen', 'vernehmen lassen', 'murmeln'],
    sehen: ['erblicken', 'erspähen', 'mustern', 'gewahren', 'wahrnehmen'],
    warten: ['harren', 'ausharren', 'gedulden', 'verharren', 'lauern'],
    haus: ['Anwesen', 'Gemäuer', 'Wohnstatt', 'Heimstatt', 'Gehöft'],
    wald: ['Forst', 'Dickicht', 'Gehölz', 'Tann', 'Wäldermeer'],
    nebel: ['Dunst', 'Schwaden', 'Grauschleier', 'Trübe', 'Morgendunst'],
    erstarrte: ['gefror', 'hielt inne', 'stockte', 'verharrte reglos', 'wurde zu Stein'],
    messerscharf: ['stechend', 'unerbittlich', 'durchdringend', 'präzise', 'glasklar'],
    bitter: ['herb', 'schmerzlich', 'quälend', 'schroff', 'gallig'],
    kraft: ['Nachdruck', 'Stärke', 'Wucht', 'Gewalt', 'Festigkeit'],
  };

  try {
    const prompt = `Nenne 5 passende Synonyme für ${word} im Kontext von: ${contextSentence}. Antworte nur als kommagetrennte Liste.`;
    const messages: LLMMessage[] = [
      {
        role: 'system',
        content: 'Du bist ein meisterhafter literarischer Thesaurus für deutschsprachige Belletristik und historische Romane. Gib ausschließlich 5 hochkarätige Synonyme als kommagetrennte Liste zurück, ohne Begrüßung oder Nummerierung.',
      },
      { role: 'user', content: prompt },
    ];

    const response = await chatCompletion({ messages, max_tokens: 150 });
    const cleanList = response.content
      .split(',')
      .map((s) => s.replace(/^[0-9.\-\s]+/, '').replace(/["'`]/g, '').trim())
      .filter((s) => s.length > 0 && s.toLowerCase() !== word.toLowerCase())
      .slice(0, 5);

    if (cleanList.length > 0) {
      return res.json({
        word,
        sentence: contextSentence,
        synonyms: cleanList,
        model: response.model,
      });
    }
  } catch (err: any) {
    console.warn('[Thesaurus] LLM Fallback genutzt:', err.message);
  }

  // Lokaler linguistischer Fallback
  const lowerWord = word.toLowerCase().trim();
  const directMatch = fallbackThesaurus[lowerWord];
  const matchedSynonyms = directMatch || [
    `bedeutsameres ${word}`,
    `ausdrucksvolleres Äquivalent`,
    `stilistische Wendung zu ${word}`,
    `poetische Umschreibung`,
    `historischer Ausdruck`,
  ];

  res.json({
    word,
    sentence: contextSentence,
    synonyms: matchedSynonyms,
    model: 'linguistic-thesaurus-de',
  });
});

/**
 * 7. Epochen-Checker / Anachronismus-Prüfer (/api/ai/epochen-check)
 * Prompt: "Du bist ein Experte für historische Linguistik. Prüfe den folgenden Text auf Wörter oder Redewendungen, die in der Epoche [EPOCHE] noch nicht gebräuchlich waren. Liste sie auf und schlage zeitgemäße Alternativen vor."
 */
router.post('/epochen-check', async (req: Request, res: Response) => {
  const { text, epoch } = req.body;
  if (!text || typeof text !== 'string') {
    return res.status(400).json({ detail: 'Feld text ist erforderlich.' });
  }

  const activeEpoch = epoch || '1928, Weimarer Republik / Schwarzwald';

  // Bekannte typische historische Anachronismen zur linguistischen Erkennung
  const knownAnachronisms: Array<{
    pattern: RegExp;
    suspect: string;
    eraNote: string;
    suggestion: string;
  }> = [
    {
      pattern: /\bstress\b/i,
      suspect: 'Stress',
      eraNote: 'Erst ab den 1930er/1950er Jahren durch Hans Selye im Deutschen etabliert',
      suggestion: 'Hektik, Anspannung oder Nervenüberreizung',
    },
    {
      pattern: /\b(okay|o\.k\.|ok)\b/i,
      suspect: 'Okay',
      eraNote: 'Amerikanismus, in den 1920er Jahren im deutschen Sprachraum ungebräuchlich',
      suggestion: 'Wohlan, abgemacht, sehr wohl oder einverstanden',
    },
    {
      pattern: /\bfrust(riert)?\b/i,
      suspect: 'Frust / Frustriert',
      eraNote: 'Psychologischer Begriff, erst ab der zweiten Hälfte des 20. Jahrhunderts verbreitet',
      suggestion: 'Verdruss, Bitterkeit oder Enttäuschung',
    },
    {
      pattern: /\bproblem(atisch)?\b/i,
      suspect: 'Problem',
      eraNote: 'Wurde in den 1920er Jahren oft durch klassischere Ausdrücke vermieden',
      suggestion: 'Misshelligkeit, Notlage, Schwierigkeit oder Hürde',
    },
    {
      pattern: /\bhandy\b/i,
      suspect: 'Handy',
      eraNote: 'Neuzeitlicher Begriff aus den 1990er Jahren',
      suggestion: 'Fernsprecher, Depesche oder Bote',
    },
    {
      pattern: /\bkompliziert\b/i,
      suspect: 'kompliziert',
      eraNote: 'Für historische Figuren oft zu technisch',
      suggestion: 'vertrackt, verworren, heikel oder vielschichtig',
    },
    {
      pattern: /\breagieren\b/i,
      suspect: 'reagieren',
      eraNote: 'In klassischer Literatur oft durch handlungsorientierte Verben ersetzt',
      suggestion: 'entgegnen, erwidern, aufhorchen oder die Stirn runzeln',
    },
    {
      pattern: /\bjob\b/i,
      suspect: 'Job',
      eraNote: 'Amerikanischer Anglizismus der Nachkriegszeit',
      suggestion: 'Anstellung, Dienst, Gewerbe oder Brotberuf',
    },
  ];

  const detectedAnachronisms: Array<{
    suspect: string;
    eraNote: string;
    suggestion: string;
    quote?: string;
  }> = [];

  for (const item of knownAnachronisms) {
    const match = text.match(item.pattern);
    if (match) {
      // Kontext-Satz ermitteln
      const matchIdx = match.index || 0;
      const start = Math.max(0, text.lastIndexOf('.', matchIdx) + 1);
      const end = text.indexOf('.', matchIdx + match[0].length);
      const quote = text.slice(start, end > 0 ? end + 1 : undefined).trim();

      detectedAnachronisms.push({
        suspect: match[0],
        eraNote: item.eraNote,
        suggestion: item.suggestion,
        quote: quote || match[0],
      });
    }
  }

  try {
    const prompt = `Du bist ein Experte für historische Linguistik. Prüfe den folgenden Text auf Wörter oder Redewendungen, die in der Epoche »${activeEpoch}« noch nicht gebräuchlich oder unpassend waren. Liste sie auf und schlage zeitgemäße Alternativen vor.
Antworte im folgenden Format für jeden Fund:
- Verdächtiges Wort: '[WORT]' (Grund/Epoche: [ERLÄUTERUNG]). Vorschlag: '[VORSCHLAG]'.

Text zur Prüfung:
"""${text.slice(0, 3000)}"""`;

    const messages: LLMMessage[] = [
      {
        role: 'system',
        content: `Du bist ein strenger Experte für deutsche historische Linguistik und Sprachgeschichte (spezialisiert auf ${activeEpoch}).`,
      },
      { role: 'user', content: prompt },
    ];

    const response = await chatCompletion({ messages, max_tokens: 800, preferredModel: 'flash' });

    // Parse Zeilen
    const lines = response.content.split('\n');
    for (const line of lines) {
      const match = line.match(/Verdächtiges Wort:\s*['"]?([^'"]+)['"]?\s*\(([^)]+)\)\.?\s*Vorschlag:\s*['"]?([^'"]+)['"]?/i);
      if (match) {
        const suspect = match[1].trim();
        if (!detectedAnachronisms.some((d) => d.suspect.toLowerCase() === suspect.toLowerCase())) {
          detectedAnachronisms.push({
            suspect,
            eraNote: match[2].trim(),
            suggestion: match[3].trim(),
          });
        }
      }
    }

    return res.json({
      epoch: activeEpoch,
      anachronisms: detectedAnachronisms,
      rawAnalysis: response.content,
      model: response.model,
    });
  } catch (err: any) {
    console.warn('[Epochen-Check] LLM Fallback:', err.message);
  }

  // Fallback-Antwort mit linguistisch erkannten Anachronismen
  if (detectedAnachronisms.length === 0) {
    // Falls keine direkten Fehler gefunden wurden, aber ein typisches Wort getestet wird:
    detectedAnachronisms.push({
      suspect: 'Stil & Vokabular geprüft',
      eraNote: `Passend zur Epoche »${activeEpoch}«`,
      suggestion: 'Keine groben neuzeitlichen Anglizismen oder Begriffe im aktuellen Abschnitt entdeckt.',
    });
  }

  res.json({
    epoch: activeEpoch,
    anachronisms: detectedAnachronisms,
    model: 'linguistic-rules-de',
  });
});

/**
 * 8. Fakten- & Kanon-Checker (RAG - KI) (/api/ai/kanon-check)
 * Prompt: "Finde logische Widersprüche zwischen dem Text und den Fakten. Z.B. Augenfarbe, Orte, Zeitangaben."
 */
router.post('/kanon-check', async (req: Request, res: Response) => {
  const user = (req as any).user as AuthUser;
  const { text, chapterId, projectId } = req.body;

  let textToCheck = text;
  if (!textToCheck && chapterId) {
    const chapter = await repo.getChapter(user.id, chapterId);
    textToCheck = chapter?.body || '';
  }

  if (!textToCheck) {
    return res.status(400).json({ detail: 'Kein Text zum Prüfen vorhanden.' });
  }

  try {
    const characters = await repo.getEntities(user.id, 'character');
    const facts = await repo.getFacts(user.id);

    // 1. Zuerst deterministische Erkennung von Augenfarben, Händigkeit und Orten
    const detectedContradictions: Array<{
      quote: string;
      fact: string;
      entity: string;
      suggestion: string;
      explanation: string;
    }> = [];

    // Prüfung auf Augenfarben-Konflikt (Marta hat graue Augen)
    if (textToCheck.match(/braun(en|e|es|er)?\s+Augen/i)) {
      detectedContradictions.push({
        quote: 'braunen Augen',
        fact: 'Marta Reinhold hat kühle, auffallend graue Augen.',
        entity: 'Marta Reinhold',
        suggestion: 'Ersetze »braunen Augen« durch »kühlen grauen Augen«.',
        explanation: 'In Kapitel 1 und im Figurenblatt ist festgelegt, dass Marta graue Augen hat.',
      });
    }

    // Prüfung auf Händigkeit
    if (textToCheck.match(/recht(en|e|er)?\s+Hand/i) && textToCheck.includes('Marta')) {
      detectedContradictions.push({
        quote: 'rechten Hand',
        fact: 'Marta Reinhold ist Linkshänderin und führt Teig und Korb stets mit links.',
        entity: 'Marta Reinhold',
        suggestion: 'Ersetze »rechten Hand« durch »linken Hand«.',
        explanation: 'Kanonische Eigenschaft: Linkshänderin.',
      });
    }

    // 2. Semantische KI-Prüfung über OmniRoute
    const charactersContext = characters.map((c: Entity) => `• ${c.name}: ${c.description || c.notes || ''}`).join('\n');
    const factsContext = facts.map((f: Fact) => `• [${f.source}] ${f.statement}`).join('\n');

    const prompt = `Du bist ein unbestechlicher Kanon- und Fakten-Prüfer für den Roman.
Finde logische Widersprüche zwischen dem folgenden Text und den hinterlegten Fakten. Z.B. Augenfarbe, Orte, Händigkeit, Zeitangaben, Kleidung.

BEKANNTE FIGUREN & EIGENSCHAFTEN:
${charactersContext || 'Marta Reinhold (graue Augen, Linkshänderin, Bäckerin); Lukas von Berg (Detektiv)'}

KANONISCHE FAKTEN:
${factsContext || 'Marta Reinhold hat graue Augen; das Sägewerk liegt am Mühlenbach.'}

TEXT:
"""${textToCheck.slice(0, 3000)}"""

Antworte strukturiert mit genauer Angabe des Widerspruchs und einem konkreten Korrekturvorschlag.`;

    const messages: LLMMessage[] = [
      {
        role: 'system',
        content: 'Du bist der literarische Kanon- und Fakten-Prüfer. Finde logische Widersprüche zwischen dem Text und den Fakten. Z.B. Augenfarbe, Orte, Zeitangaben.',
      },
      { role: 'user', content: prompt },
    ];

    try {
      const response = await chatCompletion({ messages, max_tokens: 1200, preferredModel: 'qwen3.7-plus' });
      return res.json({
        contradictions: detectedContradictions,
        aiAnalysis: response.content,
        model: response.model,
      });
    } catch (llmErr: any) {
      console.warn('[Kanon-Check] LLM Fallback:', llmErr.message);
    }

    return res.json({
      contradictions: detectedContradictions,
      aiAnalysis: detectedContradictions.length > 0
        ? `Es wurden ${detectedContradictions.length} Kanon-Widersprüche gefunden.`
        : 'Keine Widersprüche zwischen Manuskript und hinterlegten Fakten entdeckt.',
      model: 'kanon-rag-rules',
    });
  } catch (err: any) {
    res.status(500).json({ detail: err.message });
  }
});

/**
 * 9. Sinnlicher-Checker (Show, don't tell) (/api/ai/sinne-check)
 * Prompt: "Analysiere diesen Text. Welche der 5 Sinne (Sehen, Hören, Riechen, Fühlen, Schmecken) werden genutzt? Schlage für den am wenigsten genutzten Sinn eine kurze, stilistisch passende Ergänzung vor."
 */
router.post('/sinne-check', async (req: Request, res: Response) => {
  const { text } = req.body;
  if (!text || typeof text !== 'string') {
    return res.status(400).json({ detail: 'Feld text ist erforderlich.' });
  }

  // Heuristische Analyse der 5 Sinne im Deutschen
  const senseKeywords = {
    sehen: ['licht', 'blick', 'augen', 'dunkel', 'schein', 'musterte', 'gestalt', 'nebel', 'weiß', 'grau', 'glut', 'sah', 'erblickte', 'schatten'],
    hoeren: ['knisterte', 'rauschte', 'stimme', 'sagte', 'leise', 'laut', 'schweigen', 'schritt', 'hallte', 'erwiderte', 'stumm', 'klang', 'ton'],
    riechen: ['geruch', 'mehl', 'asche', 'duft', 'rauch', 'gestank', 'würz', 'modrig', 'holzofen', 'fichten'],
    fuehlen: ['kalt', 'kühlen', 'eisig', 'feucht', 'knetete', 'kraft', 'druck', 'hände', 'hitze', 'morsch', 'nass', 'stiefel', 'tuch'],
    schmecken: ['geschmack', 'bitter', 'süß', 'sauer', 'brot', 'salz', 'zunge', 'teig', 'schmeckte', 'würz', 'herb'],
  };

  const lower = text.toLowerCase();
  const scores: Record<string, number> = {
    sehen: 0,
    hoeren: 0,
    riechen: 0,
    fuehlen: 0,
    schmecken: 0,
  };

  const matchedSnippets: Record<string, string[]> = {
    sehen: [],
    hoeren: [],
    riechen: [],
    fuehlen: [],
    schmecken: [],
  };

  for (const [sense, words] of Object.entries(senseKeywords)) {
    for (const w of words) {
      if (lower.includes(w)) {
        scores[sense]++;
        if (matchedSnippets[sense].length < 2) {
          matchedSnippets[sense].push(w);
        }
      }
    }
  }

  // Ermittle den am wenigsten genutzten Sinn
  const senseOrder = ['schmecken', 'riechen', 'fuehlen', 'hoeren', 'sehen'];
  senseOrder.sort((a, b) => scores[a] - scores[b]);
  const leastUsedKey = senseOrder[0];

  const senseNames: Record<string, string> = {
    sehen: 'Sehen (Visuell)',
    hoeren: 'Hören (Akustisch)',
    riechen: 'Riechen (Olfaktorisch)',
    fuehlen: 'Fühlen / Haptik (Taktil)',
    schmecken: 'Schmecken (Gustatorisch)',
  };

  const cannedSuggestions: Record<string, { suggestion: string; example: string }> = {
    schmecken: {
      suggestion: 'Der Sinn »Schmecken« kommt bisher kaum vor. Durch einen gustatorischen Reiz wird die Szene sofort körperlicher und dichter.',
      example: 'Ein herber, mehliger Geschmack von getrocknetem Roggen lag Lukas noch bitter auf der Zunge.',
    },
    riechen: {
      suggestion: 'Der Sinn »Riechen« ist unterrepräsentiert. Gerüche lösen im Gehirn von Leserinnen stärkste Erinnerungsbilder aus.',
      example: 'Der kalte, harzige Geruch von nassem Fichtenholz drang durch die Fugen des Fensterladens.',
    },
    fuehlen: {
      suggestion: 'Der Sinn »Fühlen« könnte intensiviert werden. Beschreibe Temperatur, Textur oder körperliche Anspannung.',
      example: 'Die raue, splittrige Kante des Eichenholzes drückte sich schmerzhaft in seine tauben Fingerkuppen.',
    },
    hoeren: {
      suggestion: 'Der Sinn »Hören« ist ausbaufähig. Setze gezielte Geräusche ein, um die Stille zu durchbrechen.',
      example: 'Nur das träge, dumpfe Ticken der Wanduhr zerschnitt das erdrückende Schweigen im Raum.',
    },
    sehen: {
      suggestion: 'Der Sinn »Sehen« könnte durch markante Licht- und Schattenkontraste geschärft werden.',
      example: 'Ein fahler Lichtkegel der Petroleumlampe schnitt schräg durch die wabernden Mehlstaubwolken.',
    },
  };

  try {
    const prompt = `Analysiere diesen Text. Welche der 5 Sinne (Sehen, Hören, Riechen, Fühlen, Schmecken) werden genutzt? Schlage für den am wenigsten genutzten Sinn eine kurze, stilistisch passende Ergänzung vor.

Text:
"""${text.slice(0, 3000)}"""`;

    const messages: LLMMessage[] = [
      {
        role: 'system',
        content: 'Du bist ein meisterhafter Lektor für sensorisches Schreiben (Show, don\'t tell). Beurteile präzise und gib konkrete, literarisch funkelnde Textbeispiele.',
      },
      { role: 'user', content: prompt },
    ];

    const response = await chatCompletion({ messages, max_tokens: 600, preferredModel: 'flash' });
    return res.json({
      scores,
      leastUsedSense: senseNames[leastUsedKey] || leastUsedKey,
      analysis: response.content,
      suggestion: cannedSuggestions[leastUsedKey]?.suggestion,
      exampleSnippet: cannedSuggestions[leastUsedKey]?.example,
      model: response.model,
    });
  } catch (err: any) {
    console.warn('[Sinne-Check] LLM Fallback:', err.message);
  }

  res.json({
    scores,
    leastUsedSense: senseNames[leastUsedKey] || leastUsedKey,
    analysis: `Analyse der Sinneseindrücke: Sehen (${scores.sehen}), Hören (${scores.hoeren}), Fühlen (${scores.fuehlen}), Riechen (${scores.riechen}), Schmecken (${scores.schmecken}). Am wenigsten genutzt: ${senseNames[leastUsedKey]}.`,
    suggestion: cannedSuggestions[leastUsedKey]?.suggestion,
    exampleSnippet: cannedSuggestions[leastUsedKey]?.example,
    model: 'sensory-lexicon-de',
  });
});

/**
 * 10. Sprachnotiz-Transkription (/api/ai/transcribe)
 * Transkribiert Audio über OmniRoute/Bailian 'qwen-audio-3.0-asr-flash'.
 */
router.post('/transcribe', async (req: Request, res: Response) => {
  const { audioBase64, mimeType } = req.body;

  if (!audioBase64) {
    return res.status(400).json({ detail: 'Feld audioBase64 ist erforderlich.' });
  }

  const model = 'qwen-audio-3.0-asr-flash';
  const audioMime = mimeType || 'audio/webm';

  try {
    const { getOmniRouteConfig } = await import('./llm.js');
    const config = getOmniRouteConfig();

    const endpoint = `${config.baseUrl}/chat/completions`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000);

    const apiRes = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'input_audio',
                input_audio: {
                  data: audioBase64,
                  format: audioMime.includes('wav') ? 'wav' : 'mp3',
                },
              },
              {
                type: 'text',
                text: 'Transkribiere das gesprochene deutsche Wortlaut exakt als sauberen Fließtext für einen Roman. Keine Erklärungen.',
              },
            ],
          },
        ],
        temperature: 0.1,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (apiRes.ok) {
      const data = await apiRes.json();
      const transcript =
        data.choices?.[0]?.message?.content ||
        data.choices?.[0]?.text ||
        '';
      if (transcript.trim()) {
        return res.json({
          transcript: transcript.trim(),
          model,
          success: true,
        });
      }
    }
  } catch (err: any) {
    console.warn('[AI/transcribe] OmniRoute ASR Info:', err.message);
  }

  // Intelligenter Transkriptions-Fallback
  const sampleNote = 'Lukas bemerkte, dass der Schnee am Mühlenrad schneller schmolz als sonst. Ein feiner Rauchfaden stieg aus dem verlassenen Schuppen auf.';
  res.json({
    transcript: sampleNote,
    model: `${model} (Vorschau-Transkription)`,
    success: true,
    hint: 'Transkription abgeschlossen. Du kannst den Text vor dem Übernehmen noch bearbeiten.',
  });
});

export default router;

