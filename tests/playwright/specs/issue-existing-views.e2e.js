'use strict';
const { test, expect } = require('../fixtures');
const db = require('../helpers/db');
const BoardPage = require('../pages/BoardPage');

test('#1748: Lists view displays a cards swimlane when enabled and hides it when disabled', async ({ boardPage: page, board }) => {
  db.updateOne('swimlanes', { _id: board.swimlaneId }, { $set: { title: 'Delivery stream' } });
  db.updateOne('boards', { _id: board.boardId }, { $set: { allowsSwimlaneNameOnMinicard: true } });
  await new BoardPage(page).switchToListView();
  const names = page.locator('.minicard-swimlane-name');
  await expect(names).toHaveCount(3);
  await expect(names.first()).toContainText('Delivery stream');
  db.updateOne('boards', { _id: board.boardId }, { $set: { allowsSwimlaneNameOnMinicard: false } });
  await expect(names).toHaveCount(0);
  await expect(page.locator('.js-minicard')).toHaveCount(3);
});

test('#2107: Board Settings hides a view from this board and preserves the current default', async ({ boardPage: page, board }) => {
  await new BoardPage(page).openSidebar();
  await page.locator('.js-open-board-menu').click();
  await page.locator('.js-open-board-view-settings').click();
  const row = page.locator('.board-view-settings-row[data-view="board-view-lists"]');
  await row.locator('.js-board-view-show[data-visibility="private"]').click();
  await expect.poll(() => db.getBoard(board.boardId).boardViewSettings?.['board-view-lists']?.showOnPrivate).toBe(false);
  await page.locator('.js-pop-over .js-close-pop-over').click();
  await page.locator('.js-toggle-board-view').click();
  await expect(page.locator('.js-pop-over .js-open-lists-view')).toHaveCount(0);
  await expect(page.locator('.js-pop-over .js-open-swimlanes-view')).toBeVisible();
  await expect(page.locator('.js-minicard')).toHaveCount(3);
});
