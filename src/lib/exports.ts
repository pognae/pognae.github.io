import { parseContent } from './bullets';
import { compactDateKey, formatShortDate, parseDateKey, weekdayKo } from './date';
import type { DiaryRecord } from './storage/types';

export function sortRecords(records: readonly DiaryRecord[]): DiaryRecord[] {
  return [...records].sort((left, right) => (left.date < right.date ? -1 : left.date > right.date ? 1 : 0));
}

export function downloadFile(filename: string, content: string, mime: string): void {
  const blob = new Blob([content], { type: `${mime};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.rel = 'noopener';
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1500);
}

/** 마크다운: 날짜 오름차순 `# YYYY-MM-DD (요일)` 아래 `- 내용` 목록. */
export function toMarkdown(records: readonly DiaryRecord[], title = '3년 다이어리 기록'): string {
  const blocks = sortRecords(records).map((record) => {
    const lines = parseContent(record.content)
      .map((bullet) => `- ${bullet}`)
      .join('\n');
    return `## ${formatShortDate(record.date)}\n\n${lines}`;
  });
  return [`# ${title}`, '', blocks.join('\n\n'), ''].join('\n');
}

function csvCell(value: string): string {
  const escaped = value.replace(/"/g, '""');
  return /[",\r\n]/.test(value) ? `"${escaped}"` : escaped;
}

/** CSV: 헤더 date,weekday,content · RFC4180 인용 · 엑셀용 UTF-8 BOM. */
export function toCsv(records: readonly DiaryRecord[]): string {
  const rows = sortRecords(records).map((record) => {
    const date = parseDateKey(record.date);
    const weekday = date ? weekdayKo(date) : '';
    const content = parseContent(record.content).join(' / ');
    return [csvCell(record.date), csvCell(weekday), csvCell(content)].join(',');
  });
  return `\uFEFF${['date,weekday,content', ...rows].join('\r\n')}\r\n`;
}

export function stampForFileName(date: Date = new Date()): string {
  return compactDateKey(formatKeyOf(date));
}

function formatKeyOf(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

export function backupFileName(date: Date = new Date()): string {
  return `diary-backup-${stampForFileName(date)}.json`;
}

export function exportFileName(extension: 'md' | 'csv', date: Date = new Date()): string {
  return `3year-diary-${stampForFileName(date)}.${extension}`;
}
