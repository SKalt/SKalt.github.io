---
title: you can take the derivative of a regular expression?!
link: https://jvns.ca/blog/2016/04/24/how-regular-expressions-go-fast/
date: 2016-04-24
---

> But we can describe some of the ideas in words. Let's say we have a regular expression which is supposed to match the strings ('a', 'abab', 'aaaabb', 'bbc').
>
> The derivative of those strings with respect to `'a'` is ('', 'bab', 'aaabb') – you strip off the `a` from every string.
>
> It turns out (which is not totally obvious to me, but I think if you go through all the cases it's not too bad) that you can take the derivative of any regular expression in a pretty straightforward way – like if you have `(a+)|(b+)`, the derivative with respect to `a` is `(a+)`. These derivatives turn out to combine in nice ways which is I guess why they are called derivatives.

Generally, I think this means you can fashion a RegExp matching library out of a simple recursive descent parser:

1. take the first letter of the string
2. take the derivative of the regular expression with respect to that letter
3. recur with the rest of the string and the derivative of the original RegExp

This post later lead me to reading up on [Brzozowski derivatives][wiki], which in turn pointed me towards [Parsing with Derivatives][pwd-11].

<!-- links -->

[wiki]: https://en.wikipedia.org/wiki/Brzozowski_derivative
[pwd-11]: https://dl.acm.org/doi/abs/10.1145/2034574.2034801
