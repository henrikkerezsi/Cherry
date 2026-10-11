import type { SQLiteDatabase } from 'expo-sqlite';
import { AUDIO_RETENTION_POLICIES, THEME_MODES } from '../models';
import type { AudioRetentionPolicy, BrewMethodId, Settings, ThemeMode } from '../models';
import { getDatabase } from './database';

export const DEFAULT_SETTINGS: Settings = {
  themeMode: 'system',
  defaultMethodId: null,
  audioRetention: 'keep',
  sessionResumeThresholdMinutes: 5,
  notificationsEnabled: true,
  unloggedSessionPromptMinutes: 120,
  beanFreshnessWarningDays: 21,
  lowBeanThresholdG: 30,
  tutorialSeen: false,
  lastSeenRelease: null,
  aiAutoAccept: false,
};

type SettingsKey =
  | 'theme_mode'
  | 'default_method_id'
  | 'audio_retention'
  | 'session_resume_threshold_minutes'
  | 'notifications_enabled'
  | 'unlogged_session_prompt_minutes'
  | 'bean_freshness_warning_days'
  | 'low_bean_threshold_g'
  | 'tutorial_seen'
  | 'last_seen_release'
  | 'ai_auto_accept';

const SETTINGS_KEY_MAP: Record<keyof Settings, SettingsKey> = {
  themeMode: 'theme_mode',
  defaultMethodId: 'default_method_id',
  audioRetention: 'audio_retention',
  sessionResumeThresholdMinutes: 'session_resume_threshold_minutes',
  notificationsEnabled: 'notifications_enabled',
  unloggedSessionPromptMinutes: 'unlogged_session_prompt_minutes',
  beanFreshnessWarningDays: 'bean_freshness_warning_days',
  lowBeanThresholdG: 'low_bean_threshold_g',
  tutorialSeen: 'tutorial_seen',
  lastSeenRelease: 'last_seen_release',
  aiAutoAccept: 'ai_auto_accept',
};

function clampInt(value: number, min: number, max: number, fallback: number): number {
  if (!Number.isFinite(value)) {
    return fallback;
  }
  return Math.max(min, Math.min(max, Math.round(value)));
}

function parseThemeMode(value: string): ThemeMode {
  return (THEME_MODES as readonly string[]).includes(value)
    ? (value as ThemeMode)
    : DEFAULT_SETTINGS.themeMode;
}

function parseAudioRetention(value: string): AudioRetentionPolicy {
  return (AUDIO_RETENTION_POLICIES as readonly string[]).includes(value)
    ? (value as AudioRetentionPolicy)
    : DEFAULT_SETTINGS.audioRetention;
}

function parseMethodId(value: string): BrewMethodId | null {
  return value === '' ? null : (value as BrewMethodId);
}

function rowToSettings(rows: { key: SettingsKey; value: string }[]): Settings {
  const settings: Settings = { ...DEFAULT_SETTINGS };
  for (const row of rows) {
    switch (row.key) {
      case 'theme_mode':
        settings.themeMode = parseThemeMode(row.value);
        break;
      case 'default_method_id':
        settings.defaultMethodId = parseMethodId(row.value);
        break;
      case 'audio_retention':
        settings.audioRetention = parseAudioRetention(row.value);
        break;
      case 'session_resume_threshold_minutes':
        settings.sessionResumeThresholdMinutes = clampInt(
          Number(row.value),
          1,
          240,
          DEFAULT_SETTINGS.sessionResumeThresholdMinutes
        );
        break;
      case 'notifications_enabled':
        settings.notificationsEnabled = row.value !== '0' && row.value !== 'false';
        break;
      case 'unlogged_session_prompt_minutes':
        settings.unloggedSessionPromptMinutes = clampInt(
          Number(row.value),
          15,
          1440,
          DEFAULT_SETTINGS.unloggedSessionPromptMinutes
        );
        break;
      case 'bean_freshness_warning_days':
        settings.beanFreshnessWarningDays = clampInt(
          Number(row.value),
          1,
          365,
          DEFAULT_SETTINGS.beanFreshnessWarningDays
        );
        break;
      case 'low_bean_threshold_g':
        settings.lowBeanThresholdG = clampInt(
          Number(row.value),
          0,
          5000,
          DEFAULT_SETTINGS.lowBeanThresholdG
        );
        break;
      case 'tutorial_seen':
        settings.tutorialSeen = row.value === '1' || row.value === 'true';
        break;
      case 'last_seen_release':
        settings.lastSeenRelease = row.value === '' ? null : row.value;
        break;
      case 'ai_auto_accept':
        settings.aiAutoAccept = row.value === '1' || row.value === 'true';
        break;
    }
  }
  return settings;
}

export async function getSettings(db?: SQLiteDatabase): Promise<Settings> {
  const database = db ?? (await getDatabase());
  const rows = await database.getAllAsync<{ key: SettingsKey; value: string }>(
    'SELECT key, value FROM settings'
  );
  return rowToSettings(rows);
}

export async function updateSettings(
  patch: Partial<Settings>,
  db?: SQLiteDatabase
): Promise<Settings> {
  const database = db ?? (await getDatabase());
  const current = await getSettings(database);
  const next: Settings = { ...current, ...patch };
  for (const key of Object.keys(next) as (keyof Settings)[]) {
    const dbKey = SETTINGS_KEY_MAP[key];
    const raw = next[key];
    const value =
      raw === null
        ? ''
        : typeof raw === 'boolean'
          ? raw
            ? '1'
            : '0'
          : String(raw);
    await database.runAsync(
      `INSERT INTO settings (key, value, updated_at)
       VALUES (?, ?, strftime('%Y-%m-%dT%H:%M:%fZ','now'))
       ON CONFLICT (key) DO UPDATE SET value = excluded.value,
                                       updated_at = excluded.updated_at`,
      [dbKey, value]
    );
  }
  return next;
}
