# 3년 다이어리

오늘 일기를 블렛(•)으로 쓰면, 같은 화면에서 **3년 전부터 어제까지 12개 시점**의 기록을 한눈에 볼 수 있는 정적 웹앱입니다.
서버·로그인·결제가 없고, 기록은 이용자의 브라우저에만 저장됩니다. `monopoint.app`(GitHub Pages)에 배포하고 Google 애드센스로 운영하는 구조를 전제로 만들었습니다.

- 배포 대상: `pognae/pognae.github.io` 루트 (커스텀 도메인 `monopoint.app`)
- 기술 스택: Vite 5 + React 18 + TypeScript(strict) + Tailwind CSS 3 + vitest
- 라우터·날짜 라이브러리 없음. 날짜 계산은 `src/lib/date.ts`에 직접 구현했습니다.

## 빠르게 실행하기

```bash
npm install
npm run dev        # 콘텐츠 HTML 생성 후 개발 서버
npm run typecheck  # tsc --noEmit
npm test           # vitest run
npm run build      # 콘텐츠 생성 → vite build → sitemap/robots 생성
npm run preview    # 빌드 결과 확인
```

Node 20 이상을 권합니다. `npm run dev`와 `npm run build`는 먼저 `scripts/build-pages.mjs`로 콘텐츠 페이지 HTML을 생성합니다.
생성된 HTML은 저장소에 함께 커밋되어도 되고, 빌드 때마다 다시 만들어도 됩니다. 콘텐츠 원본은 `scripts/content/pages/*.mjs`입니다.

## 폴더 구조

```
index.html                     앱 (React 1페이지)
guide/ faq/ about/ privacy/    콘텐츠 페이지 (생성물, 커밋 대상)
terms/ contact/
articles/01-… ~ 12-…/          기록·회고 가이드 12편 (생성물)
public/                        CNAME, ads.txt, 검색 소유권 확인 파일, 404, favicon, og-image
src/
  App.tsx                      앱 셸·날짜 이동·저장·도구 메뉴·다이얼로그
  components/BulletEditor.tsx  contenteditable 블렛 편집기 (한글 IME 3중 처리)
  components/Timeline.tsx      12개 시점 회고 카드
  components/AdSlot.tsx        광고 슬롯 (승인 전에는 자리만 확보)
  components/Modal.tsx         공통 다이얼로그
  lib/date.ts                  날짜 키·요일·월 단위 말일 보정·12개 시점
  lib/bullets.ts               블렛 직렬화/역직렬화
  lib/backup.ts                백업 JSON 검증·병합 규칙
  lib/exports.ts               다운로드·마크다운·CSV
  lib/storage/                 DiaryStorageAdapter + localStorage/IndexedDB 구현
  content-page.ts, content.css 콘텐츠 페이지용 최소 스크립트·스타일
scripts/
  build-pages.mjs              콘텐츠 HTML 18장 생성 + 분량·메타 검증
  gen-seo.mjs                  dist/sitemap.xml, dist/robots.txt
  check-adsense.mjs            빌드 결과물의 애드센스 승인 요건 점검(빌드 마지막에 실행)
  gen-og-image.py              og-image.png(1200×630) 생성
  content/site.mjs             공통 레이아웃(헤더·푸터·광고·OG·JSON-LD)
  content/pages/*.mjs          페이지별 본문 원본
.github/workflows/deploy.yml   main 푸시 시 GitHub Pages 배포
```

## 데이터 저장 방식과 한계

- 모든 기록은 **브라우저 저장소**에만 저장됩니다. 서버 전송은 없습니다.
- 기본은 `localStorage`이고 키 접두사는 `3year-diary:v1:entry:`입니다. `VITE_STORAGE=idb`로 IndexedDB를 쓸 수 있습니다.
- 기기 간 자동 동기화는 **없습니다**. 브라우저·기기마다 저장소가 분리되어 있습니다.
- 브라우저 사이트 데이터를 지우거나 시크릿 모드 창을 닫으면 기록이 사라집니다.
- 입력이 멈추고 1.2초 뒤 자동 저장하며, 불러온 원문과 같으면 저장하지 않습니다(빈 날짜에 공백 레코드가 생기지 않도록).
- 저장 실패(용량 초과, 저장 차단)는 배지를 `저장 실패 · 다시 시도`로 바꾸고 콘솔에 원인을 남깁니다.

