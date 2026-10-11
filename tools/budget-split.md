---
layout: single
title: "생활비 나누기"
description: "월세, 관리비, 식비 등을 넣어 한 달 합계와 수입 대비 비율을 봅니다. 금액은 서버로 보내지 않습니다."
permalink: /tools/budget-split/
author_profile: false
---

<div class="jn-tool">
  <p class="jn-note">권장 비율을 정해 주지 않습니다. 이번 달 숫자를 더해 어디가 큰지만 보여 줍니다. 입력값은 저장하지 않고 페이지를 벗어나면 사라집니다.</p>
  <label for="income">한 달 수입 (원, 선택)</label>
  <input id="income" inputmode="numeric" value="2500000">
  <div id="fields"></div>
  <div class="jn-result" id="out"></div>
</div>
<script>
(function () {
  var names = ["월세", "관리비", "전기·가스·수도", "식비", "교통·통신", "기타"];
  var root = document.getElementById("fields");
  names.forEach(function (name, i) {
    var label = document.createElement("label");
    label.textContent = name + " (원)";
    label.setAttribute("for", "b" + i);
    var input = document.createElement("input");
    input.id = "b" + i;
    input.inputMode = "numeric";
    input.value = "0";
    input.addEventListener("input", render);
    root.appendChild(label);
    root.appendChild(input);
  });
  document.getElementById("income").addEventListener("input", render);
  function num(id) {
    return Number(String(document.getElementById(id).value).replace(/[^0-9]/g, "")) || 0;
  }
  function render() {
    var sum = 0;
    var lines = [];
    names.forEach(function (name, i) {
      var v = num("b" + i);
      sum += v;
      lines.push(name + " " + v.toLocaleString("ko-KR") + "원");
    });
    var income = num("income");
    var text = lines.join("<br>") + "<br><strong>합계 " + sum.toLocaleString("ko-KR") + "원</strong>";
    if (income) text += " · 수입의 " + Math.round(sum / income * 1000) / 10 + "%";
    document.getElementById("out").innerHTML = text;
  }
  render();
})();
</script>
