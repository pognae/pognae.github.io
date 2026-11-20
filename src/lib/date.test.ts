import { describe, expect, it } from 'vitest';
import {
  addDays,
  formatKoreanDate,
  formatShortDate,
  parseDateKey,
  retroDates,
  shiftMonths,
  toDateKey,
  weekdayKo,
} from './date';

function keyOf(value: string): string {
  const date = parseDateKey(value);
  if (!date) throw new Error(`invalid test date: ${value}`);
  return toDateKey(date);
}

describe('shiftMonths 말일 보정', () => {
  it('3월 31일의 1개월 전은 2월 28일', () => {
    expect(keyOf('2026-03-31')).toBe('2026-03-31');
    expect(toDateKey(shiftMonths(parseDateKey('2026-03-31')!, -1))).toBe('2026-02-28');
  });

  it('윤년 2월 29일의 1년 전은 2023년 2월 28일', () => {
    expect(toDateKey(shiftMonths(parseDateKey('2024-02-29')!, -12))).toBe('2023-02-28');
  });

  it('3월 31일의 1개월 전은 윤년이면 2월 29일', () => {
    expect(toDateKey(shiftMonths(parseDateKey('2024-03-31')!, -1))).toBe('2024-02-29');
  });

  it('연도를 넘어가도 유지된다', () => {
    expect(toDateKey(shiftMonths(parseDateKey('2026-01-15')!, -1))).toBe('2025-12-15');
  });
});

describe('retroDates', () => {
  const points = retroDates('2026-11-18');

  it('12개 시점을 과거 → 최근 순서로 돌려준다', () => {
    expect(points).toHaveLength(12);
    expect(points.map((point) => point.dateKey)).toEqual([
      '2023-11-18',
      '2024-11-18',
      '2025-11-18',
      '2026-05-18',
      '2026-08-18',
      '2026-10-18',
      '2026-10-28',
      '2026-11-04',
      '2026-11-11',
      '2026-11-15',
      '2026-11-16',
      '2026-11-17',
    ]);
  });

  it('라벨이 3년 전 → 어제 순서로 붙는다', () => {
    expect(points.map((point) => point.label)).toEqual([
      '3년 전',
      '2년 전',
      '1년 전',
      '6개월 전',
      '3개월 전',
      '1달 전',
      '3주일 전',
      '2주일 전',
      '1주일 전',
      '3일 전',
      '2일 전',
      '어제',
    ]);
  });
});

describe('날짜 키', () => {
  it('2026년 11월 18일은 수요일이다', () => {
    const date = parseDateKey('2026-11-18');
    expect(date).not.toBeNull();
    expect(weekdayKo(date!)).toBe('수');
    expect(formatKoreanDate('2026-11-18')).toBe('2026년 11월 18일 (수)');
    expect(formatShortDate('2026-11-18')).toBe('2026-11-18 (수)');
  });

  it('존재하지 않는 날짜는 거부한다', () => {
    expect(parseDateKey('2026-02-30')).toBeNull();
    expect(parseDateKey('2026-13-01')).toBeNull();
    expect(parseDateKey('2026-1-1')).toBeNull();
    expect(parseDateKey('오늘')).toBeNull();
  });

  it('연말·연초를 넘는 하루 이동', () => {
    expect(toDateKey(addDays(parseDateKey('2026-12-31')!, 1))).toBe('2027-01-01');
    expect(toDateKey(addDays(parseDateKey('2027-01-01')!, -1))).toBe('2026-12-31');
  });
});
