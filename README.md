# MonoPoint (축구 전문 블로그)

K리그, 해외축구 경기 분석, 관전 포인트 및 주요 축구 소식을 깊이 있고 전문성 있게 전달하는 스포츠 전문 블로그입니다.

## 업데이트 내역
- **2026-07-03**: 계산기 기능 추가 (총 45종) - 금융, 날짜/시간, 건강, 생활, 단위 변환 등.
- **2026-07-14**: 애드센스 승인 심사 및 구글 검색 최적화(SEO) 대응
  - `robots.txt` 내 사이트맵 주소 수정 (`monpoint.app` -> `monopoint.app`)
  - 모바일 Hits 카운터 노출용 CSS 미디어 쿼리 커스텀 레이아웃 작업 (`_includes/head/custom.html`, `_includes/author-profile-custom-links.html`)
  - 자동 포스팅 과정에서의 번역 오류 제거를 위한 `sanitizeContent` 제거 로직 추가
  - 정치/민감 키워드 필터링 및 사이트맵 자동 갱신 로직 수정
- **2026-07-21**: Cusdis 댓글 시스템 복구 및 UI/UX 디자인 개선
  - Cusdis 댓글 위젯 추가 및 `_config.yml` 설정 복원
  - 글 하단의 이전글/다음글 네비게이션 버튼을 슬림한 카드 형태로 개선 (`_includes/post_pagination.html`, 규칙 14 준수)
  - 애드센스 제한 방지를 위해 AI 특유의 상투적 템플릿 어구("알아두면 유용한", "완벽 정리" 등) 전면 차단 로직 개편 (`scripts/auto_post.js`)
  - 기존 202개 포스트 제목 템플릿 어구 제거 완료 (`scripts/fix_novel_titles.mjs`)
  - 정치적 이슈 포스트 7개 삭제 및 블랙리스트 확장
  - 관리자 전용 포스트 수정/삭제 대시보드 구축 (`admin.html`, `scripts/admin_server.js`)
- **2026-07-22**: Google AdSense 최적화 및 비공개 처리 완료
  - `.github/workflows/auto_post.yml` 크론 스케줄 임시 제거
  - 1,216개의 비축구 대기글 및 314개의 비축구 포스트들을 아카이브 폴더(`_posts-pending-archive`, `_posts-archive`)로 이전 및 빌드 제외
  - 순수 AI 기술 관련 포스트 36개만 남기고 사이트맵 갱신 (41개 URL)
  - 관리자 대시보드에 AI 초안 자동 생성 기능 추가 (NVIDIA NIM Llama-3.1 70B 모델 연동)
- **2026-07-22 (2차 - 대전환)**: 축구 전문 블로그로 정체성 100% 대전환 및 자동 발행 활성화
  - 사이트 설명, 테마 skin, 소개글(`about.md`), 규칙(`AGENTS.md`)을 축구(K리그, 해외축구, 경기 분석, 대표팀, 전술, 상식) 전문으로 개편
  - 5시간 주기 자동 발행 스케줄 복원 완료 (`.github/workflows/auto_post.yml`)
  - `scripts/auto_post.js`를 축구 전문 경기 분석 포스트(4,000자 이상, 0% 정치 이슈, E-E-A-T 준수) 생성 로직으로 개편
  - 장기기억 문서 `MEMORY.md` 및 프로젝트 요약 파일 축구 버전으로 전면 업데이트
