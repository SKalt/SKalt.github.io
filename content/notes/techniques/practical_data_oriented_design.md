---
link: https://vimeo.com/649009599
date: 2021-11-23
title: Practical Data-Oriented Design
tags:
  - systems programming
  - optimization
  - techniques
  - talk
---

TL;DR:

- A CPU has several kinds of memory.
  CPUs cache data in faster and slower memory as the data is used in computation.
- Reading from a slower cache tends to be more expensive than doing several math operations, even multiplication.
- Reducing memory usage can vastly speed up an application
- When possible, 8- or 16-bit integers instead of 32- or 64-bit pointers
- Using a struct of same-sized arrays instead of an array of structs avoids padding used to align each struct.
- store different kinds of objects in different `Vec`s or arrays and discard the discriminating information from the struct
- store sparse data separate from common data, e.g. in hashmaps

<!-- more -->
