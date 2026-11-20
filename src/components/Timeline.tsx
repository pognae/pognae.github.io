import { parseContent } from '../lib/bullets';
import { formatShortDate, type RetroPoint } from '../lib/date';

export type RetroItem = RetroPoint & { content: string };

type TimelineProps = {
  items: RetroItem[];
  loading: boolean;
  error: boolean;
  hideEmpty: boolean;
  onToggleHideEmpty: (next: boolean) => void;
  onOpenDate: (dateKey: string) => void;
  onRetry: () => void;
};

const SKELETON_COUNT = 3;

export default function Timeline({
  items,
  loading,
  error,
  hideEmpty,
  onToggleHideEmpty,
  onOpenDate,
  onRetry,
}: TimelineProps) {
  const filled = items.filter((item) => parseContent(item.content).length > 0).length;
  const visible = hideEmpty ? items.filter((item) => parseContent(item.content).length > 0) : items;

  return (
    <section aria-labelledby="past-heading" className="rounded-2xl border border-line bg-card p-4 sm:p-5">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <h2 id="past-heading" className="text-base font-semibold tracking-tight text-ink">
            과거의 오늘
          </h2>
          <p className="mt-1 text-[13px] text-muted">
            {loading ? '12개 시점을 불러오는 중…' : `12개 시점 중 ${filled}개 기록`}
          </p>
        </div>
        <label className="inline-flex min-h-[44px] cursor-pointer items-center gap-2 text-[13px] text-muted">
          <input
            type="checkbox"
            className="h-4 w-4 rounded border-line text-pine accent-[#36654f] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pine"
            checked={hideEmpty}
            onChange={(event) => onToggleHideEmpty(event.target.checked)}
          />
          빈 날짜 숨기기
        </label>
      </div>

      <div className="mt-4 space-y-3">
        {loading ? (
          Array.from({ length: SKELETON_COUNT }, (_, index) => (
            <div key={index} className="animate-pulse rounded-2xl border border-line bg-paper/60 p-4" aria-hidden="true">
              <div className="flex items-center gap-2">
                <div className="h-5 w-16 rounded-full bg-line/80" />
                <div className="h-4 w-28 rounded bg-line/60" />
              </div>
              <div className="mt-3 h-4 w-4/5 rounded bg-line/60" />
              <div className="mt-2 h-4 w-3/5 rounded bg-line/50" />
            </div>
          ))
        ) : error ? (
          <div className="rounded-2xl border border-line bg-paper/60 p-4 text-sm text-muted">
            <p>과거 기록을 불러오지 못했습니다.</p>
            <button
              type="button"
              onClick={onRetry}
              className="mt-2 inline-flex min-h-[44px] items-center rounded-xl border border-line bg-card px-4 text-sm font-medium text-ink transition hover:border-pine hover:text-pine focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pine"
            >
              다시 시도
            </button>
          </div>
        ) : visible.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-line bg-paper/40 px-4 py-6 text-center text-sm text-muted">
            {hideEmpty
              ? '이 12개 시점에는 아직 기록이 없습니다. 오늘 한 줄을 남겨 두면 3년 뒤에 다시 만납니다.'
              : '표시할 시점이 없습니다.'}
          </p>
        ) : (
          visible.map((item) => {
            const bullets = parseContent(item.content);
            return (
              <article key={item.dateKey} className="rounded-2xl border border-line bg-paper/40 p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center rounded-full bg-pine-soft px-2.5 py-1 text-[12px] font-semibold text-pine">
                    {item.label}
                  </span>
                  <span className="text-[13px] tabular-nums text-muted">{formatShortDate(item.dateKey)}</span>
                </div>
                {bullets.length > 0 ? (
                  <ul className="mt-2.5 space-y-1 text-[15px] leading-6 text-ink">
                    {bullets.map((bullet, index) => (
                      <li key={`${item.dateKey}-${index}`} className="flex gap-2">
                        <span className="shrink-0 text-pine" aria-hidden="true">
                          •
                        </span>
                        <span className="break-words">{bullet}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-2.5 text-[14px] text-muted">기록 없음</p>
                )}
                <button
                  type="button"
                  onClick={() => onOpenDate(item.dateKey)}
                  className="mt-3 inline-flex min-h-[44px] items-center rounded-xl border border-transparent px-2 text-[13px] font-medium text-pine underline-offset-4 transition hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pine"
                >
                  이 날짜 열기 →
                </button>
              </article>
            );
          })
        )}
      </div>
    </section>
  );
}
