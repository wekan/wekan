# Drawing

Draw or write by hand on a card, with a mouse, a finger or a pen (#1178, #6802).

## Opening it

- **Card hamburger menu → Drawing** - the card's drawings, a new one, and each
  saved drawing's **Open as whiteboard** ([Whiteboard.md](Whiteboard.md)).
- **Add attachment → Drawing** - a new drawing on the whole window, saved as an
  **SVG attachment** of the card.
- **Add Card → Drawing** - shown while the text adds ONE card: the card is
  added, opened, and a new drawing starts on the whole window, saved as an SVG
  attachment of the new card.

The Drawing popup moves by its title bar or the drag handle beside the title,
and has the opened card's maximize / minimize button. Maximized it fills the
window; minimizing puts it back where it was. A popup left maximized opens
maximized again. The drawing keeps its 800 x 500 shape, so the line lands under
the pen.

## Drawing

Seven colours, four line widths, **Undo** (the last line), the **Eraser** (takes
away every line it touches) and **Clear** (all lines). **Save** keeps the lines
on the card, so the drawing can be edited later, and stores the picture as an
attachment: a PNG for a drawing from the card menu, an SVG for a new drawing.

**Palm rejection:** once a pen has drawn, a touch does not, so a hand resting on
a tablet leaves no marks. While one pointer draws, no other one starts a line.

## Board Settings / Card

The **Drawing** row (*Show on Card*) shows or hides **Open as whiteboard**.

## SVG files

SVG is an image like any other: an attachment, a card cover, a board
background, an avatar. Every uploaded SVG is sanitized on the server before it is
stored - no script, event handler, `javascript:` URI, `foreignObject` or
DOCTYPE/ENTITY XML loop - and sanitized again, whole, whenever it is served,
under a Content-Security-Policy with no script and `sandbox`, so it runs nothing
even opened directly. An SVG larger than 8 MB is a download. Uploads used to be
refused after JVN#74210258; `server/lib/svgResponse.js` and
`tests/svgServing.test.cjs` are where it is now handled and checked.

## Implementation

`client/components/cards/cardDrawing.js` (the popup), `client/lib/newDrawing.js`
(opening a new drawing), `models/lib/cardDrawing.js` (lines, the eraser and palm
rejection, pure), `client/components/main/popup.js` (moving and maximizing).
Tests: `tests/cardDrawingPen.test.cjs`, `tests/popupMoveMaximize.test.cjs`,
`tests/svgServing.test.cjs` and the Playwright specs `card-drawing-pen.e2e.js`,
`popup-drawing-window.e2e.js` and `svg-attachment.e2e.js`.
