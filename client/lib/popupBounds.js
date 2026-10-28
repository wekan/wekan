// Where a popup must move so that all of it is inside the window.
//
// A popup is placed from its opener before its width is known. The card's
// Drawing popup, opened from the card's menu at the right of the window,
// replaces the menu in the same popup and then grows to its drawing's width
// (popup.css, data-popup='cardDrawingPopup'): it stayed where the narrow menu
// had been and its right part - the larger pen sizes and Save - was cut off by
// the window. Only a
// drag, which keeps a popup 12px inside, brought it back (popup-drawing-window
// .e2e.js measured that jump). The same rule is applied when the popup's size
// changes. Pure, so it is tested without a browser (tests/popupBounds.test.cjs).

const MARGIN = 12;

// box: the popup's { left, top, width, height } in viewport pixels.
// Returns the { left, top } to move it to, or null when it already fits.
function keptInside(box, viewportWidth, viewportHeight, margin = MARGIN) {
  if (!box || !(box.width > 0) || !(box.height > 0)) return null;
  const left = Math.max(margin, Math.min(viewportWidth - box.width - margin, box.left));
  const top = Math.max(margin, Math.min(viewportHeight - box.height - margin, box.top));
  if (Math.abs(left - box.left) < 1 && Math.abs(top - box.top) < 1) return null;
  return { left, top };
}

module.exports = { keptInside, MARGIN };
