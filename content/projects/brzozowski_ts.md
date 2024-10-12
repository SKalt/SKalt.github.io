---
identifier: brzozowski_ts
title: "Implementing Regular Expressions in Typescript Types (Badly)"
repo: skalt/brzozowski-ts
date: 2024-10-10
tags:
  - code crimes
  - cursed
  - parsing
  - regular expressions
  - Brzozowski derivatives
---

## Demo

```ts
import type { Compile, Exec, Recognize } from "brzozowski-ts/src";

type HexStrRE = Compile<"(?<hex>[0-9A-Fa-f]{5,})">;
type Match = Exec<HexStrRE, "abc123">;
const captures: Match["captures"] = ["abc123"];
const groups: Match["groups"] = { hex: "abc123" };

type HexStr<S extends string> = Recognize<HexStrRE, S>;
type NominalHex = string & { readonly isHex: unique symbol };

function castSpell<S extends string>(hex: HexStr<S> | NominalHex) {
  return hex;
}

const spell = castSpell("00dead00" as const); // ok!
const spellCheck: typeof spell = "00dead00"; // ok!

// @ts-expect-error
castSpell("xyz");

let dynamicHex: string = "a5df0";
castSpell(dynamicHex as NominalHex); // ok!
```

## Backstory

To prepare for Halloween, I was writing a function `castSpell` that accepts a valid hex string.
I was writing in typescript, so the usual way to do this is using [branded types][branded-types], also known as nominal types:

```ts
type Hex = string & {
  readonly isHex: unique symbol;
};
export const castSpell = (hex: Hex) => {
  /* magic */
};
castSpell("asdf" as Hex); // ok!
```

I could even use [type predicates][type-predicates] to narrow a general string down to a branded hex string:

```ts
const isHex = (str: string): str is Hex => /[0-9a-fA-F]/.test(str);

const mustBeHex = (str: string): Hex => {
  if (isHex(str)) return str;
  else throw new Error(`'${str}' is not a hex string`);
};
```

