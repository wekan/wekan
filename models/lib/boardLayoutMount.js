'use strict';
// #6745: opening or closing a card by its address re-created the whole board.
// The card route and the board route both called
// this.render('defaultLayout', { content: 'board' }), and flow-router-extra
// treats an object as new data and re-renders the layout every time - every
// swimlane, list and minicard torn down and built again, and in lazy loading
// every list's card window re-subscribed. Card links, the up/down card keys,
// back/forward and closing a card opened from a link all went through it.
//
// The board template already follows Session (currentCard, openCards) by
// itself, so when the board on screen IS the board of the new address, the
// route only has to set Session. Pure, so tests/largeBoardCardOpen.test.cjs
// runs it without Meteor.

// Routes that render the board layout. Entering any other route replaces the
// layout, so nothing is mounted any more.
const BOARD_LAYOUT_ROUTES = ['board', 'board-short', 'card', 'list', 'swimlane'];
// Of those, the ones that may reuse a mounted board. The list and swimlane
// routes still render, as they always have.
const REUSING_ROUTES = ['board', 'card'];

// What stays mounted once `routeName` is entered.
function mountedBoardAfterEnter(mountedBoardId, routeName) {
  return BOARD_LAYOUT_ROUTES.includes(routeName) ? mountedBoardId || null : null;
}

// Must `routeName` for `boardId` render the board layout?
function mustRenderBoardLayout(mountedBoardId, boardId, routeName) {
  if (!boardId || !mountedBoardId) return true;
  if (!REUSING_ROUTES.includes(routeName)) return true;
  return mountedBoardId !== boardId;
}

module.exports = { BOARD_LAYOUT_ROUTES, REUSING_ROUTES, mountedBoardAfterEnter, mustRenderBoardLayout };
