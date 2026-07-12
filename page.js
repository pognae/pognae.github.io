function readTheme() {
  try {
    return JSON.parse(localStorage.getItem("monpoint:theme")) || "light";
  } catch {
    return "light";
  }
}

function applyTheme(theme) {
  document.documentElement.dataset.theme = theme;
  const btn = document.querySelector("#themeToggle");
  if (!btn) return;
  const dark = theme === "dark";
  btn.querySelector("span").textContent = dark ? "☀" : "🌙";
  btn.setAttribute("aria-label", dark ? "라이트 모드" : "다크 모드");
}

const toggle = document.querySelector("#themeToggle");
if (toggle) {
  applyTheme(readTheme());
  toggle.addEventListener("click", () => {
    const next = readTheme() === "dark" ? "light" : "dark";
    localStorage.setItem("monpoint:theme", JSON.stringify(next));
    applyTheme(next);
  });
}

// 방문자 수 통계 로드 및 파싱
async function fetchVisitorStats() {
  try {
    const todayEl = document.getElementById("todayVisitors");
    const totalEl = document.getElementById("totalVisitors");
    if (!todayEl || !totalEl) return;

    // 현재 호스트네임에 맞게 호출 (로컬 테스트 시 실제 도메인 사용)
    const host = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
                 ? 'monopoint.app' 
                 : window.location.hostname;
    
    // hits.sh에서 제공하는 SVG (today-total 뷰) 가져오기
    const res = await fetch(`https://hits.sh/${host}.svg?view=today-total`);
    if (!res.ok) return;
    
    const svgText = await res.text();
    // SVG 내부에서 "오늘 / 전체" 텍스트 매칭
    const match = svgText.match(/<text[^>]*>([\d,]+\s*\/\s*[\d,]+)<\/text>/g);
    
    if (match && match.length > 0) {
      // SVG 상에서 시각적 효과를 위해 여러 번 그려진 마지막 요소 사용
      const lastTextNode = match[match.length - 1];
      const numbersMatch = lastTextNode.match(/>([\d,]+)\s*\/\s*([\d,]+)</);
      if (numbersMatch && numbersMatch.length >= 3) {
        todayEl.textContent = numbersMatch[1];
        totalEl.textContent = numbersMatch[2];
      }
    }
  } catch (error) {
    console.error("방문자 통계를 불러오는 데 실패했습니다.", error);
  }
}

fetchVisitorStats();
