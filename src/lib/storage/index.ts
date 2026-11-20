import { IndexedDbAdapter } from './indexedDb';
import { LocalStorageAdapter } from './localStorage';
import type { DiaryStorageAdapter } from './types';

export type { DiaryRecord, DiaryStorageAdapter, BackupFile, ImportMode, ImportResult } from './types';
export { STORAGE_PREFIX } from './localStorage';
export { createBackup, parseBackupText, backupRecords } from '../backup';

/** `VITE_STORAGE=idb`면 IndexedDB, 그 외에는 localStorage. */
export function createStorageAdapter(): DiaryStorageAdapter {
  const preference = import.meta.env.VITE_STORAGE;
  if (preference === 'idb') return new IndexedDbAdapter();
  return new LocalStorageAdapter();
}

export const storage: DiaryStorageAdapter = createStorageAdapter();
