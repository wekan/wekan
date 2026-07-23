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

// Choose a board's default swimlane from its list of swimlanes (#1971). Prefer
// the first NON-archived swimlane so a card added in List view never lands in an
// archived swimlane (which is invisible in Swimlane view — the reported bug).
// If every swimlane is archived, fall back to the first one (matching the old
// non-null behaviour, so callers that read `._id` never crash). Returns
// undefined only when the board has no swimlanes at all, which is the single
// case where the server self-heals a fresh default (#6382/#6429).
function pickDefaultSwimlane(swimlanes) {
  if (!Array.isArray(swimlanes) || swimlanes.length === 0) return undefined;
  const active = swimlanes.find(s => s && !s.archived);
  return active || swimlanes[0];
}

export {
  defaultSwimlaneId,
  defaultSwimlaneFields,
  pickDefaultSwimlane,
};
