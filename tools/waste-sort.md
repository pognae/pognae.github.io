---
layout: single
title: "분리배출 찾기"
description: "자주 나오는 생활 쓰레기를 검색하면 버리는 방법을 보여 줍니다. 구·군 안내가 다르면 그 안내가 우선입니다."
permalink: /tools/waste-sort/
author_profile: false
---

<div class="jn-tool">
  <p class="jn-note">환경부 분리배출 공통 안내를 기준으로 정리했습니다. 음식물 제외 품목, 투명 페트 별도 수거, 폐건전지함 위치는 구청·주민센터 안내가 우선합니다.</p>
  <label for="q">품목</label>
  <input id="q" placeholder="예: 페트병, 배터리, 양파">
  <div id="out"></div>
</div>
<script>
(function () {
  var rows = [
    ["종이 상자 신문", "테이프와 철핀을 빼고 종이류로 내놓습니다. 음식물이 밴 종이는 종량제 봉투입니다."],
    ["페트병", "내용물을 비우고 라벨을 떼어 압착한 뒤 플라스틱(또는 투명 페트 별도함)에 넣습니다. 뚜껑은 재질이 다르면 따로 모읍니다."],
    ["비닐 봉지", "이물질이 없으면 비닐류입니다. 음식물이나 기름이 묻으면 종량제 봉투입니다."],
    ["스티로폼", "테이프와 라벨, 택배 송장을 떼고 스티로폼으로 내놓습니다. 건축용 스티로폼은 생활 배출이 아닙니다."],
    ["캔 고철", "내용물을 비우고 헹군 뒤 캔류입니다. 부탄가스는 구멍을 뚫어 남은 가스를 뺀 뒤 캔류로 내는 지역이 많습니다. 구청 안내를 확인하세요."],
    ["유리병", "뚜껑을 분리하고 내용물을 비웁니다. 깨진 유리, 도자기, 거울, 전구는 유리병이 아닙니다. 신문지에 싸서 종량제나 불연 수거로 내는 곳이 많습니다."],
    ["음식물", "물기를 뺀 음식 찌꺼기입니다. 뼈, 조개껍데기, 달걀껍데기, 견과류 껍질, 양파·마늘·옥수수 껍질, 차 찌꺼기는 많은 지역에서 종량제 봉투입니다."],
    ["건전지 배터리", "폐건전지 전용 수거함에 넣습니다. 종량제 봉투나 재활용 비닐에 섞지 않습니다."],
    ["형광등 전구", "형광등은 전용 수거함입니다. 깨진 LED·백열 전구는 신문지에 싸서 종량제로 내는 곳이 많습니다."],
    ["옷 이불", "마른 의류는 의류수거함입니다. 오염되거나 젖은 천은 종량제 봉투입니다."],
    ["아이스팩", "내용물을 터뜨리지 않고 종량제 봉투에 넣는 곳이 많습니다. 별도 수거가 있는 구청도 있으니 안내를 확인하세요."]
  ];
  var q = document.getElementById("q");
  var out = document.getElementById("out");
  function paint() {
    var s = q.value.trim();
    out.innerHTML = "";
    rows.forEach(function (row) {
      if (s && row[0].indexOf(s) === -1 && row[1].indexOf(s) === -1) return;
      var box = document.createElement("div");
      box.className = "jn-result";
      box.innerHTML = "<strong>" + row[0] + "</strong><br>" + row[1];
      out.appendChild(box);
    });
    if (!out.children.length) {
      var empty = document.createElement("p");
      empty.className = "jn-note";
      empty.textContent = "목록에 없습니다. 구청 분리배출 검색이나 주민센터에 문의하세요.";
      out.appendChild(empty);
    }
  }
  q.addEventListener("input", paint);
  paint();
})();
</script>
