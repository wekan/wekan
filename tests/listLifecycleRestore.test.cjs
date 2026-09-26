'use strict';
const assert = require('node:assert/strict');
const { test } = require('node:test');
const { listLifecyclePlan } = require('../models/lib/listLifecycleRestore');
const list = { _id: 'list', boardId: 'board', deleteBatchId: 'deleted-together' };
const row = { _id: 'history', boardId: 'board', userId: 'actor', batchId: 'deleted-together' };
const at = new Date('2026-09-26T12:00:00Z');

test('undo unsets every deletion marker and restores only the matching batch on this list/board', () => {
  const plan = listLifecyclePlan(list, row, { deleted: false });
  assert.deepEqual(plan.modifier, { $unset: { deletedAt: '', deletedBy: '', deleteBatchId: '' } });
  assert.deepEqual(plan.cards, { boardId: 'board', listId: 'list', deleteBatchId: 'deleted-together' });
});
test('redo affects only live cards, preserving independently deleted cards', () => {
  const plan = listLifecyclePlan({ _id: 'list', boardId: 'board' }, row, { deleted: true, deletedAt: at });
  assert.deepEqual(plan.cards, { boardId: 'board', listId: 'list', deletedAt: null });
  assert.deepEqual(plan.modifier, { $set: { deletedAt: at, deletedBy: 'actor', deleteBatchId: 'deleted-together' } });
});
test('restored history content retains the original deletion batch instead of a restore-operation batch', () => {
  const plan = listLifecyclePlan({ _id: 'list', boardId: 'board' }, { ...row, batchId: 'restore-operation' },
    { deleted: false, deleteBatchId: 'deleted-together' });
  assert.equal(plan.cards.deleteBatchId, 'deleted-together');
});
test('a legacy deleted list supplies its batch when the history row has none', () => {
  const plan = listLifecyclePlan(list, { _id: 'history', boardId: 'board' }, { deleted: false });
  assert.equal(plan.cards.deleteBatchId, 'deleted-together');
});
test('missing batches never produce an unrestricted child restore', () => {
  const plan = listLifecyclePlan({ _id: 'list', boardId: 'board' }, { boardId: 'board' }, { deleted: false });
  assert.equal(plan.cards, null);
});
test('moved lists, missing lists, invalid content and invalid dates are refused', () => {
  assert.equal(listLifecyclePlan({ ...list, boardId: 'other' }, row, { deleted: false }), null);
  assert.equal(listLifecyclePlan(null, row, { deleted: false }), null);
  assert.equal(listLifecyclePlan(list, row, { deleted: 'false' }), null);
  assert.equal(listLifecyclePlan(list, row, { deleted: true, deletedAt: 'invalid' }), null);
});
