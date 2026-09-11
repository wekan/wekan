'use strict';

// Pure helpers for the card and minicard "field order" settings (#4448, and
// the per-field / per-minicard extension of it): a board may reorder what the
// opened card and the minicard show. Extracted so the ordering decision is
// unit-testable in plain Node without Meteor (mirrors
// models/lib/boardSortReorder.js).
//
// THE MODEL. Each surface (card, minicard) has a LAYOUT:
//
//   head      - fields drawn at a fixed place at the top (the card's title bar:
//               Mark complete, number, cover) that the order cannot move;
//   sections  - the reorderable middle, in default order. A section is a
//               group of fields that render together (the card's Dates group,
//               the minicard's `.badges` strip). The fields of a section are
//               reorderable WITHIN it, and the section as a whole is
//               reorderable among the sections. `pinnedFirst` marks a section
//               whose first field is its fold header (Labels, Members, Sort,
//               Description on the card) - that field stays first;
//   tail      - fields drawn at a fixed place at the bottom (the card's
//               checklists ... activities, which live in their own galleries
//               and the right column).
//
// What is STORED is one flat array of field keys (`board.cardFieldOrder`,
// `board.minicardFieldOrder`). `applyLayoutOrder()` turns whatever is stored -
// missing, partial, stale, unknown-containing, or one of the five LEGACY
// section keys the first version of #4448 stored - into the canonical flat
// order: head, then the sections in the order their first stored field
// appears, each section's fields in stored order with the missing ones
// appended in default order, then the tail. So the popup's list, the card
// and the minicard all read one canonical sequence and cannot disagree, and a
// board that never touched the setting renders byte-for-byte what it always
// has.
//
// THE DEFAULT ORDER of each layout - head, then the sections and their fields
// as listed, then the tail - is the order the opened card and the minicard
// rendered BEFORE fields became orderable: cardDetails.jade and minicard.jade
// as they were at 59f7d61df, the parent of the first field-order commit
// (#4448, 131514d61), read top to bottom. It is not a tidied-up order and it
// must not become one, because that default is also what every board without
// a stored order renders and what applyLayoutOrder() falls back to for the
// keys a stored order does not name. A field added since then sits beside
// its closest older neighbour (Text notes in the card's tail, Swimlane name
// last on the minicard). tests/cardFieldOrderDefaultIsPreFeatureOrder.test.cjs
// pins both sequences literally.

// ── the opened card ──────────────────────────────────────────────────────────

const CARD_LAYOUT = {
  head: ['dueComplete', 'cardNumber', 'cover'],
  sections: [
    { key: 'labels', fields: ['labels', 'stickers', 'location'], pinnedFirst: true },
    { key: 'dates', fields: ['receivedDate', 'startDate', 'dueDate', 'endDate'] },
    { key: 'members', fields: ['members', 'assignee', 'creator', 'requestedBy', 'assignedBy'], pinnedFirst: true },
    { key: 'dependencies', fields: ['dependencies'] },
    { key: 'sort', fields: ['cardSortingByNumber', 'showLists', 'spentTime', 'flowtime', 'pomodoro'], pinnedFirst: true },
    { key: 'customFields', fields: ['customFields'] },
    { key: 'voteAndPoker', fields: ['vote', 'poker'] },
    { key: 'description', fields: ['descriptionTitle', 'descriptionText'], pinnedFirst: true },
  ],
  tail: ['checklists', 'checklistCount', 'subtasks', 'attachments', 'attachmentCount',
    'textNotes', 'comments', 'activities'],
  // The first version of #4448 stored the five SECTION keys below. They stay
  // valid: each expands to the fields the section rendered then - Members
  // carried Dependencies and Sort as a fixed appendage, Custom Fields carried
  // Vote/Poker - so a stored `['description', 'labels', ...]` still puts
  // exactly what it put where it put it.
  legacy: {
    labels: ['labels'],
    dates: ['dates'],
    members: ['members', 'dependencies', 'sort'],
    customFields: ['customFields', 'voteAndPoker'],
    description: ['description'],
  },
};

// ── the minicard ─────────────────────────────────────────────────────────────

