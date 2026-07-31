'use strict';

// The URL of a swimlane or a list, so both can be linked the way a card can.
//
// A card has had an address since there has been a card route. A swimlane and a
// list had none: "the Backlog list of this board" could only be sent as "open
// this board and scroll down", and `List.absoluteUrl()` answered with the URL of
// an arbitrary CARD inside the list - the first one the cache happened to
// return - so the link went somewhere that was not the list, and to nowhere at
// all when the list was empty.
//
//   /b/<boardId>/<slug>/swimlane/<swimlaneId>
//   /b/<boardId>/<slug>/list/<listId>
//
// FIVE segments, against the card route's four, which is what keeps them apart:
// `/b/:boardId/:slug/:cardId` cannot match these, and these cannot match a
// card. The kind is a word in the path rather than a query parameter because it
// is part of what the address names, and a reader can see which is which.
//
// Pure and isomorphic, like models/lib/cardUrl.js next to it, and for the same
// reason: on the server `board()` is async and returns a Promise, so a caller
// there passes the already-awaited board. A thenable is never read from - that
// is exactly what emitted `/b/undefined/board/...` in issue #6427.

const { isThenable } = require('./cardUrl');

const SWIMLANE_SEGMENT = 'swimlane';
const LIST_SEGMENT = 'list';

// The route paths, so the router and the builders cannot disagree about them.
const SWIMLANE_ROUTE_PATH = `/b/:boardId/:slug/${SWIMLANE_SEGMENT}/:swimlaneId`;
const LIST_ROUTE_PATH = `/b/:boardId/:slug/${LIST_SEGMENT}/:listId`;

function boardParts(item, board) {
  const resolvedBoard = isThenable(board) ? undefined : board;
  const boardId = (resolvedBoard && resolvedBoard._id) || (item && item.boardId);
  if (!boardId) return null;
  // 'board' is the same stand-in the card URL uses when the slug is unknown:
  // the route reads the id, and the slug is only there to be readable.
  return { boardId, slug: (resolvedBoard && resolvedBoard.slug) || 'board' };
}

function buildBoardItemRelativeUrl(segment, item, board) {
  if (!item || !item._id) return undefined;
  const parts = boardParts(item, board);
  if (!parts) return undefined;
  return `/b/${parts.boardId}/${parts.slug}/${segment}/${item._id}`;
}

function buildSwimlaneRelativeUrl(swimlane, board) {
  return buildBoardItemRelativeUrl(SWIMLANE_SEGMENT, swimlane, board);
}

function buildListRelativeUrl(list, board) {
  return buildBoardItemRelativeUrl(LIST_SEGMENT, list, board);
}

module.exports = {
  SWIMLANE_SEGMENT,
  LIST_SEGMENT,
  SWIMLANE_ROUTE_PATH,
  LIST_ROUTE_PATH,
  buildBoardItemRelativeUrl,
  buildSwimlaneRelativeUrl,
  buildListRelativeUrl,
};
