import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';
import { Button, IconButton, Text } from 'react-native-paper';
import { useNavigation, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AudioModule, RecordingPresets, setAudioModeAsync, useAudioRecorder, useAudioRecorderState } from 'expo-audio';
import dayjs from 'dayjs';
import { ScreenFade } from '../../components/screen-fade';
import { KeyboardAwareScrollView } from '../../components/keyboard-aware-scroll-view';
import { ScreenToast } from '../../components/screen-toast';
import { AppDialog } from '../../components/app-dialog';
import { useAppData } from '../../data/DataProvider';
import { useAppTheme } from '../../theme';
import { VOICE_PHASES } from '../../models';
import type { VoiceMoment, VoicePhase, VoiceSession } from '../../models';
import {
  closeVoiceMoment,
  createPhaseMarker,
  createVoiceMoment,
  createVoiceSession,
  getMomentsBySession,
  getOpenSessions,
  getVoiceSession,
  markMomentTranscriptFailed,
  setMomentTranscript,
  setVoiceMomentPhase,
  setVoiceSessionState,
} from '../../database/voiceSessions';
import {
  defaultPhase,
  elapsedSeconds,
  phaseAfterGap,
  formatTranscriptStatus,
} from '../../services/voice-session-service';
import { buildProvider } from '../../ai/provider';
import { transcribeMomentWithProvider } from '../../ai/transcription';
import {
  isLiveTranscriptionAvailable,
  requestSpeechRecognitionPermission,
  startLiveTranscription,
} from '../../ai/speech-recognition';
import type { LiveTranscriptionHandle } from '../../ai/speech-recognition';
import { deleteAudioFile, storeMomentAudio } from '../../utils/audio';

const CAFE_CONTEXT: string[] = [
  'bloom',
  'dose',
  'ratio',
  'V60',
  'Chemex',
  'Kalita',
  'AeroPress',
  'espresso',
  'grinder',
  'french press',
];

const PHASE_LABELS: Record<VoicePhase, string> = {
  prep: 'Prep',
  brew: 'Brew',
  finish: 'Finish',
  taste: 'Taste',
  note: 'Note',
};

function nowIso(): string {
  return dayjs().toISOString();
}

