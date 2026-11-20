import { describe, expect, it } from 'vitest';
import { parseBackupText, createBackup } from './backup';
import { toCsv, toMarkdown } from './exports';
import type { DiaryRecord } from './storage/types';

const records: DiaryRecord[] = [
  { date: '2026-11-18', content: '• 첫 줄\n• 둘째, 줄', updatedAt: '2026-11-18T09:00:00.000Z' },
  { date: '2026-11-17', content: '• 어제 한 줄', updatedAt: '2026-11-17T09:00:00.000Z' },
];

describe('백업 파일', () => {
  it('내보낸 형식을 다시 읽을 수 있다', () => {
    const backup = createBackup(records, new Date('2026-11-19T00:00:00.000Z'));
    const parsed = parseBackupText(JSON.stringify(backup));
    expect(parsed.valid).toHaveLength(2);
    expect(parsed.backup.entries['2026-11-18']?.content).toBe('• 첫 줄\n• 둘째, 줄');
  });

  it('날짜 형식이 틀린 항목은 invalidDates로 분리한다', () => {
    const text = JSON.stringify({
      app: '3year-diary',
      version: 1,
      entries: { '2026-11-18': { content: '• 좋은 날', updatedAt: '2026-11-18T09:00:00.000Z' }, '2026-02-30': { content: '• 이상한 날' } },
    });
    const parsed = parseBackupText(text);
    expect(parsed.valid.map((record) => record.date)).toEqual(['2026-11-18']);
    expect(parsed.invalidDates).toEqual(['2026-02-30']);
  });

  it('다른 앱의 파일은 거부한다', () => {
    expect(() => parseBackupText(JSON.stringify({ app: 'other', entries: {} }))).toThrow();
    expect(() => parseBackupText('not json')).toThrow();
  });
});

describe('내보내기 형식', () => {
  it('마크다운은 날짜 오름차순으로 정리된다', () => {
    const markdown = toMarkdown(records, '테스트 기록');
    expect(markdown.indexOf('2026-11-17')).toBeLessThan(markdown.indexOf('2026-11-18'));
    expect(markdown).toContain('- 첫 줄');
    expect(markdown).toContain('## 2026-11-18 (수)');
  });

  it('CSV는 BOM과 헤더를 넣고 쉼표를 인용한다', () => {
    const csv = toCsv(records);
    expect(csv.startsWith('\uFEFF')).toBe(true);
    expect(csv).toContain('date,weekday,content');
    expect(csv).toContain('"첫 줄 / 둘째, 줄"');
    expect(csv.indexOf('2026-11-17')).toBeLessThan(csv.indexOf('2026-11-18'));
  });
});
