import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import AdSlot from './components/AdSlot';
import BulletEditor from './components/BulletEditor';
import Modal from './components/Modal';
import Timeline, { type RetroItem } from './components/Timeline';
import { countFilledBullets, parseContent, serializeBullets } from './lib/bullets';
import {
  addDays,
  dateKeyOrToday,
  formatKoreanDate,
  parseDateKey,
  retroDates,
  toDateKey,
  todayKey,
} from './lib/date';
import { parseBackupText } from './lib/backup';
import { storage, type BackupFile } from './lib/storage';
import { backupFileName, downloadFile, exportFileName, toCsv, toMarkdown } from './lib/exports';

type SaveStatus = 'idle' | 'dirty' | 'saving' | 'saved' | 'error';
type DialogState = { kind: 'import' } | { kind: 'markdown' } | { kind: 'delete' } | null;

const HIDE_EMPTY_KEY = '3year-diary:v1:hide-empty';

function readInitialDate(): string {
  if (typeof window === 'undefined') return todayKey();
  const parameter = new URLSearchParams(window.location.search).get('date');
  return dateKeyOrToday(parameter);
}

function readHideEmpty(): boolean {
  try {
    const raw = window.localStorage.getItem(HIDE_EMPTY_KEY);
    return raw === null ? true : raw === 'true';
  } catch {
    return true;
  }
}

function timeLabel(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: false });
}

type ImportPreview = {
  backup: BackupFile;
  total: number;
  overlap: number;
  invalid: number;
  fileName: string;
};

