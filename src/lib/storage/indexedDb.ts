import { createBackup, isNewer } from '../backup';
import type {
  BackupFile,
  DiaryRecord,
  DiaryStorageAdapter,
  ImportMode,
  ImportResult,
} from './types';

const DB_NAME = '3year-diary';
const DB_VERSION = 1;
const STORE_NAME = 'entries';

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('이 브라우저에서는 IndexedDB를 사용할 수 없습니다.'));
      return;
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains(STORE_NAME)) {
        database.createObjectStore(STORE_NAME, { keyPath: 'date' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('IndexedDB를 열지 못했습니다.'));
  });
}

function requestToPromise<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('IndexedDB 요청이 실패했습니다.'));
  });
}

function transactionDone(transaction: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error ?? new Error('IndexedDB 트랜잭션이 실패했습니다.'));
    transaction.onabort = () => reject(transaction.error ?? new Error('IndexedDB 트랜잭션이 취소되었습니다.'));
  });
}

export class IndexedDbAdapter implements DiaryStorageAdapter {
  private databasePromise: Promise<IDBDatabase> | null = null;

  private database(): Promise<IDBDatabase> {
    if (!this.databasePromise) this.databasePromise = openDatabase();
    return this.databasePromise;
  }

  async get(date: string): Promise<DiaryRecord | null> {
    const database = await this.database();
    const transaction = database.transaction(STORE_NAME, 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const record = await requestToPromise<DiaryRecord | undefined>(store.get(date));
    if (!record || !record.content || record.content.trim() === '') return null;
    return record;
  }

  async getAll(): Promise<DiaryRecord[]> {
    const database = await this.database();
    const transaction = database.transaction(STORE_NAME, 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const records = await requestToPromise<DiaryRecord[]>(store.getAll());
    return records
      .filter((record) => record.content.trim() !== '')
      .sort((left, right) => (left.date < right.date ? -1 : left.date > right.date ? 1 : 0));
  }

  async save(date: string, content: string): Promise<void> {
    if (content.trim() === '') {
      await this.remove(date);
      return;
    }
    const record: DiaryRecord = { date, content, updatedAt: new Date().toISOString() };
    const database = await this.database();
    const transaction = database.transaction(STORE_NAME, 'readwrite');
    transaction.objectStore(STORE_NAME).put(record);
    await transactionDone(transaction);
  }

  async remove(date: string): Promise<void> {
    const database = await this.database();
    const transaction = database.transaction(STORE_NAME, 'readwrite');
    transaction.objectStore(STORE_NAME).delete(date);
    await transactionDone(transaction);
  }

  async exportAll(): Promise<BackupFile> {
    return createBackup(await this.getAll());
  }

  async importAll(backup: BackupFile, mode: ImportMode): Promise<ImportResult> {
    const result: ImportResult = { added: 0, updated: 0, skipped: 0 };
    const entries = Object.entries(backup.entries);
    if (mode === 'replace') {
      const database = await this.database();
      const transaction = database.transaction(STORE_NAME, 'readwrite');
      transaction.objectStore(STORE_NAME).clear();
      await transactionDone(transaction);
    }

    for (const [date, entry] of entries) {
      if (entry.content.trim() === '') {
        result.skipped += 1;
        continue;
      }
      const existing = mode === 'merge' ? await this.get(date) : null;
      if (existing && !isNewer(entry.updatedAt, existing.updatedAt)) {
        result.skipped += 1;
        continue;
      }
      const record: DiaryRecord = { date, content: entry.content, updatedAt: entry.updatedAt };
      const database = await this.database();
      const transaction = database.transaction(STORE_NAME, 'readwrite');
      transaction.objectStore(STORE_NAME).put(record);
      await transactionDone(transaction);
      if (existing) result.updated += 1;
      else result.added += 1;
    }
    return result;
  }
}
