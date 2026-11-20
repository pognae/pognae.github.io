/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './*/index.html', './articles/**/index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        paper: '#f2efe7',
        card: '#fffdf8',
        line: '#e2ddd0',
        ink: '#22231f',
        // 보조 텍스트는 작은 크기에서도 4.5:1을 넘도록 살짝 어둡게 쓴다(팔레트의 종이 톤 유지).
        muted: '#6f6b5f',
        subtle: '#8d897c',
        pine: {
          DEFAULT: '#36654f',
          soft: '#e7efe9',
        },
      },
      fontFamily: {
        sans: [
          'Pretendard',
          '-apple-system',
          'BlinkMacSystemFont',
          'Apple SD Gothic Neo',
          'Malgun Gothic',
          'Noto Sans KR',
          'system-ui',
          'sans-serif',
        ],
      },
      borderRadius: {
        '2xl': '16px',
      },
      maxWidth: {
        shell: '1100px',
      },
    },
  },
  plugins: [],
};
