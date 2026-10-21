/**
 * OmniRoute LLM Client (OpenAI-kompatibel)
 * Spezifikation: TEIL A
 *
 * - Fail-closed: Fehlen Konfigurationsvariablen, wird KEIN Aufruf gemacht (HTTP 503).
 * - Multi-Modell Fallback: Bei 429 oder 5xx wird das nächste Modell aus OMNIR_MODELS aufgerufen.
 * - Timeout: 60 Sekunden pro Versuch.
 * - Sanitized Logging: Niemals Prompts, Manuskripttexte oder API-Keys loggen; nur Modell, Dauer und Token.
 */

export interface LLMMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface LLMRequestOptions {
  messages: LLMMessage[];
  temperature?: number;
  max_tokens?: number;
  preferredModel?: string;
}

export interface LLMResponse {
  content: string;
  model: string;
  durationMs: number;
  usage?: {
    prompt_tokens?: number;
    completion_tokens?: number;
    total_tokens?: number;
  };
}

export class LLMConfigError extends Error {
  public statusCode = 503;
  constructor(message: string) {
    super(message);
    this.name = 'LLMConfigError';
  }
}

interface OmniRouteConfig {
  baseUrl: string;
  apiKey: string;
  models: string[];
}

/**
 * Liest die OmniRoute-Umgebungsvariablen aus (Fail-closed).
 */
export function getOmniRouteConfig(): OmniRouteConfig {
  const url = process.env.OMNIR_URL?.trim();
  const key = process.env.OMNIR_KEY?.trim();
  const rawModels = process.env.OMNIR_MODELS?.trim();

  const missing: string[] = [];
  if (!url) missing.push('OMNIR_URL');
  if (!key) missing.push('OMNIR_KEY');
  if (!rawModels) missing.push('OMNIR_MODELS');

  if (missing.length > 0) {
    throw new LLMConfigError(
      `KI-Dienst nicht konfiguriert: Die Umgebungsvariable(n) ${missing.join(', ')} fehlen auf dem Server. Bitte prüfe die .env-Datei.`
    );
  }

  const models = rawModels!.split(',').map((m) => m.trim()).filter(Boolean);
  if (models.length === 0) {
    throw new LLMConfigError('KI-Dienst nicht konfiguriert: OMNIR_MODELS enthält keine gültigen Modellbezeichnungen.');
  }

  // Prüfe, dass alle Modelle das bailian-coding-plan/* Präfix haben
  const invalidModels = models.filter(m => !m.startsWith('bailian-coding-plan/'));
  if (invalidModels.length > 0) {
    throw new LLMConfigError(
      `Ungültige Modelle in OMNIR_MODELS: ${invalidModels.join(', ')}. ` +
      `Alle Modelle müssen das Präfix "bailian-coding-plan/" haben (z.B. bailian-coding-plan/qwen3.7-plus).`
    );
  }

  // Normalisiere Basis-URL ohne abschließenden Schrägstrich
  const normalizedUrl = url!.replace(/\/+$/, '');

  return {
    baseUrl: normalizedUrl,
    apiKey: key!,
    models,
  };
}

/**
 * Führt einen Chat-Completion-Aufruf mit automatischem Modell-Fallback und 60s Timeout durch.
 */
