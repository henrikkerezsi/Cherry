import type { SQLiteDatabase } from 'expo-sqlite';
import type {
  PhaseMarker,
  TranscriptStatus,
  TranscriptionEngine,
  VoiceMoment,
  VoicePhase,
  VoiceSession,
  VoiceSessionState,
} from '../models';
import { getDatabase } from './database';

interface VoiceSessionRow {
  id: number;
  uuid: string | null;
  brew_id: number | null;
  plan_id: number | null;
  state: string;
  started_at: string;
  ended_at: string | null;
  default_phase: string | null;
  engine: string | null;
  language: string | null;
  created_at: string;
  updated_at: string | null;
  deleted: number;
}

interface VoiceMomentRow {
  id: number;
  uuid: string | null;
  session_id: number;
  phase: string | null;
  start_offset_ms: number;
  duration_ms: number | null;
  audio_path: string | null;
  transcript: string | null;
  transcript_confidence: number | null;
  transcript_engine: string | null;
  transcript_status: string | null;
  created_at: string;
  updated_at: string | null;
}

interface PhaseMarkerRow {
  id: number;
  uuid: string | null;
  session_id: number;
  phase: string;
  offset_ms: number;
  created_at: string;
  updated_at: string | null;
}

function rowToSession(row: VoiceSessionRow): VoiceSession {
  return {
    id: row.id,
    uuid: row.uuid,
    brewId: row.brew_id,
    planId: row.plan_id,
    state: row.state as VoiceSessionState,
    startedAt: row.started_at,
    endedAt: row.ended_at,
    defaultPhase: row.default_phase === null ? null : (row.default_phase as VoicePhase),
    engine: row.engine === null ? null : (row.engine as TranscriptionEngine),
    language: row.language,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deleted: row.deleted === 1,
  };
}