[[playground link](#todo)]

My options so far for guaranteeing that only valid hex strings are passed to `castSpell` are:

1. delegate checking valid hex strings to the next programmer

   - pro: check happens at compile time
   - con: can be wrong

1. delegate checking valid hex strings to the JS runtime
   - pro: always right
   - con: check happens at runtime

These two options are good enough for pretty much every practical use-case.

But what if I wanted to check the validity of hex strings automatically at compile time?

## Compile-time RegExp checking is feasible

Typescript's type system is [Turing-complete][turing], so parsing and evaluating regular expressions is definitely possible.
I've already see things like [solving N-Queens][n-queens], [parsing and evaluating SQL][sql], or [implementing deterministic finite automata][dfa] in the wild.

Ignoring the question of "should I do this", only the question "how to check if a RegEx matches a string at compile-time" remains.

### Brzozowski derivatives

A [Brzozowski derivative][wiki] of a set of strings `S` with respect to a string `U` is the set of strings in `S` that start with `U`, with the prefix removed.
Here's a Brzozowski derivative in Typescript:

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

```ts
type Err<Msg> = { error: Msg };
type ErrInfinite = Err<"type 'string' is infinite & cannot be matched">;

type Digit = "0" | "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9";
type LowerHex = "a" | "b" | "c" | "d" | "e" | "f";
type UpperHex = Uppercase<LowerHex>;
type HexChar = Digit | LowerHex | UpperHex;

type Derivative<
  S extends string,
  U extends string,
> = S extends `${U}${infer Rest}` ? Rest : Err<"No match"> & { S: S; U: U };

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
castSpell("0xfff"); // => Err<"no match"> & {S: "xfff"; U: HexChar}
```

[[playground link](https://www.typescriptlang.org/play/?ts=5.6.3#code/C4TwDgpgBAogTnAPAWQM4HMB8UC8UDeUECA9nAFxRrpQC+AUKJLAgJIB2AZgJbvfDQ88JACIm0AOSpgcXuglRuqRV179oAMigBjAIbt2JYFABG0ALa7g2gBYQAJiMz1G4aABFu6frigiADCJQAD5+AIxBoSIATJF+AMxxIgAsSQCsSQBsSQDsSQAcSQCcIq7MADIkAO7EABIQAB6+IrpJJknaSY4hfhBJnKXiUACqYJBw9U14o+N6qBCIlTUTjc5DkwDCNrpwvp7exqFLdY09MycNLkPuxNwAblb3C-RQUADKRA0C7PbK0rLsdAAGheI0+31+UH+chB2BwoI+jQhygABgASfDDWgY3icYhQABKEGktBRoIA-ITicBQZRhIgRAA5EhQSzWGxOKBafAiN4iShvIF+Yb8ka0ADcVzcUFYqEmbxkiERXwgPz+MjkcNB0MB4NVkI+lPpYmlUg1gIUShUPD4Ai5On0hmMZlZVlsDictPeerVfiClJkAFdoAB6EOu9kOACEXpusgewCeSqFm22cGwSP1ylx+KJqEDABtjOTQa9XnnC8ZM76dehS2XXpTZfLFRWi84Gw3KG2aZ2oHSEAzA+w4BBdLZdCYC31nGVoETtCR0HwAF4QSZKn2Q2ta17NxoKpBvDMq3053Y9+uUntb5RBiD1xvvR-9qn5otQMNvyuswPSUzQPoLBIAA+h2ZYDqIw6juO2xTjOUAuIu7D-nMwBvJABYFr4m7Vtu5pYAAFHYDTdhAi7Ltwa4bseACUuDYCR9DIf+qCYdheBoRhEBYYRLQmNoYTRIk9FfiQADWMYscYbE8QWWzkeJlDiCQnBQuxzSToJwlBGJkkuGGAACwCoAAtI0kDaMA5mkHAzG6NI3G8QEDScG5IiieGODYMahgRrYnLcm8lAiK57niiMlCpjstBAA)]

## And then I got carried away.

Next thing I knew, I had written a mostly-complete RegExp parser and evaluator.

```sh
scc . | sed 's/^/# /g'
# ───────────────────────────────────────────────────────────────────────────────
# Language                 Files     Lines   Blanks  Comments     Code Complexity
# ───────────────────────────────────────────────────────────────────────────────
# TypeScript Typings          17       885       43        37      805        484
# TypeScript                   8       519       23         7      489         32
# YAML                         4       302       39         0      263          0
# JSON                         3       139        8         0      131          0
# BASH                         2         4        0         2        2          0
# Markdown                     2       115       39         0       76          0
# Shell                        2        12        0         3        9          0
# License                      1        28        6         0       22          0
# gitignore                    1       133       34        38       61          0
# ───────────────────────────────────────────────────────────────────────────────
# Total                       40      2137      192        87     1858        516
# ───────────────────────────────────────────────────────────────────────────────
# Estimated Cost to Develop (organic) $51,771
# Estimated Schedule Effort (organic) 4.46 months
# Estimated People Required (organic) 1.03
# ───────────────────────────────────────────────────────────────────────────────
# Processed 73554 bytes, 0.074 megabytes (SI)
# ───────────────────────────────────────────────────────────────────────────────
```

## Reflections

### The path forward

I'm hoping this will push the discussion about RegEx-validated types in Typescript forward.
As that discussion progresses, this library might go through a few more iterations.
However, I don't intend to bring up to production quality.

#### A nerd snipe for someone else

Someone out there has written a compiler that targets Typescript types, right?

### You probably shouldn't use my code

#### It's overkill for most scenarios

If you're checking if a string is part of a set of:

- a finite number of strings: use a big string union.
- an infinite set of strings with a small number of prefixes or suffixes: use [template literal types](https://www.typescriptlang.org/docs/handbook/2/template-literal-types.html).
- an infinite set of strings with a simple pattern like the hex strings above: use this technique on your own. The simpler code above is faster than pulling in 800+ lines of type inference.

#### Compile-time RegEx is inappropriate for many advanced use-cases

If you're checking if a string is part of a set of:

- a large set of strings with a nesting pattern (like [HTML](https://stackoverflow.com/a/1732454)): you're out of luck, regular expressions can't match nested structures.
- a large set of probably long, potentially infinite-length strings with a tricky-yet-regular pattern (e.g. CSVs): parse the input at runtime. [Parse, don't Validate](https://lexi-lambda.github.io/blog/2019/11/05/parse-don-t-validate/) has a good overview of the benefits of parsing inputs at the boundaries of your program!
- a large set of reasonable-length strings with a tricky, bad-to-get-wrong pattern (like email or ipv6 addresses): use nominal types and runtime parsing in addition to any compile-time validation.

#### It will slow down your compile times

Though I'm not sure how much -- benchmarking is a TODO.
I developed on an 8-core, 32-GB linux x86_64 machine.
I experienced responsive incremental compilation in VSCode, and running the test suite took ~2.4s.

#### It's pre-alpha quality

The RegExp parsing and evaluation hasn't yet been extensively fuzzed.
There are almost certainly bugs in the implementation.
It also does naive string matching with backtracking, so it's certainly vulnerable to [ReDoS](https://owasp.org/www-community/attacks/Regular_expression_Denial_of_Service_-_ReDoS), albeit ReDoS of your compile times and not your server.

#### It's a pre-alpha release

I might break the public APIs without warning.

#### It's not a release at all, it's just a repo

I'm not releasing the code to NPM until fuzzing makes me confident the code is correct.

### Tricks for programming in Typescript Generics

#### Read through the tricks in [type-fest](https://github.com/sindresorhus/type-fest/)

There are some _very_ cool tricks in there! That codebase taught me:

- arithmetic using tuple lengths
- how to check if a type is equal to `never` despite the fact that [all types are assignable to `never`](https://www.typescriptlang.org/docs/handbook/type-compatibility.html#any-unknown-object-void-undefined-null-and-never-assignability)

#### Never say `never`: use extensible error types

An error type stuffed with context makes debugging much easier than using `never` to handle unexpected branches of inference.

I started out using `never` to handle cases I expected never to encounter, like

```ts
type MyType<T> =
  OtherType<T> extends ThingItMustBe<infer U> ? DoMoreStuff<U> : never;
```

After debugging why a deeply nested type was unexpectedly inferring `never` for the nth time, I started using

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

You can put the test cases next to your type-under-construction using block-scoped types:

```ts
type MyType<T> = T extends "example" ? "expected" : never;
{
  const _: MyType<"example"> = "expected";
}
```

With fast on-hover/inline type hints from your Typescript language server, you can obtain a REPL-like development experience.

Also, you can use the `//@ts-expect-error` directive to mark test-cases that should error out.

#### [`prettier --experimental-ternaries`](https://prettier.io/docs/en/options.html#experimental-ternaries) handles deeply-nested types gracefully

If you're doing something advanced with types, I'd highly recommend it.

[branded-types]: https://www.learningtypescript.com/articles/branded-types
[wiki]: https://en.wikipedia.org/wiki/Brzozowski_derivative
[regex-validated-str-issue]: https://github.com/microsoft/TypeScript/issues/41160#issuecomment-1503653578
[type-predicates]: https://www.typescriptlang.org/docs/handbook/2/narrowing.html#using-type-predicates
[n-queens]: https://www.richard-towers.com/2023/03/11/typescripting-the-technical-interview.html
[sql]: https://github.com/codemix/ts-sql
[dfa]: https://github.com/microsoft/TypeScript/issues/6579#issuecomment-710776922
[turing]: https://en.wikipedia.org/wiki/Turing_completeness
