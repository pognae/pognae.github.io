import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { loadPages } from './content/load-pages.mjs';
import { COLUMNS, columnNeighbors, pageTextLength, renderPage } from './content/site.mjs';

const root = process.cwd();
const pages = await loadPages();
const written = [];
const failures = [];

// 바닥글 칼럼 목록이 실제 글과 어긋나면 끊어진 링크가 생기므로 먼저 대조한다.
const articles = pages.filter((page) => page.kind === 'article');
for (const article of articles) {
  const column = COLUMNS.find((entry) => entry.path === article.path);
  if (!column) failures.push(`[build-pages] 바닥글 칼럼 목록에 ${article.path}가 없습니다.`);
  else if (column.label !== article.h1)
    failures.push(`[build-pages] 바닥글 칼럼 이름이 글 제목과 다릅니다: ${article.path}`);
}
for (const column of COLUMNS) {
  if (!articles.some((article) => article.path === column.path))
    failures.push(`[build-pages] 바닥글 칼럼 ${column.path}에 해당하는 글이 없습니다.`);
}

// 칼럼은 COLUMNS 순서를 읽는 순서로 삼는다. 바닥글 목록과 본문의 이전/다음 글이 같은 순서를 따르게 한다.
const byPath = new Map(articles.map((article) => [article.path, article]));
const ordered = COLUMNS.map((column) => byPath.get(column.path)).filter(Boolean);
const columnOrder = COLUMNS.map((column) => column.path).join('|');
const articleOrder = articles.map((article) => article.path).join('|');
if (columnOrder !== articleOrder)
  failures.push('[build-pages] 글 순서가 COLUMNS 순서와 다릅니다. order 값과 COLUMNS를 맞춰 주세요.');

/** 이전·다음 글은 COLUMNS 순서로 붙이고, 관련 글은 가까운 칼럼부터 3편까지 채운다. */
let linked = 0;
ordered.forEach((article, index) => {
  const { prev, next } = columnNeighbors(article.path);
  const neighbors = new Set([prev?.path, next?.path].filter(Boolean));
  const related = (article.related ?? []).filter(
    (item) => item.path !== article.path && !neighbors.has(item.path),
  );
  const candidates = ordered
    .map((other, otherIndex) => ({ other, distance: Math.abs(otherIndex - index) }))
    .filter(
      ({ other }) =>
        other !== article &&
        !neighbors.has(other.path) &&
        !related.some((item) => item.path === other.path),
    )
    .sort((left, right) => left.distance - right.distance)
    .map(({ other }) => other);
  for (const candidate of candidates) {
    if (related.length >= 3) break;
    related.push({ path: candidate.path, label: candidate.h1 });
  }
  article.related = related;
  if (prev || next) linked += 1;
});

/** 기계적인 AI 상투어·번역투가 본문에 다시 들어오지 않게 막는다. 문장을 다듬을 때는 이 목록을 피해서 쓴다. */
const CLICHES = [
  '알아보겠습니다',
  '알아보도록 하겠습니다',
  '결론부터 말씀드리면',
  '살펴보겠습니다',
  '살펴보도록 하겠습니다',
  '지금부터 알아보',
  '이처럼',
];
const plainText = (html) =>
  String(html)
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ');

for (const page of pages) {
  // 목차 링크가 같은 자리로 모이지 않도록 섹션 id가 겹치지 않는지 확인한다.
  const seen = new Set();
  for (const section of page.sections) {
    if (!section.id || seen.has(section.id))
      failures.push(`[build-pages] ${page.path}의 섹션 id가 비었거나 겹칩니다: ${section.id}`);
    seen.add(section.id);
  }

  const text = plainText([page.lead ?? '', page.description ?? '', ...page.sections.map((section) => section.html)].join(' '));
  const found = CLICHES.filter((phrase) => text.includes(phrase));
  if (found.length > 0)
    failures.push(`[build-pages] ${page.path}에 기계적 표현이 남아 있습니다: ${found.join(', ')}`);
}

for (const page of pages) {
  const length = pageTextLength(page);
  try {
    const html = renderPage(page);
    const target = join(root, page.path.slice(1), 'index.html');
    await mkdir(dirname(target), { recursive: true });
    await writeFile(target, html, 'utf8');
    written.push(`${page.path} (${length}자)`);
  } catch (error) {
    failures.push(error instanceof Error ? error.message : String(error));
  }
}

console.log(`[build-pages] 정적 HTML ${written.length}개를 생성했습니다.`);
for (const entry of written) console.log(`  · ${entry}`);
console.log(`[build-pages] 칼럼 ${linked}편에 이전 글·다음 글 링크를 연결했습니다.`);

if (failures.length > 0) {
  console.error(`\n[build-pages] 검증 실패 ${failures.length}건:`);
  for (const failure of failures) console.error(`  - ${failure}`);
  process.exitCode = 1;
}
