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
