---
title: "Parsing docker image references for fun and 0 profit"
draft: true
link: https://docs.rs/container_image_dist_ref/latest/container_image_dist_ref/
repo: skalt/container_image_dist_ref
---

## The problem

I wanted to parse docker-style container image references for a personal project I was writing in rust.
Ideally, I'd use the authoritative parser, [`distribution/reference`][ref], which is written in Go.
<abbr title="Foreign Function Interface">FFI</abbr> between Go and rust is nontrivial; the examples of rust-go FFI I found involved [a custom `build.rs` with C bindings][cgo_blog], [bundling <abbr title="WebAssembly">WASM</abbr>][wasm], or [custom][hooking_rust_from_go] [assembly][rustgo].
I decided to take the opportunity to have some fun and <abbr title="Rewrite It In Rust">RiiR</abbr> rather than deal with FFI.

## Optimizing for fun

I set out with the clear intention of optimizing for fun, not for efficiency.
Rewriting already-good software isn't an efficient use of time.
Nor is optimizing a a container image reference parser: the overhead of handling container images would bury any time or memory savings I could produce.
However, writing software just to see how fast it can go _is_ fun, so I dove into the task.

<!-- Practical Data-Oriented Design: https://vimeo.com/649009599 -->

### 0 dependencies

I avoided using any dependencies to keep the library size small and keep control of all of the logic.
The most notable absence is the excellent [`regex` crate][rust-regex].
`regex` is ergonomic, lightweight, and [`#[no_std]`][no_std], and using it would let me do a more literal port of `distribution/reference`'s use of golang regular expressions.

However, hand-writing a parser lets me avoid compiling regular expressions.
Compiling regular expressions is a one-time cost that's quickly amortized if you re-use the resulting automata.
However, re-using compiled regular expressions introduces small problems of storing and [sharing them across threads][regex_cross_thread].
Writing parsers as pure functions ensures each parse only uses stack-allocated memory, which means I can avoid linking `alloc` altogether.

Hand-writing a parser also let me store smaller offset sizes.
I skimmed the docs and source code of the `regex` and `regex-automata` crates, and I couldn't find a way to ensure match starts/ends would be stored as `u8`s or `u16`s.
If you know a way to get `regex` to use custom match sizes, please let me know in [this repo's issues][issues]!

### Parsing ascii bytes rather than unicode characters

This library takes an input ascii string and parses the lengths of each of the sections of an image reference.
Since ascii characters are one byte each, I could iterate over the individual bytes in the input string rather than unicode characters (`char`s) which have a fixed size of 4 bytes.

I learned this optimization from the `regex` crate's default settings!

### Keep only one copy of a string slice

Originally, I was thought of a parsed image reference as a collection of `&str`s:

```rs
/// The result of parsing a single `&'a str`
struct ImgRef<'a> {
  pub domain: &'a str,
  pub path: &'a str,
  pub tag: &'a str,
  pub digest: &'a str,
}
// size = 64 bytes (0x40), align = 0x8
```

64 bytes is a bit much! Reading the [docs on `&str`](https://doc.rust-lang.org/std/primitive.str.html#representation) pointed out the problem.

Each `&str` is made of 2 pointers: a pointer to the underlying data and a pointer-sized length.
If each `&str` segment is pointing to the same underlying data, this means the `ImgRef` struct includes 3 unneeded pointers!

Keeping hold of the source `&str` representing each part of an image reference as a length of a source string led to some nice savings:

```rs
struct ImgRef<'a> {
  src: &'a str,
  domain: usize,
  path: usize,
  tag: usize,
  digest: usize,
} // size = 48 (0x30), align = 0x8
  // savings = 24 bytes!

