import type { LiveTranscriptionHandle } from './speech-recognition';

export interface LiveTranscriptionOptions {
  language: string | null;
  contextualStrings: string[];
  onError: (message: string) => void;
}

export function isLiveTranscriptionAvailable(): boolean {
  return false;
}

export async function requestSpeechRecognitionPermission(): Promise<boolean> {
  return false;
}

/** The web build has no on-device recogniser; the provider engine covers it. */
export function startLiveTranscription(_options: LiveTranscriptionOptions): LiveTranscriptionHandle {
  return {
    stop: async () => null,
    abort: () => undefined,
  };
}