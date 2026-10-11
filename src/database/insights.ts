import type { SQLiteDatabase } from 'expo-sqlite';
import type { Insight } from '../models';
import { getDatabase } from './database';

interface InsightRow {
  id: number;
  uuid: string | null;
  kind: string;
  scope: string | null;
  title: string | null;
  body: string | null;
  score: number | null;
  confidence: number | null;
  evidence_json: string | null;
  dismissed: number;
  expires_at: string | null;
  created_at: string;
  updated_at: string | null;
}

function rowToInsight(row: InsightRow): Insight {
  return {
    id: row.id,
    uuid: row.uuid,
    kind: row.kind,
    scope: row.scope,
    title: row.title,
    body: row.body,
    score: row.score,
    confidence: row.confidence,
    evidenceJson: row.evidence_json,
    dismissed: row.dismissed === 1,
    expiresAt: row.expires_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export interface InsightInput {
  kind: string;
  scope: string | null;
  title: string | null;
  body: string | null;
  score: number | null;
  confidence: number | null;
  evidenceJson: string | null;
  dismissed: boolean;
  expiresAt: string | null;
}

const INSIGHT_COLUMNS = `kind, scope, title, body, score, confidence, evidence_json, dismissed,
  expires_at`;

function insightParams(input: InsightInput): (string | number | null)[] {
  return [
    input.kind,
    input.scope,
    input.title,
    input.body,
    input.score,
    input.confidence,
    input.evidenceJson,
    input.dismissed ? 1 : 0,
    input.expiresAt,
  ];
}

export async function getAllInsights(db?: SQLiteDatabase): Promise<Insight[]> {
  const database = db ?? (await getDatabase());
  const rows = await database.getAllAsync<InsightRow>(
    'SELECT * FROM insights ORDER BY dismissed ASC, score DESC, id ASC'
  );
  return rows.map(rowToInsight);
}

export async function getActiveInsights(db?: SQLiteDatabase): Promise<Insight[]> {
  const database = db ?? (await getDatabase());
  const rows = await database.getAllAsync<InsightRow>(
    'SELECT * FROM insights WHERE dismissed = 0 ORDER BY score DESC, id ASC'
  );
  return rows.map(rowToInsight);
}

export async function getInsightsByKind(
  kind: string,
  db?: SQLiteDatabase
): Promise<Insight[]> {
  const database = db ?? (await getDatabase());
  const rows = await database.getAllAsync<InsightRow>(
    'SELECT * FROM insights WHERE kind = ? AND dismissed = 0 ORDER BY score DESC, id ASC',
    [kind]
  );
  return rows.map(rowToInsight);
}

export async function getInsight(id: number, db?: SQLiteDatabase): Promise<Insight | null> {
  const database = db ?? (await getDatabase());
  const row = await database.getFirstAsync<InsightRow>('SELECT * FROM insights WHERE id = ?', [id]);
  return row ? rowToInsight(row) : null;
}

export async function createInsight(input: InsightInput, db?: SQLiteDatabase): Promise<number> {
  const database = db ?? (await getDatabase());
  const result = await database.runAsync(
    `INSERT INTO insights (${INSIGHT_COLUMNS}) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    insightParams(input)
  );
  return result.lastInsertRowId;
}

/**
 * A dismissed insight is remembered as dismissed for its scope so it does not
 * resurface immediately when the same finding is recomputed (idea.txt §12.6).
 */
export async function dismissInsight(id: number, db?: SQLiteDatabase): Promise<void> {
  const database = db ?? (await getDatabase());
  await database.runAsync(
    `UPDATE insights SET dismissed = 1, updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now')
      WHERE id = ?`,
    [id]
  );
}

export async function isInsightDismissedForScope(
  kind: string,
  scope: string | null,
  db?: SQLiteDatabase
): Promise<boolean> {
  const database = db ?? (await getDatabase());
  const row = await database.getFirstAsync<{ found: number }>(
    'SELECT COUNT(*) AS found FROM insights WHERE kind = ? AND scope IS ? AND dismissed = 1',
    [kind, scope]
  );
  return (row?.found ?? 0) > 0;
}

export async function deleteInsightsByKind(
  kind: string,
  db?: SQLiteDatabase
): Promise<void> {
  const database = db ?? (await getDatabase());
  await database.runAsync('DELETE FROM insights WHERE kind = ?', [kind]);
}

/**
 * Replaces the findings of one kind in a single transaction, so the Learn tab
 * never shows a half-recomputed set.
 */
export async function replaceInsights(
  kind: string,
  inputs: InsightInput[],
  db?: SQLiteDatabase
): Promise<void> {
  const database = db ?? (await getDatabase());
  await database.withTransactionAsync(async () => {
    const dismissed = await database.getAllAsync<{ scope: string | null }>(
      'SELECT DISTINCT scope FROM insights WHERE kind = ? AND dismissed = 1',
      [kind]
    );
    const dismissedScopes = new Set(dismissed.map((row) => row.scope));
    await database.runAsync('DELETE FROM insights WHERE kind = ?', [kind]);
    for (const input of inputs) {
      const wasDismissed = dismissedScopes.has(input.scope);
      await database.runAsync(
        `INSERT INTO insights (${INSIGHT_COLUMNS}) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        insightParams({ ...input, dismissed: input.dismissed || wasDismissed })
      );
    }
  });
}