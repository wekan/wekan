'use strict';

// The attachment soft-delete decisions (models/lib/attachmentSoftDelete.js),
// as arithmetic - no Meteor, no database. History.md §12 is the specification.
// Run: node tests/attachmentSoftDelete.test.cjs

const assert = require('node:assert/strict');
const {
  liveAttachments,
  isLiveAttachment,
  attachmentHistoryContent,
  softDeleteAttachmentPlan,
  restoreAttachmentPlan,
  attachmentContentAction,
  historyRowOffersRestore,
} = require('../models/lib/attachmentSoftDelete');
const { contentForDirection } = require('../models/lib/changeHistoryGroups');

let passed = 0;
function test(name, fn) {
  fn();
  passed += 1;
  console.log('  ok -', name);
}

console.log('attachmentSoftDelete:');

const at = new Date('2026-09-11T10:00:00Z');
const attachment = {
  _id: 'att1',
  name: 'photo.png',
  userId: 'uploader',
  meta: { boardId: 'b1', swimlaneId: 's1', listId: 'l1', cardId: 'c1' },
};

// ---- §12.1 what a delete sets, and the cover ---------------------------------

test('a soft delete sets deletedAt, deletedBy and deleteBatchId and nothing else', () => {
  const plan = softDeleteAttachmentPlan({ attachment, card: { _id: 'c1' }, userId: 'u1', at });
  assert.deepEqual(Object.keys(plan.set).sort(), ['deleteBatchId', 'deletedAt', 'deletedBy']);
  assert.equal(plan.set.deletedAt, at);
  assert.equal(plan.set.deletedBy, 'u1');
  assert.equal(plan.set.deleteBatchId, plan.batchId);
  assert.equal(plan.alreadyDeleted, false);
});

test('the cover is unset when THIS attachment is the cover', () => {
  const plan = softDeleteAttachmentPlan({ attachment, card: { _id: 'c1', coverId: 'att1' }, userId: 'u1', at });
  assert.equal(plan.unsetCover, true);
});

test('negative: the cover is left alone when another attachment is the cover, or there is none', () => {
  assert.equal(softDeleteAttachmentPlan({ attachment, card: { _id: 'c1', coverId: 'other' }, userId: 'u1', at }).unsetCover, false);
  assert.equal(softDeleteAttachmentPlan({ attachment, card: { _id: 'c1' }, userId: 'u1', at }).unsetCover, false);
  assert.equal(softDeleteAttachmentPlan({ attachment, card: null, userId: 'u1', at }).unsetCover, false);
});

test('deleting an already deleted attachment is recognised, not re-marked', () => {
  const plan = softDeleteAttachmentPlan({ attachment: { ...attachment, deletedAt: at }, card: null, userId: 'u1', at });
  assert.equal(plan.alreadyDeleted, true);
});

// ---- §12.2 the history row ----------------------------------------------------

test('the delete records a lifecycle "removed" row carrying the filename and every container id', () => {
  const { historyRow } = softDeleteAttachmentPlan({ attachment, card: null, userId: 'u1', at });
  assert.equal(historyRow.entityType, 'attachment');
  assert.equal(historyRow.entityId, 'att1');
  assert.equal(historyRow.group, 'lifecycle');
  assert.equal(historyRow.changeType, 'removed');
  assert.equal(historyRow.userId, 'u1');
  assert.deepEqual(
    [historyRow.boardId, historyRow.swimlaneId, historyRow.listId, historyRow.cardId],
    ['b1', 's1', 'l1', 'c1'],
  );
  assert.deepEqual(historyRow.previousContent, { deleted: false, name: 'photo.png' });
});

test('the removed row has NO newContent, so Restore on it restores (History.md §8 fallback)', () => {
  const { historyRow } = softDeleteAttachmentPlan({ attachment, card: null, userId: 'u1', at });
  assert.equal(historyRow.newContent, null);
  const restoreContent = contentForDirection(historyRow, 'restore');
  assert.equal(attachmentContentAction(restoreContent), 'restore');
  // Undo of a delete is a restore too.
  assert.equal(attachmentContentAction(contentForDirection(historyRow, 'undo')), 'restore');
});

