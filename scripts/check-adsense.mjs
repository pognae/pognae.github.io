import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { loadPages } from './content/load-pages.mjs';
import { COLUMNS, SITE } from './content/site.mjs';

/**
 * 애드센스 승인 심사에서 문제가 되는 지점을 빌드 결과물에서 직접 확인한다.
 * build 마지막 단계에서 실행되며, 하나라도 어긋나면 exit 1로 배포를 막는다.
 */

const dist = resolve(process.cwd(), 'dist');
const problems = [];
const notes = [];

const TRUST = [
  { path: 'guide/index.html', label: '활용 가이드' },
  { path: 'faq/index.html', label: '자주 묻는 질문' },
  { path: 'about/index.html', label: '서비스 소개' },
  { path: 'privacy/index.html', label: '개인정보처리방침' },
  { path: 'terms/index.html', label: '이용약관' },
  { path: 'contact/index.html', label: '문의' },
];

/** 사이트 소유 확인 파일처럼 내용이 없는 페이지는 검사에서 뺀다. */
const SKIP = [/^404\.html$/, /^google[0-9a-f]+\.html$/, /^naver[0-9a-f]+\.html$/];

function htmlFiles(directory, found = []) {
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const full = join(directory, entry.name);
    if (entry.isDirectory()) htmlFiles(full, found);
    else if (entry.name.endsWith('.html')) found.push(relative(dist, full));
  }
  return found;
}

function textOf(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/g, ' ')
    .replace(/<style[\s\S]*?<\/style>/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function linkTargets(html, file) {
  const targets = new Set();
  const base = dirname(join(dist, file));
  for (const match of html.matchAll(/href="([^"]+)"/g)) {
    const raw = match[1].split('#')[0].split('?')[0];
    if (!raw || /^(https?:|mailto:|tel:|data:)/.test(raw)) continue;
    let target = raw.startsWith('/') ? join(dist, raw) : resolve(base, raw);
    if (raw.endsWith('/') || (existsSync(target) && statSync(target).isDirectory())) {
      target = join(target, 'index.html');
    }
    targets.add(relative(dist, target).split('\\').join('/'));
  }
  return targets;
}

function pngSize(file) {
  const buffer = readFileSync(file);
  if (buffer.length < 24 || buffer.toString('ascii', 1, 4) !== 'PNG') return null;
  return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) };
}

// 1) 루트 페이지: 크롤러가 자바스크립트 없이도 읽는 내용과 내부 링크
const rootHtml = existsSync(join(dist, 'index.html')) ? readFileSync(join(dist, 'index.html'), 'utf8') : '';
if (!rootHtml) {
  problems.push('dist/index.html이 없습니다.');
} else {
  const rootText = textOf(rootHtml);
  if (rootText.length < 800) {
    problems.push(`루트 HTML 정적 텍스트가 ${rootText.length}자입니다(800자 이상 필요).`);
  } else {
    notes.push(`루트 HTML 정적 텍스트 ${rootText.length}자`);
  }
  if (!/<h1[\s>]/.test(rootHtml)) problems.push('루트 HTML에 h1이 없습니다.');
  const rootLinks = linkTargets(rootHtml, 'index.html');
  for (const trust of TRUST) {
    if (!rootLinks.has(trust.path)) problems.push(`루트 HTML에 ${trust.label} 링크가 없습니다.`);
  }
  for (const column of COLUMNS) {
    const target = `${column.path.replace(/^\//, '')}index.html`;
    if (!rootLinks.has(target)) problems.push(`루트 HTML에 칼럼 링크가 없습니다: ${column.path}`);
  }
  notes.push(`루트 HTML 내부 링크 ${rootLinks.size}개`);
}

