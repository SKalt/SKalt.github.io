---
layout: main
title: commercial
permalink: /commercial
l0_projects:
  - name: jekyll_asset_map
    repo: https://github.com/skalt/jekyll_asset_map
    store: https://licensezero.com/projects/de9c209f-86b8-4a63-ae81-fb4ff3339d32
---

{% include style.html import="about_page.scss" %}

# Commercial offerings

I <3 open source and <abbr title="Free and Libre Open Source Softwar">FLOSS</abbr>. I'd like to write more of it. I'm currently experimenting with [License Zero](https://licensezero.com/) to subsidize my source-provided work.

I offer the following projects under the Parity Public License 6.0:

{% for project in page.l0_projects %}

- [`{{ project.name }}`]({{ project.repo }}) : [![licensezero.com pricing]({{ project.store }}/badge.svg)]({{ project.store }})

{% endfor %}

<style>
ul > li > a > img {
  height: 1.5em;
  vertical-align: bottom;
}
</style>
