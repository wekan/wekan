# Drawing

## What it is

Draw or write by hand on a card, with a mouse, a finger or a pen
([#1178](https://github.com/wekan/wekan/issues/1178),
[#6802](https://github.com/wekan/wekan/issues/6802)). A drawing is kept on the
card as its lines, so it can be opened and edited again, and its picture is
saved as an attachment of the card - a sketch, a diagram, a signature or a
handwritten note beside the card's text.

## Read more

- [Digital ink](https://en.wikipedia.org/wiki/Digital_ink),
  [Stylus (computing)](https://en.wikipedia.org/wiki/Stylus_(computing)) and
  [Palm rejection](https://en.wikipedia.org/wiki/Palm_rejection) on Wikipedia.
- [SVG](https://en.wikipedia.org/wiki/SVG) and
  [PNG](https://en.wikipedia.org/wiki/PNG) - the two formats a drawing is saved
  as.
- [HSL and HSV](https://en.wikipedia.org/wiki/HSL_and_HSV) (the colour wheel),
  [Web colors](https://en.wikipedia.org/wiki/Web_colors) (the HTML colour code),
  [Lasso tool](https://en.wikipedia.org/wiki/Lasso_tool),
  [Point in polygon](https://en.wikipedia.org/wiki/Point_in_polygon) and
  [Z-order](https://en.wikipedia.org/wiki/Z-order) (front and back).
- In WeKan: [Whiteboard](Whiteboard.md), [Cover](Cover/README.md), [Attachments](Attachments/README.md).

## How to use it

**Opening it**

- **Card hamburger menu → Drawing** (under **Appearance**) - the card's
  drawings, a new one, and each saved drawing's **Open as whiteboard**
  ([Whiteboard.md](Whiteboard.md)). It is shown to members who may change the
  card and are not a Worker.
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

**Drawing**

1. Pick a colour and a line width, and draw.
2. **Undo** steps back through every change: a line, an erase, a move, a
   resize, a grouping, a layer change - and then takes away the last line.
3. The **Eraser** takes away every line it touches; **Clear** takes away all
   lines.
4. **Save** keeps the lines on the card, so the drawing can be edited later, and
   stores the picture as an attachment: a PNG for a drawing from the card menu,
   an SVG for a new drawing. **Download as SVG** saves the drawing as a file.

There are seven colours and any custom colour, and four line widths.

**Palm rejection:** once a pen has drawn, a touch does not, so a hand resting on
a tablet leaves no marks. While one pointer draws, no other one starts a line.

**Save** is above the drawing, at the end of the tools. A **new** drawing
becomes the card's **cover image**; saving changes to an existing drawing
leaves the cover as it is.

### Colours

Clicking a colour picks it and opens the **colour wheel** (hue around it,
saturation from the centre), a **Brightness** slider and the **HTML colour
code** (`#rrggbb`). **Add to colours** puts the colour beside the palette, for
the next drawing too; **Remove colour** takes a custom one away. Signed in, the
custom colours are kept with the account (`profile.drawingColors`, the
`setDrawingColors` method), so they are there in every browser; drawing on a
public board without signing in, they are kept in this browser. The
**eyedropper** picks a colour from anywhere on the screen where the browser can
(Chrome, Edge); elsewhere it takes the colour of the line clicked in the
drawing. Only `#rrggbb` is ever stored, so a colour never becomes anything else
in the SVG.

### The lasso

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

### Board Settings / Card

The **Drawing** row (*Show on Card*) shows or hides **Open as whiteboard**. It
is on by default.

## How the numbers are calculated

All from [models/lib/cardDrawing.js](../../../models/lib/cardDrawing.js), unless
said otherwise:

| Number | Value and how it is used |
| --- | --- |
| Palette | 7 colours: `#000000`, `#e53935`, `#1e88e5`, `#43a047`, `#fb8c00`, `#8e24aa`, `#ffffff` |
| Line widths | 2, 4, 8 and 16; a resized line takes the nearest of them |
| Drawing size | 100 to 4000 units each way, whole units; 800 x 500 when a drawing has no size |
| Smallest size | the corner handle stops where the furthest point plus half its line width would be cut off, but never under 100 |
| Zoom | each magnifier click multiplies or divides by 1.25, between 0.25 and 4 |
| Eraser | removes every line that passes within 10 units of the pointer, plus half that line's width |
| Eyedropper on the drawing | the topmost line within 6 units of the click, or white (`#ffffff`) |
| Undo | up to 100 steps (`HISTORY` in `client/components/cards/cardDrawing.js`) |
| Lines kept | at most 2000 lines of at most 5000 points each, coordinates rounded to 0.1 |
| Drawings per card | the 20 newest are kept |
| Custom colours | at most 16, newest last, none repeating a palette colour |
| Lasso | a loop needs at least 3 points; a line is selected when every point of it is inside the loop (even-odd rule) |
| Resize | a selection is never made smaller than 4 units and stays inside the drawing |
| Colour wheel | hue is the angle around the centre, saturation the distance from it divided by the radius, brightness the slider (HSV to `#rrggbb`) |

## How it works in WeKan

`client/components/cards/cardDrawing.js` (the popup), `client/lib/newDrawing.js`
(opening a new drawing), `models/lib/cardDrawing.js` (lines, the eraser, palm
rejection and the lasso's selection, moving, resizing, groups and layer order,
pure), `client/components/main/popup.js` (moving and maximizing).

- A drawing is stored on the card in `drawings`
  (`[{ _id, strokes, width, height, pngAttachmentId or svgAttachmentId,
  updatedAt }]`), written with the card's own update permission; its picture is
  uploaded as an ordinary card attachment and, for a new drawing, set as the
  card's `coverId`.
- The SVG is built from the strokes (`strokesToSvg`), so nothing a member typed
  ever becomes SVG markup; colours pass only as `#rrggbb` (`cleanColor`).
- Files: [client/components/cards/cardDrawing.js](../../../client/components/cards/cardDrawing.js),
  [client/lib/newDrawing.js](../../../client/lib/newDrawing.js),
  [models/lib/cardDrawing.js](../../../models/lib/cardDrawing.js),
  [client/components/main/popup.js](../../../client/components/main/popup.js).

Tests: `tests/cardDrawing.test.cjs`, `tests/cardDrawingPen.test.cjs`,
`tests/cardDrawingLasso.test.cjs`, `tests/cardDrawingCanvasColors.test.cjs`,
`tests/popupMoveMaximize.test.cjs`, `tests/svgServing.test.cjs`,
`tests/svgSanitizerStreaming.test.cjs` and the Playwright specs
`card-drawing-pen.e2e.js`, `card-drawing-lasso.e2e.js`,
`card-drawing-canvas.e2e.js`, `popup-drawing-window.e2e.js` and
`svg-attachment.e2e.js`.

### SVG files

SVG is an image like any other: an attachment, a card cover, a board
background, an avatar. Every uploaded SVG is sanitized on the server before it is
stored - no script, event handler, `javascript:` URI, `foreignObject` or
DOCTYPE/ENTITY XML loop - and sanitized again, whole, whenever it is served,
under a Content-Security-Policy with no script and `sandbox`, so it runs nothing
even opened directly. Both are streamed through one tokenizer,
[models/lib/svgSanitizer.js](../../../models/lib/svgSanitizer.js), so an SVG of
any size is sanitized whole, with bounded memory. Uploads used to be refused
after JVN#74210258;
[server/lib/svgResponse.js](../../../server/lib/svgResponse.js),
`tests/svgServing.test.cjs` and `tests/svgSanitizerStreaming.test.cjs` are where
it is now handled and checked.

## Commits

 - [WeKan JSON import keeps drawings](https://github.com/wekan/wekan/commit/c640c5c376526f6550873b757fa6b68511c63d42)
 - [Card menu grouped under headings, Drawing under Appearance](https://github.com/wekan/wekan/commit/0d8f8b8d96b868a6d75b803ef105e50aad450977)
 - [The popup moves by its bar or handle](https://github.com/wekan/wekan/commit/22a12dc7f87b768033f03fe5a378df63dd4e46b7)
 - [The popup is as wide as its drawing](https://github.com/wekan/wekan/commit/58751aa33988a411e1aa344c5958f01d7fdc9ce1)
 - [Maximized it takes the window, and opened at the right it is not cut off](https://github.com/wekan/wekan/commit/bb614743fdacfc6f7c0f37e689a4b43c0c46fd66)
 - [A new drawing fills the window it is shown in](https://github.com/wekan/wekan/commit/2929b61c85b32c1b017c16b653f34707dbacfd18)
 - [A new drawing is the card's cover](https://github.com/wekan/wekan/commit/c4f528159bdece7824e1876fda1a30522ab821de)
 - [Custom colours kept with the account, or in the browser](https://github.com/wekan/wekan/commit/91c12ebcce4c39252df555ef0c15f9991414a713)
 - [The whole window to draw on, zoom, any colour, Drawing in Add Card](https://github.com/wekan/wekan/commit/d5d027a6f27436eae170164972746c342a8517e9)
 - [The lasso: move, resize, group and layer order](https://github.com/wekan/wekan/commit/1c26e1bcd0b03a03ccecb83c8e1b22ce79824138)
 - [SVG of any size is sanitized whole, streaming](https://github.com/wekan/wekan/commit/e7485598388d505c7f3990a3444bcea49f022155)
 - [A new drawing from Add Card and Add attachment, the eraser and palm rejection](https://github.com/wekan/wekan/commit/54726264d3d0bcdbdc94a20f75996f094c4dd2f6)
 - [The popup moves by its title bar and maximizes](https://github.com/wekan/wekan/commit/c11976a2e192162d6bbb32d85b65cdb89d392c6e)
 - [SVG is uploaded and shown as an image](https://github.com/wekan/wekan/commit/0afb1336db10843ff3704a735274ceb3ef073b42)
 - [Open a drawing as a whiteboard](https://github.com/wekan/wekan/commit/390007e380242b633868e38d5e12676bacbf656a)
 - [Draw or write by hand on a card, saved as PNG and SVG](https://github.com/wekan/wekan/commit/c772769c0e85b10e57d848842b772e22261641bb)
