'use strict';

// Which fields an opened card and a minicard show
// (docs/Features/Cards/Card-Fields.md).
//
// An opened card shows EVERY field its board shows on cards - Board Settings
// / Card's "Show on Card" checkbox of the field's row - empty or not. There is
// no per-card choice and no "Show empty" any more: an empty Due date, an empty
// Members, an empty Custom Fields section are all drawn, ready to be filled
// in, on every card of a board that shows them.
//
// (Until 2026-10-28 a card showed only the fields it had data in, plus the
// board's "Show empty" list `cardFieldsAlwaysShown` (#6806), plus every field
// when "Show empty fields" `showEmptyCardFields` was on, plus what the card
// itself ticked "On this card" `shownFields`/`hiddenFields`. Those schema
// fields are kept so existing documents still validate, and nothing reads
// them.)
//
// What Card Settings can hide besides a row is a whole SECTION, per side
// (models/lib/cardSettingsSections.js hiddenSectionsOf): unticked on Show on
// Card, every row of the section reads false on every opened card; unticked
// on Show on Minicard, on every minicard.
//
// HOW IT HIDES. The card's and the minicard's templates read
// `currentBoard.allowsDueDate` and so on. The opened card and its section
// templates (client/components/cards/cardAddFields.js CARD_FIELD_TEMPLATES)
// and the minicard's templates (client/components/cards/minicard.js) get their
// own `currentBoard`: this side's view of the board, whose flags read false
// for the rows of the sections hidden on that side - the same overlay as
// Admin Panel / Visibility / Features (cardFieldVisibility.js), one level
// down. The board document is never changed, and Card Settings itself reads
// the board, so its checkboxes keep showing each row's own flag.
//
// Pure CommonJS: tests/cardShownFields.test.cjs.

const { CARD_SETTINGS_ROWS } = require('./cardSettingsRows');
const { rowKeysHiddenBySections } = require('./cardSettingsSections');

// The opened card's fields - what the legacy per-card lists (`shownFields`,
// `hiddenFields` on a card, `cardFieldsAlwaysShown` on a board) could name.
// Kept as those schema fields' allowedValues (models/cards.js,
// models/boards.js), so a document written before 2026-10-28 still validates.
const FIELD_KEYS = Object.freeze([
  'receivedDate', 'startDate', 'dueDate', 'endDate', 'dueComplete',
  'members', 'assignee', 'creator', 'requestedBy', 'assignedBy',
  'labels', 'stickers', 'location',
  'descriptionTitle', 'descriptionText',
  'checklists', 'subtasks',
  'cover', 'attachments', 'textNotes',
  'spentTime', 'flowtime', 'pomodoro',
  'customFields',
  'vote', 'poker',
  'scrumSprint', 'scrumPastSprints', 'scrumRelease', 'scrumIssueType', 'scrumAcceptanceCriteria', 'scrumBacklogRank',
  'comments', 'activities',
  'cardNumber', 'dependencies', 'cardSortingByNumber', 'showLists', 'swimlaneName',
]);

const rowOf = key => CARD_SETTINGS_ROWS.find(r => r.key === key);

// Whether the board lets its cards show `key` at all (Board Settings / Card,
// as the board read returns it, Admin Panel / Visibility applied). Given a
// side's view (boardForCard below), a row of a hidden section reads false.
function boardAllows(board, key) {
  const spec = rowOf(key) && rowOf(key).card;
  if (!board || !spec) return false;
  if (spec.scrum) {
    // A Scrum field is shown only when turned on (scrumFields.js visibleFields).
    const visibility = board.scrum && board.scrum.visibility;
    return Boolean(visibility && visibility[spec.scrum] === true);
  }
  const value = board[spec.field];
  // As the templates read it: a plain flag the board never set is the row's
  // default; any other field is shown when it is true (`if currentBoard.allowsX`).
  if (value === undefined && spec.flag) return spec.default !== false;
  return Boolean(value);
}

// Whether `board` hides the row `key` on `side` because its whole section is
// hidden there - for what is not a board flag the templates read (a card's own
// List title, a checklist's own Show at minicard).
function hidesRow(board, side, key) {
  return rowKeysHiddenBySections(board, side).includes(key);
}

const cache = typeof WeakMap === 'function' ? new WeakMap() : null;

// The board as one SIDE ('card' or 'minicard') sees it: every row of a
// section hidden on that side reads false - its board flag, or for a Scrum row
// its Scrum visibility flag. The same object when no section is hidden;
// otherwise a copy with the board's prototype, so every board helper still
// works, cached per board, side and set of hidden rows.
function boardForSide(board, side) {
  if (!board || typeof board !== 'object') return board;
  const hidden = rowKeysHiddenBySections(board, side);
  if (!hidden.length) return board;
  const signature = `${side}:${hidden.join(',')}`;
  const perBoard = cache && cache.get(board);
  if (perBoard && perBoard[signature]) return perBoard[signature];
  const overrides = {};
  let scrumVisibility = null;
  hidden.forEach(key => {
    const spec = rowOf(key) && rowOf(key)[side];
    if (!spec) return;
    if (spec.scrum) {
      scrumVisibility = scrumVisibility || {};
      scrumVisibility[spec.scrum] = false;
    } else {
      overrides[spec.field] = false;
    }
  });
  const view = Object.assign(Object.create(Object.getPrototypeOf(board)), board, overrides);
  if (scrumVisibility) {
    const scrum = board.scrum && typeof board.scrum === 'object' ? board.scrum : {};
    view.scrum = { ...scrum, visibility: { ...(scrum.visibility || {}), ...scrumVisibility } };
  }
  if (cache) cache.set(board, { ...(perBoard || {}), [signature]: view });
  return view;
}

// The board as every opened card of it sees it: the same for every card, empty
// or not - only the sections hidden on Show on Card are taken away.
function boardForCard(board) {
  return boardForSide(board, 'card');
}

// ...and as every minicard of it sees it.
function boardForMinicard(board) {
  return boardForSide(board, 'minicard');
}

module.exports = {
  FIELD_KEYS, boardAllows, hidesRow, boardForSide, boardForCard, boardForMinicard,
};
