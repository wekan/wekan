'use strict';

// Pure helpers for board card search. Extracted from models/boards.js
// (Board.searchCards) so the query it builds is unit-testable without Meteor.
//
// #5680 (can't search numbers in custom fields): "number" and "currency" custom
// fields store their value as a JS Number (the inputs save `parseInt(...)` /
// `Number(...)`), but the search only matched custom fields with
// `{ value: <regex> }`. A MongoDB / Minimongo regex only matches STRING values,
// so it silently skipped every numeric custom field — searching a card's
// transaction number (e.g. 2025001) or currency amount (e.g. 123) never found
// it. We add an exact numeric-equality clause when the term parses to a plain
// finite number, so numeric custom fields match too. (Card search runs against
// Minimongo on the client, which — like MongoDB — cannot regex a numeric field,
// so equality is the correct cross-environment match rather than `$toString`.)

// Parse a search term into a Number the way the number/currency custom-field
// inputs store their value (a comma is accepted as a decimal separator, matching
// the currency input's `value.replace(',', '.')`). Returns null when the term is
// not a plain number, so we never widen a text search into an accidental match.
function parseNumericSearchTerm(term) {
  if (typeof term !== 'string') return null;
  const trimmed = term.trim();
  if (trimmed === '') return null;
  const normalized = trimmed.replace(',', '.');
  // Require a plain decimal number. This rejects things Number() would otherwise
  // coerce (Number('') === 0, Number('0x1f') === 31, Number('1e3') === 1000) so
  // only genuine numeric terms add the numeric clause.
  if (!/^[+-]?(\d+(\.\d+)?|\.\d+)$/.test(normalized)) return null;
  const n = Number(normalized);
  return Number.isFinite(n) ? n : null;
}

// Build the `$or` clause array for a board card search on `term`. `term` is
// expected to be a trimmed, non-empty string (Board.searchCards guards that).
function buildCardSearchOr(term) {
  const regex = new RegExp(term, 'i');
  const or = [
    { title: regex },
    { description: regex },
    { customFields: { $elemMatch: { value: regex } } },
  ];
  const numeric = parseNumericSearchTerm(term);
  if (numeric !== null) {
    // #5680: also match numeric custom fields (number / currency) by value.
    or.push({ customFields: { $elemMatch: { value: numeric } } });
  }
  return or;
}

module.exports = { parseNumericSearchTerm, buildCardSearchOr };
