'use strict';

const SIDEBAR_BACK_CLOSE = 'close';
const SIDEBAR_BACK_HOME = 'home';

// Search occupies the full board area on a mini screen. Its back button should
// therefore reveal the board, not replace Search with the sidebar Home/settings
// view. Desktop keeps the sidebar open, and every other view keeps its existing
// back-to-Home behavior.
function sidebarBackAction(view, isMiniScreen) {
  return view === 'search' && isMiniScreen
    ? SIDEBAR_BACK_CLOSE
    : SIDEBAR_BACK_HOME;
}

module.exports = {
  SIDEBAR_BACK_CLOSE,
  SIDEBAR_BACK_HOME,
  sidebarBackAction,
};
