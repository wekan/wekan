'use strict';

// Board menu -> Summary (docs/Features/General/Summary/Summary.md): the menu
// entry, the groups per person, Last week, and the entry and the server
// answer gone when Admin Panel / Settings / Visibility / Features turns it off.

const { test, expect } = require('../fixtures');
const db = require('../helpers/db');

async function openBoardMenu(page) {
  const cog = page.locator('.board-sidebar .js-open-board-menu');
  if (!(await cog.isVisible().catch(() => false))) {
    await page.locator('.js-toggle-page-sidebar').first().click();
  }
  await cog.click();
}

test.describe('Board summary', () => {
  test('what each person did, by day and by week', async ({ boardPage, board, user }) => {
    const alpha = db.findOne('cards', { boardId: board.boardId, title: 'Alpha Card' });
    const beta = db.findOne('cards', { boardId: board.boardId, title: 'Beta Card' });
    const gamma = db.findOne('cards', { boardId: board.boardId, title: 'Gamma Card' });
    const now = Date.now();
    db.insertMany('activities', [
      { _id: `e2e-sum-1-${board.boardId}`, activityType: 'moveCard', boardId: board.boardId, cardId: alpha._id,
        userId: user.id, listId: board.listIds[1], createdAt: new Date(now - 3600_000) },
      { _id: `e2e-sum-2-${board.boardId}`, activityType: 'addComment', boardId: board.boardId, cardId: beta._id,
        userId: user.id, createdAt: new Date(now - 3 * 24 * 3600_000) },
    ]);
    db.updateOne('cards', { _id: gamma._id }, { $set: { dueAt: new Date(now - 7200_000), members: [user.id] } });

    await openBoardMenu(boardPage);
    await boardPage.locator('.pop-over .js-open-board-summary').click();
    const view = boardPage.locator('.board-summary-view');
    await expect(view.locator('.board-summary-person')).toHaveCount(1, { timeout: 15_000 });
    await expect(view.locator('.board-summary-moved')).toContainText('Alpha Card');
    await expect(view.locator('.board-summary-overdue')).toContainText('Gamma Card');
    await expect(view.locator('.board-summary-commented')).toHaveCount(0, { timeout: 5_000 });

    await view.locator('.js-summary-period[data-period="week"]').click();
    await expect(view.locator('.board-summary-commented')).toContainText('Beta Card', { timeout: 15_000 });

    await view.locator('.board-summary-moved .js-open-summary-card').click();
    await expect(boardPage).toHaveURL(new RegExp(alpha._id));
  });

  test('Admin Panel / Visibility / Features hides the entry and the answer (negative)', async ({ boardPage, board }) => {
    const setting = db.findOne('settings', {});
    const states = { ...(setting.featureStates || {}), 'board-summary': false };
    db.updateOne('settings', { _id: setting._id }, { $set: { featureStates: states } });
    try {
      await openBoardMenu(boardPage);
      await expect(boardPage.locator('.pop-over .js-open-original-positions')).toBeVisible();
      await expect(boardPage.locator('.pop-over .js-open-board-summary')).toHaveCount(0);
      const rows = await boardPage.evaluate(id => Meteor.callAsync('boards.summary', id, 'week'), board.boardId);
      expect(rows).toEqual([]);
    } finally {
      db.updateOne('settings', { _id: setting._id }, { $set: { featureStates: { ...states, 'board-summary': true } } });
    }
  });
});
