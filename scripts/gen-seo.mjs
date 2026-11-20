import { access, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { loadPages } from './content/load-pages.mjs';
import { SITE } from './content/site.mjs';

const dist = join(process.cwd(), 'dist');

try {
  await access(join(dist, 'index.html'));
} catch {
  throw new Error('[gen-seo] dist/index.html이 없습니다. vite build를 먼저 실행하세요.');
}

const pages = await loadPages();
// 사이트 기준 시간대(Asia/Seoul)로 날짜를 찍는다. (UTC로 하면 밤 빌드에서 하루 전 날짜가 된다)
const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Seoul' }).format(new Date());

const entries = [
  { path: '/', changefreq: 'weekly', priority: '1.0' },
  ...pages.map((page) => ({
    path: page.path,
    changefreq: page.kind === 'article' ? 'monthly' : 'monthly',
    priority: page.path === '/guide/' ? '0.9' : page.kind === 'article' ? '0.7' : '0.5',
  })),
];

const urls = entries
  .map(
    (entry) => `  <url>
    <loc>${SITE.url}${entry.path}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${entry.changefreq}</changefreq>
    <priority>${entry.priority}</priority>
  </url>`,
  )
  .join('\n');

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`;

const robots = `User-agent: *
Allow: /

# 이미지·검색 결과 미리보기와 애드센스 크롤러는 막지 않습니다.
User-agent: Mediapartners-Google
Allow: /

Sitemap: ${SITE.url}/sitemap.xml
`;

await writeFile(join(dist, 'sitemap.xml'), sitemap, 'utf8');
await writeFile(join(dist, 'robots.txt'), robots, 'utf8');
// GitHub Pages(브랜치 서빙)에서 Jekyll 처리를 건너뛰게 하는 빈 파일
await writeFile(join(dist, '.nojekyll'), '', 'utf8');

console.log(`[gen-seo] sitemap.xml ${entries.length}개 주소, robots.txt를 생성했습니다.`);
