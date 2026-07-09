#!/usr/bin/env node
/**
 * MonPoint AdSense 시드 글 26편 → _posts/ (본문 2000자+ SEO)
 */
import fs from "fs";
import path from "path";
import { buildSeoBody, countBodyChars } from "./lib/seo-body.mjs";

const POSTS = path.join(process.cwd(), "_posts");
const MIN = 2000;

const ARTICLES = [
  { date: "2026-06-14", slug: "year-end-tax-preview-guide", cat: "금융", title: "2026 연말정산 미리보기 — 지금 확인해야 할 항목", desc: "2026년 연말정산을 앞두고 미리 점검할 소득공제·지출 항목과 준비 서류를 정리했습니다.", kw: "연말정산, 연말정산 미리보기, 소득공제, 2026 연말정산", k: "연말정산 미리보기" },
  { date: "2026-06-15", slug: "unemployment-benefit-application", cat: "금융", title: "실업급여 신청 조건과 절차 — 2026년 최신 정리", desc: "실업급여 수급 자격, 이직 사유, 고용센터 신청 절차를 단계별로 설명합니다.", kw: "실업급여, 실업급여 신청, 실업급여 조건, 고용센터", k: "실업급여 신청" },
  { date: "2026-06-16", slug: "summer-electricity-saving-tips", cat: "생활", title: "여름철 전기요금 줄이는 방법 7가지", desc: "에어컨·냉장고 사용 습관과 요금제 선택으로 여름 전기세를 절약하는 실전 팁입니다.", kw: "전기요금, 여름 전기세, 에어컨 전기요금, 전기세 절약", k: "전기요금 절약" },
  { date: "2026-06-17", slug: "diet-meal-plan-basics", cat: "건강", title: "다이어트 식단 구성 원칙 — 무리 없이 지속하는 법", desc: "칼로리·영양 균형을 고려한 다이어트 식단 설계와 흔한 실패 원인을 정리했습니다.", kw: "다이어트 식단, 다이어트, 식단 추천, 체중 감량", k: "다이어트 식단" },
  { date: "2026-06-18", slug: "jeonse-loan-rate-comparison", cat: "금융", title: "전세자금대출 금리 비교 — 2026년 선택 가이드", desc: "전세대출 상품 유형, 금리·LTV·상환 방식 차이를 비교해 선택 기준을 제시합니다.", kw: "전세자금대출, 전세대출 금리, 전세대출 비교, 주택담보대출", k: "전세자금대출" },
  { date: "2026-06-19", slug: "health-checkup-items-guide", cat: "건강", title: "건강검진 항목별 의미 — 결과 해석 가이드", desc: "국가건강검진·종합검진 항목의 의미와 수치 해석, 재검사 기준을 안내합니다.", kw: "건강검진, 건강검진 항목, 국가건강검진, 검진 결과", k: "건강검진 항목" },
  { date: "2026-06-20", slug: "national-pension-estimate", cat: "금융", title: "국민연금 예상 수령액 — 내 연금 미리 알아보기", desc: "국민연금 수령액에 영향을 주는 요인과 예상액 조회 방법을 설명합니다.", kw: "국민연금, 국민연금 수령액, 연금 예상액, 노후 연금", k: "국민연금 수령액" },
  { date: "2026-06-21", slug: "car-insurance-save-money", cat: "생활", title: "자동차 보험료 절약 팁 — 비교견적 전 체크리스트", desc: "자동차보험료 결정 요인과 할인 특약, 갱신 시 비교 포인트를 정리했습니다.", kw: "자동차 보험료, 자동차보험 비교, 보험료 절약, 다이렉트 보험", k: "자동차 보험료" },
  { date: "2026-06-22", slug: "minimum-wage-2026-summary", cat: "금융", title: "2026년 최저임금 적용 정리 — 사업주·근로자 FAQ", desc: "2026년 최저임금 시급, 주휴수당, 적용 예외와 실무 계산 방법을 안내합니다.", kw: "최저임금, 2026 최저임금, 최저임금 시급, 주휴수당", k: "2026년 최저임금" },
  { date: "2026-06-23", slug: "housing-subscription-points", cat: "생활", title: "주택청약 가점 올리는 방법 — 청년·신혼 우선", desc: "청약 가점 항목, 청년·신혼부부 특별공급, 통장 가입 전략을 정리했습니다.", kw: "주택청약, 청약 가점, 청약통장, 청년 주택", k: "주택청약 가점" },
  { date: "2026-06-24", slug: "early-pregnancy-symptoms", cat: "건강", title: "임신 초기 증상과 대응 — 언제 병원을 가야 할까", desc: "임신 초기 흔한 신체 변화, 주의 증상, 산전 검진 시기를 안내합니다.", kw: "임신 초기 증상, 임신 테스트, 임신 초기, 임신 신호", k: "임신 초기 증상" },
  { date: "2026-06-25", slug: "blood-sugar-normal-range", cat: "건강", title: "혈당 정상 수치와 관리법 — 공복·식후 기준", desc: "공복혈당·식후혈당 정상 범위, 당뇨 전단계 관리 습관을 설명합니다.", kw: "혈당 정상 수치, 공복혈당, 당뇨, 혈당 관리", k: "혈당 정상 수치" },
  { date: "2026-06-26", slug: "high-blood-pressure-symptoms", cat: "건강", title: "고혈압 초기 증상 — 침묵의 살인자 알아보기", desc: "고혈압 초기 신호, 가정 혈압 측정법, 생활습관 개선 포인트를 정리했습니다.", kw: "고혈압 증상, 고혈압, 혈압 정상, 고혈압 초기", k: "고혈압 증상" },
  { date: "2026-06-27", slug: "net-salary-breakdown", cat: "금융", title: "월급 실수령액 알아보기 — 공제 항목 총정리", desc: "4대보험·소득세·지방소득세 공제와 연봉 대비 실수령 비율을 설명합니다.", kw: "실수령액, 월급 실수령액, 4대보험, 연봉 공제", k: "월급 실수령액" },
  { date: "2026-06-28", slug: "credit-card-cash-advance-interest", cat: "금융", title: "신용카드 현금서비스 이자 — 피해야 하는 이유", desc: "현금서비스·카드론 금리, 상환 구조, 대안 자금 마련 방법을 안내합니다.", kw: "현금서비스, 카드론, 신용카드 이자, 현금서비스 이자", k: "신용카드 현금서비스" },
  { date: "2026-06-29", slug: "severance-interim-payment", cat: "금융", title: "퇴직금 중간정산 조건 — 받을 수 있을까", desc: "퇴직금 중간정산 요건, 세금, 재직 중 수령 시 유의사항을 정리했습니다.", kw: "퇴직금 중간정산, 퇴직금, 퇴직연금, 중간정산 조건", k: "퇴직금 중간정산" },
  { date: "2026-06-30", slug: "capital-gains-tax-basics", cat: "금융", title: "양도소득세 기본 개념 — 부동산·주식 한눈에", desc: "양도소득세 과세 대상, 장기보유특별공제, 신고 시기를 입문자 관점에서 설명합니다.", kw: "양도소득세, 부동산 양도소득세, 양도세, 취득세", k: "양도소득세" },
  { date: "2026-07-01", slug: "comprehensive-income-tax-filing", cat: "금융", title: "종합소득세 신고 준비 — 프리랜서·부업 해당자", desc: "종합소득세 신고 대상, 경비 처리, 홈택스 신고 일정을 안내합니다.", kw: "종합소득세, 종소세 신고, 프리랜서 세금, 부업 신고", k: "종합소득세 신고" },
  { date: "2026-07-02", slug: "pet-insurance-guide", cat: "생활", title: "반려동물 보험 가입 가이드 — 비교 포인트", desc: "반려동물 보험 보장 범위, 면책·공제, 강아지·고양이 가입 시 체크리스트입니다.", kw: "반려동물 보험, 펫보험, 반려견 보험, 고양이 보험", k: "반려동물 보험" },
  { date: "2026-07-03", slug: "summer-dehydration-prevention", cat: "건강", title: "여름철 탈수 예방법 — 물 섭취와 전해질", desc: "더위 속 탈수 신호, 수분·전해질 보충, 취약 계층 주의사항을 정리했습니다.", kw: "탈수, 여름 탈수, 물 섭취량, 더위 건강", k: "여름철 탈수 예방" },
  { date: "2026-07-04", slug: "moving-checklist-korea", cat: "생활", title: "이사 준비 체크리스트 — 4주 전부터 할 일", desc: "포장·청소·주소 변경·공과금 정산까지 이사 일정별 체크리스트입니다.", kw: "이사 체크리스트, 이사 준비, 이사 비용, 포장이사", k: "이사 준비" },
  { date: "2026-07-05", slug: "mortgage-rate-increase-response", cat: "금융", title: "주택담보대출 금리 인상 대응 — 갈아타기 vs 상환", desc: "변동금리 부담 시 대환대출, 중도상환, 상환 방식 변경 전략을 비교합니다.", kw: "주택담보대출, 대출 금리, 갈아타기, 변동금리", k: "주택담보대출 금리" },
  { date: "2026-07-06", slug: "property-acquisition-tax-overview", cat: "금융", title: "부동산 취득세 개요 — 주택·토지 취득 시", desc: "취득세율, 다주택·조정지역 중과, 신고 기한과 감면 제도를 설명합니다.", kw: "취득세, 부동산 취득세, 주택 취득세, 취득세 계산", k: "부동산 취득세" },
  { date: "2026-07-07", slug: "health-insurance-premium-calculation", cat: "금융", title: "건강보험료 산정 방식 — 직장·지역가입자", desc: "직장가입자·지역가입자 보험료 결정 요인과 점검 포인트를 안내합니다.", kw: "건강보험료, 건강보험, 직장보험료, 보험료 산정", k: "건강보험료" },
  { date: "2026-07-08", slug: "annual-leave-pay-rules", cat: "금융", title: "연차수당 지급 기준 — 미사용 연차 돈으로 받기", desc: "연차 발생·사용·수당 지급 규정과 퇴사 시 정산 방법을 정리했습니다.", kw: "연차수당, 연차, 미사용 연차, 퇴사 연차", k: "연차수당" },
  { date: "2026-07-09", slug: "monthly-food-cost-saving", cat: "생활", title: "한 달 식비 절약 방법 — 장보기·외식 줄이기", desc: "가계 식비 절감 습관, 장보기 요일·메뉴 계획, 배달·외식 대체 전략입니다.", kw: "식비 절약, 식비, 장보기, 가계비 절약", k: "식비 절약" },
];

function frontMatter(a) {
  return `---
layout: post
title: "${a.title}"
category: ${a.cat}
description: "${a.desc}"
keywords: "${a.kw}"
date: ${a.date} 09:00:00 +0900
---

`;
}

fs.mkdirSync(POSTS, { recursive: true });

// 기존 발행 글 전부 교체
for (const f of fs.readdirSync(POSTS)) {
  if (f.endsWith(".md")) fs.unlinkSync(path.join(POSTS, f));
}

let written = 0;
let minLen = Infinity;
for (const a of ARTICLES) {
  const body = buildSeoBody({
    keyword: a.k,
    keywords: a.kw,
    category: a.cat,
    year: a.date.slice(0, 4),
    dateStr: a.date,
  });
  const len = countBodyChars(body);
  minLen = Math.min(minLen, len);
  if (len < MIN) console.warn(`WARN ${a.slug}: ${len} chars`);
  fs.writeFileSync(path.join(POSTS, `${a.date}-${a.slug}.md`), frontMatter(a) + body + "\n", "utf8");
  written++;
}

console.log(`Wrote ${written} posts to _posts/ (min body chars: ${minLen})`);
