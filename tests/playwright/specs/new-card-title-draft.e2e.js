'use strict';
const { test, expect } = require('../fixtures');
const db = require('../helpers/db');
const BoardPage = require('../pages/BoardPage');
const { loginWithToken, navigateInApp } = require('../helpers/auth');

test('#810: closing a new card preserves its title; saving clears only that draft', async ({ boardPage: page, board }) => {
  const bp = new BoardPage(page);
  await bp.openAddCardTop(board.listIds[0]);
  await bp.list(board.listIds[0]).locator('.js-card-title').fill('Unfinished card title');
  await bp.closeComposers(board.listIds[0]);
  await bp.openAddCardTop(board.listIds[1]);
  await expect(bp.list(board.listIds[1]).locator('.js-card-title')).toHaveValue('');
  await bp.closeComposers(board.listIds[1]);
  await bp.openAddCardTop(board.listIds[0]);
  await expect(bp.list(board.listIds[0]).locator('.js-card-title')).toHaveValue('Unfinished card title');
  await bp.list(board.listIds[0]).locator('button[type="submit"]').click();
  await expect(bp.minicard(board.listIds[0], 'Unfinished card title')).toBeVisible();
  await bp.closeComposers(board.listIds[0]);
  await bp.openAddCardTop(board.listIds[0]);
  await expect(bp.list(board.listIds[0]).locator('.js-card-title')).toHaveValue('');
  await expect.poll(() => db.find('unsaved-edits', { userId: board.owner.id, docId: board.listIds[0] }).length).toBe(0);
});

test('#810: another board member cannot read or overwrite the author draft', async ({ boardPage: page, board, user2, browser }) => {
  db.addBoardMember({ boardId: board.boardId, userId: user2.id });
  const bp = new BoardPage(page);
  await bp.openAddCardTop(board.listIds[0]);
  await bp.list(board.listIds[0]).locator('.js-card-title').fill('Author private draft');
  await bp.closeComposers(board.listIds[0]);
  await expect.poll(() => db.find('unsaved-edits', { userId: board.owner.id, docId: board.listIds[0] }).length).toBe(1);
  const draft = db.findOne('unsaved-edits', { userId: board.owner.id, docId: board.listIds[0] });
  const context = await browser.newContext();
  const other = await context.newPage();
  try {
    await loginWithToken(other, user2.id, user2.token);
    await navigateInApp(other, `/b/${board.boardId}/${board.slug}`);
    const otherBoard = new BoardPage(other);
    await otherBoard.openAddCardTop(board.listIds[0]);
    await expect(otherBoard.list(board.listIds[0]).locator('.js-card-title')).toHaveValue('');
    const denied = await other.evaluate(async id => {
      try { await Meteor.callAsync('/unsaved-edits/update', { _id: id }, { $set: { value: 'Overwrite' } }); return 'allowed'; }
      catch (error) { return error.error; }
    }, draft._id);
    expect(denied).toBe(403);
    expect(db.findOne('unsaved-edits', { _id: draft._id }).value).toBe('Author private draft');
  } finally {
    await context.close();
    db.deleteOne('unsaved-edits', { _id: draft._id });
  }
});
