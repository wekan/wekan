'use strict';

// 2026-10-28: the layouts' sections are Card Settings' sections (same ids:
// labels, date, members, card, time, ...), because the opened card and the
// minicard draw those; a field reorders inside its section. The template
// groups of before (`dates`, `sort`, `voteAndPoker`, the minicard's `badges`
// ...) are aliases a stored order may still name. Labels and Members are not
// pinned any more - their heading is the section's own on the card, not their
// first field - Description still is (its Title row is the heading).
//
// Board Settings / Card orders the opened card and the minicard per FIELD,
// each independently (board.cardFieldOrder, board.minicardFieldOrder). The
// arithmetic is pure - models/lib/cardFieldOrder.js - and this pins it:
// the canonical order, moving within a section and across sections, the
// pinned headers, the fixed head and tail, the legacy five section keys, and
// the negatives (unknown keys dropped, missing keys appended, no-ops).
// Run: node tests/cardFieldOrderLayout.test.cjs

const assert = require('assert');
const {
  CARD_LAYOUT,
  MINICARD_LAYOUT,
  applyLayoutOrder,
  sectionOrder,
  fieldsOfSection,
  canMove,
  moveKey,
  DEFAULT_CARD_ORDER,
  applyCardOrder,
  applyCardFieldOrder,
  orderedCardFieldsOf,
  moveCardKey,
  DEFAULT_MINICARD_ORDER,
  applyMinicardOrder,
  orderedMinicardSections,
  orderedMinicardFieldsOf,
  moveMinicardKey,
} = require('../models/lib/cardFieldOrder');
const { CARD_SETTINGS_ROWS, rowsForSide } = require('../models/lib/cardSettingsRows');

let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }

console.log('cardFieldOrderLayout:');

// ── canonical order ──────────────────────────────────────────────────────────

// "Historical" here is literal: the default is the render order of
// cardDetails.jade and minicard.jade at 59f7d61df, the commit before fields
// became orderable (#4448, 131514d61). The exact sequences are pinned in
// tests/cardFieldOrderDefaultIsPreFeatureOrder.test.cjs; this suite tests the
// arithmetic around them.
test('no stored order gives the historical order of each surface', () => {
  assert.deepStrictEqual(applyCardOrder(undefined), DEFAULT_CARD_ORDER);
  assert.deepStrictEqual(applyCardOrder(null), DEFAULT_CARD_ORDER);
  assert.deepStrictEqual(applyCardOrder([]), DEFAULT_CARD_ORDER);
  assert.deepStrictEqual(applyCardOrder('labels'), DEFAULT_CARD_ORDER);
  assert.deepStrictEqual(applyMinicardOrder(undefined), DEFAULT_MINICARD_ORDER);
  assert.deepStrictEqual(applyMinicardOrder({}), DEFAULT_MINICARD_ORDER);
});

test('the default card order is head, the sections, the tail - every field exactly once', () => {
  assert.deepStrictEqual(DEFAULT_CARD_ORDER.slice(0, 3), ['dueComplete', 'cardNumber', 'cover']);
  assert.deepStrictEqual(DEFAULT_CARD_ORDER.slice(-CARD_LAYOUT.tail.length), CARD_LAYOUT.tail);
  // The tail is what has a fixed place outside the sections (2026-10-28).
  assert.deepStrictEqual(CARD_LAYOUT.tail, ['attachmentCount', 'activities']);
  assert.strictEqual(new Set(DEFAULT_CARD_ORDER).size, DEFAULT_CARD_ORDER.length);
  assert.strictEqual(new Set(DEFAULT_MINICARD_ORDER).size, DEFAULT_MINICARD_ORDER.length);
});

test('unknown keys are dropped and duplicates keep their first place (negative)', () => {
  const order = applyCardOrder(['bogus', 'startDate', 'startDate', 42, null, 'receivedDate']);
  assert.ok(!order.includes('bogus'));
  assert.strictEqual(order.filter(k => k === 'startDate').length, 1);
  assert.deepStrictEqual(orderedCardFieldsOf(order, 'date'), ['startDate', 'receivedDate', 'dueDate', 'endDate']);
  assert.strictEqual(order.length, DEFAULT_CARD_ORDER.length);
});

