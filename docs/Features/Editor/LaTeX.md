# LaTeX math

WeKan renders LaTeX math in any markdown field (card descriptions, comments,
checklists, etc.).

## How it works

Math is rendered with [Temml](https://temml.org), which converts LaTeX to
**native [MathML](https://developer.mozilla.org/docs/Web/MathML)**. Modern
browsers display MathML themselves, so no heavy client-side math engine is
shipped in the bundle. The markdown ↔ math bridge is
[markdown-it-math](https://www.npmjs.com/package/markdown-it-math), and the
generated MathML is allow-listed in WeKan's DOMPurify sanitizer so it is not
stripped.

Earlier WeKan versions used `markdown-it-mathjax3` (which bundled all of MathJax
and had a "renders twice" bug). Math rendering was then accidentally dropped
during the Meteor 3 refactor and has now been restored on Temml.

- [Original issue](https://github.com/wekan/wekan/issues/4589)

## Examples

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
## Syntax

Math parsing in markdown is designed to agree with the conventions set by pandoc:
```
Anything between two $ characters will be treated as TeX math. The opening $ must
have a non-space character immediately to its right, while the closing $ must
have a non-space character immediately to its left, and must not be followed
immediately by a digit. Thus, $20,000 and $30,000 won’t parse as math. If for some
reason you need to enclose text in literal $ characters, backslash-escape them and
they won’t be treated as math delimiters.
```