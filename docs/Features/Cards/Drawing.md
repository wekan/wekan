# Drawing

Draw or write by hand on a card, with a mouse, a finger or a pen (#1178, #6802).

## Opening it

- **Card hamburger menu → Drawing** - the card's drawings, a new one, and each
  saved drawing's **Open as whiteboard** ([Whiteboard.md](Whiteboard.md)).
- **Add attachment → Drawing** - a new drawing on the whole window, saved as an
  **SVG attachment** of the card.
- **Add Card → Search / Template / Drawing / More options** - Drawing is shown
  while the text adds ONE card: the card is added, opened, and a new drawing
  starts on the whole window, saved as an SVG attachment of the new card.

The Drawing popup moves by its title bar or the drag handle beside the title,
and has the opened card's maximize / minimize button. Maximized it fills the
window; minimizing puts it back where it was. A popup left maximized opens
maximized again.

The drawing area takes all the room the popup has: a new drawing is as wide and
high as that room. The handle at its bottom-right corner makes it larger (or
smaller, never cutting off a line), and the magnifier buttons show it larger or
smaller on the screen, scrolling when it no longer fits. A drawing keeps its
size when saved; drawings made before this are 800 x 500.

## Drawing

Seven colours and any custom colour, four line widths, **Undo** (steps back through every change: a
line, an erase, a move, a resize, a grouping, a layer change - and then takes
away the last line), the **Eraser** (takes away every line it touches) and
**Clear** (all lines). **Save** keeps the lines
on the card, so the drawing can be edited later, and stores the picture as an
attachment: a PNG for a drawing from the card menu, an SVG for a new drawing.

**Palm rejection:** once a pen has drawn, a touch does not, so a hand resting on
a tablet leaves no marks. While one pointer draws, no other one starts a line.

**Save** is above the drawing, at the end of the tools. A **new** drawing
becomes the card's **cover image**; saving changes to an existing drawing
leaves the cover as it is.

## Colours

Clicking a colour picks it and opens the **colour wheel** (hue around it,
saturation from the centre), a **Brightness** slider and the **HTML colour
code** (`#rrggbb`). **Add to colours** puts the colour beside the palette, for
the next drawing too; **Remove colour** takes a custom one away. Signed in, the
custom colours are kept with the account (`profile.drawingColors`, the
`setDrawingColors` method), so they are there in every browser; drawing on a
public board without signing in, they are kept in this browser. The **eyedropper** picks a colour from anywhere on the screen where
the browser can (Chrome, Edge); elsewhere it takes the colour of the line
clicked in the drawing. Only `#rrggbb` is ever stored, so a colour never
becomes anything else in the SVG.

## The lasso

The **Lasso** tool selects the lines drawn around: a loop selects every line
that lies wholly inside it. The selection is shown in a dashed box, and:

- **moves** together, dragged from inside the box - stopping at the edge of the
  drawing, keeping its shape;
- **resizes** by the handle at the box's bottom-right corner, from its top-left
  corner, line widths too (to the nearest of the four);
- **Group** makes the selection one: selecting any of its lines selects all of
  them, and the group is saved with the drawing. **Ungroup** takes it apart;
- **Bring to front**, **Bring forward**, **Send backward** and **Send to back**
  change which lines are drawn over which - all the way, or one line at a time.

A move or a resize is one Undo step. Pressing the Lasso again goes back to the
pen.

## Board Settings / Card

The **Drawing** row (*Show on Card*) shows or hides **Open as whiteboard**.

## SVG files

SVG is an image like any other: an attachment, a card cover, a board
background, an avatar. Every uploaded SVG is sanitized on the server before it is
stored - no script, event handler, `javascript:` URI, `foreignObject` or
DOCTYPE/ENTITY XML loop - and sanitized again, whole, whenever it is served,
under a Content-Security-Policy with no script and `sandbox`, so it runs nothing
even opened directly. Both are streamed through one tokenizer,
`models/lib/svgSanitizer.js`, so an SVG of any size is sanitized whole, with
bounded memory. Uploads used to be refused after JVN#74210258;
`server/lib/svgResponse.js`, `tests/svgServing.test.cjs` and
`tests/svgSanitizerStreaming.test.cjs` are where it is now handled and checked.

## Implementation

`client/components/cards/cardDrawing.js` (the popup), `client/lib/newDrawing.js`
(opening a new drawing), `models/lib/cardDrawing.js` (lines, the eraser, palm
rejection and the lasso's selection, moving, resizing, groups and layer order,
pure), `client/components/main/popup.js` (moving and maximizing).
Tests: `tests/cardDrawingPen.test.cjs`, `tests/cardDrawingLasso.test.cjs`,
`tests/cardDrawingCanvasColors.test.cjs`, `tests/popupMoveMaximize.test.cjs`,
`tests/svgServing.test.cjs` and the Playwright specs `card-drawing-pen.e2e.js`,
`card-drawing-lasso.e2e.js`, `card-drawing-canvas.e2e.js`,
`popup-drawing-window.e2e.js` and `svg-attachment.e2e.js`.
