# Member Settings / Font

## What it is

**Font** lets each member choose the typeface, the text size and the text color
of the whole WeKan interface for themselves
([#4759](https://github.com/wekan/wekan/issues/4759)). It helps reading: a
larger size, a familiar font, or a color that suits your eyes. The choices are
personal, saved to your profile, and apply at once: there is no Save button.
Every signed-in member sees it.

## Read more

- [Typeface](https://en.wikipedia.org/wiki/Typeface) and
  [Font](https://en.wikipedia.org/wiki/Font) on Wikipedia.
- [WCAG 2.1 Understanding 1.4.3 Contrast (Minimum)](https://www.w3.org/WAI/WCAG21/Understanding/contrast-minimum.html) -
  the 4.5:1 rule the text color follows.
- [Canvas fingerprinting](https://en.wikipedia.org/wiki/Canvas_fingerprinting) -
  the canvas text-width technique, which WeKan uses only to find which fonts
  are installed.
- [Change Color](../Theme/README.md) and
  [Admin Panel / Settings / Accessibility](../Accessibility/Admin-Panel-Settings.md).

## How to use it

1. Click your username or avatar at the top right, then **Font**.
2. Under **Font**, click **Default (no custom font)** or one of the font
   buttons. Each button is shown in its own font; only fonts this browser has
   installed are offered.
3. Check the preview line (*The quick brown fox jumps over the lazy dog
   0123456789*); it uses the chosen font, size and text color.
4. Under **Font size**, click Smaller, Small, Default, Large, Larger or Largest.
5. Under **Text color**, pick a color on the color wheel, or click **Remove** to
   go back to the theme's color. When WeKan had to adjust the color to make it
   readable on the current theme, the popup shows the color actually used.

## How the numbers are calculated

- **Font sizes** (`UI_FONT_SIZES` in
  [models/lib/uiFonts.js](../../../models/lib/uiFonts.js)): Smaller 80 %,
  Small 90 %, Default 100 %, Large 115 %, Larger 130 %, Largest 150 %. The
  percent divided by 100 becomes the CSS variable `--wekan-ui-font-scale`
  (`fontScaleValue()`), and every px font size and line height in the
  stylesheets is written `calc(Npx * var(--wekan-ui-font-scale, 1))`, so all of
  the text scales. Default sets no variable (scale 1).
- **Fonts:** the curated list `UI_FONTS` has 29 fonts. A font is offered when
  drawing a probe string in it on a canvas gives a different width than the
  generic base font
  ([client/lib/fontDetector.js](../../../client/lib/fontDetector.js)).
- **Text color contrast: 4.5:1.** `readableUiTextColor()` in
  [models/lib/uiFonts.js](../../../models/lib/uiFonts.js) keeps the chosen hue
  and lightens or darkens it by the smallest step that reaches a 4.5:1
  contrast ratio (`ensureContrast()` in `models/lib/contrastColor.js`) against
  every surface of the theme in use: five light greys (`#cccccc` ... `#ffffff`)
  for light themes, six dark ones (`#222222` ... `#545454`) for the four themes
  with a dark board (`cleandark`, `moderndark`, `dark`, `exodark`). Only a
  6-digit hex color is accepted.

## How it works in WeKan

- **Popup:** `changeFontPopup` in
  [client/components/users/userHeader.jade](../../../client/components/users/userHeader.jade)
  and [userHeader.js](../../../client/components/users/userHeader.js). The
  font, scale and color are applied to the page by
  [client/components/main/uiFont.js](../../../client/components/main/uiFont.js).
- **Methods** in [server/models/users.js](../../../server/models/users.js):
  `setUiFont` (refuses a font not in `UI_FONTS`, so an arbitrary string never
  reaches a CSS `font-family`), `setUiFontSize` (refuses an unknown size key)
  and `setUiColors` (saves only a 6-digit hex color). They store
  `profile.uiFont`, `profile.uiFontSize` and `profile.uiTextColor`.
- **Tests:** [tests/uiFonts.test.cjs](../../../tests/uiFonts.test.cjs) and
  [tests/cjkFontLocale.test.cjs](../../../tests/cjkFontLocale.test.cjs).

## Commits

 - [every color a member chooses is readable on the theme](https://github.com/wekan/wekan/commit/8b2114cd0f9501867c01521c7a6f78a02e44d549)
 - [Text background color removed from Font](https://github.com/wekan/wekan/commit/b77a1663d80cb3ee5d876c491da8508ca5f403bc)
 - [Font size moves all of the text, not only the part written in rem](https://github.com/wekan/wekan/commit/d5b69137cc3090e5b0ca503d1a516b6518d401c7)
 - [a board's text follows the Font size too](https://github.com/wekan/wekan/commit/f7b0a4d1d20bffcc5aaf68795864c76389d20d6e)
 - [custom text color](https://github.com/wekan/wekan/commit/22c7d5376bcf7990890c7254c80c1e2dfd9e419c)
 - [pick an installed font and a preset size](https://github.com/wekan/wekan/commit/3c9524f61a43cbf92f856f0fb2ff1f9b291d4e05)
