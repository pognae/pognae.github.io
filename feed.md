---
layout: hub
title: "피드"
description: "자취노트에 올라온 글을 최신순으로 모았습니다."
permalink: /feed/
author_profile: false
sitemap: false
---

<section class="jn-hero">
  <h1>피드</h1>
  <p>최신 글부터 봅니다. 구독 프로그램은 <a href="{{ '/feed.xml' | relative_url }}">XML 피드</a>를 등록하면 됩니다.</p>
</section>

<div class="jn-grid">
  {% for post in site.posts %}
  <a class="jn-card" href="{{ post.url | relative_url }}">
    <strong>{{ post.title }}</strong>
    <span>{{ post.date | date: "%Y년 %m월 %d일" }} · {{ post.description }}</span>
  </a>
  {% endfor %}
</div>
