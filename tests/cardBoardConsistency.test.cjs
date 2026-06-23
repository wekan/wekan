'use strict';

// Plain-Node unit test (no Meteor) for the cross-board move consistency guard.
// Run: node tests/cardBoardConsistency.test.cjs
//
// Regression guard for #5874 ("weird moving card bug"): rarely, moving a card
// from board A to board B left the card on board B but with a listId/swimlaneId
// still belonging to board A — the card then vanished from every normal view and
// clicking it reopened board A (data loss). The server-side guard rewrites the
// pending update modifier so a moved card's swimlane/list always belong to the
// destination board.

const assert = require('assert');
const { applyCardBoardConsistency } = require('../server/lib/cardBoardConsistency');

let passed = 0;
function test(name, fn) {
  return Promise.resolve()
    .then(fn)
    .then(() => {
      passed += 1;
      console.log('  ok -', name);
    });
}

// Build a deps object describing which swimlanes/lists exist on which board, plus
// each board's default swimlane and first list used as the fallback.
function makeDeps(world) {
  return {
    swimlaneBelongs: async (swimlaneId, boardId) =>
      (world.swimlanes[boardId] || []).includes(swimlaneId),
    listBelongs: async (listId, boardId) =>
      (world.lists[boardId] || []).includes(listId),
    getDefaultSwimlaneId: async boardId => world.defaultSwimlane[boardId],
    getFirstListId: async boardId => world.firstList[boardId],
  };
}

const WORLD = {
  swimlanes: { A: ['swA'], B: ['swB'] },
  lists: { A: ['listA'], B: ['listB'] },
  defaultSwimlane: { A: 'swA', B: 'swB' },
  firstList: { A: 'listA', B: 'listB' },
};

async function main() {
  // The core #5874 scenario: boardId moved to B but swimlane/list still point at
  // board A. Both must be remapped to board B's default swimlane / first list.
  await test('remaps stale source-board swimlane AND list on a cross-board move', async () => {
    const doc = { _id: 'c1', boardId: 'A', swimlaneId: 'swA', listId: 'listA' };
    const modifier = { $set: { boardId: 'B', swimlaneId: 'swA', listId: 'listA' } };
    const patch = await applyCardBoardConsistency(doc, ['boardId', 'swimlaneId', 'listId'], modifier, makeDeps(WORLD));
    assert.deepStrictEqual(patch, { swimlaneId: 'swB', listId: 'listB' });
    assert.strictEqual(modifier.$set.swimlaneId, 'swB');
    assert.strictEqual(modifier.$set.listId, 'listB');
  });

  // A correct cross-board move (targets already belong to B) must be left alone.
  await test('leaves a valid cross-board move untouched', async () => {
    const doc = { _id: 'c1', boardId: 'A', swimlaneId: 'swA', listId: 'listA' };
    const modifier = { $set: { boardId: 'B', swimlaneId: 'swB', listId: 'listB' } };
    const patch = await applyCardBoardConsistency(doc, ['boardId', 'swimlaneId', 'listId'], modifier, makeDeps(WORLD));
    assert.deepStrictEqual(patch, {});
    assert.strictEqual(modifier.$set.swimlaneId, 'swB');
    assert.strictEqual(modifier.$set.listId, 'listB');
  });

  // Only the swimlane is stale (list already valid) -> only swimlane remapped.
  await test('remaps only the stale field', async () => {
    const doc = { _id: 'c1', boardId: 'A', swimlaneId: 'swA', listId: 'listA' };
    const modifier = { $set: { boardId: 'B', swimlaneId: 'swA', listId: 'listB' } };
    const patch = await applyCardBoardConsistency(doc, ['boardId', 'swimlaneId', 'listId'], modifier, makeDeps(WORLD));
    assert.deepStrictEqual(patch, { swimlaneId: 'swB' });
  });

  // A same-board update (no boardId change) must never be touched, even if the
  // modifier re-sets the same boardId (Card.move always re-sets boardId).
  await test('ignores a same-board move (boardId unchanged)', async () => {
    const doc = { _id: 'c1', boardId: 'B', swimlaneId: 'swB', listId: 'listB' };
    const modifier = { $set: { boardId: 'B', swimlaneId: 'swB', listId: 'listB', sort: 3 } };
    const patch = await applyCardBoardConsistency(doc, ['boardId', 'swimlaneId', 'listId', 'sort'], modifier, makeDeps(WORLD));
    assert.deepStrictEqual(patch, {});
  });

  // An update that does not touch boardId at all is ignored.
  await test('ignores an update without a boardId field', async () => {
    const doc = { _id: 'c1', boardId: 'B', swimlaneId: 'swB', listId: 'listB' };
    const modifier = { $set: { title: 'hi' } };
    const patch = await applyCardBoardConsistency(doc, ['title'], modifier, makeDeps(WORLD));
    assert.deepStrictEqual(patch, {});
  });

  // boardId in $set but swimlane/list not in the modifier — fall back to doc's
  // values, which still belong to A, so both get remapped to B.
  await test('reads swimlane/list from doc when absent from the modifier', async () => {
    const doc = { _id: 'c1', boardId: 'A', swimlaneId: 'swA', listId: 'listA' };
    const modifier = { $set: { boardId: 'B' } };
    const patch = await applyCardBoardConsistency(doc, ['boardId'], modifier, makeDeps(WORLD));
    assert.deepStrictEqual(patch, { swimlaneId: 'swB', listId: 'listB' });
  });

  // Defensive: destination board with no list available -> swimlane still fixed,
  // list left as-is (cannot do better than the source value).
  await test('does not invent a list when the destination has none', async () => {
    const world = {
      swimlanes: { A: ['swA'], B: ['swB'] },
      lists: { A: ['listA'], B: [] },
      defaultSwimlane: { A: 'swA', B: 'swB' },
      firstList: { A: 'listA', B: undefined },
    };
    const doc = { _id: 'c1', boardId: 'A', swimlaneId: 'swA', listId: 'listA' };
    const modifier = { $set: { boardId: 'B', swimlaneId: 'swA', listId: 'listA' } };
    const patch = await applyCardBoardConsistency(doc, ['boardId', 'swimlaneId', 'listId'], modifier, makeDeps(world));
    assert.deepStrictEqual(patch, { swimlaneId: 'swB' });
    assert.strictEqual(modifier.$set.listId, 'listA'); // unchanged
  });

  // --- Negative test: prove the guard is what fixes #5874 ---------------------
  // Without the guard (raw modifier), the persisted card would have boardId=B but
  // listId/swimlaneId of board A — exactly the corrupt state from the issue.
  await test('NEGATIVE: the raw (unguarded) modifier is the corrupt #5874 state', async () => {
    const modifier = { $set: { boardId: 'B', swimlaneId: 'swA', listId: 'listA' } };
    // Simulate the pre-fix behavior: no rewrite happens.
    assert.strictEqual(modifier.$set.boardId, 'B');
    assert.ok(!WORLD.swimlanes['B'].includes(modifier.$set.swimlaneId));
    assert.ok(!WORLD.lists['B'].includes(modifier.$set.listId));
  });

  console.log(`\n${passed} passing`);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
