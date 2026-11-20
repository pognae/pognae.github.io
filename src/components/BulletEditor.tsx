import { useCallback, useLayoutEffect, useRef, useState } from 'react';
import { stripBulletMarker } from '../lib/bullets';

type Item = { id: number; text: string };

let nextItemId = 1;

function makeItems(texts: readonly string[]): Item[] {
  const list = texts.length > 0 ? texts : [''];
  return list.map((text) => ({ id: nextItemId++, text }));
}

type Caret = 'start' | 'end';

export type BulletEditorProps = {
  /** 이 값이 바뀌면(부모에서 key로 재마운트) initialBullets로 다시 채운다. */
  initialBullets: string[];
  placeholder?: string;
  onChange: (bullets: string[]) => void;
  onSaveShortcut: () => void;
};

/**
 * contenteditable 기반 블렛 편집기.
 * React가 입력 중인 DOM의 textContent를 다시 쓰지 않도록 비제어로 두고,
 * 마운트·줄 분할·병합처럼 구조가 바뀔 때만 ref로 DOM을 직접 만진다.
 */
export default function BulletEditor({
  initialBullets,
  placeholder = '오늘 있었던 일 한 줄…',
  onChange,
  onSaveShortcut,
}: BulletEditorProps) {
  const [items, setItems] = useState<Item[]>(() => makeItems(initialBullets));
  const itemsRef = useRef<Item[]>(items);
  const elements = useRef(new Map<number, HTMLDivElement>());
  const composing = useRef(false);
  const pendingFocus = useRef<{ index: number; caret: Caret } | null>(null);

  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  const onSaveRef = useRef(onSaveShortcut);
  onSaveRef.current = onSaveShortcut;

  const emit = useCallback(() => {
    onChangeRef.current(itemsRef.current.map((item) => item.text));
  }, []);

  const commit = useCallback((next: Item[]) => {
    itemsRef.current = next;
    setItems(next);
  }, []);

  const register = useCallback((el: HTMLDivElement | null) => {
    if (!el) return;
    const id = Number(el.dataset.itemId);
    if (!Number.isFinite(id)) return;
    elements.current.set(id, el);
    const item = itemsRef.current.find((candidate) => candidate.id === id);
    if (item && el.textContent !== item.text) {
      el.textContent = item.text;
    }
  }, []);

  const applyPendingFocus = useCallback(() => {
    const request = pendingFocus.current;
    if (!request) return;
    const item = itemsRef.current[request.index];
    if (!item) {
      pendingFocus.current = null;
      return;
    }
    const el = elements.current.get(item.id);
    if (!el) return;
    pendingFocus.current = null;
    el.focus({ preventScroll: true });
    const selection = window.getSelection();
    if (!selection) return;
    const range = document.createRange();
    range.selectNodeContents(el);
    range.collapse(request.caret === 'start');
    selection.removeAllRanges();
    selection.addRange(range);
  }, []);

  useLayoutEffect(() => {
    applyPendingFocus();
  });

  const scheduleFocus = useCallback(
    (index: number, caret: Caret) => {
      pendingFocus.current = { index, caret };
      window.requestAnimationFrame(() => applyPendingFocus());
    },
    [applyPendingFocus],
  );

  const indexOf = (el: HTMLElement): number => {
    const id = Number(el.dataset.itemId);
    return itemsRef.current.findIndex((item) => item.id === id);
  };

  const caretOffset = (el: HTMLElement): number => {
    const text = el.textContent ?? '';
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return text.length;
    const range = selection.getRangeAt(0);
    if (!el.contains(range.startContainer)) return text.length;
    const preRange = range.cloneRange();
    preRange.selectNodeContents(el);
    preRange.setEnd(range.startContainer, range.startOffset);
    return preRange.toString().length;
  };

  /** 커서가 첫 줄/마지막 줄에 있는지(줄바꿈으로 접힌 경우 포함) 판단한다. */
  const caretLine = (el: HTMLElement): 'first' | 'middle' | 'last' => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return 'first';
    const range = selection.getRangeAt(0).cloneRange();
    const rect = range.getBoundingClientRect();
    const box = el.getBoundingClientRect();
    if (rect.height === 0 && rect.top === 0) return (el.textContent ?? '') ? 'middle' : 'first';
    const lineHeight = Number.parseFloat(window.getComputedStyle(el).lineHeight) || 28;
    if (rect.top - box.top < lineHeight * 0.6) return 'first';
    if (box.bottom - rect.bottom < lineHeight * 0.6) return 'last';
    return 'middle';
  };

  const splitAtCaret = (index: number, el: HTMLDivElement, offset: number) => {
    const text = el.textContent ?? '';
    const before = text.slice(0, offset);
    const after = text.slice(offset);
    el.textContent = before;
    const next = [...itemsRef.current];
    next[index] = { ...next[index], text: before };
    next.splice(index + 1, 0, { id: nextItemId++, text: after });
    commit(next);
    emit();
    scheduleFocus(index + 1, 'start');
  };

  const insertRow = (index: number, text = '') => {
    const next = [...itemsRef.current];
    next.splice(index, 0, { id: nextItemId++, text });
    commit(next);
    emit();
    scheduleFocus(index, 'end');
  };

  const removeRow = (index: number) => {
    if (itemsRef.current.length <= 1) return;
    const next = [...itemsRef.current];
    next.splice(index, 1);
    commit(next);
    emit();
  };

  const mergeIntoPrevious = (index: number, el: HTMLDivElement) => {
    const previous = itemsRef.current[index - 1];
    if (!previous) return;
    const previousEl = elements.current.get(previous.id);
    const previousText = previousEl?.textContent ?? previous.text;
    const currentText = el.textContent ?? '';
    const merged = previousText + currentText;
    if (previousEl) previousEl.textContent = merged;
    const next = [...itemsRef.current];
    next[index - 1] = { ...previous, text: merged };
    next.splice(index, 1);
    commit(next);
    emit();
    scheduleFocus(index - 1, 'end');
  };

  const mergeNext = (index: number, el: HTMLDivElement) => {
    const nextItem = itemsRef.current[index + 1];
    if (!nextItem) return;
    const nextEl = elements.current.get(nextItem.id);
    const merged = (el.textContent ?? '') + (nextEl?.textContent ?? nextItem.text);
    el.textContent = merged;
    const next = [...itemsRef.current];
    next[index] = { ...next[index], text: merged };
    next.splice(index + 1, 1);
    commit(next);
    emit();
    scheduleFocus(index, 'end');
  };

  const insertTextAtCaret = (el: HTMLDivElement, text: string) => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) {
      el.appendChild(document.createTextNode(text));
      return;
    }
    const range = selection.getRangeAt(0);
    if (!el.contains(range.commonAncestorContainer)) {
      el.appendChild(document.createTextNode(text));
      return;
    }
    range.deleteContents();
    const node = document.createTextNode(text);
    range.insertNode(node);
    range.setStartAfter(node);
    range.collapse(true);
    selection.removeAllRanges();
    selection.addRange(range);
  };

  const syncText = (el: HTMLDivElement, index: number) => {
    const text = el.textContent ?? '';
    itemsRef.current[index] = { ...itemsRef.current[index], text };
    emit();
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    // 한글 IME 조합 중에는 어떤 키도 가로채지 않는다.
    if (composing.current || event.nativeEvent.isComposing || event.keyCode === 229) return;
    const el = event.currentTarget;
    const index = indexOf(el);
    if (index < 0) return;
    const text = el.textContent ?? '';
    const offset = caretOffset(el);

    if (event.key === 'Enter') {
      event.preventDefault();
      if (event.ctrlKey || event.metaKey) {
        onSaveRef.current();
        return;
      }
      if (text.trim() === '') {
        el.blur();
        return;
      }
      splitAtCaret(index, el, offset);
      return;
    }

    if (event.key === 'Escape') {
      event.preventDefault();
      el.blur();
      return;
    }

    if (event.key === 'Tab') {
      event.preventDefault();
      const target = event.shiftKey ? index - 1 : index + 1;
      if (target >= 0 && target < itemsRef.current.length) scheduleFocus(target, event.shiftKey ? 'end' : 'start');
      else if (!event.shiftKey) insertRow(itemsRef.current.length, '');
      return;
    }

    if (event.key === 'ArrowUp' && caretLine(el) === 'first' && index > 0) {
      event.preventDefault();
      scheduleFocus(index - 1, 'end');
      return;
    }

    if (event.key === 'ArrowDown' && caretLine(el) === 'last') {
      event.preventDefault();
      if (index < itemsRef.current.length - 1) scheduleFocus(index + 1, 'start');
      else insertRow(itemsRef.current.length, '');
      return;
    }

    if (event.key === 'Backspace' && offset === 0) {
      if (text === '' && index > 0) {
        event.preventDefault();
        removeRow(index);
        scheduleFocus(index - 1, 'end');
        return;
      }
      if (text !== '' && index > 0) {
        event.preventDefault();
        mergeIntoPrevious(index, el);
      }
      return;
    }

    if (event.key === 'Delete' && offset === text.length && index < itemsRef.current.length - 1) {
      event.preventDefault();
      mergeNext(index, el);
    }
  };

  const handleInput = (event: React.FormEvent<HTMLDivElement>) => {
    const el = event.currentTarget;
    const index = indexOf(el);
    if (index < 0) return;
    if (el.textContent === '' && el.innerHTML !== '') el.innerHTML = '';
    syncText(el, index);
  };

  const handleBeforeInput = (event: React.FormEvent<HTMLDivElement>) => {
    if (composing.current) return;
    const native = event.nativeEvent as InputEvent;
    if (native.inputType === 'insertParagraph' || native.inputType === 'insertLineBreak') {
      event.preventDefault();
      const el = event.currentTarget;
      const index = indexOf(el);
      if (index < 0) return;
      const text = el.textContent ?? '';
      if (text.trim() === '') {
        el.blur();
        return;
      }
      splitAtCaret(index, el, caretOffset(el));
    }
  };

  const handlePaste = (event: React.ClipboardEvent<HTMLDivElement>) => {
    if (composing.current) return;
    const el = event.currentTarget;
    const index = indexOf(el);
    if (index < 0) return;
    event.preventDefault();
    const plain = event.clipboardData.getData('text/plain');
    const lines = plain
      .replace(/\r\n?/g, '\n')
      .split('\n')
      .map((line) => stripBulletMarker(line).replace(/\s+$/, ''))
      .filter((line) => line.trim().length > 0);
    if (lines.length === 0) return;

    if (lines.length === 1) {
      insertTextAtCaret(el, lines[0] ?? '');
      syncText(el, index);
      return;
    }

    const offset = caretOffset(el);
    const text = el.textContent ?? '';
    const before = text.slice(0, offset);
    const after = text.slice(offset);
    const first = `${before}${lines[0] ?? ''}`;
    el.textContent = first;
    const inserted: Item[] = lines.slice(1).map((line) => ({ id: nextItemId++, text: line }));
    const last = inserted[inserted.length - 1];
    if (last) last.text += after;
    const next = [...itemsRef.current];
    next[index] = { ...next[index], text: first };
    next.splice(index + 1, 0, ...inserted);
    commit(next);
    emit();
    scheduleFocus(index + inserted.length, 'end');
  };

  return (
    <div className="space-y-1">
      {items.map((item, index) => (
        <div key={item.id} className="flex items-start gap-2">
          <span className="mt-[3px] w-3 shrink-0 select-none text-base leading-7 text-pine" aria-hidden="true">
            •
          </span>
          <div
            ref={register}
            data-item-id={item.id}
            data-placeholder={index === 0 ? placeholder : '이어서 한 줄…'}
            className="bullet-input min-h-[1.75rem] flex-1 whitespace-pre-wrap break-words bg-transparent py-0 text-[17px] leading-7 text-ink outline-none"
            contentEditable
            role="textbox"
            aria-multiline="true"
            aria-label={`블렛 ${index + 1}`}
            spellCheck={false}
            onKeyDown={handleKeyDown}
            onInput={handleInput}
            onBeforeInput={handleBeforeInput}
            onPaste={handlePaste}
            onCompositionStart={() => {
              composing.current = true;
            }}
            onCompositionEnd={(event) => {
              composing.current = false;
              const el = event.currentTarget;
              const target = indexOf(el);
              if (target >= 0) syncText(el, target);
            }}
          />
        </div>
      ))}
    </div>
  );
}
