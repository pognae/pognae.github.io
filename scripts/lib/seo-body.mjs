#!/usr/bin/env node
/**
 * MonPoint SEO 본문 생성기 — 2000자 이상, 키워드 최적화
 */
const MIN_CHARS = 2000;

function kwList(kw) {
  return kw.split(",").map((s) => s.trim()).filter(Boolean);
}

function pickExtras(keywords, n = 4) {
  return keywords.slice(0, n);
}

/**
 * @param {object} p
 * @param {string} p.keyword - 주제 (H1 맥락)
 * @param {string} p.keywords - 쉼표 구분 키워드
 * @param {string} p.category - 금융|생활|건강
 * @param {string} p.year
 * @param {string} p.dateStr - YYYY-MM-DD
 * @param {string} [p.angle] - guide|how-to|tips|faq 등
 */
export function buildSeoBody({ keyword, keywords, category, year, dateStr, angle = "guide" }) {
  const kws = kwList(keywords);
  const main = kws[0] || keyword;
  const sub = pickExtras(kws.length > 1 ? kws.slice(1) : [keyword, `${keyword} 방법`, `${keyword} 정리`, `${year} ${keyword}`]);
  const month = dateStr.slice(5, 7);

  const intro = `${keyword}은(는) ${year}년에도 검색량이 꾸준한 **${category}** 실용 주제입니다. MonPoint(몬포인트)는 **${main}**, **${sub[0]}**, **${sub[1]}** 키워드를 중심으로 생활·금융·건강 정보를 쉽게 정리합니다. 이 글은 ${dateStr} 기준으로 ${keyword}을(를) 처음 접하는 분도 바로 활용할 수 있도록 핵심 개념, 체크리스트, 실수 사례, FAQ까지 한 번에 담았습니다.`;

  const why = `## ${keyword}이(가) 중요한 이유

많은 사람이 **${main}**을(를) 검색하지만, 산발된 정보 때문에 시간을 낭비합니다. **${sub[0]}**과(와) **${sub[1]}**을(를) 함께 이해하면 의사결정이 빨라지고 불필요한 비용·실수를 줄일 수 있습니다. 특히 ${year}년 ${month}월 전후로 제도·시장 환경이 바뀌는 경우가 많아 **${sub[2]}** 관련 최신 기준을 확인하는 것이 좋습니다.

${category} 분야에서 ${keyword}은(는) 일상과 직결됩니다. 가족·직장·재테크 상황에 따라 우선순위가 달라지므로, 아래 체크리스트를 본인 상황에 맞게 적용해 보세요.`;

  const concept = `## ${keyword} 핵심 개념 정리

**${main}**을(를) 이해할 때 가장 먼저 볼 항목은 다음과 같습니다.

| 구분 | 확인 내용 |
|------|-----------|
| 기본 정의 | ${keyword}의 의미와 적용 범위 |
| 대상 | 누구에게 해당되는지 (직장인·자영업·가구 등) |
| 시기 | ${year}년 기준 신청·실행·준비 시점 |
| 비용·혜택 | 절감·수령·리스크 규모 |
| 관련 키워드 | ${sub.join(", ")} |

개념을 잡은 뒤 **${sub[0]}** 절차나 **${sub[1]}** 조건을 순서대로 점검하면 전체 그림이 선명해집니다.`;

  const steps = `## ${keyword} 단계별 가이드 (${year}년)

### 1단계: 정보 수집
**${main}** 공식 안내와 신뢰할 수 있는 출처를 먼저 확인합니다. ${keyword} 관련 **${sub[2]}** 자료를 메모해 두면 이후 비교가 수월합니다.

### 2단계: 본인 상황 점검
소득·가구·지역·기존 가입 여부 등 개인 변수를 정리합니다. **${sub[1]}** 조건에 해당하는지 체크리스트로 표시하세요.

### 3단계: 실행·신청
필요 서류를 준비하고 기한 내 제출합니다. **${sub[0]}** 온라인·오프라인 경로를 비교해 가장 편한 방법을 선택합니다.

### 4단계: 사후 관리
결과를 기록하고, 변경 사항(이사·소득 변동 등)이 생기면 **${keyword}** 관련 설정을 다시 점검합니다.`;

  const tips = `## ${keyword} 꿀팁 — 검색 사용자가 자주 놓치는 부분

- **${main}** 키워드로 검색할 때는 ${year}년 최신 글인지 날짜를 확인하세요.
- **${sub[0]}**과(와) **${sub[1]}**을(를) 동시에 비교하면 선택지가 넓어집니다.
- 주말·월초·연말에는 접속·방문이 몰릴 수 있어 **평일 오전**을 활용하세요.
- 스마트폰으로 증빙 사진을 찍어 두면 나중에 **${keyword}** 재확인이 빠릅니다.
- 가족·배우자와 정보를 공유해 **이중 확인**하면 누락이 줄어듭니다.`;

  const mistakes = `## ${keyword} 흔한 실수와 예방법

| 실수 | 결과 | 예방 |
|------|------|------|
| 기한 놓침 | 혜택·환급 상실 | 캘린더 알림·D-7 체크 |
| 서류 누락 | 처리 지연 | 제출 전 체크리스트 재확인 |
| 구버전 정보 참고 | 잘못된 판단 | ${year}년 **${main}** 공식 자료 우선 |
| 과도한 일괄 적용 | 불필요한 비용 | 본인 상황에 맞게 조정 |

**${sub[2]}** 관련해서도 비슷한 실수가 반복됩니다. “남들이 한다고 나도”보다 **내 조건에 맞는지**를 먼저 질문하세요.`;

  const trend = `## ${year}년 ${keyword} 최신 동향

${year}년 ${month}월 기준으로 **${main}**에 대한 관심은 모바일 검색 비중이 높습니다. **${sub[0]}**, **${sub[1]}** 연관 검색어도 함께 오르는 경향이 있어, 한 주제만 보지 말고 연관 정보를 묶어서 보는 것이 좋습니다.

정책·금리·요율·생활비 지수 등 거시 변수는 **${category}** 전반에 영향을 줍니다. MonPoint는 이런 변화를 반영해 **${keyword}** 글을 주기적으로 업데이트합니다.`;

  const faq = `## ${keyword} 자주 묻는 질문 (FAQ)

### Q1. ${main}과(와) ${sub[0]}은(는) 무엇이 다른가요?
**${main}**은(는) 보통 핵심 제도·개념을 가리키고, **${sub[0]}**은(는) 실무·절차 측면에서 더 많이 검색됩니다. 둘 다 이해하면 ${keyword} 전체 흐름이 잡힙니다.

### Q2. ${keyword} 정보는 어디서 확인하나요?
공식 기관·법령·고객센터 안내를 우선하세요. MonPoint 글은 **${sub[1]}**, **${sub[2]}** 등을 쉽게 풀어 쓴 참고 자료입니다.

### Q3. ${year}년에도 내용이 동일한가요?
제도·요율·상품은 바뀔 수 있습니다. **${dateStr}** 기준으로 작성되었으니, 중요한 결정 전 최신 공지를 다시 확인하세요.

### Q4. 초보자도 따라 할 수 있나요?
네. 이 글은 **${keyword}** 입문자를 위해 단계별로 구성했습니다. **${main}** 키워드 중심으로 읽으면 됩니다.

### Q5. MonPoint 글을 인용해도 되나요?
개인 학습·가정 내 공유는 자유롭습니다. 상업적 재배포는 문의해 주세요.`;

  const summary = `## 마무리 — ${keyword} 정리

**${keyword}**은(는) **${main}**, **${sub[0]}**, **${sub[1]}**, **${sub[2]}** 키워드와 함께 검색되는 대표적인 ${category} 주제입니다. 오늘 정리한 체크리스트와 FAQ를 북마크해 두고, 필요할 때마다 MonPoint(monpoint.app)에서 최신 글을 확인하세요.

세금·법률·의료·투자 등 중요한 사안은 본 글만으로 결정하지 말고, **공식 안내와 전문가 상담**을 병행하는 것이 안전합니다.`;

  const parts = [intro, why, concept, steps, tips, mistakes, trend, faq, summary];
  let body = parts.join("\n\n");

  // 키워드 밀도 보강 (2000자 미만일 때)
  if (body.replace(/\s/g, "").length < MIN_CHARS) {
    body += `\n\n## ${keyword} 추가 참고 — ${year}년 ${main} 심화

**${keyword}**을(를) 더 깊게 이해하려면 **${sub[0]}** 사례를 주변에 적용해 보세요. 같은 **${main}** 조건이라도 가구·소득·지역에 따라 답이 달라질 수 있습니다. **${sub[1]}** 관련 질문은 커뮤니티보다 공식 FAQ를 우선 확인하는 것이 정확합니다.

장기적으로 **${sub[2]}** 키워드도 함께 챙기면 ${category} 전반의 리터러시가 올라갑니다. MonPoint는 **${keyword}**, **${main}**, **${sub[0]}** 주제의 새 글을 **매일 자동 발행**하니, 홈에서 최신 목록을 확인해 보세요.`;
  }

  return body;
}

export function countBodyChars(body) {
  return body.replace(/\s/g, "").length;
}

export function assertMinLength(body, min = MIN_CHARS) {
  const n = countBodyChars(body);
  if (n < min) {
    throw new Error(`Body too short: ${n} < ${min}`);
  }
  return n;
}
