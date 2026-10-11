import type { AiProvider, TranscriptionResult } from './provider';
import { ProviderError } from './provider';
import type { LiveTranscriptionHandle } from './speech-recognition';

export const STT_ENGINE_LABEL = 'openai-compatible';

export interface MomentTranscriptionRequest {
  uri: string | null;
  mimeType: string;
  fileName: string;
}

/**
 * Transcribes one closed moment through the configured provider. The moment's
 * audio is always written before this is called (idea.txt §4.1), and the result
 * is always treated as a candidate.
 */
export async function transcribeMomentWithProvider(
  provider: AiProvider,
  model: string | null,
  language: string | null,
  request: MomentTranscriptionRequest
): Promise<TranscriptionResult> {
  if (model === null || model.trim() === '') {
    throw new ProviderError('invalid-request', 'No transcription model is configured.');
  }
  if (request.uri === null) {
    throw new ProviderError('audio', 'This moment has no audio to transcribe.');
  }
  return provider.transcribeAudio(
    { uri: request.uri, mimeType: request.mimeType, fileName: request.fileName },
    model.trim(),
    language
  );
}

export type { LiveTranscriptionHandle };