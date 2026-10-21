---
layout: single
title: "이사 비용 계산기"
description: "짐 양(톤수)·이사 유형·거리·운반 방식·날짜를 넣으면 자취·1인 가구 이사 비용의 예상 범위를 계산합니다. 시세 시작가 기반 추정치이며 실제 견적과 다를 수 있습니다."
permalink: /tools/moving-cost/
author_profile: false
---

<p class="jn-note">금액만 보고 끝내기보다, <a href="/tools/move-checklist/">이사·입주 체크리스트</a>와 <a href="/blog/2026/10/20/moving-timeline-d7-d3/">이사 D-7~D+3 타임라인</a>으로 날짜별 할 일을 같이 확인하세요. 이 계산기는 견적 비교의 기준점을 잡는 도구이며, 실제 금액은 방문견적에서 확정됩니다.</p>

<div class="jn-work">
  <section class="jn-panel">
    <h2>입력</h2>
    <div class="jn-tool">
      <p class="jn-note">기준: 공개 시세표의 톤수·유형별 시작가 범위(원룸 1톤 용달 4만원~, 반포장 30만원~, 포장 50만원~ 등)를 바탕으로 한 추정치입니다. 같은 시·군 안 이동, 평일, 양쪽 엘리베이터 사용이 기본 조건이고, 거리·운반 방식·날짜에 따라 더해집니다.</p>
      <label for="type">이사 유형</label>
      <select id="type">
        <option value="yongdal">용달 (운송만 — 포장·상하차는 본인)</option>
        <option value="normal">일반이사 (상하차 포함, 포장은 본인)</option>
        <option value="half" selected>반포장 (큰 짐 포장·배치는 업체, 잔짐은 본인)</option>
        <option value="full">포장이사 (포장부터 정리까지 업체)</option>
      </select>
      <label for="ton">짐 양</label>
      <select id="ton">
        <option value="t1" selected>1톤 — 원룸·오피스텔 (1인 가구 표준)</option>
        <option value="t25">2.5톤 — 투룸·짐 많은 1인 가구</option>
        <option value="t5">5톤 — 쓰리룸 이상</option>
      </select>
      <label for="dist">이동 거리</label>
      <select id="dist">
        <option value="d0" selected>같은 동네~10km (기본 포함)</option>
        <option value="d1">10~30km</option>
        <option value="d2">30~50km</option>
        <option value="d3">50~100km</option>
        <option value="d4">100km 이상 (장거리 — 별도 견적 권장)</option>
      </select>
      <label for="carry">운반 방식 (출발·도착 중 더 힘든 쪽 기준)</label>
      <select id="carry">
        <option value="c0" selected>양쪽 엘리베이터</option>
        <option value="c1">한쪽 계단 3층 이하</option>
        <option value="c2">한쪽 계단 4층 이상</option>
        <option value="c3">사다리차 1회 (~6층)</option>
        <option value="c4">사다리차 1회 (7~12층)</option>
        <option value="c5">사다리차 1회 (13층 이상)</option>
      </select>
      <label for="day">이사 날짜</label>
      <select id="day">
        <option value="w0" selected>평일</option>
        <option value="w1">주말·공휴일</option>
        <option value="w2">손없는날·월말 (성수기)</option>
      </select>
      <label class="jn-check"><input type="checkbox" id="ac"><span>에어컨 이전·설치 포함 (약 15만원~ 별도)</span></label>
      <label class="jn-check"><input type="checkbox" id="keep"><span>짐 정리를 많이 해 톤수를 낮출 수 있다 (아래 결과는 현재 선택 기준)</span></label>
      <p class="jn-note">사다리차가 양쪽 다 필요하면 운반 방식을 한 번 더 더한 금액에 가깝습니다. 에어컨 이전은 업체·기종별로 차이가 커서 견적서에 별도 항목으로 적힌 금액이 기준입니다.</p>
    </div>
  </section>
  <section class="jn-panel jn-preview-wrap">
    <div class="jn-preview-bar">
      <h2>미리보기</h2>
      <button type="button" class="jn-pdf" data-jn-pdf="이사비용-예상.pdf">PDF 저장</button>
    </div>
    <div class="jn-paper-scroll"><article class="jn-paper" id="jn-sheet"></article></div>
  </section>
