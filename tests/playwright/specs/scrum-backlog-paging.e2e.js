'use strict';
// A large Product Backlog renders 100 rows at a time (client/components/boards/scrum/scrumView.js).
const { test, expect } = require('../fixtures');
const db = require('../helpers/db');
const { loginWithToken, openBoard } = require('../helpers/auth');

test('Product Backlog shows a page of rows at a time, in Scrum order, and more on request', async ({ page, user, board }) => {
  const [card] = db.find('cards', { boardId: board.boardId });
  const ids = [];
  try {
    for (let i = 0; i < 150; i++) {
      const _id = `paging-${i}-${board.boardId}`;
      ids.push(_id);
      db.insertOne('cards', { ...card, _id, title: `Paged ${String(i).padStart(3, '0')}`, sort: 1000 + i,
        scrum: { backlogRank: 1000 + i } });
    }
    await loginWithToken(page, user.id, user.token);
    await openBoard(page, board.boardId, board.slug);
    await page.locator('.js-toggle-board-view').first().click();
    await page.locator('.pop-over .js-open-product-backlog-view').click();
    const rows = page.locator('.scrum-table tbody tr[data-card-id]');
    await expect(rows).toHaveCount(100);
    await expect(rows.last()).toContainText(/Paged 09[0-9]/);
    const more = page.locator('.js-scrum-show-more');
    await expect(more).toBeVisible();
    await more.click();
    const total = db.find('cards', { boardId: board.boardId, archived: { $ne: true }, 'scrum.sprintId': { $exists: false } }).length;
    await expect(rows).toHaveCount(Math.min(total, 200));
    await expect(page.locator('.scrum-table')).toContainText('Paged 149');
    if (total <= 200) await expect(more).toHaveCount(0);
  } finally {
    db.deleteMany('cards', { _id: { $in: ids } });
  }
});