// 2) 모든 콘텐츠 페이지: 신뢰 페이지 링크, canonical, OG 이미지, 애드센스 코드
const pages = await loadPages();
const expected = new Set(['index.html', ...pages.map((page) => `${page.path.replace(/^\//, '')}index.html`)]);
for (const file of htmlFiles(dist)) {
  if (SKIP.some((pattern) => pattern.test(file))) continue;
  if (!expected.has(file)) {
    problems.push(`예상하지 못한 HTML이 배포물에 있습니다: ${file}`);
    continue;
  }
  const html = readFileSync(join(dist, file), 'utf8');
  const links = linkTargets(html, file);
  for (const trust of TRUST) {
    if (!links.has(trust.path)) problems.push(`${file}에 ${trust.label} 링크가 없습니다.`);
  }
  if (!/<link rel="canonical" href="https:\/\/[^"]+"/.test(html)) {
    problems.push(`${file}에 canonical이 없습니다.`);
  }
  if (!html.includes('og-image.png')) problems.push(`${file}에 og:image(png)가 없습니다.`);
  if (SITE.adsenseClient && !html.includes('google-adsense-account')) {
    problems.push(`${file}에 애드센스 계정 메타 태그가 없습니다.`);
  }
  if (SITE.adsenseClient && !html.includes('pagead2.googlesyndication.com')) {
    problems.push(`${file}에 애드센스 스크립트가 없습니다.`);
  }
  if (html.includes('광고 영역 · 애드센스 승인 후 표시')) {
    problems.push(`${file}에 승인 전 광고 자리 표시 문구가 남아 있습니다.`);
  }
}

// 3) 개인정보처리방침: 광고 쿠키·로컬 저장·문의처
if (existsSync(join(dist, 'privacy/index.html'))) {
  const privacy = readFileSync(join(dist, 'privacy/index.html'), 'utf8');
  const required = [
    ['DoubleClick', 'DoubleClick(DART) 쿠키'],
    ['adssettings.google.com', 'Google 광고 설정 링크'],
    ['localStorage', 'localStorage 고지'],
    ['3year-diary:v1:', '로컬 저장 키 설명'],
    [SITE.email, '문의 메일'],
  ];
  for (const [needle, label] of required) {
    if (!privacy.includes(needle)) problems.push(`개인정보처리방침에 ${label}가 없습니다.`);
  }
}

// 4) 공유 이미지
const ogPng = join(dist, 'og-image.png');
if (!existsSync(ogPng)) {
  problems.push('dist/og-image.png가 없습니다.');
} else {
  const size = pngSize(ogPng);
  if (!size || size.width !== 1200 || size.height !== 630) {
    problems.push(`og-image.png 크기가 1200x630이 아닙니다(${size ? `${size.width}x${size.height}` : 'PNG 아님'}).`);
  } else {
    notes.push('og-image.png 1200x630 확인');
  }
}

// 5) sitemap·robots·ads.txt·애드센스 ID 일치
const sitemap = existsSync(join(dist, 'sitemap.xml')) ? readFileSync(join(dist, 'sitemap.xml'), 'utf8') : '';
const sitemapUrls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);
if (sitemapUrls.length !== expected.size) {
  problems.push(`sitemap URL이 ${sitemapUrls.length}개입니다(예상 ${expected.size}개).`);
} else {
  notes.push(`sitemap.xml ${sitemapUrls.length}개 주소`);
}
for (const url of sitemapUrls) {
  if (!url.startsWith(`${SITE.url}/`)) problems.push(`sitemap에 다른 도메인 주소가 있습니다: ${url}`);
  const path = url.slice(SITE.url.length);
  const target = resolve(dist, `.${path}`, path.endsWith('/') ? 'index.html' : '');
  if (!existsSync(target)) problems.push(`sitemap 주소의 파일이 없습니다: ${url}`);
}

const robots = existsSync(join(dist, 'robots.txt')) ? readFileSync(join(dist, 'robots.txt'), 'utf8') : '';
if (!robots.includes(`Sitemap: ${SITE.url}/sitemap.xml`)) problems.push('robots.txt에 sitemap 안내가 없습니다.');
if (!/User-agent: Mediapartners-Google\s+Allow: \//.test(robots)) {
  problems.push('robots.txt가 Mediapartners-Google을 허용하지 않습니다.');
}