function rowToMoment(row: VoiceMomentRow): VoiceMoment {
  return {
    id: row.id,
    uuid: row.uuid,
    sessionId: row.session_id,
    phase: row.phase === null ? null : (row.phase as VoicePhase),
    startOffsetMs: row.start_offset_ms,
    durationMs: row.duration_ms,
    audioPath: row.audio_path,
    transcript: row.transcript,
    transcriptConfidence: row.transcript_confidence,
    transcriptEngine: row.transcript_engine,
    transcriptStatus:
      row.transcript_status === null ? null : (row.transcript_status as TranscriptStatus),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function rowToPhaseMarker(row: PhaseMarkerRow): PhaseMarker {
  return {
    id: row.id,
    uuid: row.uuid,
    sessionId: row.session_id,
    phase: row.phase as VoicePhase,
    offsetMs: row.offset_ms,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export interface VoiceSessionInput {
  brewId: number | null;
  planId: number | null;
  state: VoiceSessionState;
  startedAt: string;
  endedAt: string | null;
  defaultPhase: VoicePhase | null;
  engine: TranscriptionEngine | null;
  language: string | null;
}

export interface VoiceMomentInput {
  sessionId: number;
  phase: VoicePhase | null;
  startOffsetMs: number;
  durationMs: number | null;
  audioPath: string | null;
  transcript: string | null;
  transcriptConfidence: number | null;
  transcriptEngine: string | null;
  transcriptStatus: TranscriptStatus | null;
}

const SESSION_COLUMNS = `brew_id, plan_id, state, started_at, ended_at, default_phase, engine, language`;

const MOMENT_COLUMNS = `session_id, phase, start_offset_ms, duration_ms, audio_path, transcript,
  transcript_confidence, transcript_engine, transcript_status`;

export async function getAllVoiceSessions(db?: SQLiteDatabase): Promise<VoiceSession[]> {
  const database = db ?? (await getDatabase());
  const rows = await database.getAllAsync<VoiceSessionRow>(
    'SELECT * FROM voice_sessions WHERE deleted = 0 ORDER BY started_at DESC, id DESC'
  );
  return rows.map(rowToSession);
}

/** A session is open when it has been started but never committed or discarded. */
export async function getOpenSessions(db?: SQLiteDatabase): Promise<VoiceSession[]> {
  const database = db ?? (await getDatabase());
  const rows = await database.getAllAsync<VoiceSessionRow>(
    `SELECT * FROM voice_sessions
      WHERE deleted = 0 AND state IN ('recording','paused','stopped','transcribing','extracting','review')
      ORDER BY started_at DESC, id DESC`
  );
  return rows.map(rowToSession);
}

export async function getSessionsByBrew(
  brewId: number,
  db?: SQLiteDatabase
): Promise<VoiceSession[]> {
  const database = db ?? (await getDatabase());
  const rows = await database.getAllAsync<VoiceSessionRow>(
    'SELECT * FROM voice_sessions WHERE deleted = 0 AND brew_id = ? ORDER BY started_at DESC, id DESC',
    [brewId]
  );
  return rows.map(rowToSession);
}

export async function getVoiceSession(
  id: number,
  db?: SQLiteDatabase
): Promise<VoiceSession | null> {
  const database = db ?? (await getDatabase());
  const row = await database.getFirstAsync<VoiceSessionRow>(
    'SELECT * FROM voice_sessions WHERE id = ?',
    [id]
  );
  return row ? rowToSession(row) : null;
}

export async function createVoiceSession(
  input: VoiceSessionInput,
  db?: SQLiteDatabase
): Promise<number> {
  const database = db ?? (await getDatabase());
  const result = await database.runAsync(
    `INSERT INTO voice_sessions (${SESSION_COLUMNS}) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      input.brewId,
      input.planId,
      input.state,
      input.startedAt,
      input.endedAt,
      input.defaultPhase,
      input.engine,
      input.language,
    ]
  );
  return result.lastInsertRowId;
}

export async function setVoiceSessionState(
  id: number,
  state: VoiceSessionState,
  db?: SQLiteDatabase
): Promise<void> {
  const database = db ?? (await getDatabase());
  await database.runAsync(
    `UPDATE voice_sessions SET state = ?, updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now')
      WHERE id = ?`,
    [state, id]
  );
}

export async function attachSessionToBrew(
  id: number,
  brewId: number | null,
  db?: SQLiteDatabase
): Promise<void> {
  const database = db ?? (await getDatabase());
  await database.runAsync(
    `UPDATE voice_sessions SET brew_id = ?, updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now')
      WHERE id = ?`,
    [brewId, id]
  );
}

export async function setVoiceSessionEnded(
  id: number,
  state: VoiceSessionState,
  endedAt: string,
  db?: SQLiteDatabase
): Promise<void> {
  const database = db ?? (await getDatabase());
  await database.runAsync(
    `UPDATE voice_sessions SET state = ?, ended_at = ?,
            updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now')
      WHERE id = ?`,
    [state, endedAt, id]
  );
}

export async function getMomentsBySession(
  sessionId: number,
  db?: SQLiteDatabase
): Promise<VoiceMoment[]> {
  const database = db ?? (await getDatabase());
  const rows = await database.getAllAsync<VoiceMomentRow>(
    'SELECT * FROM voice_moments WHERE session_id = ? ORDER BY start_offset_ms ASC, id ASC',
    [sessionId]
  );
  return rows.map(rowToMoment);
}

export async function getVoiceMoment(
  id: number,
  db?: SQLiteDatabase
): Promise<VoiceMoment | null> {
  const database = db ?? (await getDatabase());
  const row = await database.getFirstAsync<VoiceMomentRow>(
    'SELECT * FROM voice_moments WHERE id = ?',
    [id]
  );
  return row ? rowToMoment(row) : null;
}

export async function createVoiceMoment(
  input: VoiceMomentInput,
  db?: SQLiteDatabase
): Promise<number> {
  const database = db ?? (await getDatabase());
  const result = await database.runAsync(
    `INSERT INTO voice_moments (${MOMENT_COLUMNS}) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      input.sessionId,
      input.phase,
      input.startOffsetMs,
      input.durationMs,
      input.audioPath,
      input.transcript,
      input.transcriptConfidence,
      input.transcriptEngine,
      input.transcriptStatus,
    ]
  );
  return result.lastInsertRowId;
}

/**
 * A moment's audio is written and closed before transcription begins
 * (idea.txt §4.1), so this is the only path that records a moment.
 */
export async function closeVoiceMoment(
  id: number,
  durationMs: number,
  audioPath: string,
  transcriptStatus: TranscriptStatus,
  db?: SQLiteDatabase
): Promise<void> {
  const database = db ?? (await getDatabase());
  await database.runAsync(
    `UPDATE voice_moments SET duration_ms = ?, audio_path = ?, transcript_status = ?,
            updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now')
      WHERE id = ?`,
    [durationMs, audioPath, transcriptStatus, id]
  );
}

export async function setMomentTranscript(
  id: number,
  transcript: string,
  confidence: number | null,
  engine: string,
  db?: SQLiteDatabase
): Promise<void> {
  const database = db ?? (await getDatabase());
  await database.runAsync(
    `UPDATE voice_moments SET transcript = ?, transcript_confidence = ?, transcript_engine = ?,
            transcript_status = 'succeeded',
            updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now')
      WHERE id = ?`,
    [transcript, confidence, engine, id]
  );
}

export async function markMomentTranscriptFailed(
  id: number,
  engine: string,
  db?: SQLiteDatabase
): Promise<void> {
  const database = db ?? (await getDatabase());
  await database.runAsync(
    `UPDATE voice_moments SET transcript_status = 'failed', transcript_engine = ?,
            updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now')
      WHERE id = ?`,
    [engine, id]
  );
}

export async function setMomentAudioPath(
  id: number,
  audioPath: string | null,
  db?: SQLiteDatabase
): Promise<void> {
  const database = db ?? (await getDatabase());
  await database.runAsync(
    `UPDATE voice_moments SET audio_path = ?, updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now')
      WHERE id = ?`,
    [audioPath, id]
  );
}

export async function setVoiceMomentPhase(
  id: number,
  phase: VoicePhase,
  db?: SQLiteDatabase
): Promise<void> {
  const database = db ?? (await getDatabase());
  await database.runAsync(
    `UPDATE voice_moments SET phase = ?, updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now')
      WHERE id = ?`,
    [phase, id]
  );
}

export async function getPhaseMarkersBySession(
  sessionId: number,
  db?: SQLiteDatabase
): Promise<PhaseMarker[]> {
  const database = db ?? (await getDatabase());
  const rows = await database.getAllAsync<PhaseMarkerRow>(
    'SELECT * FROM phase_markers WHERE session_id = ? ORDER BY offset_ms ASC, id ASC',
    [sessionId]
  );
  return rows.map(rowToPhaseMarker);
}

export async function createPhaseMarker(
  sessionId: number,
  phase: VoicePhase,
  offsetMs: number,
  db?: SQLiteDatabase
): Promise<number> {
  const database = db ?? (await getDatabase());
  const result = await database.runAsync(
    'INSERT INTO phase_markers (session_id, phase, offset_ms) VALUES (?, ?, ?)',
    [sessionId, phase, offsetMs]
  );
  return result.lastInsertRowId;
}

export async function deleteVoiceSession(id: number, db?: SQLiteDatabase): Promise<void> {
  const database = db ?? (await getDatabase());
  await database.runAsync(
    `UPDATE voice_sessions SET deleted = 1, updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now')
      WHERE id = ?`,
    [id]
  );
}