---
identifier: history-of-man
title: building HTML for each version of the linux man pages
repo: https://github.com/skalt/history-of-man
link: https://github.com/SKalt/history-of-man/commits/history/
date: 2020-04-10
tags:
  - cursed
  - shell
  - git-scraping
---

> how can POSIX be real if manpages aren't real
>
> -- Jaden Smith, probably

Someone once told me to <abbr title="Read The Fucking Manual">RTFM</abbr>.
I wanted to, but the manual I wanted to read was a linux `man` page.
`man` pages are written in [`m4`](https://en.wikipedia.org/wiki/M4_(computer_language)) a macro-based language from 1977.

Naturally, the only reasonable response was to write a script render all the linux man pages to html.

I've been informed that there might be an easier way to RTFM, such as using one of the [many](https://linux.die.net/man/) [nice](https://www.man7.org/linux/man-pages/) pre-rendered HTML man pages or just use `man(1)`.
These same informants told me that "writing everything in `bash` wasn't necessary" and they're right, but it's too late for that.
Far too late.

Anyway, if you want a dataset of HTML versions of the man pages, you can get 'em here.
The dataset might be useful for building tools like [explainshell][explainshell] or doing interesting analyses like ["The growth of command line options, 1979-Present" by Dan Luu][cli-complexity].

[explainshell]: https://www.explainshell.com/
[cli-complexity]: https://danluu.com/cli-complexity/