const pubId = SITE.adsenseClient.replace(/^ca-/, '');
const adsTxt = existsSync(join(dist, 'ads.txt')) ? readFileSync(join(dist, 'ads.txt'), 'utf8') : '';
if (!SITE.adsenseClient) {
  notes.push('애드센스 클라이언트 ID가 비어 있어 광고 코드·ads.txt 점검은 건너뜁니다.');
} else if (!adsTxt.includes(`google.com, ${pubId}, DIRECT`)) {
  problems.push(`ads.txt에 게시자 ID(${pubId})가 없습니다.`);
} else {
  notes.push('ads.txt 게시자 ID 일치');
}

// 6) 내부 링크
let broken = 0;
for (const file of htmlFiles(dist)) {
  if (SKIP.some((pattern) => pattern.test(file))) continue;
  const html = readFileSync(join(dist, file), 'utf8');
  const base = dirname(join(dist, file));
  for (const match of html.matchAll(/(?:href|src)="([^"]+)"/g)) {
    const raw = match[1].split('#')[0].split('?')[0];
    if (!raw || /^(https?:|mailto:|tel:|data:)/.test(raw)) continue;
    let target = raw.startsWith('/') ? join(dist, raw) : resolve(base, raw);
    if (raw.endsWith('/') || (existsSync(target) && statSync(target).isDirectory())) {
      target = join(target, 'index.html');
    }
    if (!existsSync(target)) {
      problems.push(`${file}의 링크가 깨졌습니다: ${raw}`);
      broken += 1;
      if (broken > 10) break;
    }
  }
}

// 7) 칼럼의 이전 글·다음 글 연결과 관련 글 링크
const columnPaths = COLUMNS.map((column) => column.path);
for (const [index, path] of columnPaths.entries()) {
  const file = `${path.replace(/^\//, '')}index.html`;
  if (!existsSync(join(dist, file))) continue;
  const html = readFileSync(join(dist, file), 'utf8');
  const rel = '../'.repeat(path.split('/').filter(Boolean).length);
  const nav = html.match(/<nav class="post-nav"[\s\S]*?<\/nav>/);
  if (!nav) {
    problems.push(`${file}에 이전 글·다음 글 막대(post-nav)가 없습니다.`);
    continue;
  }
  const sides = [
    { key: 'prev', neighbor: columnPaths[index - 1] },
    { key: 'next', neighbor: columnPaths[index + 1] },
  ];
  for (const side of sides) {
    const hasLink = nav[0].includes(`rel="${side.key}"`);
    if (side.neighbor && !hasLink) problems.push(`${file}에 ${side.key === 'prev' ? '이전' : '다음'} 글 링크가 없습니다.`);
    if (!side.neighbor && hasLink) problems.push(`${file}에 ${side.key} 글이 없는데 ${side.key} 링크가 있습니다.`);
    if (side.neighbor) {
      const href = `${rel}${side.neighbor.replace(/^\//, '')}`;
      if (!nav[0].includes(`href="${href}"`)) problems.push(`${file}의 ${side.key} 글 링크 주소가 어긋났습니다: ${href}`);
    }
  }
  const relatedBlock = html.match(/<nav class="related"[\s\S]*?<\/nav>/);
  const relatedCount = relatedBlock ? (relatedBlock[0].match(/<a href=/g) ?? []).length : 0;
  if (relatedCount < 2) problems.push(`${file}의 관련 글이 ${relatedCount}편입니다(2편 이상 필요).`);
}
if (columnPaths.length > 0) notes.push(`칼럼 ${columnPaths.length}편 이전·다음 글 연결 확인`);

if (problems.length > 0) {
  console.error(`\n[check-adsense] 점검 실패 ${problems.length}건:`);
  for (const problem of problems) console.error(`  - ${problem}`);
  process.exit(1);
}

for (const note of notes) console.log(`  · ${note}`);
console.log('[check-adsense] 애드센스 승인 점검 통과: HTML 정적 내용·링크·메타·sitemap·robots·ads.txt·OG 이미지');