## 백업과 복원

1. 상단 **도구 → JSON 백업 내보내기** → `diary-backup-YYYYMMDD.json`
2. 새 기기에서 **도구 → 백업 가져오기** → 파일 선택
3. 미리보기에서 총 건수·겹치는 기록 수를 확인한 뒤 **병합** 또는 **전체 교체**
4. 병합은 백업의 `updatedAt`이 더 최신인 기록만 덮어씁니다. 전체 교체는 확인 체크박스를 켜야 실행됩니다.

마크다운(기간 선택)과 CSV(전체)로도 내보낼 수 있습니다. CSV는 엑셀 호환을 위해 UTF-8 BOM을 붙입니다.

## 환경변수

| 이름 | 기본값 | 설명 |
| --- | --- | --- |
| `VITE_ADSENSE_CLIENT` | `ca-pub-5461344534519122` | 애드센스 클라이언트 ID. 빈 값으로 두면 광고 스크립트를 넣지 않고 점선 자리만 표시합니다. |
| `VITE_AD_SLOT_TOP` | (없음) | 앱 상단 수동 광고 슬롯 ID. 비우면 빈 광고 상자를 남기지 않고 자동 광고에 맡깁니다. |
| `VITE_AD_SLOT_BOTTOM` | (없음) | 앱 하단 수동 광고 슬롯 ID. |
| `VITE_AD_SLOT_ARTICLE` | (없음) | 콘텐츠 페이지 상·하단 수동 광고 슬롯 ID. 비우면 광고 자리를 만들지 않습니다. |
| `VITE_SITE_URL` | `https://monopoint.app` | canonical·OG·sitemap에 쓰는 절대 주소. |
| `VITE_BASE_PATH` | 자동 | 배포 경로를 직접 지정할 때만 사용. |
| `VITE_STORAGE` | `localStorage` | `idb`면 IndexedDB 사용. |

`.env.example`을 복사해 `.env.local`로 쓰면 됩니다. 값은 `vite.config.ts`에서 `define`으로 주입됩니다.

## GitHub Pages 배포 (현재 방식)

`pognae/pognae.github.io` 저장소는 **Pages Source = GitHub Actions**, 브랜치 `main`을 씁니다.
그런데 저장소에 연결된 GitHub App 권한에 워크플로 파일 쓰기(`workflows`)가 없어
새 `deploy.yml`을 추가할 수 없습니다. 그래서 저장소에 원래 있던
`.github/workflows/pages.yml`(이름: `Build and deploy site`)을 그대로 씁니다.

1. 그 워크플로의 `node scripts/generate-sitemap.mjs` 단계가 실제 빌드를 합니다.
   `npm ci → npm run build` 후 `dist/` 결과물을 저장소 루트로 펼치고 `_site/blog/index.html`용 칼럼 허브를 만듭니다.
2. 이어지는 `bundle exec jekyll build`가 루트의 정적 파일을 그대로 `_site`로 복사합니다
   (`Gemfile`·`_config.yml`은 최소 설정만 둡니다).
3. `_site`가 Pages 아티팩트로 배포됩니다. `main`에 푸시하면 2~3분 뒤 `https://monopoint.app/`에 반영됩니다.

> 로컬에서는 `scripts/generate-sitemap.mjs`가 CI가 아니면 아무 일도 하지 않습니다(진입점 `index.html` 보호).
> 나중에 App에 `workflows` 권한이 생기면 이 디렉터리의 `.github/workflows/deploy.yml`을 그대로 올려
> 정공법(`npm ci → typecheck → test → build → dist 배포`)으로 바꾸면 됩니다.
>
> 배포 전 사이트(자치노트, Jekyll)는 태그 `legacy-jekyll-pre-diary`에 그대로 남아 있습니다.

> `package-lock.json`이 반드시 커밋되어 있어야 `npm ci`가 동작합니다. 저장소가 `아이디.github.io`가 아니면 `base`가 자동으로 `/저장소이름/`이 됩니다. 커스텀 도메인을 쓰는 이 프로젝트는 루트(`/`)로 배포됩니다.

