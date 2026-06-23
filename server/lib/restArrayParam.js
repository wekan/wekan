// Pure, dependency-free helper (no Meteor imports) so it can be unit tested
// directly with plain Node. Used by the REST API card update handler in
// server/models/cards.js.
//
// #3697: editing a card's `members` via the REST API and then trying to clear
// them left the field in a state the UI could not edit. Two problems:
//   1. The handler guarded with `if (req.body.members)`, which is falsy for the
//      two natural "clear" payloads (`null` and `""`), so removing the last
//      member via REST was a silent no-op.
//   2. Its string branch wrote `null` (not `[]`) for an empty value, and a card
//      with `members: null` breaks UI code that treats it as an array
//      (`members.indexOf(...)`, the members popup, etc.) — the schema declares
//      `members` as an Array with defaultValue `[]`, never null.
//
// coerceRestArrayParam normalizes whatever the REST client sent into a clean
// String[] so the stored value is always an array: a single id becomes a
// one-element array, an empty string / null / any non-array becomes `[]` (an
// explicit clear), and an array is kept but filtered to strings (so a stray
// `[null]` / `[123]` cannot reach the document).

/**
 * @param {*} value the raw REST body value for members / assignees
 * @return {string[]} a normalized array of id strings (possibly empty)
 */
function coerceRestArrayParam(value) {
  if (Array.isArray(value)) {
    return value.filter(v => typeof v === 'string' && v !== '');
  }
  if (typeof value === 'string') {
    return value === '' ? [] : [value];
  }
  // null / undefined / number / object → treat as an explicit clear.
  return [];
}

module.exports = { coerceRestArrayParam };
