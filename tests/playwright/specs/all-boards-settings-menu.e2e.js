'use strict';
// Board Settings / All Boards Settings is reachable again: the board menu entry
// was commented out for #4214, which left its popup in the code with no way in.
const { test, expect } = require('../fixtures');
const db = require('../helpers/db');
const BoardPage = require('../pages/BoardPage');
const { loginWithToken, openBoard } = require('../helpers/auth');

test('a board admin opens All Boards Settings from the board menu and saves a row', async ({ boardPage: page, board }) => {
  await new BoardPage(page).openSidebar();
  await page.locator('.js-open-board-menu').click();
  const entry = page.locator('.js-pop-over .content:not(.no-height) .js-board-info-on-my-boards');
  await expect(entry).toBeVisible();
  await entry.click();
  const row = page.locator('.js-field-has-personal-list-width');
  await expect(row).toBeVisible();
  const before = !!db.findOne('boards', { _id: board.boardId }).allowsPersonalListWidth;
  await row.click();
  await expect.poll(() => !!db.findOne('boards', { _id: board.boardId }).allowsPersonalListWidth).toBe(!before);
});

test('negative: a board member who is not a board admin has no such entry', async ({ page, board, user2 }) => {
  db.addBoardMember({ boardId: board.boardId, userId: user2.id });
  await loginWithToken(page, user2.id, user2.token);
  await openBoard(page, board.boardId, board.slug);
  await new BoardPage(page).openSidebar();
  await page.locator('.js-open-board-menu').click();
  await expect(page.locator('.js-pop-over .content:not(.no-height)').first()).toBeVisible();
  await expect(page.locator('.js-pop-over .js-board-info-on-my-boards')).toHaveCount(0);
});
