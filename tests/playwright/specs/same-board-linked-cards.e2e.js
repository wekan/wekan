'use strict';
const { test, expect } = require('../fixtures');
const db = require('../helpers/db');
const BoardPage = require('../pages/BoardPage');
const CardPage = require('../pages/CardPage');

test('#5683: create a same-board mirror and synchronize labels in both directions', async ({ boardPage: page, board }) => {
  const source = db.findOne('cards', { boardId: board.boardId, title: 'Alpha Card' });
  const labelId = db.uid('label');
  db.updateOne('boards', { _id: board.boardId }, { $set: {
    labels: [{ _id: labelId, name: 'Mirrored Label', color: 'green' }],
    showLabelText: true,
  } });
  const bp = new BoardPage(page);
  await bp.openAddCardTop(board.listIds[1]);
  await bp.list(board.listIds[1]).locator('.js-link').click();
  const popup = page.locator('.js-pop-over');
  await popup.locator('.js-select-boards').selectOption(board.boardId);
  await popup.locator('.js-select-cards').selectOption(source._id);
  await popup.locator('.js-done').click();
  await expect(popup).toBeHidden();
  await expect.poll(() => db.countDocuments('cards', { boardId: board.boardId, linkedId: source._id })).toBe(1);
  const mirror = db.findOne('cards', { boardId: board.boardId, linkedId: source._id });
  const mini = page.locator(`.js-minicard[data-card-id="${mirror._id}"]`);
  await expect(mini).toContainText('Alpha Card');
  db.updateOne('cards', { _id: source._id }, { $set: { labelIds: [labelId] } });
  await expect(mini.locator('.card-label').first()).toHaveAttribute('title', 'Mirrored Label');
  await mini.click();
  const details = new CardPage(page);
  await details.waitForOpen();
  await details.openLabelSelector();
  await page.locator('.js-pop-over .js-select-label').filter({ hasText: 'Mirrored Label' }).click();
  await expect.poll(() => db.findOne('cards', { _id: source._id }).labelIds).toEqual([]);
  await expect(mini.locator('.card-label')).toHaveCount(0);
});

test('#5683: same-board links still reject pointers and unauthorized writes', async ({ boardPage: page, board, user }) => {
  const source = db.findOne('cards', { boardId: board.boardId, title: 'Alpha Card' });
  const call = id => page.evaluate(async ({ id, board }) => {
    try {
      return { id: await window.Meteor.callAsync('createLinkedCard', id, board.boardId, board.swimlaneId, board.listIds[1], 10) };
    } catch (error) { return { error: error.error }; }
  }, { id, board });
  const mirror = await call(source._id);
  expect(mirror.id).toBeTruthy();
  expect(await call(mirror.id)).toEqual({ error: 'invalid-linked-card' });
  const original = db.getBoard(board.boardId).members;
  try {
    db.updateOne('boards', { _id: board.boardId }, { $set: { members: original.map(m => m.userId === user.id ? { userId: user.id, isActive: true, isReadOnly: true } : m) } });
    expect(await call(source._id)).toEqual({ error: 'not-authorized' });
    expect(db.countDocuments('cards', { boardId: board.boardId, linkedId: source._id })).toBe(1);
  } finally {
    db.updateOne('boards', { _id: board.boardId }, { $set: { members: original } });
  }
});

test('#5683: selecting the current board without a card cannot create a board self-link', async ({ boardPage: page, board }) => {
  const bp = new BoardPage(page);
  for (const button of ['.js-link-board', '.js-done']) {
    await bp.openAddCardTop(board.listIds[1]);
    await bp.list(board.listIds[1]).locator('.js-link').click();
    const popup = page.locator('.js-pop-over');
    await popup.locator('.js-select-boards').selectOption(board.boardId);
    await popup.locator(button).click();
    await expect(popup).toBeHidden();
    expect(db.countDocuments('cards', { boardId: board.boardId, linkedId: board.boardId })).toBe(0);
  }
});
