import { OpenAiCompatibleProvider } from './openai-compatible';
import type { AiState } from '../models';

export type ChatRole = 'system' | 'user' | 'assistant';

export interface ChatMessage {
  role: ChatRole;
  content: string;
}

export interface TokenUsage {
  inputTokens: number;
  outputTokens: number;
}

export interface TranscriptionInput {
  uri: string;
  mimeType: string;
  fileName: string;
}

export interface TranscriptionResult {
  text: string;
  confidence: number | null;
}

export interface ChatOptions {
  model: string;
  temperature?: number;
  maxTokens?: number;
  json?: boolean;
}

export interface ChatResult {
  text: string;
  usage: TokenUsage | null;
}

/**
 * The only way anything under src/ai reaches the network. Implementations are
 * injected; tests use a fake transport and never touch fetch.
 */
export interface AiProvider {
  transcribeAudio(
    input: TranscriptionInput,
    model: string,
    language: string | null
  ): Promise<TranscriptionResult>;
  chat(messages: ChatMessage[], options: ChatOptions): Promise<ChatResult>;
}

export { ProviderError } from './errors';
export type { ProviderErrorKind } from './errors';

const LOOPBACK_HOSTS = ['localhost', '127.0.0.1', '::1', '10.0.2.2'];

export function validateBaseUrl(value: string): string | null {
  const trimmed = value.trim();
  let url: URL;
  try {
    url = new URL(trimmed);
  } catch {
    return null;
  }
  if (url.protocol === 'https:') {
    return url.toString().replace(/\/+$/, '');
  }
  if (url.protocol === 'http:' && LOOPBACK_HOSTS.includes(url.hostname)) {
    return url.toString().replace(/\/+$/, '');
  }
  return null;
}

export interface ProviderOptions {
  llmBaseUrl: string;
  llmApiKey: string | null;
  llmModel: string;
  sttBaseUrl: string | null;
  sttApiKey: string | null;
  sttModel: string | null;
}

export function buildProvider(state: AiState): AiProvider | null {
  if (!state.enabled) {
    return null;
  }
  const llmBaseUrl = state.llmBaseUrl ? validateBaseUrl(state.llmBaseUrl) : null;
  const sttBaseUrl = state.sttBaseUrl ? validateBaseUrl(state.sttBaseUrl) : null;
  if (!llmBaseUrl || !state.llmModel) {
    return null;
  }
  return new OpenAiCompatibleProvider({
    llmBaseUrl,
    llmApiKey: state.llmApiKey,
    llmModel: state.llmModel,
    sttBaseUrl: sttBaseUrl ?? llmBaseUrl,
    sttApiKey: state.sttApiKey,
    sttModel: state.sttModel,
  });
}

export function summarizeText(value: string, maxChars: number): string {
  const trimmed = value.trim().replace(/\s+/g, ' ');
  if (trimmed.length <= maxChars) {
    return trimmed;
  }
  return `${trimmed.slice(0, maxChars)}…`;
}