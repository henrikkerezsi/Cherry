import type { SQLiteDatabase } from 'expo-sqlite';
import type {
  ExtractionProvenance,
  ExtractionQuestion,
  ExtractionResult,
  ExtractionRun,
  ExtractionRunKind,
  ExtractionRunStatus,
  ExtractionTarget,
  ProvenanceSource,
} from '../models';
import { getDatabase } from './database';

interface ExtractionRunRow {
  id: number;
  uuid: string | null;
  session_id: number | null;
  brew_id: number | null;
  kind: string;
  prompt_id: string | null;
  prompt_version: string | null;
  model: string | null;
  status: string;
  request_summary: string | null;
  response_json: string | null;
  error: string | null;
  input_tokens: number | null;
  output_tokens: number | null;
  cost_estimate_cents: number | null;
  created_at: string;
  updated_at: string | null;
}

interface ExtractionResultRow {
  id: number;
  uuid: string | null;
  run_id: number;
  target: string | null;
  target_id: number | null;
  field_path: string;
  value_json: string | null;
  confidence: number | null;
  created_at: string;
  updated_at: string | null;
}

interface ExtractionQuestionRow {
  id: number;
  uuid: string | null;
  run_id: number;
  field_path: string;
  question: string;
  options_json: string | null;
  answer: string | null;
  answered_at: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string | null;
}

interface ExtractionProvenanceRow {
  id: number;
  uuid: string | null;
  run_id: number;
  target: string | null;
  target_id: number | null;
  field_path: string;
  source: string;
  accepted: number;
  created_at: string;
  updated_at: string | null;
}

