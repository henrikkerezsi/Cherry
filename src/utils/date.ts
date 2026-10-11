import dayjs, { type Dayjs } from 'dayjs';

export const DATABASE_NAME = 'cherry.db';

export const BACKUP_EXTENSION = 'cherry';

export const STORE_DATE_FORMAT = 'YYYY-MM-DD';

export const STORE_TIMESTAMP_FORMAT = 'YYYY-MM-DDTHH:mm:ss.SSS[Z]';

export function isoNow(now?: string | Dayjs | Date): string {
  return dayjs(now ?? dayjs()).format(STORE_TIMESTAMP_FORMAT);
}

export function todayDate(now?: string | Dayjs | Date): string {
  return dayjs(now ?? dayjs()).format(STORE_DATE_FORMAT);
}

export function isIsoDate(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

export function startOfWeekDate(now?: string | Dayjs | Date): string {
  return dayjs(now ?? dayjs()).startOf('week').format(STORE_DATE_FORMAT);
}

// Midday UTC keeps a recorded date readable as the same day in every timezone.
export function dateToTimestamp(isoDate: string): string {
  return `${isoDate}T12:00:00.000Z`;
}

export function timestampDate(isoTimestamp: string): string {
  return dayjs(isoTimestamp).format(STORE_DATE_FORMAT);
}

export function dayLabel(isoDate: string): string {
  return dayjs(isoDate).format('ddd, D MMM');
}

export function longDateLabel(isoDate: string): string {
  return dayjs(isoDate).format('D MMMM YYYY');
}

export function timeLabel(isoTimestamp: string): string {
  return dayjs(isoTimestamp).format('HH:mm');
}

export function daysBetween(from: string | Dayjs | Date, to: string | Dayjs | Date): number {
  return dayjs(to).startOf('day').diff(dayjs(from).startOf('day'), 'day');
}

export function daysSince(from: string | Dayjs | Date, now?: string | Dayjs | Date): number {
  return daysBetween(from, now ?? dayjs());
}

export function elapsedLabel(totalSeconds: number | null): string {
  if (totalSeconds === null) {
    return '—';
  }
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = Math.round(totalSeconds % 60);
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

export function durationLabel(totalSeconds: number | null): string {
  if (totalSeconds === null) {
    return '—';
  }
  if (totalSeconds < 60) {
    return `${Math.round(totalSeconds)} s`;
  }
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = Math.round(totalSeconds % 60);
  if (minutes < 60) {
    return seconds === 0 ? `${minutes} min` : `${minutes} min ${seconds} s`;
  }
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  return remainder === 0 ? `${hours} h` : `${hours} h ${remainder} min`;
}
