import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { backupDatabaseAsync, openDatabaseAsync, type SQLiteDatabase } from 'expo-sqlite';
import dayjs from 'dayjs';
import { getDatabase } from '../database/database';
import { BACKUP_EXTENSION } from './date';
import { toFilePath } from './paths';

export const BACKUP_MIME_TYPE = 'application/x-sqlite3';

function timestampSlug(): string {
  return dayjs().format('YYYY-MM-DD_HH-mm-ss');
}

/**
 * Writes the whole database to a staging copy with the AI credentials removed.
 *
 * The backup is produced through SQLite's online backup API rather than
 * `serializeAsync` because the staging copy has to be modified before it is
 * handed out, and WAL contents must be folded into the main file for the
 * result to be a complete, openable database.
 *
 * Credentials are stripped because a backup is a file the user sends to
 * themselves, and AGENTS.md §9.2 forbids an API key ever leaving the device.
 * The remaining provider configuration (base URL, model, enabled flag) is kept,
 * so a restore needs no reconfiguration beyond the key.
 */
export async function createBackupFile(): Promise<File> {
  const db = await getDatabase();
  const name = `cherry-backup-${timestampSlug()}.${BACKUP_EXTENSION}`;
  const file = new File(Paths.cache, name);
  file.create({ intermediates: true, overwrite: true });

  let stagedDb: SQLiteDatabase | null = null;
  try {
    stagedDb = await openDatabaseAsync(name, {}, toFilePath(Paths.cache.uri));
    await backupDatabaseAsync({ sourceDatabase: db, destDatabase: stagedDb });
    await stagedDb.runAsync(
      'UPDATE ai_state SET llm_api_key = NULL, stt_api_key = NULL WHERE id = 1'
    );
    await stagedDb.execAsync('VACUUM;');
  } finally {
    await stagedDb?.closeAsync();
  }

  return file;
}

export async function shareBackup(): Promise<boolean> {
  if (!(await Sharing.isAvailableAsync())) {
    return false;
  }
  const file = await createBackupFile();
  try {
    await Sharing.shareAsync(file.uri, {
      mimeType: BACKUP_MIME_TYPE,
      dialogTitle: 'Cherry backup',
    });
  } finally {
    if (file.exists) {
      file.delete();
    }
  }
  return true;
}

/**
 * Replaces the app's database with the picked backup using SQLite's online
 * backup API. The picked file is staged in the app cache first, so the restore
 * never depends on expo-file-system having write access to the database
 * directory.
 *
 * This is destructive by design: everything currently in the app is replaced.
 */
export async function restoreFromBackup(fileUri: string): Promise<void> {
  const source = new File(fileUri);
  const bytes = await source.bytes();

  const tempName = `cherry-restore-${Date.now()}.${BACKUP_EXTENSION}`;
  const tempFile = new File(Paths.cache, tempName);
  tempFile.create({ intermediates: true, overwrite: true });
  tempFile.write(bytes);

  let tempDb: SQLiteDatabase | null = null;
  try {
    tempDb = await openDatabaseAsync(tempName, {}, toFilePath(Paths.cache.uri));
    const db = await getDatabase();
    await backupDatabaseAsync({ sourceDatabase: tempDb, destDatabase: db });
  } finally {
    await tempDb?.closeAsync();
    if (tempFile.exists) {
      tempFile.delete();
    }
  }
}

export async function pickBackupFile(): Promise<File | null> {
  const result = await File.pickFileAsync({
    mimeTypes: [BACKUP_MIME_TYPE, 'application/octet-stream'],
  });
  if (result.canceled) {
    return null;
  }
  return result.result;
}