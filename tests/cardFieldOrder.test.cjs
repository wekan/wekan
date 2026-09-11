'use strict';

// Unit test for the card-detail-view "field order" setting (#4448): a board can
// reorder the major sections of the opened card - move Description earlier
// (e.g. third) and have Custom Fields render right after it. Run:
//   node tests/cardFieldOrder.test.cjs
//
// The pure decision under test is `applyCardFieldOrder()`, which turns a
// (possibly missing/partial/unknown-containing) stored order into a complete,
// valid ordering that always contains every known section exactly once - so
// the card can never render a section twice or drop one because of stale or
// corrupted board data.

const assert = require('assert');
const {
  DEFAULT_CARD_FIELD_ORDER,
  CARD_FIELD_ORDER_KEYS,
  isValidCardFieldKey,
  applyCardFieldOrder,
  moveCardFieldKey,
} = require('../models/lib/cardFieldOrder');

let passed = 0;
function test(name, fn) {
  fn();
  passed += 1;
  console.log('  ok -', name);
}

// --- default / fallback behaviour -------------------------------------------
// The "historical fixed order" is the section order cardDetails.jade rendered
// at 59f7d61df, before #4448 (131514d61) made it orderable: Labels, Dates,
// Members, Dependencies, Sort, Custom Fields, Vote/Poker, Description. The
// per-field sequence is pinned in
// tests/cardFieldOrderDefaultIsPreFeatureOrder.test.cjs.
test('no stored order at all falls back to the historical fixed order', () => {
  assert.deepStrictEqual(DEFAULT_CARD_FIELD_ORDER,
    ['labels', 'dates', 'members', 'dependencies', 'sort', 'customFields', 'voteAndPoker', 'description']);
  assert.deepStrictEqual(applyCardFieldOrder(undefined), DEFAULT_CARD_FIELD_ORDER);
  assert.deepStrictEqual(applyCardFieldOrder(null), DEFAULT_CARD_FIELD_ORDER);
  assert.deepStrictEqual(applyCardFieldOrder([]), DEFAULT_CARD_FIELD_ORDER);
});

test('a non-array stored order falls back to the default order', () => {
  assert.deepStrictEqual(applyCardFieldOrder('description'), DEFAULT_CARD_FIELD_ORDER);
  assert.deepStrictEqual(applyCardFieldOrder({}), DEFAULT_CARD_FIELD_ORDER);
});

// --- the actual issue: move description earlier, custom fields after it ----
test('#4448: description can be moved to third, with custom fields right after it', () => {
  const stored = ['labels', 'dates', 'description', 'customFields', 'members'];
  // The five keys the first version of #4448 stored stay valid. Dependencies
  // and Sort were a fixed appendage of Members then, Vote/Poker of Custom
  // Fields; they are sections now (Board Settings / Card orders per field),
  // so a legacy value expands to exactly what it rendered.
  assert.deepStrictEqual(applyCardFieldOrder(stored),
    ['labels', 'dates', 'description', 'customFields', 'voteAndPoker', 'members', 'dependencies', 'sort']);
  const order = applyCardFieldOrder(stored);
  assert.strictEqual(order.indexOf('description'), 2, 'description is third (0-indexed 2)');
  assert.ok(
    order.indexOf('customFields') > order.indexOf('description'),
    'custom fields render after description',
  );
});

// --- robustness: unknown / duplicate / partial values -----------------------
test('unknown keys in the stored order are dropped', () => {
  const order = applyCardFieldOrder(['labels', 'bogus-section', 'dates']);
  assert.ok(!order.includes('bogus-section'));
  assert.strictEqual(order.length, DEFAULT_CARD_FIELD_ORDER.length);
});

test('duplicate keys keep only the first occurrence', () => {
  const order = applyCardFieldOrder(['description', 'description', 'labels']);
  assert.strictEqual(order.filter(k => k === 'description').length, 1);
});