impl <'_> ImgRef<'_> {
  pub fn domain(&self) -> &str {
    todo!()
  }
  pub fn path(&self) -> &str {
    todo!()
  }
  pub fn tag(&self) -> &str {
    todo!()
  }
  pub fn digest(&self) -> &str {
    todo!()
  }
}
```

### Store short lengths

Most parts of `distribution/reference`'s grammar have length limits.
For example, an image tag can be at most 127 ascii characters long.
`distribution/reference` sometimes enforces limits outside its formal grammar: it bounds the length of an image name including any domain can be at most [255 ascii characters long](https://github.com/distribution/reference/blob/main/reference.go#L39).

For context, an image name is the domain and path portions of a reference.
Some examples of valid image names include:

```txt
img
path/img
my.registry.io:1234/path/to/img
```

Replacing `usize`s lengths with appropriately-sized unsigned integers saves another 16 bytes:

```rs
struct ImgRef<'a> {
  src: &'a str,
  domain: u8, // max 255 ch
  path: u8,   // max 255 ch
  tag: u8,    // max 128 ch
  digest: usize,
} // size = 32 (0x18), align = 0x8
  // savings = 16 bytes!
```

### Reasonable length limits

`distribution/reference` doesn't place any upper bounds on an image digest's length.

<!-- Instead `distribution/reference` relies on `opencontainers/go-digest` to validate the digest. -->

To ensure an entire canonical reference could be indexed by an unsigned 16-bit integer, I set an arbitrary-but-high upper bound of 1024 digest characters and 1024 algorithm characters.
For context, 1024 digest characters could fit 8 hex-encoded `sha512`s!

```rs
struct ImgRef<'a> {
  src: &'a str,
  domain: u8, // max 255 characters
  path: u8,   // max 255 characters
  tag: u8,    // max 128 characters
  digest: u16,
} // size = 24 (0x18), align = 0x8
  // savings = 8 bytes!
```

### All lengths are implicitly optional

Not all image references have a domain, tag, or digest.

```txt
path/img # no domain, tag, digest
img:tag  # no domain, digest
img@algo:digest # no domain, tag
img:tag@algo:digest # no domain
```

This means a more accurate representation would look like

```rs
struct ImgRef<'a> {
  src: &'a str,
  domain: Option<u8>,
  path: Option<u8>,
  tag: Option<u8>,
  digest: Option<u16>,
} // size = 32 (0x18), align = 0x8
  // extra cost = 8 bytes
```

Since all lengths can be 0, we can undo this regression by treating 0 as the `None` value rather than using extra space for an `Option<Length>`.
Rather than sprinkling `if len == 0` checks throughout the codebase, we can use rust's built-in `NonZero*` types to use `Option`s:

```rs
use core::num::{NonZeroU16, NonZeroU8};

struct ImgRef<'a> {
  src: &'a str,
  domain: Option<NonZeroU8>,
  path: Option<NonZeroU8>,
  tag: Option<NonZeroU8>,
  digest: Option<NonZeroU16>,
} // size = 24 (0x20), align = 0x8
  // savings = 8 bytes again
```

This optimization shows a nifty feature of rust's enums: Rust will reclaim unused bit patterns to optimize enum layouts. For example, `NonZeroU8` will never be represented as `0b00000000`, so Rust will represent `Option<NonZeroU8>::None` as `0`!
For a more detailed explanation of enum optimization and niches, see https://mcyoung.xyz/2023/08/09/yarns/#a-hand-written-niche-optimization.

### Retaining information to avoid re-parsing segments

`distribution/reference`'s grammar includes a notable ambiguity: at the start of a reference, `example.com:1234` could be an image name and tag or a host and port number depending on what comes after.
The most complicated parsing code in my library handles parsing these ambiguous segments and then deciding what the ensemble means.
Unfortunately, I think that section is essential complexity.

This optimization is about producing error messages:
I provide errors that include the index of the first invalid character.
I tried two strategies to produce this invalid index when parsing the ambiguous bits:

1. hang on to the index of the deciding character (i.e. the first alphabetic character in a possible tag or port) and use it once I determine the section must be a port
1. once I determine the ambiguous section must be a port, find the first invalid port character.

I benchmarked the two approaches and found that retaining the index of the deciding character was slightly slower.
I strongly suspect that's because my benchmark includes many more valid image references than invalid references.
I chose to keep hold of the index of the deciding character to avoid unbalanced performance between the happy and unhappy code paths.

### Debug mode

Writing a hand-written parser required a bunch of debugging.
I kept my debugging code behind behind [`#[cfg(debug_assertions)]` conditional-compilation][debug_assertions] macros to keep my release library fast and lean:

