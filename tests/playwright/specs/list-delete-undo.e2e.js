'use strict';
const { test, expect } = require('../fixtures');
const db = require('../helpers/db');

test('#1023: undo restores a deleted list and its cards', async ({ boardPage: page, board }) => {
  const listId = board.listIds[0];
  const card = db.findOne('cards', { boardId: board.boardId, listId });
  const separateId = db.uid('previously-deleted');
  db.insertOne('cards', { ...card, _id: separateId, title: 'Previously deleted', deletedAt: new Date(), deletedBy: board.owner.id, deleteBatchId: 'independent-delete' });
  await page.evaluate(id => Meteor.callAsync('lists.softRemove', id), listId);
  await expect(page.locator(`#js-list-${listId}`)).toHaveCount(0);
  expect(db.findOne('cards', { _id: card._id }).deletedAt).toBeTruthy();
  await page.evaluate(id => Meteor.callAsync('changeHistory.undoLast', id), board.boardId);
  await expect(page.locator(`#js-list-${listId}`)).toBeVisible();
  await expect(page.locator(`.js-minicard[data-card-id="${card._id}"]`)).toBeVisible();
  expect(db.findOne('cards', { _id: card._id }).deletedAt).toBeFalsy();
  expect(db.findOne('cards', { _id: separateId }).deleteBatchId).toBe('independent-delete');
  await page.evaluate(id => Meteor.callAsync('changeHistory.redoLast', id), board.boardId);
  expect(db.findOne('cards', { _id: card._id }).deletedAt).toBeTruthy();
  expect(db.findOne('lists', { _id: listId }).deletedAt).toBeTruthy();
  expect(db.findOne('cards', { _id: separateId }).deleteBatchId).toBe('independent-delete');
  await page.evaluate(id => Meteor.callAsync('changeHistory.undoLast', id), board.boardId);
  expect(db.findOne('cards', { _id: card._id }).deletedAt).toBeFalsy();
  expect(db.findOne('cards', { _id: separateId }).deletedAt).toBeTruthy();
});


// Keep the authorized undo cycle and rejected-write scenario independent.
test('#1023: a read-only member cannot undo a list deletion', async ({ boardPage: page, board }) => {
  const listId = board.listIds[0];
  await page.evaluate(id => Meteor.callAsync('lists.softRemove', id), listId);
  const originalMembers = db.getBoard(board.boardId).members;
  db.updateOne('boards', { _id: board.boardId }, { $set: {
    members: originalMembers.map(member => member.userId === board.owner.id
      ? { userId: member.userId, isActive: true, isReadOnly: true } : member),
  } });
  const denied = await page.evaluate(async id => {
    try { await Meteor.callAsync('changeHistory.undoLast', id); return 'unexpected-success'; }
    catch (error) { return error.error; }
  }, board.boardId);
  expect(denied).toBe('not-authorized');
  expect(db.findOne('lists', { _id: listId }).deletedAt).toBeTruthy();
  expect(db.findOne('cards', { listId }).deletedAt).toBeTruthy();
});
