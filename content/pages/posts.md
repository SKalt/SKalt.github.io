---
permalink: /posts
layout: main
---

{% include style.html content="@import 'posts_toc.scss'" %}

<ol class="posts_toc">
  {% for post in site.posts %}
  <li class="post">
    <a href="{{ post.url | relative_url }}">
      {{ post.title }}
    </a>
    <div>
      {{ post.date | date: "%Y-%m-%d" }}
    </div>
  </li>
  {% endfor %}
</ol>
