import type {
  AiProvider,
  ChatMessage,
  ChatOptions,
  ChatResult,
  ProviderOptions,
  TokenUsage,
  TranscriptionInput,
  TranscriptionResult,
} from './provider';
import { ProviderError } from './errors';

function toProviderError(status: number, body: string): ProviderError {
  if (status === 401 || status === 403) {
    return new ProviderError('auth', `Authentication failed (HTTP ${status}).`);
  }
  if (status === 429) {
    return new ProviderError('quota', 'The provider returned “rate limited” (HTTP 429).');
  }
  if (status >= 400 && status < 500) {
    return new ProviderError('invalid-request', `The provider rejected the request (HTTP ${status}).`);
  }
  if (status >= 500) {
    return new ProviderError('server', `The provider errored on its side (HTTP ${status}).`);
  }
  const preamble = body ? `: ${body.slice(0, 200)}` : '';
  return new ProviderError('invalid-request', `Unexpected HTTP ${status}${preamble}`);
}

/**
 * A speaker, OpenAI-compatible HTTP transport. The extraction job and the
 * transcription job sit on the same base URL unless the user configured a
 * dedicated transcription server.
 */
export class OpenAiCompatibleProvider implements AiProvider {
  private readonly llmBaseUrl: string;
  private readonly llmApiKey: string | null;
  private readonly llmModel: string;
  private readonly sttBaseUrl: string;
  private readonly sttApiKey: string | null;
  private readonly sttModel: string | null;

  constructor(options: ProviderOptions) {
    this.llmBaseUrl = options.llmBaseUrl;
    this.llmApiKey = options.llmApiKey;
    this.llmModel = options.llmModel;
    this.sttBaseUrl = options.sttBaseUrl ?? options.llmBaseUrl;
    this.sttApiKey = options.sttApiKey;
    this.sttModel = options.sttModel;
  }

  parseUsage(value: unknown): TokenUsage | null {
    if (typeof value !== 'object' || value === null) {
      return null;
    }
    const prompt = (value as { prompt_tokens?: unknown }).prompt_tokens;
    const completion = (value as { completion_tokens?: unknown }).completion_tokens;
    if (typeof prompt !== 'number' || typeof completion !== 'number') {
      return null;
    }
    return { inputTokens: prompt, outputTokens: completion };
  }

  async chat(messages: ChatMessage[], options: ChatOptions): Promise<ChatResult> {
    const body: Record<string, unknown> = {
      model: options.model,
      messages: messages.map((message) => ({ role: message.role, content: message.content })),
    };
    if (options.temperature !== undefined) {
      body.temperature = options.temperature;
    }
    if (options.maxTokens !== undefined) {
      body.max_tokens = options.maxTokens;
    }
    if (options.json) {
      body.response_format = { type: 'json_object' };
    }

    let response: Response;
    try {
      response = await fetch(`${this.llmBaseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          ...(this.llmApiKey ? { Authorization: `Bearer ${this.llmApiKey}` } : {}),
        },
        body: JSON.stringify(body),
      });
    } catch {
      throw new ProviderError('network', 'Could not reach the provider.');
    }

    const rawText = await response.text();
    if (!response.ok) {
      throw toProviderError(response.status, rawText);
    }

    let json: Record<string, unknown>;
    try {
      json = JSON.parse(rawText);
    } catch {
      throw new ProviderError('invalid-request', 'The provider returned unreadable JSON.');
    }

    const choice = Array.isArray(json.choices) ? (json.choices[0] as Record<string, unknown> | undefined) : undefined;
    const content = choice?.message && typeof choice.message === 'object'
      ? (choice.message as { content?: unknown }).content
      : undefined;
    if (typeof content !== 'string') {
      throw new ProviderError('invalid-request', 'The provider response contained no message content.');
    }
    return {
      text: content,
      usage: this.parseUsage(json.usage),
    };
  }

  async transcribeAudio(
    input: TranscriptionInput,
    model: string,
    language: string | null
  ): Promise<TranscriptionResult> {
    const form = new FormData();
    form.append('model', model);
    form.append('language', language ?? '');
    form.append(
      'file',
      { uri: input.uri, name: input.fileName, type: input.mimeType } as unknown as Blob
    );

    let response: Response;
    try {
      response = await fetch(`${this.sttBaseUrl}/audio/transcriptions`, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          ...(this.sttApiKey ? { Authorization: `Bearer ${this.sttApiKey}` } : {}),
        },
        body: form,
      });
    } catch {
      throw new ProviderError('network', 'Could not reach the transcription provider.');
    }

    const rawText = await response.text();
    if (!response.ok) {
      throw toProviderError(response.status, rawText);
    }

    let json: Record<string, unknown>;
    try {
      json = JSON.parse(rawText);
    } catch {
      throw new ProviderError('invalid-request', 'The provider returned unreadable JSON.');
    }
    const text = json.text;
    if (typeof text !== 'string' || text.trim() === '') {
      throw new ProviderError('audio', 'No transcript was recognised in the audio.');
    }
    return { text: text.trim(), confidence: null };
  }
}