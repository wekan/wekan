'use strict';

// WHAT AN EXPORT CAN CONTAIN, in one place, for the server that builds it and
// the popup that offers it.
//
// #1173 asked to "print a board ... with params", and the card export already
// had the shape of the answer: a popup with a checkbox per section, and a
// `?fields=` the exporter reads. What it did not have was ONE list. The server's
// ALL_FIELDS lived in models/server/ExporterExcelCard.js and the popup's copy
// lived in client/components/cards/cardDetails.js under a comment saying "Must
// match ALL_FIELDS" - which is a comment, not a mechanism. A section added on
// one side and forgotten on the other is either a checkbox that does nothing or
// a section nobody can turn off.
//
// So both sides import this. `field` is what `?fields=` carries and what the
// exporters ask `hasField()` about; `label` is the i18n key the checkbox shows.
//
// ORDER MATTERS, and only at the end: a saved `?fields=labels,people,...` link
// names the sections it wants, so a new section is APPENDED. Reordering would
// not change what such a link asks for, but keeping the order is what makes the
// popup read the way the export does.

// One card, as the card export draws it - and, since #1173, as the board export
// draws every card in it.
const CARD_EXPORT_FIELDS = [
  { field: 'labels', label: 'labels' },
  { field: 'people', label: 'export-card-field-people' },
  { field: 'board-info', label: 'export-card-field-board-info' },
  { field: 'dates', label: 'export-card-field-dates' },
  { field: 'description', label: 'description' },
  { field: 'custom-fields', label: 'custom-fields' },
  { field: 'checklists', label: 'checklists' },
  { field: 'subtasks', label: 'export-card-subtasks' },
  { field: 'comments', label: 'comments' },
  { field: 'attachments', label: 'attachments' },
  { field: 'voting', label: 'voting' },
  { field: 'poker', label: 'poker-question' },
];

// A board is its own header plus every card in it, so the board's list is the
// card's list with what only a board has in front of it. `board-header` is the
// board's own title, description, members and dates - not to be confused with
// `board-info`, which is the "which board / swimlane / list is this card in"
// block the CARD export shows.
const BOARD_EXPORT_FIELDS = [
  { field: 'board-header', label: 'board' },
  { field: 'activities', label: 'activities' },
  ...CARD_EXPORT_FIELDS,
];

const CARD_EXPORT_FIELD_KEYS = CARD_EXPORT_FIELDS.map(entry => entry.field);
const BOARD_EXPORT_FIELD_KEYS = BOARD_EXPORT_FIELDS.map(entry => entry.field);

// `?fields=a,b,c` -> the keys of it that exist, or null for "everything".
// Null rather than the full list, so a caller can tell "no selection" from "one
// section selected" - an empty selection is not an empty export.
function parseExportFields(value, allowed) {
  if (typeof value !== 'string' || !value.trim()) return null;
  const wanted = value.split(',').map(entry => entry.trim()).filter(Boolean);
  const kept = wanted.filter(entry => allowed.includes(entry));
  return kept.length > 0 ? kept : null;
}

// WHICH cards an export is about: the whole board, or one swimlane, list, card
// or checklist. Four ids, read the same way by every export route (JSON, .zip,
// PDF, Excel) so a menu that sends `listId` means the same thing to all of them.
const EXPORT_SCOPE_KEYS = ['swimlaneId', 'listId', 'cardId', 'checklistId'];

// A Mongo id is [A-Za-z0-9] and short; anything else is not one, and a query
// parameter is not a place to trust.
const isId = value => typeof value === 'string' && /^[A-Za-z0-9_-]{1,64}$/.test(value);

function parseExportScope(query) {
  const scope = {};
  for (const key of EXPORT_SCOPE_KEYS) {
    const value = query && query[key];
    if (isId(value)) scope[key] = value;
  }
  return scope;
}

export {
  EXPORT_SCOPE_KEYS,
  parseExportScope,
  CARD_EXPORT_FIELDS,
  BOARD_EXPORT_FIELDS,
  CARD_EXPORT_FIELD_KEYS,
  BOARD_EXPORT_FIELD_KEYS,
  parseExportFields,
};
