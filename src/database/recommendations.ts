import type { SQLiteDatabase } from 'expo-sqlite';
import type {
  BrewMethodId,
  FlawSource,
  Recommendation,
  RecommendationDiff,
  RecommendationMode,
  RecommendationStatus,
} from '../models';
import { getDatabase } from './database';

interface RecommendationRow {
  id: number;
  uuid: string | null;
  method_id: string | null;
  base_brew_id: number | null;
  base_recipe_id: number | null;
  mode: string;
  status: string;
  proposed_json: string | null;
  rationale_json: string | null;
  narrative: string | null;
  flaw_first: number;
  flaw_source: string | null;
  declined_reason: string | null;
  planned_for_date: string | null;
  created_at: string;
  updated_at: string | null;
  deleted: number;
}

interface RecommendationDiffRow {
  id: number;
  uuid: string | null;
  recommendation_id: number;
  knob: string;
  current_value: string | null;
  proposed_value: string | null;
  sensitivity: number | null;
  confidence: number | null;
  n: number | null;
  reason: string | null;
  created_at: string;
  updated_at: string | null;
}

function rowToRecommendation(row: RecommendationRow): Recommendation {
  return {
    id: row.id,
    uuid: row.uuid,
    methodId: row.method_id === null ? null : (row.method_id as BrewMethodId),
    baseBrewId: row.base_brew_id,
    baseRecipeId: row.base_recipe_id,
    mode: row.mode as RecommendationMode,
    status: row.status as RecommendationStatus,
    proposedJson: row.proposed_json,
    rationaleJson: row.rationale_json,
    narrative: row.narrative,
    flawFirst: row.flaw_first === 1,
    flawSource: row.flaw_source === null ? null : (row.flaw_source as FlawSource),
    declinedReason: row.declined_reason,
    plannedForDate: row.planned_for_date,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deleted: row.deleted === 1,
  };
}

