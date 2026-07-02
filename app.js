const formatNumber = new Intl.NumberFormat("ko-KR", { maximumFractionDigits: 8 });
const wonFormatter = new Intl.NumberFormat("ko-KR", { style: "currency", currency: "KRW", maximumFractionDigits: 0 });
const formatWon = (value) => wonFormatter.format(Number.isFinite(value) ? value : 0);

const state = {
  activeTool: "basic",
  category: "all",
  query: "",
  theme: readStore("calc365:theme", "light"),
  favorites: readStore("calc365:favorites", []),
  recent: readStore("calc365:recent", [])
};

const converters = {
  length: {
    label: "길이",
    units: { mm: 0.001, cm: 0.01, m: 1, km: 1000, inch: 0.0254, ft: 0.3048, yd: 0.9144, mile: 1609.344 }
  },
  weight: {
    label: "무게",
    units: { mg: 0.001, g: 1, kg: 1000, t: 1000000, oz: 28.349523125, lb: 453.59237 }
  },
  data: {
    label: "데이터 용량",
    units: { B: 1, KB: 1024, MB: 1048576, GB: 1073741824, TB: 1099511627776 }
  },
  speed: {
    label: "속도",
    units: { "m/s": 1, "km/h": 0.2777777778, mph: 0.44704, knot: 0.5144444444 }
  }
};

const tools = [
  { id: "percent", name: "퍼센트", category: "money", render: renderPercent },
  { id: "discount", name: "할인", category: "money", render: renderDiscount },
  { id: "vat", name: "부가세", category: "money", render: renderVat },
  { id: "interest", name: "이자", category: "money", render: renderInterest },
  { id: "compound", name: "복리", category: "money", render: renderCompound },
  { id: "loan", name: "대출 상환", category: "money", render: renderLoan },
  { id: "salary", name: "실수령액", category: "money", render: renderSalary },
  { id: "severance", name: "퇴직금", category: "money", render: renderSeverance },

  { id: "datediff", name: "날짜 계산", category: "date", render: renderDatediff },
  { id: "dday", name: "D-day", category: "date", render: renderDday },
  { id: "age", name: "나이", category: "date", render: renderAge },
  { id: "time", name: "시간 계산", category: "date", render: renderTime },
  { id: "workday", name: "근무일", category: "date", render: renderWorkday },
  { id: "weeknum", name: "주차", category: "date", render: renderWeeknum },

  { id: "bmi", name: "BMI", category: "health", render: renderBmi },
  { id: "bmr", name: "기초대사량", category: "health", render: renderBmr },
  { id: "calorie", name: "권장 칼로리", category: "health", render: renderCalorie },
  { id: "water", name: "물 섭취량", category: "health", render: renderWater },
  { id: "bodyfat", name: "체지방률", category: "health", render: renderBodyfat },

  { id: "average", name: "평균", category: "life", render: renderAverage },
  { id: "pyeong", name: "평수 변환", category: "life", render: renderPyeong },
  { id: "elec", name: "전기요금", category: "life", render: renderElec },
  { id: "watercost", name: "수도요금", category: "life", render: renderWatercost },
  { id: "gas", name: "가스요금", category: "life", render: renderGas },

  { id: "length", name: "길이 변환", category: "convert", render: () => renderConverter("length") },
  { id: "weight", name: "무게 변환", category: "convert", render: () => renderConverter("weight") },
  { id: "temp", name: "온도 변환", category: "convert", render: renderTemp },
  { id: "data", name: "데이터 변환", category: "convert", render: () => renderConverter("data") },
  { id: "speed", name: "속도 변환", category: "convert", render: () => renderConverter("speed") },

  { id: "basic", name: "기본 계산기", category: "etc", render: renderBasic },
  { id: "qr", name: "QR 코드", category: "etc", render: renderQr }
];

const els = {
  search: document.querySelector("#toolSearch"),
  tabs: document.querySelectorAll(".category-tabs button"),
  strip: document.querySelector("#toolStrip"),
  title: document.querySelector("#toolTitle"),
  themeToggle: document.querySelector("#themeToggle"),
  favorite: document.querySelector("#favoriteToggle"),
  favoriteList: document.querySelector("#favoriteList"),
  recentList: document.querySelector("#recentList"),
  body: document.querySelector("#toolBody"),
  result: document.querySelector("#resultValue"),
  detail: document.querySelector("#resultDetail")
};

