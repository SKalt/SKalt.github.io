---
link: https://www.microsoft.com/en-us/research/publication/build-systems-la-carte/
title: "Build Systems a la Carte"
date: 2018-09-01
---

TL;DR: All build systems vary on the following axes:

- when the build system learns about dependencies (in the build specification or after doing some work)
- what information the system stores about previous builds
- where information about previous builds can be stored
- how build steps are scheduled (e.g. suspending, restarting, start-to-finish)
- whether the system does the minimum amount of work to build each artifact
