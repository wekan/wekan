'use strict';

// #2012: story and task cards, with custom fields of their own. A card may be
// a Story or a Task (`cardKind`; unset is an ordinary card). A custom field
// can be limited to kinds (`cardKinds`; empty is every card): it is then
// added to a card when the card gets that kind, and shown only on cards of
// it. Pure: tests/cardKinds.test.cjs.

const CARD_KINDS = Object.freeze(['story', 'task']);
const KIND_ICONS = Object.freeze({ story: 'fa-book', task: 'fa-check-square-o' });

function cleanCardKind(kind) {
  return CARD_KINDS.includes(kind) ? kind : null;
}

function cleanCardKinds(kinds) {
  return Array.isArray(kinds) ? CARD_KINDS.filter(k => kinds.includes(k)) : [];
}

// Whether a field definition shows on a card of `kind`.
function definitionAppliesToKind(definition, kind) {
  const kinds = definition && Array.isArray(definition.cardKinds) ? definition.cardKinds : [];
  return kinds.length === 0 || kinds.includes(kind);
}

// The definitions of `kind`'s own fields a card does not have yet.
function fieldsToAddForKind(cardCustomFields, definitions, kind) {
  if (!cleanCardKind(kind)) return [];
  const have = new Set((Array.isArray(cardCustomFields) ? cardCustomFields : []).map(f => f && f._id));
  return (Array.isArray(definitions) ? definitions : [])
    .filter(d => d && Array.isArray(d.cardKinds) && d.cardKinds.includes(kind) && !have.has(d._id));
}

module.exports = { CARD_KINDS, KIND_ICONS, cleanCardKind, cleanCardKinds, definitionAppliesToKind, fieldsToAddForKind };
