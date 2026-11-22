# List menu / Set Color

## What it is

List menu (☰ in the list header) → **Set Color** opens **Choose a color**
(`setListColorPopup` in `client/components/lists/listHeader.jade`). It gives
the list header a colour, from the palette or any custom colour, and can let
the list's cards that have no colour of their own be shown in it, so stages
of the work are easy to tell apart.

## Read more

- [Web colors](https://en.wikipedia.org/wiki/Web_colors) on Wikipedia - named
  colours and `#rrggbb` hex values.
- [`<input type="color">`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input/color)
  on MDN - the browser's colour wheel used for **Custom color**.
- [WCAG 2.1 contrast (minimum)](https://www.w3.org/TR/WCAG21/#contrast-minimum) -
  why a custom colour gets a readable text colour.
- WeKan: [Card menu / Set color](../Cards/Set-Color.md),
  [Swimlane menu / Select Color](../Swimlanes/Select-Color.md).

## How to use it

Who sees it: the entry is shown to a board member who is not **Comment
only**, **Read only**, **Read assigned only** or **Worker**. The list menu
itself is not shown to the first three of those roles.

1. Click ☰ (**List Actions**) in the list header → **Set Color** (under
   **Edit**).
2. In **Choose a color**, use the controls:

   | Control | What it does |
   | --- | --- |
   | Palette | picks one of the named colours (`LIST_COLORS`, `models/metadata/colors.js`); the current one has a check mark, and a list without a colour shows **white** as selected |
   | **Custom color** | the browser's colour wheel; the chosen `#rrggbb` value is kept as a custom colour ([#5514](https://github.com/wekan/wekan/issues/5514)) |
   | **Cards without a colour of their own use this colour** | a checkbox ([#4756](https://github.com/wekan/wekan/issues/4756)), see below |
   | **Save** | saves the colour and the checkbox together |
   | **Remove** | removes the list's colour |

3. Click **Save**, or **Remove** to clear the colour.

### What it changes

- The colour is saved on the list (`list.color`, `setColor` in
  `models/lists.js`). A value that is neither a palette colour nor a valid hex
  colour is saved as no colour.
- The list header is drawn in that colour: a palette colour by its CSS class,
  a custom colour inline with a readable text colour.
- With the checkbox on (`list.cardsUseListColor`), a card that has no colour
  of its own is shown in the list's colour. Nothing is written to the card:
  dragging it to another list changes the colour it is shown in. A card's own
  colour always wins, and a list coloured white counts as no colour
  (`models/lib/cardDisplayColor.js`).

Changing a list's colour is not one of the writes a
[list permission](List-Permissions.md) exception refuses.

## How the numbers are calculated

- The palette has 26 named colours (`ALLOWED_COLORS` in
  [config/const.js](../../../config/const.js), copied to `LIST_COLORS`).
- A custom colour must be a 6-digit hex value `#rrggbb` (`isHexColor` in
  [models/lib/contrastColor.js](../../../models/lib/contrastColor.js)); the
  same module picks the readable text colour for it.
- The colour a card is shown in (`effectiveCardColor`): the card's own colour
  when it has one; otherwise the list's colour when the checkbox is on and the
  list's colour is set and not white; otherwise none.

## How it works in WeKan

- Popup: `setListColorPopup` in
  [client/components/lists/listHeader.jade](../../../client/components/lists/listHeader.jade);
  its helpers and events (`setColor`, `setCardsUseListColor`) in
  [listHeader.js](../../../client/components/lists/listHeader.js).
- Model: `normalizeListColor` and `setColor` in
  [models/lists.js](../../../models/lists.js); fields `color` and
  `cardsUseListColor`.
- Card display colour: [models/lib/cardDisplayColor.js](../../../models/lib/cardDisplayColor.js).
- Tests: [tests/cardDisplayColor.test.cjs](../../../tests/cardDisplayColor.test.cjs),
  [server/lib/tests/listColor.tests.js](../../../server/lib/tests/listColor.tests.js).

## Commits

 - [a list colours the cards that have no colour of their own (#4756)](https://github.com/wekan/wekan/commit/998a9cc33649269029f27305b2b0fea77aa8e08d)
 - [custom colour wheel with readable text contrast (#5514)](https://github.com/wekan/wekan/commit/30f36a7f319675bd3aac7a4ba0700427000726b9)
 - [silver no longer saved as None (#5382)](https://github.com/wekan/wekan/commit/6f8543322294dff7e27eaef30719fa7878b6770a)
 - [per-list colour added](https://github.com/wekan/wekan/commit/d0a9d8c581f9356f5e72ccb698fc3963c59e96cd)
