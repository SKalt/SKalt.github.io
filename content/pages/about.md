---
layout: main
title: 'about'
permalink: /about
accounts:
  - href: https://github.com/skalt
    logo: gh
  - href: https://www.linkedin.com/in/steven-kalt-74739374/
    logo: ln
  - href: https://stackexchange.com/users/7834322/steven-kalt?tab=top
    logo: so
---
{% include style.html content="about_page.scss" %}


I am full-stack engineer working in in data science, renewable energy, and
GIS. I graduated from Amherst College with a degree in Environmental
Studies (economics/policy focus) and French in 2016. In my spare time,
I'm an avid climber, runner, and cross-country skier.

<br>

<div class="centering">
  {% for account in page.accounts %}
    <a
      class="account-link"
      href="{{ account.href }}"
      rel="noreferrer"
      target="_blank"
    >
      {% include icon_{{ account.logo }}.svg %}
    </a>
  {% endfor %}
</div>
