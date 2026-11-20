import { defineConfig } from 'vitest/config';

export default defineConfig({
  // 샌드박스처럼 `localhost` DNS가 없는 환경에서도 서버를 열 수 있게 IP로 고정한다.
  server: {
    host: '127.0.0.1',
    hmr: false,
  },
  define: {
    __ADSENSE_CLIENT__: JSON.stringify(''),
    __SITE_URL__: JSON.stringify('https://monopoint.app'),
  },
  test: {
    include: ['src/**/*.test.{ts,tsx}'],
    environment: 'node',
    pool: 'forks',
  },
});
