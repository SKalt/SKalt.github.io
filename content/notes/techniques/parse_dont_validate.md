---
link: https://lexi-lambda.github.io/blog/2019/11/05/parse-don-t-validate/
title: Parse, don’t validate
date: 2019-11-05
---

TL;DR:

- parsers take less-structured data and try to turn it into more-structured data. They don't always succeed, so all parsers need to handle failure.
- validating `throw`s away information as exceptions/errors, while parsing holds onto that information
- parsing inputs as early as possible helps you trust the validity of data once it reaches your business logic.
- Beware of "shotgun parsing": validation checks scattered throughout a codebase. "Shotgun parsing necessarily deprives the program of the ability to reject invalid input instead of processing it."

Or, more succinctly,

> Failure is not an `Option<T>` its a `Result<T, E>`
>
> -- https://github.com/penguwin, 2024

<!-- more -->
<hr/>

> Parsing ... [stratifies] the program into two phases — parsing and execution — where failure due to invalid input can only happen in the first phase.

This reminds me of the technique of generating a plan in one step and then executing the plan in a separate step, like Terraform does.
I've used separate planning and execution in installer scripts, where I generate install commands that can be verified if `--dry-run` is passed.

One point I was surprised this paper made is

> Avoid denormalized representations of data, especially if it’s mutable.
> Duplicating the same data in multiple places introduces a trivially representable illegal state: the places getting out of sync.
> Strive for a single source of truth.

I agree that the "single source of truth" principle avoids errors.
However, normalizing mutable data creates a new problem: maintaining referential integrity.

Still, I tend to normalize data in structs-of-arrays for reasons laid out in ["Practical Data-Oriented Design"](../practical_data_oriented_design)
