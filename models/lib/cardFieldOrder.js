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
//   sections  - the reorderable middle, in default order: Card Settings'
//               sections (see below). The fields of a section are
//               reorderable WITHIN it. `pinnedFirst` marks a section whose
//               first field is its heading (Description: Title on the card) -
//               that field stays first;
//   tail      - fields drawn at a fixed place outside the sections (the
//               card's attachment count on its heading, the activities in the
//               right column).
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
// THE SECTIONS ARE CARD SETTINGS' SECTIONS (2026-10-28). The reorderable
// sections of both layouts are the sections of Board Settings / Card
// (models/lib/cardSettingsSections.js), with the same ids, and each holds the
// rows of that section that have a place of their own on that surface - so a
// field is dragged in Card Settings inside its section and is drawn on the
// card and the minicard inside the same section. Where the SECTIONS go is no
// longer this file's: the opened card and the minicard draw them in the
// board's section order of that side (cardSettingsSectionOrder,
// minicardSettingsSectionOrder). The section order inside the flat array
// below is still kept canonical, but nothing draws by it any more.
//
// THE DEFAULT ORDER inside each section is the order the opened card and the
// minicard drew those fields in before (cardDetails.jade and minicard.jade as
// they were at 59f7d61df, the parent of the first field-order commit, #4448,
// 131514d61, read top to bottom), so a board that never set an order still
// draws each section's fields in the order it always drew them. Until
// 2026-10-28 the layouts' sections were the templates' own groups (the card's
// "Sort" group, the minicard's `.badges` strip ...) and the default flat order
// was those templates read top to bottom; it changed on purpose when the
// surfaces started drawing Card Settings' sections.
// tests/cardFieldOrderDefaultIsPreFeatureOrder.test.cjs pins both sequences.
//
// A stored order from before keeps meaning what it can: its field keys keep
// their relative order inside their new section, the first version's five
// LEGACY section keys and the template groups' keys the REST API spoke in
// (`dates`, `sort`, `voteAndPoker`, the minicard's `badges` ...) expand to
// their fields (`aliases`).

// ── the Scrum fields ─────────────────────────────────────────────────────────

// The rows of Board Settings / Card that show the Scrum fields ("Scrum
// settings: Sprint" ...; models/lib/cardSettingsRows.js), all in the Scrum
// section.
const SCRUM_FIELD_KEYS = ['scrumSprint', 'scrumPastSprints', 'scrumRelease', 'scrumIssueType',
  'scrumAcceptanceCriteria', 'scrumBacklogRank'];

// ── the opened card ──────────────────────────────────────────────────────────

// The head is the card's title bar (Mark complete, the number, the cover
// above it): fixed, never dragged. The tail holds what has a fixed place
// outside the sections - the attachment count is on the Attachments heading,
// and the activities are the right column of every opened card.
const CARD_LAYOUT = {
  head: ['dueComplete', 'cardNumber', 'cover'],
  sections: [
    { key: 'labels', fields: ['labels', 'stickers', 'location'] },
    { key: 'date', fields: ['receivedDate', 'startDate', 'dueDate', 'endDate'] },
    { key: 'members', fields: ['members', 'assignee', 'creator', 'requestedBy', 'assignedBy'] },
    // The old Dependencies section and the first half of "Sort", then the
    // card buttons (drawn after the labels before) and the similar cards
    // (drawn after the text notes before).
    { key: 'card', fields: ['dependencies', 'cardSortingByNumber', 'showLists', 'cardButtons', 'similarCards'] },
    // The second half of the old "Sort" group.
    { key: 'time', fields: ['spentTime', 'flowtime', 'pomodoro'] },
    { key: 'customFields', fields: ['customFields'] },
    { key: 'vote', fields: ['vote'] },
    { key: 'poker', fields: ['poker'] },
    // "Description: Title" is the section's heading, so it stays first.
    { key: 'description', fields: ['descriptionTitle', 'descriptionText'], pinnedFirst: true },
    { key: 'scrum', fields: SCRUM_FIELD_KEYS.slice() },
    // The old fixed tail, now sections: the checklist count was drawn above
    // the checklists.
    { key: 'checklists', fields: ['checklistCount', 'checklists'] },
    { key: 'subtasks', fields: ['subtasks'] },
    { key: 'attachments', fields: ['attachments', 'textNotes'] },
    { key: 'comments', fields: ['comments'] },
  ],
  tail: ['attachmentCount', 'activities'],
  // The first version of #4448 stored the five SECTION keys below; each
  // expands to the fields that section rendered then - Members carried
  // Dependencies and Sort as a fixed appendage, Custom Fields carried
  // Vote/Poker - so the fields keep their relative order.
  legacy: {
    labels: ['labels', 'stickers', 'location'],
    dates: ['receivedDate', 'startDate', 'dueDate', 'endDate'],
    members: ['members', 'assignee', 'creator', 'requestedBy', 'assignedBy', 'dependencies',
      'cardSortingByNumber', 'showLists', 'spentTime', 'flowtime', 'pomodoro'],
    customFields: ['customFields', 'vote', 'poker'],
    description: ['descriptionTitle', 'descriptionText'],
  },
  // The section keys of the layout before 2026-10-28 that are not keys now
  // (the REST cardFieldOrder API spoke in them), each standing for its fields.
  aliases: {
    dates: ['receivedDate', 'startDate', 'dueDate', 'endDate'],
    sort: ['cardSortingByNumber', 'showLists', 'spentTime', 'flowtime', 'pomodoro'],
    voteAndPoker: ['vote', 'poker'],
  },
};

