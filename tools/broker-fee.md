---
layout: single
title: "중개수수료 상한"
description: "주택 매매·전세·월세의 중개보수 상한을 공인중개사법 시행규칙 별표 기준으로 계산합니다. 조례가 더 낮으면 그 한도가 우선입니다."
permalink: /tools/broker-fee/
author_profile: false
---

<div class="jn-work">
  <section class="jn-panel">
    <h2>입력</h2>
    <div class="jn-tool">
      <p class="jn-note">기준: 「공인중개사법 시행규칙」 제20조와 별표 1의 주택 상한(국토교통부령, 주택 요율표는 2021년 10월 19일 개정분). 2026년 8월 28일 시행 개정은 주택 밖 중개대상물 조항입니다. 시·도 조례가 이 표보다 낮으면 조례가 우선합니다. 보수는 상한 안에서 협의하고, 아래 금액은 중개의뢰인 한쪽 기준입니다.</p>
      <label for="kind">거래</label>
      <select id="kind">
        <option value="sale">매매·교환</option>
        <option value="lease">전세·월세 (임대차)</option>
      </select>
      <label for="price" id="price-label">매매가격 (원)</label>
      <input id="price" inputmode="numeric" value="200000000">
      <label for="rent">월세 (원, 전세면 0)</label>
      <input id="rent" inputmode="numeric" value="0">
      <label class="jn-check"><input type="checkbox" id="vat"> 일반과세 사업자면 부가가치세 10%를 더해 보기</label>
      <p class="jn-note">월세가 있으면 거래금액은 보증금 + 월세 × 100입니다. 그 합이 5천만 원 미만이면 보증금 + 월세 × 70으로 다시 계산합니다. 오피스텔은 이 표와 요율이 다를 수 있습니다.</p>
    </div>
  </section>
  <section class="jn-panel jn-preview-wrap">
    <div class="jn-preview-bar">
      <h2>미리보기</h2>
      <button type="button" class="jn-pdf" data-jn-pdf="중개수수료-상한.pdf">PDF 저장</button>
    </div>
    <div class="jn-paper-scroll"><article class="jn-paper" id="jn-sheet"></article></div>
  </section>
</div>
<script>
(function () {
  var sale = [[5e7, 0.006, 25e4], [2e8, 0.005, 80e4], [9e8, 0.004, null], [12e8, 0.005, null], [15e8, 0.006, null], [Infinity, 0.007, null]];
  var lease = [[5e7, 0.005, 20e4], [1e8, 0.004, 30e4], [6e8, 0.003, null], [12e8, 0.004, null], [15e8, 0.005, null], [Infinity, 0.006, null]];
  var won = function (n) { return Math.floor(n).toLocaleString("ko-KR") + "원"; };
  function amount(kind, price, rent) {
    if (kind === "sale" || !rent) return price;
    var sum = price + rent * 100;
    return sum < 5e7 ? price + rent * 70 : sum;
  }
  function band(table, value) {
    for (var i = 0; i < table.length; i++) if (value < table[i][0]) return table[i];
    return table[table.length - 1];
  }
  function render() {
    var kind = document.getElementById("kind").value;
    var price = Number(String(document.getElementById("price").value).replace(/[^0-9]/g, "")) || 0;
    var rent = Number(String(document.getElementById("rent").value).replace(/[^0-9]/g, "")) || 0;
    document.getElementById("price-label").textContent = kind === "sale" ? "매매가격 (원)" : "보증금 (원)";
    var base = amount(kind, price, rent);
    var row = band(kind === "sale" ? sale : lease, base);
    var fee = base * row[1];
    if (row[2]) fee = Math.min(fee, row[2]);
    var vat = document.getElementById("vat").checked;
    var rows = [
      ["거래", kind === "sale" ? "매매·교환" : "전세·월세"],
      [kind === "sale" ? "매매가격" : "보증금", won(price)],
      ["월세", won(rent)],
      ["거래금액", won(base)],
      ["상한요율", (row[1] * 100).toFixed(1) + "%"],
      ["한도액", row[2] ? won(row[2]) : "이 구간은 한도액 없이 요율만 적용"],
      ["상한 보수", won(fee)]
    ];
    if (vat) rows.push(["부가세 10% 포함", won(fee * 1.1)]);
    rows.forEach(function (item) { item[1] = jnEsc(item[1]); });
    jnPaper("중개수수료 상한", rows, "한쪽 기준의 상한입니다. 조례가 더 낮으면 조례가 우선하고, 실제 보수는 그 안에서 협의합니다. 계산은 이 브라우저 안에서만 했습니다.");
  }
  ["kind", "price", "rent", "vat"].forEach(function (id) {
    document.getElementById(id).addEventListener("input", render);
    document.getElementById(id).addEventListener("change", render);
  });
  render();
})();
</script>
