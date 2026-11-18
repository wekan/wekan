'use strict';
// #6927: cards that still belong to an ARCHIVED swimlane (archived before
// #2292 archived cards with their swimlane - a board migrated from WeKan 6.09)
// stay hidden in the Swimlanes view, with the Archive sidebar closed as well as
// open. They used to appear in the first swimlane while it was closed.
const { test, expect } = require('../fixtures');
const db = require('../helpers/db');
const BoardPage = require('../pages/BoardPage');
const { loginWithToken } = require('../helpers/auth');

test('a card of an archived swimlane is not shown in the first swimlane', async ({ page, board, user }) => {
  db.updateOne('users', { _id: user.id }, { $set: { 'profile.boardView': 'board-view-swimlanes' } });
  const lane = db.uid('swim'); const cardId = db.uid('card'); const now = new Date();
  // The legacy shape: the swimlane is archived, its card is not.
  db.insertOne('swimlanes', { _id: lane, title: 'Archived lane', boardId: board.boardId, sort: 5, type: 'swimlane',
    archived: true, archivedAt: now, createdAt: now, updatedAt: now, modifiedAt: now });
  db.insertOne('cards', { _id: cardId, title: 'Card of the archived lane', boardId: board.boardId, swimlaneId: lane,
    listId: board.listIds[0], sort: 9, archived: false, userId: user.id, type: 'cardType-card',
    createdAt: now, modifiedAt: now, dateLastActivity: now });
  await loginWithToken(page, user.id, user.token);
  await page.goto(`/b/${board.boardId}/${board.slug}`);
  const bp = new BoardPage(page);
  // Positive control: the first swimlane's own card renders.
  await expect(page.locator('.js-minicard', { hasText: 'Alpha Card' })).toBeVisible({ timeout: 20_000 });
  await expect(page.locator('.js-minicard', { hasText: 'Card of the archived lane' })).toHaveCount(0);

  // With the Archive sidebar open, and after closing it again.
  await bp.openSidebar();
  await page.locator('.board-sidebar .js-open-board-menu').click();
  await page.locator('.js-pop-over .js-open-archives').click();
  await page.waitForTimeout(800);
  await expect(page.locator('.list .js-minicard', { hasText: 'Card of the archived lane' })).toHaveCount(0);
  await bp.openSidebar();
  await page.locator('.js-toggle-page-sidebar').click();
  await page.waitForTimeout(800);
  await expect(page.locator('.list .js-minicard', { hasText: 'Card of the archived lane' })).toHaveCount(0);
});
