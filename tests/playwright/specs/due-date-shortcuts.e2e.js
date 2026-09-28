'use strict';
const { test, expect } = require('../fixtures');
const db = require('../helpers/db');
const { openBoard } = require('../helpers/auth');

test('previous-week and next-month due shortcuts select calendar boundaries, switch and clear with the unrestricted radio', async ({ loggedInPage: page, board, user }) => {
  db.updateOne('users', { _id: user.id }, { $set: { 'profile.startDayOfWeek': 0 } });
  const bounds = await page.evaluate(() => {
    const at = new Date();
    const weekEnd = new Date(at); weekEnd.setHours(0, 0, 0, 0); weekEnd.setDate(weekEnd.getDate() - weekEnd.getDay());
    const weekStart = new Date(weekEnd); weekStart.setDate(weekStart.getDate() - 7);
    const monthStart = new Date(at.getFullYear(), at.getMonth() + 1, 1);
    const monthEnd = new Date(at.getFullYear(), at.getMonth() + 2, 1);
    return { weekStart: +weekStart, weekEnd: +weekEnd, monthStart: +monthStart, monthEnd: +monthEnd };
  });
  const cards = db.find('cards', { boardId: board.boardId });
  const [week, month, missing] = cards;
  db.updateOne('cards', { _id: week._id }, { $set: { dueAt: new Date(bounds.weekStart) } });
  db.updateOne('cards', { _id: month._id }, { $set: { dueAt: new Date(bounds.monthStart) } });
  db.updateOne('cards', { _id: missing._id }, { $set: { dueAt: null } });
  await openBoard(page, board.boardId, board.slug);
  await page.locator('.js-open-filter-view').click();
  const expectCards = ids => expect.poll(() => page.locator('.board-canvas .js-minicard')
    .evaluateAll(rows => rows.map(row => row.dataset.cardId).sort())).toEqual([...ids].sort());
  await page.locator('.js-toggle-due-previous-week-filter').click();
  await expectCards([week._id]);
  await page.locator('.js-toggle-due-next-month-filter').click();
  await expectCards([month._id]);
  db.updateOne('cards', { _id: month._id }, { $set: { dueAt: new Date(bounds.monthEnd) } });
  await expectCards([]);
  await page.locator('.js-toggle-due-previous-week-filter').click();
  await expectCards([week._id]);
  db.updateOne('cards', { _id: week._id }, { $set: { dueAt: new Date(bounds.weekEnd) } });
  await expectCards([]);
  await page.locator('.js-due-unrestricted').check();
  await expectCards(cards.map(card => card._id));
  for (const card of cards) expect(db.findOne('cards', { _id: card._id }).archived).toBe(false);
});
