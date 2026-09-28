'use strict';
const { test, expect } = require('../fixtures');
const db = require('../helpers/db');
const { openBoard } = require('../helpers/auth');

test('date pickers filter fields without expressions, include missing dates, reject reversed bounds and clear', async ({ loggedInPage: page, board }) => {
  const cards = db.find('cards', { boardId: board.boardId });
  const [older, match, missing] = cards;
  const fields = ['createdAt', 'modifiedAt', 'receivedAt', 'startAt', 'dueAt', 'endAt', 'listEnteredAt'];
  for (const [card, date] of [[older, new Date('2026-08-01T12:00:00Z')], [match, new Date('2026-09-10T12:00:00Z')], [missing, null]]) {
    db.updateOne('cards', { _id: card._id }, { $set: Object.fromEntries(fields.map(field => [field, date])) });
  }
  await openBoard(page, board.boardId, board.slug);
  await page.locator('.js-open-filter-view').click();
  const form = page.locator('.js-card-date-range');
  const visible = page.locator('.board-canvas .js-minicard');
  const expectCards = ids => expect.poll(() => visible.evaluateAll(rows => rows.map(row => row.dataset.cardId).sort())).toEqual([...ids].sort());
  await form.locator('.js-card-date-from').fill('2026-09-10');
  await form.locator('.js-card-date-to').fill('2026-09-10');
  for (const field of fields) {
    await form.locator('select').selectOption(field);
    await form.locator('[type="submit"]').click();
    await expectCards([match._id]);
  }
  await form.locator('.js-card-date-missing').check();
  await form.locator('[type="submit"]').click();
  await expectCards([match._id, missing._id]);
  await form.locator('.js-card-date-to').fill('2026-08-01');
  await form.locator('[type="submit"]').click();
  await expectCards([match._id, missing._id]);
  await expect(form.locator('.js-card-date-to')).toHaveJSProperty('validationMessage', 'Choose valid dates, with the end on or after the start.');
  await form.locator('.js-clear-date-range').click();
  await expectCards(cards.map(card => card._id));
  await expect(form.locator('.js-card-date-to')).toHaveJSProperty('validationMessage', '');
  await form.locator('select').selectOption('createdAt');
  await form.locator('.js-card-date-to').fill('2026-08-01');
  await form.locator('[type="submit"]').click();
  await expectCards([older._id]);
  // Close/reopen retains picker values, matching the active filter.
  await page.locator('.js-open-filter-view').click();
  await page.locator('.js-open-filter-view').click();
  await expect(form.locator('.js-card-date-to')).toHaveValue('2026-08-01');
  for (const card of cards) expect(db.findOne('cards', { _id: card._id }).archived).toBe(false);
});
