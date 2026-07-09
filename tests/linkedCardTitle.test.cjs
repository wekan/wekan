'use strict';

// Plain-Node unit test (no Meteor) for linked-card title update targets.
// Run: node tests/linkedCardTitle.test.cjs
//
// Regression guard for #4249 ("sometimes filter by card title doesn't work").
// Renaming a linked card updated only the linked target's title, leaving the
// linking card's OWN `title` stale; filter-by-title queries the own field, so
// the linked card dropped out of title filters after a rename.
// computeTitleUpdateTargets() must ALWAYS include the linking card's own
// document, plus the linked target.

const assert = require('assert');
const { computeTitleUpdateTargets } = require('../models/lib/linkedCardTitle');

let passed = 0;
function test(name, fn) {
  fn();
  passed += 1;
  console.log('  ok -', name);
}

// --- POSITIVE ---------------------------------------------------------------
test('normal card writes only its own document', () => {
  const t = computeTitleUpdateTargets({ _id: 'c1', type: 'card' });
  assert.deepStrictEqual(t, [{ collection: 'cards', id: 'c1' }]);
});

test('linked card writes own doc AND the original card', () => {
  const t = computeTitleUpdateTargets({
    _id: 'link1', linkedId: 'orig1', type: 'cardType-linkedCard',
  });
  assert.deepStrictEqual(t, [
    { collection: 'cards', id: 'link1' },
    { collection: 'cards', id: 'orig1' },
  ]);
});

test('linked board writes own card doc AND the linked board', () => {
  const t = computeTitleUpdateTargets({
    _id: 'link2', linkedId: 'board9', type: 'cardType-linkedBoard',
  });
  assert.deepStrictEqual(t, [
    { collection: 'cards', id: 'link2' },
    { collection: 'boards', id: 'board9' },
  ]);
});

// --- NEGATIVE: the #4249 regression — own doc must never be skipped ----------
test('NEGATIVE: a linked card ALWAYS updates its own document (filter fix)', () => {
  const t = computeTitleUpdateTargets({
    _id: 'link1', linkedId: 'orig1', type: 'cardType-linkedCard',
  });
  assert.ok(
    t.some(x => x.collection === 'cards' && x.id === 'link1'),
    'the linking card\'s own doc must be written so filter-by-title matches',
  );
});

test('NEGATIVE: a linked card whose target write was the ONLY write (old bug) is gone', () => {
  const t = computeTitleUpdateTargets({
    _id: 'link1', linkedId: 'orig1', type: 'cardType-linkedCard',
  });
  // Old behavior wrote only { id: 'orig1' }. Now there must be >= 2 targets and
  // the own doc must be present.
  assert.ok(t.length >= 2);
  assert.notDeepStrictEqual(t, [{ collection: 'cards', id: 'orig1' }]);
});

test('NEGATIVE: linked card with missing linkedId still writes its own doc', () => {
  const t = computeTitleUpdateTargets({ _id: 'link1', type: 'cardType-linkedCard' });
  assert.deepStrictEqual(t, [{ collection: 'cards', id: 'link1' }]);
});

test('NEGATIVE: null / id-less card yields no targets, no throw', () => {
  assert.doesNotThrow(() => computeTitleUpdateTargets(null));
  assert.deepStrictEqual(computeTitleUpdateTargets(null), []);
  assert.deepStrictEqual(computeTitleUpdateTargets({ type: 'card' }), []);
});

console.log(`\n${passed} tests passed`);
