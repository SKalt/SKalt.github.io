---
title: "`yapf-diff`"
repo: https://github.com/luxresearch/yapf-diff
date: 2019-02-22
---

A tool to help my team incrementally adopt consistent python style by formatting only changed lines.

<!--more-->

It might be a character flaw, but I can't stand inconsistent style. To avoid wasting time in code review talking about style, I initially proposed using [`black`](https://pypi.org/project/black/). My team was hesitant to lose all the blame on our thousands of lines of python, so I wrote a YAPF style guide and this command-line tool to format only what was changed in a PR.
