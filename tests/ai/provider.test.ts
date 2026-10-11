import type { AiState } from '../../src/models';
import {
  buildProvider,
  ProviderError,
  summarizeText,
  validateBaseUrl,
} from '../../src/ai/provider';

function aiState(partial: Partial<AiState>): AiState {
  return {
    llmBaseUrl: partial.llmBaseUrl ?? null,
    llmApiKey: partial.llmApiKey ?? null,
    llmModel: partial.llmModel ?? null,
    sttEngine: partial.sttEngine ?? 'openai-compatible',
    sttBaseUrl: partial.sttBaseUrl ?? null,
    sttApiKey: partial.sttApiKey ?? null,
    sttModel: partial.sttModel ?? null,
    sttLanguage: partial.sttLanguage ?? null,
    enabled: partial.enabled ?? true,
    lastError: partial.lastError ?? null,
  };
}

describe('validateBaseUrl', () => {
  it('accepts https and strips a trailing slash', () => {
    expect(validateBaseUrl('https://api.example.com/v1/')).toBe('https://api.example.com/v1');
  });

  it('accepts plain http only for loopback hosts', () => {
    expect(validateBaseUrl('http://localhost:1234/v1')).toBe('http://localhost:1234/v1');
    expect(validateBaseUrl('http://127.0.0.1:1234')).toBe('http://127.0.0.1:1234');
    expect(validateBaseUrl('http://10.0.2.2:1234/v1')).toBe('http://10.0.2.2:1234/v1');
    expect(validateBaseUrl('http://api.example.com/v1')).toBeNull();
  });

  it('rejects nonsense and non-http protocols', () => {
    expect(validateBaseUrl('not a url')).toBeNull();
    expect(validateBaseUrl('ftp://api.example.com')).toBeNull();
    expect(validateBaseUrl('')).toBeNull();
  });
});

describe('buildProvider', () => {
  it('returns null when AI is disabled', () => {
    expect(buildProvider(aiState({ enabled: false, llmBaseUrl: 'https://x.test', llmModel: 'm' }))).toBeNull();
  });

  it('returns null without a valid base URL or model', () => {
    expect(buildProvider(aiState({ llmBaseUrl: 'http://bad.example', llmModel: 'm' }))).toBeNull();
    expect(buildProvider(aiState({ llmBaseUrl: 'https://x.test', llmModel: '' }))).toBeNull();
  });

  it('builds a provider when enabled with a valid https endpoint and model', () => {
    const provider = buildProvider(aiState({ llmBaseUrl: 'https://x.test/v1', llmModel: 'gpt-x' }));
    expect(provider).not.toBeNull();
  });
});

describe('summarizeText', () => {
  it('collapses whitespace and keeps short text intact', () => {
    expect(summarizeText('  hello \n  world  ', 50)).toBe('hello world');
  });

  it('truncates long text with an ellipsis', () => {
    const long = 'a'.repeat(30);
    const result = summarizeText(long, 10);
    expect(result).toBe(`${'a'.repeat(10)}…`);
  });
});

describe('ProviderError', () => {
  it('carries its kind and name', () => {
    const error = new ProviderError('quota', 'slow down');
    expect(error.kind).toBe('quota');
    expect(error.name).toBe('ProviderError');
    expect(error.message).toBe('slow down');
  });
});
