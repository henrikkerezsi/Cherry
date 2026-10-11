import type { PhaseMarker, VoiceMoment } from '../../src/models';
import {
  allMomentsResolved,
  buildPhasedTranscript,
  defaultPhase,
  elapsedSeconds,
  formatTranscriptStatus,
  hasUsableTranscript,
  momentPhase,
  nextPhase,
  phaseAfterGap,
  phaseAtOffset,
  phaseIndex,
  PHASE_ORDER,
  shouldDeleteAudio,
  transcriptCounts,
  transcriptLines,
} from '../../src/services/voice-session-service';

function moment(partial: Partial<VoiceMoment>): VoiceMoment {
  return {
    id: partial.id ?? 1,
    uuid: partial.uuid ?? null,
    sessionId: partial.sessionId ?? 1,
    phase: partial.phase ?? null,
    startOffsetMs: partial.startOffsetMs ?? 0,
    durationMs: partial.durationMs ?? null,
    audioPath: partial.audioPath ?? null,
    transcript: partial.transcript ?? null,
    transcriptConfidence: partial.transcriptConfidence ?? null,
    transcriptEngine: partial.transcriptEngine ?? null,
    transcriptStatus: partial.transcriptStatus ?? null,
    createdAt: partial.createdAt ?? '2026-10-01T00:00:00.000Z',
    updatedAt: partial.updatedAt ?? null,
  };
}

function marker(partial: Partial<PhaseMarker>): PhaseMarker {
  return {
    id: partial.id ?? 1,
    uuid: partial.uuid ?? null,
    sessionId: partial.sessionId ?? 1,
    phase: partial.phase ?? 'prep',
    offsetMs: partial.offsetMs ?? 0,
    createdAt: partial.createdAt ?? '2026-10-01T00:00:00.000Z',
    updatedAt: partial.updatedAt ?? null,
  };
}

describe('phase navigation', () => {
  it('runs prep → brew → finish → taste → note and wraps', () => {
    expect(PHASE_ORDER).toEqual(['prep', 'brew', 'finish', 'taste', 'note']);
    expect(nextPhase('prep')).toBe('brew');
    expect(nextPhase('note')).toBe('prep');
  });

  it('defaults to the first phase and reports stable indexes', () => {
    expect(defaultPhase()).toBe('prep');
    expect(phaseIndex('prep')).toBe(0);
    expect(phaseIndex('finish')).toBe(2);
  });

  it('advances the phase only once the gap reaches the threshold', () => {
    expect(phaseAfterGap('brew', 119_000, 120_000)).toBe('brew');
    expect(phaseAfterGap('brew', 120_000, 120_000)).toBe('finish');
    expect(phaseAfterGap('brew', 300_000, 120_000)).toBe('finish');
  });
});

describe('phaseAtOffset', () => {
  const markers = [
    marker({ id: 1, phase: 'prep', offsetMs: 0 }),
    marker({ id: 2, phase: 'brew', offsetMs: 10_000 }),
    marker({ id: 3, phase: 'finish', offsetMs: 20_000 }),
  ];

  it('returns the last marker at or before the offset', () => {
    expect(phaseAtOffset(markers, 15_000, 'note')).toBe('brew');
    expect(phaseAtOffset(markers, 20_000, 'note')).toBe('finish');
  });

  it('falls back when the offset precedes every marker', () => {
    expect(phaseAtOffset([marker({ phase: 'brew', offsetMs: 5_000 })], 1_000, 'prep')).toBe('prep');
  });
});

describe('momentPhase', () => {
  const markers = [marker({ phase: 'brew', offsetMs: 10_000 })];

  it('prefers the moment phase when set', () => {
    expect(momentPhase(moment({ phase: 'taste', startOffsetMs: 30_000 }), markers)).toBe('taste');
  });

  it('derives from markers when the moment phase is missing', () => {
    expect(momentPhase(moment({ phase: null, startOffsetMs: 30_000 }), markers)).toBe('brew');
  });

  it('falls back to prep when nothing precedes the moment', () => {
    expect(momentPhase(moment({ phase: null, startOffsetMs: 0 }), markers)).toBe('prep');
  });
});

