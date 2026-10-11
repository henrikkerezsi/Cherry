import type { SQLiteDatabase } from 'expo-sqlite';
import type {
  AttributeLevel,
  Tasting,
  TastingFlavourTag,
  Verdict,
} from '../models';
import { getDatabase } from './database';

interface TastingRow {
  id: number;
  uuid: string | null;
  brew_id: number;
  verdict: string | null;
  overall_rating: number | null;
  tasted_at: string | null;
  temperature_c: number | null;
  attribute_acidity: string | null;
  attribute_sweetness: string | null;
  attribute_body: string | null;
  attribute_bitterness: string | null;
  attribute_finish: string | null;
  sca_aroma: number | null;
  sca_flavour: number | null;
  sca_aftertaste: number | null;
  sca_acidity: number | null;
  sca_body: number | null;
  sca_balance: number | null;
  sca_uniformity: number | null;
  sca_clean_cup: number | null;
  sca_sweetness: number | null;
  sca_overall: number | null;
  notes: string | null;
  created_at: string;
  updated_at: string | null;
  deleted: number;
}

interface TastingFlavourTagRow {
  id: number;
  uuid: string | null;
  tasting_id: number;
  tag_id: string;
  created_at: string;
  updated_at: string | null;
}

function rowToTasting(row: TastingRow): Tasting {
  return {
    id: row.id,
    uuid: row.uuid,
    brewId: row.brew_id,
    verdict: row.verdict as Verdict | null,
    overallRating: row.overall_rating,
    tastedAt: row.tasted_at,
    temperatureC: row.temperature_c,
    attributeAcidity: row.attribute_acidity as AttributeLevel | null,
    attributeSweetness: row.attribute_sweetness as AttributeLevel | null,
    attributeBody: row.attribute_body as AttributeLevel | null,
    attributeBitterness: row.attribute_bitterness as AttributeLevel | null,
    attributeFinish: row.attribute_finish as AttributeLevel | null,
    scaAroma: row.sca_aroma,
    scaFlavour: row.sca_flavour,
    scaAftertaste: row.sca_aftertaste,
    scaAcidity: row.sca_acidity,
    scaBody: row.sca_body,
    scaBalance: row.sca_balance,
    scaUniformity: row.sca_uniformity,
    scaCleanCup: row.sca_clean_cup,
    scaSweetness: row.sca_sweetness,
    scaOverall: row.sca_overall,
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deleted: row.deleted === 1,
  };
}

