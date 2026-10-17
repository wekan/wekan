'use strict';

// Board menu -> Since your last visit
// (docs/Features/General/Since-Last-Visit/Since-Last-Visit.md): another
// member's change shows with its count on the first visit, and the next visit
// starts from the previous one, so it is gone.

const { test, expect } = require('../fixtures');
const db = require('../helpers/db');
const { openBoard } = require('../helpers/auth');

async function openBoardMenu(page) {
  const cog = page.locator('.board-sidebar .js-open-board-menu');
  if (!(await cog.isVisible().catch(() => false))) {
    await page.locator('.js-toggle-page-sidebar').first().click();
  }
  await cog.click();
}

test('another member\'s change, and the next visit starting afresh', async ({ boardPage, board, user }) => {
  // The fixture's first visit is already remembered; what happens after it
  // is what the next visit lists.
  await expect.poll(() => ((db.findOne('users', { _id: user.id }).profile || {}).boardVisits || {})[board.boardId],
    { timeout: 15_000 }).toBeTruthy();
  const other = db.seedUser();
  const alpha = db.findOne('cards', { boardId: board.boardId, title: 'Alpha Card' });
  db.insertOne('activities', { _id: `e2e-slv-${board.boardId}`, activityType: 'moveCard', boardId: board.boardId,
    cardId: alpha._id, userId: other.id, listName: 'Second list', createdAt: new Date() });
  // Your own change is never listed (negative).
  db.insertOne('activities', { _id: `e2e-slv-me-${board.boardId}`, activityType: 'addComment', boardId: board.boardId,
    cardId: alpha._id, userId: user.id, createdAt: new Date() });

  await boardPage.reload();
  await boardPage.locator('.js-minicard').first().waitFor({ timeout: 30_000 });
  await expect.poll(() => ((db.findOne('users', { _id: user.id }).profile || {}).boardVisits || {})[board.boardId],
    { timeout: 15_000 }).toBeTruthy();

  await openBoardMenu(boardPage);
  const entry = boardPage.locator('.pop-over .js-open-since-last-visit');
  await expect(entry).toContainText('(1)', { timeout: 15_000 });
  await entry.click();
  const view = boardPage.locator('.since-last-visit-view');
  await expect(view.locator('.since-last-visit-card')).toHaveCount(1, { timeout: 15_000 });
  await expect(view).toContainText('Alpha Card');
  await expect(view).toContainText('Second list');
  await expect(view.locator('.since-last-visit-changes li')).toHaveCount(1);

  // The next visit starts from this one: the move happened before it.
  await openBoard(boardPage, board.boardId, board.slug);
  await boardPage.reload();
  await boardPage.locator('.js-minicard').first().waitFor({ timeout: 30_000 });
  await openBoardMenu(boardPage);
  await expect(boardPage.locator('.pop-over .js-open-since-last-visit')).not.toContainText('(', { timeout: 10_000 });
  await boardPage.locator('.pop-over .js-open-since-last-visit').click();
  await expect(boardPage.locator('.since-last-visit-empty')).toBeVisible({ timeout: 15_000 });
});