- **2026-07-22 (3차 - 기억 동기화)**: 장기 기억 및 스킬 문서 축구 전문 사이트로 최종 갱신
  - 영구 장기 기억 프록시(https://llm-memory-proxy.onrender.com)의 `pognae` user_id 데이터를 축구 전문 블로그로의 대전환 정보로 업데이트 완료 (토큰 한계 512에 맞춰 분할 전송)
  - 프로젝트 관리 스킬 문서(`.agents/skills/memanto/SKILL.md`) 내 예시 및 가이드라인을 축구 전문 예시로 개편
  - `monopoint_project_summary.md` 파일도 축구 블로그 정체성 및 최신 장기 기억 관리 방식에 맞추어 전면 갱신
- **2026-07-22 (4차 - 비공개 완료)**: 축구 이외의 글(이전 AI 기술 포스트 36개) 비공개 조치 완료
  - `_posts` 내에 남아있던 36개의 AI 기술 포스트를 모두 `_posts-archive/` 디렉토리로 이동시켰습니다.
  - `_config.yml` 설정에 의해 아카이브 폴더 내 글은 배포에서 제외되므로 완전히 비공개 처리되었습니다.
  - [sitemap.xml](file:///d:/dev/profit-making_site/pognae.github.io/sitemap.xml)을 갱신하여 순수 축구 및 소개용 5개 정적 URL만 인덱싱되도록 조정했습니다.
- **2026-07-22 (5차 - 자동 발행 점검 수정)**: GitHub Actions 배포 워크플로우 내 cron 스케줄 복원
  - [.github/workflows/pages.yml](file:///d:/dev/profit-making_site/pognae.github.io/.github/workflows/pages.yml)에 KST 09:00, 15:00 자동 발행용 cron schedule을 복원하여 `verify-auto-publish.mjs` 검증 실패 문제를 해결했습니다.
- **2026-07-22 (6차 - 제목 마크다운 기호 제거)**: 글 목록/상세 페이지 제목의 마크다운 기호 정제
  - 빌드 시점에 모든 포스트와 페이지의 `title` 및 `description`에서 마크다운 기호(`**`, `*`, `` ` ``, `#`) 및 불필요한 줄바꿈을 제거해주는 Jekyll 훅 플러그인([_plugins/title_cleaner.rb](file:///d:/dev/profit-making_site/pognae.github.io/_plugins/title_cleaner.rb))을 적용했습니다.
  - [_includes/archive-single.html](file:///d:/dev/profit-making_site/pognae.github.io/_includes/archive-single.html) 및 [_includes/post_pagination.html](file:///d:/dev/profit-making_site/pognae.github.io/_includes/post_pagination.html) Liquid 템플릿에 타이틀 정제 필터를 적용했습니다.
  - [_includes/head/custom.html](file:///d:/dev/profit-making_site/pognae.github.io/_includes/head/custom.html)에 클라이언트 사이드 스크립트를 추가하여 브라우저 탭과 DOM 제목 영역의 마크다운 기호를 정밀 정제했습니다.
  - [scripts/auto_post.js](file:///d:/dev/profit-making_site/pognae.github.io/scripts/auto_post.js) 및 [scripts/admin_server.js](file:///d:/dev/profit-making_site/pognae.github.io/scripts/admin_server.js)에 AI 글 생성 시 제목/설명에서 마크다운 기호를 원천 제거하는 정제 로직을 추가했습니다.
- **2026-07-22 (7차 - sitemap.xml 자동 갱신 자동화)**: sitemap.xml 자동 갱신 설정
  - [.github/workflows/pages.yml](file:///d:/dev/profit-making_site/pognae.github.io/.github/workflows/pages.yml) 및 [.github/workflows/auto_post.yml](file:///d:/dev/profit-making_site/pognae.github.io/.github/workflows/auto_post.yml) 워크플로우에 신규 글 발행 시 sitemap.xml을 자동 생성하고 Git 저장소에 커밋/푸시하도록 빌드 단계를 개편하여, 항상 최신 sitemap.xml이 무중단 자동 갱신되도록 조치했습니다.
- **2026-07-23 (8차 - 애드센스 거절 조치 및 자동 생성 중지)**: 애드센스 미승인 대응 저품질 글 정리 및 자동 발행 제어
  - 축구와 무관하게 허구로 작성된 5개 저품질 AI 포스트(차준환, 의성군, 김준호, 만평, 소셜 네트워크 서비스)를 영구 삭제했습니다.
  - [auto_post.yml](file:///d:/dev/profit-making_site/pognae.github.io/.github/workflows/auto_post.yml)의 5시간 주기 cron 스케줄을 주석 처리하여 무분별한 자동 포스팅 생성을 중지했습니다.
  - [auto_post.js](file:///d:/dev/profit-making_site/pognae.github.io/scripts/auto_post.js) 스크립트를 보완하여, 구글 트렌드 검색어 중 '진짜 축구' 관련 단어가 포함된 경우에만 포스팅을 작성하도록 `isSoccerKeyword` 검증 로직을 추가하고, 축구 무관 키워드를 억지로 변경하는 로직을 제거했습니다.
  - NVIDIA NIM API 포스트 생성 프롬프트를 30년차 베테랑 축구 해설가급 톤앤매너로 개편하고, 가짜 매치/선수 정보 왜곡 등의 허구 사실 작성을 차단하여 글의 신뢰성(구글 E-E-A-T 가이드라인)을 보장하고, AI 특유의 상투적 템플릿 마무리를 전면 제거했습니다.
  - 글 삭제로 인해 사이트맵([sitemap.xml](file:///d:/dev/profit-making_site/pognae.github.io/sitemap.xml))을 다시 빌드하여 URL 색인을 클린하게 갱신했습니다.
- **2026-07-24 (10차 - 자동 생성 본문 태그, 구분선, **, 도입부 표기 정제 강화)**:
  - AI 자동 글 생성 시 본문(`body`) 내에 `[TITLE]`, `[DESCRIPTION]`, `[BODY]`, `**TITLE**`, `**BODY**` 등 섹션 태그 및 `=====================================================` 형태의 구분선뿐만 아니라, `**` (볼드 기호) 및 `도입부`(소제목 문구) 단어가 전혀 포함되지 않도록 `cleanPostBody` 정제 로직 및 AI 생성 프롬프트를 전면 개편했습니다 (`scripts/auto_post.js`, `scripts/admin_server.js`, `admin.html`).
  - 생성 프롬프트의 소제목 가이드를 '서론/경기 배경'으로 변경하고 "도입부" 문구 및 "**" 사용 금지 지침을 명시하여, 향후 자동 발행 시 해당 표기들이 본문에 들어가지 않도록 조치했습니다.







## 프로젝트 아키텍처 및 주요 디렉토리
```
pognae.github.io/
├── _posts/                 # 발행 완료된 축구 전문 포스트 (K리그, 해외축구 등)
├── _posts-pending/         # 발행 대기 중인 임시 포스트
├── _posts-archive/         # 비축구/이전 정체성 포스트 보관함 (빌드 제외)
├── _posts-pending-archive/ # 비축구 대기 포스트 보관함 (빌드 제외)
├── _layouts/               # Jekyll 레이아웃 정의 파일
├── _includes/              # HTML 컴포넌트 모듈 (Cusdis 댓글 및 네비게이션 개선 적용)
├── scripts/                # 자동 포스팅 및 관리자 서버 스크립트
├── .github/workflows/      # GitHub Actions 자동 배포 및 5시간 주기 포스팅 워크플로우
├── _config.yml             # Jekyll 사이트 설정 파일 (Theme: minimal-mistakes, Skin: air)
├── robots.txt              # 크롤러 수집 가이드라인
└── sitemap.xml             # 검색엔진 등록용 사이트맵
```
