'use strict';

// Pure helpers for a board's auto-created default swimlane. Extracted from
// models/boards.js so the idempotency guarantee behind the #6429 fix is
// unit-testable without Meteor.
//
// #6429: Board.getDefaultSwimline()/getDefaultSwimlineAsync() self-heal a
// missing default swimlane with a check-then-insert (read the board's
// swimlanes, insert one if none exist). That races: concurrent or repeated
// server calls for a swimlane-less board each saw zero swimlanes and each
// inserted a new one, so some boards accumulated 30 000+ empty "Default"
// swimlanes and became unloadable. The fix upserts on a DETERMINISTIC _id so
// the _id unique index caps auto-created default swimlanes at one per board.

// Deterministic _id for a board's auto-created default swimlane. A normal
// swimlane gets a Random.id() (17 chars, no hyphen), so this never collides
// with a user-created one.
function defaultSwimlaneId(boardId) {
  return `${boardId}-default`;
}

// Fields for the upsert's $setOnInsert. archived/type are set explicitly: their
// schema autoValue/defaultValue only fire on insert, not on the upsert path used
// by the self-heal, so omitting them would fail required-field validation.
function defaultSwimlaneFields(boardId, title) {
  return {
    // Fall back to the string 'Default' when i18n is unavailable or returned a
    // non-string (e.g. during migration, or the 'default (en)' object warning).
    title: typeof title === 'string' && title.length > 0 ? title : 'Default',
    boardId,
    sort: 0,
    archived: false,
    type: 'swimlane',
  };
}

module.exports = { defaultSwimlaneId, defaultSwimlaneFields };