function formatClock(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

function isRecent(enabledAt: string, thresholdMinutes: number): boolean {
  const enabled = Date.parse(enabledAt);
  return Number.isFinite(enabled) && Date.now() - enabled <= thresholdMinutes * 60_000;
}

export default function RecordScreen() {
  const theme = useAppTheme();
  const router = useRouter();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { settings, aiState, refresh } = useAppData();

  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const recorderState = useAudioRecorderState(recorder, 150);

  const [session, setSession] = useState<VoiceSession | null>(null);
  const [moments, setMoments] = useState<VoiceMoment[]>([]);
  const [activePhase, setActivePhase] = useState<VoicePhase>(defaultPhase());
  const [paused, setPaused] = useState(false);
  const [openMomentId, setOpenMomentId] = useState<number | null>(null);
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [confirmDiscard, setConfirmDiscard] = useState(false);
  const [, setNowTick] = useState(0);
  const liveHandleRef = useRef<LiveTranscriptionHandle | null>(null);
  const momentStartRef = useRef<number>(0);

  const engine = aiState.sttEngine;
  const liveAvailable = engine === 'android' && isLiveTranscriptionAvailable() && Platform.OS !== 'web';

  const reloadSessionData = useCallback(async (sessionId: number) => {
    const nextMoments = await getMomentsBySession(sessionId);
    setMoments(nextMoments);
  }, []);

  useEffect(() => {
    if (!navigation.canGoBack()) {
      router.replace('/');
      return;
    }
    let cancelled = false;
    void (async () => {
      try {
        await setAudioModeAsync({ allowsRecording: true, interruptionMode: 'doNotMix' });
        await AudioModule.requestRecordingPermissionsAsync();
        if (aiState.sttEngine === 'android') {
          await requestSpeechRecognitionPermission();
        }
        const open = await getOpenSessions();
        const latest = open[0];

        if (latest) {
          if (latest.state === 'review' || latest.state === 'transcribing' || latest.state === 'extracting') {
            router.replace({ pathname: '/record/review', params: { session: String(latest.id) } });
            return;
          }
          const lastActive = latest.updatedAt ?? latest.endedAt ?? latest.startedAt;
          if (isRecent(lastActive, settings.sessionResumeThresholdMinutes)) {
            setSession(latest);
            await reloadSessionData(latest.id);
            setActivePhase(latest.defaultPhase ?? defaultPhase());
            if (!cancelled) {
              setReady(true);
            }
            return;
          }
        }

        const id = await createVoiceSession({
          brewId: null,
          planId: null,
          state: 'recording',
          startedAt: nowIso(),
          endedAt: null,
          defaultPhase: defaultPhase(),
          engine: aiState.sttEngine,
          language: aiState.sttLanguage,
        });
        const created = await getVoiceSession(id);
        if (!cancelled && created) {
          setSession(created);
          setReady(true);
        }
      } catch {
        if (!cancelled) {
          setToast('Could not start a recording session');
          setReady(true);
        }
      }
    })();
    const timer = setInterval(() => setNowTick(Date.now()), 1000);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const sessionId = session?.id ?? null;
  const metering = recorderState.metering !== undefined ? Math.min(1, Math.max(0, recorderState.metering)) : 0;

  async function openNextMoment(phase: VoicePhase) {
    if (sessionId === null || session === null) {
      return;
    }
    const startOffsetMs = Math.max(0, dayjs().valueOf() - dayjs(session.startedAt).valueOf());
    const id = await createVoiceMoment({
      sessionId,
      phase,
      startOffsetMs,
      durationMs: null,
      audioPath: null,
      transcript: null,
      transcriptConfidence: null,
      transcriptEngine: null,
      transcriptStatus: 'pending',
    });
    momentStartRef.current = dayjs().valueOf();
    setOpenMomentId(id);

    try {
      await recorder.prepareToRecordAsync({ isMeteringEnabled: true });
      recorder.record();
    } catch {
      setToast('Could not start recording');
      setOpenMomentId(null);
      return;
    }

    if (liveAvailable) {
      liveHandleRef.current = startLiveTranscription({
        language: aiState.sttLanguage,
        contextualStrings: CAFE_CONTEXT,
        onError: () => setToast('On-device speech recognition was interrupted'),
      });
    }
  }

  async function closeCurrentMoment() {
    if (openMomentId === null || sessionId === null) {
      return;
    }
    const momentId = openMomentId;
    setOpenMomentId(null);
    setBusy(true);
    try {
      const durationMs = Math.max(0, dayjs().valueOf() - momentStartRef.current);

      let liveText: { text: string; confidence: number | null } | null = null;
      if (liveAvailable && liveHandleRef.current) {
        liveText = await liveHandleRef.current.stop();
        liveHandleRef.current = null;
      }

      await recorder.stop();
      const recordedUri = recorder.uri;
      const audioPath = recordedUri ? await storeMomentAudio(recordedUri, sessionId, momentId) : null;

      await closeVoiceMoment(momentId, durationMs, audioPath ?? '', engine === 'manual' ? 'skipped' : 'pending');

      if (liveText) {
        await setMomentTranscript(momentId, liveText.text, liveText.confidence, 'android');
      } else if (engine === 'android') {
        await markMomentTranscriptFailed(momentId, 'android');
      }
      await reloadSessionData(sessionId);
    } catch {
      setToast('Could not save this moment');
    } finally {
      setBusy(false);
    }
  }

  async function handleRecordPress() {
    if (busy) {
      return;
    }
    if (openMomentId !== null) {
      await closeCurrentMoment();
      return;
    }
    if (paused) {
      if (sessionId === null || session === null) {
        return;
      }
      const gapMs = dayjs().valueOf() - dayjs(lastActivityAt()).valueOf();
      const phase = phaseAfterGap(activePhase, gapMs, settings.sessionResumeThresholdMinutes * 60_000);
      if (phase !== activePhase) {
        setActivePhase(phase);
        await createPhaseMarker(sessionId, phase, momentOffsetNow());
      }
      setPaused(false);
      await openNextMoment(phase);
      return;
    }
    await openNextMoment(activePhase);
  }

  function momentOffsetNow(): number {
    if (session === null) {
      return 0;
    }
    return Math.max(0, dayjs().valueOf() - dayjs(session.startedAt).valueOf());
  }

  function lastActivityAt(): string {
    const lastMoment = moments[moments.length - 1];
    if (lastMoment?.updatedAt) {
      return lastMoment.updatedAt;
    }
    return session?.updatedAt ?? session?.startedAt ?? nowIso();
  }

  async function handlePhaseSelect(next: VoicePhase) {
    if (next === activePhase || sessionId === null || session === null) {
      return;
    }
    setActivePhase(next);
    const offsetMs = momentOffsetNow();
    await createPhaseMarker(sessionId, next, offsetMs);
    if (openMomentId !== null) {
      await setVoiceMomentPhase(openMomentId, next);
      await reloadSessionData(sessionId);
    }
  }

  async function handlePause() {
    if (openMomentId !== null) {
      await closeCurrentMoment();
    }
    setPaused(true);
    if (sessionId !== null) {
      await setVoiceSessionState(sessionId, 'paused');
    }
  }

  async function handleFinish() {
    if (busy) {
      return;
    }
    if (sessionId === null) {
      return;
    }
    setBusy(true);
    try {
      if (openMomentId !== null) {
        await closeCurrentMoment();
      }
      await setVoiceSessionState(sessionId, 'transcribing');

      const pending = await getMomentsBySession(sessionId);
      const provider = buildProvider(aiState);
      let failedCount = 0;
      for (const moment of pending) {
        if (moment.transcriptStatus === 'succeeded' || moment.transcriptStatus === 'skipped') {
          continue;
        }
        if (engine === 'openai-compatible') {
          if (provider === null) {
            await markMomentTranscriptFailed(moment.id, engine);
            failedCount += 1;
            continue;
          }
          try {
            const result = await transcribeMomentWithProvider(provider, aiState.sttModel, aiState.sttLanguage, {
              uri: moment.audioPath,
              mimeType: 'audio/m4a',
              fileName: `moment-${moment.id}.m4a`,
            });
            await setMomentTranscript(moment.id, result.text, result.confidence, STT_ENGINE_NAME);
          } catch {
            await markMomentTranscriptFailed(moment.id, engine);
            failedCount += 1;
          }
        } else if (moment.transcriptStatus !== 'failed') {
          await markMomentTranscriptFailed(moment.id, engine);
          failedCount += 1;
        }
      }

      await setVoiceSessionState(sessionId, 'review');
      if (failedCount === pending.length && pending.length > 0) {
        setToast('Transcription failed entirely; you can type the notes in review');
      }
      router.replace({ pathname: '/record/review', params: { session: String(sessionId) } });
    } catch {
      setToast('Could not finish this session');
      setBusy(false);
    }
  }

  async function handleDiscard() {
    if (sessionId === null) {
      return;
    }
    setConfirmDiscard(false);
    setBusy(true);
    try {
      if (openMomentId !== null) {
        liveHandleRef.current?.abort();
        try {
          await recorder.stop();
        } catch {
          // recorder may already be stopped
        }
        const recordedUri = recorder.uri;
        if (recordedUri) {
          deleteAudioFile(recordedUri);
        }
        setOpenMomentId(null);
      }
      for (const moment of moments) {
        if (moment.audioPath) {
          deleteAudioFile(moment.audioPath);
        }
      }
      await setVoiceSessionState(sessionId, 'discarded');
      await refresh();
      router.back();
    } catch {
      setToast('Could not discard the session');
      setBusy(false);
    }
  }

  const elapsedTot = session ? elapsedSeconds(session.startedAt, nowIso()) : 0;

  if (!ready) {
    return (
      <ScreenFade>
        <View style={styles.center} />
      </ScreenFade>
    );
  }
  if (session === null) {
    return (
      <ScreenFade>
        <View style={styles.center}>
          <Text variant="bodyMedium">No recording session.</Text>
          <Button mode="contained" style={styles.topAction} onPress={() => router.back()}>
            Close
          </Button>
        </View>
      </ScreenFade>
    );
  }

  const meterHeight = Math.round(24 * metering);

  return (
    <ScreenFade>
      <KeyboardAwareScrollView
        contentContainerStyle={[
          styles.container,
          { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 40 },
        ]}
      >
        <View style={styles.header}>
          <View>
            <Text variant="titleMedium" style={styles.headerTitle}>
              {paused ? 'Paused' : openMomentId !== null ? 'Recording' : 'Ready'}
            </Text>
            <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
              {formatClock(elapsedTot)} · {PHASE_LABELS[activePhase]} phase
            </Text>
          </View>
          <IconButton
            icon="close"
            onPress={() => setConfirmDiscard(true)}
            accessibilityLabel="Discard recording session"
            testID="record-discard"
          />
        </View>

        <View style={styles.chips}>
          {VOICE_PHASES.map((phase) => (
            <Pressable
              key={phase}
              onPress={() => handlePhaseSelect(phase)}
              accessibilityRole="button"
              accessibilityLabel={`Set phase to ${PHASE_LABELS[phase]}`}
              testID={`record-phase-${phase}`}
            >
              <View
                style={[
                  styles.phaseChip,
                  {
                    backgroundColor:
                      activePhase === phase ? theme.colors.primaryContainer : theme.colors.surfaceVariant,
                    borderColor: activePhase === phase ? theme.colors.primary : 'transparent',
                  },
                ]}
              >
                <Text
                  variant="labelMedium"
                  style={{ color: activePhase === phase ? theme.colors.onPrimaryContainer : theme.colors.onSurfaceVariant }}
                >
                  {PHASE_LABELS[phase]}
                </Text>
              </View>
            </Pressable>
          ))}
        </View>

        <View style={styles.meterWrap}>
          <View style={[styles.meterTrack, { backgroundColor: theme.colors.surfaceVariant }]}>
            <View
              style={[
                styles.meterFill,
                { height: Math.max(4, meterHeight), backgroundColor: theme.colors.primary },
              ]}
            />
          </View>
        </View>

        <View style={styles.centerButtons}>
          <Pressable
            onPress={handleRecordPress}
            disabled={busy}
            accessibilityRole="button"
            accessibilityLabel={openMomentId !== null ? 'Stop recording this moment' : paused ? 'Resume recording' : 'Start recording a moment'}
            testID="record-mic"
          >
            <View
              style={[
                styles.micButton,
                {
                  backgroundColor:
                    busy
                      ? theme.colors.surfaceVariant
                      : openMomentId !== null
                        ? theme.colors.errorContainer
                        : theme.colors.primary,
                },
              ]}
            >
              <Text
                variant="titleLarge"
                style={{ color: openMomentId !== null ? theme.colors.onErrorContainer : theme.colors.onPrimary }}
              >
                {openMomentId !== null ? '◼' : paused ? '▶' : '●'}
              </Text>
            </View>
          </Pressable>
          <Text variant="bodySmall" style={styles.hint}>
            {openMomentId !== null
              ? 'Tap to end this moment'
              : paused
                ? 'Tap to resume recording'
                : 'Tap while speaking to record a moment'}
          </Text>
        </View>

        {moments.length > 0 ? (
          <View style={styles.momentsCard}>
            {moments.map((moment, index) => {
              const phaseLabel = PHASE_LABELS[moment.phase ?? activePhase] ?? '—';
              const shown = index === moments.length - 1 && openMomentId === moment.id;
              return (
                <View key={moment.id} style={styles.momentRow}>
                  <Text variant="labelMedium" style={{ color: theme.colors.primary }}>
                    {phaseLabel}
                  </Text>
                  <View style={styles.momentBody}>
                    <Text variant="bodySmall" numberOfLines={1}>
                      {shown
                        ? 'Recording…'
                        : moment.transcript ?? (moment.transcriptStatus === 'succeeded' ? '' : '')}
                    </Text>
                  </View>
                  <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>
                    {shown ? '…' : formatSpeechStatus(moment.transcriptStatus)}
                  </Text>
                </View>
              );
            })}
          </View>
        ) : (
          <Text variant="bodySmall" style={styles.emptyMoments}>
            No moments yet. Speak, then tap the button to close each moment.
          </Text>
        )}

        <View style={styles.actions}>
          <Button
            mode="outlined"
            icon={paused ? 'play' : 'pause'}
            onPress={handlePause}
            disabled={busy}
            style={styles.action}
            testID="record-pause"
          >
            {paused ? 'Resume' : 'Pause'}
          </Button>
          <Button
            mode="contained"
            icon="check"
            onPress={handleFinish}
            loading={busy}
            disabled={busy}
            style={styles.action}
            testID="record-finish"
          >
            Finish and extract
          </Button>
        </View>

        <Button
          mode="text"
          onPress={() => router.replace('/brew/new')}
          style={styles.manualLink}
          testID="record-manual"
        >
          Log by hand instead
        </Button>

        <AppDialog visible={confirmDiscard} onDismiss={() => setConfirmDiscard(false)}>
          <AppDialog.Title>Discard this session?</AppDialog.Title>
          <AppDialog.Content>
            <Text variant="bodyMedium">
              The session and its recordings are deleted. This cannot be undone.
            </Text>
          </AppDialog.Content>
          <AppDialog.Actions>
            <Button onPress={() => setConfirmDiscard(false)}>Keep recording</Button>
            <Button onPress={handleDiscard} disabled={busy}>
              Discard
            </Button>
          </AppDialog.Actions>
        </AppDialog>

        <ScreenToast visible={toast !== null} message={toast} onDismiss={() => setToast(null)} />
      </KeyboardAwareScrollView>
    </ScreenFade>
  );
}

function formatSpeechStatus(status: VoiceMoment['transcriptStatus']): string {
  if (status === 'failed') {
    return 'Not recognised';
  }
  if (status === 'skipped') {
    return 'Type it';
  }
  return formatTranscriptStatus(status);
}

const STT_ENGINE_NAME = 'openai-compatible';

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
    fontWeight: '700',
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 16,
  },
  phaseChip: {
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  meterWrap: {
    marginTop: 20,
  },
  meterTrack: {
    height: 24,
    borderRadius: 12,
    overflow: 'hidden',
    justifyContent: 'flex-end',
  },
  meterFill: {
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    alignSelf: 'stretch',
  },
  centerButtons: {
    alignItems: 'center',
    marginTop: 24,
  },
  micButton: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hint: {
    marginTop: 10,
    textAlign: 'center',
  },
  momentsCard: {
    marginTop: 24,
  },
  momentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  momentBody: {
    flex: 1,
    paddingHorizontal: 12,
  },
  emptyMoments: {
    marginTop: 24,
    textAlign: 'center',
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 28,
  },
  action: {
    flex: 1,
  },
  manualLink: {
    marginTop: 16,
    alignSelf: 'center',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topAction: {
    marginTop: 16,
  },
});