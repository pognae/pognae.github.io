#!/usr/bin/env node
/**
 * Calc365 수익형 블로그 SEO 글 대량 생성
 * _posts-pending/YYYY-MM-DD-slug.md
 */
import fs from "fs";
import path from "path";

const ROOT = process.cwd();
const OUT = path.join(ROOT, "_posts-pending");
const START = "2026-07-05";
const END = "2026-12-31";
const TODAY = "2026-07-05";

const ANGLES = [
  { suffix: "guide", title: "{k} — 완벽 가이드 ({y}년)", desc: "{k} 공식·예시·FAQ를 정리했습니다. Calc365 무료 계산기로 바로 확인하세요." },
  { suffix: "how-to", title: "{k} 계산 방법 ({y}년 최신)", desc: "{k}을(를) 쉽게 구하는 방법과 자주 하는 실수를 정리했습니다." },
  { suffix: "formula", title: "{k} 공식과 예시 ({y})", desc: "{k} 공식, 표, FAQ. Calc365에서 무료로 계산하세요." },
  { suffix: "tips", title: "{k} 꿀팁 — 초보자도 3분 만에", desc: "{k} 실전 팁과 Calc365 계산기 활용법을 안내합니다." },
  { suffix: "faq", title: "{k} 자주 묻는 질문 TOP5", desc: "{k} FAQ와 Calc365 계산기 사용법을 정리했습니다." },
  { suffix: "calculator", title: "{k} 계산기 무료 사용법", desc: "Calc365 {k} 계산기로 빠르게 결과를 확인하는 방법입니다." },
  { suffix: "example", title: "{k} 실전 예시 모음", desc: "{k} 실생활 예시와 계산 결과를 표로 정리했습니다." },
  { suffix: "compare", title: "{k} 비교·체크리스트", desc: "{k} 전후 비교와 Calc365 계산기 연계 방법을 설명합니다." },
  { suffix: "checklist", title: "{k} 체크리스트 ({y}년)", desc: "{k} 전 꼭 확인할 항목과 무료 계산 도구 안내." },
];

