const { test, expect } = require('../fixtures');
const db = require('../helpers/db');

test('English Frappe Gantt stays responsive and permits switching views', async ({ boardPage, board, user }) => {
  db.updateOne('users', { _id: user.id }, { $set: { 'profile.language': 'en' } });
  db.updateOne('cards', { boardId: board.boardId, title: 'Alpha Card' }, { $set: {
    startAt: new Date('2026-09-14T12:00:00Z'), dueAt: new Date('2026-09-16T12:00:00Z'),
  } });
  await boardPage.reload();
  await boardPage.locator('.js-toggle-board-view').first().click();
  await boardPage.locator('.pop-over .js-open-gantt-frappe-view').click();
  await expect(boardPage.locator('.js-frappe-gantt-container svg')).toBeVisible();
  await boardPage.locator('.js-toggle-board-view').first().click();
  await boardPage.locator('.pop-over .js-open-swimlanes-view').click();
  await expect(boardPage.locator('.js-frappe-gantt-container')).toHaveCount(0);
  await expect(boardPage.getByText('Alpha Card', { exact: true }).first()).toBeVisible();
});
