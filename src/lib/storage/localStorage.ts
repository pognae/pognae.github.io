import { createBackup, isNewer } from '../backup';
import type {
  BackupFile,
  DiaryRecord,
  DiaryStorageAdapter,
  ImportMode,
  ImportResult,
} from './types';

export const STORAGE_PREFIX = '3year-diary:v1:entry:';

function keyForDate(date: string): string {
  return `${STORAGE_PREFIX}${date}`;
}

function parseRecord(date: string, raw: string): DiaryRecord | null {
  try {
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed === 'string') {
      return parsed.trim() ? { date, content: parsed, updatedAt: new Date().toISOString() } : null;
    }
    if (typeof parsed === 'object' && parsed !== null) {
      const record = parsed as { content?: unknown; updatedAt?: unknown };
      if (typeof record.content !== 'string' || record.content.trim() === '') return null;
      return {
        date,
        content: record.content,
        updatedAt:
          typeof record.updatedAt === 'string' && Number.isFinite(Date.parse(record.updatedAt))
            ? new Date(record.updatedAt).toISOString()
            : new Date().toISOString(),
      };
    }
    return null;
  } catch {
    return null;
  }
}

function getStore(): Storage {
  if (typeof window === 'undefined' || !window.localStorage) {
    throw new Error('이 브라우저에서는 localStorage를 사용할 수 없습니다.');
  }
  return window.localStorage;
}

export class LocalStorageAdapter implements DiaryStorageAdapter {
  async get(date: string): Promise<DiaryRecord | null> {
    const raw = getStore().getItem(keyForDate(date));
    return raw ? parseRecord(date, raw) : null;
  }

  async getAll(): Promise<DiaryRecord[]> {
    const store = getStore();
    const records: DiaryRecord[] = [];
    for (let index = 0; index < store.length; index += 1) {
      const key = store.key(index);
      if (!key || !key.startsWith(STORAGE_PREFIX)) continue;
      const raw = store.getItem(key);
      if (!raw) continue;
      const record = parseRecord(key.slice(STORAGE_PREFIX.length), raw);
      if (record) records.push(record);
    }
    return records.sort((left, right) => (left.date < right.date ? -1 : left.date > right.date ? 1 : 0));
  }

  async save(date: string, content: string): Promise<void> {
    if (content.trim() === '') {
      await this.remove(date);
      return;
    }
    const record: DiaryRecord = {
      date,
      content,
      updatedAt: new Date().toISOString(),
    };
    try {
      getStore().setItem(keyForDate(date), JSON.stringify(record));
    } catch (error) {
      console.error('3년 다이어리: localStorage 저장에 실패했습니다.', error);
      throw new Error('저장 공간이 부족하거나 브라우저가 저장을 막았습니다.');
    }
  }

  async remove(date: string): Promise<void> {
    getStore().removeItem(keyForDate(date));
  }

  async exportAll(): Promise<BackupFile> {
    return createBackup(await this.getAll());
  }

  async importAll(backup: BackupFile, mode: ImportMode): Promise<ImportResult> {
    const store = getStore();
    const result: ImportResult = { added: 0, updated: 0, skipped: 0 };
    const records = Object.entries(backup.entries);

    // 가져온 기록은 백업 시점(updatedAt)을 그대로 보존한다.
    const write = (date: string, content: string, updatedAt: string): void => {
      store.setItem(keyForDate(date), JSON.stringify({ date, content, updatedAt }));
    };

    if (mode === 'replace') {
      const keys: string[] = [];
      for (let index = 0; index < store.length; index += 1) {
        const key = store.key(index);
        if (key && key.startsWith(STORAGE_PREFIX)) keys.push(key);
      }
      keys.forEach((key) => store.removeItem(key));
    }

    for (const [date, entry] of records) {
      const existing = mode === 'merge' ? await this.get(date) : null;
      if (existing) {
        if (isNewer(entry.updatedAt, existing.updatedAt)) {
          write(date, entry.content, entry.updatedAt);
          result.updated += 1;
        } else {
          result.skipped += 1;
        }
        continue;
      }
      if (entry.content.trim() !== '') {
        write(date, entry.content, entry.updatedAt);
        result.added += 1;
      } else {
        result.skipped += 1;
      }
    }
    return result;
  }
}
