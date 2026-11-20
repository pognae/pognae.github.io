/**
 * 날짜 유틸리티. 외부 날짜 라이브러리를 쓰지 않고 로컬 시간대 기준으로만 계산한다.
 * `toISOString()`은 UTC로 밀리므로 어디에서도 사용하지 않는다.
 */

export const WEEKDAYS_KO = ['일', '월', '화', '수', '목', '금', '토'] as const;

const DATE_KEY_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

function pad2(value: number): string {
  return value < 10 ? `0${value}` : String(value);
}

/** 로컬 시간대의 연·월·일을 각각 꺼내 `YYYY-MM-DD`로 조립한다. */
export function toDateKey(date: Date): string {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
}

export function todayKey(): string {
  return toDateKey(new Date());
}

/** 형식과 실제 달력 유효성을 함께 확인한다(2026-02-30 같은 값 거부). */
export function parseDateKey(value: string | null | undefined): Date | null {
  if (!value) return null;
  const match = DATE_KEY_PATTERN.exec(value.trim());
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  const parsed = new Date(year, month - 1, day);
  if (
    parsed.getFullYear() !== year ||
    parsed.getMonth() !== month - 1 ||
    parsed.getDate() !== day
  ) {
    return null;
  }
  return parsed;
}

export function isValidDateKey(value: string | null | undefined): boolean {
  return parseDateKey(value) !== null;
}

/** 유효하지 않으면 오늘로 대체한다. */
export function dateKeyOrToday(value: string | null | undefined): string {
  const parsed = parseDateKey(value);
  return parsed ? toDateKey(parsed) : todayKey();
}

export function addDays(date: Date, days: number): Date {
  const next = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  next.setDate(next.getDate() + days);
  return next;
}

/**
 * 월 단위 이동. 대상 월에 같은 일이 없으면 그 달 말일로 맞춘다.
 * 3/31의 1개월 전 → 2/28(윤년 2/29), 2024-02-29의 1년 전 → 2023-02-28.
 */
export function shiftMonths(date: Date, months: number): Date {
  const totalMonths = date.getFullYear() * 12 + date.getMonth() + months;
  const year = Math.floor(totalMonths / 12);
  const month = totalMonths - year * 12;
  const lastDay = new Date(year, month + 1, 0).getDate();
  return new Date(year, month, Math.min(date.getDate(), lastDay));
}

export function weekdayKo(date: Date): string {
  return WEEKDAYS_KO[date.getDay()] ?? '';
}

/** "2026년 11월 18일 (수)" */
export function formatKoreanDate(dateKey: string): string {
  const date = parseDateKey(dateKey);
  if (!date) return dateKey;
  return `${date.getFullYear()}년 ${date.getMonth() + 1}월 ${date.getDate()}일 (${weekdayKo(date)})`;
}

/** "2024-11-18 (월)" */
export function formatShortDate(dateKey: string): string {
  const date = parseDateKey(dateKey);
  if (!date) return dateKey;
  return `${toDateKey(date)} (${weekdayKo(date)})`;
}

export type RetroPoint = {
  /** 카드 라벨: 3년 전, 1달 전, 어제 … */
  label: string;
  /** 계산된 날짜 키 */
  dateKey: string;
  /** 36개월·21일처럼 계산 근거를 남기는 값 */
  offset: string;
};

type RetroOffset = { months?: number; days?: number; label: string; offset: string };

/** 과거 → 최근 순서. 오늘은 입력 영역과 겹치므로 넣지 않는다. */
const RETRO_OFFSETS: readonly RetroOffset[] = [
  { months: 36, label: '3년 전', offset: '36개월' },
  { months: 24, label: '2년 전', offset: '24개월' },
  { months: 12, label: '1년 전', offset: '12개월' },
  { months: 6, label: '6개월 전', offset: '6개월' },
  { months: 3, label: '3개월 전', offset: '3개월' },
  { months: 1, label: '1달 전', offset: '1개월' },
  { days: 21, label: '3주일 전', offset: '21일' },
  { days: 14, label: '2주일 전', offset: '14일' },
  { days: 7, label: '1주일 전', offset: '7일' },
  { days: 3, label: '3일 전', offset: '3일' },
  { days: 2, label: '2일 전', offset: '2일' },
  { days: 1, label: '어제', offset: '1일' },
];

export function retroDates(baseDateKey: string): RetroPoint[] {
  const base = parseDateKey(baseDateKey) ?? new Date();
  return RETRO_OFFSETS.map((offset) => {
    const target =
      offset.months !== undefined
        ? shiftMonths(base, -offset.months)
        : addDays(base, -(offset.days ?? 0));
    return { label: offset.label, dateKey: toDateKey(target), offset: offset.offset };
  });
}

/** 파일 이름에 쓰는 `YYYYMMDD` */
export function compactDateKey(dateKey: string): string {
  return dateKey.replace(/-/g, '');
}