> `package-lock.json`이 반드시 커밋되어 있어야 `npm ci`가 동작합니다. 저장소가 `아이디.github.io`가 아니면 `base`가 자동으로 `/저장소이름/`이 됩니다. 커스텀 도메인을 쓰는 이 프로젝트는 루트(`/`)로 배포됩니다.

## 애드센스 교체 (3단계)

1. `public/ads.txt`의 `pub-5461344534519122`를 발급받은 게시자 ID로 바꿉니다(`ca-` 접두사 없이 `pub-` + 16자리).
2. `VITE_ADSENSE_CLIENT`를 `ca-pub-...` 형태로 Secrets(또는 `.env.local`)에 넣습니다. 코드 기본값도 같은 ID입니다.
3. 배포 후 페이지 소스에서 `adsbygoogle.js?client=ca-pub-...`와 `<meta name="google-adsense-account">`가 보이는지, `https://monopoint.app/ads.txt`가 열리는지 확인합니다. 승인 후 애드센스에서 **자동 광고**를 켜면 슬롯 ID 없이도 광고가 붙습니다.

## 검증

- `npm run typecheck` — TypeScript strict 통과
- `npm test` — 날짜(말일 보정·윤년·12개 시점·요일), 직렬화/역직렬화, 백업 검증, 마크다운/CSV 형식 테스트에 더해 jsdom으로 앱을 실제 마운트해 블렛 입력 → 저장 → 재로드까지 확인합니다(24개 테스트).
- `npm run build` — 앱 + 18개 콘텐츠 페이지 빌드, `dist/sitemap.xml`·`robots.txt` 생성 후 애드센스 점검까지 실행
- `npm run check:adsense` — 빌드 결과물에서 애드센스 승인 요건을 직접 확인합니다(아래 표 참고). 하나라도 어긋나면 exit 1로 배포를 막습니다.
- `scripts/build-pages.mjs`가 페이지마다 본문 분량(가이드 3,000자 이상, 칼럼 2,000~3,500자), title 60자, description 80~155자, 섹션 3개 이상, 섹션 id 중복 여부를 검사하고, 바닥글 칼럼 목록이 실제 글과 맞는지 대조합니다. 기준을 못 채우면 빌드가 실패합니다.
- 같은 스크립트가 `알아보겠습니다`·`살펴보겠습니다`·`결론부터 말씀드리면`·`이처럼` 같은 기계적 표현이 본문에 다시 들어오면 빌드를 멈춥니다. 문장을 다듬을 때 이 목록을 피하면 됩니다.
- 칼럼의 **이전 글·다음 글**은 `COLUMNS` 순서로 `build-pages.mjs`가 자동으로 붙입니다. 글 순서가 `COLUMNS`와 어긋나면 빌드가 실패하고, 관련 글은 이전·다음 글과 겹치지 않게 가까운 칼럼부터 3편까지 채웁니다. `check:adsense`가 12편 모두의 `prev`/`next` 링크와 관련 글 수를 다시 확인합니다.

### `npm run check:adsense`가 보는 것

| 항목 | 기준 |
| --- | --- |
| 루트 HTML 정적 내용 | `<div id="root"></div>`만 있지 않고, JS 없이 읽히는 설명 800자 이상 + `h1` |
| 루트 HTML 내부 링크 | 가이드·FAQ·소개·개인정보처리방침·이용약관·문의 6종 + 칼럼 12편 |
| 모든 페이지 | 위 6개 링크, `canonical`, `og:image`(png), 애드센스 계정 메타·스크립트 |
| 광고 자리 | 승인 전 “광고 영역” 자리표시 문구나 빈 광고 상자가 남지 않음 |
| 개인정보처리방침 | DoubleClick(DART) 쿠키, `adssettings.google.com`, localStorage 키, 문의 메일 |
| 공유 이미지 | `dist/og-image.png`가 1200×630 PNG |
| sitemap·robots·ads.txt | 19개 주소가 모두 실제 파일과 연결, Mediapartners-Google 허용, 게시자 ID 일치 |
| 내부 링크 | 배포물 안에서 깨진 링크 0건 |
| 칼럼 연결 | 12편 모두 이전·다음 글(`rel=prev`/`rel=next`) 링크와 관련 글 2편 이상, 첫 글에는 `prev`, 마지막 글에는 `next`가 없음 |