export async function chatCompletion(options: LLMRequestOptions): Promise<LLMResponse> {
  const config = getOmniRouteConfig();
  let lastError: Error | null = null;

  // Modelle sortieren basierend auf options.preferredModel (z.B. 'flash' oder 'qwen3.7-plus')
  const modelsToTry = [...config.models];
  if (options.preferredModel) {
    const pref = options.preferredModel.toLowerCase();
    modelsToTry.sort((a, b) => {
      const aLower = a.toLowerCase();
      const bLower = b.toLowerCase();
      const aScore = aLower.includes(pref) ? 2 : (pref.includes('flash') && (aLower.includes('flash') || aLower.includes('8b') || aLower.includes('mini'))) ? 1 : (pref.includes('qwen') && (aLower.includes('qwen') || aLower.includes('plus') || aLower.includes('14b') || aLower.includes('70b'))) ? 1 : 0;
      const bScore = bLower.includes(pref) ? 2 : (pref.includes('flash') && (bLower.includes('flash') || bLower.includes('8b') || bLower.includes('mini'))) ? 1 : (pref.includes('qwen') && (bLower.includes('qwen') || bLower.includes('plus') || bLower.includes('14b') || bLower.includes('70b'))) ? 1 : 0;
      return bScore - aScore;
    });
  }

  for (let i = 0; i < modelsToTry.length; i++) {
    const model = modelsToTry[i];
    const startTime = Date.now();

    try {
      // 60 Sekunden Timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60000);

      const endpoint = `${config.baseUrl}/chat/completions`;
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${config.apiKey}`,
        },
        body: JSON.stringify({
          model,
          messages: options.messages,
          temperature: options.temperature ?? 0.7,
          max_tokens: options.max_tokens ?? 2048,
          stream: false,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      const durationMs = Date.now() - startTime;

      if (!res.ok) {
        const status = res.status;
        let errSnippet = `Status ${status}`;
        try {
          const errData = await res.json();
          errSnippet = errData?.error?.message || errSnippet;
        } catch {
          // ignore parse error
        }

        // Sanitized Log: Niemals Manuskript oder Prompts loggen!
        console.warn(`[LLM] Aufruf für Modell '${model}' fehlgeschlagen: Status ${status} (${durationMs}ms)`);

        // Bei 429 (Rate Limit) oder 5xx (Serverfehler) nächstes Modell versuchen
        if ((status === 429 || status >= 500) && i < config.models.length - 1) {
          lastError = new Error(`Modell '${model}' meldet ${errSnippet}. Versuche Fallback...`);
          continue;
        }

        throw new Error(`Fehler bei KI-Anfrage: ${errSnippet}`);
      }

      const data = await res.json();
      const content = data.choices?.[0]?.message?.content || '';
      const usage = data.usage;

      // Sanitized Logging: Nur Modell, Dauer und Token-Zahlen
      console.log(
        `[LLM] Erfolgreich · Modell: ${model} · Dauer: ${durationMs}ms · Prompt-Tokens: ${usage?.prompt_tokens ?? 'k.A.'} · Completion-Tokens: ${usage?.completion_tokens ?? 'k.A.'} · Gesamt: ${usage?.total_tokens ?? 'k.A.'}`
      );

      return {
        content,
        model,
        durationMs,
        usage,
      };
    } catch (err: any) {
      const durationMs = Date.now() - startTime;
      const isAbort = err.name === 'AbortError' || err.message?.includes('aborted');
      const errMsg = isAbort ? 'Zeitüberschreitung (Timeout 60s)' : err.message || 'Netzwerkfehler';

      console.warn(`[LLM] Fehler bei Modell '${model}' nach ${durationMs}ms: ${errMsg}`);

      lastError = err;
      if (i < config.models.length - 1) {
        continue;
      }
    }
  }

  throw new Error(
    `Alle konfigurierten Modelle (${config.models.join(', ')}) waren nicht erreichbar oder überlastet: ${lastError?.message || 'Keine Verbindung'}`
  );
}

/**
 * Führt einen gestreamten Chat-Completion-Aufruf (SSE) mit Modell-Fallback durch.
 */
export async function* streamChatCompletion(
  options: LLMRequestOptions
): AsyncGenerator<{ delta: string; model: string }, void, unknown> {
  const config = getOmniRouteConfig();
  let streamResponse: Response | null = null;
  let activeModel = config.models[0];

  for (let i = 0; i < config.models.length; i++) {
    const model = config.models[i];
    activeModel = model;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60000);

      const endpoint = `${config.baseUrl}/chat/completions`;
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${config.apiKey}`,
        },
        body: JSON.stringify({
          model,
          messages: options.messages,
          temperature: options.temperature ?? 0.7,
          max_tokens: options.max_tokens ?? 2048,
          stream: true,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!res.ok) {
        const status = res.status;
        console.warn(`[LLM-Stream] Modell '${model}' Status ${status}`);
        if ((status === 429 || status >= 500) && i < config.models.length - 1) {
          continue;
        }
        throw new Error(`KI-Streaming Fehler (${status})`);
      }

      streamResponse = res;
      break;
    } catch (err) {
      if (i < config.models.length - 1) continue;
      throw err;
    }
  }

  if (!streamResponse || !streamResponse.body) {
    throw new Error('Kein Streaming-Antwortkanal verfügbar.');
  }

  const reader = streamResponse.body.getReader();
  const decoder = new TextDecoder('utf-8');
  let buffer = '';

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith(':')) continue;
        if (trimmed === 'data: [DONE]') return;

        if (trimmed.startsWith('data: ')) {
          try {
            const parsed = JSON.parse(trimmed.slice(6));
            const delta = parsed.choices?.[0]?.delta?.content || '';
            if (delta) {
              yield { delta, model: activeModel };
            }
          } catch {
            // Unvollständiges JSON überspringen
          }
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}