describe('transcriptLines and buildPhasedTranscript', () => {
  it('keeps only succeeded, non-blank moments in offset order', () => {
    const moments = [
      moment({ id: 3, phase: 'finish', startOffsetMs: 30_000, transcript: 'pour done', transcriptStatus: 'succeeded' }),
      moment({ id: 1, phase: 'prep', startOffsetMs: 0, transcript: 'fifteen grams', transcriptStatus: 'succeeded' }),
      moment({ id: 2, phase: 'brew', startOffsetMs: 10_000, transcript: '   ', transcriptStatus: 'succeeded' }),
      moment({ id: 4, phase: 'brew', startOffsetMs: 20_000, transcript: 'this failed', transcriptStatus: 'failed' }),
    ];

    expect(transcriptLines(moments, [])).toEqual([
      { phase: 'prep', text: 'fifteen grams' },
      { phase: 'finish', text: 'pour done' },
    ]);
    expect(buildPhasedTranscript(moments, [])).toBe('[prep] fifteen grams\n[finish] pour done');
  });
});

describe('elapsedSeconds', () => {
  it('floors the difference between two timestamps', () => {
    expect(elapsedSeconds('2026-10-01T00:00:00.000Z', '2026-10-01T00:02:30.500Z')).toBe(150);
  });

  it('never goes negative and tolerates bad input', () => {
    expect(elapsedSeconds('2026-10-01T00:02:00.000Z', '2026-10-01T00:00:00.000Z')).toBe(0);
    expect(elapsedSeconds('not-a-date', '2026-10-01T00:00:00.000Z')).toBe(0);
  });
});

describe('transcriptCounts', () => {
  it('tallies each status, treating null as pending', () => {
    const moments = [
      moment({ id: 1, transcriptStatus: 'succeeded' }),
      moment({ id: 2, transcriptStatus: 'succeeded' }),
      moment({ id: 3, transcriptStatus: 'failed' }),
      moment({ id: 4, transcriptStatus: 'skipped' }),
      moment({ id: 5, transcriptStatus: 'pending' }),
      moment({ id: 6, transcriptStatus: null }),
    ];
    expect(transcriptCounts(moments)).toEqual({ succeeded: 2, failed: 1, skipped: 1, pending: 2 });
  });

  it('is all zeroes for no moments', () => {
    expect(transcriptCounts([])).toEqual({ succeeded: 0, failed: 0, skipped: 0, pending: 0 });
  });
});

describe('allMomentsResolved', () => {
  it('requires at least one moment and no open status', () => {
    expect(allMomentsResolved([])).toBe(false);
    expect(allMomentsResolved([moment({ transcriptStatus: null })])).toBe(false);
    expect(allMomentsResolved([moment({ transcriptStatus: 'pending' })])).toBe(false);
    expect(allMomentsResolved([moment({ transcriptStatus: 'succeeded' })])).toBe(true);
  });
});

describe('hasUsableTranscript', () => {
  it('is true only when some moment holds real text', () => {
    expect(hasUsableTranscript([moment({ transcript: 'hi', transcriptStatus: 'succeeded' })])).toBe(true);
    expect(hasUsableTranscript([moment({ transcript: '   ', transcriptStatus: 'succeeded' })])).toBe(false);
    expect(hasUsableTranscript([moment({ transcript: 'hi', transcriptStatus: 'failed' })])).toBe(false);
  });
});

describe('formatTranscriptStatus', () => {
  it('labels every status and the absence of one', () => {
    expect(formatTranscriptStatus('succeeded')).toBe('Transcribed');
    expect(formatTranscriptStatus('failed')).toBe('Failed');
    expect(formatTranscriptStatus('skipped')).toBe('Skipped');
    expect(formatTranscriptStatus('pending')).toBe('Pending');
    expect(formatTranscriptStatus(null)).toBe('—');
  });
});

describe('shouldDeleteAudio', () => {
  it('keeps audio forever under the keep policy', () => {
    expect(shouldDeleteAudio('keep', 'committed')).toBe(false);
    expect(shouldDeleteAudio('keep', 'review')).toBe(false);
  });

  it('deletes after commit only once the session is committed', () => {
    expect(shouldDeleteAudio('delete-after-commit', 'review')).toBe(false);
    expect(shouldDeleteAudio('delete-after-commit', 'committed')).toBe(true);
  });

  it('deletes after transcription once review begins', () => {
    expect(shouldDeleteAudio('delete-after-transcribe', 'committed')).toBe(false);
    expect(shouldDeleteAudio('delete-after-transcribe', 'review')).toBe(true);
  });
});
