import type { SQLiteDatabase } from 'expo-sqlite';
import type { BrewMethodId, Brewer, BrewerKind } from '../models';
import { getDatabase } from './database';

interface BrewerRow {
  id: number;
  uuid: string | null;
  name: string;
  kind: string;
  method_id: string | null;
  manufacturer: string | null;
  model: string | null;
  capacity_ml: number | null;
  material: string | null;
  notes: string | null;
  is_active: number;
  sort_order: number;
  created_at: string;
  updated_at: string | null;
  deleted: number;
}

function rowToBrewer(row: BrewerRow): Brewer {
  return {
    id: row.id,
    uuid: row.uuid,
    name: row.name,
    kind: row.kind as BrewerKind,
    methodId: row.method_id as BrewMethodId | null,
    manufacturer: row.manufacturer,
    model: row.model,
    capacityMl: row.capacity_ml,
    material: row.material,
    notes: row.notes,
    isActive: row.is_active === 1,
    sortOrder: row.sort_order,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deleted: row.deleted === 1,
  };
}

export interface BrewerInput {
  name: string;
  kind: BrewerKind;
  methodId: BrewMethodId | null;
  manufacturer: string | null;
  model: string | null;
  capacityMl: number | null;
  material: string | null;
  notes: string | null;
  isActive: boolean;
  sortOrder: number;
}

export async function getAllBrewers(db?: SQLiteDatabase): Promise<Brewer[]> {
  const database = db ?? (await getDatabase());
  const rows = await database.getAllAsync<BrewerRow>(
    'SELECT * FROM brewers WHERE deleted = 0 ORDER BY kind ASC, sort_order ASC, name ASC'
  );
  return rows.map(rowToBrewer);
}

export async function getActiveBrewers(db?: SQLiteDatabase): Promise<Brewer[]> {
  const database = db ?? (await getDatabase());
  const rows = await database.getAllAsync<BrewerRow>(
    'SELECT * FROM brewers WHERE deleted = 0 AND is_active = 1 ORDER BY kind ASC, sort_order ASC, name ASC'
  );
  return rows.map(rowToBrewer);
}

export async function getBrewersByKind(
  kind: BrewerKind,
  db?: SQLiteDatabase
): Promise<Brewer[]> {
  const database = db ?? (await getDatabase());
  const rows = await database.getAllAsync<BrewerRow>(
    'SELECT * FROM brewers WHERE deleted = 0 AND kind = ? ORDER BY is_active DESC, sort_order ASC, name ASC',
    [kind]
  );
  return rows.map(rowToBrewer);
}

export async function getBrewer(id: number, db?: SQLiteDatabase): Promise<Brewer | null> {
  const database = db ?? (await getDatabase());
  const row = await database.getFirstAsync<BrewerRow>('SELECT * FROM brewers WHERE id = ?', [id]);
  return row ? rowToBrewer(row) : null;
}

export async function createBrewer(
  input: BrewerInput,
  db?: SQLiteDatabase
): Promise<number> {
  const database = db ?? (await getDatabase());
  const result = await database.runAsync(
    `INSERT INTO brewers (name, kind, method_id, manufacturer, model, capacity_ml, material, notes, is_active, sort_order)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      input.name,
      input.kind,
      input.methodId,
      input.manufacturer,
      input.model,
      input.capacityMl,
      input.material,
      input.notes,
      input.isActive ? 1 : 0,
      input.sortOrder,
    ]
  );
  return result.lastInsertRowId;
}

export async function updateBrewer(
  id: number,
  input: BrewerInput,
  db?: SQLiteDatabase
): Promise<void> {
  const database = db ?? (await getDatabase());
  await database.runAsync(
    `UPDATE brewers SET name = ?, kind = ?, method_id = ?, manufacturer = ?, model = ?, capacity_ml = ?,
            material = ?, notes = ?, is_active = ?, sort_order = ?,
            updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now')
      WHERE id = ?`,
    [
      input.name,
      input.kind,
      input.methodId,
      input.manufacturer,
      input.model,
      input.capacityMl,
      input.material,
      input.notes,
      input.isActive ? 1 : 0,
      input.sortOrder,
      id,
    ]
  );
}

export async function setBrewerActive(
  id: number,
  active: boolean,
  db?: SQLiteDatabase
): Promise<void> {
  const database = db ?? (await getDatabase());
  await database.runAsync(
    `UPDATE brewers SET is_active = ?, updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now')
      WHERE id = ?`,
    [active ? 1 : 0, id]
  );
}

export async function deleteBrewer(id: number, db?: SQLiteDatabase): Promise<void> {
  const database = db ?? (await getDatabase());
  await database.runAsync(
    `UPDATE brewers SET deleted = 1, is_active = 0,
            updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now')
      WHERE id = ?`,
    [id]
  );
}