test('a partial order is completed: sections by first appearance, missing fields appended in default order', () => {
  const order = applyCardOrder(['endDate', 'stickers']);
  assert.deepStrictEqual(applyCardFieldOrder(order),
    ['date', 'labels', 'members', 'card', 'time', 'customFields', 'vote', 'poker', 'description',
      'scrum', 'checklists', 'subtasks', 'attachments', 'comments']);
  assert.deepStrictEqual(orderedCardFieldsOf(order, 'date'), ['endDate', 'receivedDate', 'startDate', 'dueDate']);
  // Labels is no longer pinned (2026-10-28): stored first, Stickers leads.
  assert.deepStrictEqual(orderedCardFieldsOf(order, 'labels'), ['stickers', 'labels', 'location']);
  // Description's Title is its heading and stays first (negative).
  assert.deepStrictEqual(orderedCardFieldsOf(['descriptionText', 'descriptionTitle'], 'description'),
    ['descriptionTitle', 'descriptionText']);
});

test('the head and the tail never move, whatever is stored', () => {
  const order = applyCardOrder(['activities', 'attachmentCount', 'labels', 'cover', 'dueComplete']);
  assert.deepStrictEqual(order.slice(0, 3), CARD_LAYOUT.head);
  assert.deepStrictEqual(order.slice(-CARD_LAYOUT.tail.length), CARD_LAYOUT.tail);
  for (const key of [...CARD_LAYOUT.head, ...CARD_LAYOUT.tail]) {
    assert.strictEqual(canMove(undefined, CARD_LAYOUT, key, 'up'), false, `${key} up is a no-op`);
    assert.strictEqual(canMove(undefined, CARD_LAYOUT, key, 'down'), false, `${key} down is a no-op`);
  }
});

// ── legacy: the five section keys of the first #4448 ────────────────────────

test('the legacy section keys expand to the fields they rendered, appendages included', () => {
  const legacy = ['description', 'labels', 'dates', 'members', 'customFields'];
  const order = applyCardOrder(legacy);
  // 2026-10-28: the fields they expand to now sit in Card Settings' sections;
  // Members' appendage (Dependencies, Sort) is Card and Time.
  assert.deepStrictEqual(applyCardFieldOrder(order),
    ['description', 'labels', 'date', 'members', 'card', 'time', 'customFields', 'vote', 'poker',
      'scrum', 'checklists', 'subtasks', 'attachments', 'comments']);
  // In a list that has a FIELD key, `members` is the field, not the legacy
  // section with its appendages (negative: no Card/Time dragged along).
  const mixed = applyCardOrder(['endDate', 'members', 'labels']);
  assert.deepStrictEqual(applyCardFieldOrder(mixed).slice(0, 5), ['date', 'members', 'labels', 'card', 'time']);
  // The old section keys that are not keys now still expand to their fields
  // (the REST API spoke in them): `dates`, `sort`, `voteAndPoker`.
  assert.deepStrictEqual(applyCardFieldOrder(['description', 'dates']).slice(0, 2), ['description', 'date']);
  assert.deepStrictEqual(applyCardFieldOrder(['voteAndPoker']).slice(0, 2), ['vote', 'poker']);
  assert.deepStrictEqual(applyCardFieldOrder(['sort']).slice(0, 2), ['card', 'time']);
  assert.deepStrictEqual(orderedCardFieldsOf(['sort'], 'card').slice(0, 3), ['cardSortingByNumber', 'showLists', 'dependencies']);
});

// ── moving ───────────────────────────────────────────────────────────────────

test('a field moves within its section', () => {
  const order = moveCardKey(undefined, 'dueDate', 'up');
  assert.deepStrictEqual(orderedCardFieldsOf(order, 'date'), ['receivedDate', 'dueDate', 'startDate', 'endDate']);
  const back = moveCardKey(order, 'dueDate', 'down');
  assert.deepStrictEqual(back, DEFAULT_CARD_ORDER);
});

test('the first field going up, or the last going down, moves the whole section', () => {
  const up = moveCardKey(undefined, 'receivedDate', 'up');
  assert.deepStrictEqual(applyCardFieldOrder(up).slice(0, 2), ['date', 'labels']);
  const down = moveCardKey(undefined, 'endDate', 'down');
  assert.deepStrictEqual(applyCardFieldOrder(down).slice(1, 3), ['members', 'date']);
});

