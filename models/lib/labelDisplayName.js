'use strict';

// Pure helper: resolve a board label's human-readable display name for
// notification / outgoing-webhook text. Extracted so the fallback logic is
// unit-testable in plain Node without Meteor (mirrors
// models/lib/boardSortReorder.js and models/lib/cardSearch.js).
//
// #5442 (outgoing webhook on add/remove label did not include the label name):
// a WeKan label has an optional `name` and a `color`. In the UI a label with an
// empty name is shown by its color, so the webhook must do the same instead of
// emitting a bare, generic "label". Preference order: name, then color, then the
// label id, so the resolved text is never empty.
function labelDisplayName(label) {
  if (!label) return '';
  const name = typeof label.name === 'string' ? label.name.trim() : '';
  if (name) return label.name;
  const color = typeof label.color === 'string' ? label.color.trim() : '';
  if (color) return label.color;
  return typeof label._id === 'string' ? label._id : '';
}

module.exports = {
  labelDisplayName,
};