</div>
<script>
(function () {
  var base = {
    yongdal: { t1: [40000, 70000], t25: [80000, 120000], t5: [150000, 220000] },
    normal: { t1: [120000, 170000], t25: [200000, 280000], t5: [350000, 450000] },
    half: { t1: [300000, 400000], t25: [800000, 900000], t5: [1100000, 1300000] },
    full: { t1: [500000, 600000], t25: [1000000, 1100000], t5: [1300000, 1500000] }
  };
  var distAdd = { d0: [0, 0], d1: [30000, 30000], d2: [60000, 60000], d3: [120000, 120000], d4: [200000, 200000] };
  var carryAdd = { c0: [0, 0], c1: [30000, 30000], c2: [50000, 50000], c3: [120000, 120000], c4: [150000, 150000], c5: [190000, 190000] };
  var dayMul = { w0: 1, w1: 1.1, w2: 1.2 };
  var labels = {
    type: { yongdal: "용달", normal: "일반이사", half: "반포장", full: "포장이사" },
    ton: { t1: "1톤 (원룸)", t25: "2.5톤 (투룸)", t5: "5톤 (쓰리룸~)" },
    dist: { d0: "10km 이내", d1: "10~30km", d2: "30~50km", d3: "50~100km", d4: "100km 이상" },
    carry: { c0: "양쪽 엘리베이터", c1: "계단 3층 이하", c2: "계단 4층 이상", c3: "사다리차 ~6층", c4: "사다리차 7~12층", d5: "", c5: "사다리차 13층~" },
    day: { w0: "평일", w1: "주말·공휴일 (+10%)", w2: "손없는날·월말 (+20%)" }
  };
  var won = function (n) { return Math.round(n / 1000) * 1000 === n ? n.toLocaleString("ko-KR") + "원" : Math.floor(n).toLocaleString("ko-KR") + "원"; };
  var range = function (r) { return won(r[0]) + " ~ " + won(r[1]); };
  function render() {
    var type = document.getElementById("type").value;
    var ton = document.getElementById("ton").value;
    var dist = document.getElementById("dist").value;
    var carry = document.getElementById("carry").value;
    var day = document.getElementById("day").value;
    var ac = document.getElementById("ac").checked;
    var b = base[type][ton];
    var d = distAdd[dist], c = carryAdd[carry], m = dayMul[day];
    var subMin = b[0] + d[0] + c[0], subMax = b[1] + d[1] + c[1];
    var totMin = subMin * m + (ac ? 150000 : 0);
    var totMax = subMax * m + (ac ? 200000 : 0);
    var rows = [
      ["이사 유형", labels.type[type]],
      ["짐 양", labels.ton[ton]],
      ["기본 비용 (시세 범위)", range(b)],
      ["이동 거리", labels.dist[dist] + (d[0] ? " (+" + won(d[0]) + ")" : " (기본 포함)")],
      ["운반 방식", labels.carry[carry] + (c[0] ? " (+" + won(c[0]) + ")" : "")],
      ["날짜", labels.day[day]]
    ];
    if (ac) rows.push(["에어컨 이전·설치", won(150000) + " ~ " + won(200000)]);
    rows.push(["예상 총액 범위", range([totMin, totMax])]);
    rows.push(["견적 받을 때", "같은 조건으로 3곳 이상 방문견적을 받고, 사다리차·추가비용 포함 여부를 견적서에 문장으로 남기세요."]);
    rows.forEach(function (item) { item[1] = jnEsc(item[1]); });
    jnPaper("이사 비용 예상", rows, "공개 시세의 시작가 범위를 바탕으로 한 추정치입니다. 짐 양·현장 조건·업체에 따라 실제 견적은 달라지며, 계약서에 없는 당일 추가금은 낼 의무가 없습니다. 계산은 이 브라우저 안에서만 했습니다.");
  }
  ["type", "ton", "dist", "carry", "day", "ac", "keep"].forEach(function (id) {
    var el = document.getElementById(id);
    el.addEventListener("input", render);
    el.addEventListener("change", render);
  });
  render();
})();
</script>
