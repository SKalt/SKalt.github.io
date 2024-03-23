---
link: https://matklad.github.io/2021/02/06/ARCHITECTURE.md.html
title: ARCHITECTURE.md
date: 2021-02-06
tags:
  - documentation
---

TL;DR:

- add an `ARCHITECTURE.md` document to make contributing to your codebase easier for newcomers
- A high-level map of the codebase architecture helps newcomers find where to start reading
- An `ARCHITECTURE.md` document should cover:
  - how different sections of the codebase work _together_
  - things that don't change often (once or twice a year at most)

<!-- more -->

> _Do_ name important files, modules, and types.
> _Do not_ directly link them (links go stale).

I'm optimistic that CI hooks using [`lychee(1)`](https://github.com/lycheeverse/lychee) can prevent links from going stale, and I like linking directly to the code.
However, it's up to a team to decide if the convenience of direct links is worth the chore of fixing them.

> Explicitly call-out architectural invariants.
> Often, important invariants are expressed as an absence of something, and it’s pretty hard to divine that from reading the code.
> [...]
> Point out boundaries between layers and systems as well.

In other words, when you're deciding "what modules have what responsibilities", `ARCHITECTURE.md` might be a good place to document those decisions.
