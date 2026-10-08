'use strict';
// #4906 / #4256: a view chosen on one board stays on that board.
const { test, expect } = require('../fixtures');
const db = require('../helpers/db');
const { navigateInApp } = require('../helpers/auth');

test('choosing Calendar on one board leaves another board on its own view', async ({ boardPage: page, user, board }) => {
  const other = db.seedBoard({ ownerId: user.id, title: 'Second board' });
  try {
    await page.evaluate(id => Meteor.callAsync('setBoardView', 'board-view-cal', id), board.boardId);
    await expect.poll(() => (db.findOne('users', { _id: user.id }).profile.boardViews || {})[board.boardId]).toBe('board-view-cal');
    expect(db.findOne('users', { _id: user.id }).profile.boardView).not.toBe('board-view-cal');
    await navigateInApp(page, `/b/${board.boardId}/${board.slug}`);
    await expect(page.locator('.calendar-view')).toBeVisible();
    await navigateInApp(page, `/b/${other.boardId}/${other.slug}`);
    await expect(page.locator('.board-canvas')).toBeVisible();
    await expect(page.locator('.calendar-view')).toHaveCount(0);
    const refused = await page.evaluate(async id => {
      try { await Meteor.callAsync('setBoardView', 'board-view-nonsense', id); return 'saved'; } catch (error) { return error.error; }
    }, board.boardId);
    expect(refused).not.toBe('saved');
  } finally {
    db.cleanup({ boardIds: [other.boardId] });
  }
});
