import { escapeHtml } from './html.mjs';

export { escapeHtml };

const rawSiteUrl = (process.env.VITE_SITE_URL ?? 'https://monopoint.app').replace(/\/+$/, '');
export const SITE = {
  name: '3년 다이어리',
  url: rawSiteUrl,
  email: 'imaxaug@gmail.com',
  adsenseClient:
    process.env.VITE_ADSENSE_CLIENT === undefined
      ? 'ca-pub-5461344534519122'
      : process.env.VITE_ADSENSE_CLIENT.trim(),
  articleSlot: (process.env.VITE_AD_SLOT_ARTICLE ?? '').trim(),
  updated: '2026-11-20',
};

export const NAV = [
  { key: 'home', path: '/', label: '일기 쓰기' },
  { key: 'guide', path: '/guide/', label: '활용 가이드' },
  { key: 'faq', path: '/faq/', label: 'FAQ' },
  { key: 'about', path: '/about/', label: '소개' },
];

/** 바닥글에 노출하는 칼럼 목록. build-pages가 실제 글 목록과 대조해 어긋나면 빌드를 멈춘다. */
export const COLUMNS = [
  { path: '/articles/01-why-three-year-diary/', label: '3년 전 오늘을 다시 읽어야 하는 이유' },
  { path: '/articles/02-three-line-bullet-diary/', label: '하루 3줄 블렛 일기 루틴' },
  { path: '/articles/03-bad-vs-good-diary/', label: '나쁜 일기와 좋은 일기: 실전 비교 5쌍' },
  { path: '/articles/04-review-cycles/', label: '3개월·6개월·1년 회고 주기 활용법' },
  { path: '/articles/05-five-minute-recording/', label: '작심삼일을 깨는 5분 기록법' },
  { path: '/articles/06-emotion-vs-fact/', label: '감정과 사실을 분리해 쓰는 법' },
  { path: '/articles/07-career-reflection-4050/', label: '4050 직장인 커리어 회고 질문 10가지' },
  { path: '/articles/08-spending-health-sleep-tracking/', label: '소비·건강·수면 한 줄 트래킹' },
  { path: '/articles/09-year-end-settlement/', label: '연말·연초, 1년 기록 결산하는 법' },
  { path: '/articles/10-local-backup-security/', label: '로컬 저장 기록의 백업과 보안 관리' },
  { path: '/articles/11-paper-to-web/', label: '종이 일기에서 웹 다이어리로 옮길 때' },
  { path: '/articles/12-100-days-365-days/', label: '100일·365일 기록 후 달라지는 의사결정' },
];

function relativePrefix(path) {
  const depth = path.split('/').filter(Boolean).length;
  return '../'.repeat(depth);
}

/** COLUMNS 순서에서 한 칼럼의 이전 글·다음 글을 찾는다. 빌드와 렌더링이 같은 순서를 쓴다. */
export function columnNeighbors(path) {
  const index = COLUMNS.findIndex((column) => column.path === path);
  if (index === -1) return { prev: undefined, next: undefined };
  const prev = COLUMNS[index - 1];
  const next = COLUMNS[index + 1];
  return {
    prev: prev ? { path: prev.path, label: prev.label } : undefined,
    next: next ? { path: next.path, label: next.label } : undefined,
  };
}

function link(rel, path) {
  return `${rel}${path.replace(/^\//, '')}`;
}

function head(page, rel, schemaHtml) {
  const canonical = `${SITE.url}${page.path}`;
  const adsense = SITE.adsenseClient
    ? `    <meta name="google-adsense-account" content="${escapeHtml(SITE.adsenseClient)}" />
    <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${escapeHtml(
      SITE.adsenseClient,
    )}" crossorigin="anonymous"></script>
`
    : '';

  return `  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
    <title>${escapeHtml(page.title)}</title>
    <meta name="description" content="${escapeHtml(page.description)}" />
    <link rel="canonical" href="${canonical}" />
    <meta name="robots" content="index,follow,max-image-preview:large" />
    <meta name="theme-color" content="#f2efe7" />
${adsense}    <meta property="og:type" content="${page.kind === 'article' ? 'article' : 'website'}" />
    <meta property="og:site_name" content="${SITE.name}" />
    <meta property="og:locale" content="ko_KR" />
    <meta property="og:title" content="${escapeHtml(page.title)}" />
    <meta property="og:description" content="${escapeHtml(page.description)}" />
    <meta property="og:url" content="${canonical}" />
    <meta property="og:image" content="${SITE.url}/og-image.png" />
    <meta property="og:image:type" content="image/png" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta property="og:image:alt" content="${escapeHtml(page.title)}" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${escapeHtml(page.title)}" />
    <meta name="twitter:description" content="${escapeHtml(page.description)}" />
    <meta name="twitter:image" content="${SITE.url}/og-image.png" />
${schemaHtml}    <link rel="icon" href="${rel}favicon.svg" type="image/svg+xml" />
    <link rel="stylesheet" href="${rel}src/content.css" />
    <noscript>
      <style>
        .site-nav { display: flex !important; flex-wrap: wrap; width: 100%; }
        .nav-toggle { display: none !important; }
      </style>
    </noscript>
  </head>`;
}