test('a pinned header only ever moves its section, and nothing climbs above it', () => {
  // Description: Title is the heading of Description (2026-10-28 the only
  // pinned one): up and down move the section, never the field.
  const up = moveCardKey(undefined, 'descriptionTitle', 'up');
  const sections = applyCardFieldOrder(up);
  assert.strictEqual(sections.indexOf('description'), applyCardFieldOrder(undefined).indexOf('description') - 1);
  assert.deepStrictEqual(orderedCardFieldsOf(up, 'description'), ['descriptionTitle', 'descriptionText']);
  // The text cannot go above its heading (negative).
  assert.deepStrictEqual(moveCardKey(undefined, 'descriptionText', 'up'), DEFAULT_CARD_ORDER);
  assert.strictEqual(canMove(undefined, CARD_LAYOUT, 'descriptionText', 'up'), false);
  // Labels is not pinned any more: Stickers goes above it.
  assert.deepStrictEqual(orderedCardFieldsOf(moveCardKey(undefined, 'stickers', 'up'), 'labels'),
    ['stickers', 'labels', 'location']);
  assert.strictEqual(canMove(undefined, CARD_LAYOUT, 'stickers', 'up'), true);
});

test('the first item going up and the last going down are no-ops (negative)', () => {
  assert.deepStrictEqual(moveCardKey(undefined, 'labels', 'up'), DEFAULT_CARD_ORDER);
  // Comments is the card's last section, Scrum the minicard's first and
  // Description its last (2026-10-28).
  assert.deepStrictEqual(moveCardKey(undefined, 'comments', 'down'), DEFAULT_CARD_ORDER);
  assert.deepStrictEqual(moveMinicardKey(undefined, 'scrumSprint', 'up'), DEFAULT_MINICARD_ORDER);
  assert.deepStrictEqual(moveMinicardKey(undefined, 'descriptionText', 'down'), DEFAULT_MINICARD_ORDER);
});

test('an unknown key, a head/tail key or a bad direction is a no-op (negative)', () => {
  assert.deepStrictEqual(moveCardKey(undefined, 'bogus', 'up'), DEFAULT_CARD_ORDER);
  assert.deepStrictEqual(moveCardKey(undefined, 'activities', 'up'), DEFAULT_CARD_ORDER);
  assert.deepStrictEqual(moveCardKey(undefined, 'cover', 'down'), DEFAULT_CARD_ORDER);
  assert.deepStrictEqual(moveCardKey(undefined, 'startDate', 'sideways'), DEFAULT_CARD_ORDER);
  assert.deepStrictEqual(moveKey(undefined, 'startDate', 'up', CARD_LAYOUT), moveCardKey(undefined, 'startDate', 'up'));
});

test('a move never loses or duplicates a field', () => {
  let order;
  for (const key of DEFAULT_CARD_ORDER) {
    for (const dir of ['up', 'down']) {
      order = moveCardKey(order, key, dir);
      assert.strictEqual(order.length, DEFAULT_CARD_ORDER.length);
      assert.strictEqual(new Set(order).size, order.length);
    }
  }
});

// ── the minicard, independently ──────────────────────────────────────────────

test('the minicard has its own layout and order, untouched by the card order', () => {
  const minicard = moveMinicardKey(undefined, 'swimlaneName', 'up');
  const moved = orderedMinicardFieldsOf(minicard, 'card');
  assert.strictEqual(moved.indexOf('showLists'), moved.indexOf('swimlaneName') + 1, 'swimlane name above the list name');
  assert.deepStrictEqual(applyCardOrder(undefined), DEFAULT_CARD_ORDER, 'the card order is a different value');
  // A field reorders inside its section - Card Settings' (2026-10-28).
  const members = moveMinicardKey(undefined, 'members', 'up');
  assert.deepStrictEqual(orderedMinicardFieldsOf(members, 'members').slice(0, 3), ['members', 'assignee', 'creator']);
  // The first field going up moves its whole section.
  const strip = moveMinicardKey(undefined, 'assignee', 'up');
  const sections = orderedMinicardSections(strip);
  assert.ok(sections.indexOf('members') < sections.indexOf('customFields'));
  assert.deepStrictEqual(sectionOrder(strip, MINICARD_LAYOUT), sections);
  assert.deepStrictEqual(fieldsOfSection(strip, MINICARD_LAYOUT, 'date'),
    MINICARD_LAYOUT.sections.find(section => section.key === 'date').fields);
  // The old `badges` and `dates` groups still mean their fields (aliases).
  assert.deepStrictEqual(orderedMinicardFieldsOf(['dates'], 'time')[0], 'spentTime');
  assert.strictEqual(orderedMinicardSections(['badges'])[0], 'scrum', 'the work item type, first of the old strip');
});

