// @vitest-environment jsdom
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import App from './App';

declare global {
  // eslint-disable-next-line no-var
  var IS_REACT_ACT_ENVIRONMENT: boolean | undefined;
}

let container: HTMLDivElement;
let root: Root;

async function mount() {
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
  await act(async () => {
    root.render(<App />);
  });
  // 회고 타임라인의 비동기 조회를 기다린다.
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 30));
  });
}

beforeEach(() => {
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
  window.localStorage.clear();
  window.history.replaceState(null, '', '/?date=2026-11-18');
});

afterEach(async () => {
  await act(async () => {
    root.unmount();
  });
  container.remove();
});

describe('앱 화면', () => {
  it('선택한 날짜와 12개 시점 영역을 그린다', async () => {
    await mount();
    expect(container.textContent).toContain('3년 다이어리');
    expect(container.textContent).toContain('2026년 11월 18일 (수)');
    expect(container.textContent).toContain('과거의 오늘');
    expect(container.textContent).toContain('12개 시점 중 0개 기록');
    expect(container.querySelectorAll('[contenteditable="true"]').length).toBeGreaterThan(0);
  });

  it('블렛을 쓰고 저장하면 브라우저 저장소에 남는다', async () => {
    await mount();
    const editor = container.querySelector<HTMLDivElement>('[contenteditable="true"]');
    expect(editor).not.toBeNull();

    await act(async () => {
      if (!editor) return;
      editor.textContent = '테스트 블렛 한 줄';
      editor.dispatchEvent(new Event('input', { bubbles: true }));
    });

    const saveButton = Array.from(container.querySelectorAll('button')).find(
      (button) => button.textContent?.trim() === '저장',
    );
    expect(saveButton).toBeDefined();

    await act(async () => {
      saveButton?.click();
      await new Promise((resolve) => setTimeout(resolve, 10));
    });

    const raw = window.localStorage.getItem('3year-diary:v1:entry:2026-11-18');
    expect(raw).toContain('테스트 블렛 한 줄');
    expect(container.textContent).toContain('저장됨');
  });

  it('저장된 기록을 다시 불러오면 블렛으로 보인다', async () => {
    window.localStorage.setItem(
      '3year-diary:v1:entry:2026-11-18',
      JSON.stringify({
        date: '2026-11-18',
        content: '• 첫 줄\n• 둘째 줄',
        updatedAt: '2026-11-18T09:00:00.000Z',
      }),
    );
    await mount();
    const texts = Array.from(container.querySelectorAll<HTMLDivElement>('[contenteditable="true"]')).map(
      (element) => element.textContent,
    );
    expect(texts).toEqual(['첫 줄', '둘째 줄']);
  });
});
