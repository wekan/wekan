'use strict';

// Pure decision for #4758 ("Link to a card should still work when the card was
// moved to another board"). A card URL is /b/:boardId/:slug/:cardId; after the
// card is moved, :boardId is the OLD board, which no longer contains the card, so
// the link would open the old board and find nothing.
//
// The client resolves the card via the permission-checked `card` publication
// (server/publications/cards.js — it only returns the card when the current user
// MAY see the card's board). Given the URL's boardId and that resolved card doc,
// this returns the board id to redirect to so the card opens in its CURRENT
// board, or null when no redirect is needed or possible:
//   - card missing (moved to a board the user cannot access, deleted, or not yet
//     loaded) -> null: stay on the URL's board (the card simply will not show);
//   - card already on the URL's board (the normal case) -> null;
//   - card on a DIFFERENT board the user can see -> that board's id (redirect).
function cardBoardRedirectTarget(urlBoardId, card) {
  if (!card || typeof card.boardId !== 'string' || card.boardId.length === 0) {
    return null;
  }
  if (card.boardId === urlBoardId) {
    return null;
  }
  return card.boardId;
}

export { cardBoardRedirectTarget };
