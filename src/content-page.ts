import './content.css';

/** 콘텐츠 페이지 공통 스크립트: 모바일 메뉴 토글, 연도 표시, 광고 슬롯 초기화만 담당한다. */

for (const toggle of Array.from(document.querySelectorAll<HTMLButtonElement>('[data-nav-toggle]'))) {
  toggle.addEventListener('click', () => {
    const navigation = document.getElementById('site-nav');
    if (!navigation) return;
    const opened = navigation.classList.toggle('is-open');
    toggle.setAttribute('aria-expanded', String(opened));
  });
}

for (const element of Array.from(document.querySelectorAll<HTMLElement>('[data-current-year]'))) {
  element.textContent = String(new Date().getFullYear());
}

document.querySelectorAll<HTMLElement>('ins.adsbygoogle').forEach(() => {
  try {
    const ads = (window.adsbygoogle = window.adsbygoogle || []);
    ads.push({});
  } catch (error) {
    console.warn('3년 다이어리: 애드센스 광고를 불러오지 못했습니다.', error);
  }
});
