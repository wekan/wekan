'use strict';
(async () => {

// Plain-Node unit test (no Meteor) for the WIP limit GROUP arithmetic (#2489):
// a shared WIP limit across several lists together, on top of WeKan's
// existing per-list wipLimit (models/lists.js). Mirrors tests/voteSortCards.
// test.cjs in style. See models/lib/wipLimitGroupDecision.js for the module
// under test.
//
// Run: node tests/wipLimitGroupDecision.test.cjs

const assert = require('assert');
const {
  combinedWipLimitGroupCount,
  isWipLimitGroupExceeded,
  hasWipLimitGroupReachedLimit,
  findWipLimitGroupsForList,
  isListInExceededWipLimitGroup,
} = await import('../models/lib/wipLimitGroupDecision.js');

let passed = 0;
function test(name, fn) {
  fn();
  passed += 1;
  console.log('  ok -', name);
}

// --- combinedWipLimitGroupCount ----------------------------------------

test('combinedWipLimitGroupCount sums the cards of every member list', () => {
  const counts = { listA: 3, listB: 2, listC: 5 };
  assert.strictEqual(
    combinedWipLimitGroupCount(counts, ['listA', 'listB', 'listC']),
    10,
  );
});

test('combinedWipLimitGroupCount is independent of lists NOT in the group', () => {
  const counts = { listA: 3, listB: 2, listOutsideGroup: 999 };
  assert.strictEqual(combinedWipLimitGroupCount(counts, ['listA', 'listB']), 5);
});

test('combinedWipLimitGroupCount treats a missing/unknown list id as 0, not a crash', () => {
  const counts = { listA: 3 };
  assert.strictEqual(
    combinedWipLimitGroupCount(counts, ['listA', 'archivedOrDeletedListId']),
    3,
  );
});

test('combinedWipLimitGroupCount is 0 for an empty or missing listIds array', () => {
  assert.strictEqual(combinedWipLimitGroupCount({ listA: 3 }, []), 0);
  assert.strictEqual(combinedWipLimitGroupCount({ listA: 3 }, undefined), 0);
});

// --- isWipLimitGroupExceeded --------------------------------------------

test('isWipLimitGroupExceeded is true only strictly OVER the limit (mirrors per-list exceededWipLimit)', () => {
  assert.strictEqual(isWipLimitGroupExceeded(11, 10), true);
  assert.strictEqual(isWipLimitGroupExceeded(10, 10), false); // at the limit: reached, not exceeded
  assert.strictEqual(isWipLimitGroupExceeded(9, 10), false);
});

test('isWipLimitGroupExceeded is false for a non-positive or missing limit', () => {
  assert.strictEqual(isWipLimitGroupExceeded(5, 0), false);
  assert.strictEqual(isWipLimitGroupExceeded(5, -1), false);
  assert.strictEqual(isWipLimitGroupExceeded(5, undefined), false);
});

// --- hasWipLimitGroupReachedLimit ---------------------------------------

test('hasWipLimitGroupReachedLimit is true AT or over the limit', () => {
  assert.strictEqual(hasWipLimitGroupReachedLimit(10, 10), true);
  assert.strictEqual(hasWipLimitGroupReachedLimit(11, 10), true);
  assert.strictEqual(hasWipLimitGroupReachedLimit(9, 10), false);
});

// --- findWipLimitGroupsForList -------------------------------------------

test('findWipLimitGroupsForList returns the groups a list is a member of', () => {
  const groups = [
    { _id: 'g1', listIds: ['a', 'b'], limit: 5, enabled: true },
    { _id: 'g2', listIds: ['b', 'c'], limit: 3, enabled: true },
    { _id: 'g3', listIds: ['d'], limit: 1, enabled: true },
  ];
  const forB = findWipLimitGroupsForList(groups, 'b');
  assert.deepStrictEqual(forB.map(g => g._id), ['g1', 'g2']);
});

test('findWipLimitGroupsForList skips a disabled group', () => {
  const groups = [{ _id: 'g1', listIds: ['a'], limit: 5, enabled: false }];
  assert.deepStrictEqual(findWipLimitGroupsForList(groups, 'a'), []);
});

// --- isListInExceededWipLimitGroup: the combined "does the header light up" decision --

test('#2489: a list with NO individual wipLimit is flagged when its GROUP is over limit', () => {
  const groups = [{ _id: 'g1', listIds: ['doing', 'review', 'qa'], limit: 10, enabled: true }];
  const counts = { doing: 4, review: 4, qa: 4 }; // combined 12 > 10
  assert.strictEqual(isListInExceededWipLimitGroup(groups, 'doing', counts), true);
  // every member list is flagged, not just one - "so it's clear at a glance
  // which lists are part of an over-limit group".
  assert.strictEqual(isListInExceededWipLimitGroup(groups, 'review', counts), true);
  assert.strictEqual(isListInExceededWipLimitGroup(groups, 'qa', counts), true);
});

test('a list NOT in the group is unaffected by the group being over limit', () => {
  const groups = [{ _id: 'g1', listIds: ['doing', 'review'], limit: 10, enabled: true }];
  const counts = { doing: 8, review: 8, backlog: 999 };
  assert.strictEqual(isListInExceededWipLimitGroup(groups, 'backlog', counts), false);
});

test('the group decision is independent of any member list\'s own individual wipLimit', () => {
  // The group total (12) is over the group limit (10) even though no single
  // list here would trip its OWN individual wipLimit if it had one set to,
  // say, 8 each - the group is its own, separate accounting.
  const groups = [{ _id: 'g1', listIds: ['a', 'b'], limit: 10, enabled: true }];
  const counts = { a: 6, b: 6 };
  assert.strictEqual(isWipLimitGroupExceeded(combinedWipLimitGroupCount(counts, ['a', 'b']), 10), true);
});

test('not flagged when the group is under its limit', () => {
  const groups = [{ _id: 'g1', listIds: ['a', 'b', 'c'], limit: 10, enabled: true }];
  const counts = { a: 2, b: 2, c: 2 };
  assert.strictEqual(isListInExceededWipLimitGroup(groups, 'a', counts), false);
});

console.log(`\nwipLimitGroupDecision: ${passed} tests passed`);

})();