function rowToRun(row: ExtractionRunRow): ExtractionRun {
  return {
    id: row.id,
    uuid: row.uuid,
    sessionId: row.session_id,
    brewId: row.brew_id,
    kind: row.kind as ExtractionRunKind,
    promptId: row.prompt_id,
    promptVersion: row.prompt_version,
    model: row.model,
    status: row.status as ExtractionRunStatus,
    requestSummary: row.request_summary,
    responseJson: row.response_json,
    error: row.error,
    inputTokens: row.input_tokens,
    outputTokens: row.output_tokens,
    costEstimateCents: row.cost_estimate_cents,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function rowToResult(row: ExtractionResultRow): ExtractionResult {
  return {
    id: row.id,
    uuid: row.uuid,
    runId: row.run_id,
    target: row.target === null ? null : (row.target as ExtractionTarget),
    targetId: row.target_id,
    fieldPath: row.field_path,
    valueJson: row.value_json,
    confidence: row.confidence,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function rowToQuestion(row: ExtractionQuestionRow): ExtractionQuestion {
  return {
    id: row.id,
    uuid: row.uuid,
    runId: row.run_id,
    fieldPath: row.field_path,
    question: row.question,
    optionsJson: row.options_json,
    answer: row.answer,
    answeredAt: row.answered_at,
    sortOrder: row.sort_order,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function rowToProvenance(row: ExtractionProvenanceRow): ExtractionProvenance {
  return {
    id: row.id,
    uuid: row.uuid,
    runId: row.run_id,
    target: row.target === null ? null : (row.target as ExtractionTarget),
    targetId: row.target_id,
    fieldPath: row.field_path,
    source: row.source as ProvenanceSource,
    accepted: row.accepted === 1,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export interface ExtractionRunInput {
  sessionId: number | null;
  brewId: number | null;
  kind: ExtractionRunKind;
  promptId: string | null;
  promptVersion: string | null;
  model: string | null;
  status: ExtractionRunStatus;
  requestSummary: string | null;
  responseJson: string | null;
  error: string | null;
  inputTokens: number | null;
  outputTokens: number | null;
  costEstimateCents: number | null;
}

export interface ExtractionResultInput {
  target: ExtractionTarget | null;
  targetId: number | null;
  fieldPath: string;
  valueJson: string | null;
  confidence: number | null;
}

export interface ExtractionQuestionInput {
  fieldPath: string;
  question: string;
  optionsJson: string | null;
  sortOrder: number;
}

const RUN_COLUMNS = `session_id, brew_id, kind, prompt_id, prompt_version, model, status,
  request_summary, response_json, error, input_tokens, output_tokens, cost_estimate_cents`;

const RESULT_COLUMNS = `target, target_id, field_path, value_json, confidence`;

const QUESTION_COLUMNS = `field_path, question, options_json, sort_order`;

const PROVENANCE_COLUMNS = `target, target_id, field_path, source, accepted`;

/**
 * Every AI request is recorded, which is what makes the app's network behaviour
 * inspectable from Settings (idea.txt §17).
 */
export async function createExtractionRun(
  input: ExtractionRunInput,
  db?: SQLiteDatabase
): Promise<number> {
  const database = db ?? (await getDatabase());
  const result = await database.runAsync(
    `INSERT INTO extraction_runs (${RUN_COLUMNS}) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      input.sessionId,
      input.brewId,
      input.kind,
      input.promptId,
      input.promptVersion,
      input.model,
      input.status,
      input.requestSummary,
      input.responseJson,
      input.error,
      input.inputTokens,
      input.outputTokens,
      input.costEstimateCents,
    ]
  );
  return result.lastInsertRowId;
}

export async function completeExtractionRun(
  id: number,
  patch: {
    status: ExtractionRunStatus;
    responseJson?: string | null;
    error?: string | null;
    inputTokens?: number | null;
    outputTokens?: number | null;
    costEstimateCents?: number | null;
  },
  db?: SQLiteDatabase
): Promise<void> {
  const database = db ?? (await getDatabase());
  await database.runAsync(
    `UPDATE extraction_runs SET status = ?, response_json = ?, error = ?, input_tokens = ?,
            output_tokens = ?, cost_estimate_cents = ?,
            updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now')
      WHERE id = ?`,
    [
      patch.status,
      patch.responseJson ?? null,
      patch.error ?? null,
      patch.inputTokens ?? null,
      patch.outputTokens ?? null,
      patch.costEstimateCents ?? null,
      id,
    ]
  );
}

export async function getExtractionRun(id: number, db?: SQLiteDatabase): Promise<ExtractionRun | null> {
  const database = db ?? (await getDatabase());
  const row = await database.getFirstAsync<ExtractionRunRow>(
    'SELECT * FROM extraction_runs WHERE id = ?',
    [id]
  );
  return row ? rowToRun(row) : null;
}

export async function getRunsBySession(
  sessionId: number,
  db?: SQLiteDatabase
): Promise<ExtractionRun[]> {
  const database = db ?? (await getDatabase());
  const rows = await database.getAllAsync<ExtractionRunRow>(
    'SELECT * FROM extraction_runs WHERE session_id = ? ORDER BY created_at ASC, id ASC',
    [sessionId]
  );
  return rows.map(rowToRun);
}

/**
 * The most recent successful extraction of a given kind for a session. A
 * session's transcript is never re-extracted once this exists (§5.8).
 */
export async function getSucceededRun(
  sessionId: number,
  kind: ExtractionRunKind,
  db?: SQLiteDatabase
): Promise<ExtractionRun | null> {
  const database = db ?? (await getDatabase());
  const row = await database.getFirstAsync<ExtractionRunRow>(
    `SELECT * FROM extraction_runs
      WHERE session_id = ? AND kind = ? AND status = 'succeeded'
      ORDER BY created_at DESC, id DESC
      LIMIT 1`,
    [sessionId, kind]
  );
  return row ? rowToRun(row) : null;
}

export async function createExtractionResult(
  runId: number,
  input: ExtractionResultInput,
  db?: SQLiteDatabase
): Promise<number> {
  const database = db ?? (await getDatabase());
  const result = await database.runAsync(
    `INSERT INTO extraction_results (run_id, ${RESULT_COLUMNS}) VALUES (?, ?, ?, ?, ?, ?)`,
    [runId, input.target, input.targetId, input.fieldPath, input.valueJson, input.confidence]
  );
  return result.lastInsertRowId;
}

export async function getResultsByRun(
  runId: number,
  db?: SQLiteDatabase
): Promise<ExtractionResult[]> {
  const database = db ?? (await getDatabase());
  const rows = await database.getAllAsync<ExtractionResultRow>(
    'SELECT * FROM extraction_results WHERE run_id = ? ORDER BY id ASC',
    [runId]
  );
  return rows.map(rowToResult);
}

export async function createExtractionQuestion(
  runId: number,
  input: ExtractionQuestionInput,
  db?: SQLiteDatabase
): Promise<number> {
  const database = db ?? (await getDatabase());
  const result = await database.runAsync(
    `INSERT INTO extraction_questions (run_id, ${QUESTION_COLUMNS}) VALUES (?, ?, ?, ?, ?)`,
    [runId, input.fieldPath, input.question, input.optionsJson, input.sortOrder]
  );
  return result.lastInsertRowId;
}

export async function getQuestionsByRun(
  runId: number,
  db?: SQLiteDatabase
): Promise<ExtractionQuestion[]> {
  const database = db ?? (await getDatabase());
  const rows = await database.getAllAsync<ExtractionQuestionRow>(
    'SELECT * FROM extraction_questions WHERE run_id = ? ORDER BY sort_order ASC, id ASC',
    [runId]
  );
  return rows.map(rowToQuestion);
}

export async function answerExtractionQuestion(
  id: number,
  answer: string,
  db?: SQLiteDatabase
): Promise<void> {
  const database = db ?? (await getDatabase());
  await database.runAsync(
    `UPDATE extraction_questions SET answer = ?,
            answered_at = strftime('%Y-%m-%dT%H:%M:%fZ','now'),
            updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now')
      WHERE id = ?`,
    [answer, id]
  );
}

export async function createExtractionProvenance(
  runId: number,
  input: {
    target: ExtractionTarget | null;
    targetId: number | null;
    fieldPath: string;
    source: ProvenanceSource;
    accepted: boolean;
  },
  db?: SQLiteDatabase
): Promise<number> {
  const database = db ?? (await getDatabase());
  const result = await database.runAsync(
    `INSERT INTO extraction_provenance (run_id, ${PROVENANCE_COLUMNS}) VALUES (?, ?, ?, ?, ?, ?)`,
    [runId, input.target, input.targetId, input.fieldPath, input.source, input.accepted ? 1 : 0]
  );
  return result.lastInsertRowId;
}

export async function getProvenanceByRun(
  runId: number,
  db?: SQLiteDatabase
): Promise<ExtractionProvenance[]> {
  const database = db ?? (await getDatabase());
  const rows = await database.getAllAsync<ExtractionProvenanceRow>(
    'SELECT * FROM extraction_provenance WHERE run_id = ? ORDER BY id ASC',
    [runId]
  );
  return rows.map(rowToProvenance);
}

export async function setProvenanceAccepted(
  id: number,
  accepted: boolean,
  db?: SQLiteDatabase
): Promise<void> {
  const database = db ?? (await getDatabase());
  await database.runAsync(
    `UPDATE extraction_provenance SET accepted = ?,
            updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now')
      WHERE id = ?`,
    [accepted ? 1 : 0, id]
  );
}

/**
 * Running totals of tokens and estimated spend. Settings shows this so the AI
 * features' cost is visible rather than implied (idea.txt §17).
 */
export interface AiUsageTotal {
  inputTokens: number;
  outputTokens: number;
  costEstimateCents: number;
  runCount: number;
}

export async function getAiUsageTotals(db?: SQLiteDatabase): Promise<AiUsageTotal> {
  const database = db ?? (await getDatabase());
  const row = await database.getFirstAsync<{
    input_tokens: number | null;
    output_tokens: number | null;
    cost_cents: number | null;
    run_count: number;
  }>(
    `SELECT COALESCE(SUM(input_tokens), 0) AS input_tokens,
            COALESCE(SUM(output_tokens), 0) AS output_tokens,
            COALESCE(SUM(cost_estimate_cents), 0) AS cost_cents,
            COUNT(*) AS run_count
       FROM extraction_runs`
  );
  return {
    inputTokens: row?.input_tokens ?? 0,
    outputTokens: row?.output_tokens ?? 0,
    costEstimateCents: row?.cost_cents ?? 0,
    runCount: row?.run_count ?? 0,
  };
}