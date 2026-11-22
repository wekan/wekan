# Card details width

The opened card is a window beside its minicard. Drag its bottom corner - the
bottom-right corner, or bottom-left in a right-to-left language - to make it
wider or narrower.

## The width is remembered

The width you drag the window to is kept for you. Every card you open after
that opens at the same width, and the window never gets wider than the
browser window. A signed-in user has it in their profile, so it follows them
to another browser. Somebody reading a public board without signing in has it
in a cookie of that browser.

To go back to the default width, do one of these:

- open the card's menu (the hamburger icon at the top of the card) and choose
  **Reset width**, which is shown when you have a width of your own;
- double-click the resize corner.

## The default width, for everyone

Admin Panel / Settings / Appearance / **Card details default width** sets the
width a card opens at until a user drags their own. It is a percentage of the
browser window's width, from 30 to 95, because the same people work on a
laptop and on a large screen, and a width in pixels is too wide on one and too
narrow on the other. The card is never narrower than 520 pixels, so that a
narrow window does not get a tiny card. Leave it empty for 520 pixels, which
is the default.

## Where it applies

| | Uses the remembered or default width |
| --- | --- |
| The card window on a board, beside its minicard | yes |
| A card opened as a popup: Board Table view, search results, a Roadmap bar | yes |
| A maximized card | no - it fills the window |
| The mobile view | no - the card fills the screen |

For developers: `models/lib/cardDetailsWidth.js` decides the width and is
tested by `tests/cardDetailsWidth.test.cjs`. `client/lib/cardDetailsWidthMemory.js`
sets the CSS custom property `--wekan-card-details-width`, which
`client/components/cards/cardDetails.css` reads, and notices a drag of the
resize corner. `tests/playwright/specs/card-details-width.e2e.js` drags the
corner in a browser.
