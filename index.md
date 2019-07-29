---
layout: default
title: 'Steven Kalt'
---
# Hello Jekyll!
<!-- TODO: fwd to project list | about -->
{%for collection in site.collections %}
  {{collection.label}} {{collection}}
{%endfor%}
{{ site.categories }}
<hr>
{%for page in site.pages %}
  {{page.url}}
{%endfor%}
