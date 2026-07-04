/* Calc365 확장 계산기 56종 — 기존 44종 + 56 = 100종 */
window.CALC365_EXTRA_TOOLS = [
  /* ── 금융 17 ── */
  {
    id: "hourly", name: "시급 계산", category: "money",
    hint: "월급을 시급으로 환산합니다.",
    fields: [{ label: "월급", type: "money", default: 2500000 }, { label: "월 근무시간", type: "number", default: 209 }],
    calc: ({ n, setResult, formatWon }) => setResult(formatWon(n(0) / n(1)), "주휴·연장 미반영 간이 시급")
  },
  {
    id: "bonus", name: "상여금", category: "money",
    hint: "상여금 실수령을 간이 추정합니다.",
    fields: [{ label: "상여금(세전)", type: "money", default: 3000000 }, { label: "원천징수율(%)", type: "number", default: 3.3 }],
    calc: ({ n, setResult, formatWon, formatNumber }) => {
      const tax = n(0) * n(1) / 100;
      setResult(formatWon(n(0) - tax), `공제 추정 ${formatNumber.format(tax)}원`);
    }
  },
  {
    id: "tipsplit", name: "N빵 계산", category: "money",
    hint: "총액을 인원수로 나눕니다.",
    fields: [{ label: "총액", type: "money", default: 87000 }, { label: "인원", type: "number", default: 3 }],
    calc: ({ n, setResult, formatWon }) => setResult(formatWon(n(0) / n(1)), "1인당 부담액")
  },
  {
    id: "inflation", name: "물가상승률", category: "money",
    hint: "물가상승 후 예상 금액을 계산합니다.",
    fields: [{ label: "현재 금액", type: "money", default: 1000000 }, { label: "연상승률(%)", type: "number", default: 3 }, { label: "기간(년)", type: "number", default: 5 }],
    calc: ({ n, setResult, formatWon }) => setResult(formatWon(n(0) * (1 + n(1) / 100) ** n(2)), `${n(2)}년 후 예상`)
  },
  {
    id: "budget", name: "예산 소진율", category: "money",
    hint: "예산 대비 지출 비율을 계산합니다.",
    fields: [{ label: "총 예산", type: "money", default: 2000000 }, { label: "지출액", type: "money", default: 1500000 }],
    calc: ({ n, setResult, formatNumber, formatWon }) => {
      const pct = (n(1) / n(0)) * 100;
      setResult(`${formatNumber.format(pct)}%`, `잔여 ${formatWon(n(0) - n(1))}`);
    }
  },
  {
    id: "cagr", name: "CAGR 성장률", category: "money",
    hint: "연평균 복합 성장률을 계산합니다.",
    fields: [{ label: "시작값", type: "money", default: 1000000 }, { label: "종료값", type: "money", default: 1500000 }, { label: "기간(년)", type: "number", default: 3 }],
    calc: ({ n, setResult, formatNumber }) => {
      const cagr = ((n(1) / n(0)) ** (1 / n(2)) - 1) * 100;
      setResult(`${formatNumber.format(cagr)}%`, "연평균 복합 성장률");
    }
  },
  {
    id: "saving", name: "목표 저축", category: "money",
    hint: "목표 금액까지 필요한 월 저축액을 추정합니다.",
    fields: [{ label: "목표 금액", type: "money", default: 10000000 }, { label: "현재 저축", type: "money", default: 2000000 }, { label: "목표 개월", type: "number", default: 12 }],
    calc: ({ n, setResult, formatWon }) => setResult(formatWon((n(0) - n(1)) / n(2)), "단리·이자 미반영")
  },
  {
    id: "stackdisc", name: "중복 할인", category: "money",
    hint: "할인을 순차 적용한 최종가를 계산합니다.",
    fields: [{ label: "정가", type: "money", default: 100000 }, { label: "1차 할인(%)", type: "number", default: 20 }, { label: "2차 할인(%)", type: "number", default: 10 }],
    calc: ({ n, setResult, formatWon, formatNumber }) => {
      const final = n(0) * (1 - n(1) / 100) * (1 - n(2) / 100);
      setResult(formatWon(final), `실질 할인율 ${formatNumber.format((1 - final / n(0)) * 100)}%`);
    }
  },
  {
    id: "vatreclaim", name: "부가세 환급", category: "money",
    hint: "매입세액 공제 후 환급액을 추정합니다.",
    fields: [{ label: "매출 VAT", type: "money", default: 1000000 }, { label: "매입 VAT", type: "money", default: 400000 }],
    calc: ({ n, setResult, formatWon }) => {
      const pay = Math.max(n(0) - n(1), 0);
      const refund = Math.max(n(1) - n(0), 0);
      setResult(formatWon(refund), pay > 0 ? `납부세액 ${formatWon(pay)}` : "환급 또는 0");
    }
  },
  {
    id: "unitprice", name: "단가 계산", category: "money",
    hint: "총액÷수량으로 단가를 구합니다.",
    fields: [{ label: "총액", type: "money", default: 12000 }, { label: "수량", type: "number", default: 6 }],
    calc: ({ n, setResult, formatWon }) => setResult(formatWon(n(0) / n(1)), "개당·g당 단가")
  },
  {
    id: "installment", name: "할부 이자", category: "money",
    hint: "할부 원금과 수수료를 합산합니다.",
    fields: [{ label: "할부 원금", type: "money", default: 1200000 }, { label: "개월", type: "number", default: 12 }, { label: "월 수수료율(%)", type: "number", default: 0.5 }],
    calc: ({ n, setResult, formatWon, formatNumber }) => {
      const monthly = n(0) / n(1) * (1 + n(2) / 100);
      setResult(formatWon(monthly), `총 납부 ${formatWon(monthly * n(1))}`);
    }
  },
  {
    id: "ltv", name: "LTV 대출", category: "money",
    hint: "담보가 대비 대출 가능액을 계산합니다.",
    fields: [{ label: "주택 가격", type: "money", default: 500000000 }, { label: "LTV(%)", type: "number", default: 70 }],
    calc: ({ n, setResult, formatWon }) => setResult(formatWon(n(0) * n(1) / 100), "최대 대출 가능액(간이)")
  },
  {
    id: "margin", name: "마진율", category: "money",
    hint: "매출 대비 이익률을 계산합니다.",
    fields: [{ label: "매출", type: "money", default: 5000000 }, { label: "원가", type: "money", default: 3200000 }],
    calc: ({ n, setResult, formatNumber, formatWon }) => {
      const profit = n(0) - n(1);
      setResult(`${formatNumber.format((profit / n(0)) * 100)}%`, `이익 ${formatWon(profit)}`);
    }
  },
  {
    id: "breakeven", name: "손익분기", category: "money",
    hint: "손익분기 판매량을 계산합니다.",
    fields: [{ label: "고정비", type: "money", default: 5000000 }, { label: "단가", type: "money", default: 20000 }, { label: "변동비/개", type: "money", default: 12000 }],
    calc: ({ n, setResult, formatNumber }) => {
      const qty = n(0) / (n(1) - n(2));
      setResult(`${formatNumber.format(Math.ceil(qty))}개`, "손익분기 판매량");
    }
  },
  {
    id: "apy", name: "실질 수익률", category: "money",
    hint: "연 수익률과 세후 수익을 추정합니다.",
    fields: [{ label: "원금", type: "money", default: 10000000 }, { label: "연 수익률(%)", type: "number", default: 4 }, { label: "세율(%)", type: "number", default: 15.4 }],
    calc: ({ n, setResult, formatWon }) => {
      const interest = n(0) * n(1) / 100;
      const net = interest * (1 - n(2) / 100);
      setResult(formatWon(n(0) + net), `세후 이자 ${formatWon(net)}`);
    }
  },
  {
    id: "jeonse", name: "전월세 전환", category: "money",
    hint: "전세→월세 전환율을 간이 계산합니다.",
    fields: [{ label: "전세 보증금", type: "money", default: 200000000 }, { label: "전환율(%)", type: "number", default: 6 }],
    calc: ({ n, setResult, formatWon }) => setResult(formatWon(n(0) * n(1) / 100 / 12), "월세 추정(간이)")
  },
  {
    id: "markup", name: "마크업", category: "money",
    hint: "원가 대비 판매가 배율을 계산합니다.",
    fields: [{ label: "원가", type: "money", default: 8000 }, { label: "마크업(%)", type: "number", default: 50 }],
    calc: ({ n, setResult, formatWon }) => setResult(formatWon(n(0) * (1 + n(1) / 100)), "판매가")
  },

  /* ── 날짜 8 ── */
  {
    id: "ovulation", name: "배란일", category: "date",
    hint: "마지막 생리 시작일 기준 배란일을 추정합니다.",
    fields: [{ label: "생리 시작일", type: "date" }, { label: "주기(일)", type: "number", default: 28 }],
    calc: ({ input, n, setResult }) => {
      const start = new Date(input(0));
      if (Number.isNaN(start.getTime())) return setResult("-", "날짜를 선택하세요.");
      const ov = new Date(start);
      ov.setDate(ov.getDate() + n(1) - 14);
      setResult(ov.toISOString().slice(0, 10), "배란 예정일(간이)");
    }
  },
  {
    id: "pregnancy", name: "출산 예정일", category: "date",
    hint: "마지막 생리일 +280일로 출산 예정일을 추정합니다.",
    fields: [{ label: "마지막 생리일", type: "date" }],
    calc: ({ input, setResult }) => {
      const start = new Date(input(0));
      if (Number.isNaN(start.getTime())) return setResult("-", "날짜를 선택하세요.");
      const due = new Date(start);
      due.setDate(due.getDate() + 280);
      setResult(due.toISOString().slice(0, 10), "출산 예정일(Naegele)");
    }
  },
  {
    id: "countup", name: "경과일", category: "date",
    hint: "시작일부터 오늘까지 며칠인지 계산합니다.",
    fields: [{ label: "시작일", type: "date" }],
    calc: ({ input, today, setResult }) => {
      const start = new Date(input(0));
      const base = new Date(today());
      if (Number.isNaN(start.getTime())) return setResult("0일", "날짜를 선택하세요.");
      const days = Math.floor((base - start) / 86400000);
      setResult(`${days}일`, `${Math.floor(days / 7)}주 ${days % 7}일`);
    }
  },
  {
    id: "deadline", name: "남은 기한", category: "date",
    hint: "마감일까지 남은 일수를 계산합니다.",
    fields: [{ label: "마감일", type: "date" }],
    calc: ({ input, today, setResult }) => {
      const end = new Date(input(0));
      const base = new Date(today());
      if (Number.isNaN(end.getTime())) return setResult("0일", "날짜를 선택하세요.");
      const days = Math.ceil((end - base) / 86400000);
      setResult(days >= 0 ? `D-${days}` : `D+${Math.abs(days)}`, `${Math.abs(days)}일`);
    }
  },
  {
    id: "retire", name: "은퇴 D-day", category: "date",
    hint: "목표 은퇴일까지 남은 기간을 계산합니다.",
    fields: [{ label: "목표 은퇴일", type: "date" }],
    calc: ({ input, today, setResult }) => {
      const target = new Date(input(0));
      const base = new Date(today());
      if (Number.isNaN(target.getTime())) return setResult("D-?", "날짜를 선택하세요.");
      const days = Math.ceil((target - base) / 86400000);
      setResult(days > 0 ? `D-${days}` : "D-day", `약 ${Math.floor(days / 365)}년 ${Math.floor((days % 365) / 30)}개월`);
    }
  },
  {
    id: "timezone", name: "시차 계산", category: "date",
    hint: "도시 간 시차를 계산합니다.",
    fields: [{ label: "현지 시각", type: "time", default: "09:00" }, { label: "시차(시간)", type: "number", default: -13 }],
    calc: ({ input, n, setResult }) => {
      const [h, m] = input(0).split(":").map(Number);
      let total = h * 60 + m + n(1) * 60;
      total = ((total % 1440) + 1440) % 1440;
      setResult(`${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`, `시차 ${n(1)}시간 적용`);
    }
  },
  {
    id: "anniversary", name: "기념일", category: "date",
    hint: "100일·1000일 등 기념일을 계산합니다.",
    fields: [{ label: "시작일", type: "date" }, { label: "더할 일수", type: "number", default: 100 }],
    calc: ({ input, n, setResult }) => {
      const start = new Date(input(0));
      if (Number.isNaN(start.getTime())) return setResult("-", "날짜를 선택하세요.");
      const d = new Date(start);
      d.setDate(d.getDate() + n(1));
      setResult(d.toISOString().slice(0, 10), `${n(1)}일 기념일`);
    }
  },
  {
    id: "wedding", name: "결혼기념일", category: "date",
    hint: "결혼 N주년 날짜를 계산합니다.",
    fields: [{ label: "결혼일", type: "date" }, { label: "주년", type: "number", default: 10 }],
    calc: ({ input, n, setResult }) => {
      const start = new Date(input(0));
      if (Number.isNaN(start.getTime())) return setResult("-", "날짜를 선택하세요.");
      const d = new Date(start);
      d.setFullYear(d.getFullYear() + n(1));
      setResult(d.toISOString().slice(0, 10), `${n(1)}주년`);
    }
  },

  /* ── 건강 8 ── */
  {
    id: "bmigoal", name: "BMI 목표 체중", category: "health",
    hint: "목표 BMI에 맞는 체중을 계산합니다.",
    fields: [{ label: "키(cm)", type: "number", default: 170 }, { label: "목표 BMI", type: "number", default: 22 }],
    calc: ({ n, setResult, formatNumber }) => {
      const h = n(0) / 100;
      setResult(`${formatNumber.format(n(1) * h * h)} kg`, `BMI ${n(1)} 목표`);
    }
  },
  {
    id: "protein", name: "단백질 섭취", category: "health",
    hint: "체중 기준 권장 단백질량을 계산합니다.",
    fields: [{ label: "체중(kg)", type: "number", default: 65 }, { label: "g/kg", type: "number", default: 1.6 }],
    calc: ({ n, setResult, formatNumber }) => setResult(`${formatNumber.format(n(0) * n(1))} g`, "하루 권장 단백질(간이)")
  },
  {
    id: "dietdef", name: "다이어트 칼로리", category: "health",
    hint: "감량 목표 칼로리 적자를 계산합니다.",
    fields: [{ label: "유지 칼로리", type: "number", default: 2000 }, { label: "목표 적자", type: "number", default: 500 }],
    calc: ({ n, setResult, formatNumber }) => setResult(`${formatNumber.format(n(0) - n(1))} kcal`, "하루 섭취 목표")
  },
  {
    id: "activecal", name: "활동 칼로리", category: "health",
    hint: "운동 시간과 MET로 소모 칼로리를 추정합니다.",
    fields: [{ label: "체중(kg)", type: "number", default: 65 }, { label: "MET", type: "number", default: 6 }, { label: "시간", type: "number", default: 1 }],
    calc: ({ n, setResult, formatNumber }) => setResult(`${formatNumber.format(n(0) * n(1) * n(2))} kcal`, "활동 소모 칼로리")
  },
  {
    id: "pace", name: "러닝 페이스", category: "health",
    hint: "km당 페이스(분/km)를 계산합니다.",
    fields: [{ label: "거리(km)", type: "number", default: 5 }, { label: "시간(분)", type: "number", default: 28 }],
    calc: ({ n, setResult, formatNumber }) => {
      const pace = n(1) / n(0);
      setResult(`${formatNumber.format(Math.floor(pace))}:${String(Math.round((pace % 1) * 60)).padStart(2, "0")}/km`, "평균 페이스");
    }
  },
  {
    id: "stepdist", name: "걸음 거리", category: "health",
    hint: "걸음 수를 km로 환산합니다.",
    fields: [{ label: "걸음 수", type: "number", default: 10000 }, { label: "보폭(m)", type: "number", default: 0.7 }],
    calc: ({ n, setResult, formatNumber }) => setResult(`${formatNumber.format(n(0) * n(1) / 1000)} km`, `약 ${Math.round(n(0) / 1300)}분(130spm)`)
  },
  {
    id: "maxhr", name: "최대 심박", category: "health",
    hint: "220-나이 공식으로 최대 심박수를 추정합니다.",
    fields: [{ label: "나이(만)", type: "number", default: 30 }],
    calc: ({ n, setResult, formatNumber }) => setResult(`${formatNumber.format(220 - n(0))} bpm`, "간이 추정치")
  },
  {
    id: "idealwaist", name: "허리 목표", category: "health",
    hint: "키 기준 적정 허리둘레를 추정합니다.",
    fields: [{ label: "키(cm)", type: "number", default: 170 }],
    calc: ({ n, setResult, formatNumber }) => setResult(`${formatNumber.format(n(0) / 2)} cm`, "키÷2 간이 기준")
  },

  /* ── 생활 10 ── */
  {
    id: "paris", name: "할인율 역산", category: "life",
    hint: "정가와 할인가로 할인율을 역산합니다.",
    fields: [{ label: "정가", type: "money", default: 50000 }, { label: "할인가", type: "money", default: 35000 }],
    calc: ({ n, setResult, formatNumber }) => setResult(`${formatNumber.format((1 - n(1) / n(0)) * 100)}%`, "할인율")
  },
  {
    id: "tvsize", name: "TV 시청거리", category: "life",
    hint: "TV 인치에 맞는 시청 거리를 추정합니다.",
    fields: [{ label: "TV(inch)", type: "number", default: 55 }],
    calc: ({ n, setResult, formatNumber }) => setResult(`${formatNumber.format(n(0) * 2.5 * 2.54)} cm`, "권장 시청 거리(간이)")
  },
  {
    id: "moving", name: "이사 짐 부피", category: "life",
    hint: "박스 수로 트럭 크기를 추정합니다.",
    fields: [{ label: "5호 박스 수", type: "number", default: 20 }, { label: "박스당 부피(L)", type: "number", default: 50 }],
    calc: ({ n, setResult, formatNumber }) => setResult(`${formatNumber.format(n(0) * n(1) / 1000)} m³`, "총 부피")
  },
  {
    id: "carbon", name: "탄소 발자국", category: "life",
    hint: "전기 사용량으로 CO2를 추정합니다.",
    fields: [{ label: "월 전력(kWh)", type: "number", default: 300 }],
    calc: ({ n, setResult, formatNumber }) => setResult(`${formatNumber.format(n(0) * 0.424)} kg`, "월 CO2 추정(간이)")
  },
  {
    id: "laundry", name: "빨래 비용", category: "life",
    hint: "세탁 횟수와 비용을 계산합니다.",
    fields: [{ label: "1회 비용", type: "money", default: 5000 }, { label: "월 횟수", type: "number", default: 8 }],
    calc: ({ n, setResult, formatWon }) => setResult(formatWon(n(0) * n(1)), "월 세탁비")
  },
  {
    id: "parking", name: "주차비", category: "life",
    hint: "시간당 주차비를 계산합니다.",
    fields: [{ label: "시간당", type: "money", default: 3000 }, { label: "주차 시간", type: "number", default: 3 }],
    calc: ({ n, setResult, formatWon }) => setResult(formatWon(n(0) * n(1)), "총 주차비")
  },
  {
    id: "tip", name: "팁 계산", category: "life",
    hint: "식대와 팁 비율로 총액을 계산합니다.",
    fields: [{ label: "식대", type: "money", default: 80000 }, { label: "팁(%)", type: "number", default: 10 }],
    calc: ({ n, setResult, formatWon }) => {
      const tip = n(0) * n(1) / 100;
      setResult(formatWon(n(0) + tip), `팁 ${formatWon(tip)}`);
    }
  },
  {
    id: "recipe", name: "레시피 배율", category: "life",
    hint: "인분 수에 맞게 재료량을 배율 조정합니다.",
    fields: [{ label: "재료량", type: "number", default: 200 }, { label: "기준 인분", type: "number", default: 2 }, { label: "목표 인분", type: "number", default: 4 }],
    calc: ({ n, setResult, formatNumber }) => setResult(`${formatNumber.format(n(0) * n(2) / n(1))}`, `${n(2)}인분 기준`)
  },
  {
    id: "internet", name: "인터넷 요금", category: "life",
    hint: "월 인터넷+TV 요금을 추정합니다.",
    fields: [{ label: "인터넷", type: "money", default: 35000 }, { label: "TV/부가", type: "money", default: 15000 }],
    calc: ({ n, setResult, formatWon }) => setResult(formatWon(n(0) + n(1)), "월 통신비 합계")
  },
  {
    id: "cleaning", name: "청소 면적", category: "life",
    hint: "평수와 시간당 비용으로 청소비를 추정합니다.",
    fields: [{ label: "면적(평)", type: "number", default: 25 }, { label: "평당 비용", type: "money", default: 5000 }],
    calc: ({ n, setResult, formatWon }) => setResult(formatWon(n(0) * n(1)), "청소 예상 비용")
  },

  /* ── 변환 6 ── */
  {
    id: "pressure", name: "압력 변환", category: "convert",
    hint: "atm·bar·psi를 변환합니다.",
    fields: [{ label: "값", type: "number", default: 1 }, { label: "단위", type: "select", options: [{ value: "atm", label: "atm" }, { value: "bar", label: "bar" }, { value: "psi", label: "psi" }] }],
    calc: ({ n, sel, setResult, formatNumber }) => {
      const pa = { atm: 101325, bar: 100000, psi: 6894.76 };
      const base = n(0) * pa[sel()];
      setResult(`${formatNumber.format(base / 100000)} bar`, `${n(0)} ${sel()} 기준`);
    }
  },
  {
    id: "angle", name: "각도 변환", category: "convert",
    hint: "도↔라디안을 변환합니다.",
    fields: [{ label: "값", type: "number", default: 180 }, { label: "방향", type: "select", options: [{ value: "deg", label: "도→rad" }, { value: "rad", label: "rad→도" }] }],
    calc: ({ n, sel, setResult, formatNumber }) => {
      const res = sel() === "deg" ? n(0) * Math.PI / 180 : n(0) * 180 / Math.PI;
      setResult(formatNumber.format(res), sel() === "deg" ? "라디안" : "도");
    }
  },
  {
    id: "power", name: "전력 변환", category: "convert",
    hint: "kW↔마력(hp)을 변환합니다.",
    fields: [{ label: "값", type: "number", default: 100 }, { label: "방향", type: "select", options: [{ value: "kw", label: "kW→hp" }, { value: "hp", label: "hp→kW" }] }],
    calc: ({ n, sel, setResult, formatNumber }) => {
      const res = sel() === "kw" ? n(0) * 1.341 : n(0) / 1.341;
      setResult(formatNumber.format(res), sel() === "kw" ? "마력(hp)" : "kW");
    }
  },
  {
    id: "energy", name: "에너지 변환", category: "convert",
    hint: "kcal↔kJ를 변환합니다.",
    fields: [{ label: "값", type: "number", default: 100 }, { label: "방향", type: "select", options: [{ value: "kcal", label: "kcal→kJ" }, { value: "kj", label: "kJ→kcal" }] }],
    calc: ({ n, sel, setResult, formatNumber }) => {
      const res = sel() === "kcal" ? n(0) * 4.184 : n(0) / 4.184;
      setResult(formatNumber.format(res), sel() === "kcal" ? "kJ" : "kcal");
    }
  },
  {
    id: "shoe", name: "신발 사이즈", category: "convert",
    hint: "mm↔US 사이즈를 변환합니다.",
    fields: [{ label: "발 길이(mm)", type: "number", default: 260 }],
    calc: ({ n, setResult, formatNumber }) => setResult(`US ${formatNumber.format((n(0) - 180) / 10)}`, "간이 US 사이즈")
  },
  {
    id: "pixel", name: "px↔rem", category: "convert",
    hint: "px과 rem을 변환합니다.",
    fields: [{ label: "값(px)", type: "number", default: 16 }, { label: "root font(px)", type: "number", default: 16 }],
    calc: ({ n, setResult, formatNumber }) => setResult(`${formatNumber.format(n(0) / n(1))} rem`, `${n(0)}px 기준`)
  },

  /* ── 기타 7 ── */
  {
    id: "gcdlcm", name: "GCD/LCM", category: "etc",
    hint: "최대공약수·최소공배수를 구합니다.",
    fields: [{ label: "a", type: "number", default: 12 }, { label: "b", type: "number", default: 18 }],
    calc: ({ n, setResult }) => {
      const gcd = (a, b) => b ? gcd(b, a % b) : a;
      const g = gcd(n(0), n(1));
      setResult(`GCD ${g}`, `LCM ${(n(0) * n(1)) / g}`);
    }
  },
  {
    id: "prime", name: "소수 판별", category: "etc",
    hint: "입력값이 소수인지 판별합니다.",
    fields: [{ label: "정수", type: "number", default: 97 }],
    calc: ({ n, setResult }) => {
      const x = Math.floor(Math.abs(n(0)));
      if (x < 2) return setResult("합성수", "2 미만");
      let isPrime = true;
      for (let d = 2; d <= Math.sqrt(x); d += 1) {
        if (x % d === 0) { isPrime = false; break; }
      }
      setResult(isPrime ? "소수" : "합성수", `${x} 판별`);
    }
  },
  {
    id: "ratio", name: "비율 계산", category: "etc",
    hint: "a:b = c:x 에서 x를 구합니다.",
    fields: [{ label: "a", type: "number", default: 3 }, { label: "b", type: "number", default: 4 }, { label: "c", type: "number", default: 15 }],
    calc: ({ n, setResult, formatNumber }) => setResult(formatNumber.format(n(1) * n(2) / n(0)), `${n(0)}:${n(1)} = ${n(2)}:x`)
  },
  {
    id: "roundnum", name: "반올림", category: "etc",
    hint: "소수점 자릿수를 조정합니다.",
    fields: [{ label: "값", type: "number", default: 3.14159 }, { label: "자릿수", type: "number", default: 2 }],
    calc: ({ n, setResult, formatNumber }) => setResult(formatNumber.format(Number(n(0).toFixed(n(1)))), `${n(1)}자리`)
  },
  {
    id: "pythag", name: "피타고라스", category: "etc",
    hint: "직각삼각형 빗변을 계산합니다.",
    fields: [{ label: "a", type: "number", default: 3 }, { label: "b", type: "number", default: 4 }],
    calc: ({ n, setResult, formatNumber }) => setResult(formatNumber.format(Math.hypot(n(0), n(1))), "빗변 c")
  },
  {
    id: "reading", name: "읽기 시간", category: "etc",
    hint: "글자 수로 읽기 시간을 추정합니다.",
    fields: [{ label: "글자 수", type: "number", default: 3000 }],
    calc: ({ n, setResult }) => setResult(`${Math.ceil(n(0) / 500)}분`, "분당 500자 기준")
  },
  {
    id: "binary", name: "2진수 변환", category: "etc",
    hint: "10진수↔2진수를 변환합니다.",
    fields: [{ label: "값", type: "text", default: "10" }, { label: "방향", type: "select", options: [{ value: "dec-bin", label: "10→2" }, { value: "bin-dec", label: "2→10" }] }],
    calc: ({ input, sel, setResult }) => {
      const val = input(0).trim();
      if (sel() === "dec-bin") setResult(Number(val).toString(2), "2진수");
      else setResult(String(parseInt(val, 2)), "10진수");
    }
  }
];
