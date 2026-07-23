'use strict';

// Pure helper for the card-title "#" label autocomplete (#5116): typing
// "#test" in the add-card / edit-card-title field should suggest a label named
// "Testing". The original match used a case-SENSITIVE `label.name.indexOf(term)`,
// so "#test" (lowercase) never matched "Testing" (capital T) even though
// "#Test" did. Extracted so the matching is unit-testable in plain Node without
// Meteor/jQuery/textcomplete (mirrors models/lib/sortCardsByTitle.js and the
// other models/lib pure helpers).
//
// The board's "@" member autocomplete already matches case-insensitively via
// toLowerCase()/includes(); this brings the "#" label autocomplete in line.

// Does `label` match the typed `term`? Case-insensitive substring match against
// the label's name and its color (color is the fallback shown when a label has
// no name). A missing name/color is treated as an empty string so it never
// throws. An empty term matches every label (the menu shows all labels before
// anything is typed), matching the previous ''.indexOf('') === 0 behaviour.
function labelMatchesTerm(label, term) {
  if (!label) return false;
  const needle = String(term == null ? '' : term).toLowerCase();
  const name = String(label.name == null ? '' : label.name).toLowerCase();
  const color = String(label.color == null ? '' : label.color).toLowerCase();
  return name.indexOf(needle) > -1 || color.indexOf(needle) > -1;
}

// Filter a list of board labels by the typed term, preserving input order.
// Does not mutate the input labels.
function filterLabelsByTerm(labels, term) {
  if (!Array.isArray(labels)) return [];
  return labels.filter(label => labelMatchesTerm(label, term));
}

export {
  labelMatchesTerm,
  filterLabelsByTerm,
};