test('the restore records the mirror "added" row', () => {
  const deleted = { ...attachment, deletedAt: at, deleteBatchId: 'batch-1' };
  const { historyRow } = restoreAttachmentPlan({ attachment: deleted, userId: 'u2' });
  assert.equal(historyRow.changeType, 'added');
  assert.equal(historyRow.group, 'lifecycle');
  assert.equal(historyRow.userId, 'u2');
  assert.equal(historyRow.batchId, 'batch-1');
  assert.deepEqual(historyRow.newContent, { deleted: false, name: 'photo.png' });
  assert.deepEqual(historyRow.previousContent, { deleted: true, deletedAt: at });
  // Restore of THAT row restores again - never deletes.
  assert.equal(attachmentContentAction(contentForDirection(historyRow, 'restore')), 'restore');
});

test('attachmentHistoryContent tolerates a nameless document', () => {
  assert.deepEqual(attachmentHistoryContent({}, true), { deleted: true, name: '' });
  assert.deepEqual(attachmentHistoryContent(null, false), { deleted: false, name: '' });
});

// ---- §12.2 restore: back, badges and all, but never the cover -----------------

test('restore drops all three bookkeeping fields with $unset - the live filter sees it again', () => {
  const deleted = { ...attachment, deletedAt: at, deletedBy: 'u1', deleteBatchId: 'x' };
  const plan = restoreAttachmentPlan({ attachment: deleted, userId: 'u2' });
  assert.deepEqual(plan.modifier, { $unset: { deletedAt: '', deletedBy: '', deleteBatchId: '' } });
  assert.equal(plan.alreadyLive, false);
});

test('negative: restore NEVER re-sets the cover', () => {
  const deleted = { ...attachment, deletedAt: at };
  const plan = restoreAttachmentPlan({ attachment: deleted, userId: 'u2' });
  assert.equal(plan.resetCover, false);
  assert.ok(!('coverId' in (plan.modifier.$set || {})), 'no coverId write in the restore modifier');
});

test('restoring a live attachment is a no-op', () => {
  assert.equal(restoreAttachmentPlan({ attachment, userId: 'u2' }).alreadyLive, true);
});

test('attachmentContentAction: deleted:true deletes, deleted:false restores, anything else is nothing', () => {
  assert.equal(attachmentContentAction({ deleted: true }), 'delete');
  assert.equal(attachmentContentAction({ deleted: false }), 'restore');
  assert.equal(attachmentContentAction({ field: 'name', value: 'x' }), null);
  assert.equal(attachmentContentAction(null), null);
});

// ---- §12.1 the live filter ---------------------------------------------------

test('liveAttachments adds deletedAt:null - which matches absent fields, so no backfill', () => {
  assert.deepEqual(liveAttachments({ 'meta.cardId': 'c1' }), { 'meta.cardId': 'c1', deletedAt: null });
  assert.deepEqual(liveAttachments(), { deletedAt: null });
});

test('isLiveAttachment: a deleted or missing attachment is not live', () => {
  assert.equal(isLiveAttachment(attachment), true);
  assert.equal(isLiveAttachment({ ...attachment, deletedAt: at }), false);
  assert.equal(isLiveAttachment(null), false);
});

// ---- the per-row Restore button -----------------------------------------------

test('a history row offers Restore only for a deleted attachment', () => {
  const row = { entityType: 'attachment', entityId: 'att1' };
  assert.equal(historyRowOffersRestore(row, { ...attachment, deletedAt: at }), true);
  assert.equal(historyRowOffersRestore(row, attachment), false, 'live: nothing to restore');
  assert.equal(historyRowOffersRestore(row, null), false, 'gone for good (board purged)');
  assert.equal(historyRowOffersRestore({ entityType: 'card' }, { deletedAt: at }), false, 'not an attachment row');
});

console.log(`\nattachmentSoftDelete: ${passed} tests passed`);