- All my invariants are written using `debug_assert!(..)` instead of `assert!(..)` to avoid extra computation in release mode.
- To make interactive debugging easer, I'd add readable variables:
  ```rs
  for ascii in src_str.bytes() {
    #[cfg(debug_assertions)]
    let _ch = ascii as char; // to avoid having to mentally decode u8s
    // ...
  }
  ```

### De-optimizing: exposing extra information

I decided to keep track of extra information like:

- whether domains are valid IPv6 host names
- what portion of domains are ports
- whether digests comply with the [OCI digest spec][oci_digest] or `distribution/reference`'s implementation (the OCI spec allows uppercase letters in algorithms and `=`, `_`, and `-` in the digest section)

This cost a few extra bytes in my `ImgRef` struct, but I figured the improved API was worth the cost.

### The result

As the saying goes, "there are lies, damned lies, and benchmarks".
`distribution/reference` is already fast.
I benchmarked parsing all 45 test cases in the test suite:

```
goos: linux
goarch: amd64
pkg: github.com/skalt/container_image_dist_ref/internal/reference_oracle
cpu: Intel(R) Core(TM) i7-4770 CPU @ 3.40GHz
BenchmarkOracleEntireTestSuite-8   	    9973	    145470 ns/op
BenchmarkJustIteration-8           	89256811	        12.81 ns/op
PASS
ok  	github.com/skalt/container_image_dist_ref/internal/reference_oracle	3.474s

```

Which is around 3400 ns/test case with some hand-waving for the nanoseconds cost by iterating over each of the 45 test cases.

```
  Running benches/basic_benchmark.rs (target/release/deps/basic_benchmark-ea70c6cafa492ad4)
entire_test_suite       time:   [5.7695 µs 5.7756 µs 5.7835 µs]
                        change: [-3.5939% -1.5051% -0.1272%] (p = 0.09 > 0.05)
                        No change in performance detected.
Found 10 outliers among 100 measurements (10.00%)
  3 (3.00%) high mild
  7 (7.00%) high severe
```

5.7756 µs \* 1000 ns/µs / 45 test cases is roughly 128 ns per test case, which is a cool 25x speedup that will make save exactly $0 ever.
I intend to spend every nanoseconds I saved patting myself on the back and giving myself high-fives.

## Testing for fidelity

I copied all the unit tests from `distribution/reference` (making sure to give attribution).
I also used golang's built-in fuzzer to compare `distribution/reference`'s parsing to the output of a demo command-line program using the rust library.
Running the fuzzer overnight yielded no differences for several billion tests, so I'm pretty confident that `container_image_dist_ref` does exactly what `distribution/reference` does!

<!-- links -->

[ref]: https://github.com/distribution/reference/
[rust-regex]: https://github.com/rust-lang/regex
[no_std]: https://docs.rust-embedded.org/book/intro/no-std.html
[debug_assertions]: https://doc.rust-lang.org/reference/conditional-compilation.html#debug_assertions
[wasm]: https://xeiaso.net/talks/wazero-lightning-2023/
[cgo_blog]: https://blog.arranfrance.com/post/cgo-sqip-rust/
[hooking_rust_from_go]: https://metalbear.co/blog/hooking-go-from-rust-hitchhikers-guide-to-the-go-laxy/
[rustgo]: https://words.filippo.io/rustgo/
[regex_cross_thread]: https://docs.rs/regex/latest/regex/#sharing-a-regex-across-threads-can-result-in-contention
[issues]: https://github.com/skalt/container_image_dist_ref/issues
[oci_digest]: https://github.com/opencontainers/image-spec/blob/v1.0.2/descriptor.md#digests
