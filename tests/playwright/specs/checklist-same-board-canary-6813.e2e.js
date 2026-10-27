'use strict';

// #6813: a comment-only member moving a checklist item within its own card -
// what a drag sends - is not a cross-board attack: no ChecklistBleed canary in
// Admin Panel / Problems. A real move into a board they cannot write to still
// trips it.
const { test, expect } = require('../fixtures');
const db = require('../helpers/db');

const call = (page, method, ...args) => page.evaluate(async ({ method, args }) => {
  try { return { value: await Meteor.callAsync(method, ...args) }; }
  catch (error) { return { error: error.error || error.message }; }
}, { method, args });
const canaryRows = () => db.countDocuments('eventlog', { source: 'canary:checklist-item.cross-board-move' });

test('#6813: a drag on one\'s own board is no cross-board move; a move into another board still is', async ({ boardPage: page, board, user }) => {
  const card = db.findOne('cards', { boardId: board.boardId, title: 'Alpha Card' });
  const checklistId = db.uid('cl');
  const itemId = db.uid('ci');
  db.insertOne('checklists', { _id: checklistId, cardId: card._id, boardId: board.boardId, title: 'Steps', sort: 0, createdAt: new Date() });
  db.insertOne('checklistItems', { _id: itemId, checklistId, cardId: card._id, boardId: board.boardId, title: 'One', sort: 0, isFinished: false });
  // The user is comment-only on their own board.
  db.updateOne('boards', { _id: board.boardId, 'members.userId': user.id }, { $set: { 'members.$.isCommentOnly': true, 'members.$.isAdmin': false } });
  db.deleteMany('eventlog', { source: 'canary:checklist-item.cross-board-move' });

  // What a drag within the card sends: cardId and checklistId as they are.
  await call(page, '/checklistItems/update', { _id: itemId }, { $set: { cardId: card._id, checklistId, sort: 1 } });
  await page.waitForTimeout(1500);
  expect(canaryRows()).toBe(0);

  // Negative: into a card of a board the user is not a member of - still the canary.
  const other = db.seedBoard({ ownerId: db.uid('owner'), cardTitlesPerList: [['Elsewhere']] });
  const otherCard = db.findOne('cards', { boardId: other.boardId });
  await call(page, '/checklistItems/update', { _id: itemId }, { $set: { cardId: otherCard._id } });
  await expect.poll(canaryRows, { timeout: 15_000 }).toBeGreaterThan(0);
  expect(db.findOne('checklistItems', { _id: itemId }).cardId).toBe(card._id);
});
