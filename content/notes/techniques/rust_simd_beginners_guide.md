---
title: Portable Rust SIMD Beginner's Guide
link: https://github.com/rust-lang/portable-simd/blob/master/beginners-guide.md
date: 2022-04-11
---

TL;DR:

- > A SIMD value is called a **vector**.
  > [...] A SIMD vector has a fixed size, known at compile time.
  > [ A] vector is generally aligned to its entire size.
- > A single element position within a [SIMD] vector is called a lane
- > The extra-wide registers that are used for SIMD operations are commonly called vector registers, [...] "SIMD registers", vendor names for specific features, or even "floating-point register"
- > When an operation is "vertical", each lane processes individually without regard to the other lanes in the same vector.
- Other operations can "reduce" all lanes to a single value.
- different chips have different architecture-specific SIMD registers
