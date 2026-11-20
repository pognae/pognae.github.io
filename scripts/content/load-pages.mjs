import { readdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));

/** `scripts/content/pages/*.mjs`를 순서대로 불러와 페이지 정의 배열을 만든다. */
export async function loadPages() {
  const directory = join(here, 'pages');
  const files = (await readdir(directory)).filter((file) => file.endsWith('.mjs')).sort();
  const pages = [];
  for (const file of files) {
    const module = await import(pathToFileURL(join(directory, file)).href);
    const exported = module.default;
    if (Array.isArray(exported)) pages.push(...exported);
    else if (exported) pages.push(exported);
    else throw new Error(`[load-pages] ${file}에 default export가 없습니다.`);
  }
  return pages.sort((left, right) => (left.order ?? 100) - (right.order ?? 100));
}
