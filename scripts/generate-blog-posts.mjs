#!/usr/bin/env node
/**
 * MonPoint 수익형 블로그 SEO 글 대량 생성
 * _posts-pending/YYYY-MM-DD-slug.md (본문 2000자+, 키워드 최적화)
 */
import fs from "fs";
import path from "path";
import { buildSeoBody, countBodyChars } from "./lib/seo-body.mjs";

const ROOT = process.cwd();
const OUT = path.join(ROOT, "_posts-pending");
const START = "2026-07-10";
const END = "2026-12-31";

const ANGLES = [
  { suffix: "guide", title: "{k} 완벽 가이드 ({y}년 최신)", desc: "{k} 핵심 정리, 체크리스트, FAQ를 MonPoint에서 쉽게 확인하세요." },
  { suffix: "how-to", title: "{k} 하는 방법 — 초보자도 이해하기 쉽게", desc: "{k} 절차와 주의사항, 자주 하는 실수를 단계별로 설명합니다." },
  { suffix: "tips", title: "{k} 꿀팁 7가지 ({y})", desc: "{k} 실전 팁과 생활에 바로 쓰는 정보를 정리했습니다." },
  { suffix: "faq", title: "{k} 자주 묻는 질문 TOP5", desc: "{k} FAQ와 2026년 기준 최신 정보를 담았습니다." },
  { suffix: "checklist", title: "{k} 체크리스트 ({y}년)", desc: "{k} 전 꼭 확인할 항목과 준비 서류를 정리했습니다." },
  { suffix: "summary", title: "{k} 총정리 — 한눈에 보기", desc: "{k} 개념, 비교 포인트, 실무 팁을 표로 정리했습니다." },
  { suffix: "compare", title: "{k} 비교 가이드", desc: "{k} 선택 시 비교해야 할 조건과 장단점을 설명합니다." },
  { suffix: "basics", title: "{k} 기초 개념", desc: "{k} 입문자를 위한 기본 용어와 흐름을 안내합니다." },
  { suffix: "latest", title: "{k} 최신 동향 ({y})", desc: "{k} 관련 2026년 정책·트렌드와 대응 방법을 소개합니다." },
];

