# Calc365

Calc365(계산365)는 공유 ChatGPT 대화에서 확정된 생활 계산기 허브 이름을 기준으로 구현한 정적 웹앱입니다. 서버 없이 순수 HTML/CSS/JavaScript로 동작하며 GitHub Pages에 그대로 배포할 수 있습니다.

**슬로건:** 생활에 필요한 모든 계산을 한곳에서

## 주요 기능

- 30종 생활 계산기 (아래 목록)
- 카테고리 탭 · 검색 · 즐겨찾기 · 최근 사용 (localStorage 저장)
- 라이트/다크 모드 토글 (localStorage 저장)
- PWA 지원 (홈 화면 추가, 오프라인 캐시)
- SEO: `robots.txt`, `sitemap.xml`, Open Graph 메타 태그
- 애드센스 준비: `ads.txt`, 광고 슬롯 마크업
- 정책 페이지: 소개 / 개인정보처리방침 / 문의

## 포함된 계산기 (30종)

### 금융
- 퍼센트 · 할인 · 부가세 · 이자(단리) · 복리 · 대출 상환 · 연봉 실수령액 · 퇴직금

### 날짜·시간
- 날짜 차이 · D-day · 나이 · 시간 · 근무일 · 주차

### 건강
- BMI · BMR · 권장 칼로리(TDEE) · 물 섭취량 · 체지방률(US Navy)

### 생활
- 평균 · 평수↔㎡ · 전기·수도·가스 요금 추정

### 단위 변환
- 길이 · 무게 · 온도 · 데이터 · 속도

### 기타
- 기본 계산기 · QR 코드 생성

> 금융/건강/요금 계산기는 간이 추정치이며, 실제 금액·수치와 차이가 있을 수 있습니다.

## 실행

브라우저에서 `index.html`을 열면 바로 사용할 수 있습니다.

## GitHub Pages 배포

1. 저장소 Settings → Pages → Source: `main` 브랜치, `/ (root)` 선택
2. 배포 URL: `https://pognae.github.io/calc365/`
3. AdSense 승인 후 `ads.txt`의 `pub-XXXXXXXXXXXXXXXX`를 실제 게시자 ID로 교체

## 파일 구조

```
calc365/
├── index.html          # 메인 앱
├── app.js              # 계산기 로직
├── styles.css          # 공통 스타일
├── page.js             # 정적 페이지 공통 스크립트
├── about.html          # 소개
├── privacy.html        # 개인정보처리방침
├── contact.html        # 문의
├── manifest.webmanifest
├── service-worker.js
├── robots.txt
├── sitemap.xml
├── ads.txt
└── icons/icon.svg
```
