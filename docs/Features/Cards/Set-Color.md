# Card menu / Set color

## What it is

**Set color** gives one card a background colour of its own, so it stands out
on the board: urgent work in red, a customer's cards in their colour, or any
meaning the team agrees on. The colour is either one of WeKan's named colours
or any custom colour picked from the colour wheel, and the card's text is made
readable on it automatically.

## Read more

- Wikipedia: [Web colors](https://en.wikipedia.org/wiki/Web_colors),
  [RGB color model](https://en.wikipedia.org/wiki/RGB_color_model) and
  [Contrast (vision)](https://en.wikipedia.org/wiki/Contrast_(vision)).
- [WCAG 2.1, Contrast (Minimum)](https://www.w3.org/TR/WCAG21/#contrast-minimum),
  the rule the text colour follows.
- [MDN: `<input type="color">`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input/color),
  the browser's colour wheel used for **Custom color**.
- In WeKan: [List menu / Set Color](../Lists/Set-Color.md),
  [Multi-Selection](../General/Multi-Selection.md) and
  [Board Settings / Card](../Board-Sidebar/Board-Settings/Card.md).

## How to use it

1. Open the card and click the card menu (☰ in the opened card's header,
   **Card Actions**).
2. Under **Appearance**, choose **Set color**. This opens the card's colour
   popup (`setCardColorPopup` in
   [client/components/cards/cardDetails.jade](../../../client/components/cards/cardDetails.jade)).
3. Click a colour of the palette, one of the custom swatches, or pick one
   under **Custom color**.
4. Click **Save**. **Remove** takes the card's colour away.

| Control | What it does |
| --- | --- |
| Palette | the named colours (`ALLOWED_COLORS`) except white; the current one has a check mark |
| Custom swatches | the custom `#rrggbb` colours already used by cards of this board |
| **Custom color** | the browser's colour wheel ([#5514](https://github.com/wekan/wekan/issues/5514)) |
| **Save** | saves the chosen colour on the card |
| **Remove** | removes the card's colour |

**Who sees it:** somebody who may change the card (`canModifyCard`, which
includes the card's [list permission](../Lists/List-Permissions.md)), and who
is not a **Worker**.

**Where it shows:** on the minicard and in the opened card's header, unless
**Card color** is turned off for that place in
[Board Settings / Card](../Board-Sidebar/Board-Settings/Card.md)
(`allowsCardColorOnMinicard`, `allowsCardColorOnCard`).

A card without a colour of its own can be shown in its list's colour; see
[List menu / Set Color](../Lists/Set-Color.md). The card's own colour always
wins.

Several cards can be coloured at once from
[Multi-Selection](../General/Multi-Selection.md).

## How the numbers are calculated

- **Palette:** the 25 named colours of `ALLOWED_COLORS` in
  [config/const.js](../../../config/const.js) less white, so 24 swatches.
  Choosing white, or **Remove**, stores no colour (`setColor` in
  [models/cards.js](../../../models/cards.js) writes `null`).
- **Custom swatches** (`customColorsInUse` in
  [models/lib/contrastColor.js](../../../models/lib/contrastColor.js)): the
  `#rrggbb` colours of the board's non-archived cards, lower-cased, at most
  12, the most used first and equal counts in the order first seen.
- **Colour wheel:** opens at the card's current colour as hex, or `#0079bf`
  when it has none.
- **Text colour on a custom colour** (`contrastText`): the background's WCAG
  relative luminance `0.2126 R + 0.7152 G + 0.0722 B` (each channel
  linearized from sRGB); above 0.179 the text is black (`#000000`), otherwise
  white (`#ffffff`). 0.179 is where black and white text have the same
  contrast ratio.
- **Shown colour** (`effectiveCardColor` in
  [models/lib/cardDisplayColor.js](../../../models/lib/cardDisplayColor.js)):
  the card's own colour; else the list's colour when the list says so and it
  is not white; else none.

## How it works in WeKan

- The card's `color` field ([models/cards.js](../../../models/cards.js))
  accepts a named colour or a strict `#rrggbb` hex (`isAllowedCardColor`);
  anything else is refused by the schema. `colorClass()` gives a named colour
  its CSS class, `colorStyle()` sets a custom one inline with its readable text
  colour.
- The popup is `setCardColorPopup` and the shared `customCardColorSwatches` in
  [client/components/cards/cardDetails.jade](../../../client/components/cards/cardDetails.jade),
  with its helpers and events in
  [cardDetails.js](../../../client/components/cards/cardDetails.js);
  **Save** calls `card.setColor`, which writes the real card of a linked card.
- Tests: [tests/contrastColor.test.cjs](../../../tests/contrastColor.test.cjs),
  [tests/customColorContrast.test.cjs](../../../tests/customColorContrast.test.cjs),
  [tests/cardDisplayColor.test.cjs](../../../tests/cardDisplayColor.test.cjs),
  [tests/multiSelectionCustomColor.test.cjs](../../../tests/multiSelectionCustomColor.test.cjs)
  and [tests/playwright/specs/multiselection-custom-color.e2e.js](../../../tests/playwright/specs/multiselection-custom-color.e2e.js).

## Commits

 - [Every board theme and every colour a member chooses is readable](https://github.com/wekan/wekan/commit/8b2114cd0f9501867c01521c7a6f78a02e44d549)
 - [Set color sits under the Appearance heading of the card menu](https://github.com/wekan/wekan/commit/0d8f8b8d96b868a6d75b803ef105e50aad450977)
 - [The card actions menu in the maintainer's order](https://github.com/wekan/wekan/commit/65621f44cc03db9b2b98276ffd2c7bed8590b2fd)
 - [A list colours the cards that have no colour of their own](https://github.com/wekan/wekan/commit/998a9cc33649269029f27305b2b0fea77aa8e08d)
 - [Custom card colour on all selected cards, and the board's custom swatches](https://github.com/wekan/wekan/commit/fdfa94321278b7d46eacec54340c7845d7efbd1e)
 - [Board Settings / Card rows for the card colour on the card and the minicard](https://github.com/wekan/wekan/commit/8d30e4fdbc2fc48513e2125a7030a94dae57694e)
 - [Colour wheel for a custom RGB / hex card colour, with readable text](https://github.com/wekan/wekan/commit/30f36a7f319675bd3aac7a4ba0700427000726b9)
 - [Fix Set Color of swimlane, list and card](https://github.com/wekan/wekan/commit/0630d62ad0a02d80ab77436ce9797e4390c5cae2)
 - [Changing the card colour closes the popup without reloading the board](https://github.com/wekan/wekan/commit/45c2f1007baca3e8cf12c2a2a5cc1fb16c8ee9ba)
 - [Removing the card colour closes the popup](https://github.com/wekan/wekan/commit/4acf3738caf3afdc0c3e35fabbe10ef8b9397d8b)
 - [The card colour no longer reloads the board](https://github.com/wekan/wekan/commit/a686a18809e1515d04fc2865b6128acc049ff270)
 - [Changing a card colour no longer reloads the whole page](https://github.com/wekan/wekan/commit/3546d7aa02bc65cf1183cb493adeb543ba51945d)
