import { ExpoSpeechRecognitionModule } from 'expo-speech-recognition';

export interface LiveTranscriptionHandle {
  /** Stops live recognition and resolves with the final transcript, if any. */
  stop(): Promise<{ text: string; confidence: number | null } | null>;
  abort(): void;
}

export interface LiveTranscriptionOptions {
  language: string | null;
  contextualStrings: string[];
  onError: (message: string) => void;
}

const STOP_TIMEOUT_MS = 8000;

export function isLiveTranscriptionAvailable(): boolean {
  return ExpoSpeechRecognitionModule.isRecognitionAvailable();
}

export async function requestSpeechRecognitionPermission(): Promise<boolean> {
  const response = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
  return response.granted;
}

/**
 * Live on-device speech recognition is used only for moments recorded with the
 * Android engine. Audio is still captured by the recorder so the moment keeps
 * a durable copy; the engine is just how a spoken moment becomes text.
 */
export function startLiveTranscription(options: LiveTranscriptionOptions): LiveTranscriptionHandle {
  let transcript = '';
  let confidence: number | null = null;
  let stopped = false;
  let timedOut = false;

  const finish = new Promise<null>((resolve) => {
    const stopTimer = setTimeout(() => {
      timedOut = true;
      resolve(null);
    }, STOP_TIMEOUT_MS);

    const onEnd = () => {
      clearTimeout(stopTimer);
      resolve(null);
    };
    const onError = (event: { message?: string; code?: string }) => {
      options.onError(event.message ?? event.code ?? 'Speech recognition failed');
      clearTimeout(stopTimer);
      resolve(null);
    };
    const onResult = (event: { isFinal: boolean; results: { transcript: string; confidence: number }[] }) => {
      if (event.results.length > 0) {
        transcript = event.results[0].transcript;
        const raw = event.results[0].confidence;
        confidence = raw >= 0 ? raw : null;
      }
      if (event.isFinal) {
        clearTimeout(stopTimer);
        resolve(null);
      }
    };

    const resultSub = ExpoSpeechRecognitionModule.addListener('result', onResult as never);
    const endSub = ExpoSpeechRecognitionModule.addListener('end', onEnd as never);
    const errorSub = ExpoSpeechRecognitionModule.addListener('error', onError as never);

    ExpoSpeechRecognitionModule.start({
      lang: options.language ?? 'en',
      interimResults: true,
      continuous: true,
      maxAlternatives: 1,
      contextualStrings: options.contextualStrings,
    });

    const cleanupSubs = () => {
      resultSub.remove();
      endSub.remove();
      errorSub.remove();
    };

    finish.then(() => {
      cleanupSubs();
      stopped = true;
    });
  });

  return {
    stop: async () => {
      if (stopped) {
        return transcript === '' ? null : { text: transcript, confidence };
      }
      ExpoSpeechRecognitionModule.stop();
      await finish;
      void timedOut;
      return transcript === '' ? null : { text: transcript, confidence };
    },
    abort: () => {
      if (!stopped) {
        ExpoSpeechRecognitionModule.abort();
      }
    },
  };
}