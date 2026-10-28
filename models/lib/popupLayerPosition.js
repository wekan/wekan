'use strict';

// Where a popup LAYER sits (client/lib/popup.js `Popup.open(name, { layer:
// true })`): a menu opened from inside a popup - a hamburger of Card Settings -
// drawn ON TOP of that popup, next to the button that opened it, while the
// popup stays visible under it. Coordinates are relative to the popup's own
// box, which the layer is positioned in.
//
//   opener   the button's rect      { top, bottom, left, right }
//   popover  the popup's rect       { top, bottom, left, right }
//
// The layer opens toward the middle of the popup: a button in its right half
// (a hamburger at the end of a line) gets the layer's right edge at its own, a
// button in its left half (the + under Custom Fields) its left edge - so a
// wide form never runs out of the popup's side. `maxWidth` is the room on
// that side. Being physical, this is right in a right-to-left page too. It
// opens below the button when there is room for `minHeight` there or at
// least as much room as above, else above it; `maxHeight` is the room on that
// side, so a long menu scrolls inside the popup rather than past it.
function popupLayerPosition({ opener, popover, gap = 2, margin = 8, minHeight = 200 }) {
  const below = popover.bottom - opener.bottom - gap - margin;
  const above = opener.top - popover.top - gap - margin;
  const down = below >= minHeight || below >= above;
  const middle = (popover.left + popover.right) / 2;
  const fromLeft = (opener.left + opener.right) / 2 < middle;
  const x = fromLeft ? opener.left - popover.left : popover.right - opener.right;
  const room = fromLeft ? popover.right - opener.left - margin : opener.right - popover.left - margin;
  return {
    vertical: down ? 'top' : 'bottom',
    y: Math.round(down ? opener.bottom - popover.top + gap : popover.bottom - opener.top + gap),
    horizontal: fromLeft ? 'left' : 'right',
    x: Math.max(0, Math.round(x)),
    maxHeight: Math.max(0, Math.round(down ? below : above)),
    maxWidth: Math.max(0, Math.round(Math.min(room, popover.right - popover.left - margin))),
  };
}

// The layer's inline style from its position.
function popupLayerStyle(pos) {
  if (!pos) return '';
  return `${pos.vertical}:${pos.y}px; ${pos.horizontal}:${pos.x}px; max-height:${pos.maxHeight}px; max-width:${pos.maxWidth}px;`;
}

module.exports = { popupLayerPosition, popupLayerStyle };
