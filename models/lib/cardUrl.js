'use strict';

// Pure, isomorphic helper that builds a card's relative URL, matching the
// 'card' route '/b/:boardId/:slug/:cardId' (config/router.js).
//
// Why this is not just a template literal inline in Card.originRelativeUrl:
// on the server ReactiveCache.getBoard() (used by Card.board()) is async and
// returns a Promise, not a board document. Interpolating that Promise straight
// into the URL produced '/b/undefined/board/<cardId>' in card activity
// notification emails (issue #6427), because Promise._id / Promise.slug are
// undefined. This helper detects a Promise-shaped (thenable) board, ignores it,
// and falls back to the card's own boardId — which is always available
// synchronously — so the link stays valid even when the human-readable slug is
// unknown. Server callers should pass the already-awaited board to also get the
// correct slug.

function isThenable(value) {
  return !!value && (typeof value === 'object' || typeof value === 'function')
    && typeof value.then === 'function';
}

function buildCardRelativeUrl(card, board) {
  if (!card || !card._id) return undefined;
  // A thenable is an unresolved Promise (server Card.board()); never read
  // _id/slug off it — that is exactly what emitted '/b/undefined/board/...'.
  const resolvedBoard = isThenable(board) ? undefined : board;
  const boardId = (resolvedBoard && resolvedBoard._id) || card.boardId;
  if (!boardId) return undefined;
  const slug = (resolvedBoard && resolvedBoard.slug) || 'board';
  // swimlaneId/listId were only ever appended as query params the route
  // ignores, so they are dropped here.
  return `/b/${boardId}/${slug}/${card._id}`;
}

module.exports = { isThenable, buildCardRelativeUrl };
