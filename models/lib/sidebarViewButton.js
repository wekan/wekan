'use strict';

// Which way a header button that opens a sidebar VIEW goes on a click.
//
// Filter and Search only ever OPENED. Clicking one while the sidebar was
// already showing its view did nothing visible, so the button that opened the
// panel could not shut it and the only way back was the sidebar's own ✕ -
// somewhere else on screen from the thing you just clicked.
//
// They close on the second click now. `mustStayOpen` is the exception, and it
// is Filter's: with a filter on, the sidebar is the one place that says WHAT is
// being hidden from the board, and closing it would leave a board showing a
// subset of its cards with nothing on screen to say so. Search has no such
// case - its results are inside the panel and it hides nothing from the board -
// so it passes false and always toggles.
//
// Pure: two booleans in, one word out, so the guard can check every combination
// without a DOM. docs/Features/Page/Header.md

const SIDEBAR_VIEW_OPEN = 'open';
const SIDEBAR_VIEW_CLOSE = 'close';

// `isShowingView` is "the sidebar is open AND it is on THIS button's view" - a
// sidebar open on Activities is showing neither, and clicking either button
// there has to switch to it rather than close the panel.
function sidebarViewButtonAction(isShowingView, mustStayOpen) {
  return isShowingView && !mustStayOpen ? SIDEBAR_VIEW_CLOSE : SIDEBAR_VIEW_OPEN;
}

module.exports = {
  SIDEBAR_VIEW_OPEN,
  SIDEBAR_VIEW_CLOSE,
  sidebarViewButtonAction,
};
