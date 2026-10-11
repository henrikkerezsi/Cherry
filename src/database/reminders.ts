import type { SQLiteDatabase } from 'expo-sqlite';
import type { Reminder, ReminderKind } from '../models';
import { getDatabase } from './database';

interface ReminderRow {
  id: number;
  uuid: string | null;
  kind: string;
  bean_id: number | null;
  brew_id: number | null;
  due_at: string | null;
  dismissed_at: string | null;
  created_at: string;
  updated_at: string | null;
}

function rowToReminder(row: ReminderRow): Reminder {
  return {
    id: row.id,
    uuid: row.uuid,
    kind: row.kind as ReminderKind,
    beanId: row.bean_id,
    brewId: row.brew_id,
    dueAt: row.due_at,
    dismissedAt: row.dismissed_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export interface ReminderInput {
  kind: ReminderKind;
  beanId: number | null;
  brewId: number | null;
  dueAt: string | null;
  dismissedAt: string | null;
}

export async function getAllReminders(db?: SQLiteDatabase): Promise<Reminder[]> {
  const database = db ?? (await getDatabase());
  const rows = await database.getAllAsync<ReminderRow>(
    'SELECT * FROM reminders ORDER BY COALESCE(due_at, created_at) ASC, id ASC'
  );
  return rows.map(rowToReminder);
}

export async function getPendingReminders(db?: SQLiteDatabase): Promise<Reminder[]> {
  const database = db ?? (await getDatabase());
  const rows = await database.getAllAsync<ReminderRow>(
    'SELECT * FROM reminders WHERE dismissed_at IS NULL ORDER BY COALESCE(due_at, created_at) ASC, id ASC'
  );
  return rows.map(rowToReminder);
}

export async function getRemindersByKind(
  kind: ReminderKind,
  db?: SQLiteDatabase
): Promise<Reminder[]> {
  const database = db ?? (await getDatabase());
  const rows = await database.getAllAsync<ReminderRow>(
    'SELECT * FROM reminders WHERE kind = ? ORDER BY id ASC',
    [kind]
  );
  return rows.map(rowToReminder);
}

export async function createReminder(input: ReminderInput, db?: SQLiteDatabase): Promise<number> {
  const database = db ?? (await getDatabase());
  const result = await database.runAsync(
    'INSERT INTO reminders (kind, bean_id, brew_id, due_at, dismissed_at) VALUES (?, ?, ?, ?, ?)',
    [input.kind, input.beanId, input.brewId, input.dueAt, input.dismissedAt]
  );
  return result.lastInsertRowId;
}

export async function dismissReminder(id: number, db?: SQLiteDatabase): Promise<void> {
  const database = db ?? (await getDatabase());
  await database.runAsync(
    `UPDATE reminders SET dismissed_at = strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id = ?`,
    [id]
  );
}

export async function deleteRemindersByKind(
  kind: ReminderKind,
  db?: SQLiteDatabase
): Promise<void> {
  const database = db ?? (await getDatabase());
  await database.runAsync('DELETE FROM reminders WHERE kind = ?', [kind]);
}

export async function deleteRemindersForBean(beanId: number, db?: SQLiteDatabase): Promise<void> {
  const database = db ?? (await getDatabase());
  await database.runAsync('DELETE FROM reminders WHERE bean_id = ?', [beanId]);
}