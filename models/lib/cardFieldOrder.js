'use strict';

// Pure helpers for the card-detail-view "field order" setting (#4448): a board
// may reorder the major sections of the opened card - move Description earlier
// (e.g. third) and have Custom Fields render right after it, rather than the
// previously fixed sequence. Extracted so the ordering decision is
// unit-testable in plain Node without Meteor (mirrors models/lib/boardSortReorder.js).
//
// Scope: only the sections that already share the simple `.card-details-group`
// wrapper in client/components/cards/cardDetails.jade are reorderable - Labels,
// Dates, Members, Custom Fields and Description. Dependencies/Sort (rendered as
// a fixed appendage right after Members), Vote/Poker (a fixed appendage right
// after Custom Fields), and Checklists/Attachments/Comments/Activity (which sit
// in their own flex/right-column layout further down the template) are left at
// their current, unreorderable positions to avoid layout regressions that
// cannot be verified visually in this environment.

// The default order also documents the ORIGINAL fixed sequence, so a board that
// never touches the setting renders byte-for-byte what it always has.
const DEFAULT_CARD_FIELD_ORDER = [
  'labels',
  'dates',
  'members',
  'customFields',
  'description',
];

// Keep in sync with DEFAULT_CARD_FIELD_ORDER's members - the set of valid keys.
const CARD_FIELD_ORDER_KEYS = DEFAULT_CARD_FIELD_ORDER.slice();

function isValidCardFieldKey(key) {
  return CARD_FIELD_ORDER_KEYS.includes(key);
}

// Turn a (possibly stale, partial, unknown-containing, or empty) stored order
// into a complete, valid ordering: unknown keys are dropped, duplicates are
// dropped (keeping the first occurrence), and any known key missing from the
// stored order is appended at the end, in its default-order relative position.
// Never throws and never drops a known section - the card must always render
// every section exactly once.
function applyCardFieldOrder(storedOrder, defaultOrder = DEFAULT_CARD_FIELD_ORDER) {
  const known = defaultOrder.slice();
  const seen = new Set();
  const result = [];

  if (Array.isArray(storedOrder)) {
    storedOrder.forEach(key => {
      if (typeof key === 'string' && known.includes(key) && !seen.has(key)) {
        seen.add(key);
        result.push(key);
      }
    });
  }

  known.forEach(key => {
    if (!seen.has(key)) {
      seen.add(key);
      result.push(key);
    }
  });

  return result;
}

// Move the section at `key` one step earlier/later in `order`, used by the
// Board Settings up/down reorder buttons. Returns a new array; a no-op (key
// missing, or already at that end) returns the same values (by value) as
// `order` unchanged.
function moveCardFieldKey(order, key, direction) {
  const list = applyCardFieldOrder(order);
  const from = list.indexOf(key);
  if (from === -1) return list;
  const to = direction === 'up' ? from - 1 : from + 1;
  if (to < 0 || to >= list.length) return list;
  const result = list.slice();
  const [moved] = result.splice(from, 1);
  result.splice(to, 0, moved);
  return result;
}

module.exports = {
  DEFAULT_CARD_FIELD_ORDER,
  CARD_FIELD_ORDER_KEYS,
  isValidCardFieldKey,
  applyCardFieldOrder,
  moveCardFieldKey,
};
