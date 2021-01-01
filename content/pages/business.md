---
layout: main
title: commercial
permalink: /commercial
---

{% include style.html import="about_page.scss" content="@import 'commercial.scss'" %}

# Commercial offerings

I offer some software under commercial licenses as an experiment in financially sustainable development. 

I'm currently trying out [strictEq](https://stricteq.com/).
I experimented with [License Zero](https://licensezero.com/) through 2020.

<!-- I'm also vaguely interacting with the folks @ otechie ... more on that later, I hope -->

{% assign commercial_projects = site.projects | sort: "date" | reverse  | where: "commercial", true %}

{% for project in commercial_projects %}
  {% include commercial_project.html
    slug=project.slug
    title=project.title
    identifier=project.identifier
    repo=project.repo
    link=project.link
    content=project
  %}

{% endfor %}

<div style="display: none">
  {% include icon_gh.svg %}
</div>
