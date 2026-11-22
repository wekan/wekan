# Whiteboard

## What it is

A card's drawing opens full screen as a whiteboard, under the header bar, and
several people can draw on it at the same time. Every line appears on the
whiteboard of everyone who has the drawing open, so a team can sketch together
in a meeting or from different places. The drawing itself is the card's
ordinary [Drawing](Drawing.md); the whiteboard is a bigger, shared way to draw
on it.

## Read more

- Wikipedia: [Whiteboard](https://en.wikipedia.org/wiki/Whiteboard),
  [Interactive whiteboard](https://en.wikipedia.org/wiki/Interactive_whiteboard),
  [Collaborative real-time editor](https://en.wikipedia.org/wiki/Collaborative_real-time_editor)
  and [Scalable Vector Graphics](https://en.wikipedia.org/wiki/Scalable_Vector_Graphics).
- In WeKan: [Drawing](Drawing.md),
  [Red Strings](../General/Editor/RedStrings/RedStrings.md) (the same drawing
  tools) and [Board Settings / Card](../Board-Sidebar/Board-Settings/Card.md).

## How to use it

**Opening it:**

1. Open a card and click the hamburger menu (☰) in its header (**Card
   Actions**).
2. Under **Appearance**, choose **Drawing**. The popup lists the card's saved
   drawings as thumbnails; the drawing being edited is highlighted there.
3. Click **Open as whiteboard** (⤢) beside a drawing's thumbnail. A drawing
   that has not been saved yet is not in the list; save it first.

The whiteboard fills the window below the header bar, so the board's own
menus stay where they are. **×** or the Escape key closes it and returns to
the card.

**Drawing:**

1. Choose a colour and a line width in the toolbar.
2. Draw with the mouse, a pen or a finger. Each line is saved when the pen
   lifts.
3. Use the tools when needed:

| Tool | What it does |
| --- | --- |
| Undo (**Undo the last stroke**) | removes **your** last line |
| Clear (**Clear my lines**) | removes **your** lines; other people's stay |
| **Save picture** | makes the drawing's PNG attachment again from what is on the board |

**Several people at once:** open the same card's drawing as a whiteboard on
each device. Two people can draw at the same moment: a line is added to the
drawing, never written over another one. Who may draw is who may edit the
card; anybody else who can see the card watches the lines appear, without the
tools, and reads **Only those who may edit the card can draw here.**

**Hiding it:**

1. Board sidebar (hamburger menu) → **Board Settings** → **Card**.
2. Untick *Show on Card* in the row **Drawing** - it was called Whiteboard.
3. A site admin hides it on every board from **Admin Panel / Settings /
   Features**, the **Card fields** ticks above the Features **Save**.

The drawing popup works as before when the whiteboard is hidden; only the
**Open as whiteboard** button goes.

## How the numbers are calculated

The whiteboard has no counts of its own; its limits and defaults are
([models/lib/cardDrawing.js](../../../models/lib/cardDrawing.js),
[server/methods/whiteboard.js](../../../server/methods/whiteboard.js)):

- **Tools:** the card drawing's and Red Strings' own: the seven colours
  (`#000000`, `#e53935`, `#1e88e5`, `#43a047`, `#fb8c00`, `#8e24aa`,
  `#ffffff`) and the four line widths (2, 4, 8, 16). A new whiteboard starts
  with black and width 4.
- **Size:** the drawing keeps its own shape - 800 × 500 units unless it was
  resized in the Drawing popup (100 to 4,000 units each way) - and is scaled
  to fill the screen, letterboxed, so a line drawn on a phone lands in the
  same place on a 55" screen. A point is clamped inside the drawing and
  rounded to 0.1 unit.
- **Limits:** a drawing holds at most 2,000 lines and a line at most 5,000
  points; a full drawing refuses a new line.
- **Rate limits per connection:** 60 lines, 30 undos, 10 clears and 10 saved
  pictures per 10 seconds.

## How it works in WeKan

- [models/lib/cardDrawing.js](../../../models/lib/cardDrawing.js) - pure: the
  strokes, now with their author (`whiteboardStroke`, `lastStrokeOf`,
  `MAX_STROKES`).
- [server/methods/whiteboard.js](../../../server/methods/whiteboard.js) - the
  methods `cards.whiteboardAddStroke`, `cards.whiteboardUndo`,
  `cards.whiteboardClear` and `cards.whiteboardSetPicture`. Each finds the
  drawing in the card's `drawings` array, checks the edit right with
  `canEditCardOrLinkedCard` and the board's `allowsWhiteboardOnCard` and the
  Admin Panel card field `whiteboard` with `boardForCardHelper`. A line is ONE
  atomic `$push` into `drawings.$.strokes`; Undo and Clear `$pull` only the
  caller's own lines; Save picture sets only `drawings.$.pngAttachmentId`, so
  lines other people add at the same moment are kept.
- The card's own publication carries every line to everyone, so nothing else
  has to be running.
- Drawn by `cardWhiteboard` in
  [client/components/cards/whiteboard.jade](../../../client/components/cards/whiteboard.jade)
  and [whiteboard.js](../../../client/components/cards/whiteboard.js); the
  **Open as whiteboard** button is in `cardDrawingPopup` in
  [cardDetails.jade](../../../client/components/cards/cardDetails.jade), its
  handler in [cardDrawing.js](../../../client/components/cards/cardDrawing.js).
  The Board Settings / Card row is `whiteboard` in
  [models/lib/cardSettingsRows.js](../../../models/lib/cardSettingsRows.js).
- Tests: [tests/whiteboard.test.cjs](../../../tests/whiteboard.test.cjs) and
  [tests/playwright/specs/whiteboard.e2e.js](../../../tests/playwright/specs/whiteboard.e2e.js),
  which draws with two browsers at once.

## Commits

 - [A line is drawn at its own width, not the whiteboard's 800](https://github.com/wekan/wekan/commit/40f60582b79bd1177672f08060bfba709f07845f)
 - [The drawing grows from its corner, with zoom and any colour](https://github.com/wekan/wekan/commit/d5d027a6f27436eae170164972746c342a8517e9)
 - [Board Settings / Card calls the Whiteboard row Drawing](https://github.com/wekan/wekan/commit/4bea319239eb5e573ab580a11e9c739e83697e97)
 - [A card's drawing full screen, that several people draw on at once](https://github.com/wekan/wekan/commit/390007e380242b633868e38d5e12676bacbf656a)
 - [Draw or write by hand on a card, the drawing the whiteboard opens](https://github.com/wekan/wekan/commit/c772769c0e85b10e57d848842b772e22261641bb)
