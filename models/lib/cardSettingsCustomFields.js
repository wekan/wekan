'use strict';

// Card Settings' Custom Fields section (docs/Features/Cards/Card-Settings.md):
// its items are the board's custom field DEFINITIONS, drawn like checklist
// items, in their `sort` order (#4165) - the order the opened card and the
// minicard draw them in (models/lib/customFieldsWD.js) - with a "+" under them
// that creates another.
//
// Each item's checkbox is one flag of the definition, by the side Card
// Settings shows:
//
//   Show on Minicard  showOnCard    - the legacy name of what the minicard
//                                     reads (minicard.jade `if definition.showOnCard`)
//   Show on Card      alwaysOnCard  - "add to all cards": the opened card draws
//                                     the custom fields the CARD carries, and
//                                     this flag is what puts the field on every
//                                     card of the board (server/models/customFields.js
//                                     addToAllCards, after insert and update)
//
// Unticking Show on Card stops the field being added to cards; a card that
// already carries it keeps it until it is taken off that card (its Custom
// Fields hamburger), because a card may carry a field it was given on its own.
//
// The section's OWN checkbox is the board's Custom Fields flag of that side
// (allowsCustomFields / allowsCustomFieldsOnMinicard, the row that used to be
// the section's only item): the section is shown when that flag is on and the
// section is not hidden whole (cardSettingsSections.js sectionShown).
//
// Pure: no Meteor. tests/cardSettingsCustomFields.test.cjs.

const SIDE_FLAG = Object.freeze({ card: 'alwaysOnCard', minicard: 'showOnCard' });

// The section whose items are the definitions, and the row whose flag is that
// section's own checkbox.
const CUSTOM_FIELDS_SECTION = 'customFields';
const CUSTOM_FIELDS_ROW = 'customFields';

// The definitions in display order: ascending `sort`; one without a `sort`
// (created before it existed) after those that have one, by name - as
// customFieldsWD.js orders a card's fields.
function orderedDefinitions(definitions) {
  const list = (Array.isArray(definitions) ? definitions : []).filter(d => d && d._id);
  const name = d => String(d.name || '');
  return [...list].sort((a, b) => {
    const aHas = typeof a.sort === 'number';
    const bHas = typeof b.sort === 'number';
    if (aHas && bHas && a.sort !== b.sort) return a.sort - b.sort;
    if (aHas !== bHas) return aHas ? -1 : 1;
    return name(a).localeCompare(name(b));
  });
}

// Whether a definition's checkbox is ticked on `side`.
function definitionChecked(definition, side) {
  const flag = SIDE_FLAG[side];
  return Boolean(definition && flag && definition[flag] === true);
}

// The `$set` that ticks (on = true) or unticks a definition on `side`; null
// for an unknown side.
function definitionToggleSet(side, on) {
  const flag = SIDE_FLAG[side];
  return flag ? { [flag]: on === true } : null;
}

// The `sort` of each id after a drop: `ids` top to bottom as dropped, each
// given its index - only the ids whose `sort` changes. Unknown or repeated ids
// are left out.
function sortsAfterDrop(definitions, ids) {
  const byId = new Map((Array.isArray(definitions) ? definitions : []).filter(d => d && d._id).map(d => [d._id, d]));
  const seen = new Set();
  const order = (Array.isArray(ids) ? ids : []).filter(id => byId.has(id) && !seen.has(id) && seen.add(id));
  const out = {};
  order.forEach((id, index) => {
    if (byId.get(id).sort !== index) out[id] = index;
  });
  return out;
}

// The ids in display order after moving `id` one step ('up' or 'down') - the
// keyboard way to drag. The same order when it cannot move.
function idsAfterStep(definitions, id, direction) {
  const ids = orderedDefinitions(definitions).map(d => d._id);
  const at = ids.indexOf(id);
  const to = direction === 'up' ? at - 1 : direction === 'down' ? at + 1 : at;
  if (at < 0 || to < 0 || to >= ids.length || to === at) return ids;
  ids.splice(at, 1);
  ids.splice(to, 0, id);
  return ids;
}

module.exports = {
  SIDE_FLAG, CUSTOM_FIELDS_SECTION, CUSTOM_FIELDS_ROW,
  orderedDefinitions, definitionChecked, definitionToggleSet, sortsAfterDrop, idsAfterStep,
};
