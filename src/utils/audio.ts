import { File, Paths } from 'expo-file-system';
import { toFilePath } from './paths';

export const MOMENT_AUDIO_EXTENSION = '.m4a';

/**
 * The directory where session audio files live, inside the app's document
 * directory so it survives while the app is installed and is covered by backup.
 */
export function sessionAudioDirectory(): File {
  return new File(Paths.document, 'voice');
}

export function momentAudioPath(sessionId: number, momentId: number): string {
  const directory = sessionAudioDirectory();
  directory.create({ intermediates: true });
  return toFilePath(new File(directory, `session-${sessionId}-moment-${momentId}${MOMENT_AUDIO_EXTENSION}`).uri);
}

export function audioFileUri(path: string): string {
  return new File(path).uri;
}

export function deleteAudioFile(path: string): void {
  const file = new File(path);
  if (file.exists) {
    file.delete();
  }
}

/** Moves a finished recording into the session's permanent home. */
export async function storeMomentAudio(
  fromUri: string,
  sessionId: number,
  momentId: number
): Promise<string> {
  const source = new File(fromUri);
  const targetPath = momentAudioPath(sessionId, momentId);
  const target = new File(targetPath);
  if (!source.exists) {
    return targetPath;
  }
  if (target.exists) {
    target.delete();
  }
  await source.move(target);
  return targetPath;
}