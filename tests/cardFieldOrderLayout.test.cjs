'use strict';

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
  assert.deepStrictEqual(DEFAULT_CARD_ORDER.slice(-8), CARD_LAYOUT.tail);
  assert.strictEqual(new Set(DEFAULT_CARD_ORDER).size, DEFAULT_CARD_ORDER.length);
  assert.strictEqual(new Set(DEFAULT_MINICARD_ORDER).size, DEFAULT_MINICARD_ORDER.length);
});

test('unknown keys are dropped and duplicates keep their first place (negative)', () => {
  const order = applyCardOrder(['bogus', 'startDate', 'startDate', 42, null, 'receivedDate']);
  assert.ok(!order.includes('bogus'));
  assert.strictEqual(order.filter(k => k === 'startDate').length, 1);
  assert.deepStrictEqual(orderedCardFieldsOf(order, 'dates'), ['startDate', 'receivedDate', 'dueDate', 'endDate']);
  assert.strictEqual(order.length, DEFAULT_CARD_ORDER.length);
});

test('a partial order is completed: sections by first appearance, missing fields appended in default order', () => {
  const order = applyCardOrder(['endDate', 'stickers']);
  assert.deepStrictEqual(applyCardFieldOrder(order),
    ['dates', 'labels', 'members', 'dependencies', 'sort', 'customFields', 'voteAndPoker', 'description']);
  assert.deepStrictEqual(orderedCardFieldsOf(order, 'dates'), ['endDate', 'receivedDate', 'startDate', 'dueDate']);
  // Labels is pinned first in its section even though stickers was stored first.
  assert.deepStrictEqual(orderedCardFieldsOf(order, 'labels'), ['labels', 'stickers', 'location']);
});

test('the head and the tail never move, whatever is stored', () => {
  const order = applyCardOrder(['activities', 'checklists', 'labels', 'cover', 'dueComplete']);
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
  assert.deepStrictEqual(applyCardFieldOrder(order),
    ['description', 'labels', 'dates', 'members', 'dependencies', 'sort', 'customFields', 'voteAndPoker']);
  // In a list that has a FIELD key, `members` is the field, not the legacy
  // section with its appendages (negative: no Dependencies/Sort dragged along).
  const mixed = applyCardOrder(['endDate', 'members', 'labels']);
  assert.deepStrictEqual(applyCardFieldOrder(mixed).slice(0, 5), ['dates', 'members', 'labels', 'dependencies', 'sort']);
  // And the two section keys that are not field keys still expand alone.
  assert.deepStrictEqual(applyCardFieldOrder(['description', 'dates']).slice(0, 2), ['description', 'dates']);
  assert.deepStrictEqual(applyCardFieldOrder(['voteAndPoker']).slice(0, 1), ['voteAndPoker']);
});

// ── moving ───────────────────────────────────────────────────────────────────

test('a field moves within its section', () => {
  const order = moveCardKey(undefined, 'dueDate', 'up');
  assert.deepStrictEqual(orderedCardFieldsOf(order, 'dates'), ['receivedDate', 'dueDate', 'startDate', 'endDate']);
  const back = moveCardKey(order, 'dueDate', 'down');
  assert.deepStrictEqual(back, DEFAULT_CARD_ORDER);
});

test('the first field going up, or the last going down, moves the whole section', () => {
  const up = moveCardKey(undefined, 'receivedDate', 'up');
  assert.deepStrictEqual(applyCardFieldOrder(up).slice(0, 2), ['dates', 'labels']);
  const down = moveCardKey(undefined, 'endDate', 'down');
  assert.deepStrictEqual(applyCardFieldOrder(down).slice(1, 3), ['members', 'dates']);
});

test('a pinned header only ever moves its section, and nothing climbs above it', () => {
  // Labels is the header of its section: up moves the section (a no-op at
  // the top), down moves the section, never the field.
  assert.deepStrictEqual(moveCardKey(undefined, 'labels', 'up'), DEFAULT_CARD_ORDER);
  const down = moveCardKey(undefined, 'labels', 'down');
  assert.deepStrictEqual(applyCardFieldOrder(down).slice(0, 2), ['dates', 'labels']);
  assert.deepStrictEqual(orderedCardFieldsOf(down, 'labels'), ['labels', 'stickers', 'location']);
  // Stickers cannot go above the Labels header (negative).
  assert.deepStrictEqual(moveCardKey(undefined, 'stickers', 'up'), DEFAULT_CARD_ORDER);
  assert.strictEqual(canMove(undefined, CARD_LAYOUT, 'stickers', 'up'), false);
  assert.strictEqual(canMove(undefined, CARD_LAYOUT, 'stickers', 'down'), true);
});