// Top to bottom as minicard.jade renders it. `dates` and `badges` are the
// two groups whose fields share a container (`.dates`, `.badges`); every
// other section is a single element. Labels text, List title, Requested by,
// Assigned by and Description title have Board Settings rows but no element
// of their own on the minicard (they modify another element, or are read by
// nothing there), so they have no position - see cardSettingsRows.js.
const MINICARD_LAYOUT = {
  head: ['dueComplete', 'cardNumber'],
  sections: [
    { key: 'dates', fields: ['receivedDate', 'startDate', 'dueDate', 'endDate', 'spentTime'] },
    { key: 'cover', fields: ['cover'] },
    { key: 'labels', fields: ['labels'] },
    { key: 'customFields', fields: ['customFields'] },
    { key: 'assignee', fields: ['assignee'] },
    { key: 'members', fields: ['members'] },
    { key: 'creator', fields: ['creator'] },
    { key: 'checklists', fields: ['checklists'] },
    { key: 'badges', fields: ['dependencies', 'stickers', 'commentCount', 'vote', 'poker',
      'attachmentCount', 'subtasks', 'checklistCount', 'cardSortingByNumber'] },
    { key: 'descriptionText', fields: ['descriptionText'] },
    { key: 'comments', fields: ['comments'] },
    { key: 'showLists', fields: ['showLists'] },
    { key: 'swimlaneName', fields: ['swimlaneName'] },
  ],
  tail: [],
  legacy: {},
};

// ── generic layout arithmetic ────────────────────────────────────────────────

function sectionOfField(layout, field) {
  return layout.sections.find(s => s.fields.includes(field)) || null;
}

function defaultOrder(layout) {
  return [
    ...layout.head,
    ...layout.sections.flatMap(s => s.fields),
    ...layout.tail,
  ];
}

// The canonical flat order for `stored` under `layout` (see the top of the
// file). Never throws; never drops or duplicates a known field.
function applyLayoutOrder(stored, layout) {
  const allFields = new Set(defaultOrder(layout));
  const entries = Array.isArray(stored) ? stored.filter(k => typeof k === 'string') : [];
  // A LEGACY value is made of legacy section keys only and has one that is
  // not also a field key (`dates`, `description`): `members` and
  // `customFields` are both, and in a list of field keys they are fields.
  const isLegacy = entries.length > 0
    && entries.every(k => layout.legacy[k])
    && entries.some(k => !allFields.has(k));
  const storedFields = [];
  entries.forEach(key => {
    if (isLegacy) {
      layout.legacy[key].forEach(sectionKey => {
        const s = layout.sections.find(x => x.key === sectionKey);
        if (s) storedFields.push(...s.fields);
      });
      return;
    }
    if (allFields.has(key)) {
      storedFields.push(key);
      return;
    }
    // A section key (the REST cardFieldOrder API still speaks in sections)
    // stands for its fields; anything else is unknown and dropped.
    const section = layout.sections.find(s => s.key === key);
    if (section) storedFields.push(...section.fields);
  });

  // Sections in the order their first stored field appears, then the rest in
  // default order.
  const sectionKeys = [];
  storedFields.forEach(field => {
    const s = sectionOfField(layout, field);
    if (s && !sectionKeys.includes(s.key)) sectionKeys.push(s.key);
  });
  layout.sections.forEach(s => {
    if (!sectionKeys.includes(s.key)) sectionKeys.push(s.key);
  });

  const middle = sectionKeys.flatMap(sectionKey => {
    const s = layout.sections.find(x => x.key === sectionKey);
    const fields = [];
    storedFields.forEach(field => {
      if (s.fields.includes(field) && !fields.includes(field)) fields.push(field);
    });
    s.fields.forEach(field => {
      if (!fields.includes(field)) fields.push(field);
    });
    if (s.pinnedFirst) {
      const first = s.fields[0];
      fields.splice(fields.indexOf(first), 1);
      fields.unshift(first);
    }
    return fields;
  });

  return [...layout.head, ...middle, ...layout.tail];
}

function sectionOrder(stored, layout) {
  const flat = applyLayoutOrder(stored, layout);
  const keys = [];
  flat.forEach(field => {
    const s = sectionOfField(layout, field);
    if (s && !keys.includes(s.key)) keys.push(s.key);
  });
  return keys;
}

function fieldsOfSection(stored, layout, sectionKey) {
  const s = layout.sections.find(x => x.key === sectionKey);
  if (!s) return [];
  return applyLayoutOrder(stored, layout).filter(field => s.fields.includes(field));
}

// Whether the up/down button of `field` does anything, for the popup to
// disable the arrows that would be no-ops. A field in the head or tail is
// fixed; the pinned header of a section moves only with its section.
function canMove(stored, layout, field, direction) {
  return moveKey(stored, field, direction, layout).join(' ')
    !== applyLayoutOrder(stored, layout).join(' ');
}

