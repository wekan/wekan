'use strict';
// #6947: a board's own due date colours. A card due in 30 hours is amber with
// WeKan's 48 hours, grey once the board says 24, amber again at 36; Board
// Settings / Date saves the hours, and a value that is no number of hours is
// refused. Not due is grey (rgb 219,219,219), never the old yellow.
const { test, expect } = require('../fixtures');
const db = require('../helpers/db');
const BoardPage = require('../pages/BoardPage');

test('#6947: the due date colour follows the board\'s due-soon hours', async ({ boardPage: page, board }) => {
  const card = db.findOne('cards', { boardId: board.boardId, title: 'Alpha Card' });
  db.updateOne('boards', { _id: board.boardId }, { $set: { allowsDueDate: true, allowsDueDateOnMinicard: true }, $unset: { dueSoonHours: '' } });
  db.updateOne('cards', { _id: card._id }, { $set: { dueAt: new Date(Date.now() + 30 * 3600000) }, $unset: { endAt: '' } });
  await page.reload();
  const due = new BoardPage(page).minicard(board.listIds[0], 'Alpha Card').locator('.due-date').first();
  await expect(due).toHaveClass(/due-soon/);
  db.updateOne('boards', { _id: board.boardId }, { $set: { dueSoonHours: 24 } });
  await expect(due).toHaveClass(/not-due/, { timeout: 15000 });
  await expect(due).not.toHaveClass(/due-soon/);
  // #6947 comment 7205280494: not due is GREY, not the yellow (#ffd700) the
  // due date's type colour used to paint through the empty not-due rule.
  await expect(due).toHaveCSS('background-color', 'rgb(219, 219, 219)');
  db.updateOne('boards', { _id: board.boardId }, { $set: { dueSoonHours: 36 } });
  await expect(due).toHaveClass(/due-soon/, { timeout: 15000 });
  await expect(due).toHaveCSS('background-color', 'rgb(255, 170, 0)'); // amber stays
  db.updateOne('boards', { _id: board.boardId }, { $unset: { dueSoonHours: '' } });
});

test('#6947: Board Settings / Date saves the hours; no number of hours is refused', async ({ boardPage: page, board }) => {
  await new BoardPage(page).openSidebar();
  await page.locator('.js-open-board-menu').click();
  await page.locator('.js-pop-over .content:not(.no-height) .js-open-board-date-settings').click();
  const form = page.locator('.js-pop-over .content:not(.no-height) .js-due-thresholds-form');
  await expect(form.locator('.js-due-soon-hours')).toHaveValue('48');
  await expect(form.locator('.js-overdue-after-hours')).toHaveValue('0');
  await form.locator('.js-due-soon-hours').fill('12');
  await form.locator('.js-overdue-after-hours').fill('2');
  await form.locator('button[type="submit"]').click();
  await expect.poll(() => db.findOne('boards', { _id: board.boardId }).dueSoonHours).toBe(12);
  expect(db.findOne('boards', { _id: board.boardId }).overdueAfterHours).toBe(2);
  // Negative: a negative or a year and more of hours, and a word, change nothing.
  for (const args of [[-5, null], [24 * 367, null], [12, 'soon']]) {
    const refused = await page.evaluate(async ({ id, args }) => {
      try { await Meteor.callAsync('setBoardDueThresholds', id, ...args); return false; } catch (e) { return true; }
    }, { id: board.boardId, args });
    expect(refused, JSON.stringify(args)).toBe(true);
  }
  expect(db.findOne('boards', { _id: board.boardId }).dueSoonHours).toBe(12);
  // An empty field is the default again.
  await form.locator('.js-due-soon-hours').fill('');
  await form.locator('.js-overdue-after-hours').fill('');
  await form.locator('button[type="submit"]').click();
  await expect.poll(() => db.findOne('boards', { _id: board.boardId }).dueSoonHours).toBeUndefined();
  expect(db.findOne('boards', { _id: board.boardId }).overdueAfterHours).toBeUndefined();
});
