---
link: https://cacm.acm.org/research/a-few-billion-lines-of-code-later/
title: "A Few Billion Lines of Code Later: Using Static Analysis to Find Bugs in the Real World"
date: 2010-02-01
tags:
  - devtools
  - parsing
  - ci
---

This article is an unflinching look at the realities of corporate software development as of 2010.

> Law: You can’t check code you can’t parse. Checking code deeply requires understanding the code’s semantics. The most basic requirement is that you parse it. **Parsing is considered a solved problem. Unfortunately, this view is naïve, rooted in the widely believed myth that programming languages exist.**
>
> The C language does not exist; neither does Java, C++, and C#. While a language may exist as an abstract idea, and even have a pile of paper (a standard) purporting to define it, a standard is not a compiler. **What language do people write code in? The character strings accepted by their compiler.** Further, they equate compilation with certification. A file their compiler does not reject has been certified as "C code" no matter how blatantly illegal its contents may be to a language scholar. Fed this illegal not-C code, a tool’s C front-end will reject it. This problem is the tool’s problem.

> Further, explaining errors is often more difficult than finding them. A misunderstood explanation means the error is ignored or, worse, transmuted into a false positive. The heuristic we follow: Whenever a checker calls a complicated analysis subroutine, we have to explain what that routine did to the user, and the user will then have to (correctly) manually replicate that tricky thing in his/her head.
