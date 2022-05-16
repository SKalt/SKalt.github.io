---
layout: main
title: About
permalink: /
accounts:
  - href: https://github.com/skalt
    logo: gh
  - href: https://www.linkedin.com/in/steven-kalt-74739374/
    logo: ln
  - href: https://stackexchange.com/users/7834322/steven-kalt?tab=top
    logo: so
---

{% include style.html import="about_page.scss" %}
<p>
  I am full-stack engineer working in data science, renewable energy, and GIS.
  I graduated from Amherst College in 2016 with a degree in Environmental Studies (economics/policy focus) and French.
  In my spare time, I'm an avid climber, runner, and cross-country skier.
</p>
<p>
  All opinions on this site are my own.
</p>

<div class="centering">
  {% for account in page.accounts %}
    <a
      class="account-link"
      href="{{ account.href }}"
      rel="noreferrer"
      target="\_blank">
      {% include icon_{{ account.logo }}.svg %}
    </a>
  {% endfor %}
</div>
