import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { getOmniRouteConfig, LLMConfigError } from '../lib/llm.js';

describe('P7: OMNIR_MODELS Validierung', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    // Reset env
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('sollte bailian-coding-plan/* Modelle akzeptieren', () => {
    process.env.OMNIR_URL = 'http://localhost:20128/v1';
    process.env.OMNIR_KEY = 'test-key';
    process.env.OMNIR_MODELS = 'bailian-coding-plan/qwen3.7-plus,bailian-coding-plan/qwen3.6-flash';

    const config = getOmniRouteConfig();
    expect(config.models).toHaveLength(2);
    expect(config.models[0]).toBe('bailian-coding-plan/qwen3.7-plus');
    expect(config.models[1]).toBe('bailian-coding-plan/qwen3.6-flash');
  });

  it('sollte Modelle ohne bailian-coding-plan/* Präfix ablehnen', () => {
    process.env.OMNIR_URL = 'http://localhost:20128/v1';
    process.env.OMNIR_KEY = 'test-key';
    process.env.OMNIR_MODELS = 'qwen3.7-plus,llama3.1:8b';

    expect(() => getOmniRouteConfig()).toThrow(LLMConfigError);
    expect(() => getOmniRouteConfig()).toThrow(/bailian-coding-plan/);
  });

  it('sollte gemischte Modelle ablehnen', () => {
    process.env.OMNIR_URL = 'http://localhost:20128/v1';
    process.env.OMNIR_KEY = 'test-key';
    process.env.OMNIR_MODELS = 'bailian-coding-plan/qwen3.7-plus,qwen3.6-flash';

    expect(() => getOmniRouteConfig()).toThrow(LLMConfigError);
    expect(() => getOmniRouteConfig()).toThrow(/qwen3.6-flash/);
  });

  it('sollte leere OMNIR_MODELS ablehnen', () => {
    process.env.OMNIR_URL = 'http://localhost:20128/v1';
    process.env.OMNIR_KEY = 'test-key';
    process.env.OMNIR_MODELS = '';

    expect(() => getOmniRouteConfig()).toThrow(LLMConfigError);
  });

  it('sollte fehlende OMNIR_URL ablehnen', () => {
    process.env.OMNIR_KEY = 'test-key';
    process.env.OMNIR_MODELS = 'bailian-coding-plan/qwen3.7-plus';

    expect(() => getOmniRouteConfig()).toThrow(LLMConfigError);
    expect(() => getOmniRouteConfig()).toThrow(/OMNIR_URL/);
  });

  it('sollte fehlende OMNIR_KEY ablehnen', () => {
    process.env.OMNIR_URL = 'http://localhost:20128/v1';
    process.env.OMNIR_MODELS = 'bailian-coding-plan/qwen3.7-plus';

    expect(() => getOmniRouteConfig()).toThrow(LLMConfigError);
    expect(() => getOmniRouteConfig()).toThrow(/OMNIR_KEY/);
  });
});
