'use strict';
// #1566: a board admin's announcement is shown on the board, plain text, and
// a member's dismissal lasts until the next edit.
const { test, expect } = require('../fixtures');
const db = require('../helpers/db');
const { navigateInApp } = require('../helpers/auth');

test('a board announcement shows on its board until dismissed, and again after an edit', async ({ boardPage: page, user, board }) => {
  await page.evaluate(id => ReactiveCache.getBoard(id).setAnnouncement(true, '<b>Freeze</b> on Friday'), board.boardId).catch(async () => {
    db.updateOne('boards', { _id: board.boardId }, { $set: { announcement: { enabled: true, body: '<b>Freeze</b> on Friday', updatedAt: new Date() } } });
  });
  await navigateInApp(page, `/b/${board.boardId}/${board.slug}`);
  const banner = page.locator('.js-board-announcement');
  await expect(banner).toContainText('<b>Freeze</b> on Friday');
  await expect(banner.locator('b')).toHaveCount(0);
  await banner.locator('.js-close-board-announcement').click();
  await expect(banner).toHaveCount(0);
  await expect.poll(() => (db.findOne('users', { _id: user.id }).profile.dismissedBoardAnnouncements || {})[board.boardId]).toBeTruthy();
  db.updateOne('boards', { _id: board.boardId }, { $set: { 'announcement.body': 'Freeze moved to Monday', 'announcement.updatedAt': new Date(Date.now() + 1000) } });
  await expect(page.locator('.js-board-announcement')).toContainText('Freeze moved to Monday');
  db.updateOne('boards', { _id: board.boardId }, { $unset: { announcement: '' } });
});