const MONTH_TOPICS = {
  7: [
    { k: "여름휴가비 계산", slug: "summer-vacation-budget", cat: "생활", tool: "여행 경비·더치페이", kw: "여름휴가비, 휴가비 계산, 여행 경비" },
    { k: "에어컨 전기요금", slug: "ac-electricity-bill", cat: "생활", tool: "전기요금", kw: "에어컨 전기요금, 여름 전기세, 전기요금 계산" },
    { k: "휴가 D-day", slug: "vacation-dday", cat: "날짜", tool: "D-day", kw: "휴가 D-day, D-day 계산, 디데이" },
    { k: "여행 환율 계산", slug: "travel-exchange-rate", cat: "금융", tool: "환율", kw: "환율 계산, 여행 환전, 달러 환율" },
    { k: "더치페이 계산", slug: "dutch-pay-split", cat: "생활", tool: "더치페이", kw: "더치페이, N빵 계산, 식사 비용 나누기" },
    { k: "여행 유류비", slug: "road-trip-fuel-cost", cat: "생활", tool: "여행 유류비", kw: "유류비 계산, 기름값, 장거리 운전" },
    { k: "연봉 실수령액", slug: "net-salary", cat: "금융", tool: "실수령액", kw: "실수령액, 월급 계산, 4대보험" },
    { k: "할인율 계산", slug: "discount-rate", cat: "금융", tool: "할인", kw: "할인율 계산, 세일, 쿠폰 할인" },
    { k: "BMI 계산", slug: "bmi-calculator", cat: "건강", tool: "BMI", kw: "BMI 계산, 체질량지수, 정상 범위" },
    { k: "물 섭취량", slug: "water-intake", cat: "건강", tool: "물 섭취량", kw: "물 섭취량, 하루 물, 여름 수분" },
    { k: "평수 m2 변환", slug: "pyeong-converter", cat: "생활", tool: "평수 변환", kw: "평수 계산, m2 변환, 아파트 평형" },
    { k: "대출 이자", slug: "loan-interest", cat: "금융", tool: "대출 상환", kw: "대출 이자, 월 상환액, 원리금균등" },
    { k: "부가세 계산", slug: "vat-calculator", cat: "금융", tool: "부가세", kw: "부가세 계산, VAT, 공급가" },
    { k: "만나이 계산", slug: "korean-age", cat: "날짜", tool: "나이", kw: "만나이, 나이 계산, 세는나이" },
    { k: "복리 이자", slug: "compound-interest", cat: "금융", tool: "복리", kw: "복리 계산, 복리 이자, 적금" },
    { k: "퍼센트 계산", slug: "percent-calculator", cat: "금융", tool: "퍼센트", kw: "퍼센트 계산, 비율, 증감률" },
    { k: "D-day 계산", slug: "dday-calculator", cat: "날짜", tool: "D-day", kw: "D-day, 디데이 계산" },
    { k: "근무일 계산", slug: "workday-calculator", cat: "날짜", tool: "근무일", kw: "근무일, 휴가 일수, 주말 제외" },
    { k: "권장 칼로리", slug: "tdee-calorie", cat: "건강", tool: "권장 칼로리", kw: "권장 칼로리, TDEE, 다이어트" },
    { k: "수도요금 계산", slug: "water-bill", cat: "생활", tool: "수도요금", kw: "수도요금, 수도세 계산" },
    { k: "가스요금 계산", slug: "gas-bill", cat: "생활", tool: "가스요금", kw: "가스요금, 가스비 계산" },
    { k: "온도 변환", slug: "temperature-converter", cat: "변환", tool: "온도 변환", kw: "섭씨 화씨, 온도 변환" },
    { k: "길이 단위 변환", slug: "length-converter", cat: "변환", tool: "길이 변환", kw: "cm inch, 길이 변환" },
    { k: "체지방률", slug: "body-fat", cat: "건강", tool: "체지방률", kw: "체지방률, US Navy, 체형" },
    { k: "퇴직금 계산", slug: "severance-pay", cat: "금융", tool: "퇴직금", kw: "퇴직금, 퇴직금 계산" },
  ],
  8: [
    { k: "이사 비용 계산", slug: "moving-cost", cat: "생활", tool: "이사·평수", kw: "이사 비용, 이사 견적, 포장이사" },
    { k: "전세 vs 월세", slug: "jeonse-vs-wolse", cat: "금융", tool: "대출 상환", kw: "전세, 월세, 전월세 전환" },
    { k: "전세자금 대출", slug: "jeonse-loan", cat: "금융", tool: "대출 상환", kw: "전세자금 대출, 전세 대출 이자" },
    { k: "학기 등록금", slug: "tuition-budget", cat: "생활", tool: "평균·퍼센트", kw: "등록금, 학비, 대학 학기" },
    { k: "알바 시급 계산", slug: "part-time-hourly", cat: "금융", tool: "실수령액", kw: "알바 시급, 최저임금, 주휴수당" },
    { k: "기숙사 생활비", slug: "dorm-living-cost", cat: "생활", tool: "평균", kw: "기숙사, 생활비, 한달 비용" },
    { k: "개강 D-day", slug: "semester-dday", cat: "날짜", tool: "D-day", kw: "개강 D-day, 학기 시작" },
    { k: "표준 체중", slug: "standard-weight", cat: "건강", tool: "표준 체중", kw: "표준 체중, 이상 체중, BMI" },
    { k: "허리엉덩이 비율", slug: "whr-ratio", cat: "건강", tool: "허리-엉덩이 비율", kw: "WHR, 허리둘레, 건강" },
    { k: "면적 변환", slug: "area-converter", cat: "변환", tool: "면적 변환", kw: "㎡ 평, 면적 변환" },
    { k: "부피 변환", slug: "volume-converter", cat: "변환", tool: "부피 변환", kw: "리터 ml, 부피 변환" },
    { k: "배당금 수익", slug: "dividend-yield", cat: "금융", tool: "배당금", kw: "배당금, 배당 수익률" },
    { k: "주식 수익률", slug: "stock-return", cat: "금융", tool: "주식 수익률", kw: "주식 수익률, 수익 계산" },
    { k: "단리 이자", slug: "simple-interest", cat: "금융", tool: "이자", kw: "단리, 이자 계산" },
    { k: "날짜 차이", slug: "date-difference", cat: "날짜", tool: "날짜 계산", kw: "날짜 차이, 며칠" },
    { k: "수면 사이클", slug: "sleep-cycle", cat: "건강", tool: "수면 사이클", kw: "수면 사이클, 기상 시간" },
    { k: "요리 단위 변환", slug: "cooking-unit", cat: "생활", tool: "요리 단위", kw: "컵 ml, 요리 단위" },
    { k: "글자 수 세기", slug: "character-count", cat: "기타", tool: "글자 수", kw: "글자수, 맞춤법, 원고" },
  ],
  9: [
    { k: "추석 경비", slug: "chuseok-budget", cat: "생활", tool: "평균·더치페이", kw: "추석 경비, 명절 비용, 귀성" },
    { k: "명절 D-day", slug: "holiday-dday", cat: "날짜", tool: "D-day", kw: "추석 D-day, 명절 남은 날" },
    { k: "귀성 유류비", slug: "holiday-fuel", cat: "생활", tool: "여행 유류비", kw: "귀성 유류비, 고속도로" },
    { k: "경조사비", slug: "gift-money", cat: "생활", tool: "평균", kw: "경조사, 축의금, 조의금" },
    { k: "가족 나이", slug: "family-age", cat: "날짜", tool: "나이", kw: "가족 나이, 만나이" },
    { k: "가을 다이어트 BMI", slug: "autumn-diet-bmi", cat: "건강", tool: "BMI", kw: "다이어트, BMI, 가을" },
    { k: "기초대사량", slug: "bmr-calculator", cat: "건강", tool: "기초대사량", kw: "BMR, 기초대사량" },
    { k: "단리 vs 복리", slug: "simple-vs-compound", cat: "금융", tool: "복리·이자", kw: "단리 복리, 예금" },
    { k: "할인 중복", slug: "stacked-discount", cat: "금융", tool: "할인·퍼센트", kw: "중복 할인, 쿠폰" },
    { k: "무게 변환", slug: "weight-converter", cat: "변환", tool: "무게 변환", kw: "kg lb, 무게 변환" },
    { k: "속도 변환", slug: "speed-converter", cat: "변환", tool: "속도 변환", kw: "km/h mph, 속도" },
    { k: "데이터 용량", slug: "data-converter", cat: "변환", tool: "데이터 변환", kw: "GB MB, 데이터 변환" },
    { k: "근무일 휴가", slug: "vacation-workdays", cat: "날짜", tool: "근무일", kw: "연차, 근무일 계산" },
    { k: "16진수 변환", slug: "hex-decimal", cat: "기타", tool: "16진수 변환", kw: "16진수, 10진수" },
    { k: "QR 코드", slug: "qr-generator", cat: "기타", tool: "QR 코드", kw: "QR 코드, QR 생성" },
  ],
  10: [
    { k: "건강검진 BMI", slug: "health-check-bmi", cat: "건강", tool: "BMI", kw: "건강검진, BMI, 공단" },
    { k: "다이어트 칼로리", slug: "diet-calorie", cat: "건강", tool: "권장 칼로리", kw: "다이어트 칼로리, 감량" },
    { k: "체지방 감량", slug: "fat-loss", cat: "건강", tool: "체지방률", kw: "체지방, 감량 목표" },
    { k: "가을 전기요금", slug: "autumn-electricity", cat: "생활", tool: "전기요금", kw: "전기요금, 냉난방" },
    { k: "월세 관리비", slug: "rent-maintenance", cat: "생활", tool: "평수·평균", kw: "월세, 관리비, 전세" },
    { k: "주차 계산", slug: "week-number", cat: "날짜", tool: "주차", kw: "주차, 몇 주차" },
    { k: "시간 계산", slug: "time-calculator", cat: "날짜", tool: "시간 계산", kw: "시간 계산, 근무시간" },
    { k: "퍼센트 증감", slug: "percent-change", cat: "금융", tool: "퍼센트", kw: "증감률, 퍼센트" },
    { k: "대출 갈아타기", slug: "loan-refinance", cat: "금융", tool: "대출 상환", kw: "대환 대출, 금리" },
    { k: "적금 만기", slug: "savings-maturity", cat: "금융", tool: "복리", kw: "적금, 만기 금액" },
    { k: "평균 점수", slug: "average-score", cat: "생활", tool: "평균", kw: "평균, 성적 계산" },
    { k: "기본 계산기", slug: "basic-calculator", cat: "기타", tool: "기본 계산기", kw: "사칙연산, 계산기" },
  ],
  11: [
    { k: "블랙프라이데이 할인", slug: "black-friday-discount", cat: "금융", tool: "할인", kw: "블랙프라이데이, 할인율" },
    { k: "연말 쇼핑 예산", slug: "year-end-shopping", cat: "생활", tool: "평균·할인", kw: "연말 쇼핑, 예산" },
    { k: "상여금 실수령", slug: "bonus-net-pay", cat: "금융", tool: "실수령액", kw: "상여금, 연말 상여" },
    { k: "연말정산 준비", slug: "year-end-tax-prep", cat: "금융", tool: "실수령액", kw: "연말정산, 세금" },
    { k: "연말 D-day", slug: "year-end-dday", cat: "날짜", tool: "D-day", kw: "연말 D-day, 12월 31일" },
    { k: "물가 상승", slug: "inflation-rate", cat: "금융", tool: "퍼센트", kw: "물가, 인플레" },
    { k: "예산 소진율", slug: "budget-burn", cat: "금융", tool: "퍼센트", kw: "예산, 소진율" },
    { k: "겨울 난방비", slug: "winter-heating", cat: "생활", tool: "가스요금", kw: "난방비, 겨울 가스" },
    { k: "연말 목표 저축", slug: "year-end-savings", cat: "금융", tool: "복리", kw: "저축, 목표 금액" },
    { k: "크리스마스 예산", slug: "christmas-budget", cat: "생활", tool: "더치페이", kw: "크리스마스, 선물 예산" },
    { k: "퇴직금 예상", slug: "severance-estimate", cat: "금융", tool: "퇴직금", kw: "퇴직금, 이직" },
    { k: "CAGR 수익률", slug: "cagr-return", cat: "금융", tool: "주식 수익률", kw: "CAGR, 연평균 수익" },
  ],
  12: [
    { k: "연봉 협상", slug: "salary-negotiation", cat: "금융", tool: "실수령액", kw: "연봉 협상, 연봉 인상" },
    { k: "새해 목표 D-day", slug: "new-year-dday", cat: "날짜", tool: "D-day", kw: "새해 D-day, 2027 목표" },
    { k: "연말정산 환급", slug: "tax-refund", cat: "금융", tool: "실수령액", kw: "연말정산, 환급" },
    { k: "내년 실수령액", slug: "next-year-salary", cat: "금융", tool: "실수령액", kw: "2027 연봉, 월급" },
    { k: "새해 저축 계획", slug: "new-year-savings", cat: "금융", tool: "복리", kw: "저축, 새해 계획" },
    { k: "겨울 BMI", slug: "winter-bmi", cat: "건강", tool: "BMI", kw: "겨울 체중, BMI" },
    { k: "연간 대출 이자", slug: "annual-loan-interest", cat: "금융", tool: "대출 상환", kw: "연간 이자, 대출" },
    { k: "12월 전기요금", slug: "december-electricity", cat: "생활", tool: "전기요금", kw: "12월 전기세" },
    { k: "한 해 경과일", slug: "year-elapsed-days", cat: "날짜", tool: "날짜 계산", kw: "경과일, 365일" },
    { k: "2027 만나이", slug: "age-2027", cat: "날짜", tool: "나이", kw: "2027 나이, 만나이" },
    { k: "부가세 연말", slug: "vat-year-end", cat: "금융", tool: "부가세", kw: "부가세, 사업자" },
    { k: "연간 여행비", slug: "annual-travel-cost", cat: "생활", tool: "여행 유류비", kw: "연간 여행, 여행비" },
  ],
};

