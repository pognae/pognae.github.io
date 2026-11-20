import { isValidDateKey } from './date';
import type { BackupEntry, BackupFile, DiaryRecord, ImportMode } from './storage/types';

export const BACKUP_APP = '3year-diary';

export function createBackup(records: DiaryRecord[], now: Date = new Date()): BackupFile {
  const entries: Record<string, BackupEntry> = {};
  for (const record of records) {
    entries[record.date] = { content: record.content, updatedAt: record.updatedAt };
  }
  return {
    app: BACKUP_APP,
    version: 1,
    exportedAt: now.toISOString(),
    entries,
  };
}

export type ParsedBackup = {
  backup: BackupFile;
  valid: DiaryRecord[];
  invalidDates: string[];
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function normalizeTimestamp(value: unknown): string {
  if (typeof value === 'string' && Number.isFinite(Date.parse(value))) {
    return new Date(value).toISOString();
  }
  return new Date().toISOString();
}

/**
 * 백업 JSON 문자열을 검증한다. 형식이 아니면 오류 메시지를 던진다.
 * 날짜 형식이 틀린 항목은 버리고 invalidDates에 남긴다.
 */
export function parseBackupText(text: string): ParsedBackup {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error('JSON 파일을 읽지 못했습니다. 파일이 손상되지 않았는지 확인해 주세요.');
  }
  if (!isRecord(parsed)) {
    throw new Error('백업 파일 형식이 아닙니다.');
  }
  if (parsed.app !== undefined && parsed.app !== BACKUP_APP) {
    throw new Error('3년 다이어리 백업 파일이 아닙니다.');
  }
  const rawEntries = parsed.entries;
  if (!isRecord(rawEntries)) {
    throw new Error('백업 파일에 entries가 없습니다.');
  }

  const valid: DiaryRecord[] = [];
  const invalidDates: string[] = [];
  for (const [date, value] of Object.entries(rawEntries)) {
    if (!isValidDateKey(date) || !isRecord(value) || typeof value.content !== 'string') {
      invalidDates.push(date);
      continue;
    }
    if (value.content.trim().length === 0) {
      invalidDates.push(date);
      continue;
    }
    valid.push({
      date,
      content: value.content,
      updatedAt: normalizeTimestamp(value.updatedAt),
    });
  }

  return {
    backup: {
      app: BACKUP_APP,
      version: 1,
      exportedAt:
        typeof parsed.exportedAt === 'string' && Number.isFinite(Date.parse(parsed.exportedAt))
          ? new Date(parsed.exportedAt).toISOString()
          : new Date().toISOString(),
      entries: Object.fromEntries(valid.map((record) => [record.date, { content: record.content, updatedAt: record.updatedAt }])),
    },
    valid,
    invalidDates,
  };
}

export function backupRecords(backup: BackupFile): DiaryRecord[] {
  return Object.entries(backup.entries).map(([date, entry]) => ({
    date,
    content: entry.content,
    updatedAt: entry.updatedAt,
  }));
}

export function compareTimestamp(a: string, b: string): number {
  const left = Date.parse(a);
  const right = Date.parse(b);
  if (!Number.isFinite(left) || !Number.isFinite(right)) return 0;
  return left === right ? 0 : left > right ? 1 : -1;
}

export function isNewer(candidate: string, current: string): boolean {
  return compareTimestamp(candidate, current) > 0;
}

export type ImportPreview = { total: number; overlap: number; mode: ImportMode };
