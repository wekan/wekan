'use strict';

// Plain-Node unit test (no Meteor) for the new-swimlane sort computation.
// Run: node tests/swimlaneSort.test.cjs
//
// Regression guard for #3624 ("new_swimlane API sorting problem"). The REST
// create set sort to the swimlane COUNT, which misordered the new swimlane
// (appeared first) when existing sorts were non-contiguous, and offered no way
// to pass an explicit index. nextSwimlaneSort() must append at max+1 and honor
// an explicit sort.

const assert = require('assert');
const { nextSwimlaneSort } = require('../models/lib/swimlaneSort');

let passed = 0;
function test(name, fn) {
  fn();
  passed += 1;
  console.log('  ok -', name);
}

// --- POSITIVE ---------------------------------------------------------------
test('appends at max+1 for a contiguous run', () => {
  assert.strictEqual(nextSwimlaneSort([0, 1, 2]), 3);
});

test('first swimlane on an empty board gets sort 0', () => {
  assert.strictEqual(nextSwimlaneSort([]), 0);
  assert.strictEqual(nextSwimlaneSort(undefined), 0);
});

test('explicit requested sort is honored (issue asked for this)', () => {
  assert.strictEqual(nextSwimlaneSort([0, 1, 2], 10), 10);
  assert.strictEqual(nextSwimlaneSort([0, 1, 2], '5'), 5);
  assert.strictEqual(nextSwimlaneSort([0, 1, 2], 0), 0);
});

// --- NEGATIVE: the #3624 count-based misordering must not reappear -----------
test('NEGATIVE: non-contiguous sorts still append LAST, not first (#3624)', () => {
  // Week-7/8/9 created with sorts 5, 6, 7. Count-based sort would be 3 -> the
  // new swimlane would sort BEFORE all of them. max+1 = 8 keeps it last.
  const sort = nextSwimlaneSort([5, 6, 7]);
  assert.strictEqual(sort, 8);
  assert.ok(sort > 7, 'new swimlane must sort after the existing ones');
});

test('NEGATIVE: negative existing sorts do not push the new one to the front', () => {
  const sort = nextSwimlaneSort([-3, -2, -1]);
  assert.strictEqual(sort, 0);
  assert.ok(sort > -1);
});

test('NEGATIVE: non-numeric / missing sorts are ignored, not treated as 0', () => {
  assert.strictEqual(nextSwimlaneSort([2, 'x', null, undefined, 4]), 5);
});

test('NEGATIVE: junk requested sort falls back to append (not NaN)', () => {
  assert.strictEqual(nextSwimlaneSort([0, 1], 'not-a-number'), 2);
  assert.strictEqual(nextSwimlaneSort([0, 1], null), 2);
  assert.strictEqual(nextSwimlaneSort([0, 1], ''), 2);
});

console.log(`\n${passed} tests passed`);
