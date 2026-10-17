# Whiteboard

A card's drawing opens full screen as a whiteboard, under the header bar, and
several people can draw on it at the same time.

## Opening it

Card hamburger menu → **Drawing** lists the card's drawings. Each saved drawing
has **Open as whiteboard** (⤢) beside its thumbnail; the drawing being edited
has the same button in the toolbar once it has been saved.

The whiteboard fills the window below the header bar, so the board's own
menus stay where they are. **×** or the Escape key closes it and returns to
the card.

## Drawing

The tools are the card drawing's and Red Strings' own: the seven colours, the
four line widths, and

| Tool | What it does |
| --- | --- |
| Undo | removes **your** last line |
| Clear | removes **your** lines; other people's stay |
| Save picture | makes the drawing's PNG attachment again from what is on the board |

The drawing keeps its 800 × 500 shape and is scaled to fill the screen, so a
line drawn on a phone lands in the same place on a 55" screen.

## Several people at once

Each line is saved when the pen lifts, and appears on everyone's whiteboard
that has the drawing open - the card's own publication carries it, so nothing
else has to be running. Two people can draw at the same moment: a line is
added to the drawing, never written over another one.

Who may draw is who may edit the card; anybody else who can see the card
watches the lines appear, without the tools. A drawing holds at most 2,000
lines and a line at most 5,000 points.

## Hiding it

Board Settings / Card row **Whiteboard** (*Show on Card*). A site admin hides it
on every board from Admin Panel / Settings / Visibility / Features / Card
fields. The drawing popup works as before when the whiteboard is hidden.

## Implementation

`models/lib/cardDrawing.js` (the strokes, now with their author), the methods
`cards.whiteboardAddStroke`, `cards.whiteboardUndo` and `cards.whiteboardClear`
in `server/methods/whiteboard.js`, drawn by `cardWhiteboard` in
`client/components/cards/whiteboard.jade`. Tests: `tests/whiteboard.test.cjs`
and `tests/playwright/specs/whiteboard.e2e.js`, which draws with two browsers
at once.
