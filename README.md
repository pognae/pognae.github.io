# MonoPoint

MonoPoint(모노포인트)는 구글 실시간 트렌드 키워드를 활용해 생활, 금융, 건강 실용 정보를 제공하는 **발행형 Jekyll 정적 블로그**입니다.
NVIDIA NIM Llama 모델 API를 통해 고품질의 SEO 최적화 한국어 콘텐츠를 주기적으로 생성하고, GitHub Actions 및 Cloudflare Pages를 통해 무중단으로 자동 배포됩니다.

- **도메인**: [https://monopoint.app](https://monopoint.app)
- **배포 기술**: GitHub Actions + Jekyll (정적 사이트 생성) + Cloudflare Pages 도메인 연동

## 주요 특징

- **실시간 트렌드 포스팅**: 구글 트렌드 인기 검색어 1~5위를 5시간마다 자동으로 스크랩하여 콘텐츠를 발행합니다.
- **NVIDIA NIM Llama-3.1 기반 작성**: 고성능 LLM API를 활용해 단순 정보 나열이 아닌, 에디터 톤앤매너를 지닌 4,000자 이상의 고품질 한글 포스트를 자동으로 생성합니다.
- **강력한 SEO 및 애드센스 최적화**:
  - `jekyll-seo-tag` 기반 메타 데이터 태그 자동 생성
  - 자동 갱신되는 `sitemap.xml` 및 올바른 `robots.txt` 구성
  - 광고 승인을 돕는 필수 페이지 완비 (소개, 개인정보처리방침, 문의) 및 `ads.txt` 연동
- **오역 방지(Sanitization) 로직**: 자동 생성 과정에서 종종 발생하는 한자 `們`, 일어/태국어 혼입 등의 기계번역 오역 패턴을 원천적으로 필터링 및 정제합니다.

## 시스템 구성 및 디렉토리 구조

```
pognae.github.io/
├── _posts/                 # 발행된 마크다운 블로그 포스트 저장소
├── _posts-pending/         # 발행 예정/대기 중인 임시 포스트
├── _layouts/               # 레이아웃 정의 (Jekyll 표준 규격)
├── _includes/              # HTML 컴포넌트 모듈
│   ├── head/custom.html    # 애드센스 스크립트 및 반응형 스타일 오버라이드
│   └── author-profile-custom-links.html  # 방문자 수 카운터(hits) 노출 영역
├── scripts/                # 자동화 스크립트 폴더
│   └── auto_post.js        # 구글 트랜드 수집 및 NVIDIA NIM API 활용 블로그 생성 코어
├── .github/workflows/      # GitHub Actions 자동 배포/포스팅 워크플로우
│   ├── auto_post.yml       # 5시간 주기 자동 스크랩 및 포스팅 트리거
│   └── pages.yml           # Jekyll 빌드 및 GitHub Pages 배포 파이프라인
├── _config.yml             # Jekyll 사이트 설정 파일
├── robots.txt              # 크롤러 수집 가이드라인 파일
├── sitemap.xml             # 수집기 색인용 사이트맵 파일
└── ads.txt                 # 구글 애드센스 대리점 식별 정보 파일
```

## 환경 변수 설정 (Secrets)

자동 포스팅 파이프라인 작동을 위해 GitHub Repository Secrets에 아래 환경 변수 설정이 필요합니다.
- `NVIDIA_API_KEY`: NVIDIA NIM API 액세스를 위한 API 키값





## 업데이트 내역
- **2026-07-03**: 계산기 15종 추가 (총 45종)
  - 금융: 환율, 주식 수익률, 배당금 추가
  - 날짜·시간: 수면 사이클 추가
  - 건강: 허리-엉덩이 비율, 표준 체중 추가
  - 생활: 요리 단위, 여행 유류비, 더치페이 추가
  - 단위 변환: 부피, 면적 추가
  - 기타: 글자 수 세기, 16진수-10진수 변환 추가
- **2026-07-14**: 애드센스 승인 심사 및 구글 검색 최적화(SEO) 대응
  - `robots.txt` 내 사이트맵 URL 도메인 오타 수정 (`monpoint.app` -> `monopoint.app`)
  - 모바일 및 태블릿 반응형 레이아웃에서 방문자 수 카운터(hits) 노출되도록 CSS 미디어 쿼리 커스텀 스타일 적용 (`_includes/head/custom.html`, `_includes/author-profile-custom-links.html`)
  - 자동 포스트 생성기(`scripts/auto_post.js`)에 한국어 다국어 기계번역 오류(한자 '們', 일어, 태국어 등 혼입) 방지를 위한 `sanitizeContent` 정제 로직 추가 및 프롬프트 강화
  - 정치/민감한 키워드 필터링 및 러시아어 등 외국어 전용 검색어 배제 기능 추가
  - 애드센스 정책 위반 및 오류 파일 제거 (`_posts/2026-07-10-뇌물.md`, `_posts/2026-07-11-.md`) 및 기존 포스트 다국어 오류 정제 완료
  - 사이트맵(`sitemap.xml`) 재생성 완료 및 자동 생성 키워드 개수를 Rule 11에 맞게 5개로 복원
  - 구글 검색 상위 노출을 위해 E-E-A-T 가이드라인을 프로젝트 규칙(`AGENTS.md`)에 추가. 독창적인 콘텐츠(자신만의 팁, 경험 등) 및 정확한 정보/출처 포함 의무화.
- **2026-07-21**: Cusdis 댓글 시스템 복구 및 환경 제한 해제
  - 테마 이전 후 누락되었던 Cusdis 댓글 위젯(`_includes/comments.html`, `_includes/comments-providers/cusdis.html`) 추가 및 `_config.yml` 설정(provider: cusdis, app_id) 복원 완료.
  - `non-production` 환경 조건문 해제로 모든 환경에서 댓글 입력창이 정상 출력되도록 수정 및 GitHub Actions `JEKYLL_ENV: production` 설정 적용.


