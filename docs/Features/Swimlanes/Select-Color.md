# Swimlane menu / Select Color

## What it is

Swimlane menu (☰ in the swimlane header) → **Select Color** opens **Choose a
color** (`setSwimlaneColorPopup` in
`client/components/swimlanes/swimlaneHeader.jade`). It gives a swimlane's
header a colour, so lanes for different teams or kinds of work can be told
apart at a glance. Besides the named palette colours, any colour can be picked
from the browser's colour wheel, and the header text is then made readable on
it automatically.

## Read more

- [Web colors](https://en.wikipedia.org/wiki/Web_colors) - the named colours
  and the `#rrggbb` hex notation, on Wikipedia.
- [Relative luminance](https://en.wikipedia.org/wiki/Relative_luminance) and
  the [WCAG 2.1 definition](https://www.w3.org/TR/WCAG21/#dfn-relative-luminance)
  that the readable text colour is computed from.
- [`<input type="color">`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input/color)
  on MDN - the colour wheel the **Custom color** control uses.
- In WeKan: [List menu / Set Color](../Lists/Set-Color.md),
  [Swimlanes](Swimlanes.md).

## How to use it

1. Open the board in the **Swimlanes** view.
2. Click ☰ (**Swimlane Actions**) in the swimlane header.
3. Under **Appearance**, choose **Select Color**. The popup **Choose a color**
   opens.
4. Click one of the palette colours (the current one has a check mark), or
   pick any colour with **Custom color**.
5. Click **Save**. To take the colour away again, open the popup and click
   **Remove**.

### Who sees it

Only a **board admin**. The swimlane menu itself is shown to a board member
who is not **Comment only**, **Read only**, **Read assigned only** or
**Worker**.

### The popup

| Control | What it does |
| --- | --- |
| Palette | picks one of the named colours (`SWIMLANE_COLORS`, `models/metadata/colors.js`); the current one has a check mark |
| **Custom color** | the browser's colour wheel; the chosen `#rrggbb` value is kept as a custom colour ([#5514](https://github.com/wekan/wekan/issues/5514)) |
| **Save** | saves the chosen colour |
| **Remove** | removes the swimlane's colour |

## How the numbers are calculated

- **The palette** has 25 named colours, the `ALLOWED_COLORS` of
  [config/const.js](../../../config/const.js) (white, green, yellow, orange,
  red, purple, blue, sky, lime, pink, black, silver, peachpuff, crimson, plum,
  darkgreen, slateblue, magenta, gold, navy, gray, saddlebrown, paleturquoise,
  mistyrose, indigo).
- **A custom colour** must be a full six-digit `#rrggbb` hex value
  (`isHexColor` in
  [models/lib/contrastColor.js](../../../models/lib/contrastColor.js)).
- **The text colour on a custom colour** is `contrastText()` in the same file:
  each sRGB channel `c = value / 255` is linearized (`c / 12.92` when
  `c <= 0.03928`, otherwise `((c + 0.055) / 1.055) ^ 2.4`), the relative
  luminance is `0.2126 R + 0.7152 G + 0.0722 B`, and the text is black
  (`#000000`) when the luminance is above `0.179`, otherwise white
  (`#ffffff`). 0.179 is the luminance at which black and white text have the
  same WCAG contrast ratio.

## How it works in WeKan

- The colour is saved on the swimlane (`swimlane.color`, `setColor` in
  [models/swimlanes.js](../../../models/swimlanes.js)). A value that is neither
  a palette colour nor a valid hex colour is saved as no colour
  (`normalizeListColor` in [models/lists.js](../../../models/lists.js)); the
  schema's `custom()` check refuses anything else.
- The swimlane header is drawn in that colour: a palette colour by its
  `swimlane-<name>` CSS class, a custom colour inline with a readable text
  colour (`colorClass`, `colorStyle`).
- The popup is `setSwimlaneColorPopup` in
  [client/components/swimlanes/swimlaneHeader.jade](../../../client/components/swimlanes/swimlaneHeader.jade)
  and `.js`; the menu entry is inside the `currentUser.isBoardAdmin` check.
- Tests: [tests/contrastColor.test.cjs](../../../tests/contrastColor.test.cjs),
  [tests/customColorContrast.test.cjs](../../../tests/customColorContrast.test.cjs),
  [tests/listSwimlaneColorSubpath.test.cjs](../../../tests/listSwimlaneColorSubpath.test.cjs).

Unlike [List menu / Set Color](../Lists/Set-Color.md) there is no option for
cards to follow the swimlane's colour.

## Commits

 - [Group the swimlane menu; Select Color sits under Appearance](https://github.com/wekan/wekan/commit/0d8f8b8d96b868a6d75b803ef105e50aad450977)
 - [Every board theme and every chosen colour is readable](https://github.com/wekan/wekan/commit/8b2114cd0f9501867c01521c7a6f78a02e44d549)
 - [Custom colour wheel with automatic readable text contrast](https://github.com/wekan/wekan/commit/30f36a7f319675bd3aac7a4ba0700427000726b9)
 - [Setting a swimlane colour to silver no longer saves it as None](https://github.com/wekan/wekan/commit/6f8543322294dff7e27eaef30719fa7878b6770a)
 - [The importer validates swimlane colours against the allowed values](https://github.com/wekan/wekan/commit/5eeedf8744ce344e5258a2c26698b9af66c78142)
 - [Fix Set Color of swimlane, list and card](https://github.com/wekan/wekan/commit/0630d62ad0a02d80ab77436ce9797e4390c5cae2)
 - [Changing a swimlane colour no longer reloads the page](https://github.com/wekan/wekan/commit/ecf2418347cae4329deb292b534f68eb099d3f90)
 - [Do not leave silver unset in the swimlane CSS](https://github.com/wekan/wekan/commit/7fd894f33d4174ee7bf0b242b400c908285ec38c)
 - [Import each swimlane colour from a WeKan export](https://github.com/wekan/wekan/commit/d03a7e7a98e38cf051bcb699aff6d5b9ceb56c36)
 - [Add colours to swimlanes](https://github.com/wekan/wekan/commit/03efeaeb1abae0c8c39ad5644d44bad36f415d99)
