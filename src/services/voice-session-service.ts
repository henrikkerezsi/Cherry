import type {
  AudioRetentionPolicy,
  PhaseMarker,
  TranscriptStatus,
  VoiceMoment,
  VoicePhase,
  VoiceSessionState,
} from '../models';

export const PHASE_ORDER: VoicePhase[] = ['prep', 'brew', 'finish', 'taste', 'note'];

export function defaultPhase(): VoicePhase {
  return 'prep';
}

export function phaseIndex(phase: VoicePhase): number {
  return PHASE_ORDER.indexOf(phase);
}

export function nextPhase(phase: VoicePhase): VoicePhase {
  const index = phaseIndex(phase);
  return PHASE_ORDER[(index + 1) % PHASE_ORDER.length];
}

/**
 * A session that sat idle for longer than the resume threshold resumes at the
 * phase after the one it stopped at (idea.txt §4.3).
 */
export function phaseAfterGap(
  current: VoicePhase,
  gapMs: number,
  resumeThresholdMs: number
): VoicePhase {
  return gapMs >= resumeThresholdMs ? nextPhase(current) : current;
}

/** The phase in force at an offset: the last marker at or before it. */
export function phaseAtOffset(
  markers: PhaseMarker[],
  offsetMs: number,
  fallback: VoicePhase
): VoicePhase {
  let found: VoicePhase | null = null;
  for (const marker of markers) {
    if (marker.offsetMs <= offsetMs) {
      found = marker.phase;
    } else {
      break;
    }
  }
  return found ?? fallback;
}

export function momentPhase(moment: VoiceMoment, markers: PhaseMarker[]): VoicePhase {
  if (moment.phase !== null) {
    return moment.phase;
  }
  return phaseAtOffset(markers, moment.startOffsetMs, PRETTY_FALLBACK_PHASE);
}

const PRETTY_FALLBACK_PHASE: VoicePhase = 'prep';

export interface TranscriptLine {
  phase: VoicePhase;
  text: string;
}

export function transcriptLines(moments: VoiceMoment[], markers: PhaseMarker[]): TranscriptLine[] {
  const sorted = [...moments].sort((a, b) => a.startOffsetMs - b.startOffsetMs || a.id - b.id);
  return sorted
    .filter((moment) => moment.transcriptStatus === 'succeeded' && moment.transcript !== null)
    .map((moment) => ({
      phase: momentPhase(moment, markers),
      text: (moment.transcript ?? '').trim(),
    }))
    .filter((line) => line.text !== '');
}

/** The phased transcript handed to the extraction prompt and to the review. */
export function buildPhasedTranscript(
  moments: VoiceMoment[],
  markers: PhaseMarker[]
): string {
  return transcriptLines(moments, markers)
    .map((line) => `[${line.phase}] ${line.text}`)
    .join('\n');
}

export function elapsedSeconds(startedAtIso: string, nowIso?: string): number {
  const start = Date.parse(startedAtIso);
  const now = nowIso === undefined ? Date.now() : Date.parse(nowIso);
  if (!Number.isFinite(start) || !Number.isFinite(now)) {
    return 0;
  }
  return Math.max(0, Math.floor((now - start) / 1000));
}

export interface TranscriptCounts {
  succeeded: number;
  failed: number;
  skipped: number;
  pending: number;
}

export function transcriptCounts(moments: VoiceMoment[]): TranscriptCounts {
  const counts: TranscriptCounts = { succeeded: 0, failed: 0, skipped: 0, pending: 0 };
  for (const moment of moments) {
    switch (moment.transcriptStatus) {
      case 'succeeded':
        counts.succeeded += 1;
        break;
      case 'failed':
        counts.failed += 1;
        break;
      case 'skipped':
        counts.skipped += 1;
        break;
      default:
        counts.pending += 1;
    }
  }
  return counts;
}

/** Every moment has been written, closed and either transcribed or skipped. */
export function allMomentsResolved(moments: VoiceMoment[]): boolean {
  return (
    moments.length > 0 &&
    moments.every(
      (moment) =>
        moment.transcriptStatus === 'succeeded' ||
        moment.transcriptStatus === 'failed' ||
        moment.transcriptStatus === 'skipped'
    )
  );
}

export function hasUsableTranscript(moments: VoiceMoment[]): boolean {
  return moments.some(
    (moment) =>
      moment.transcriptStatus === 'succeeded' &&
      moment.transcript !== null &&
      moment.transcript.trim() !== ''
  );
}

export function formatTranscriptStatus(status: TranscriptStatus | null): string {
  switch (status) {
    case 'succeeded':
      return 'Transcribed';
    case 'failed':
      return 'Failed';
    case 'skipped':
      return 'Skipped';
    case 'pending':
      return 'Pending';
    default:
      return '—';
  }
}

/**
 * The audio retention policy decides when every moment's file may be deleted.
 * Deleting happens after the file has been consumed — a committed record, or a
 * finished transcription the user is about to review.
 */
export function shouldDeleteAudio(
  retention: AudioRetentionPolicy,
  state: VoiceSessionState
): boolean {
  if (retention === 'keep') {
    return false;
  }
  if (retention === 'delete-after-commit') {
    return state === 'committed';
  }
  return state === 'review';
}