function header(page, rel) {
  const items = NAV.map((item) => {
    const active = page.navKey === item.key ? ' aria-current="page"' : '';
    return `        <a href="${link(rel, item.path)}"${active}>${item.label}</a>`;
  }).join('\n');
  return `  <body>
    <a class="skip-link" href="#main">본문으로 바로가기</a>
    <header class="site-header">
      <div class="shell header-inner">
        <a class="brand" href="${rel}">
          <span class="brand-mark" aria-hidden="true"></span>
          <span>${SITE.name}</span>
          <span class="brand-sub">오늘과 3년 전 오늘</span>
        </a>
        <button class="nav-toggle" type="button" data-nav-toggle aria-expanded="false" aria-controls="site-nav">
          메뉴
        </button>
        <nav id="site-nav" class="site-nav" aria-label="주요 메뉴">
${items}
        </nav>
      </div>
    </header>`;
}

function adSlot(slot, position) {
  if (!SITE.adsenseClient) {
    return '        <div class="ad-slot is-placeholder" role="presentation">광고 영역 · 애드센스 승인 후 표시</div>';
  }
  // 수동 광고 단위가 아직 없으면 빈 자리를 비워 두지 않는다. 자동 광고가 승인 후 채운다.
  if (!slot) return '';
  return `        <ins class="adsbygoogle" data-ad-client="${escapeHtml(
    SITE.adsenseClient,
  )}" data-ad-slot="${escapeHtml(slot)}" data-ad-format="horizontal" data-full-width-responsive="true"></ins>`;
}

function toc(page) {
  if (page.toc === false) return '';
  const items = page.sections
    .map((section) => `          <li><a href="#${section.id}">${section.title}</a></li>`)
    .join('\n');
  return `        <nav class="toc" aria-label="목차">
          <p class="toc-title">목차</p>
          <ol>
${items}
          </ol>
        </nav>
`;
}

function sections(page) {
  return page.sections
    .map(
      (section) => `        <section aria-labelledby="${section.id}">
          <h2 id="${section.id}">${section.title}</h2>
${section.html}
        </section>`,
    )
    .join('\n');
}

function postNav(page, rel) {
  if (page.kind !== 'article') return '';
  const { prev, next } = columnNeighbors(page.path);
  const sides = [
    prev ? { path: prev.path, title: prev.label, arrow: '← 이전 글', side: 'is-prev', rel: 'prev' } : null,
    next ? { path: next.path, title: next.label, arrow: '다음 글 →', side: 'is-next', rel: 'next' } : null,
  ].filter(Boolean);
  if (sides.length === 0) return '';
  const items = sides
    .map(
      (side) => `          <a class="post-nav-link ${side.side}" href="${link(rel, side.path)}" rel="${side.rel}">
            <span class="post-nav-label">${side.arrow}</span>
            <span class="post-nav-title">${escapeHtml(side.title)}</span>
          </a>`,
    )
    .join('\n');
  return `        <nav class="post-nav" aria-label="칼럼 이전 글과 다음 글">
${items}
        </nav>
`;
}

function related(page, rel) {
  if (!page.related || page.related.length === 0) return '';
  const items = page.related
    .map((item) => `            <li><a href="${link(rel, item.path)}">${escapeHtml(item.label)}</a></li>`)
    .join('\n');
  return `        <nav class="related" aria-label="관련 글">
          <p class="related-title">이어서 읽기</p>
          <ul>
${items}
          </ul>
        </nav>
`;
}

function footer(rel) {
  const links = [
    { path: '/guide/', label: '활용 가이드' },
    { path: '/faq/', label: '자주 묻는 질문' },
    { path: '/about/', label: '서비스 소개' },
    { path: '/privacy/', label: '개인정보처리방침' },
    { path: '/terms/', label: '이용약관' },
    { path: '/contact/', label: '문의' },
  ]
    .map((item) => `          <a href="${link(rel, item.path)}">${item.label}</a>`)
    .join('\n');
  const columns = COLUMNS.map(
    (item) => `            <li><a href="${link(rel, item.path)}">${item.label}</a></li>`,
  ).join('\n');
  return `  <footer class="site-footer">
    <div class="shell">
      <nav class="footer-columns" aria-label="기록 칼럼">
        <p class="footer-columns-title">기록과 회고 칼럼</p>
        <ul>
${columns}
        </ul>
      </nav>
      <nav class="footer-links" aria-label="바닥글 메뉴">
${links}
      </nav>
      <p class="footer-note">이 사이트는 개인 기록 도구이며 광고로 운영됩니다.</p>
      <p class="footer-note">일기 내용은 서버로 전송되지 않고 이용자의 브라우저에만 저장됩니다.</p>
      <p class="copyright">© <span data-current-year>2026</span> ${SITE.name}</p>
    </div>
  </footer>
  <script type="module" src="${rel}src/content-page.ts"></script>
</body>`;
}

