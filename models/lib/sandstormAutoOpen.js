'use strict';

// Sandstorm "open one board on start" decision (#2220 follow-up). On Sandstorm the
// grain root ('/') renders All Boards, but historically a grain opened straight into
// its single board. This restores that as a convenience WITHOUT persisting anything:
//
//   - a saved default board (a Home board the user explicitly chose) always wins
//     -> redirect to it;
//   - else, once boards have loaded, exactly ONE board -> just open it (NOT saved —
//     setting a Home board is a separate, explicit user action on All Boards);
//   - else (zero or many boards, no saved default) -> stay on All Boards.
//
// Kept pure + CommonJS so the branching is unit-testable; the client autorun
// (config/router.js) feeds it reactive inputs and performs the returned action.
//
// Inputs:
//   userReady      - Meteor.userId() has landed (grain login is async)
//   savedDefaultId - the user's profile.defaultBoardId, or falsy
//   boardsReady    - the boards subscription is ready (count is trustworthy)
//   boardCount     - number of the user's visible boards
//   onlyBoardId    - the single board's _id when boardCount === 1
//
// Returns one of:
//   { action: 'wait' }                - inputs not ready yet
//   { action: 'redirect', boardId }   - open boardId (nothing is persisted)
//   { action: 'stay' }                - remain on All Boards
function decideSandstormAutoOpen(input) {
  const {
    userReady,
    savedDefaultId,
    boardsReady,
    boardCount,
    onlyBoardId,
  } = input || {};

  if (!userReady) return { action: 'wait' };

  // A saved Home board (explicitly chosen by the user) always wins.
  if (savedDefaultId) {
    return { action: 'redirect', boardId: savedDefaultId };
  }

  // Need the board list loaded before counting, otherwise "0 boards" is ambiguous.
  if (!boardsReady) return { action: 'wait' };

  // Exactly one board -> just open it. Nothing is saved: choosing a Home board is a
  // separate, explicit action (the All Boards home toggle, #2220).
  if (boardCount === 1 && onlyBoardId) {
    return { action: 'redirect', boardId: onlyBoardId };
  }

  // Zero or many boards, and nothing saved -> All Boards.
  return { action: 'stay' };
}

module.exports = { decideSandstormAutoOpen };