test('the first item going up and the last going down are no-ops (negative)', () => {
  assert.deepStrictEqual(moveCardKey(undefined, 'labels', 'up'), DEFAULT_CARD_ORDER);
  assert.deepStrictEqual(moveCardKey(undefined, 'descriptionText', 'down'), DEFAULT_CARD_ORDER);
  assert.deepStrictEqual(moveMinicardKey(undefined, 'receivedDate', 'up'), DEFAULT_MINICARD_ORDER);
  assert.deepStrictEqual(moveMinicardKey(undefined, 'swimlaneName', 'down'), DEFAULT_MINICARD_ORDER);
});

test('an unknown key, a head/tail key or a bad direction is a no-op (negative)', () => {
  assert.deepStrictEqual(moveCardKey(undefined, 'bogus', 'up'), DEFAULT_CARD_ORDER);
  assert.deepStrictEqual(moveCardKey(undefined, 'checklists', 'up'), DEFAULT_CARD_ORDER);
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
  assert.deepStrictEqual(orderedMinicardSections(minicard).slice(-2), ['swimlaneName', 'showLists']);
  assert.deepStrictEqual(applyCardOrder(undefined), DEFAULT_CARD_ORDER, 'the card order is a different value');
  // Badges reorder inside their strip; the strip itself moves at its edges.
  const badges = moveMinicardKey(undefined, 'vote', 'up');
  assert.deepStrictEqual(orderedMinicardFieldsOf(badges, 'badges').slice(0, 4),
    ['dependencies', 'stickers', 'vote', 'commentCount']);
  const strip = moveMinicardKey(undefined, 'dependencies', 'up');
  const sections = orderedMinicardSections(strip);
  assert.ok(sections.indexOf('badges') < sections.indexOf('checklists'));
  assert.deepStrictEqual(sectionOrder(strip, MINICARD_LAYOUT), sections);
  assert.deepStrictEqual(fieldsOfSection(strip, MINICARD_LAYOUT, 'dates'), MINICARD_LAYOUT.sections[0].fields);
});

test('minicard.jade and the layout agree on what has a position there', () => {
  const fs = require('fs');
  const path = require('path');
  const jade = fs.readFileSync(path.join(__dirname, '../client/components/cards/minicard.jade'), 'utf8');
  for (const s of MINICARD_LAYOUT.sections) {
    assert.ok(jade.includes(`if $eq section "${s.key}"`), `minicard renders section ${s.key} from the loop`);
  }
  for (const field of MINICARD_LAYOUT.sections.find(s => s.key === 'badges').fields) {
    assert.ok(jade.includes(`if $eq field "${field}"`), `badge ${field} is placed by the loop`);
  }
  for (const field of MINICARD_LAYOUT.sections.find(s => s.key === 'dates').fields) {
    assert.ok(jade.includes(`if $eq field "${field}"`), `date ${field} is placed by the loop`);
  }
  assert.ok(jade.includes('each section in orderedMinicardSections'));
  assert.ok(jade.includes('each field in orderedMinicardDates'));
  assert.ok(jade.includes('each field in orderedMinicardBadges'));
  // `each x in`, never plain `each`: the card must stay the data context.
  assert.ok(!/^\s*each orderedMinicard/m.test(jade));
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
  assert.strictEqual(rows.indexOf('assignedBy'), rows.indexOf('requestedBy') + 1);
  assert.ok(!rows.includes('location'), 'a card-only row is not in the minicard list');
  const card = rowsForSide('card', applyCardOrder(undefined)).map(r => r.key);
  assert.deepStrictEqual(card, DEFAULT_CARD_ORDER, 'the card list is exactly the card order');
  // Moving on one side reorders that list only.
  const moved = rowsForSide('minicard', moveMinicardKey(undefined, 'swimlaneName', 'up')).map(r => r.key);
  assert.deepStrictEqual(moved.slice(-3), ['swimlaneName', 'showLists', 'listTitle']);
});

console.log(`\n${passed} passed`);
