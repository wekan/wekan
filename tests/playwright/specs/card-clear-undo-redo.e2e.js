'use strict';

// Clearing a card's title or description is an edit, not a deletion: the old
// value goes into History, Ctrl+Z puts it back and Ctrl+Y clears it again.
// Admin Panel / Problems / Delete (enablePermanentDelete) has no say in it -
// nothing is destroyed. collection2's default clean removes '' from $set, so
// the card details clear and History's redo/Restore of a cleared value used to
// leave an empty modifier and throw. tests/emptyStringClearWrites.test.cjs pins
// the write options; this drives the running app.

const { test, expect } = require('../fixtures');
const db = require('../helpers/db');
const BoardPage = require('../pages/BoardPage');
const CardPage = require('../pages/CardPage');

const cardPath = card => `/api/boards/${card.boardId}/lists/${card.listId}/cards/${card._id}`;
const auth = user => ({ Authorization: `Bearer ${user.token}` });
const call = (page, name, boardId) => page.evaluate(([n, id]) => Meteor.callAsync(n, id), [name, boardId]);
const rows = (cardId, field) => db.find('changeHistory', { entityType: 'card', entityId: cardId })
  .filter(row => (row.previousContent && row.previousContent.field === field)
    || (row.newContent && row.newContent.field === field));

test('a title cleared in the card details is undone and redone', async ({ boardPage: page, board }) => {
  const dialogs = [];
  page.on('dialog', dialog => { dialogs.push(dialog.message()); dialog.dismiss(); });
  const card = db.findOne('cards', { boardId: board.boardId, title: 'Alpha Card' });
  await new BoardPage(page).clickCard(board.listIds[0], 'Alpha Card');
  const cardPage = new CardPage(page);
  await cardPage.waitForOpen();
  await cardPage.editTitle('');

  await expect.poll(() => db.findOne('cards', { _id: card._id }).title).toBe('');
  expect(dialogs).toEqual([]);
  const [cleared] = rows(card._id, 'title');
  expect(cleared).toMatchObject({ changeType: 'removed', previousContent: { value: 'Alpha Card' } });

  await call(page, 'changeHistory.undoLast', board.boardId);
  expect(db.findOne('cards', { _id: card._id }).title).toBe('Alpha Card');
  await call(page, 'changeHistory.redoLast', board.boardId);
  expect(db.findOne('cards', { _id: card._id }).title).toBe('');
});

test('a description cleared over REST is undone and redone', async ({ boardPage: page, request, user, board }) => {
  const card = db.findOne('cards', { boardId: board.boardId, title: 'Alpha Card' });
  const path = cardPath(card);
  expect((await request.put(path, { headers: auth(user), data: { description: 'Kept in History' } })).status()).toBe(200);
  expect((await request.put(path, { headers: auth(user), data: { description: '' } })).status()).toBe(200);
  expect(db.findOne('cards', { _id: card._id }).description).toBe('');
  expect(rows(card._id, 'description').some(row => row.changeType === 'removed'
    && row.previousContent.value === 'Kept in History')).toBe(true);

  await call(page, 'changeHistory.undoLast', board.boardId);
  expect(db.findOne('cards', { _id: card._id }).description).toBe('Kept in History');
  await call(page, 'changeHistory.redoLast', board.boardId);
  expect(db.findOne('cards', { _id: card._id }).description).toBe('');
});

test('a REST title of only spaces clears the title instead of failing', async ({ request, user, board }) => {
  const card = db.findOne('cards', { boardId: board.boardId, title: 'Alpha Card' });
  const response = await request.put(cardPath(card), { headers: auth(user), data: { title: '   ' } });
  expect(response.status()).toBe(200);
  expect(db.findOne('cards', { _id: card._id }).title).toBe('');
});

test('negative: clearing an already empty title records nothing', async ({ request, user, board }) => {
  const card = db.findOne('cards', { boardId: board.boardId, title: 'Alpha Card' });
  db.updateOne('cards', { _id: card._id }, { $set: { title: '' } });
  const before = rows(card._id, 'title').length;
  expect((await request.put(cardPath(card), { headers: auth(user), data: { title: '' } })).status()).toBe(200);
  expect(rows(card._id, 'title')).toHaveLength(before);
});
