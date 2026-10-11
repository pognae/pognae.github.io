---
layout: hub
title: "카테고리"
description: "계약·보증금, 이사·살림, 공과금·생활비, 장보기·살림기술, 초초초간단 요리, 안전·수선으로 글을 모았습니다."
permalink: /categories/
author_profile: false
---

<section class="jn-hero">
  <h1>카테고리</h1>
  <p>글을 여섯 갈래로 나눴습니다. 제목을 누르면 해당 안내로 이동합니다.</p>
</section>

{% assign groups = "계약·보증금,이사·살림,공과금·생활비,장보기·살림기술,초초초간단 요리,안전·수선" | split: "," %}
<div class="jn-directory">
<aside class="jn-side" aria-label="분류">
  <p class="jn-side-label">분류</p>
  {% for name in groups %}
  <a href="#jn-{{ forloop.index }}">{{ name }}</a>
  {% endfor %}
</aside>
<div class="jn-main">
{% for name in groups %}
<section class="jn-sec" id="jn-{{ forloop.index }}">
  <h2>{{ name }}</h2>
  <div class="jn-grid">
    {% for post in site.categories[name] %}
    <a class="jn-card" href="{{ post.url | relative_url }}">
      <strong>{{ post.title }}</strong>
      <span>{{ post.description }}</span>
    </a>
    {% endfor %}
  </div>
  {% if name == "초초초간단 요리" %}
  {% include coupang-recipe.html %}
  {% endif %}
</section>
{% endfor %}
</div>
</div>
