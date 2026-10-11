import { OpenAiCompatibleProvider } from '../../src/ai/openai-compatible';
import { ProviderError } from '../../src/ai/provider';

function response(status: number, body: string): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    text: async () => body,
  } as unknown as Response;
}

function provider(): OpenAiCompatibleProvider {
  return new OpenAiCompatibleProvider({
    llmBaseUrl: 'https://api.example.com/v1',
    llmApiKey: 'secret-key',
    llmModel: 'gpt-x',
    sttBaseUrl: 'https://stt.example.com/v1',
    sttApiKey: 'stt-key',
    sttModel: 'whisper-x',
  });
}

describe('OpenAiCompatibleProvider.chat', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('POSTs messages and returns content plus usage', async () => {
    const fetchMock = jest.spyOn(globalThis, 'fetch').mockResolvedValue(
      response(200, JSON.stringify({
        choices: [{ message: { role: 'assistant', content: '{"dose_g":15}' } }],
        usage: { prompt_tokens: 120, completion_tokens: 30 },
      }))
    );

    const result = await provider().chat([{ role: 'user', content: 'hi' }], {
      model: 'gpt-x',
      temperature: 0.2,
      json: true,
    });

    expect(result.text).toBe('{"dose_g":15}');
    expect(result.usage).toEqual({ inputTokens: 120, outputTokens: 30 });

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('https://api.example.com/v1/chat/completions');
    const body = JSON.parse((init as RequestInit).body as string);
    expect(body.response_format).toEqual({ type: 'json_object' });
    expect((init as RequestInit).headers).toMatchObject({ Authorization: 'Bearer secret-key' });
  });

  it('maps HTTP 401 to an auth error', async () => {
    jest.spyOn(globalThis, 'fetch').mockResolvedValue(response(401, 'nope'));
    await expect(provider().chat([{ role: 'user', content: 'hi' }], { model: 'gpt-x' })).rejects.toMatchObject({
      kind: 'auth',
    });
  });

  it('maps HTTP 429 to a quota error', async () => {
    jest.spyOn(globalThis, 'fetch').mockResolvedValue(response(429, 'slow'));
    const error = await provider()
      .chat([{ role: 'user', content: 'hi' }], { model: 'gpt-x' })
      .catch((caught: unknown) => caught);
    expect(error).toBeInstanceOf(ProviderError);
    expect((error as ProviderError).kind).toBe('quota');
  });

  it('maps a transport failure to a network error', async () => {
    jest.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('offline'));
    await expect(provider().chat([{ role: 'user', content: 'hi' }], { model: 'gpt-x' })).rejects.toMatchObject({
      kind: 'network',
    });
  });

  it('rejects a response without message content', async () => {
    jest.spyOn(globalThis, 'fetch').mockResolvedValue(response(200, JSON.stringify({ choices: [] })));
    await expect(provider().chat([{ role: 'user', content: 'hi' }], { model: 'gpt-x' })).rejects.toMatchObject({
      kind: 'invalid-request',
    });
  });
});

describe('OpenAiCompatibleProvider.transcribeAudio', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('POSTs multipart form data and returns the transcript', async () => {
    const fetchMock = jest.spyOn(globalThis, 'fetch').mockResolvedValue(
      response(200, JSON.stringify({ text: '  fifteen grams  ' }))
    );

    const result = await provider().transcribeAudio(
      { uri: 'file:///audio.m4a', mimeType: 'audio/m4a', fileName: 'moment.m4a' },
      'whisper-x',
      'en'
    );

    expect(result.text).toBe('fifteen grams');
    expect(fetchMock.mock.calls[0][0]).toBe('https://stt.example.com/v1/audio/transcriptions');
  });

  it('raises an audio error when nothing was recognised', async () => {
    jest.spyOn(globalThis, 'fetch').mockResolvedValue(response(200, JSON.stringify({ text: '   ' })));
    await expect(
      provider().transcribeAudio(
        { uri: 'file:///audio.m4a', mimeType: 'audio/m4a', fileName: 'moment.m4a' },
        'whisper-x',
        null
      )
    ).rejects.toMatchObject({ kind: 'audio' });
  });
});