export default function App() {
  const [dateKey, setDateKey] = useState<string>(readInitialDate);
  const [reloadToken, setReloadToken] = useState(0);
  const [editorKey, setEditorKey] = useState(0);
  const [initialBullets, setInitialBullets] = useState<string[]>(['']);
  const [bullets, setBullets] = useState<string[]>(['']);
  const [editorReady, setEditorReady] = useState(false);
  const [loadingEntry, setLoadingEntry] = useState(true);
  const [status, setStatus] = useState<SaveStatus>('idle');
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [retroItems, setRetroItems] = useState<RetroItem[]>([]);
  const [retroLoading, setRetroLoading] = useState(true);
  const [retroError, setRetroError] = useState(false);
  const [retroToken, setRetroToken] = useState(0);
  const [hideEmpty, setHideEmpty] = useState<boolean>(readHideEmpty);
  const [menuOpen, setMenuOpen] = useState(false);
  const [dialog, setDialog] = useState<DialogState>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [importPreview, setImportPreview] = useState<ImportPreview | null>(null);
  const [confirmReplace, setConfirmReplace] = useState(false);
  const [markdownRange, setMarkdownRange] = useState({ start: '', end: '' });

  const loadedRaw = useRef('');
  const dateRef = useRef(dateKey);
  const bulletsRef = useRef(bullets);
  const retroSeq = useRef(0);
  const menuRef = useRef<HTMLDivElement>(null);

  const saveCurrent = useCallback(async (): Promise<boolean> => {
    const content = serializeBullets(bulletsRef.current);
    const targetDate = dateRef.current;
    if (content === loadedRaw.current) return true;

    if (content.trim() === '') {
      if (loadedRaw.current.trim() === '') return true;
      try {
        await storage.remove(targetDate);
        if (dateRef.current === targetDate) {
          loadedRaw.current = '';
          setStatus('idle');
          setSavedAt(null);
        }
        return true;
      } catch (error) {
        console.error('3년 다이어리: 기록 삭제에 실패했습니다.', error);
        setStatus('error');
        return false;
      }
    }

    setStatus('saving');
    try {
      await storage.save(targetDate, content);
      if (dateRef.current !== targetDate) return true;
      loadedRaw.current = content;
      setStatus('saved');
      setSavedAt(timeLabel(new Date().toISOString()));
      setRetroToken((token) => token + 1);
      return true;
    } catch (error) {
      console.error('3년 다이어리: 저장에 실패했습니다.', error);
      setStatus('error');
      return false;
    }
  }, []);

  // 날짜가 바뀌면 그 날짜 기록을 불러와 편집기를 다시 마운트한다.
  useEffect(() => {
    let cancelled = false;
    setLoadingEntry(true);
    setEditorReady(false);
    storage
      .get(dateKey)
      .then((record) => {
        if (cancelled) return;
        const content = record?.content ?? '';
        loadedRaw.current = content;
        const parsed = parseContent(content);
        const next = parsed.length > 0 ? parsed : [''];
        setInitialBullets(next);
        setBullets(next);
        bulletsRef.current = next;
        setStatus(record ? 'saved' : 'idle');
        setSavedAt(record ? timeLabel(record.updatedAt) : null);
        setEditorKey((key) => key + 1);
        setLoadingEntry(false);
        setEditorReady(true);
      })
      .catch((error) => {
        console.error('3년 다이어리: 기록을 불러오지 못했습니다.', error);
        if (cancelled) return;
        setStatus('error');
        setLoadingEntry(false);
        setEditorReady(true);
      });
    return () => {
      cancelled = true;
    };
  }, [dateKey, reloadToken]);

  // 입력이 멈추고 1.2초 뒤 자동 저장. 불러온 원문과 같으면 아무것도 쓰지 않는다.
  useEffect(() => {
    bulletsRef.current = bullets;
    if (!editorReady) return;
    const content = serializeBullets(bullets);
    if (content === loadedRaw.current) {
      setStatus((previous) => (previous === 'dirty' ? (loadedRaw.current ? 'saved' : 'idle') : previous));
      return;
    }
    setStatus((previous) => (previous === 'saving' ? previous : 'dirty'));
    const timer = window.setTimeout(() => {
      void saveCurrent();
    }, 1200);
    return () => window.clearTimeout(timer);
  }, [bullets, editorReady, saveCurrent]);

  // 날짜·저장 후 회고 타임라인 병렬 조회. 늦게 도착한 응답은 버린다.
  useEffect(() => {
    const sequence = retroSeq.current + 1;
    retroSeq.current = sequence;
    setRetroLoading(true);
    setRetroError(false);
    const points = retroDates(dateKey);
    Promise.all(
      points.map(async (point) => {
        const record = await storage.get(point.dateKey);
        return { ...point, content: record?.content ?? '' };
      }),
    )
      .then((items) => {
        if (sequence !== retroSeq.current) return;
        setRetroItems(items);
        setRetroLoading(false);
      })
      .catch((error) => {
        console.error('3년 다이어리: 과거 기록을 불러오지 못했습니다.', error);
        if (sequence !== retroSeq.current) return;
        setRetroError(true);
        setRetroLoading(false);
      });
  }, [dateKey, retroToken]);

  // 주소의 ?date= 동기화 (새로고침 없이 replaceState).
  useEffect(() => {
    dateRef.current = dateKey;
    const url = new URL(window.location.href);
    if (url.searchParams.get('date') === dateKey) return;
    url.searchParams.set('date', dateKey);
    window.history.replaceState(null, '', `${url.pathname}${url.search}${url.hash}`);
  }, [dateKey]);

  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(null), 4000);
    return () => window.clearTimeout(timer);
  }, [notice]);

  useEffect(() => {
    const handler = (event: MouseEvent) => {
      if (!menuRef.current) return;
      if (!menuRef.current.contains(event.target as Node)) setMenuOpen(false);
    };
    if (menuOpen) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [menuOpen]);

  // 페이지를 떠나기 전 미저장분을 한 번 더 밀어 넣는다.
  useEffect(() => {
    const handler = (event: BeforeUnloadEvent) => {
      const content = serializeBullets(bulletsRef.current);
      if (content === loadedRaw.current) return;
      if (content.trim() === '') void storage.remove(dateRef.current).catch(() => undefined);
      else void storage.save(dateRef.current, content).catch(() => undefined);
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, []);

  const goToDate = (nextKey: string) => {
    if (!parseDateKey(nextKey) || nextKey === dateKey) return;
    const pending = serializeBullets(bulletsRef.current) !== loadedRaw.current;
    if (!pending) {
      setDateKey(nextKey);
      return;
    }
    // 날짜를 옮기기 전에 아직 저장되지 않은 입력을 먼저 저장한다.
    void (async () => {
      await saveCurrent();
      setDateKey(nextKey);
    })();
  };

  const shiftDay = (amount: number) => {
    const base = parseDateKey(dateKey) ?? new Date();
    goToDate(toDateKey(addDays(base, amount)));
  };

  const handleSaveClick = async () => {
    const saved = await saveCurrent();
    setNotice(saved ? '저장했습니다.' : '저장하지 못했습니다. 잠시 후 다시 시도해 주세요.');
  };

  const handleDeleteDate = async () => {
    setBusy(true);
    try {
      await storage.remove(dateKey);
      loadedRaw.current = '';
      setBullets(['']);
      bulletsRef.current = [''];
      setInitialBullets(['']);
      setEditorKey((key) => key + 1);
      setStatus('idle');
      setSavedAt(null);
      setRetroToken((token) => token + 1);
      setDialog(null);
      setNotice('이 날짜 기록을 지웠습니다.');
    } catch (error) {
      console.error('3년 다이어리: 기록 삭제에 실패했습니다.', error);
      setNotice('삭제하지 못했습니다. 잠시 후 다시 시도해 주세요.');
    } finally {
      setBusy(false);
    }
  };

  const exportJson = async () => {
    setMenuOpen(false);
    try {
      const backup = await storage.exportAll();
      if (Object.keys(backup.entries).length === 0) {
        setNotice('아직 저장된 기록이 없습니다.');
        return;
      }
      downloadFile(backupFileName(), JSON.stringify(backup, null, 2), 'application/json');
      setNotice('JSON 백업 파일을 내려받았습니다.');
    } catch (error) {
      console.error('3년 다이어리: 백업 생성에 실패했습니다.', error);
      setNotice('백업 파일을 만들지 못했습니다.');
    }
  };

  const exportCsv = async () => {
    setMenuOpen(false);
    try {
      const records = await storage.getAll();
      if (records.length === 0) {
        setNotice('아직 저장된 기록이 없습니다.');
        return;
      }
      downloadFile(exportFileName('csv'), toCsv(records), 'text/csv');
      setNotice(`CSV ${records.length}건을 내려받았습니다.`);
    } catch (error) {
      console.error('3년 다이어리: CSV 생성에 실패했습니다.', error);
      setNotice('CSV 파일을 만들지 못했습니다.');
    }
  };

  const openMarkdownDialog = async () => {
    setMenuOpen(false);
    try {
      const records = await storage.getAll();
      if (records.length === 0) {
        setNotice('아직 저장된 기록이 없습니다.');
        return;
      }
      setMarkdownRange({ start: records[0]?.date ?? todayKey(), end: todayKey() });
      setDialog({ kind: 'markdown' });
    } catch (error) {
      console.error('3년 다이어리: 기록을 읽지 못했습니다.', error);
      setNotice('기록을 읽지 못했습니다.');
    }
  };

  const exportMarkdown = async () => {
    setBusy(true);
    try {
      const records = await storage.getAll();
      const start = markdownRange.start || '0000-01-01';
      const end = markdownRange.end || '9999-12-31';
      const filtered = records.filter((record) => record.date >= start && record.date <= end);
      if (filtered.length === 0) {
        setNotice('선택한 기간에 기록이 없습니다.');
        return;
      }
      downloadFile(exportFileName('md'), toMarkdown(filtered), 'text/markdown');
      setDialog(null);
      setNotice(`마크다운 ${filtered.length}건을 내려받았습니다.`);
    } catch (error) {
      console.error('3년 다이어리: 마크다운 생성에 실패했습니다.', error);
      setNotice('마크다운 파일을 만들지 못했습니다.');
    } finally {
      setBusy(false);
    }
  };

  const handleBackupFile = async (file: File) => {
    setBusy(true);
    try {
      const text = await file.text();
      const parsed = parseBackupText(text);
      const existing = await storage.getAll();
      const dates = new Set(existing.map((record) => record.date));
      const overlap = parsed.valid.filter((record) => dates.has(record.date)).length;
      setImportPreview({
        backup: parsed.backup,
        total: parsed.valid.length,
        overlap,
        invalid: parsed.invalidDates.length,
        fileName: file.name,
      });
      setConfirmReplace(false);
    } catch (error) {
      setImportPreview(null);
      setNotice(error instanceof Error ? error.message : '백업 파일을 읽지 못했습니다.');
    } finally {
      setBusy(false);
    }
  };

  const applyImport = async (mode: 'merge' | 'replace') => {
    if (!importPreview) return;
    setBusy(true);
    try {
      const result = await storage.importAll(importPreview.backup, mode);
      setDialog(null);
      setImportPreview(null);
      setNotice(
        `가져오기 완료 — 추가 ${result.added}건, 갱신 ${result.updated}건, 건너뜀 ${result.skipped}건`,
      );
      setRetroToken((token) => token + 1);
      setReloadToken((token) => token + 1);
    } catch (error) {
      console.error('3년 다이어리: 백업 가져오기에 실패했습니다.', error);
      setNotice('백업을 가져오지 못했습니다.');
    } finally {
      setBusy(false);
    }
  };

  const statusText = useMemo(() => {
    if (loadingEntry) return '불러오는 중';
    switch (status) {
      case 'dirty':
        return '변경됨';
      case 'saving':
        return '저장 중';
      case 'error':
        return '저장 실패 · 다시 시도';
      case 'saved':
        return savedAt ? `저장됨 ${savedAt}` : '저장됨';
      default:
        return savedAt ? `저장됨 ${savedAt}` : '새 기록';
    }
  }, [loadingEntry, status, savedAt]);

  const bulletCount = countFilledBullets(bullets);
  const topSlot = import.meta.env.VITE_AD_SLOT_TOP;
  const bottomSlot = import.meta.env.VITE_AD_SLOT_BOTTOM;

  return (
    <div className="min-h-screen bg-paper text-ink">
      <header className="sticky top-0 z-30 border-b border-line bg-paper/95 backdrop-blur supports-[backdrop-filter]:bg-paper/85">
        <div className="mx-auto flex max-w-shell flex-col gap-2.5 px-4 py-3 md:flex-row md:items-center md:justify-between md:gap-4">
          <div className="flex items-center justify-between gap-3">
            <a href="./" className="flex items-center gap-2.5 rounded-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-pine">
              <span className="h-[9px] w-[9px] shrink-0 rounded-[2px] bg-pine" aria-hidden="true" />
              <span className="text-[17px] font-semibold tracking-tight text-ink">3년 다이어리</span>
              <span className="hidden text-[12px] text-muted sm:inline">오늘과 3년 전 오늘</span>
            </a>
            <div className="hidden md:block" />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 md:justify-center">
            <div className="flex flex-wrap items-center gap-1">
              <button
                type="button"
                onClick={() => shiftDay(-1)}
                aria-label="이전 날짜"
                className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-line bg-card text-ink transition hover:border-pine hover:text-pine focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pine"
              >
                ◀
              </button>
              <input
                type="date"
                value={dateKey}
                onChange={(event) => {
                  const value = event.target.value;
                  if (value) goToDate(value);
                }}
                aria-label="날짜 선택"
                className="h-11 max-w-[168px] rounded-xl border border-line bg-card px-2 text-[16px] tabular-nums text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pine"
              />
              <button
                type="button"
                onClick={() => shiftDay(1)}
                aria-label="다음 날짜"
                className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-line bg-card text-ink transition hover:border-pine hover:text-pine focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pine"
              >
                ▶
              </button>
              <button
                type="button"
                onClick={() => goToDate(todayKey())}
                className="inline-flex h-11 items-center rounded-xl border border-line bg-card px-3 text-[13px] font-medium text-ink transition hover:border-pine hover:text-pine focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pine"
              >
                오늘
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between gap-2 md:justify-end">
            <div
              role="status"
              aria-live="polite"
              className="inline-flex items-center gap-1.5 rounded-full border border-line bg-card px-2.5 py-1 text-[12px] text-muted"
            >
              <span
                aria-hidden="true"
                className={`h-1.5 w-1.5 rounded-full ${
                  status === 'error'
                    ? 'bg-red-500'
                    : status === 'saving'
                      ? 'bg-amber-500'
                      : status === 'dirty'
                        ? 'bg-amber-400'
                        : 'bg-pine'
                }`}
              />
              {status === 'error' ? (
                <button type="button" onClick={() => void saveCurrent()} className="underline underline-offset-2">
                  {statusText}
                </button>
              ) : (
                <span className="tabular-nums">{statusText}</span>
              )}
            </div>

            <div className="relative" ref={menuRef}>
              <button
                type="button"
                onClick={() => setMenuOpen((open) => !open)}
                aria-haspopup="menu"
                aria-expanded={menuOpen}
                className="inline-flex h-11 items-center gap-1.5 rounded-xl border border-line bg-card px-3 text-[13px] font-medium text-ink transition hover:border-pine hover:text-pine focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pine"
              >
                도구
                <span aria-hidden="true" className="text-[10px] text-muted">
                  ▾
                </span>
              </button>
              {menuOpen ? (
                <div
                  role="menu"
                  aria-label="도구 메뉴"
                  className="absolute right-0 top-12 z-40 w-56 overflow-hidden rounded-2xl border border-line bg-card p-1 shadow-lg"
                >
                  {[
                    { label: 'JSON 백업 내보내기', run: () => void exportJson() },
                    { label: '백업 가져오기', run: () => { setMenuOpen(false); setImportPreview(null); setDialog({ kind: 'import' }); } },
                    { label: '마크다운으로 내보내기', run: () => void openMarkdownDialog() },
                    { label: 'CSV로 내보내기', run: () => void exportCsv() },
                  ].map((entry) => (
                    <button
                      key={entry.label}
                      type="button"
                      role="menuitem"
                      onClick={entry.run}
                      className="flex min-h-[44px] w-full items-center rounded-xl px-3 text-left text-[13px] text-ink transition hover:bg-pine-soft hover:text-pine focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-pine"
                    >
                      {entry.label}
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-shell px-4 pb-16 pt-5">
        <h2 className="sr-only">오늘의 기록과 과거의 오늘</h2>

        <AdSlot slot={topSlot} format="horizontal" className="mb-5" label />

        <div className="grid gap-5 lg:grid-cols-2 lg:items-start">
          <section aria-labelledby="editor-heading" className="rounded-2xl border border-line bg-card p-4 sm:p-5">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 id="editor-heading" className="text-[17px] font-semibold tracking-tight text-ink">
                {formatKoreanDate(dateKey)}
              </h2>
              <span className="text-[13px] text-muted">블렛 {bulletCount}개</span>
            </div>

            <div className="mt-4 border-t border-line pt-4">
              {loadingEntry ? (
                <div className="space-y-3" aria-hidden="true">
                  {[0, 1, 2].map((row) => (
                    <div key={row} className="flex items-start gap-2">
                      <span className="mt-2 h-3 w-3 rounded-full bg-line" />
                      <div className="h-7 flex-1 animate-pulse rounded bg-line/50" />
                    </div>
                  ))}
                </div>
              ) : (
                <BulletEditor
                  key={editorKey}
                  initialBullets={initialBullets}
                  onChange={setBullets}
                  onSaveShortcut={() => void handleSaveClick()}
                />
              )}
            </div>

            <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-line pt-4">
              <button
                type="button"
                onClick={() => void handleSaveClick()}
                className="inline-flex min-h-[44px] items-center rounded-xl bg-pine px-5 text-[14px] font-semibold text-white transition hover:bg-[#2c5543] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pine"
              >
                저장
              </button>
              <button
                type="button"
                onClick={() => setDialog({ kind: 'delete' })}
                className="inline-flex min-h-[44px] items-center rounded-xl border border-line bg-card px-4 text-[13px] font-medium text-muted transition hover:border-red-300 hover:text-red-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pine"
              >
                이 날짜 기록 지우기
              </button>
              <span className="ml-auto hidden text-[12px] text-muted sm:inline">
                Ctrl·⌘ + Enter 저장 · Enter 다음 블렛
              </span>
            </div>
          </section>

          <Timeline
            items={retroItems}
            loading={retroLoading}
            error={retroError}
            hideEmpty={hideEmpty}
            onToggleHideEmpty={(next) => {
              setHideEmpty(next);
              try {
                window.localStorage.setItem(HIDE_EMPTY_KEY, String(next));
              } catch {
                // 저장이 막힌 브라우저에서는 이번 방문에만 적용한다.
              }
            }}
            onOpenDate={goToDate}
            onRetry={() => setRetroToken((token) => token + 1)}
          />
        </div>

        <AdSlot slot={bottomSlot} format="horizontal" className="mt-6" label />

        <p className="mt-6 text-center text-[13px] leading-6 text-muted">
          기록은 이 브라우저에만 저장됩니다. 주 1회 JSON으로 백업하세요.
        </p>

        <nav aria-label="서비스 안내" className="mt-3 flex flex-wrap justify-center gap-x-4 gap-y-1 text-[13px] text-muted">
          <a className="rounded hover:text-pine hover:underline" href="./guide/">
            활용 가이드
          </a>
          <a className="rounded hover:text-pine hover:underline" href="./faq/">
            자주 묻는 질문
          </a>
          <a className="rounded hover:text-pine hover:underline" href="./about/">
            소개
          </a>
          <a className="rounded hover:text-pine hover:underline" href="./privacy/">
            개인정보처리방침
          </a>
          <a className="rounded hover:text-pine hover:underline" href="./terms/">
            이용약관
          </a>
          <a className="rounded hover:text-pine hover:underline" href="./contact/">
            문의
          </a>
        </nav>

        <p className="mt-4 text-center text-[12px] leading-6 text-muted">
          이 사이트는 개인 기록 도구이며 광고로 운영됩니다.
        </p>
      </main>

      {dialog?.kind === 'delete' ? (
        <Modal
          title="이 날짜의 기록을 지울까요?"
          onClose={() => setDialog(null)}
          footer={
            <>
              <button
                type="button"
                onClick={() => setDialog(null)}
                className="inline-flex min-h-[44px] items-center rounded-xl border border-line px-4 text-[13px] text-ink"
              >
                취소
              </button>
              <button
                type="button"
                onClick={() => void handleDeleteDate()}
                disabled={busy}
                className="inline-flex min-h-[44px] items-center rounded-xl bg-red-700 px-4 text-[13px] font-semibold text-white disabled:opacity-60"
              >
                지우기
              </button>
            </>
          }
        >
          <p>
            {formatKoreanDate(dateKey)}에 저장된 블렛을 모두 지웁니다. 되돌릴 수 없으므로 필요한 내용은 먼저
            JSON으로 백업해 두세요.
          </p>
        </Modal>
      ) : null}

      {dialog?.kind === 'markdown' ? (
        <Modal
          title="마크다운으로 내보내기"
          onClose={() => setDialog(null)}
          footer={
            <>
              <button
                type="button"
                onClick={() => setDialog(null)}
                className="inline-flex min-h-[44px] items-center rounded-xl border border-line px-4 text-[13px] text-ink"
              >
                취소
              </button>
              <button
                type="button"
                onClick={() => void exportMarkdown()}
                disabled={busy}
                className="inline-flex min-h-[44px] items-center rounded-xl bg-pine px-4 text-[13px] font-semibold text-white disabled:opacity-60"
              >
                내려받기
              </button>
            </>
          }
        >
          <p className="text-muted">기간을 비우면 전체 기간을 내보냅니다. 날짜 오름차순으로 정리됩니다.</p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <label className="flex items-center gap-2 text-[13px]">
              시작
              <input
                type="date"
                value={markdownRange.start}
                onChange={(event) => setMarkdownRange((range) => ({ ...range, start: event.target.value }))}
                className="h-10 rounded-xl border border-line bg-paper px-2 text-[14px] tabular-nums"
              />
            </label>
            <label className="flex items-center gap-2 text-[13px]">
              끝
              <input
                type="date"
                value={markdownRange.end}
                onChange={(event) => setMarkdownRange((range) => ({ ...range, end: event.target.value }))}
                className="h-10 rounded-xl border border-line bg-paper px-2 text-[14px] tabular-nums"
              />
            </label>
          </div>
        </Modal>
      ) : null}

      {dialog?.kind === 'import' ? (
        <Modal
          title="백업 가져오기"
          onClose={() => {
            setDialog(null);
            setImportPreview(null);
          }}
          footer={
            <>
              <button
                type="button"
                onClick={() => {
                  setDialog(null);
                  setImportPreview(null);
                }}
                className="inline-flex min-h-[44px] items-center rounded-xl border border-line px-4 text-[13px] text-ink"
              >
                취소
              </button>
              <button
                type="button"
                disabled={!importPreview || importPreview.total === 0 || busy}
                onClick={() => void applyImport('merge')}
                className="inline-flex min-h-[44px] items-center rounded-xl bg-pine px-4 text-[13px] font-semibold text-white disabled:opacity-50"
              >
                병합해서 가져오기
              </button>
              <button
                type="button"
                disabled={!importPreview || importPreview.total === 0 || !confirmReplace || busy}
                onClick={() => void applyImport('replace')}
                className="inline-flex min-h-[44px] items-center rounded-xl border border-red-300 px-4 text-[13px] font-semibold text-red-700 disabled:opacity-50"
              >
                전체 교체
              </button>
            </>
          }
        >
          <p className="text-muted">
            내보낸 JSON 파일을 고르면 날짜 수와 겹치는 기록을 먼저 보여 드립니다. 병합은 백업의 수정 시각이 더
            최신인 기록만 덮어씁니다.
          </p>
          <input
            type="file"
            accept="application/json,.json"
            aria-label="백업 JSON 파일 선택"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) void handleBackupFile(file);
            }}
            className="mt-3 block w-full rounded-xl border border-line bg-paper p-3 text-[13px] file:mr-3 file:rounded-lg file:border-0 file:bg-pine file:px-3 file:py-2 file:text-[13px] file:font-medium file:text-white"
          />
          {importPreview ? (
            <div className="mt-3 rounded-xl border border-line bg-paper/60 p-3 text-[13px]">
              <p className="font-medium text-ink">{importPreview.fileName}</p>
              <p className="mt-1">
                총 {importPreview.total}건 · 겹치는 기록 {importPreview.overlap}건
                {importPreview.invalid > 0 ? ` · 읽을 수 없는 날짜 ${importPreview.invalid}건` : ''}
              </p>
              <label className="mt-3 flex items-start gap-2 text-[13px] text-muted">
                <input
                  type="checkbox"
                  checked={confirmReplace}
                  onChange={(event) => setConfirmReplace(event.target.checked)}
                  className="mt-1 h-4 w-4 accent-[#36654f]"
                />
                <span>전체 교체를 선택하면 지금 브라우저의 기록을 모두 지우고 이 파일로 바꿉니다.</span>
              </label>
            </div>
          ) : null}
        </Modal>
      ) : null}

      {notice ? (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-4 left-1/2 z-50 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 rounded-2xl border border-line bg-card px-4 py-3 text-center text-[13px] text-ink shadow-lg"
        >
          {notice}
        </div>
      ) : null}
    </div>
  );
}