function parseDate(s) {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function formatDate(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function postsPerDay(dateStr) {
  if (dateStr === TODAY) return 15;
  let h = 0;
  for (let i = 0; i < dateStr.length; i++) h = (h * 33 + dateStr.charCodeAt(i)) >>> 0;
  return 6 + (h % 4);
}

function pickTopic(dateStr, index) {
  const month = Number(dateStr.slice(5, 7));
  const topics = MONTH_TOPICS[month] || MONTH_TOPICS[7];
  const angle = ANGLES[index % ANGLES.length];
  const topic = topics[(index * 7 + dateStr.charCodeAt(8)) % topics.length];
  return { ...topic, angle };
}

function buildBody(topic, dateStr, y) {
  const { k, tool, kw } = topic;
  return `**${k}**은(는) Calc365(계산365) 블로그에서 많은 독자가 찾는 주제입니다. ${y}년 ${dateStr.slice(5, 7)}월 기준으로 **${kw.split(",")[0].trim()}** 검색량이 꾸준히 높아, 실생활에 바로 쓸 수 있도록 공식·예시·FAQ를 정리했습니다.

## ${k}이(가) 필요한 순간

- 가계·재테크·생활비를 **숫자로 확인**해야 할 때
- 검색으로 공식을 찾다 **시간을 낭비**하고 싶지 않을 때
- **무료·설치 없이** 모바일에서 바로 계산하고 싶을 때

Calc365는 **${tool}** 등 45종 계산기를 한곳에 모은 무료 도구입니다. 입력값은 서버로 전송되지 않습니다.

## ${k} 핵심 포인트

| 항목 | 설명 |
|------|------|
| 검색 키워드 | ${kw} |
| 추천 도구 | Calc365 **${tool}** |
| 카테고리 | ${topic.cat} |
| 발행일 | ${dateStr} |

## Calc365에서 계산하는 방법

1. [Calc365 홈](/) 접속
2. 검색창에 **「${tool.split("·")[0]}」** 입력 또는 카테고리 **${topic.cat}** 선택
3. **${tool}** 계산기 클릭
4. 값 입력 후 **계산하기**

30초 안에 결과를 확인할 수 있습니다.

## ${k} 실전 예시

- **예시 A**: 숫자만 바꿔 여러 시나리오를 비교해 보세요.
- **예시 B**: 가족·동료와 공유할 때 **미리보기·스크린샷**으로 결과를 전달하세요.
- **예시 C**: 월별·연말 계획을 세울 때 **같은 카테고리 계산기**를 함께 활용하세요.

## 함께 보면 좋은 Calc365 계산기

- **${tool}** (본문 주제)
- **퍼센트·할인·D-day·BMI** 등 연관 생활 계산기
- [Calc365 블로그](/blog/)의 다른 ${topic.cat} 글

## 자주 묻는 질문 (FAQ)

### Q. ${k} 계산기는 무료인가요?

네. [Calc365](/)의 **${tool}** 계산기는 **완전 무료**이며 회원가입이 필요 없습니다.

### Q. 모바일에서도 되나요?

네. 브라우저만 있으면 **스마트폰·태블릿**에서 동일하게 사용할 수 있습니다.

### Q. ${k} 결과가 실제와 다를 수 있나요?

Calc365는 **간이 추정·참고용**입니다. 세금·금융·건강 등 중요한 결정은 **공식 자료·전문가**와 함께 확인하세요.

### Q. ${dateStr}에 맞는 최신 정보인가요?

${y}년 기준으로 작성되었으며, 법·요율·정책 변경 시 **공식 발표**를 우선하세요.

---

**${k}**은 [Calc365 ${tool} 계산기](/)에서 지금 바로 확인하세요.`;
}

function buildPost(dateStr, index) {
  const y = dateStr.slice(0, 4);
  const topic = pickTopic(dateStr, index);
  const { k, slug, cat, kw, angle } = topic;
  const fullSlug = `${slug}-${angle.suffix}`;
  const title = angle.title.replace(/{k}/g, k).replace(/{y}/g, y);
  const description = angle.desc.replace(/{k}/g, k).replace(/{y}/g, y);
  const keywords = `${kw}, ${k}, Calc365, 계산365, ${topic.tool}`;

  const fm = `---
layout: post
title: "${title.replace(/"/g, '\\"')}"
category: ${cat}
description: "${description.replace(/"/g, '\\"')}"
keywords: "${keywords.replace(/"/g, '\\"')}"
---

${buildBody(topic, dateStr, y)}
`;

  return { filename: `${dateStr}-${fullSlug}.md`, content: fm };
}

function existingSlugsForDate(dateStr) {
  if (!fs.existsSync(OUT)) return new Set();
  return new Set(
    fs.readdirSync(OUT)
      .filter((f) => f.startsWith(dateStr + "-") && f.endsWith(".md"))
      .map((f) => f.slice(11, -3))
  );
}

function main() {
  fs.mkdirSync(OUT, { recursive: true });
  let created = 0;
  let skipped = 0;
  const summary = [];

  for (let d = parseDate(START); d <= parseDate(END); d.setDate(d.getDate() + 1)) {
    const dateStr = formatDate(d);
    const count = postsPerDay(dateStr);
    const existing = existingSlugsForDate(dateStr);
    let made = 0;
    let idx = 0;

    while (made < count) {
      const post = buildPost(dateStr, idx);
      idx += 1;
      if (existing.has(post.filename.slice(11, -3))) {
        skipped += 1;
        if (idx > count * 3) break;
        continue;
      }
      const filePath = path.join(OUT, post.filename);
      if (fs.existsSync(filePath)) {
        skipped += 1;
        continue;
      }
      fs.writeFileSync(filePath, post.content, "utf8");
      existing.add(post.filename.slice(11, -3));
      created += 1;
      made += 1;
    }
    summary.push(`${dateStr}: ${made}/${count}편`);
  }

  const manifest = `# 블로그 생성 manifest
생성일: ${new Date().toISOString()}
기간: ${START} ~ ${END}
신규 생성: ${created}편
스킵(기존): ${skipped}건

## 일별 요약 (처음 10일 + 마지막 5일)
${summary.slice(0, 10).join("\n")}
...
${summary.slice(-5).join("\n")}

총 ${summary.length}일 스케줄
`;
  fs.writeFileSync(path.join(OUT, "GENERATION_MANIFEST.txt"), manifest, "utf8");

  console.log(`Created ${created} posts, skipped ${skipped}, days ${summary.length}`);
}

main();
