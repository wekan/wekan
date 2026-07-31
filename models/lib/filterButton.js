'use strict';

// Which way the Filter button in the header bar goes on a click.
//
// It only ever OPENED. Clicking it while the filter sidebar was already showing
// did nothing visible, so the button that opened the panel could not shut it and
// the only way back was the sidebar's own ✕ - which is somewhere else on screen
// from the thing you just clicked.
//
// It closes on the second click now, but ONLY while nothing is filtered. With a
// filter on, the sidebar is the one place that says WHAT is being hidden from
// the board, and closing it would leave a board showing a subset of its cards
// with nothing on screen to say so. Clicking then keeps it open, and the ✕
// beside the button is what clears the filter.
//
// Pure: two booleans in, one word out, so the guard can check every combination
// without a DOM. docs/Design/Page/Header.md

const FILTER_OPEN = 'open';
const FILTER_CLOSE = 'close';

// `isShowingFilter` is "the sidebar is open AND it is on the filter view" - a
// sidebar open on Activities is not showing the filter, and clicking Filter
// there has to switch to it rather than close the panel.
function filterButtonAction(isShowingFilter, isFilterActive) {
  return isShowingFilter && !isFilterActive ? FILTER_CLOSE : FILTER_OPEN;
}

module.exports = {
  FILTER_OPEN,
  FILTER_CLOSE,
  filterButtonAction,
};
