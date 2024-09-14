---
title: Rewriting this site with Jekyll
---

## Why bother?

I wanted to clean up my previous site, and I wanted to try out Jekyll.

I built the previous iteration of my site with minimalism in mind. This led to an unfortunate experiment in using emoji as icons. For posterity: that experiment failed. Different browsers support different emoji, display the same emoji differently, and apply CSS font color to emoji differently.

I selected [Jekyll](https://jekyllrb.com/) for the rewrite since Github pages uses that static-site generator under the hood. Minimizing the number of tools involved in the site appealed to me (still does), but so did Jekyll's popularity and relative longevity. Jekyll 1.0 came out in 2013, years before its present-day competitors Hexo or Gatsby. If it has worked for that long, it must be doing something right.

## How Jekyll is different

### A place for everything and everything in its place

I learned the idea of convention over configuration in project file structure from Ruby on Rails. Using `_`-prefixed files to mean "includes" or "internals" seems to come from that tradition as well. Still, I noticed some flexibility seeping in from `_config.yml`.

### Liquid

My experience with Vue, handlebars, and Jinja2 meant I was able to grok most of the template-ese of Liquid. (`{% raw %}{{ var | filter }},{% expression %}{% endraw %}`). I hadn't seen anything like the `capture` pattern before, but I don't think I'll reuse it. I prefer using recursion or pipes to layer on changes.

I might have felt more at ease if I wrote more ruby, but not taking the time to learn all the liquid operators, filters, etc. left me feeling like my wings were clipped. I missed being able to bring the full power of JS to bear on simple templating problems.

### includes instead of components

I could use nested `include`s or layouts to compose my html snippets, but that requires some initial head-scratching (see above: directory structure, Liquid templating language). This did make me appreciate how idiomatic `<template>` and `<slot>` are in Vue and Svelte.

While dealing with Jekyll's differences made me give up some chances to <abbr title="Don't Repeat Yourself">DRY</abbr>, I did find myself writing smaller, simpler HTML. I had been reading about the merits of [<abbr title="Plain Old Semantic HTML">POSH</abbr>](http://microformats.org/wiki/posh), so I'd say this was a win.

## Other things I picked up

- Using the MutationObserver interface ([[docs]](https://developer.mozilla.org/en-US/docs/Web/API/MutationObserver)), I was able to cut down my JS footprint considerably.

- I read through the [<abbr title="Block-Element-Modifier">BEM</abbr>](http://getbem.com/introduction/) CSS model, though I didn't adhere to it strictly.

# I wouldn't recommend it if you're familiar with JS-based projects

Something JS-based (Sapper, Nuxt, Hexo) would have been much quicker to wrangle for me since I'd be able to bring more of my expertise to bear. Still, it was a good exercise and my site is now well under 15kb min+gz. I'll be keeping the current setup for the time being.
