# Card details width

## What it is

The opened card is a window beside its minicard. Drag its bottom corner - the
bottom-right corner, or bottom-left in a right-to-left language - to make it
wider or narrower. The width you drag it to is remembered, so every card you
open after that opens at the same width, and an administrator sets the
default width for everybody else.

## Read more

- [Window (computing)](https://en.wikipedia.org/wiki/Window_(computing)) and
  [Responsive web design](https://en.wikipedia.org/wiki/Responsive_web_design)
  on Wikipedia - why the default is a percentage of the window.
- MDN: the CSS [`resize`](https://developer.mozilla.org/en-US/docs/Web/CSS/resize)
  property that draws the corner grip, and
  [custom properties (`--*`)](https://developer.mozilla.org/en-US/docs/Web/CSS/--*),
  which carry the width to the stylesheet.
- [HTTP cookie](https://en.wikipedia.org/wiki/HTTP_cookie) - where a reader
  who is not signed in keeps the width.
- In WeKan: [Cards and minicards](README.md) and
  [Admin Panel / Settings / Appearance](../Admin-Panel/Settings/Appearance.md).

## How to use it

**Make the card wider or narrower**

1. Open a card.
2. Drag the window's bottom corner (bottom-right, or bottom-left in a
   right-to-left language) to the width you want.
3. Every card you open from now on opens at that width. A signed-in user has
   it in their profile, so it follows them to another browser. Somebody
   reading a public board without signing in has it in a cookie of that
   browser.

**Go back to the default width**, do one of these:

- open the card's menu (the hamburger icon at the top of the card, **Card
  Actions**) and choose **Reset width**, which is shown when you have a width
  of your own;
- double-click the resize corner.

**Set the default width, for everyone** (site admin)

1. Open Admin Panel / Settings / **Appearance**.
2. Under **Card details default width**, type a percentage of the browser
   window's width, from 30 to 95. Leave it empty for 520 pixels, which is the
   default.
3. Click **Save**. The width applies until a user drags their own.

A percentage is used because the same people work on a laptop and on a large
screen, and a width in pixels is too wide on one and too narrow on the other.

### Where it applies

| | Uses the remembered or default width |
| --- | --- |
| The card window on a board, beside its minicard | yes |
| A card opened as a popup: Board Table view, search results, a Roadmap bar | yes |
| A maximized card | no - it fills the window |
| The mobile view | no - the card fills the screen |

## How the numbers are calculated

From [models/lib/cardDetailsWidth.js](../../../models/lib/cardDetailsWidth.js),
in this order:

1. **The width you dragged to**: rounded to whole pixels and kept between
   280 (`MIN_USER_PX`) and 10000 (`MAX_USER_PX`) pixels. The CSS width is
   `min(<width>px, calc(100vw - 16px))`.
2. Else **the administrator's percentage**: rounded to a whole number and
   kept between 30 (`MIN_PERCENT`) and 95 (`MAX_PERCENT`). The CSS width is
   `clamp(520px, <percent>vw, calc(100vw - 16px))` - never narrower than 520
   pixels, so a narrow window does not get a tiny card.
3. Else **520 pixels** (`DEFAULT_PX`), the stylesheet's own width.

Whatever it is, the window never gets wider than the browser window less 8
pixels on each side (`calc(100vw - 16px)`). A drag is saved only when the
width changed by 2 pixels or more (`widthChanged`), so a click on the corner
is not a new width. The corner counts as the 20 x 20 pixels at the bottom of
the inline-end side (`HANDLE_PX`, `onResizeHandle`).

## How it works in WeKan

- [models/lib/cardDetailsWidth.js](../../../models/lib/cardDetailsWidth.js)
  (pure, no Meteor or DOM) decides the width: `clampUserWidth`,
  `clampDefaultPercent`, `cardDetailsWidthCss`, `onResizeHandle`,
  `widthChanged`.
- [client/lib/cardDetailsWidthMemory.js](../../../client/lib/cardDetailsWidthMemory.js)
  sets the CSS custom property `--wekan-card-details-width` on the page,
  notices a drag or a double-click of the resize corner, and saves the width:
  with the `setCardDetailsWidth` method for a signed-in user
  (`profile.cardDetailsWidth`, written in
  [server/models/users.js](../../../server/models/users.js)), otherwise in
  the cookie `wekan-card-details-width`
  ([models/users.js](../../../models/users.js)
  `Users.setPublicCardDetailsWidth`). **Reset width** saves `null`, which forgets it.
- [client/components/cards/cardDetails.css](../../../client/components/cards/cardDetails.css)
  reads the property for the floating window and the card opened as a popup.
- The default is the setting `cardDetailsDefaultWidthPercent`
  ([models/settings.js](../../../models/settings.js)), edited in
  [client/components/settings/settingBody.jade](../../../client/components/settings/settingBody.jade)
  and published in
  [server/publications/settings.js](../../../server/publications/settings.js).
- **Reset width** is in the card menu in
  [client/components/cards/cardDetails.jade](../../../client/components/cards/cardDetails.jade),
  shown only when there is a width to forget.
- Tests: [tests/cardDetailsWidth.test.cjs](../../../tests/cardDetailsWidth.test.cjs)
  for the rules, and
  [tests/playwright/specs/card-details-width.e2e.js](../../../tests/playwright/specs/card-details-width.e2e.js),
  which drags the corner in a browser.

## Commits

 - [The card details window remembers the width it is dragged to, and an admin sets the default as a percentage](https://github.com/wekan/wekan/commit/9372148915cff7824b64e06fca337d696e51e3df)
 - [Card windows open directly beside their minicards](https://github.com/wekan/wekan/commit/b97090221823c46754b3eb2ca0325dd58f45be59)