function countText(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/g, ' ')
    .replace(/<style[\s\S]*?<\/style>/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/@@REL@@/g, '')
    .replace(/\s+/g, '').length;
}

export function pageTextLength(page) {
  const rel = relativePrefix(page.path);
  return countText(sections(page).replaceAll('@@REL@@', rel));
}

export function renderPage(page) {
  const rel = relativePrefix(page.path);
  const body = sections(page)
    .replaceAll('@@REL@@', rel)
    // 표는 좁은 화면에서 가로로 넘겨 보므로, 키보드만 쓰는 방문자도 표 안으로 들어갈 수 있게 한다.
    .replaceAll(
      '<div class="table-wrap">',
      '<div class="table-wrap" role="region" tabindex="0" aria-label="표 (좁은 화면에서는 옆으로 넘겨 볼 수 있습니다)">',
    );
  const textLength = countText(body);
  const minChars = page.minChars ?? (page.kind === 'article' ? 2000 : 600);

  if (page.kind === 'article' && textLength > 3600) {
    throw new Error(
      `[build-pages] ${page.path} 본문이 3,500자를 넘습니다 (${textLength}자). 조금 줄여 주세요.`,
    );
  }
  if (textLength < minChars) {
    throw new Error(`[build-pages] ${page.path} 본문이 ${minChars}자보다 짧습니다 (${textLength}자).`);
  }
  if (page.title.length > 60) {
    throw new Error(`[build-pages] ${page.path} title이 60자를 넘습니다 (${page.title.length}자).`);
  }
  if (page.description.length < 80 || page.description.length > 155) {
    throw new Error(
      `[build-pages] ${page.path} description은 80~155자여야 합니다 (${page.description.length}자).`,
    );
  }
  if (page.sections.length < 3) {
    throw new Error(`[build-pages] ${page.path} 섹션이 3개 미만입니다.`);
  }

  const breadcrumb = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: SITE.name, item: `${SITE.url}/` },
      { '@type': 'ListItem', position: 2, name: page.h1, item: `${SITE.url}${page.path}` },
    ],
  };
  const schemas =
    page.kind === 'article'
      ? [
          {
            '@context': 'https://schema.org',
            '@type': 'Article',
            headline: page.h1,
            description: page.description,
            datePublished: page.published ?? SITE.updated,
            dateModified: page.updated ?? SITE.updated,
            inLanguage: 'ko',
            mainEntityOfPage: `${SITE.url}${page.path}`,
            author: { '@type': 'Organization', name: SITE.name, url: SITE.url },
            publisher: { '@type': 'Organization', name: SITE.name, url: SITE.url },
          },
          breadcrumb,
        ]
      : [breadcrumb];

  const schemaHtml =
    schemas.map((entry) => `    <script type="application/ld+json">${JSON.stringify(entry)}</script>\n`).join('') ||
    '';

  const topAd = adSlot(SITE.articleSlot, 'top');
  const bottomAd = adSlot(SITE.articleSlot, 'bottom');
  const topAdHtml = topAd ? `      <div class="ad-area">\n${topAd}\n      </div>\n` : '';
  const bottomAdHtml = bottomAd ? `      <div class="ad-area" style="margin-top: 24px">\n${bottomAd}\n      </div>\n` : '';

  return `<!doctype html>
<html lang="ko">
${head(page, rel, schemaHtml)}
${header(page, rel)}
    <main id="main" class="shell page">
${topAdHtml}      <article class="article">
        <p class="eyebrow">${page.eyebrow ?? '기록 가이드'}</p>
        <h1>${page.h1}</h1>
        <p class="lead">${page.lead}</p>
        <p class="meta-line">최근 수정: ${page.updated ?? SITE.updated}</p>
${toc(page)}${body}
${postNav(page, rel)}${related(page, rel)}        <p class="article-footnote">
          이 사이트는 개인 기록 도구이며 광고로 운영됩니다. 기록은 서버로 보내지 않고 이용자의 브라우저에만
          저장하며, 브라우저 데이터를 지우면 함께 사라지므로 JSON 백업을 권합니다.
        </p>
      </article>
${bottomAdHtml}    </main>
${footer(rel)}
</html>
`;
}