// ── the minicard ─────────────────────────────────────────────────────────────

// The head is the title row and the cover drawn under it: fixed. Labels
// text, List title, Requested by's ... rows that only modify another element
// have no position (cardSettingsRows.js `after`). Inside a section the
// minicard groups what shares a container - the dates line, the badge strip
// - so the minicard stays as compact as it was (client/components/cards
// /minicard.js minicardGroups).
const MINICARD_LAYOUT = {
  head: ['dueComplete', 'cardNumber', 'cover'],
  sections: [
    // The Scrum blocks were first; the work item type was the first badge.
    { key: 'scrum', fields: ['scrumSprint', 'scrumPastSprints', 'scrumRelease', 'scrumAcceptanceCriteria',
      'scrumBacklogRank', 'scrumIssueType'] },
    { key: 'date', fields: ['receivedDate', 'startDate', 'dueDate', 'endDate'] },
    // Spent time was the last of the dates line; the timers came last of all.
    { key: 'time', fields: ['spentTime', 'flowtime', 'pomodoro'] },
    { key: 'labels', fields: ['labels', 'stickers', 'location'] },
    { key: 'customFields', fields: ['customFields'] },
    { key: 'members', fields: ['assignee', 'members', 'creator', 'requestedBy', 'assignedBy'] },
    { key: 'checklists', fields: ['checklists', 'checklistCount'] },
    { key: 'card', fields: ['dependencies', 'cardSortingByNumber', 'showLists', 'swimlaneName'] },
    { key: 'comments', fields: ['commentCount', 'comments', 'activities'] },
    { key: 'vote', fields: ['vote'] },
    { key: 'poker', fields: ['poker'] },
    { key: 'attachments', fields: ['attachmentCount', 'attachments', 'textNotes'] },
    { key: 'subtasks', fields: ['subtasks'] },
    { key: 'description', fields: ['descriptionText'] },
  ],
  tail: [],
  legacy: {},
  // The template groups the minicard order was made of before 2026-10-28.
  aliases: {
    dates: ['receivedDate', 'startDate', 'dueDate', 'endDate', 'spentTime'],
    badges: ['scrumIssueType', 'dependencies', 'stickers', 'commentCount', 'vote', 'poker',
      'attachmentCount', 'subtasks', 'checklistCount', 'cardSortingByNumber'],
  },
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
      storedFields.push(...layout.legacy[key].filter(field => allFields.has(field)));
      return;
    }
    if (allFields.has(key)) {
      storedFields.push(key);
      return;
    }
    // A section key (the REST cardFieldOrder API still speaks in sections)
    // stands for its fields; anything else is unknown and dropped.
    const section = layout.sections.find(s => s.key === key);
    if (section) {
      storedFields.push(...section.fields);
      return;
    }
    // A key of the layout before 2026-10-28 (see the top of the file).
    const alias = layout.aliases && layout.aliases[key];
    if (alias) storedFields.push(...alias.filter(field => allFields.has(field)));
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

// Whether `field` can be reordered at all: it is in a section (head and tail
// fields are drawn at a fixed place).
function isMovableKey(layout, field) {
  return Boolean(sectionOfField(layout, field));
}

// Drag and drop in Board Settings / Card: put `field` at `targetIndex` among
// the fields that HAVE a position (the sections' fields, head and tail left
// out), as near as the layout allows. It walks one moveKey() step at a time,
// so every rule of the arrows holds - a pinned header stays first, a field
// leaving its section takes the section with it - and keeps the order that
// came closest. Returns the new canonical flat order.
function placeKey(stored, field, targetIndex, layout) {
  const movable = flat => flat.filter(key => sectionOfField(layout, key));
  let best = applyLayoutOrder(stored, layout);
  if (!sectionOfField(layout, field) || !Number.isInteger(targetIndex)) return best;
  const distance = flat => Math.abs(movable(flat).indexOf(field) - targetIndex);
  const direction = movable(best).indexOf(field) > targetIndex ? 'up' : 'down';
  let current = best;
  for (let step = 0; step < 200 && distance(best) > 0; step += 1) {
    const next = moveKey(current, field, direction, layout);
    if (next.join(' ') === current.join(' ')) break;
    current = next;
    if (distance(current) < distance(best)) best = current;
    // Past the target in the direction of travel: further steps only go away.
    const at = movable(current).indexOf(field);
    if (direction === 'up' ? at < targetIndex : at > targetIndex) break;
  }
  return best;
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
  SCRUM_FIELD_KEYS,
  CARD_LAYOUT,
  MINICARD_LAYOUT,
  applyLayoutOrder,
  sectionOrder,
  fieldsOfSection,
  canMove,
  moveKey,
  placeKey,
  isMovableKey,

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
