'use strict';

// #5659 "List Width settings do not affect Public Board".
//
// The default list width used to be duplicated (and DISAGREE) across the
// width-resolution paths:
//   - client/components/lists/list.js        -> 272 (DEFAULT_LIST_WIDTH)
//   - client/components/lists/listHeader.js  -> 272/270 hardcoded literals
//   - models/lists.js (schema defaultValue)  -> 272
//   - models/users.js getListWidth()         -> 270
//   - models/users.js getListWidthFromStorage() (anonymous/public-board
//     storage path)                          -> 270
//   - models/users.js getFixedListWidth()    -> 272
//
// Depending on which path resolved a given list's width (logged-in member
// profile, anonymous localStorage on a public board, the shared lists.width,
// or fixed-width mode), the fallback "default" differed, so lists on the SAME
// board could render at different widths even though nobody had customized
// anything — most visibly for logged-out visitors of public boards.
//
// This module is the single source of truth. It is Meteor-free so it can be
// unit tested in plain Node (see tests/listWidthDefaults.test.cjs) and is
// imported by both the client width helpers and the user model helpers.

// The one default width every list renders at when no customization exists.
// #6465: narrowed from 272 to 220 so more lists fit on screen by default (the
// pre-9.x / 6.09 boards were noticeably thinner). All lists still render this
// SAME width by default (resolveListWidth returns it for every uncustomized
// list, on private and public boards); a user's own widths are unaffected.
const DEFAULT_LIST_WIDTH = 220;
// The minimum width a customized list may have (matches the resize handle,
// the Set-Width popup validation and the server-side width check in
// server/models/users.js). Lowered with the default so the smaller default is
// itself valid and users can go narrower.
const MIN_LIST_WIDTH = 200;

// A width "counts" (may override the default) only when it is a real, finite
// number within the allowed range.
function isValidListWidth(width) {
  return (
    typeof width === 'number' &&
    Number.isFinite(width) &&
    width >= MIN_LIST_WIDTH
  );
}

// Normalize a stored width: return it when valid, otherwise the fallback
// (the board-wide default unless the caller supplies another).
function normalizeListWidth(width, fallback = DEFAULT_LIST_WIDTH) {
  return isValidListWidth(width) ? width : fallback;
}

// Resolve the width ONE list renders at, given the viewer's context:
//   - fixedEnabled / fixedWidth : the viewer's per-board "same width for all
//     lists" mode (#5729). When on, every list uses the single fixedWidth.
//   - sharedWidth               : lists.width — the board-wide width shared by
//     all viewers (#6409), including logged-out visitors of public boards.
//   - personalMode              : board.allowsPersonalListWidth.
//   - personalWidth             : the viewer's own width for this list
//     (profile for logged-in users, localStorage for anonymous ones). Only
//     consulted in personal mode.
//
// With NO customization at all this always returns DEFAULT_LIST_WIDTH, for
// every list and every viewer — which is what keeps all lists of a public
// board the same width by default.
function resolveListWidth(options) {
  const {
    fixedEnabled = false,
    fixedWidth = null,
    sharedWidth = null,
    personalMode = false,
    personalWidth = null,
  } = options || {};
  if (fixedEnabled) {
    return normalizeListWidth(fixedWidth);
  }
  const shared = normalizeListWidth(sharedWidth);
  if (!personalMode) {
    return shared;
  }
  return normalizeListWidth(personalWidth, shared);
}

module.exports = {
  DEFAULT_LIST_WIDTH,
  MIN_LIST_WIDTH,
  isValidListWidth,
  normalizeListWidth,
  resolveListWidth,
};
