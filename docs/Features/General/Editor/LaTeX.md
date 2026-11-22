# LaTeX math

## What it is

WeKan renders LaTeX math in any markdown field (card descriptions, comments,
checklists, etc.): write `$\sqrt{2}$` and it shows as a formula. It is meant for
formulas in technical, scientific and school boards.

## Read more

- [LaTeX](https://en.wikipedia.org/wiki/LaTeX) and
  [MathML](https://en.wikipedia.org/wiki/MathML) on Wikipedia.
- [Temml](https://temml.org) and its
  [supported functions](https://temml.org/docs/en/supported);
  [MathML on MDN](https://developer.mozilla.org/docs/Web/MathML);
  [markdown-it-math](https://www.npmjs.com/package/markdown-it-math); the
  [pandoc math syntax](https://pandoc.org/MANUAL.html#math).
- [Original issue](https://github.com/wekan/wekan/issues/4589).
- WeKan pages: [Markdown](Markdown/Markdown.md),
  [Markdown editor](Markdown-Editor.md).

## How to use it

1. Open a card description, a comment or another Markdown field.
2. For inline math, surround your LaTeX with a single `$` on each side, for
   example `$\sqrt{3x-1}+(1+x)^2$`.
3. For a block, use `$$` on each side. This mode uses bigger symbols and
   centers the result. See the examples below.
4. Save. To show a literal `$`, write `\$`.

## How the numbers are calculated

Math has no numbers of its own. A formula that Temml cannot parse is shown in
red (`errorColor: '#cc0000'`, `throwOnError: false`) instead of breaking the
card.

## How it works in WeKan

Math is rendered with [Temml](https://temml.org), which converts LaTeX to
**native [MathML](https://developer.mozilla.org/docs/Web/MathML)**. Modern
browsers display MathML themselves, so no heavy client-side math engine is
shipped in the bundle (`renderMath()` in
[packages/markdown/src/template-integration.js](../../../../packages/markdown/src/template-integration.js)).
The markdown ↔ math bridge is
[markdown-it-math](https://www.npmjs.com/package/markdown-it-math), and the
generated MathML is allow-listed in WeKan's DOMPurify sanitizer (`MATHML_TAGS` in
[packages/markdown/src/secureDOMPurify.js](../../../../packages/markdown/src/secureDOMPurify.js))
so it is not stripped.

Earlier WeKan versions used `markdown-it-mathjax3` (which bundled all of MathJax
and had a "renders twice" bug). Math rendering was then accidentally dropped
during the Meteor 3 refactor and has now been restored on Temml.

- [Original issue](https://github.com/wekan/wekan/issues/4589)

### Examples

[Temml supported functions](https://temml.org/docs/en/supported)

**Inline**

Surround your LaTeX with a single $ on each side for inline rendering.

`$\sqrt{3x-1}+(1+x)^2$`

**Block**

Use two ($$) for block rendering. This mode uses bigger symbols and centers the result.
```
$$\begin{array}{c}

\nabla \times \vec{\mathbf{B}} -\, \frac1c\, \frac{\partial\vec{\mathbf{E}}}{\partial t} &
= \frac{4\pi}{c}\vec{\mathbf{j}}    \nabla \cdot \vec{\mathbf{E}} & = 4 \pi \rho \\

\nabla \times \vec{\mathbf{E}}\, +\, \frac1c\, \frac{\partial\vec{\mathbf{B}}}{\partial t} & = \vec{\mathbf{0}} \\

\nabla \cdot \vec{\mathbf{B}} & = 0

\end{array}$$
```
### Syntax

Math parsing in markdown is designed to agree with the conventions set by pandoc:
```
Anything between two $ characters will be treated as TeX math. The opening $ must
have a non-space character immediately to its right, while the closing $ must
have a non-space character immediately to its left, and must not be followed
immediately by a digit. Thus, $20,000 and $30,000 won’t parse as math. If for some
reason you need to enclose text in literal $ characters, backslash-escape them and
they won’t be treated as math delimiters.
```

## Commits

 - [Temml 0.14.0](https://github.com/wekan/wekan/commit/034e5ea441ae877f7d711eb75efc12029a924e69)
 - [Point the LaTeX code comment to the repository docs](https://github.com/wekan/wekan/commit/f037a219b6846f94005f603042b616e565869ec6)
 - [Migrate LaTeX math from MathJax to Temml (native MathML)](https://github.com/wekan/wekan/commit/32abf5de40eba14cd74199a40847aac9a6c82415)
 - [Added back MathJax](https://github.com/wekan/wekan/commit/f43dadc06894d874281ec0e449dcc4c81b3c59ad)
 - [Removed markdown-it-mathjax3](https://github.com/wekan/wekan/commit/19703fed311c894b61e9269cc0b973d0b0275a6a)
 - [LaTeX in all input fields with markdown-it-mathjax3](https://github.com/wekan/wekan/commit/e81900178e62d36672952a8f0707c5297dcd7767)