const MONTH_TOPICS = {
  7: [
    { k: "여름휴가비 절약", slug: "summer-vacation-budget", cat: "생활", kw: "여름휴가비, 휴가비 절약, 여행 경비" },
    { k: "폭염 건강관리", slug: "heat-wave-health", cat: "건강", kw: "폭염, 여름 건강, 온열질환" },
    { k: "에어컨 전기세", slug: "ac-electricity-bill", cat: "생활", kw: "에어컨 전기요금, 여름 전기세" },
    { k: "휴가철 교통비", slug: "holiday-transport-cost", cat: "생활", kw: "휴가 교통비, KTX 예매, 귀성" },
    { k: "여름 다이어트", slug: "summer-diet-plan", cat: "건강", kw: "여름 다이어트, 체중 감량" },
    { k: "장마철 습기 제거", slug: "rainy-season-dehumid", cat: "생활", kw: "장마, 습기, 제습" },
    { k: "자동차 여름 점검", slug: "summer-car-check", cat: "생활", kw: "여름 차량 점검, 타이어 공기압" },
    { k: "청년도약계좌", slug: "youth-leap-account", cat: "금융", kw: "청년도약계좌, 청년 적금" },
    { k: "여름철 피부 관리", slug: "summer-skin-care", cat: "건강", kw: "여름 피부, 자외선, 선크림" },
    { k: "물놀이 안전", slug: "water-safety-summer", cat: "건강", kw: "물놀이 안전, 익수 사고" },
    { k: "원룸 여름 냉방", slug: "studio-cooling-tips", cat: "생활", kw: "원룸 냉방, 단열" },
    { k: "휴가 대출 금리", slug: "vacation-loan-rate", cat: "금융", kw: "신용대출, 대출 금리" },
    { k: "반려동물 여름 관리", slug: "pet-summer-care", cat: "생활", kw: "반려동물 여름, 강아지 더위" },
    { k: "보양식 추천", slug: "summer-health-food", cat: "건강", kw: "보양식, 여름 음식" },
    { k: "휴대폰 요금제", slug: "mobile-plan-compare", cat: "생활", kw: "휴대폰 요금제, 알뜰폰" },
  ],
  8: [
    { k: "이사 비용", slug: "moving-cost-guide", cat: "생활", kw: "이사 비용, 포장이사" },
    { k: "전세 갱신", slug: "jeonse-renewal", cat: "금융", kw: "전세 갱신, 전세 계약" },
    { k: "개강 준비", slug: "semester-prep", cat: "생활", kw: "개강, 대학 준비" },
    { k: "알바 세금", slug: "part-time-tax", cat: "금융", kw: "알바 세금, 3.3% 원천징수" },
    { k: "기숙사 생활", slug: "dorm-life-tips", cat: "생활", kw: "기숙사, 대학 생활" },
    { k: "장학금 신청", slug: "scholarship-application", cat: "생활", kw: "장학금, 국가장학금" },
    { k: "가을 건강검진", slug: "autumn-health-check", cat: "건강", kw: "건강검진, 검진 예약" },
    { k: "주식 입문", slug: "stock-investing-basics", cat: "금융", kw: "주식 입문, 주식 투자" },
    { k: "적금 금리", slug: "savings-rate-compare", cat: "금융", kw: "적금 금리, 예금" },
    { k: "자취방 절약", slug: "solo-living-save", cat: "생활", kw: "자취 절약, 원룸 생활비" },
    { k: "수면 부족", slug: "sleep-deprivation", cat: "건강", kw: "수면 부족, 불면" },
    { k: "비타민 선택", slug: "vitamin-guide", cat: "건강", kw: "비타민, 영양제" },
    { k: "대학 등록금", slug: "tuition-payment", cat: "생활", kw: "등록금, 학자금 대출" },
    { k: "교통카드 혜택", slug: "transit-card-benefit", cat: "생활", kw: "교통카드, 후불교통" },
  ],
  9: [
    { k: "추석 경비", slug: "chuseok-budget", cat: "생활", kw: "추석 경비, 명절 비용" },
    { k: "귀성 교통", slug: "chuseok-traffic", cat: "생활", kw: "추석 귀성, 고속도로" },
    { k: "명절 선물", slug: "holiday-gift-guide", cat: "생활", kw: "명절 선물, 추석 선물" },
    { k: "경조사 매너", slug: "gift-money-etiquette", cat: "생활", kw: "경조사, 축의금, 조의금" },
    { k: "가을 운동", slug: "autumn-exercise", cat: "건강", kw: "가을 운동, 걷기" },
    { k: "환절기 감기", slug: "season-change-cold", cat: "건강", kw: "환절기, 감기 예방" },
    { k: "다이어트 식단", slug: "autumn-diet-meal", cat: "건강", kw: "다이어트 식단, 체중" },
    { k: "연휴 해외여행", slug: "holiday-travel-tips", cat: "생활", kw: "해외여행, 환전" },
    { k: "가계부 작성", slug: "household-ledger", cat: "금융", kw: "가계부, 가계 관리" },
    { k: "신용점수 올리기", slug: "credit-score-up", cat: "금융", kw: "신용점수, 신용관리" },
    { k: "보험 갱신", slug: "insurance-renewal", cat: "금융", kw: "보험 갱신, 보험 비교" },
    { k: "부업 소득신고", slug: "side-income-tax", cat: "금융", kw: "부업, 종소세" },
    { k: "어린이 독감", slug: "child-flu-vaccine", cat: "건강", kw: "독감 예방접종, 어린이" },
    { k: "장보기 절약", slug: "grocery-shopping-save", cat: "생활", kw: "장보기, 마트 할인" },
  ],
  10: [
    { k: "건강검진 결과", slug: "health-check-result", cat: "건강", kw: "건강검진 결과, 검진 해석" },
    { k: "금연 방법", slug: "quit-smoking-tips", cat: "건강", kw: "금연, 금연 방법" },
    { k: "대출 상환 전략", slug: "loan-repayment-plan", cat: "금융", kw: "대출 상환, 원리금" },
    { k: "연말 쇼핑", slug: "year-end-shopping", cat: "생활", kw: "연말 쇼핑, 할인" },
    { k: "난방비 절약", slug: "heating-cost-save", cat: "생활", kw: "난방비, 겨울 난방" },
    { k: "부동산 전망", slug: "housing-market-outlook", cat: "금융", kw: "부동산, 집값" },
    { k: "노후 자금", slug: "retirement-fund-plan", cat: "금융", kw: "노후 자금, 은퇴 준비" },
    { k: "스트레스 관리", slug: "stress-management", cat: "건강", kw: "스트레스, 멘탈 헬스" },
    { k: "직장인 점심", slug: "office-lunch-healthy", cat: "건강", kw: "직장인 점심, 건강 식단" },
    { k: "전기차 보조금", slug: "ev-subsidy-guide", cat: "생활", kw: "전기차 보조금, EV" },
    { k: "주택연금", slug: "housing-pension", cat: "금융", kw: "주택연금, 역모기지" },
    { k: "미세먼지 대응", slug: "fine-dust-health", cat: "건강", kw: "미세먼지, 공기질" },
  ],
  11: [
    { k: "연말정산 준비", slug: "year-end-tax-prep", cat: "금융", kw: "연말정산, 소득공제" },
    { k: "블랙프라이데이", slug: "black-friday-tips", cat: "생활", kw: "블랙프라이데이, 할인" },
    { k: "상여금 관리", slug: "bonus-money-plan", cat: "금융", kw: "상여금, 보너스" },
    { k: "겨울 피부 건조", slug: "winter-skin-dry", cat: "건강", kw: "겨울 피부, 보습" },
    { k: "연말 파티", slug: "year-end-party-budget", cat: "생활", kw: "연말 모임, 회식" },
    { k: "크리스마스 선물", slug: "christmas-gift-ideas", cat: "생활", kw: "크리스마스 선물" },
    { k: "재테크 입문", slug: "investing-for-beginners", cat: "금융", kw: "재테크, 투자 입문" },
    { k: "연금저축", slug: "pension-savings-account", cat: "금융", kw: "연금저축, IRP" },
    { k: "감기 예방", slug: "winter-cold-prevent", cat: "건강", kw: "감기 예방, 면역력" },
    { k: "연말 여행", slug: "year-end-travel", cat: "생활", kw: "연말 여행, 국내 여행" },
    { k: "보일러 점검", slug: "boiler-winter-check", cat: "생활", kw: "보일러, 겨울 점검" },
    { k: "이직 준비", slug: "job-change-prep", cat: "금융", kw: "이직, 퇴사 준비" },
  ],
  12: [
    { k: "연말정산 신고", slug: "year-end-tax-filing", cat: "금융", kw: "연말정산 신고, 환급" },
    { k: "새해 목표", slug: "new-year-goals", cat: "생활", kw: "새해 목표, 계획" },
    { k: "연봉 협상", slug: "salary-negotiation-tips", cat: "금융", kw: "연봉 협상, 연봉 인상" },
    { k: "겨울 운동", slug: "winter-workout", cat: "건강", kw: "겨울 운동, 홈트" },
    { k: "세금 환급", slug: "tax-refund-guide", cat: "금융", kw: "세금 환급, 종소세" },
    { k: "새해 저축", slug: "new-year-saving-plan", cat: "금융", kw: "저축, 새해 재테크" },
    { k: "연휴 귀경", slug: "new-year-traffic", cat: "생활", kw: "설 귀경, 연휴 교통" },
    { k: "명절 음식", slug: "holiday-food-health", cat: "건강", kw: "명절 음식, 소화" },
    { k: "방학 계획", slug: "winter-vacation-plan", cat: "생활", kw: "겨울 방학, 자녀 계획" },
    { k: "부동산 세금", slug: "property-tax-year-end", cat: "금융", kw: "재산세, 종부세" },
    { k: "건강 습관", slug: "healthy-habits-new-year", cat: "건강", kw: "건강 습관, 루틴" },
    { k: "가계 결산", slug: "household-year-review", cat: "금융", kw: "가계 결산, 지출 분석" },
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
  const { k, kw, cat, angle } = topic;
  return buildSeoBody({
    keyword: k,
    keywords: `${kw}, ${k}, MonPoint, 몬포인트`,
    category: cat,
    year: y,
    dateStr,
    angle: angle.suffix,
  });
}

function buildPost(dateStr, index) {
  const y = dateStr.slice(0, 4);
  const topic = pickTopic(dateStr, index);
  const { k, slug, cat, kw, angle } = topic;
  const fullSlug = `${slug}-${angle.suffix}`;
  const title = angle.title.replace(/{k}/g, k).replace(/{y}/g, y);
  const description = angle.desc.replace(/{k}/g, k).replace(/{y}/g, y);
  const keywords = `${kw}, ${k}, MonPoint, 몬포인트, ${cat}`;

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
      const bodyLen = countBodyChars(post.content.split("---").slice(2).join("---"));
      if (bodyLen < 2000) console.warn(`Short pending: ${post.filename} (${bodyLen})`);
      existing.add(post.filename.slice(11, -3));
      created += 1;
      made += 1;
    }
    summary.push(`${dateStr}: ${made}/${count}편`);
  }

  const manifest = `# MonPoint 블로그 생성 manifest
생성일: ${new Date().toISOString()}
기간: ${START} ~ ${END}
신규 생성: ${created}편
스킵(기존): ${skipped}건
사이트: https://monpoint.app
`;
  fs.writeFileSync(path.join(OUT, "GENERATION_MANIFEST.txt"), manifest, "utf8");
  console.log(`Created ${created} posts, skipped ${skipped}, days ${summary.length}`);
}

main();
