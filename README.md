# 자취노트 (monopoint.app)

월세 계약, 이사, 관리비·공과금, 장보기와 집 수선을 처음 혼자 사는 사람을 위해 정리하는 생활 안내 사이트입니다.

## 콘텐츠 원칙 (AdSense / 품질)

- **자동 양산 발행 금지**: `scripts/auto_post.js`와 관련 GitHub Actions는 비활성입니다.
- **신규 글**: `_posts/`에 손으로 쓴 **기둥 가이드**(본문 2,500자 이상, 표·일정·출처·도구 링크)만 추가합니다.
- **`humanize` front matter를 신규 글에 붙이지 않습니다.**
- `_posts-archive`, `_posts-pending-archive`는 빌드에서 제외하며 **다시 공개하지 않습니다.**
- 주제는 **자취**로 고정합니다. 재테크·축구 등으로 피벗하지 않습니다.

## 로컬 미리보기

```bash
bundle install
bundle exec jekyll serve
```

## AdSense 재신청 체크리스트

콘텐츠·사이트 쪽 준비는 아래가 반영된 상태입니다. **배포 후 2~4주** 실제 방문·체류가 쌓인 뒤에만 재신청하세요.

1. [ ] `main`에 배포되어 기둥 가이드 8편 이상이 https://monopoint.app 에서 열림
2. [ ] 구 URL(짧은 글)이 기둥 글로 리다이렉트되는지 샘플 확인 (`jekyll-redirect-from` 빌드 필요: `bundle install`)
3. [ ] 홈「추천 가이드」·`/about.html`·`/tools/` 상호 링크 확인
4. [ ] Search Console에 최신 `sitemap.xml` 제출
5. [ ] 2~4주간 자동 발행 없이 운영(지인·커뮤니티 공유로 실제 유입)
6. [ ] AdSense → 「문제를 수정했음을 확인합니다」 체크 → 「검토 요청」
