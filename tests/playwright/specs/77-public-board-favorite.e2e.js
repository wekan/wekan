'use strict';

const { test, expect } = require('../fixtures');
const db = require('../helpers/db');
const { loginWithToken, openBoard } = require('../helpers/auth');

const baseUrl = process.env.WEKAN_BASE_URL || 'http://localhost:3000';

test('#6713 public board favorite survives reload and appears in Favorites', async ({ page, board, user2 }) => {
  db.updateOne('boards', { _id: board.boardId }, { $set: { permission: 'public' } });
  await loginWithToken(page, user2.id, user2.token);
  await openBoard(page, board.boardId, board.slug);

  const star = page.locator('.js-star-board').first();
  await expect(star).toBeVisible();
  await star.click();
  await expect.poll(() => db.findOne('users', { _id: user2.id })?.profile?.starredBoards || [])
    .toContain(board.boardId);

  await page.reload({ waitUntil: 'domcontentloaded' });
  await expect(star).toHaveClass(/is-active/);
  await page.goto(`${baseUrl}/allboards/starred`, { waitUntil: 'domcontentloaded' });
  await expect(page.locator(`li.js-board.${board.boardId}`)).toBeVisible();

  // A stale favorite cannot keep a public board visible after it turns private.
  db.updateOne('boards', { _id: board.boardId }, { $set: { permission: 'private' } });
  await page.reload({ waitUntil: 'domcontentloaded' });
  await expect(page.locator(`li.js-board.${board.boardId}`)).toHaveCount(0);
});
