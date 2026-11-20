/**
 * GitHub Pages(기존 "Build and deploy site" 워크플로)용 준비 단계.
 *
 * 이 저장소의 배포 워크플로는 파일을 새로 추가할 권한이 없어, 이미 존재하던
 * 워크플로의 `node scripts/generate-sitemap.mjs` 단계에서 앱을 빌드하고
 * 결과물을 저장소 루트로 펼친 뒤 Jekyll이 그대로 `_site`로 복사하게 한다.
 * (Jekyll은 front matter가 없는 HTML을 손대지 않고 그대로 복사한다.)
 */
import { execSync } from 'node:child_process';
import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

const root = resolve(process.cwd());
const dist = join(root, 'dist');

// 로컬에서 실수로 실행하면 Vite 진입점(index.html)을 덮어쓰므로 CI에서만 동작한다.
if (!process.env.CI) {
  console.log('[deploy] CI가 아니므로 배포 준비 단계를 건너뜁니다. (로컬에서는 npm run build를 쓰세요)');
  process.exit(0);
}

function run(command) {
  console.log(`[deploy] $ ${command}`);
  execSync(command, { stdio: 'inherit', cwd: root });
}

if (!existsSync(join(root, 'node_modules'))) {
  run('npm ci --no-audit --no-fund');
}

run('npm run build');

if (!existsSync(join(dist, 'index.html'))) {
  throw new Error('dist/index.html이 없습니다. 빌드가 실패했습니다.');
}

// 배포 워크플로가 _site/blog/index.html 존재를 확인하므로, 칼럼 허브 페이지를 만든다.
const columns = readdirSync(join(dist, 'articles'), { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name)
  .sort();

const titles = {
  '01-why-three-year-diary': '3년 다이어리를 쓰는 이유',
  '02-three-line-bullet-diary': '세 줄 블렛 일기 쓰는 법',
  '03-bad-vs-good-diary': '기록이 남는 일기와 흘려보내는 일기',
  '04-review-cycles': '1개월·3개월·6개월 회고 주기 설계',
  '05-five-minute-recording': '하루 5분 기록 루틴',
  '06-emotion-vs-fact': '감정과 사실을 나눠 적는 방법',
  '07-career-reflection-4050': '4050 이직 준비와 기록',
  '08-spending-health-sleep-tracking': '지출·건강·수면을 함께 보는 법',
  '09-year-end-settlement': '연말정산을 기록으로 준비하기',
  '10-local-backup-security': '브라우저 저장 기록의 백업과 보안',
  '11-paper-to-web': '종이 다이어리에서 웹으로 옮기기',
  '12-100-days-365-days': '100일·365일 기록의 힘',
};

const cards = columns
  .map((slug) => {
    const title = titles[slug] ?? slug.replace(/^\d+-/, '').replace(/-/g, ' ');
    return `      <li><a href="/articles/${slug}/">${title}</a></li>`;
  })
  .join('\n');

const blog = `<!doctype html>
<html lang="ko-KR">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>칼럼 모음 · 3년 다이어리</title>
    <meta name="description" content="3년 다이어리 운영진이 기록 습관, 회고 주기, 이직 준비, 연말정산, 백업과 보안까지 12편의 칼럼으로 정리했습니다." />
    <link rel="canonical" href="https://monopoint.app/blog/" />
    <meta property="og:type" content="website" />
    <meta property="og:title" content="칼럼 모음 · 3년 다이어리" />
    <meta property="og:description" content="기록 습관부터 회고 주기, 백업과 보안까지 12편의 칼럼을 한곳에 모았습니다." />
    <meta property="og:image" content="https://monopoint.app/og-image.png" />
    <meta name="google-adsense-account" content="ca-pub-5461344534519122" />
    <style>
      :root { color-scheme: light; }
      body { margin: 0; padding: 2.5rem 1.25rem 4rem; background: #f2efe7; color: #23241f;
        font-family: -apple-system, BlinkMacSystemFont, "Apple SD Gothic Neo", "Malgun Gothic", sans-serif; line-height: 1.7; }
      main { max-width: 46rem; margin: 0 auto; }
      h1 { font-size: 1.6rem; line-height: 1.4; margin: 0 0 .5rem; color: #2b3a30; }
      p.lead { margin: 0 0 2rem; color: #4a4f45; }
      ul { list-style: none; padding: 0; display: grid; gap: .5rem; }
      li a { display: block; padding: .9rem 1.1rem; background: #fffdf7; border: 1px solid #dcd6c8;
        border-radius: .75rem; color: #2f4738; text-decoration: none; font-weight: 600; }
      li a:hover { border-color: #36654f; }
      nav { margin-top: 2.5rem; display: flex; flex-wrap: wrap; gap: .75rem 1.25rem; }
      nav a { color: #36654f; font-weight: 600; text-decoration: none; }
    </style>
  </head>
  <body>
    <main>
      <h1>칼럼 모음</h1>
      <p class="lead">3년 다이어리를 쓰는 사람들이 자주 묻는 기록 습관, 회고 주기, 생활 기록, 백업과 보안 이야기를 12편으로 정리했습니다.</p>
      <ul>
${cards}
      </ul>
      <nav>
        <a href="/">3년 다이어리 열기</a>
        <a href="/guide/">활용 가이드</a>
        <a href="/faq/">자주 묻는 질문</a>
        <a href="/about/">서비스 소개</a>
        <a href="/privacy/">개인정보처리방침</a>
        <a href="/contact/">문의</a>
      </nav>
    </main>
  </body>
</html>
`;

mkdirSync(join(dist, 'blog'), { recursive: true });
writeFileSync(join(dist, 'blog', 'index.html'), blog, 'utf8');

// dist 결과물을 저장소 루트로 펼친다. (Jekyll이 이 파일들을 그대로 _site로 복사)
for (const entry of readdirSync(dist, { withFileTypes: true })) {
  const from = join(dist, entry.name);
  const to = join(root, entry.name);
  if (entry.name === 'dist') continue;
  cpSync(from, to, { recursive: true, force: true });
}
// 이전 빌드에서 남은 dist 폴더는 Jekyll 복사 대상에서 제외하므로 지운다.
rmSync(dist, { recursive: true, force: true });

const index = readFileSync(join(root, 'index.html'), 'utf8');
if (!index.includes('ca-pub-5461344534519122')) {
  throw new Error('루트 index.html이 빌드 결과물로 바뀌지 않았습니다.');
}

console.log(`[deploy] dist ${readdirSync(root).length}개 항목을 저장소 루트로 펼쳤습니다.`);
