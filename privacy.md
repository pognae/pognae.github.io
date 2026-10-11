---
layout: hub
title: "개인정보처리방침"
description: "자취노트가 처리하는 댓글·문의 정보, 브라우저에만 남는 도구 기록, 쿠키와 광고·분석 도구를 안내합니다."
permalink: /privacy.html
author_profile: false
---

<section class="jn-hero">
  <h1>개인정보처리방침</h1>
  <p>자취노트(monopoint.app)가 어떤 정보를 왜 처리하는지 적습니다.</p>
</section>

<div class="jn-directory">
<aside class="jn-side" aria-label="방침 목차">
  <p class="jn-side-label">방침</p>
  <a href="#jn-collect">직접 입력</a>
  <a href="#jn-auto">자동 수집</a>
  <a href="#jn-cookie">쿠키</a>
  <a href="#jn-third">제3자</a>
  <a href="#jn-child">아동</a>
  <a href="#jn-ask">문의</a>
</aside>
<div class="jn-main jn-copy">
<p class="jn-meta">시행일: 2026년 10월 11일</p>

<section class="jn-panel" id="jn-collect">
  <h2>직접 입력하는 정보</h2>
  <p>회원가입은 없고, 이름·전화번호를 가입 정보로 받지 않습니다. 아래는 이용자가 직접 넣은 경우입니다.</p>
  <ul>
    {% if site.comments.waline.server_url != "" and site.comments.waline.server_url -%}
    <li><strong>댓글.</strong> 글 하단 댓글은 Waline으로 운영하며, 로그인 없이 닉네임만으로 남길 수 있습니다. 닉네임과 댓글은 공개되고, 선택 입력한 이메일은 공개하지 않으며 답글 알림과 스팸 방지에만 씁니다. 스팸·도배 방지를 위해 작성 시 IP 주소와 브라우저 정보가 함께 저장되고, 댓글 데이터는 운영자가 관리하는 서버(Vercel, Neon)에 둡니다. 운영자는 광고·욕설·개인정보가 담긴 댓글을 숨기거나 삭제할 수 있습니다.</li>
    {%- else -%}
    <li><strong>댓글.</strong> 글 하단 댓글은 giscus로 운영되며 GitHub 저장소 Discussions에 저장됩니다. 댓글을 남기려면 GitHub 계정으로 로그인해야 하고, 사용자 이름·프로필 이미지·댓글 내용이 공개됩니다. 처리 방식은 GitHub 개인정보처리방침을 따릅니다. 운영자는 부적절한 댓글을 숨기거나 삭제할 수 있습니다.</li>
    {%- endif %}
    <li><strong>이메일 문의.</strong> 문의 메일로 보낸 주소와 내용은 답변에만 쓰고, 답변이 끝난 뒤 1년이 지나면 삭제합니다.</li>
    <li><strong>도구.</strong> 중개수수료, 생활비 나누기, 이사·계약 체크, 화면 밝기(라이트/다크)는 이용 중인 브라우저 안에서만 계산하거나 저장합니다. 금액, 체크 상태, 화면 설정은 사이트 서버로 보내지 않습니다. 브라우저 저장소를 지우면 함께 사라집니다.</li>
  </ul>
</section>

<section class="jn-panel" id="jn-auto">
  <h2>자동으로 처리되는 정보</h2>
  <ul>
    <li><strong>Google Analytics.</strong> 방문 페이지, 체류 시간, 유입 경로, 브라우저·기기 종류, 대략적인 지역 같은 이용 통계를 수집합니다. 사이트 개선에만 보고, 개인을 식별하는 데 쓰지 않습니다.</li>
    <li><strong>Google AdSense.</strong> 광고 게재와 성과 측정을 위해 Google과 제3자 광고 파트너가 쿠키를 사용합니다. 이 쿠키로 이 사이트와 다른 사이트 방문 기록을 바탕으로 맞춤 광고를 보여 줄 수 있습니다.</li>
    <li><strong>방문 횟수.</strong> 전체 방문 횟수를 세기 위해 Google Firebase를 사용합니다. 방문 1회마다 숫자만 늘어나며 이용자별 기록은 남기지 않습니다.</li>
    <li>웹 호스팅(GitHub Pages) 과정에서 IP 주소, 접속 시간 같은 서버 기록이 호스팅 사업자에게 남을 수 있습니다.</li>
  </ul>
</section>

<section class="jn-panel" id="jn-cookie">
  <h2>쿠키를 거부하는 방법</h2>
  <p>브라우저 설정에서 쿠키 저장을 거부하거나 저장된 쿠키를 지울 수 있습니다. 쿠키를 거부해도 글을 읽는 데는 지장이 없지만, 댓글처럼 일부 기능은 제한될 수 있습니다.</p>
  <ul>
    <li>맞춤 광고 해제: <a href="https://adssettings.google.com">Google 광고 설정</a></li>
    <li>여러 광고 네트워크의 맞춤 광고 해제: <a href="https://www.aboutads.info/choices">aboutads.info</a></li>
    <li>Google Analytics 수집 거부: <a href="https://tools.google.com/dlpage/gaoptout">Google Analytics 차단 부가기능</a></li>
  </ul>
</section>

<section class="jn-panel" id="jn-third">
  <h2>제3자 제공과 국외 처리</h2>
  <p>이용자의 개인정보를 판매하거나, 위에 적은 목적 밖으로 제3자에게 제공하지 않습니다. Google, GitHub, 댓글 서버(Waline이 쓰는 Vercel·Neon)는 국외 서버에서 정보를 처리할 수 있으며, 각 사업자의 개인정보처리방침이 적용됩니다.</p>
  <ul>
    <li><a href="https://policies.google.com/privacy">Google 개인정보처리방침</a></li>
    <li><a href="https://policies.google.com/technologies/ads">Google이 광고에서 쿠키를 사용하는 방식</a></li>
  </ul>
</section>

<section class="jn-panel" id="jn-child">
  <h2>아동의 개인정보</h2>
  <p>만 14세 미만 아동을 대상으로 하지 않으며, 아동의 개인정보를 의도적으로 수집하지 않습니다.</p>
</section>

<section class="jn-panel" id="jn-ask">
  <h2>문의와 변경</h2>
  <p>개인정보 문의나 댓글 삭제 요청은 <a href="mailto:monopointlab@gmail.com">monopointlab@gmail.com</a>으로 보내 주세요. 이 방침을 바꾸면 이 페이지의 시행일을 새로 적습니다.</p>
</section>
</div>
</div>