## 남은 자리표시자

- `YOUR_EMAIL@example.com` 같은 메일 자리표시자는 없습니다. 문의 메일은 `imaxaug@gmail.com`으로 반영했습니다.
- `pub-0000000000000000` 같은 가짜 게시자 ID도 없습니다. `ca-pub-5461344534519122`가 기본값입니다. 실제 승인 ID가 다르면 위 교체 절차를 따르세요.
- `public/og-image.svg`와 `public/og-image.png`(1200×630)를 함께 두었습니다. `og:image`·`twitter:image`는 PNG를 가리킵니다. PNG는 `python3 scripts/gen-og-image.py`(Pillow 필요)로 다시 만들 수 있습니다.
- 광고 슬롯 ID는 비어 있습니다. 이때는 빈 광고 상자를 만들지 않고, 승인 후 자동 광고가 채웁니다.

## 임의로 결정한 사항

- 디자인은 명세의 stone/amber 대신 전달받은 3년 다이어리 팔레트(종이 `#f2efe7`, 딥그린 `#36654f`)를 따랐습니다. 보조 텍스트는 지정값 `#8d897c`가 작은 글씨에서 대비 3:1에 머물러, 같은 계열의 `#6f6b5f`로 조금 어둡게 써 4.5:1을 맞췄습니다(장식 요소에는 `#8d897c` 유지).
- 콘텐츠 18장은 `scripts/build-pages.mjs`로 생성하되, 결과 HTML을 저장소에 커밋해 크롤러가 JS 없이도 읽게 했습니다. 각 HTML에는 자체 `title`·`description`·`canonical`·OG·JSON-LD가 들어 있습니다.
- 루트(`index.html`)에는 앱 마운트 영역과 별도로 정적 안내 섹션(`.app-intro`)을 두었습니다. 애드센스 크롤러는 JS를 실행하지 않는 경우가 많아, 빈 `<div id="root"></div>`만 보이면 “가치 없는 콘텐츠”로 판정되기 쉽기 때문입니다. 이 섹션은 서비스 소개·사용 3단계·FAQ·칼럼 12편 링크를 담고, 자바스크립트가 켜져 있어도 앱 아래에 그대로 남습니다.
- 콘텐츠 페이지 바닥글에는 칼럼 12편 목록(`.footer-columns`)을 넣어 모든 페이지가 콘텐츠 허브와 연결되게 했습니다. 목록이 실제 글과 어긋나면 빌드가 실패합니다.
- 칼럼 본문 아래에는 `COLUMNS` 순서로 **이전 글·다음 글** 카드를 자동으로 붙입니다(720px 이하에서는 세로로 쌓임). 관련 글 목록과 별도로 두어, 글을 하나 더 쓰면 다른 글의 이동 막대도 다시 빌드할 때 저절로 맞춰집니다.
- 모바일(360px)에서는 표의 `min-width`를 풀고 머리글 줄바꿈을 허용해 페이지 가로 스크롤을 만들지 않습니다(표 자체는 `.table-wrap` 안에서 필요할 때만 넘깁니다). 한국어 본문은 `word-break: keep-all` + `overflow-wrap: break-word`로 어절 단위 줄바꿈을 유지합니다.
- `public/404.html`은 `/blog/*`·`/tools/*` 같은 옛 주소로 들어오면 경로를 읽어 "옮겨진 주소" 안내를 띄우고, 홈·가이드·칼럼 12편·서비스 안내로 이어 줍니다.
- 앱의 날짜 입력은 `input[type=date]`를 그대로 써서 모바일에서 네이티브 달력을 띄웁니다.
- 회고 카드 숨김 설정은 `3year-diary:v1:hide-empty` 키에 저장합니다.
- 12개 시점은 요청대로 36·24·12·6·3·1개월, 21·14·7·3·2·1일 전이며 과거 → 최근 순서로 표시합니다.
