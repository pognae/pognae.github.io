import { readdirSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';

const ROOT = process.cwd();
const DEFAULT_ADSENSE_CLIENT = 'ca-pub-5461344534519122';
const DEFAULT_SITE_URL = 'https://monopoint.app';

function adsenseClient(): string {
  const raw = process.env.VITE_ADSENSE_CLIENT;
  if (raw === undefined) return DEFAULT_ADSENSE_CLIENT;
  return raw.trim();
}

/** `GITHUB_REPOSITORY`로 배포 경로를 자동 판별한다. 사용자 사이트 저장소면 '/'. */
function resolveBase(): string {
  const explicit = process.env.VITE_BASE_PATH;
  if (explicit) {
    if (explicit === '/') return '/';
    return explicit.startsWith('/') ? `${explicit.replace(/\/$/, '')}/` : `/${explicit.replace(/\/$/, '')}/`;
  }
  const repository = process.env.GITHUB_REPOSITORY;
  if (!repository) return '/';
  const [owner, repo] = repository.split('/');
  if (!owner || !repo) return '/';
  return repo === `${owner}.github.io` ? '/' : `/${repo}/`;
}

/** 앱 1장 + 콘텐츠 HTML 전부를 롤업 엔트리로 등록한다. */
function htmlEntries(): Record<string, string> {
  const entries: Record<string, string> = { main: resolve(ROOT, 'index.html') };
  for (const dir of ['guide', 'faq', 'about', 'privacy', 'terms', 'contact']) {
    const file = resolve(ROOT, dir, 'index.html');
    if (existsSync(file)) entries[dir] = file;
  }
  const articlesDir = resolve(ROOT, 'articles');
  if (existsSync(articlesDir)) {
    for (const name of readdirSync(articlesDir, { withFileTypes: true })) {
      if (!name.isDirectory()) continue;
      const file = resolve(articlesDir, name.name, 'index.html');
      if (existsSync(file)) entries[`articles/${name.name}`] = file;
    }
  }
  return entries;
}

/** 애드센스 승인 스크립트를 모든 HTML head에 넣는다(클라이언트 ID가 있을 때만). */
function adsensePlugin(client: string): Plugin {
  return {
    name: 'three-year-diary-adsense',
    transformIndexHtml(html) {
      if (!client) return html;
      // 페이지가 이미 태그를 직접 넣었다면 중복 삽입하지 않는다.
      if (html.includes('google-adsense-account')) return html;
      return {
        html,
        tags: [
          {
            tag: 'meta',
            attrs: { name: 'google-adsense-account', content: client },
            injectTo: 'head',
          },
          {
            tag: 'script',
            attrs: {
              async: true,
              src: `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${client}`,
              crossorigin: 'anonymous',
            },
            injectTo: 'head',
          },
        ],
      };
    },
  };
}

export default defineConfig(() => {
  const client = adsenseClient();
  return {
    base: resolveBase(),
    plugins: [react(), adsensePlugin(client)],
    define: {
      __ADSENSE_CLIENT__: JSON.stringify(client),
      __SITE_URL__: JSON.stringify((process.env.VITE_SITE_URL ?? DEFAULT_SITE_URL).replace(/\/$/, '')),
    },
    build: {
      rollupOptions: { input: htmlEntries() },
      outDir: 'dist',
    },
  };
});
