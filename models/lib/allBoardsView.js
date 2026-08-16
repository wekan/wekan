'use strict';

// Which views the All Boards page has, and which one an account that has never
// chosen sees. Design: docs/Features/Page/All-Boards.md
//
// Pure — no Meteor, no DOM, no storage — so the answer to "is this a view?" and
// "what is the default?" is unit-testable. The ReactiveVars and the localStorage
// that carry the CHOICE live in client/lib/allBoardsView.js, which is Meteor and
// cannot be loaded in a plain Node test.

const VIEW_LISTS = 'lists';
const VIEW_TABLE = 'table';

// In the order the view menu offers them. Lists first because it is the default.
const VIEWS = [VIEW_LISTS, VIEW_TABLE];

const STORAGE_KEY = 'wekan-all-boards-view';

// The board icons: what the page has always been, and what it still is unless the
// user says otherwise.
const DEFAULT_VIEW = VIEW_LISTS;

// A stored (or otherwise untrusted) value as a view, or null when it is not one.
// Null rather than the default, so a caller can tell "never chosen" from "chose
// Lists" — and so a value left by a future version does not render nothing.
function normalizeAllBoardsView(value) {
  return VIEWS.includes(value) ? value : null;
}

// The view to use given whatever was stored.
function resolveAllBoardsView(stored) {
  return normalizeAllBoardsView(stored) || DEFAULT_VIEW;
}

module.exports = {
  VIEW_LISTS,
  VIEW_TABLE,
  VIEWS,
  STORAGE_KEY,
  DEFAULT_VIEW,
  normalizeAllBoardsView,
  resolveAllBoardsView,
};
