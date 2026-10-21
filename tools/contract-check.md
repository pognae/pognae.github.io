---
layout: single
title: "계약 전 확인 목록"
description: "주택 임대차 계약 전에 등기, 특약, 시설을 빠뜨리지 않도록 체크합니다. 체크는 이 브라우저에만 저장됩니다."
permalink: /tools/contract-check/
author_profile: false
---

<p class="jn-note">날짜별 순서는 <a href="/blog/2026/10/20/lease-seven-day-checklist/">월세 계약 전 7일 체크리스트</a>, 등기 읽는 법은 <a href="/blog/2026/10/20/registry-field-walkthrough/">등기 현장 읽기</a>, 특약 문장 예시는 <a href="/blog/2026/10/20/lease-special-clause-templates/">특약 예시 10개</a>를 참고하세요.</p>

<div class="jn-work">
  <section class="jn-panel">
    <h2>입력</h2>
    <div class="jn-tool" id="list"></div>
    <p class="jn-note">이 목록은 법률 자문이 아닙니다. 등기 열람은 <a href="https://www.iros.go.kr">인터넷등기소</a>에서 하고, 해석이 어려우면 계약 전에 법률구조공단(132)이나 사는 지역 주거 상담을 이용하세요. 체크는 이 기기에만 남습니다.</p>
  </section>
  <section class="jn-panel jn-preview-wrap">
    <div class="jn-preview-bar">
      <h2>미리보기</h2>
      <button type="button" class="jn-pdf" data-jn-pdf="계약-전-확인.pdf">PDF 저장</button>
    </div>
    <div class="jn-paper-scroll"><article class="jn-paper" id="jn-sheet"></article></div>
  </section>
</div>
<script>
(function () {
  var items = [
    "등기부등본을 계약 당일 다시 발급해 갑구의 소유자와 계약서 임대인이 같은지 보기",
    "을구의 근저당·가압류·신탁 여부를 보고, 빚이 있으면 보증금보다 선순위 금액이 얼마나 되는지 적기",
    "등기부 주소, 건축물대장 용도, 내가 본 집의 호수가 같은지 대조하기",
    "근린생활시설·오피스텔이면 전입신고와 확정일자가 되는 조건인지 중개인에게 문서로 받기",
    "벽, 곰팡이, 누수, 보일러, 온수 수압 상태를 사진으로 남기고 특약에 수리 주체를 적기",
    "가계약금을 넣기 전에 그 돈이 계약금인지, 돌려받는 조건이 무엇인지 문자로 남기기",
    "잔금일, 이사일, 열쇠 인계를 계약서에 같은 날짜로 적기",
    "전입신고와 확정일자를 이사 당일에 할 수 있는지 동사무소·등기소 시간을 확인하기"
  ];
  var key = "jn-contract-v1";
  var saved = {};
  try { saved = JSON.parse(localStorage.getItem(key) || "{}"); } catch (e) {}
  var root = document.getElementById("list");
  items.forEach(function (text, i) {
    var id = "c" + i;
    var label = document.createElement("label");
    label.className = "jn-check";
    var box = document.createElement("input");
    box.type = "checkbox";
    box.checked = !!saved[id];
    box.addEventListener("change", function () {
      saved[id] = box.checked;
      try { localStorage.setItem(key, JSON.stringify(saved)); } catch (e) {}
      paint();
    });
    var words = document.createElement("span");
    words.textContent = text;
    label.appendChild(box);
    label.appendChild(words);
    root.appendChild(label);
  });
  function paint() {
    var rows = items.map(function (text, i) {
      return [saved["c" + i] ? "확인" : "미확인", jnEsc(text)];
    });
    jnPaper("계약 전 확인 목록", rows, "법률 자문이 아닙니다. 등기와 특약은 계약 전에 다시 확인하고, 체크는 이 브라우저에만 남습니다.");
  }
  paint();
})();
</script>
