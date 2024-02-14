---
layout: main
title: About
permalink: /
accounts:
  - href: https://github.com/skalt
    logo: gh
  - href: https://www.linkedin.com/in/steven-kalt
    logo: ln
  - href: https://stackexchange.com/users/7834322/steven-kalt?tab=top
    logo: so
---

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
