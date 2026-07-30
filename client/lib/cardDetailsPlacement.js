'use strict';

// Where, horizontally, the desktop card-details window belongs: beside the
// minicard it was opened from, on whichever side has more room, and always
// entirely inside the viewport.
//
// #6465 asked for the 6.09 behaviour back — "notice how the card info docks
// neatly right next to the card". The window was moved off the middle of the
// board and docked to the end edge instead (client/components/cards/
// cardDetails.css), which fixed it covering the board but left it nowhere near
// the card it belongs to: open a card in the first list of a wide board and its
// details are a screen away.
//
// This is X ONLY. The Y geometry — the staggered `top` and the `bottom: 8px`
// that make the window full height — is already right and is deliberately not
// touched here, neither by this module nor by its caller.
//
// Pure geometry, no DOM and no Meteor, so the decision is unit-testable in plain
// Node (mirrors client/lib/cardDragGeometry.js).

// Distance kept between the minicard and the window, and between the window and
// the viewport edge. Matches the 8px insets the stylesheet uses.
const GAP = 8;
const MARGIN = 8;

// anchor:        the minicard's viewport rectangle — { left, right } is enough.
// panelWidth:    the width the window has right now, from the stylesheet.
// viewportWidth: the visible width, i.e. the window's inner width.
// rtl:           only breaks an exact tie, towards the reading direction's start
//                edge, so a tie looks deliberate rather than arbitrary.
//
// Returns { left, width, side }: the inline geometry to apply, in viewport
// coordinates. `side` is which side of the minicard was chosen and is reported
// for the tests and for anyone debugging a placement.
//
// The width is passed through UNCHANGED unless the viewport itself is too narrow
// for it. Shrinking the window to fit the gap beside the minicard was tried and
// dropped: on a 600px-wide desktop it turned a 520px window into a 240px one, and
// this is supposed to change where the window is, not how big it is. When neither
// side has room the window overlaps the minicard instead, pushed as far towards
// the roomier side as the viewport allows — the card is behind it for a moment,
// which is recoverable; a window off the edge of the screen is not.
function placeCardDetailsX({
  anchor,
  panelWidth,
  viewportWidth,
  gap = GAP,
  margin = MARGIN,
  rtl = false,
} = {}) {
  if (!anchor || !Number.isFinite(anchor.left) || !Number.isFinite(anchor.right)) {
    // No minicard to anchor to (opened from a URL, from search, or its list is
    // scrolled out of view). Leave it where the stylesheet puts it.
    return null;
  }

  // The window can never be wider than the viewport allows: the "always in the
  // visible area" half of the request starts here.
  const usable = Math.max(0, viewportWidth - 2 * margin);
  const width = Math.max(0, Math.min(panelWidth, usable));

  // How much room is left over beside the minicard, once the gap and the far
  // margin are taken out.
  const roomRight = viewportWidth - margin - (anchor.right + gap);
  const roomLeft = (anchor.left - gap) - margin;

  let side;
  if (roomRight > roomLeft) side = 'right';
  else if (roomLeft > roomRight) side = 'left';
  else side = rtl ? 'left' : 'right';

  let left = side === 'right'
    ? anchor.right + gap
    : anchor.left - gap - width;

  // ...and whatever the line above worked out, the window ends up on screen.
  // Clamping towards the chosen side is what keeps the overlap case sensible: it
  // ends up as far from the minicard as it can get, on the roomier side.
  const maxLeft = viewportWidth - margin - width;
  left = Math.min(Math.max(left, margin), Math.max(margin, maxLeft));

  return { left: Math.round(left), width: Math.round(width), side };
}

export { placeCardDetailsX, GAP, MARGIN };