function readStore(key, fallback) {
  try {
    return JSON.parse(localStorage.getItem(key)) ?? fallback;
  } catch {
    return fallback;
  }
}

function writeStore(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function moneyInput(value = "") {
  return `<input inputmode="decimal" type="number" min="0" value="${value}">`;
}

function setResult(value, detail = "") {
  els.result.textContent = value;
  els.detail.textContent = detail;
}

function activeTool() {
  return tools.find((tool) => tool.id === state.activeTool) ?? tools[0];
}

function selectTool(id) {
  state.activeTool = id;
  state.recent = [id, ...state.recent.filter((item) => item !== id)].slice(0, 6);
  writeStore("calc365:recent", state.recent);
  render();
}

function filteredTools() {
  const q = state.query.trim().toLowerCase();
  return tools.filter((tool) => {
    const categoryMatch = state.category === "all" || tool.category === state.category;
    const queryMatch = !q || `${tool.name} ${tool.id}`.toLowerCase().includes(q);
    return categoryMatch && queryMatch;
  });
}

function applyTheme() {
  document.documentElement.dataset.theme = state.theme;
  if (els.themeToggle) {
    const dark = state.theme === "dark";
    els.themeToggle.querySelector("span").textContent = dark ? "☀" : "🌙";
    els.themeToggle.setAttribute("aria-label", dark ? "라이트 모드" : "다크 모드");
  }
}

function render() {
  const tool = activeTool();
  els.title.textContent = tool.name;
  els.favorite.classList.toggle("active", state.favorites.includes(tool.id));
  els.favorite.querySelector("span").textContent = state.favorites.includes(tool.id) ? "★" : "☆";
  renderToolStrip();
  renderMiniLists();
  tool.render();
}

function renderToolStrip() {
  const list = filteredTools();
  els.strip.innerHTML = list.map((tool) => (
    `<button class="tool-chip ${tool.id === state.activeTool ? "active" : ""}" type="button" data-tool="${tool.id}">${tool.name}</button>`
  )).join("");
}

function renderMiniLists() {
  renderMiniList(els.favoriteList, state.favorites);
  renderMiniList(els.recentList, state.recent);
}

function renderMiniList(el, ids) {
  const items = ids.map((id) => tools.find((tool) => tool.id === id)).filter(Boolean);
  if (!items.length) {
    el.className = "mini-list empty";
    el.textContent = "아직 없음";
    return;
  }
  el.className = "mini-list";
  el.innerHTML = items.map((tool) => `<button type="button" data-tool="${tool.id}">${tool.name}</button>`).join("");
}

function form(fields, button = "계산하기") {
  return `
    <div class="form-grid">
      ${fields.map((field) => `
        <div class="field ${field.full ? "full" : ""}">
          <label>${field.label}</label>
          ${field.html}
        </div>
      `).join("")}
    </div>
    <div class="actions">
      <button class="action-button primary" type="button" data-calc>${button}</button>
      <button class="action-button" type="button" data-reset>초기화</button>
    </div>
  `;
}

function selectHtml(options) {
  return `<select>${options.map((opt) => `<option value="${opt.value}">${opt.label}</option>`).join("")}</select>`;
}

/* ---------- 기본 계산기 ---------- */
function renderBasic() {
  els.body.innerHTML = `
    <div class="display">
      <input id="basicDisplay" inputmode="decimal" aria-label="계산식" value="0">
    </div>
    <div class="keypad">
      ${["C", "(", ")", "÷", "7", "8", "9", "×", "4", "5", "6", "-", "1", "2", "3", "+", "0", ".", "%", "="].map((key) => (
        `<button type="button" class="${/[÷×+%-]/.test(key) ? "operator" : ""} ${key === "=" ? "equals" : ""}" data-key="${key}">${key}</button>`
      )).join("")}
    </div>
    <p class="helper">사칙연산, 괄호, 퍼센트 계산을 지원합니다.</p>
  `;
  setResult("0", "계산식을 입력하세요.");
}

function calculateExpression(value) {
  const expression = value
    .replace(/×/g, "*")
    .replace(/÷/g, "/")
    .replace(/%/g, "/100");
  if (!/^[0-9+\-*/().\s]+$/.test(expression)) throw new Error("지원하지 않는 문자가 있습니다.");
  return Function(`"use strict"; return (${expression})`)();
}

/* ---------- 금융 ---------- */
function renderPercent() {
  els.body.innerHTML = form([
    { label: "전체 값", html: moneyInput() },
    { label: "비율 또는 일부 값", html: moneyInput() },
    {
      label: "계산 방식",
      full: true,
      html: selectHtml([
        { value: "part", label: "전체의 몇 %인지" },
        { value: "rate", label: "전체의 비율 값" },
        { value: "increase", label: "증감률" }
      ])
    }
  ]);
  setResult("0%", "퍼센트 계산 방식을 선택하세요.");
}

function calcPercent() {
  const total = numberAt(0);
  const value = numberAt(1);
  const mode = els.body.querySelector("select").value;
  if (mode === "part") return setResult(`${formatNumber.format((value / total) * 100 || 0)}%`, `${formatNumber.format(total)} 중 ${formatNumber.format(value)}`);
  if (mode === "rate") return setResult(formatNumber.format(total * value / 100), `${formatNumber.format(total)}의 ${formatNumber.format(value)}%`);
  setResult(`${formatNumber.format(((value - total) / total) * 100 || 0)}%`, `${formatNumber.format(total)}에서 ${formatNumber.format(value)}로 변화`);
}

function renderDiscount() {
  els.body.innerHTML = form([
    { label: "원래 가격", html: moneyInput(50000) },
    { label: "할인율(%)", html: `<input type="number" min="0" max="100" step="0.1" value="20">` }
  ]);
  setResult(formatWon(0), "할인 후 결제 금액을 계산합니다.");
}

function calcDiscount() {
  const price = numberAt(0);
  const rate = numberAt(1);
  const final = price * (1 - rate / 100);
  const saved = price - final;
  setResult(formatWon(final || 0), `할인액 ${formatWon(saved || 0)} (${formatNumber.format(rate)}% 할인)`);
}

function renderVat() {
  els.body.innerHTML = form([
    { label: "공급가액", html: moneyInput(100000) },
    { label: "세율(%)", html: `<input type="number" min="0" step="0.1" value="10">` }
  ]);
  setResult(formatWon(0), "부가가치세와 합계 금액을 계산합니다.");
}

function calcVat() {
  const supply = numberAt(0);
  const rate = numberAt(1);
  const vat = supply * rate / 100;
  setResult(formatWon(vat || 0), `공급가 ${formatWon(supply || 0)} + 부가세 = 합계 ${formatWon((supply + vat) || 0)}`);
}

function renderInterest() {
  els.body.innerHTML = form([
    { label: "원금", html: moneyInput(10000000) },
    { label: "연 이자율(%)", html: `<input type="number" min="0" step="0.01" value="3.5">` },
    { label: "기간(년)", html: `<input type="number" min="0" step="0.1" value="2">` }
  ]);
  setResult(formatWon(0), "단리 기준 이자와 원리금을 계산합니다.");
}

function calcInterest() {
  const principal = numberAt(0);
  const rate = numberAt(1) / 100;
  const years = numberAt(2);
  const interest = principal * rate * years;
  setResult(formatWon(interest || 0), `원리금 합계 ${formatWon((principal + interest) || 0)}`);
}

function renderCompound() {
  els.body.innerHTML = form([
    { label: "원금", html: moneyInput(10000000) },
    { label: "연 이자율(%)", html: `<input type="number" min="0" step="0.01" value="3.5">` },
    { label: "기간(년)", html: `<input type="number" min="0" step="0.1" value="3">` },
    {
      label: "복리 주기",
      html: selectHtml([
        { value: "1", label: "연 복리" },
        { value: "12", label: "월 복리" },
        { value: "365", label: "일 복리" }
      ])
    }
  ]);
  setResult(formatWon(0), "복리 만기 금액을 계산합니다.");
}

function calcCompound() {
  const principal = numberAt(0);
  const rate = numberAt(1) / 100;
  const years = numberAt(2);
  const n = Number(els.body.querySelector("select").value);
  const amount = principal * (1 + rate / n) ** (n * years);
  setResult(formatWon(amount || 0), `이자 ${formatWon((amount - principal) || 0)}`);
}

function renderLoan() {
  els.body.innerHTML = form([
    { label: "대출 원금", html: moneyInput(10000000) },
    { label: "연 이자율(%)", html: `<input type="number" min="0" step="0.01" value="4.5">` },
    { label: "기간(개월)", html: `<input type="number" min="1" step="1" value="36">` },
    {
      label: "상환 방식",
      html: selectHtml([
        { value: "equal", label: "원리금균등" },
        { value: "interest", label: "이자만 계산" }
      ])
    }
  ]);
  setResult(formatWon(0), "월 납입액을 계산합니다.");
}

function calcLoan() {
  const principal = numberAt(0);
  const annualRate = numberAt(1) / 100;
  const months = numberAt(2);
  const mode = els.body.querySelector("select").value;
  const monthlyRate = annualRate / 12;
  const payment = mode === "interest"
    ? principal * monthlyRate
    : principal * monthlyRate * ((1 + monthlyRate) ** months) / (((1 + monthlyRate) ** months) - 1);
  const total = mode === "interest" ? payment * months + principal : payment * months;
  setResult(formatWon(payment || 0), `총 상환 추정액 ${formatWon(total || 0)}`);
}

function renderSalary() {
  els.body.innerHTML = form([
    { label: "연봉", html: moneyInput(36000000) },
    { label: "비과세 월액", html: moneyInput(200000) }
  ]);
  setResult(formatWon(0), "국민연금, 건강보험, 고용보험, 근로소득세를 간이 추정합니다.");
}

function calcSalary() {
  const annual = numberAt(0);
  const taxFreeMonthly = numberAt(1);
  const monthly = annual / 12;
  const taxable = Math.max(monthly - taxFreeMonthly, 0);
  const pension = Math.min(taxable, 6170000) * 0.045;
  const health = taxable * 0.03545;
  const care = health * 0.1295;
  const employment = taxable * 0.009;
  const incomeTax = taxable * 0.03;
  const localTax = incomeTax * 0.1;
  const deductions = pension + health + care + employment + incomeTax + localTax;
  setResult(formatWon(monthly - deductions), `월 공제 추정액 ${formatWon(deductions)}`);
}

function renderSeverance() {
  els.body.innerHTML = form([
    { label: "월 평균임금(최근 3개월)", html: moneyInput(3000000) },
    { label: "근속 연수(년)", html: `<input type="number" min="0" step="0.1" value="3">` }
  ]);
  setResult(formatWon(0), "월 평균임금 × 근속연수로 추정합니다.");
}

function calcSeverance() {
  const monthly = numberAt(0);
  const years = numberAt(1);
  const pay = monthly * years;
  setResult(formatWon(pay || 0), `근속 ${formatNumber.format(years)}년 기준 추정치`);
}

/* ---------- 날짜·시간 ---------- */
function today() {
  return new Date().toISOString().slice(0, 10);
}

function renderDatediff() {
  els.body.innerHTML = form([
    { label: "시작일", html: `<input type="date" value="${today()}">` },
    { label: "종료일", html: `<input type="date">` }
  ]);
  setResult("0일", "두 날짜 사이의 일수를 계산합니다.");
}

function calcDatediff() {
  const [start, end] = [...els.body.querySelectorAll("input")].map((input) => new Date(input.value));
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return setResult("0일", "두 날짜를 모두 선택하세요.");
  const days = Math.round((end - start) / 86400000);
  const abs = Math.abs(days);
  setResult(`${days}일`, `약 ${Math.floor(abs / 7)}주 ${abs % 7}일`);
}

function renderDday() {
  els.body.innerHTML = form([
    { label: "기준일", html: `<input type="date" value="${today()}">` },
    { label: "목표일", html: `<input type="date">` }
  ]);
  setResult("D-0", "기준일과 목표일을 선택하세요.");
}

function calcDday() {
  const [base, target] = [...els.body.querySelectorAll("input")].map((input) => new Date(input.value));
  if (Number.isNaN(target.getTime())) return setResult("D-?", "목표일을 선택하세요.");
  const days = Math.round((target - base) / 86400000);
  setResult(days === 0 ? "D-day" : days > 0 ? `D-${days}` : `D+${Math.abs(days)}`, `${Math.abs(days)}일 차이입니다.`);
}

function renderAge() {
  els.body.innerHTML = form([
    { label: "생년월일", html: `<input type="date">` },
    { label: "기준일", html: `<input type="date" value="${today()}">` }
  ]);
  setResult("만 0세", "생년월일을 입력하세요.");
}

function calcAge() {
  const [birthInput, baseInput] = els.body.querySelectorAll("input");
  const birth = new Date(birthInput.value);
  const base = new Date(baseInput.value);
  if (Number.isNaN(birth.getTime())) return setResult("만 0세", "생년월일을 입력하세요.");
  let age = base.getFullYear() - birth.getFullYear();
  const beforeBirthday = base.getMonth() < birth.getMonth() || (base.getMonth() === birth.getMonth() && base.getDate() < birth.getDate());
  if (beforeBirthday) age -= 1;
  setResult(`만 ${Math.max(age, 0)}세`, `한국식 세는나이는 ${Math.max(base.getFullYear() - birth.getFullYear() + 1, 1)}세입니다.`);
}

function renderTime() {
  els.body.innerHTML = form([
    { label: "시작 시각", html: `<input type="time" value="09:00">` },
    { label: "종료 시각", html: `<input type="time" value="18:00">` }
  ]);
  setResult("0시간", "두 시각 사이의 경과 시간을 계산합니다.");
}

function calcTime() {
  const [start, end] = els.body.querySelectorAll("input");
  if (!start.value || !end.value) return setResult("0시간", "시작/종료 시각을 입력하세요.");
  const toMin = (v) => {
    const [h, m] = v.split(":").map(Number);
    return h * 60 + m;
  };
  let diff = toMin(end.value) - toMin(start.value);
  if (diff < 0) diff += 1440;
  setResult(`${Math.floor(diff / 60)}시간 ${diff % 60}분`, `총 ${diff}분`);
}

function renderWorkday() {
  els.body.innerHTML = form([
    { label: "시작일", html: `<input type="date" value="${today()}">` },
    { label: "종료일", html: `<input type="date">` }
  ]);
  setResult("0일", "주말(토·일)을 제외한 근무일 수를 계산합니다.");
}

function calcWorkday() {
  const [startInput, endInput] = els.body.querySelectorAll("input");
  const start = new Date(startInput.value);
  const end = new Date(endInput.value);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return setResult("0일", "두 날짜를 모두 선택하세요.");
  if (end < start) return setResult("0일", "종료일이 시작일보다 빠릅니다.");
  let count = 0;
  const cursor = new Date(start);
  while (cursor <= end) {
    const day = cursor.getDay();
    if (day !== 0 && day !== 6) count += 1;
    cursor.setDate(cursor.getDate() + 1);
  }
  setResult(`${count}일`, "시작일과 종료일을 포함한 근무일 수");
}

function renderWeeknum() {
  els.body.innerHTML = form([
    { label: "기준일", html: `<input type="date" value="${today()}">` }
  ]);
  setResult("0주차", "해당 연도의 몇 주차인지 계산합니다.");
}

function calcWeeknum() {
  const input = els.body.querySelector("input");
  const date = new Date(input.value);
  if (Number.isNaN(date.getTime())) return setResult("0주차", "날짜를 선택하세요.");
  const start = new Date(date.getFullYear(), 0, 1);
  const days = Math.floor((date - start) / 86400000);
  const week = Math.ceil((days + start.getDay() + 1) / 7);
  setResult(`${date.getFullYear()}년 ${week}주차`, `연초부터 ${days}일째`);
}

/* ---------- 건강 ---------- */
function genderSelect() {
  return selectHtml([
    { value: "male", label: "남성" },
    { value: "female", label: "여성" }
  ]);
}

function renderBmi() {
  els.body.innerHTML = form([
    { label: "키(cm)", html: `<input type="number" min="1" step="0.1" value="170">` },
    { label: "몸무게(kg)", html: `<input type="number" min="1" step="0.1" value="65">` }
  ]);
  setResult("0", "BMI와 체중 범위를 계산합니다.");
}

function calcBmi() {
  const height = numberAt(0) / 100;
  const weight = numberAt(1);
  const bmi = weight / (height * height);
  const label = bmi < 18.5 ? "저체중" : bmi < 23 ? "정상" : bmi < 25 ? "과체중" : "비만";
  setResult(formatNumber.format(bmi || 0), label);
}

function renderBmr() {
  els.body.innerHTML = form([
    { label: "성별", html: genderSelect() },
    { label: "키(cm)", html: `<input type="number" min="1" step="0.1" value="170">` },
    { label: "몸무게(kg)", html: `<input type="number" min="1" step="0.1" value="65">` },
    { label: "나이(만)", html: `<input type="number" min="1" step="1" value="30">` }
  ]);
  setResult("0 kcal", "Mifflin-St Jeor 공식으로 기초대사량을 계산합니다.");
}

function bmrValue() {
  const gender = els.body.querySelector("select").value;
  const height = numberAt(0);
  const weight = numberAt(1);
  const age = numberAt(2);
  const base = 10 * weight + 6.25 * height - 5 * age;
  return gender === "female" ? base - 161 : base + 5;
}

function calcBmr() {
  setResult(`${formatNumber.format(Math.round(bmrValue()) || 0)} kcal`, "하루 기초대사량(휴식 시 소비 열량)");
}

function renderCalorie() {
  els.body.innerHTML = form([
    { label: "성별", html: genderSelect() },
    { label: "키(cm)", html: `<input type="number" min="1" step="0.1" value="170">` },
    { label: "몸무게(kg)", html: `<input type="number" min="1" step="0.1" value="65">` },
    { label: "나이(만)", html: `<input type="number" min="1" step="1" value="30">` },
    {
      label: "활동 수준",
      full: true,
      html: selectHtml([
        { value: "1.2", label: "거의 안 함" },
        { value: "1.375", label: "가벼운 활동(주 1~3회)" },
        { value: "1.55", label: "보통 활동(주 3~5회)" },
        { value: "1.725", label: "활발함(주 6~7회)" },
        { value: "1.9", label: "매우 활발함" }
      ])
    }
  ]);
  setResult("0 kcal", "활동량을 반영한 하루 권장 열량을 계산합니다.");
}

function calcCalorie() {
  const selects = els.body.querySelectorAll("select");
  const activity = Number(selects[1].value);
  const tdee = bmrValue() * activity;
  setResult(`${formatNumber.format(Math.round(tdee) || 0)} kcal`, "활동 반영 하루 권장 열량(TDEE)");
}

function renderWater() {
  els.body.innerHTML = form([
    { label: "몸무게(kg)", html: `<input type="number" min="1" step="0.1" value="65">` }
  ]);
  setResult("0 L", "체중 기준 하루 권장 수분 섭취량을 계산합니다.");
}

function calcWater() {
  const weight = numberAt(0);
  const liters = weight * 0.033;
  setResult(`${formatNumber.format(Math.round(liters * 100) / 100 || 0)} L`, `약 ${formatNumber.format(Math.round(liters * 1000) || 0)} ml (체중 × 33ml)`);
}

function renderBodyfat() {
  els.body.innerHTML = form([
    { label: "성별", html: genderSelect() },
    { label: "키(cm)", html: `<input type="number" min="1" step="0.1" value="170">` },
    { label: "목둘레(cm)", html: `<input type="number" min="1" step="0.1" value="38">` },
    { label: "허리둘레(cm)", html: `<input type="number" min="1" step="0.1" value="82">` },
    { label: "엉덩이둘레(cm, 여성)", html: `<input type="number" min="0" step="0.1" value="95">` }
  ]);
  setResult("0%", "US Navy 추정식으로 체지방률을 계산합니다.");
}

function calcBodyfat() {
  const gender = els.body.querySelector("select").value;
  const height = numberAt(0);
  const neck = numberAt(1);
  const waist = numberAt(2);
  const hip = numberAt(3);
  let bf;
  if (gender === "female") {
    bf = 495 / (1.29579 - 0.35004 * Math.log10(waist + hip - neck) + 0.22100 * Math.log10(height)) - 450;
  } else {
    bf = 495 / (1.0324 - 0.19077 * Math.log10(waist - neck) + 0.15456 * Math.log10(height)) - 450;
  }
  if (!Number.isFinite(bf) || bf <= 0) return setResult("0%", "측정값을 확인하세요.");
  setResult(`${formatNumber.format(Math.round(bf * 10) / 10)}%`, "US Navy 둘레 측정 추정식");
}

/* ---------- 생활 ---------- */
function renderAverage() {
  els.body.innerHTML = form([
    { label: "값 목록 (쉼표 또는 공백 구분)", full: true, html: `<input type="text" placeholder="예: 80, 90, 100" value="80, 90, 100">` }
  ]);
  setResult("0", "여러 값의 평균과 합계를 계산합니다.");
}

function calcAverage() {
  const raw = els.body.querySelector("input").value;
  const nums = raw.split(/[\s,]+/).map(Number).filter((n) => !Number.isNaN(n) && Number.isFinite(n));
  if (!nums.length) return setResult("0", "숫자를 입력하세요.");
  const sum = nums.reduce((acc, n) => acc + n, 0);
  const avg = sum / nums.length;
  setResult(formatNumber.format(avg), `합계 ${formatNumber.format(sum)} · 개수 ${nums.length}`);
}

function renderPyeong() {
  els.body.innerHTML = form([
    { label: "값", html: `<input type="number" step="any" value="84">` },
    {
      label: "변환 방향",
      html: selectHtml([
        { value: "m2-py", label: "m² → 평" },
        { value: "py-m2", label: "평 → m²" }
      ])
    }
  ]);
  setResult("0", "제곱미터와 평을 서로 변환합니다.");
}

function calcPyeong() {
  const value = numberAt(0);
  const mode = els.body.querySelector("select").value;
  if (mode === "py-m2") return setResult(`${formatNumber.format(value * 3.305785)} m²`, `${formatNumber.format(value)}평`);
  setResult(`${formatNumber.format(value / 3.305785)} 평`, `${formatNumber.format(value)} m²`);
}

function renderUtility(label, unit, priceDefault, note) {
  els.body.innerHTML = form([
    { label: `사용량(${unit})`, html: `<input type="number" min="0" step="any" value="300">` },
    { label: "단가(원)", html: `<input type="number" min="0" step="any" value="${priceDefault}">` }
  ]);
  setResult(formatWon(0), note);
}

function renderElec() {
  renderUtility("전기요금", "kWh", 120, "사용량 × 단가로 전기요금을 추정합니다.");
}

function renderWatercost() {
  renderUtility("수도요금", "m³", 700, "사용량 × 단가로 수도요금을 추정합니다.");
}

function renderGas() {
  renderUtility("가스요금", "m³", 900, "사용량 × 단가로 가스요금을 추정합니다.");
}

function calcUtility(unit) {
  const usage = numberAt(0);
  const price = numberAt(1);
  setResult(formatWon(usage * price || 0), `${formatNumber.format(usage)}${unit} × ${formatNumber.format(price)}원`);
}

/* ---------- 단위 변환 ---------- */
function renderConverter(id) {
  const cfg = converters[id];
  const options = Object.keys(cfg.units).map((u) => ({ value: u, label: u }));
  els.body.innerHTML = form([
    { label: "값", html: `<input type="number" step="any" value="1">` },
    { label: "변환 전", html: selectHtml(options) },
    { label: "변환 후", html: selectHtml(options) }
  ], "변환하기");
  const selects = els.body.querySelectorAll("select");
  if (selects[1] && selects[1].options.length > 1) selects[1].selectedIndex = 1;
  setResult("0", `${cfg.label} 단위를 변환합니다.`);
}

function calcConverter(id) {
  const cfg = converters[id];
  const value = numberAt(0);
  const [from, to] = els.body.querySelectorAll("select");
  const result = value * cfg.units[from.value] / cfg.units[to.value];
  setResult(`${formatNumber.format(result || 0)} ${to.value}`, `${formatNumber.format(value)} ${from.value} 기준`);
}

function renderTemp() {
  const options = [
    { value: "C", label: "°C" },
    { value: "F", label: "°F" },
    { value: "K", label: "K" }
  ];
  els.body.innerHTML = form([
    { label: "값", html: `<input type="number" step="any" value="25">` },
    { label: "변환 전", html: selectHtml(options) },
    { label: "변환 후", html: selectHtml(options) }
  ], "변환하기");
  const selects = els.body.querySelectorAll("select");
  if (selects[1]) selects[1].selectedIndex = 1;
  setResult("0", "섭씨·화씨·켈빈을 변환합니다.");
}

function calcTemp() {
  const value = numberAt(0);
  const [from, to] = els.body.querySelectorAll("select");
  const celsius = from.value === "C" ? value : from.value === "F" ? (value - 32) * 5 / 9 : value - 273.15;
  const result = to.value === "C" ? celsius : to.value === "F" ? celsius * 9 / 5 + 32 : celsius + 273.15;
  const symbol = to.value === "K" ? "K" : `°${to.value}`;
  setResult(`${formatNumber.format(result)} ${symbol}`, `${formatNumber.format(value)} ${from.value === "K" ? "K" : `°${from.value}`} 기준`);
}

/* ---------- 기타 ---------- */
function renderQr() {
  els.body.innerHTML = form([
    { label: "내용 (텍스트 또는 URL)", full: true, html: `<input type="text" placeholder="https://example.com" value="https://calc365.example">` }
  ], "QR 생성");
  els.body.insertAdjacentHTML("beforeend", `<div id="qrBox" class="qr-box"></div>`);
  setResult("QR", "내용을 입력하고 생성하세요.");
}

function calcQr() {
  const text = els.body.querySelector("input").value.trim();
  const box = els.body.querySelector("#qrBox");
  if (!text) {
    if (box) box.innerHTML = "";
    return setResult("QR", "내용을 입력하세요.");
  }
  const url = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(text)}`;
  box.innerHTML = `<img src="${url}" alt="QR 코드" width="220" height="220" loading="lazy">`;
  setResult("QR 생성됨", text);
}

/* ---------- 실행 ---------- */
function numberAt(index) {
  const input = els.body.querySelectorAll("input")[index];
  return Number(input?.value || 0);
}

const handlers = {
  percent: calcPercent,
  discount: calcDiscount,
  vat: calcVat,
  interest: calcInterest,
  compound: calcCompound,
  loan: calcLoan,
  salary: calcSalary,
  severance: calcSeverance,
  datediff: calcDatediff,
  dday: calcDday,
  age: calcAge,
  time: calcTime,
  workday: calcWorkday,
  weeknum: calcWeeknum,
  bmi: calcBmi,
  bmr: calcBmr,
  calorie: calcCalorie,
  water: calcWater,
  bodyfat: calcBodyfat,
  average: calcAverage,
  pyeong: calcPyeong,
  elec: () => calcUtility("kWh"),
  watercost: () => calcUtility("m³"),
  gas: () => calcUtility("m³"),
  temp: calcTemp,
  qr: calcQr
};

function runCurrentTool() {
  const id = state.activeTool;
  if (converters[id]) return calcConverter(id);
  const fn = handlers[id];
  if (fn) fn();
}

els.search.addEventListener("input", (event) => {
  state.query = event.target.value;
  renderToolStrip();
});

els.tabs.forEach((button) => {
  button.addEventListener("click", () => {
    state.category = button.dataset.category;
    els.tabs.forEach((tab) => tab.classList.toggle("active", tab === button));
    renderToolStrip();
  });
});

els.themeToggle.addEventListener("click", () => {
  state.theme = state.theme === "dark" ? "light" : "dark";
  writeStore("calc365:theme", state.theme);
  applyTheme();
});

document.addEventListener("click", (event) => {
  const toolButton = event.target.closest("[data-tool]");
  if (toolButton) selectTool(toolButton.dataset.tool);

  const keyButton = event.target.closest("[data-key]");
  if (keyButton) {
    const display = document.querySelector("#basicDisplay");
    const key = keyButton.dataset.key;
    if (key === "C") {
      display.value = "0";
      setResult("0", "계산식을 입력하세요.");
    } else if (key === "=") {
      try {
        const value = calculateExpression(display.value);
        display.value = String(value);
        setResult(formatNumber.format(value), display.value);
      } catch (error) {
        setResult("오류", error.message);
      }
    } else {
      display.value = display.value === "0" ? key : display.value + key;
    }
  }

  if (event.target.closest("[data-calc]")) runCurrentTool();
  if (event.target.closest("[data-reset]")) activeTool().render();
});

els.favorite.addEventListener("click", () => {
  const id = state.activeTool;
  state.favorites = state.favorites.includes(id)
    ? state.favorites.filter((item) => item !== id)
    : [id, ...state.favorites];
  writeStore("calc365:favorites", state.favorites);
  render();
});

applyTheme();
render();

if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("./service-worker.js").catch(() => {});
}
