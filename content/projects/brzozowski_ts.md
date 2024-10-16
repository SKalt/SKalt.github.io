---
identifier: brzozowski_ts
title: "Implementing Regular Expressions in TypeScript Types (Badly)"
repo: skalt/brzozowski-ts
date: 2024-10-10
tags:
  - code crimes
  - cursed
  - parsing
  - regular expressions
  - Brzozowski derivatives
---

## Summary

This is a cautionary tale about how I ended up writing a (bad) regular expression parser and evaluator in pure TypeScript types.

<!-- prettier-ignore -->
```ts
type HexStr<S extends string> = Recognize<"[0-9a-fA-F]+", S>;
type IsMatch<S extends string> = HexStr<S> extends S
  ? true
  : false;
const isHex:  IsMatch<"deadbeef"> = true
const notHex: IsMatch<"nope"> = false
```

The novelty here is parsing _and_ evaluating regular expressions at compile-time.
The inspiration for this technique came from a comment from 2020 on the [RegEx-validated string type discussion](https://github.com/microsoft/TypeScript/issues/6579#issuecomment-710776922).

## Backstory

To prepare for Halloween, I was writing a function `castSpell` that accepts a valid hex string.
I was writing in TypeScript, so the usual way to do this is using [branded types][branded-types], also known as nominal types:

<!-- prettier-ignore -->
```ts
type Hex = string & {
  readonly isHex: unique symbol;
};
export const castSpell = (hex: Hex) => {
  /* magic */
};
castSpell("asdf" as Hex); // ok!
// Wait, "s" isn't a hex character...
```

I could even use [type predicates][type-predicates] to narrow a general string down to a branded hex string:

<!-- prettier-ignore -->
```ts
const isHex = (str: string): str is Hex =>
  /[0-9a-fA-F]/.test(str);

const mustBeHex = (str: string): Hex => {
  if (isHex(str)) return str;
  else throw new Error(
    `'${str}' is not a hex string`
  );
};
```

[[playground link](#https://www.typescriptlang.org/play/?#code/C4TwDgpgBAEhAeUC8UDOwBOBLAdgcygDIoBvAKCigwgEMATAexwBsQotU54AuKAVxxYAjn2ioQAWwBGDZgG4yAXwUIwDDMCgBjJum010AZUjNmyKAAoAFgl5cAlMgB8pClAD0AKigSaeLFpQnu5KCmRaBsDGEKYWAEQGdABmcVAGsAj2ch7uUAwA1gCEZOG6mhxc5hboGLw1uHj2dZjsqBmISE5u7gDaAAwAtACcNANJAIIDAGIAuu4AdMAQ6NWYWSU6OHoSfOgAQhCVKKu1aJgNTe3OrpRYSZYVCCf2jtTAfBg4ZxgKlDGo0GAVgwDAA7lAcBBwQBRDAgjAWNyUAAGAHIACQkGqKVGtCEMTQ0KA2RD1fDItzrZRAA)]

My options so far for guaranteeing that only valid hex strings are passed to `castSpell` are:

1. delegate checking valid hex strings to the next programmer

   - pro: check happens at compile time
   - con: can be wrong

1. delegate checking valid hex strings to the JS runtime
   - pro: always right
   - con: check happens at runtime

These two options are [good enough for pretty much every practical use-case][regex-validated-str-issue].

But what if I wanted to check the validity of hex strings automatically at compile time?

## Compile-time RegExp checking is feasible

TypeScript's type system is [Turing-complete][turing], so parsing and evaluating regular expressions is definitely possible.
I've already see things like [solving N-Queens][n-queens], [parsing and evaluating SQL][sql], or [implementing deterministic finite automata][dfa] in the wild.

Ignoring the question of "should I do this", only the question "how to check if a RegEx matches a string at compile-time" remains.

### Brzozowski derivatives

A [Brzozowski derivative][wiki] of a set of strings `S` with respect to a string `U` is the set of strings in `S` that start with `U`, with the prefix removed.
Here's a Brzozowski derivative in TypeScript:

```ts
type Derivative<
  S extends string,
  U extends string,
> = S extends `${U}${infer Rest}` ? Rest : never;

type _ = Derivative<"cat" | "cow" | "dog", "c">; // => "at" | "ow"
```

[[playground link](https://www.typescriptlang.org/play/?#code/C4TwDgpgBAIhBOBLAbgQ2CiAeAUFKAylBAB7AQB2AJgM5Q3BIUDmANHlAKrFmW32NELdgD4oAXkI9y1OgAMAJAG9OAX2VCAZgigAlCA1VyoAfj0HgUAFxQKEZAgDcOJR1CQoAfQmwEKdJhYAEQAxkGsUKHoQVAAPpEhAPYA7jHxQVSJzEEijlAA9PlePkHRcZEpQTiqQA)]

Notably, we can check if a string matches a regular expression using Brzozowski derivatives:

> A string `U` is a member of the string set denoted by a generalized regular expression `R` if and only if the empty string is a member of the string set denoted by the derivative of `R` with respect to `U`.
>
> -- Brzozowski (1964), p.483, Theorem 4.2

## Proof-of-concept

<!-- prettier-ignore -->
```ts
type Err<Msg> = { error: Msg };
type ErrInfinite = Err<"type 'string' is infinite & cannot be matched">;

type Digit = "0" | "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9";
type LowerHex = "a" | "b" | "c" | "d" | "e" | "f";
type UpperHex = Uppercase<LowerHex>;
type HexChar = Digit | LowerHex | UpperHex;

type Derivative<
  Str extends string,
  Prefix extends string,
> = Str extends `${Prefix}${infer Rest}`
  ? Rest
  : Err<"No match"> & { Str: Str; Prefix: Prefix };

type IsHexStr<S extends string> = string extends S
  ? Err<"type 'string' is infinite & cannot be matched">
  : S extends ""
    ? true // matched!
    : Derivative<S, HexChar> extends infer Result
      ? Result extends string
        ? IsHexStr<Result>
        : Result
      : Err<"unreachable: infallible infer statement">;

type RecognizeHex<S extends string> =
  IsHexStr<S> extends infer Result
    ? Result extends true
      ? S
      : Result // Result must be an Err<_>
    : Err<"unreachable: infallible infer statement">;

const castSpell = <S extends string>(hex: RecognizeHex<S>) => hex;
const spell = castSpell("abc123"); // ok!
const spellCheck: typeof spell = "abc123"; // ok!

//@ts-expect-error
castSpell("0xfff"); // => Err<"no match"> & {Str: "xfff"; Prefix: HexChar}
```

[[playground link](https://www.typescriptlang.org/play/?ts=5.6.3#code/C4TwDgpgBAogTnAPAWQM4HMB8UC8UDeUECA9nAFxRrpQC+AUKJLAgJIB2AZgJbvfDQ88JACIm0AOSpgcXuglRuqRV179oAMigBjAIbt2JYFABG0ALa7g2gBYQAJiMz1G4aABFu6frigiADCJQAD5+AIxBoSIATJF+AMxxIgAsSQCsSQBsSQDsSQAcSQCcIq7MADIkAO7EABIQAB6+IrpJJknaSY4hfhBJnKXiUACqYJBw9U14o+N6qBCIlTUTjc5DkwDCNrpwvp7exqFLdY09MycNLkPuxNwAblb3C-RQUADKRA0C7PbK0rLsdAAGheI0+31+UH+chB2BwoI+jQhygABgASfDDWgY3icYhQABKEGktBRoIA-ITicBQZRhIgRAA5EhQSzWGxOKBafAiN4iShvIF+Yb8ka0ADcVzcUFYqEmbxkiERXwgPz+MjkcNB0MB4NVkI+lPpYmlUg1gIUShUPD4Ai5On0hmMZlZVlsDictPeerVfiClJkAFdoAB6EOu9kOACEXpusgewCeSqFm22cGwSP1ylx+KJqEDABtjOTQa9XnnC8ZM76dehS2XXpTZfLFRWi84Gw3KG2aZ2oHSEAzA+w4BBdLZdCYC31nGVoETtCR0HwAF4QSZKn2Q2ta17NxoKpBvDMq3053Y9+uUntb5RBiD1xvvR-9qn5otQMNvyuswPSUzQPoLBIAA+h2ZYDqIw6juO2xTjOUAuIu7D-nMwBvJABYFr4m7Vtu5pYAAFHYDTdhAi7Ltwa4bseACUuDYCR9DIf+qCYdheBoRhEBYYRLQmNoYTRIk9FfiQADWMYscYbE8QWWzkeJlDiCQnBQuxzSToJwlBGJkkuGGAACwCoAAtI0kDaMA5mkHAzG6NI3G8QEDScG5IiieGODYMahgRrYnLcm8lAiK57niiMlCpjstBAA)]

In the proof-of-concept above, `Derivative` is shortening the string-to-be-matched but not the regular expression `[a-fA-F0-9]+`, since the derivative of the RegEx with respect to any valid hex character is the same RegEx.
In a real RegEx evaluator, we'd need to keep track of the parts of the RegEx in order to consume them.

## And then I got carried away.

Next thing I knew, I had written a mostly-complete RegExp parser and evaluator.
Counting the lines of code with [`scc`][scc] found 805 lines of type definitions, which is ... a lot.
`scc` also produces [COCOMO](https://en.m.wikipedia.org/wiki/COCOMO) estimates of the cost to develop some code:

```sh
scc . | grep '^Estimated' | sed 's/^/# /g'
# Estimated Cost to Develop (organic) $51,771
# Estimated Schedule Effort (organic) 4.46 months
# Estimated People Required (organic) 1.03
```

Misinterpreting the estimated cost of what I wrote as its estimated worth always makes me feel better about myself!

## Reflections

### Current uses & the path forward

`brzozowski_ts` is currently useful if:

- you want to validate that a string constant is part of a large set of strings that is impractical to enumerate as a string union.
- you can write a RegEx that correctly describes your impractically-large-string-set.
- you want to provide fast feedback to your users about the validity of string constants.
- you _also_ use nominal types to validate dynamic strings.

Possible use-cases include:

- infrastructure-as-code functions that accept IP addresses
- strings that have a maximum length (e.g. resource names)
- paths and routing paths (note: `brzozowski_ts` supports group extraction!)
- urls, email addresses
- hex strings

The main use, however, is seeing how well compile-time regex works in practice.
I'm hoping that `brzozowski_ts` will push the discussion about RegEx-validated types in TypeScript forward.
As that discussion progresses, this library might go through a few more iterations.
However, I don't intend to bring up to production quality.

### You probably shouldn't use my code

#### It's overkill for most scenarios

If you're checking if a string is part of a set of:

- a finite number of strings (up to a few hundred): use a big string union.
- an infinite set of strings with a small number of prefixes or suffixes: use [template literal types](https://www.typescriptlang.org/docs/handbook/2/template-literal-types.html).
- an infinite set of strings with a simple pattern like the hex strings above: use this technique on your own.
  The simpler code above is faster than pulling in 800+ lines of type inference.

#### Compile-time RegEx is inappropriate for many advanced use-cases

If you're checking if a string is part of a set of:

- a large set of strings with a nesting pattern (like [HTML](https://stackoverflow.com/a/1732454)): you're out of luck, regular expressions can't match nested structures.
- a large set of probably long, potentially infinite-length strings with a tricky-yet-regular pattern (e.g. CSVs): parse the input at runtime. [Parse, don't Validate](https://lexi-lambda.github.io/blog/2019/11/05/parse-don-t-validate/) has a good overview of the benefits of parsing inputs at the boundaries of your program!

#### It will slow down your compile times

Though I'm not sure how much -- benchmarking is a TODO.
I developed on an 8-core, 32-GB linux x86_64 machine.
I experienced responsive incremental compilation in VSCode, and running [the test suite](https://github.com/SKalt/brzozowski-ts/tree/main/test) took ~2.4s.

#### It's alpha quality

The RegExp parsing and evaluation hasn't yet been extensively fuzzed.
There are almost certainly bugs in the implementation.
It also does naive string matching with backtracking, so it's certainly vulnerable to [RegEx Denial of Service (ReDoS)](https://owasp.org/www-community/attacks/Regular_expression_Denial_of_Service_-_ReDoS), albeit ReDoS of your compile times and not your server.

#### It's a alpha release

I might break the public APIs without warning.

#### It's not a release at all, it's just a repo

I'm not releasing the code to NPM until fuzzing makes me confident the code is correct.

### Tricks for programming in TypeScript Generics

#### Read through the tricks in [type-fest](https://github.com/sindresorhus/type-fest/)

There are some _very_ cool tricks in there! That codebase taught me:

- [arithmetic using tuple lengths](https://github.com/sindresorhus/type-fest/blob/main/source/subtract.d.ts)
- [how to check if a type is equal to `never`](https://github.com/sindresorhus/type-fest/blob/main/source/is-never.d.ts) despite the fact that [all types are assignable to `never`](https://www.typescriptlang.org/docs/handbook/type-compatibility.html#any-unknown-object-void-undefined-null-and-never-assignability)

#### Never say `never`: use extensible error types

An error type stuffed with context makes debugging much easier than using `never` to handle unexpected branches of inference.

I started out using `never` to handle cases I expected never to encounter, like

<!-- prettier-ignore -->
```ts
type MyType<T> =
  OtherType<T> extends ThingItMustBe<infer U> 
    ? DoMoreStuff<U>
    : never;
```

After debugging why a deeply nested type was unexpectedly inferring `never` for the nth time, I started using

<!-- prettier-ignore -->
```ts
type MyType<T> =
  OtherType<T> extends ThingItMustBe<infer U>
    ? DoMoreStuff<U>
    : { error: "this should never happen and here's why" } & {
        T: T;
        other: OtherType<T>;
      };
```

`Err<any>` also side-steps the problem that `never` is assignable to `string`:

```ts
const oops: never extends string ? true : false = true;
```

[[playground link](https://www.typescriptlang.org/play/?#code/MYewdgzgLgBCIAcIC4ZgKYDd0CcboA8p0wATCGaHASzAHMYB+GKHAV3RlQDMBDAGwicAvC3boA3EA)]

#### Write test-cases as you develop

You can put the test cases next to your type-under-construction using block scopes to avoid polluting your module's namespace:

<!-- prettier-ignore -->
```ts
type MyType<T> = T extends "example" ? "expected" : never;
{ const _: MyType<"example"> = "expected"; }
```

With fast on-hover/inline type hints from your TypeScript language server, you can obtain a REPL-like development experience.

Also, you can use the `//@ts-expect-error` directive to mark test-cases that should error out.

#### [`prettier --experimental-ternaries`](https://prettier.io/docs/en/options.html#experimental-ternaries) handles deeply-nested types gracefully

If you're doing something advanced with types, I'd highly recommend it.

### A nerd snipe for someone else

Someone out there has written a compiler that targets TypeScript types, right?

[branded-types]: https://www.learningtypescript.com/articles/branded-types
[wiki]: https://en.wikipedia.org/wiki/Brzozowski_derivative
[regex-validated-str-issue]: https://github.com/microsoft/TypeScript/issues/41160#issuecomment-1503653578
[type-predicates]: https://www.typescriptlang.org/docs/handbook/2/narrowing.html#using-type-predicates
[n-queens]: https://www.richard-towers.com/2023/03/11/typescripting-the-technical-interview.html
[sql]: https://github.com/codemix/ts-sql
[dfa]: https://github.com/microsoft/TypeScript/issues/6579#issuecomment-710776922
[turing]: https://en.wikipedia.org/wiki/Turing_completeness
[scc]: https://github.com/boyter/scc