test('minicard.jade and the layout agree on what has a position there', () => {
  const fs = require('fs');
  const path = require('path');
  const jade = fs.readFileSync(path.join(__dirname, '../client/components/cards/minicard.jade'), 'utf8');
  // 2026-10-28: one loop over Card Settings' sections, grouped into the
  // dates line, the badge strips and blocks (models/lib/minicardGroups.js);
  // every positioned field is placed by it.
  for (const field of MINICARD_LAYOUT.sections.flatMap(s => s.fields)) {
    assert.ok(jade.includes(`if $eq field "${field}"`), `${field} is placed by the loop`);
  }
  assert.ok(jade.includes('each group in minicardGroups'));
  assert.ok(jade.includes('each field in group.fields'));
  assert.ok(!jade.includes('orderedMinicardSections'), 'the old per-group loops are gone');
  // `each x in`, never plain `each`: the card must stay the data context.
  assert.ok(!/^\s*each (group\.fields|minicardGroups)\s*$/m.test(jade));
});

// ── the rows table follows the layouts ───────────────────────────────────────

test('every positioned key of each layout has a row for that side, and every row with a position is in the layout', () => {
  for (const [side, layout] of [['card', CARD_LAYOUT], ['minicard', MINICARD_LAYOUT]]) {
    const keys = applyLayoutOrder(undefined, layout);
    for (const key of keys) {
      const row = CARD_SETTINGS_ROWS.find(r => r.key === key);
      assert.ok(row && row[side], `${side} key ${key} has a row`);
      assert.ok(!row[side].after, `${side} key ${key} is positioned, so it is not an "after" row`);
    }
    for (const row of CARD_SETTINGS_ROWS.filter(r => r[side] && !r[side].after)) {
      assert.ok(keys.includes(row.key), `${side} row ${row.key} has a position in the layout`);
    }
  }
});

test('rowsForSide lists a side in its order, with the position-less rows under the row they modify', () => {
  const rows = rowsForSide('minicard', applyMinicardOrder(undefined)).map(r => r.key);
  assert.strictEqual(rows.indexOf('labelText'), rows.indexOf('labels') + 1);
  assert.strictEqual(rows.indexOf('labelTextPersonal'), rows.indexOf('labelText') + 1);
  assert.strictEqual(rows.indexOf('listTitle'), rows.indexOf('showLists') + 1);
  // F14: a control must not promise an effect it does not have. Since
  // 2026-10-02 these have a minicard element, each read by minicard.jade
  // through the field its row names (negative: no dead toggle).
  const minicardJade = require('fs').readFileSync(require('path').join(__dirname, '../client/components/cards/minicard.jade'), 'utf8');
  for (const key of ['assignedBy', 'requestedBy', 'descriptionTitle', 'attachments', 'location']) {
    assert.ok(rows.includes(key), `${key} is in the minicard list`);
    const field = CARD_SETTINGS_ROWS.find(row => row.key === key).minicard.field;
    assert.ok(minicardJade.includes(`currentBoard.${field}`), `minicard.jade reads ${field}`);
    assert.ok(CARD_SETTINGS_ROWS.find(row => row.key === key).card, 'working card-side settings remain');
  }
  const card = rowsForSide('card', applyCardOrder(undefined)).filter(r => !r.card.after).map(r => r.key);
  assert.deepStrictEqual(card, DEFAULT_CARD_ORDER, 'the card list is exactly the card order');
  // Moving on one side reorders that list only.
  const moved = rowsForSide('minicard', moveMinicardKey(undefined, 'swimlaneName', 'up')).map(r => r.key);
  const at = moved.indexOf('swimlaneName');
  assert.deepStrictEqual(moved.slice(at, at + 3), ['swimlaneName', 'similarCards', 'showLists']);
});

console.log(`\n${passed} passed`);
