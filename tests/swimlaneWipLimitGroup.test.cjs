'use strict';
(async () => {

// Plain-Node unit test (no Meteor) for #2380: a WIP limit on a whole
// SWIMLANE - the combined card count across every list that belongs to that
// swimlane, distinct from a single list's own per-list wipLimit
// (models/lists.js) and from #2489's cross-list WIP limit groups
// (models/lib/wipLimitGroupDecision.js).
//
// A swimlane's combined limit is expressed as a #2489 WIP limit group whose
// `listIds` are exactly the lists that belong to that swimlane
// (models/lists.js `swimlaneId`) - no separate counting/enforcement logic
// was added. listIdsForSwimlane() computes that membership; the actual
// combined-count and over-limit decisions reuse combinedWipLimitGroupCount /
// isWipLimitGroupExceeded, already covered by tests/wipLimitGroupDecision.
// test.cjs. This file focuses on the swimlane-specific membership and on
// proving the combined decision is independent of any one member list's own
// individual wipLimit.
//
// Closes https://github.com/wekan/wekan/issues/2380.
//
// Run: node tests/swimlaneWipLimitGroup.test.cjs

const assert = require('assert');
const {
  listIdsForSwimlane,
  combinedWipLimitGroupCount,
  isWipLimitGroupExceeded,
  isListInExceededWipLimitGroup,
} = await import('../models/lib/wipLimitGroupDecision.js');

let passed = 0;
function test(name, fn) {
  fn();
  passed += 1;
  console.log('  ok -', name);
}

// --- listIdsForSwimlane ---------------------------------------------------

test('listIdsForSwimlane collects only the lists that belong to that swimlane', () => {
  const lists = [
    { _id: 'todo', swimlaneId: 'swimlane1' },
    { _id: 'doing', swimlaneId: 'swimlane1' },
    { _id: 'done', swimlaneId: 'swimlane1' },
    { _id: 'otherTodo', swimlaneId: 'swimlane2' },
  ];
  assert.deepStrictEqual(listIdsForSwimlane(lists, 'swimlane1'), [
    'todo',
    'doing',
    'done',
  ]);
  assert.deepStrictEqual(listIdsForSwimlane(lists, 'swimlane2'), ['otherTodo']);
});

test('listIdsForSwimlane excludes a list with no swimlaneId (shared across swimlanes)', () => {
  const lists = [
    { _id: 'shared' }, // no swimlaneId at all
    { _id: 'shared2', swimlaneId: '' },
    { _id: 'own', swimlaneId: 'swimlane1' },
  ];
  assert.deepStrictEqual(listIdsForSwimlane(lists, 'swimlane1'), ['own']);
});

test('listIdsForSwimlane is empty for an unknown swimlane, a missing swimlaneId, or no lists', () => {
  const lists = [{ _id: 'a', swimlaneId: 'swimlane1' }];
  assert.deepStrictEqual(listIdsForSwimlane(lists, 'swimlaneNoSuchThing'), []);
  assert.deepStrictEqual(listIdsForSwimlane(lists, ''), []);
  assert.deepStrictEqual(listIdsForSwimlane(lists, undefined), []);
  assert.deepStrictEqual(listIdsForSwimlane(undefined, 'swimlane1'), []);
  assert.deepStrictEqual(listIdsForSwimlane([], 'swimlane1'), []);
});

// --- combined swimlane count/over-limit, reusing the #2489 group arithmetic --

test('the combined count across a swimlane sums every one of its lists, and is over limit only when the TOTAL crosses the shared limit', () => {
  const lists = [
    { _id: 'todo', swimlaneId: 'swimlaneA' },
    { _id: 'doing', swimlaneId: 'swimlaneA' },
    { _id: 'done', swimlaneId: 'swimlaneA' },
    { _id: 'otherTodo', swimlaneId: 'swimlaneB' },
  ];
  const cardCountsByListId = { todo: 3, doing: 4, done: 2, otherTodo: 999 };

  const swimlaneAListIds = listIdsForSwimlane(lists, 'swimlaneA');
  const combined = combinedWipLimitGroupCount(cardCountsByListId, swimlaneAListIds);
  assert.strictEqual(combined, 9); // 3 + 4 + 2, NOT swimlaneB's 999

  assert.strictEqual(isWipLimitGroupExceeded(combined, 10), false);
  assert.strictEqual(isWipLimitGroupExceeded(combined, 9), false); // at limit: reached, not exceeded
  assert.strictEqual(isWipLimitGroupExceeded(combined, 8), true);
});

test('a swimlane WIP group is over its shared limit independent of any single member list\'s own individual wipLimit', () => {
  // "doing" has its own per-list wipLimit of 10 (comfortably not exceeded on
  // its own with only 4 cards), but the swimlane-wide combined total across
  // all three lists is over the swimlane's own shared limit of 8.
  const lists = [
    { _id: 'todo', swimlaneId: 'swimlaneA' },
    { _id: 'doing', swimlaneId: 'swimlaneA', wipLimit: { value: 10, enabled: true } },
    { _id: 'done', swimlaneId: 'swimlaneA' },
  ];
  const cardCountsByListId = { todo: 3, doing: 4, done: 2 }; // combined 9

  const swimlaneAListIds = listIdsForSwimlane(lists, 'swimlaneA');
  const groups = [
    { _id: 'swimlane-swimlaneA', listIds: swimlaneAListIds, limit: 8, enabled: true },
  ];

  // Every list in the swimlane is flagged, even "doing" whose own individual
  // wipLimit (10) is nowhere near exceeded.
  assert.strictEqual(isListInExceededWipLimitGroup(groups, 'doing', cardCountsByListId), true);
  assert.strictEqual(isListInExceededWipLimitGroup(groups, 'todo', cardCountsByListId), true);
  assert.strictEqual(isListInExceededWipLimitGroup(groups, 'done', cardCountsByListId), true);
});

test('a list from a DIFFERENT swimlane is unaffected by this swimlane\'s combined limit', () => {
  const lists = [
    { _id: 'todo', swimlaneId: 'swimlaneA' },
    { _id: 'doing', swimlaneId: 'swimlaneA' },
    { _id: 'otherList', swimlaneId: 'swimlaneB' },
  ];
  const cardCountsByListId = { todo: 20, doing: 20, otherList: 1 };

  const swimlaneAListIds = listIdsForSwimlane(lists, 'swimlaneA');
  const groups = [
    { _id: 'swimlane-swimlaneA', listIds: swimlaneAListIds, limit: 5, enabled: true },
  ];
  assert.strictEqual(isListInExceededWipLimitGroup(groups, 'otherList', cardCountsByListId), false);
});

console.log(`\nswimlaneWipLimitGroup: ${passed} tests passed`);

})();