function rowToRecommendationDiff(row: RecommendationDiffRow): RecommendationDiff {
  return {
    id: row.id,
    uuid: row.uuid,
    recommendationId: row.recommendation_id,
    knob: row.knob,
    currentValue: row.current_value,
    proposedValue: row.proposed_value,
    sensitivity: row.sensitivity,
    confidence: row.confidence,
    n: row.n,
    reason: row.reason,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export interface RecommendationDiffInput {
  knob: string;
  currentValue: string | null;
  proposedValue: string | null;
  sensitivity: number | null;
  confidence: number | null;
  n: number | null;
  reason: string | null;
}

export interface RecommendationInput {
  methodId: BrewMethodId | null;
  baseBrewId: number | null;
  baseRecipeId: number | null;
  mode: RecommendationMode;
  status: RecommendationStatus;
  proposedJson: string | null;
  rationaleJson: string | null;
  narrative: string | null;
  flawFirst: boolean;
  flawSource: FlawSource | null;
  declinedReason: string | null;
  plannedForDate: string | null;
  diffs: RecommendationDiffInput[];
}

const RECOMMENDATION_COLUMNS = `method_id, base_brew_id, base_recipe_id, mode, status,
  proposed_json, rationale_json, narrative, flaw_first, flaw_source, declined_reason, planned_for_date`;

function recommendationParams(input: RecommendationInput): (string | number | null)[] {
  return [
    input.methodId,
    input.baseBrewId,
    input.baseRecipeId,
    input.mode,
    input.status,
    input.proposedJson,
    input.rationaleJson,
    input.narrative,
    input.flawFirst ? 1 : 0,
    input.flawSource,
    input.declinedReason,
    input.plannedForDate,
  ];
}

async function insertDiffs(
  database: SQLiteDatabase,
  recommendationId: number,
  diffs: RecommendationDiffInput[]
): Promise<void> {
  for (const diff of diffs) {
    await database.runAsync(
      `INSERT INTO recommendation_diffs (
         recommendation_id, knob, current_value, proposed_value, sensitivity, confidence, n, reason
       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        recommendationId,
        diff.knob,
        diff.currentValue,
        diff.proposedValue,
        diff.sensitivity,
        diff.confidence,
        diff.n,
        diff.reason,
      ]
    );
  }
}

export async function getAllRecommendations(db?: SQLiteDatabase): Promise<Recommendation[]> {
  const database = db ?? (await getDatabase());
  const rows = await database.getAllAsync<RecommendationRow>(
    'SELECT * FROM recommendations WHERE deleted = 0 ORDER BY created_at DESC, id DESC'
  );
  return rows.map(rowToRecommendation);
}

/**
 * The Brew tab's "Next up" card: the most recent recommendation that is still
 * actionable, preferring an explicitly proposed one.
 */
export async function getCurrentRecommendation(
  db?: SQLiteDatabase
): Promise<Recommendation | null> {
  const database = db ?? (await getDatabase());
  const row = await database.getFirstAsync<RecommendationRow>(
    `SELECT * FROM recommendations
      WHERE deleted = 0 AND status = 'proposed'
      ORDER BY created_at DESC, id DESC
      LIMIT 1`
  );
  return row ? rowToRecommendation(row) : null;
}

export async function getRecommendation(
  id: number,
  db?: SQLiteDatabase
): Promise<Recommendation | null> {
  const database = db ?? (await getDatabase());
  const row = await database.getFirstAsync<RecommendationRow>(
    'SELECT * FROM recommendations WHERE id = ?',
    [id]
  );
  return row ? rowToRecommendation(row) : null;
}

export async function getRecommendationDiffs(
  recommendationId: number,
  db?: SQLiteDatabase
): Promise<RecommendationDiff[]> {
  const database = db ?? (await getDatabase());
  const rows = await database.getAllAsync<RecommendationDiffRow>(
    'SELECT * FROM recommendation_diffs WHERE recommendation_id = ? ORDER BY id ASC',
    [recommendationId]
  );
  return rows.map(rowToRecommendationDiff);
}

export async function createRecommendation(
  input: RecommendationInput,
  db?: SQLiteDatabase
): Promise<number> {
  const database = db ?? (await getDatabase());
  let id = 0;
  await database.withTransactionAsync(async () => {
    const result = await database.runAsync(
      `INSERT INTO recommendations (${RECOMMENDATION_COLUMNS})
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      recommendationParams(input)
    );
    id = result.lastInsertRowId;
    await insertDiffs(database, id, input.diffs);
  });
  return id;
}

export async function setRecommendationStatus(
  id: number,
  status: RecommendationStatus,
  db?: SQLiteDatabase
): Promise<void> {
  const database = db ?? (await getDatabase());
  await database.runAsync(
    `UPDATE recommendations SET status = ?, updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now')
      WHERE id = ?`,
    [status, id]
  );
}

export async function declineRecommendation(
  id: number,
  reason: string | null,
  db?: SQLiteDatabase
): Promise<void> {
  const database = db ?? (await getDatabase());
  await database.runAsync(
    `UPDATE recommendations SET status = 'declined', declined_reason = ?,
            updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now')
      WHERE id = ?`,
    [reason, id]
  );
}

export async function setRecommendationNarrative(
  id: number,
  narrative: string,
  db?: SQLiteDatabase
): Promise<void> {
  const database = db ?? (await getDatabase());
  await database.runAsync(
    `UPDATE recommendations SET narrative = ?,
            updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now')
      WHERE id = ?`,
    [narrative, id]
  );
}

export async function supersedeOpenRecommendations(
  exceptId: number | null,
  db?: SQLiteDatabase
): Promise<void> {
  const database = db ?? (await getDatabase());
  await database.runAsync(
    `UPDATE recommendations SET status = 'superseded',
            updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now')
      WHERE deleted = 0 AND status = 'proposed' AND id IS NOT ?`,
    [exceptId]
  );
}