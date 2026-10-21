---
layout: single
title: "이사·입주 체크리스트"
description: "잔금 전과 입주 직후에 빠지기 쉬운 일을 체크합니다. 체크 상태는 이 브라우저에만 저장됩니다."
permalink: /tools/move-checklist/
author_profile: false
---

<p class="jn-note">체크 항목의 배경 설명은 <a href="/blog/2026/10/20/moving-timeline-d7-d3/">이사 D-7~D+3 타임라인</a>과 <a href="/blog/2026/10/20/deposit-protect-move-in/">보증금 지키기(전입·확정일자·계량기)</a>에 모아 두었습니다.</p>

<div class="jn-work">
  <section class="jn-panel">
    <h2>입력</h2>
    <div class="jn-tool" id="list"></div>
    <p class="jn-note">저장 위치는 이 기기의 브라우저입니다. 서버로 전송되지 않으며, 브라우저 데이터를 지우면 체크도 사라집니다.</p>
  </section>
  <section class="jn-panel jn-preview-wrap">
    <div class="jn-preview-bar">
      <h2>미리보기</h2>
      <button type="button" class="jn-pdf" data-jn-pdf="이사-입주-체크리스트.pdf">PDF 저장</button>
    </div>
    <div class="jn-paper-scroll"><article class="jn-paper" id="jn-sheet"></article></div>
  </section>
</div>
<script>
(function () {
  var items = [
    "잔금일, 열쇠 인수 시각, 이사 업체 시간을 같은 날 표에 적기",
    "관리실에 엘리베이터·사다리차 사용을 미리 알리기",
    "계량기(전기·가스·수도) 숫자를 사진으로 남기기",
    "기존 집에 우편물 전달 기간이 있으면 우체국에 알리기",
    "인터넷·가스·전기 명의와 자동이체 계좌를 새 주소로 바꾸기",
    "전입신고와 확정일자는 이사한 날부터 미루지 않기",
    "도어록 비밀번호를 바꾸고 비상 열쇠가 어디 있는지 확인하기",
    "소화기와 창문 잠금, 수압, 온수, 배수구 냄새를 첫날에 보기"
  ];
  var key = "jn-move-v1";
  var saved = {};
  try { saved = JSON.parse(localStorage.getItem(key) || "{}"); } catch (e) {}
  var root = document.getElementById("list");
  items.forEach(function (text, i) {
    var id = "m" + i;
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
      return [saved["m" + i] ? "했음" : "안 함", jnEsc(text)];
    });
    jnPaper("이사·입주 체크리스트", rows, "체크는 이 브라우저에만 있습니다. 인쇄한 종이만 따로 보관하면 됩니다.");
  }
  paint();
})();
</script>
