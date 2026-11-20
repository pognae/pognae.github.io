export type DiaryRecord = {
  /** `YYYY-MM-DD` (로컬 시간대) */
  date: string;
  /** `• 첫 줄\n• 둘째 줄` 형식 */
  content: string;
  /** ISO 8601 */
  updatedAt: string;
};

export type BackupEntry = { content: string; updatedAt: string };

export type BackupFile = {
  app: '3year-diary';
  version: 1;
  exportedAt: string;
  entries: Record<string, BackupEntry>;
};

export type ImportMode = 'merge' | 'replace';

export type ImportResult = { added: number; updated: number; skipped: number };

export interface DiaryStorageAdapter {
  get(date: string): Promise<DiaryRecord | null>;
  getAll(): Promise<DiaryRecord[]>;
  save(date: string, content: string): Promise<void>;
  remove(date: string): Promise<void>;
  exportAll(): Promise<BackupFile>;
  importAll(backup: BackupFile, mode: ImportMode): Promise<ImportResult>;
}