function rowToTastingFlavourTag(row: TastingFlavourTagRow): TastingFlavourTag {
  return {
    id: row.id,
    uuid: row.uuid,
    tastingId: row.tasting_id,
    tagId: row.tag_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export interface TastingInput {
  brewId: number;
  verdict: Verdict | null;
  overallRating: number | null;
  tastedAt: string | null;
  temperatureC: number | null;
  attributeAcidity: AttributeLevel | null;
  attributeSweetness: AttributeLevel | null;
  attributeBody: AttributeLevel | null;
  attributeBitterness: AttributeLevel | null;
  attributeFinish: AttributeLevel | null;
  scaAroma: number | null;
  scaFlavour: number | null;
  scaAftertaste: number | null;
  scaAcidity: number | null;
  scaBody: number | null;
  scaBalance: number | null;
  scaUniformity: number | null;
  scaCleanCup: number | null;
  scaSweetness: number | null;
  scaOverall: number | null;
  notes: string | null;
  flavourTagIds: string[];
}

const TASTING_COLUMNS = `brew_id, verdict, overall_rating, tasted_at, temperature_c,
  attribute_acidity, attribute_sweetness, attribute_body, attribute_bitterness, attribute_finish,
  sca_aroma, sca_flavour, sca_aftertaste, sca_acidity, sca_body, sca_balance, sca_uniformity,
  sca_clean_cup, sca_sweetness, sca_overall, notes`;

function tastingParams(input: TastingInput): (string | number | null)[] {
  return [
    input.brewId,
    input.verdict,
    input.overallRating,
    input.tastedAt,
    input.temperatureC,
    input.attributeAcidity,
    input.attributeSweetness,
    input.attributeBody,
    input.attributeBitterness,
    input.attributeFinish,
    input.scaAroma,
    input.scaFlavour,
    input.scaAftertaste,
    input.scaAcidity,
    input.scaBody,
    input.scaBalance,
    input.scaUniformity,
    input.scaCleanCup,
    input.scaSweetness,
    input.scaOverall,
    input.notes,
  ];
}

async function replaceFlavourTags(
  database: SQLiteDatabase,
  tastingId: number,
  tagIds: string[]
): Promise<void> {
  await database.runAsync('DELETE FROM tasting_flavour_tags WHERE tasting_id = ?', [tastingId]);
  for (const tagId of tagIds) {
    await database.runAsync(
      `INSERT OR IGNORE INTO tasting_flavour_tags (tasting_id, tag_id) VALUES (?, ?)`,
      [tastingId, tagId]
    );
  }
}

export async function getAllTastings(db?: SQLiteDatabase): Promise<Tasting[]> {
  const database = db ?? (await getDatabase());
  const rows = await database.getAllAsync<TastingRow>(
    'SELECT * FROM tastings WHERE deleted = 0 ORDER BY COALESCE(tasted_at, created_at) ASC, id ASC'
  );
  return rows.map(rowToTasting);
}

export async function getTastingsByBrew(
  brewId: number,
  db?: SQLiteDatabase
): Promise<Tasting[]> {
  const database = db ?? (await getDatabase());
  const rows = await database.getAllAsync<TastingRow>(
    'SELECT * FROM tastings WHERE deleted = 0 AND brew_id = ? ORDER BY COALESCE(tasted_at, created_at) ASC, id ASC',
    [brewId]
  );
  return rows.map(rowToTasting);
}

export async function getTasting(id: number, db?: SQLiteDatabase): Promise<Tasting | null> {
  const database = db ?? (await getDatabase());
  const row = await database.getFirstAsync<TastingRow>('SELECT * FROM tastings WHERE id = ?', [id]);
  return row ? rowToTasting(row) : null;
}

export async function getFlavourTagIdsForTasting(
  tastingId: number,
  db?: SQLiteDatabase
): Promise<string[]> {
  const database = db ?? (await getDatabase());
  const rows = await database.getAllAsync<{ tag_id: string }>(
    'SELECT tag_id FROM tasting_flavour_tags WHERE tasting_id = ? ORDER BY tag_id ASC',
    [tastingId]
  );
  return rows.map((row) => row.tag_id);
}

export async function getFlavourTagsForTasting(
  tastingId: number,
  db?: SQLiteDatabase
): Promise<TastingFlavourTag[]> {
  const database = db ?? (await getDatabase());
  const rows = await database.getAllAsync<TastingFlavourTagRow>(
    'SELECT * FROM tasting_flavour_tags WHERE tasting_id = ? ORDER BY tag_id ASC',
    [tastingId]
  );
  return rows.map(rowToTastingFlavourTag);
}

export async function setFlavourTagsForTasting(
  tastingId: number,
  tagIds: string[],
  db?: SQLiteDatabase
): Promise<void> {
  const database = db ?? (await getDatabase());
  await replaceFlavourTags(database, tastingId, tagIds);
}

export async function createTasting(input: TastingInput, db?: SQLiteDatabase): Promise<number> {
  const database = db ?? (await getDatabase());
  let id = 0;
  await database.withTransactionAsync(async () => {
    const result = await database.runAsync(
      `INSERT INTO tastings (${TASTING_COLUMNS}) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      tastingParams(input)
    );
    id = result.lastInsertRowId;
    await replaceFlavourTags(database, id, input.flavourTagIds);
  });
  return id;
}

export async function updateTasting(
  id: number,
  input: TastingInput,
  db?: SQLiteDatabase
): Promise<void> {
  const database = db ?? (await getDatabase());
  await database.withTransactionAsync(async () => {
    await database.runAsync(
      `UPDATE tastings SET brew_id = ?, verdict = ?, overall_rating = ?, tasted_at = ?,
              temperature_c = ?, attribute_acidity = ?, attribute_sweetness = ?,
              attribute_body = ?, attribute_bitterness = ?, attribute_finish = ?,
              sca_aroma = ?, sca_flavour = ?, sca_aftertaste = ?, sca_acidity = ?, sca_body = ?,
              sca_balance = ?, sca_uniformity = ?, sca_clean_cup = ?, sca_sweetness = ?,
              sca_overall = ?, notes = ?,
              updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now')
        WHERE id = ?`,
      [...tastingParams(input), id]
    );
    await replaceFlavourTags(database, id, input.flavourTagIds);
  });
}

export async function deleteTasting(id: number, db?: SQLiteDatabase): Promise<void> {
  const database = db ?? (await getDatabase());
  await database.runAsync(
    `UPDATE tastings SET deleted = 1, updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now')
      WHERE id = ?`,
    [id]
  );
}