test('a partial stored order is completed with the missing known keys, appended in default order', () => {
  const order = applyCardFieldOrder(['description', 'labels']);
  assert.deepStrictEqual(order.slice(0, 2), ['description', 'labels']);
  // The remaining keys (dates, members, customFields) follow, in their
  // DEFAULT_CARD_FIELD_ORDER relative order.
  const remaining = DEFAULT_CARD_FIELD_ORDER.filter(k => k !== 'description' && k !== 'labels');
  assert.deepStrictEqual(order.slice(2), remaining);
});

test('every known section is present exactly once, regardless of input', () => {
  const inputs = [
    undefined,
    [],
    ['description'],
    ['bogus', 'bogus', 'description', 'description'],
    DEFAULT_CARD_FIELD_ORDER.slice().reverse(),
  ];
  inputs.forEach(input => {
    const order = applyCardFieldOrder(input);
    assert.strictEqual(order.length, CARD_FIELD_ORDER_KEYS.length);
    CARD_FIELD_ORDER_KEYS.forEach(key => {
      assert.strictEqual(order.filter(k => k === key).length, 1, `key ${key} appears exactly once`);
    });
  });
});

// --- isValidCardFieldKey -----------------------------------------------------
test('isValidCardFieldKey recognises only the known section keys', () => {
  assert.strictEqual(isValidCardFieldKey('description'), true);
  assert.strictEqual(isValidCardFieldKey('customFields'), true);
  assert.strictEqual(isValidCardFieldKey('checklists'), false);
  assert.strictEqual(isValidCardFieldKey(''), false);
  assert.strictEqual(isValidCardFieldKey(undefined), false);
});

// --- moveCardFieldKey (Board Settings up/down buttons) ----------------------
test('moveCardFieldKey moves a section one step earlier', () => {
  const order = moveCardFieldKey(DEFAULT_CARD_FIELD_ORDER, 'description', 'up');
  assert.strictEqual(order.indexOf('description'), DEFAULT_CARD_FIELD_ORDER.indexOf('description') - 1);
});

test('moveCardFieldKey moves a section one step later', () => {
  const order = moveCardFieldKey(DEFAULT_CARD_FIELD_ORDER, 'labels', 'down');
  assert.strictEqual(order.indexOf('labels'), 1);
});

test('moveCardFieldKey at the top boundary is a no-op going up', () => {
  const order = moveCardFieldKey(DEFAULT_CARD_FIELD_ORDER, 'labels', 'up');
  assert.deepStrictEqual(order, DEFAULT_CARD_FIELD_ORDER);
});

test('moveCardFieldKey at the bottom boundary is a no-op going down', () => {
  const order = moveCardFieldKey(DEFAULT_CARD_FIELD_ORDER, 'description', 'down');
  assert.deepStrictEqual(order, DEFAULT_CARD_FIELD_ORDER);
});

test('moveCardFieldKey with an unknown key is a no-op', () => {
  const order = moveCardFieldKey(DEFAULT_CARD_FIELD_ORDER, 'bogus', 'up');
  assert.deepStrictEqual(order, DEFAULT_CARD_FIELD_ORDER);
});

// --- NEGATIVE test: the jade template must not still hardcode the old fixed
// sequence for these sections - it renders from orderedCardFieldSections().
test('cardDetails.jade renders the reorderable sections from an order-driven loop, not a hardcoded sequence', () => {
  const fs = require('fs');
  const path = require('path');
  const jade = fs.readFileSync(
    path.join(__dirname, '../client/components/cards/cardDetails.jade'),
    'utf8',
  );
  // `each section in ...` rather than plain `each ...`: the plain form made the
  // section name the data context and broke every section template and the
  // popups opened from them (see tests/cardFieldSectionsKeepCardContext.test.cjs).
  assert.ok(
    jade.includes('each section in orderedCardFieldSections'),
    'the card-details-items block must iterate the resolved order',
  );
  // Each reorderable section must be reachable only through its own named
  // template (called from the order loop), not inlined at a fixed spot.
  CARD_FIELD_ORDER_KEYS.forEach(key => {
    const templateName = `cardFieldSection${key.charAt(0).toUpperCase()}${key.slice(1)}`;
    assert.ok(
      jade.includes(`template(name="${templateName}")`),
      `${templateName} must be its own template`,
    );
  });
});

console.log(`\n${passed} tests passed`);