// Move `field` one step up/down. Within its section when it can; the whole
// section when the field is at the section's edge (the first field going up,
// the last going down) - so "up" on the first row of Dates lifts Dates above
// the section before it. A pinned header never moves within its section: its
// up/down always move the section. Head and tail fields never move. Returns
// the new canonical flat order; a no-op returns the current one.
function moveKey(stored, field, direction, layout) {
  const flat = applyLayoutOrder(stored, layout);
  const s = sectionOfField(layout, field);
  if (!s || (direction !== 'up' && direction !== 'down')) return flat;

  const sections = sectionOrder(stored, layout);
  const fields = fieldsOfSection(stored, layout, s.key);
  const at = fields.indexOf(field);
  const pinned = Boolean(s.pinnedFirst);
  const atEdge = direction === 'up' ? at === 0 : at === fields.length - 1;
  // The row under a pinned header cannot go above it, and that is not the
  // section's edge either: nothing happens.
  if (pinned && direction === 'up' && at === 1) return flat;

  if (atEdge || (pinned && at === 0)) {
    // Move the section.
    const si = sections.indexOf(s.key);
    const ti = direction === 'up' ? si - 1 : si + 1;
    if (ti < 0 || ti >= sections.length) return flat;
    const newSections = sections.slice();
    newSections.splice(si, 1);
    newSections.splice(ti, 0, s.key);
    return [
      ...layout.head,
      ...newSections.flatMap(k => fieldsOfSection(stored, layout, k)),
      ...layout.tail,
    ];
  }

  const newFields = fields.slice();
  const to = direction === 'up' ? at - 1 : at + 1;
  newFields.splice(at, 1);
  newFields.splice(to, 0, field);
  return [
    ...layout.head,
    ...sections.flatMap(k => (k === s.key ? newFields : fieldsOfSection(stored, layout, k))),
    ...layout.tail,
  ];
}

// ── the card's public surface ────────────────────────────────────────────────

const DEFAULT_CARD_ORDER = defaultOrder(CARD_LAYOUT);
const CARD_ORDER_KEYS = DEFAULT_CARD_ORDER.slice();

// The section keys, in default order. The first version of #4448 exported
// five (`labels, dates, members, customFields, description`); Dependencies,
// Sort and Vote/Poker were fixed appendages then and are sections now.
const DEFAULT_CARD_FIELD_ORDER = CARD_LAYOUT.sections.map(s => s.key);
const CARD_FIELD_ORDER_KEYS = DEFAULT_CARD_FIELD_ORDER.slice();

function isValidCardFieldKey(key) {
  return CARD_FIELD_ORDER_KEYS.includes(key);
}

function applyCardOrder(stored) {
  return applyLayoutOrder(stored, CARD_LAYOUT);
}

// The card's SECTION order - what cardDetails.jade's `each section in
// orderedCardFieldSections` iterates and what the REST cardFieldOrder
// endpoints return. Accepts a stored value of field keys, of the legacy
// section keys, or a mix.
function applyCardFieldOrder(storedOrder) {
  return sectionOrder(storedOrder, CARD_LAYOUT);
}

function orderedCardFieldsOf(stored, sectionKey) {
  return fieldsOfSection(stored, CARD_LAYOUT, sectionKey);
}

function moveCardKey(stored, field, direction) {
  return moveKey(stored, field, direction, CARD_LAYOUT);
}

// Section-level move, kept for the REST API and older callers that reorder
// whole sections: returns a section-key list.
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

// ── the minicard's public surface ────────────────────────────────────────────

const DEFAULT_MINICARD_ORDER = defaultOrder(MINICARD_LAYOUT);
const MINICARD_ORDER_KEYS = DEFAULT_MINICARD_ORDER.slice();

function applyMinicardOrder(stored) {
  return applyLayoutOrder(stored, MINICARD_LAYOUT);
}

function orderedMinicardSections(stored) {
  return sectionOrder(stored, MINICARD_LAYOUT);
}

function orderedMinicardFieldsOf(stored, sectionKey) {
  return fieldsOfSection(stored, MINICARD_LAYOUT, sectionKey);
}

function moveMinicardKey(stored, field, direction) {
  return moveKey(stored, field, direction, MINICARD_LAYOUT);
}

module.exports = {
  CARD_LAYOUT,
  MINICARD_LAYOUT,
  applyLayoutOrder,
  sectionOrder,
  fieldsOfSection,
  canMove,
  moveKey,

  DEFAULT_CARD_ORDER,
  CARD_ORDER_KEYS,
  DEFAULT_CARD_FIELD_ORDER,
  CARD_FIELD_ORDER_KEYS,
  isValidCardFieldKey,
  applyCardOrder,
  applyCardFieldOrder,
  orderedCardFieldsOf,
  moveCardKey,
  moveCardFieldKey,

  DEFAULT_MINICARD_ORDER,
  MINICARD_ORDER_KEYS,
  applyMinicardOrder,
  orderedMinicardSections,
  orderedMinicardFieldsOf,
  moveMinicardKey,
};
